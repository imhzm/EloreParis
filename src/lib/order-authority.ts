import "server-only";

import { readFile } from "node:fs/promises";
import type { NextRequest } from "next/server";
import {
  getAuthorityDatabase,
  getAuthorityMetaValue,
  getAuthorityTableCount,
  runAuthorityTransaction,
  setAuthorityMetaValue,
} from "@/lib/authority-database";
import {
  resolveCartLines,
  sanitizeCartItems,
  type StoredCartItem,
} from "@/lib/cart";
import {
  type CheckoutSubmissionInput,
  validateCheckoutSubmission,
} from "@/lib/checkout-validation";
import { getCheckoutRules } from "@/lib/fulfillment";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import { syncNotificationQueueForOrders } from "@/lib/notification-authority";
import {
  createStoredOrder,
  getNextOrderStatus,
  getPhoneLastFour,
  sanitizeStoredOrders,
  type StoredOrder,
} from "@/lib/orders";
import { resolveProjectPath } from "@/lib/runtime-paths";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";

export const RECENT_ORDER_COOKIE = "cozmateks-recent-order";
export const RECENT_ORDER_MAX_AGE_SECONDS = 60 * 60 * 6;

const ORDERS_LEGACY_IMPORT_META_KEY = "legacy_orders_import_v2";
let authorityOrdersReadyPromise: Promise<void> | null = null;

type RecentOrderPayload = {
  scope: "recent_order";
  orderNumber: string;
  exp: number;
};

type CreateAuthorityOrderInput = {
  items: StoredCartItem[];
  checkout: CheckoutSubmissionInput;
};

export class OrderAuthorityError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "OrderAuthorityError";
    this.statusCode = statusCode;
  }
}

function getOrderAuthorityFilePath() {
  const configuredPath = process.env.ORDER_AUTHORITY_FILE?.trim();
  const relativePath =
    configuredPath && configuredPath.length > 0
      ? configuredPath
      : ".data/orders.json";

  return resolveProjectPath(relativePath);
}

function getOrderAuthoritySecret() {
  return (
    process.env.ORDER_AUTHORITY_SECRET?.trim() ||
    process.env.OPS_ACCESS_CODE?.trim() ||
    "development-order-authority"
  );
}

function isRecentOrderPayload(value: unknown): value is RecentOrderPayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "orderNumber" in value &&
    "exp" in value &&
    value.scope === "recent_order" &&
    typeof value.orderNumber === "string" &&
    typeof value.exp === "number"
  );
}

function parseStoredOrderPayload(payloadJson: string) {
  const parsedValue = JSON.parse(payloadJson) as unknown;
  const orders = sanitizeStoredOrders([parsedValue]);
  return orders[0] ?? null;
}

function upsertAuthorityOrder(order: StoredOrder) {
  getAuthorityDatabase()
    .prepare(`
      INSERT INTO authority_orders (
        order_number,
        phone_last_four,
        status,
        created_at,
        updated_at,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(order_number) DO UPDATE SET
        phone_last_four = excluded.phone_last_four,
        status = excluded.status,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        payload_json = excluded.payload_json
    `)
    .run(
      order.orderNumber,
      getPhoneLastFour(order.customer.phone),
      order.status,
      order.createdAt,
      new Date().toISOString(),
      JSON.stringify(order),
    );
}

function readPersistedOrder(orderNumber: string, phoneLastFour?: string) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();

  if (!normalizedOrderNumber) {
    return null;
  }

  const normalizedPhoneLastFour = phoneLastFour?.replace(/\D/g, "").slice(-4);
  const row = normalizedPhoneLastFour
    ? (getAuthorityDatabase()
        .prepare(`
          SELECT payload_json
          FROM authority_orders
          WHERE order_number = ?
            AND phone_last_four = ?
          LIMIT 1
        `)
        .get(normalizedOrderNumber, normalizedPhoneLastFour) as
        | { payload_json: string }
        | undefined)
    : (getAuthorityDatabase()
        .prepare(`
          SELECT payload_json
          FROM authority_orders
          WHERE order_number = ?
          LIMIT 1
        `)
        .get(normalizedOrderNumber) as { payload_json: string } | undefined);

  if (!row) {
    return null;
  }

  try {
    return parseStoredOrderPayload(row.payload_json);
  } catch {
    throw new OrderAuthorityError(
      "تعذر قراءة الطلب المطلوب من طبقة التخزين الحالية.",
      500,
    );
  }
}

function readPersistedOrders() {
  const rows = getAuthorityDatabase()
    .prepare(`
      SELECT payload_json
      FROM authority_orders
      ORDER BY created_at DESC
    `)
    .all() as { payload_json: string }[];

  try {
    return rows
      .map((row) => parseStoredOrderPayload(row.payload_json))
      .filter((order): order is StoredOrder => order !== null);
  } catch {
    throw new OrderAuthorityError(
      "تعذر قراءة طبقة الطلبات الحالية من authority التطبيق.",
      500,
    );
  }
}

async function importLegacyOrdersIfNeeded() {
  if (getAuthorityMetaValue(ORDERS_LEGACY_IMPORT_META_KEY) === "1") {
    return;
  }

  if (getAuthorityTableCount("orders") > 0) {
    setAuthorityMetaValue(ORDERS_LEGACY_IMPORT_META_KEY, "1");
    return;
  }

  try {
    const rawValue = await readFile(getOrderAuthorityFilePath(), "utf8");
    const parsedValue = JSON.parse(rawValue) as unknown;
    const orders = sanitizeStoredOrders(parsedValue);

    if (orders.length > 0) {
      runAuthorityTransaction(() => {
        for (const order of orders) {
          upsertAuthorityOrder(order);
        }
      });
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      setAuthorityMetaValue(ORDERS_LEGACY_IMPORT_META_KEY, "1");
      return;
    }

    throw new OrderAuthorityError(
      "تعذر استيراد بيانات الطلبات القديمة إلى authority الجديدة.",
      500,
    );
  }

  setAuthorityMetaValue(ORDERS_LEGACY_IMPORT_META_KEY, "1");
}

async function ensureAuthorityOrdersReady() {
  if (!authorityOrdersReadyPromise) {
    authorityOrdersReadyPromise = importLegacyOrdersIfNeeded();
  }

  await authorityOrdersReadyPromise;
}

export async function readAuthorityOrders() {
  await ensureAuthorityOrdersReady();
  return readPersistedOrders();
}

export async function createAuthorityOrder({
  items,
  checkout,
}: CreateAuthorityOrderInput) {
  await ensureAuthorityOrdersReady();
  const sanitizedItems = sanitizeCartItems(items);
  const lines = resolveCartLines(sanitizedItems);

  if (lines.length === 0) {
    throw new OrderAuthorityError(
      "لا يمكن إنشاء طلب جديد من سلة فارغة أو عناصر غير صالحة.",
      400,
    );
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const checkoutRules = getCheckoutRules(lines, checkout.city, subtotal);
  const validationError = validateCheckoutSubmission(checkout, checkoutRules);

  if (validationError) {
    throw new OrderAuthorityError(validationError, 400);
  }

  const order = createStoredOrder({
    lines,
    customer: {
      fullName: checkout.fullName,
      phone: checkout.phone,
      email: checkout.email,
      city: checkout.city,
      district: checkout.district,
      addressLine: checkout.addressLine,
      notes: checkout.notes,
    },
    shippingMethodId: checkout.shippingMethodId,
    paymentMethodId: checkout.paymentMethodId,
    allowOperationalUpdates: checkout.acceptUpdates,
  });

  runAuthorityTransaction(() => {
    upsertAuthorityOrder(order);
  });

  await syncNotificationQueueForOrders([order]);

  const recentOrderToken = await createSignedToken(
    {
      scope: "recent_order",
      orderNumber: order.orderNumber,
      exp: Date.now() + RECENT_ORDER_MAX_AGE_SECONDS * 1000,
    } satisfies RecentOrderPayload,
    getOrderAuthoritySecret(),
  );

  return {
    order,
    recentOrderToken,
  };
}

export async function getAuthorityOrderForTracking(
  orderNumber: string,
  phoneLastFour: string,
) {
  await ensureAuthorityOrdersReady();
  return readPersistedOrder(orderNumber, phoneLastFour);
}

export async function getAuthorityOrderForRecentAccess(
  orderNumber: string,
  recentOrderToken: string | undefined,
) {
  if (!recentOrderToken) {
    return null;
  }

  const payload = await verifySignedToken(
    recentOrderToken,
    getOrderAuthoritySecret(),
    isRecentOrderPayload,
  );

  if (!payload || payload.orderNumber !== orderNumber.trim().toUpperCase()) {
    return null;
  }

  await ensureAuthorityOrdersReady();
  return readPersistedOrder(orderNumber);
}

export async function listAuthorityOrders() {
  return readAuthorityOrders();
}

export async function advanceAuthorityOrderStatus(orderNumber: string) {
  await ensureAuthorityOrdersReady();
  const order = readPersistedOrder(orderNumber);

  if (!order) {
    throw new OrderAuthorityError(
      "الطلب المطلوب غير موجود داخل authority الحالية.",
      404,
    );
  }

  const nextStatus = getNextOrderStatus(order);

  if (!nextStatus) {
    throw new OrderAuthorityError(
      "هذا الطلب وصل بالفعل إلى آخر حالة متاحة.",
      409,
    );
  }

  const updatedOrder: StoredOrder = {
    ...order,
    status: nextStatus,
  };

  runAuthorityTransaction(() => {
    upsertAuthorityOrder(updatedOrder);
  });

  await syncNotificationQueueForOrders([updatedOrder]);

  return {
    order: updatedOrder,
    previousStatus: order.status,
    nextStatus,
  };
}

export async function assertOpsApiAccess(request: NextRequest) {
  try {
    return await assertOpsRequestAccess(request, "/api/ops/orders");
  } catch (error) {
    if (error instanceof OpsAccessError) {
      throw new OrderAuthorityError(error.message, error.statusCode);
    }

    throw error;
  }
}
