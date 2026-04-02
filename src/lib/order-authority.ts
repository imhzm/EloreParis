import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
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
  getOpsAccessConfig,
  OPS_SESSION_COOKIE,
  verifyOpsSessionToken,
} from "@/lib/ops-access";
import {
  createStoredOrder,
  findStoredOrder,
  getNextOrderStatus,
  sanitizeStoredOrders,
  updateStoredOrderStatus,
  type StoredOrder,
} from "@/lib/orders";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";

export const RECENT_ORDER_COOKIE = "cozmateks-recent-order";
export const RECENT_ORDER_MAX_AGE_SECONDS = 60 * 60 * 6;

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

  return path.resolve(/* turbopackIgnore: true */ process.cwd(), relativePath);
}

function getOrderAuthoritySecret() {
  return (
    process.env.ORDER_AUTHORITY_SECRET?.trim() ||
    process.env.OPS_ACCESS_CODE?.trim() ||
    "development-order-authority"
  );
}

function isRecentOrderPayload(value: unknown): value is RecentOrderPayload {
  return value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "orderNumber" in value &&
    "exp" in value &&
    value.scope === "recent_order" &&
    typeof value.orderNumber === "string" &&
    typeof value.exp === "number";
}

async function writeAuthorityOrders(orders: StoredOrder[]) {
  const filePath = getOrderAuthorityFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(orders, null, 2), "utf8");
}

export async function readAuthorityOrders() {
  const filePath = getOrderAuthorityFilePath();

  try {
    const rawValue = await readFile(filePath, "utf8");
    const parsedValue = JSON.parse(rawValue) as unknown;
    return sanitizeStoredOrders(parsedValue);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [] as StoredOrder[];
    }

    throw new OrderAuthorityError(
      "تعذر قراءة طبقة الطلبات الحالية من authority التطبيق.",
      500,
    );
  }
}

export async function createAuthorityOrder({
  items,
  checkout,
}: CreateAuthorityOrderInput) {
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

  const orders = await readAuthorityOrders();
  await writeAuthorityOrders([order, ...orders]);

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
  const orders = await readAuthorityOrders();
  return findStoredOrder(orders, orderNumber, phoneLastFour);
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

  const orders = await readAuthorityOrders();
  return findStoredOrder(orders, orderNumber);
}

export async function listAuthorityOrders() {
  return readAuthorityOrders();
}

export async function advanceAuthorityOrderStatus(orderNumber: string) {
  const orders = await readAuthorityOrders();
  const order = findStoredOrder(orders, orderNumber);

  if (!order) {
    throw new OrderAuthorityError("الطلب المطلوب غير موجود داخل authority الحالية.", 404);
  }

  const nextStatus = getNextOrderStatus(order);

  if (!nextStatus) {
    throw new OrderAuthorityError("هذا الطلب وصل بالفعل إلى آخر حالة متاحة.", 409);
  }

  const updatedOrders = updateStoredOrderStatus(orders, order.orderNumber, nextStatus);
  await writeAuthorityOrders(updatedOrders);

  const updatedOrder = findStoredOrder(updatedOrders, order.orderNumber);

  if (!updatedOrder) {
    throw new OrderAuthorityError("تعذر إعادة تحميل الطلب بعد تحديث حالته.", 500);
  }

  return {
    order: updatedOrder,
    previousStatus: order.status,
    nextStatus,
  };
}

export async function assertOpsApiAccess(request: NextRequest) {
  const accessConfig = getOpsAccessConfig();

  if (!accessConfig.isProtectionActive) {
    return;
  }

  if (!accessConfig.isConfigured) {
    throw new OrderAuthorityError(
      "OPS access is enabled but OPS_ACCESS_CODE is not configured.",
      503,
    );
  }

  const sessionCookie = request.cookies.get(OPS_SESSION_COOKIE)?.value;

  if (
    sessionCookie &&
    (await verifyOpsSessionToken(sessionCookie, accessConfig.accessCode))
  ) {
    return;
  }

  throw new OrderAuthorityError("Ops access is required for this endpoint.", 401);
}
