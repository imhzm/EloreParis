import "server-only";

import { createHash, randomUUID } from "node:crypto";
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
  buildExternalAuthProviderAuthorizeUrl,
  bookShipmentWithProvider,
  createPaymentLinkWithProvider,
} from "@/lib/provider-gateway";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import { syncAndDeliverNotificationsForOrders } from "@/lib/notification-dispatch";
import {
  createStoredOrder,
  type OrderProviderBindingAction,
  getNextOrderStatus,
  getPhoneLastFour,
  sanitizeStoredOrders,
  type StoredOrder,
} from "@/lib/orders";
import {
  getExternalAuthProviderConfig,
} from "@/lib/live-provider-config";
import {
  getAuthProviderRuntimeConfig,
  getPaymentProviderRuntimeConfig,
  getShippingProviderRuntimeConfig,
} from "@/lib/provider-runtime-config";
import { resolveProjectPath } from "@/lib/runtime-paths";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";

export const RECENT_ORDER_COOKIE = "cozmateks-recent-order";
export const RECENT_ORDER_MAX_AGE_SECONDS = 60 * 60 * 6;
export const ORDER_ACCESS_COOKIE = "cozmateks-order-access";
export const ORDER_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
export const CUSTOMER_ACCESS_COOKIE = "cozmateks-customer-access";
export const CUSTOMER_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const CUSTOMER_ACCOUNT_COOKIE = "cozmateks-customer-account";
export const CUSTOMER_ACCOUNT_MAX_AGE_SECONDS = 60 * 60 * 24 * 45;
export const CUSTOMER_ACCESS_HANDOFF_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const CUSTOMER_PROVIDER_AUTH_HANDOFF_MAX_AGE_SECONDS = 60 * 15;

const ORDERS_LEGACY_IMPORT_META_KEY = "legacy_orders_import_v2";
let authorityOrdersReadyPromise: Promise<void> | null = null;

type RecentOrderPayload = {
  scope: "recent_order";
  orderNumber: string;
  exp: number;
};

type OrderAccessPayload = {
  scope: "order_access";
  orderNumber: string;
  exp: number;
};

type CustomerAccessPayload = {
  scope: "customer_access";
  customerKey: string;
  exp: number;
};

type CustomerAccountPayload = {
  scope: "customer_account";
  customerKey: string;
  providerLabel: string;
  exp: number;
};

type CustomerAccessHandoffPayload = {
  scope: "customer_access_handoff";
  customerKey: string;
  orderNumber: string;
  exp: number;
};

type CustomerProviderAuthHandoffPayload = {
  scope: "customer_provider_auth_handoff";
  customerKey: string;
  orderNumber: string;
  exp: number;
};

type CustomerProviderAuthStatePayload = {
  scope: "customer_provider_auth_state";
  customerKey: string;
  orderNumber: string;
  returnTo: string;
  exp: number;
};

type CreateAuthorityOrderInput = {
  items: StoredCartItem[];
  checkout: CheckoutSubmissionInput;
};

type OrderProviderBindingMetadata = {
  occurredAt?: string;
  paymentReferenceId?: string;
  paymentUrl?: string;
  settlementReference?: string;
  paymentEventId?: string;
  shippingBookingReference?: string;
  shippingTrackingNumber?: string;
  shippingEventId?: string;
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

function getCustomerAuthProviderSecret() {
  return getAuthProviderRuntimeConfig().callbackSecret;
}

function buildProviderReference(prefix: string) {
  return `${prefix}-${randomUUID().split("-")[0].toUpperCase()}`;
}

function normalizeCustomerEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCustomerPhone(phone: string) {
  return phone.replace(/\D/g, "").trim();
}

export function buildAuthorityCustomerAccessKeyFromIdentity(
  email: string,
  phone: string,
) {
  return createHash("sha256")
    .update(
      [
        normalizeCustomerPhone(phone),
        normalizeCustomerEmail(email),
        getOrderAuthoritySecret(),
      ].join("|"),
    )
    .digest("hex");
}

function buildCustomerAccessKey(order: StoredOrder) {
  return buildAuthorityCustomerAccessKeyFromIdentity(
    order.customer.email,
    order.customer.phone,
  );
}

function normalizeProviderReference(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

function normalizeProviderUrl(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

function resolveProviderOccurredAt(value: string | undefined, fallbackValue: string) {
  if (!value) {
    return fallbackValue;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? fallbackValue : new Date(timestamp).toISOString();
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

function isOrderAccessPayload(value: unknown): value is OrderAccessPayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "orderNumber" in value &&
    "exp" in value &&
    value.scope === "order_access" &&
    typeof value.orderNumber === "string" &&
    typeof value.exp === "number"
  );
}

function isCustomerAccessPayload(value: unknown): value is CustomerAccessPayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "customerKey" in value &&
    "exp" in value &&
    value.scope === "customer_access" &&
    typeof value.customerKey === "string" &&
    typeof value.exp === "number"
  );
}

function isCustomerAccountPayload(value: unknown): value is CustomerAccountPayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "customerKey" in value &&
    "providerLabel" in value &&
    "exp" in value &&
    value.scope === "customer_account" &&
    typeof value.customerKey === "string" &&
    typeof value.providerLabel === "string" &&
    typeof value.exp === "number"
  );
}

function isCustomerAccessHandoffPayload(
  value: unknown,
): value is CustomerAccessHandoffPayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "customerKey" in value &&
    "orderNumber" in value &&
    "exp" in value &&
    value.scope === "customer_access_handoff" &&
    typeof value.customerKey === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.exp === "number"
  );
}

function isCustomerProviderAuthHandoffPayload(
  value: unknown,
): value is CustomerProviderAuthHandoffPayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "customerKey" in value &&
    "orderNumber" in value &&
    "exp" in value &&
    value.scope === "customer_provider_auth_handoff" &&
    typeof value.customerKey === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.exp === "number"
  );
}

function isCustomerProviderAuthStatePayload(
  value: unknown,
): value is CustomerProviderAuthStatePayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "customerKey" in value &&
    "orderNumber" in value &&
    "returnTo" in value &&
    "exp" in value &&
    value.scope === "customer_provider_auth_state" &&
    typeof value.customerKey === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.returnTo === "string" &&
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

  let order = createStoredOrder({
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
    providerLabels: {
      paymentProviderLabel: getPaymentProviderRuntimeConfig().label,
      shippingProviderLabel: getShippingProviderRuntimeConfig().label,
    },
  });

  if (order.paymentMethodId === "payment_link") {
    const paymentProvider = assertPaymentProviderBindingReady();
    const paymentHandoff = await createPaymentLinkWithProvider(order);
    const paymentOccurredAt = new Date().toISOString();

    order = {
      ...order,
      providerBindings: {
        ...order.providerBindings,
        payment: {
          ...order.providerBindings.payment,
          state: "link_sent",
          providerLabel: paymentProvider.label,
          referenceId: paymentHandoff.paymentReferenceId,
          paymentUrl: paymentHandoff.paymentUrl ?? null,
          settlementReference: paymentHandoff.settlementReference ?? null,
          settlementEventId: paymentHandoff.providerEventId ?? null,
          updatedAt: paymentOccurredAt,
          linkSentAt: paymentOccurredAt,
        },
      },
    };
  }

  runAuthorityTransaction(() => {
    upsertAuthorityOrder(order);
  });

  await syncAndDeliverNotificationsForOrders([order]);

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

export async function createAuthorityOrderAccessToken(orderNumber: string) {
  return createSignedToken(
    {
      scope: "order_access",
      orderNumber: orderNumber.trim().toUpperCase(),
      exp: Date.now() + ORDER_ACCESS_MAX_AGE_SECONDS * 1000,
    } satisfies OrderAccessPayload,
    getOrderAuthoritySecret(),
  );
}

async function getAuthorityOrdersForCustomerKey(customerKey: string) {
  await ensureAuthorityOrdersReady();

  return readPersistedOrders().filter(
    (order) => buildCustomerAccessKey(order) === customerKey,
  );
}

export async function doesAuthorityCustomerIdentityMatch(
  customerKey: string,
  identity: {
    email?: string | null;
    phone?: string | null;
  },
) {
  const normalizedEmail = identity.email
    ? normalizeCustomerEmail(identity.email)
    : "";
  const normalizedPhone = identity.phone
    ? normalizeCustomerPhone(identity.phone)
    : "";

  if (!normalizedEmail && !normalizedPhone) {
    return false;
  }

  const orders = await getAuthorityOrdersForCustomerKey(customerKey);

  return orders.some((order) => {
    const emailMatches =
      normalizedEmail.length > 0 &&
      normalizeCustomerEmail(order.customer.email) === normalizedEmail;
    const phoneMatches =
      normalizedPhone.length > 0 &&
      normalizeCustomerPhone(order.customer.phone) === normalizedPhone;

    return emailMatches || phoneMatches;
  });
}

async function createAuthorityCustomerAccessTokenForCustomerKey(
  customerKey: string,
) {
  return createSignedToken(
    {
      scope: "customer_access",
      customerKey,
      exp: Date.now() + CUSTOMER_ACCESS_MAX_AGE_SECONDS * 1000,
    } satisfies CustomerAccessPayload,
    getOrderAuthoritySecret(),
  );
}

export async function createAuthorityCustomerAccessToken(order: StoredOrder) {
  return createAuthorityCustomerAccessTokenForCustomerKey(
    buildCustomerAccessKey(order),
  );
}

async function createAuthorityCustomerAccountTokenForCustomerKey(
  customerKey: string,
) {
  const authProvider = getAuthProviderRuntimeConfig();

  return createSignedToken(
    {
      scope: "customer_account",
      customerKey,
      providerLabel: authProvider.label,
      exp: Date.now() + CUSTOMER_ACCOUNT_MAX_AGE_SECONDS * 1000,
    } satisfies CustomerAccountPayload,
    getCustomerAuthProviderSecret(),
  );
}

export async function createAuthorityCustomerProviderSession(
  customerKey: string,
  orderNumber: string,
) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const orders = await getAuthorityOrdersForCustomerKey(customerKey);

  if (!orders.some((order) => order.orderNumber === normalizedOrderNumber)) {
    return null;
  }

  return {
    customerAccountToken: await createAuthorityCustomerAccountTokenForCustomerKey(
      customerKey,
    ),
    customerAccessToken: await createAuthorityCustomerAccessTokenForCustomerKey(
      customerKey,
    ),
    orderAccessToken: await createAuthorityOrderAccessToken(normalizedOrderNumber),
  };
}

export async function createAuthorityCustomerAccessHandoffToken(
  order: StoredOrder,
) {
  return createSignedToken(
    {
      scope: "customer_access_handoff",
      customerKey: buildCustomerAccessKey(order),
      orderNumber: order.orderNumber,
      exp: Date.now() + CUSTOMER_ACCESS_HANDOFF_MAX_AGE_SECONDS * 1000,
    } satisfies CustomerAccessHandoffPayload,
    getOrderAuthoritySecret(),
  );
}

export async function createAuthorityCustomerAccessHandoffPath(
  order: StoredOrder,
) {
  const handoffToken = await createAuthorityCustomerAccessHandoffToken(order);
  const params = new URLSearchParams({
    token: handoffToken,
  });

  return `/account/access?${params.toString()}`;
}

export async function createAuthorityCustomerProviderAuthHandoffPath(
  customerKey: string,
  orderNumber: string,
) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const externalAuthProvider = getExternalAuthProviderConfig();

  if (externalAuthProvider.externalAuthConfigured) {
    const stateToken = await createSignedToken(
      {
        scope: "customer_provider_auth_state",
        customerKey,
        orderNumber: normalizedOrderNumber,
        returnTo: "/account/orders",
        exp: Date.now() + CUSTOMER_PROVIDER_AUTH_HANDOFF_MAX_AGE_SECONDS * 1000,
      } satisfies CustomerProviderAuthStatePayload,
      getCustomerAuthProviderSecret(),
    );

    return buildExternalAuthProviderAuthorizeUrl(stateToken);
  }

  const authProvider = getAuthProviderRuntimeConfig();
  const handoffToken = await createSignedToken(
    {
      scope: "customer_provider_auth_handoff",
      customerKey,
      orderNumber: normalizedOrderNumber,
      exp: Date.now() + CUSTOMER_PROVIDER_AUTH_HANDOFF_MAX_AGE_SECONDS * 1000,
    } satisfies CustomerProviderAuthHandoffPayload,
    getCustomerAuthProviderSecret(),
  );
  const params = new URLSearchParams({
    token: handoffToken,
    returnTo: "/account/orders",
  });

  return `${authProvider.callbackPath}?${params.toString()}`;
}

export async function getAuthorityOrderForAccessCookie(
  orderNumber: string,
  orderAccessToken: string | undefined,
) {
  if (!orderAccessToken) {
    return null;
  }

  const payload = await verifySignedToken(
    orderAccessToken,
    getOrderAuthoritySecret(),
    isOrderAccessPayload,
  );

  if (!payload || payload.orderNumber !== orderNumber.trim().toUpperCase()) {
    return null;
  }

  await ensureAuthorityOrdersReady();
  return readPersistedOrder(orderNumber);
}

export async function getAuthorityOrdersForCustomerAccessCookie(
  customerAccessToken: string | undefined,
) {
  if (!customerAccessToken) {
    return [] as StoredOrder[];
  }

  const payload = await verifySignedToken(
    customerAccessToken,
    getOrderAuthoritySecret(),
    isCustomerAccessPayload,
  );

  if (!payload) {
    return [] as StoredOrder[];
  }

  return getAuthorityOrdersForCustomerKey(payload.customerKey);
}

export async function getAuthorityOrdersForCustomerAccountCookie(
  customerAccountToken: string | undefined,
) {
  if (!customerAccountToken) {
    return [] as StoredOrder[];
  }

  const payload = await verifySignedToken(
    customerAccountToken,
    getCustomerAuthProviderSecret(),
    isCustomerAccountPayload,
  );

  if (!payload) {
    return [] as StoredOrder[];
  }

  return getAuthorityOrdersForCustomerKey(payload.customerKey);
}

export async function getAuthorityOrderForCustomerAccessCookie(
  orderNumber: string,
  customerAccessToken: string | undefined,
) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const orders = await getAuthorityOrdersForCustomerAccessCookie(
    customerAccessToken,
  );

  return (
    orders.find((order) => order.orderNumber === normalizedOrderNumber) ?? null
  );
}

export async function exchangeAuthorityCustomerAccessHandoffToken(
  handoffToken: string | undefined,
) {
  if (!handoffToken) {
    return null;
  }

  const payload = await verifySignedToken(
    handoffToken,
    getOrderAuthoritySecret(),
    isCustomerAccessHandoffPayload,
  );

  if (!payload) {
    return null;
  }

  const orders = await getAuthorityOrdersForCustomerKey(payload.customerKey);

  if (!orders.some((order) => order.orderNumber === payload.orderNumber)) {
    return null;
  }

  return {
    customerKey: payload.customerKey,
    orderNumber: payload.orderNumber,
  };
}

export async function exchangeAuthorityCustomerProviderAuthHandoffToken(
  handoffToken: string | undefined,
) {
  if (!handoffToken) {
    return null;
  }

  const payload = await verifySignedToken(
    handoffToken,
    getCustomerAuthProviderSecret(),
    isCustomerProviderAuthHandoffPayload,
  );

  if (!payload) {
    return null;
  }

  const orders = await getAuthorityOrdersForCustomerKey(payload.customerKey);

  if (!orders.some((order) => order.orderNumber === payload.orderNumber)) {
    return null;
  }

  return createAuthorityCustomerProviderSession(
    payload.customerKey,
    payload.orderNumber,
  );
}

export async function exchangeAuthorityCustomerProviderAuthStateToken(
  stateToken: string | undefined,
) {
  if (!stateToken) {
    return null;
  }

  return verifySignedToken(
    stateToken,
    getCustomerAuthProviderSecret(),
    isCustomerProviderAuthStatePayload,
  );
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

  if (
    order.status === "payment_pending" &&
    order.paymentMethodId === "payment_link" &&
    order.providerBindings.payment.state !== "confirmed"
  ) {
    throw new OrderAuthorityError(
      "لا يمكن دفع الطلب إلى حالة التأكيد قبل وصول تأكيد الدفع داخل provider binding الحالية.",
      409,
    );
  }

  if (
    nextStatus === "out_for_delivery" &&
    order.providerBindings.shipping.state !== "in_transit"
  ) {
    throw new OrderAuthorityError(
      "لا يمكن نقل الطلب إلى خرج للتوصيل قبل تسجيل callback الشحن أو tracking الفعلي داخل binding الحالية.",
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

  await syncAndDeliverNotificationsForOrders([updatedOrder]);

  return {
    order: updatedOrder,
    previousStatus: order.status,
    nextStatus,
  };
}

export async function initiateAuthorityPaymentLink(orderNumber: string) {
  await ensureAuthorityOrdersReady();
  assertPaymentProviderBindingReady();
  const order = readPersistedOrder(orderNumber);

  if (!order) {
    throw new OrderAuthorityError(
      "Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø®Ù„ authority Ø§Ù„Ø­Ø§Ù„ÙŠØ©.",
      404,
    );
  }

  if (order.paymentMethodId !== "payment_link") {
    throw new OrderAuthorityError(
      "Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø§ ÙŠØ­ØªØ§Ø¬ payment-link handoff.",
      409,
    );
  }

  const paymentHandoff = await createPaymentLinkWithProvider(order);

  return updateAuthorityOrderProviderBinding(order.orderNumber, "payment_link_sent", {
    paymentReferenceId: paymentHandoff.paymentReferenceId,
    paymentUrl: paymentHandoff.paymentUrl ?? undefined,
    settlementReference: paymentHandoff.settlementReference ?? undefined,
    paymentEventId: paymentHandoff.providerEventId ?? undefined,
  });
}

export async function initiateAuthorityShipmentBooking(orderNumber: string) {
  await ensureAuthorityOrdersReady();
  assertShippingProviderBindingReady();
  const order = readPersistedOrder(orderNumber);

  if (!order) {
    throw new OrderAuthorityError(
      "Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø®Ù„ authority Ø§Ù„Ø­Ø§Ù„ÙŠØ©.",
      404,
    );
  }

  const shipmentBooking = await bookShipmentWithProvider(order);

  return updateAuthorityOrderProviderBinding(order.orderNumber, "shipping_booked", {
    shippingBookingReference: shipmentBooking.bookingReference,
    shippingTrackingNumber: shipmentBooking.trackingNumber ?? undefined,
    shippingEventId: shipmentBooking.providerEventId ?? undefined,
  });
}

function assertPaymentProviderBindingReady() {
  const paymentProvider = getPaymentProviderRuntimeConfig();

  if (!paymentProvider.callbackConfigured) {
    throw new OrderAuthorityError(
      "ربط callback الدفع غير مفعّل في هذه البيئة بعد، لذلك لا يمكن تسجيل handoff دفع حقيقية.",
      409,
    );
  }

  return paymentProvider;
}

function assertShippingProviderBindingReady() {
  const shippingProvider = getShippingProviderRuntimeConfig();

  if (!shippingProvider.callbackConfigured) {
    throw new OrderAuthorityError(
      "ربط callback الشحن غير مفعّل في هذه البيئة بعد، لذلك لا يمكن تسجيل handoff شحن حقيقية.",
      409,
    );
  }

  return shippingProvider;
}

export async function updateAuthorityOrderProviderBinding(
  orderNumber: string,
  action: OrderProviderBindingAction,
  metadata: OrderProviderBindingMetadata = {},
) {
  await ensureAuthorityOrdersReady();
  const order = readPersistedOrder(orderNumber);

  if (!order) {
    throw new OrderAuthorityError(
      "الطلب المطلوب غير موجود داخل authority الحالية.",
      404,
    );
  }

  const now = new Date().toISOString();
  const occurredAt = resolveProviderOccurredAt(metadata.occurredAt, now);
  const paymentReferenceId = normalizeProviderReference(metadata.paymentReferenceId);
  const paymentUrl = normalizeProviderUrl(metadata.paymentUrl);
  const settlementReference = normalizeProviderReference(metadata.settlementReference);
  const paymentEventId = normalizeProviderReference(metadata.paymentEventId);
  const shippingBookingReference = normalizeProviderReference(
    metadata.shippingBookingReference,
  );
  const shippingTrackingNumber = normalizeProviderReference(
    metadata.shippingTrackingNumber,
  );
  const shippingEventId = normalizeProviderReference(metadata.shippingEventId);
  let updatedOrder = order;

  switch (action) {
    case "payment_link_sent": {
      const paymentProvider = assertPaymentProviderBindingReady();

      if (order.paymentMethodId !== "payment_link") {
        throw new OrderAuthorityError(
          "هذا الطلب لا يستخدم payment-link handoff.",
          409,
        );
      }

      if (order.providerBindings.payment.state === "confirmed") {
        throw new OrderAuthorityError(
          "تم تأكيد الدفع بالفعل لهذا الطلب.",
          409,
        );
      }

      if (
        paymentReferenceId &&
        order.providerBindings.payment.referenceId &&
        paymentReferenceId !== order.providerBindings.payment.referenceId
      ) {
        throw new OrderAuthorityError(
          "مرجع الدفع المرسل لا يطابق payment binding الحالية لهذا الطلب.",
          409,
        );
      }

      if (
        settlementReference &&
        order.providerBindings.payment.settlementReference &&
        settlementReference !== order.providerBindings.payment.settlementReference
      ) {
        throw new OrderAuthorityError(
          "مرجع التسوية القادم من callback لا يطابق settlement binding الحالية لهذا الطلب.",
          409,
        );
      }

      updatedOrder = {
        ...order,
        providerBindings: {
          ...order.providerBindings,
          payment: {
            ...order.providerBindings.payment,
            state: "link_sent",
            providerLabel: paymentProvider.label,
            referenceId:
              order.providerBindings.payment.referenceId ??
              paymentReferenceId ??
              buildProviderReference("PAY"),
            paymentUrl:
              order.providerBindings.payment.paymentUrl ?? paymentUrl,
            updatedAt: now,
            linkSentAt: order.providerBindings.payment.linkSentAt ?? occurredAt,
          },
        },
      };
      break;
    }
    case "payment_confirmed": {
      const paymentProvider = assertPaymentProviderBindingReady();

      if (order.paymentMethodId !== "payment_link") {
        throw new OrderAuthorityError(
          "هذا الطلب لا يحتاج callback دفع للتأكيد.",
          409,
        );
      }

      if (
        paymentReferenceId &&
        order.providerBindings.payment.referenceId &&
        paymentReferenceId !== order.providerBindings.payment.referenceId
      ) {
        throw new OrderAuthorityError(
          "مرجع الدفع القادم من callback لا يطابق payment binding الحالية لهذا الطلب.",
          409,
        );
      }

      updatedOrder = {
        ...order,
        status: order.status === "payment_pending" ? "confirmed" : order.status,
        providerBindings: {
          ...order.providerBindings,
          payment: {
            ...order.providerBindings.payment,
            state: "confirmed",
            providerLabel: paymentProvider.label,
            referenceId:
              order.providerBindings.payment.referenceId ??
              paymentReferenceId ??
              buildProviderReference("PAY"),
            paymentUrl: order.providerBindings.payment.paymentUrl,
            settlementReference:
              order.providerBindings.payment.settlementReference ??
              settlementReference ??
              buildProviderReference("SET"),
            settlementEventId:
              paymentEventId ?? order.providerBindings.payment.settlementEventId,
            updatedAt: now,
            linkSentAt: order.providerBindings.payment.linkSentAt ?? occurredAt,
            confirmedAt: occurredAt,
          },
        },
      };
      break;
    }
    case "shipping_booked": {
      const shippingProvider = assertShippingProviderBindingReady();

      if (
        order.status !== "confirmed" &&
        order.status !== "processing" &&
        order.status !== "out_for_delivery"
      ) {
        throw new OrderAuthorityError(
          "يجب تأكيد الطلب أولًا قبل تسجيل حجز الشحنة.",
          409,
        );
      }

      if (
        shippingBookingReference &&
        order.providerBindings.shipping.bookingReference &&
        shippingBookingReference !== order.providerBindings.shipping.bookingReference
      ) {
        throw new OrderAuthorityError(
          "مرجع حجز الشحنة المرسل لا يطابق shipping binding الحالية لهذا الطلب.",
          409,
        );
      }

      if (
        shippingTrackingNumber &&
        order.providerBindings.shipping.trackingNumber &&
        shippingTrackingNumber !== order.providerBindings.shipping.trackingNumber
      ) {
        throw new OrderAuthorityError(
          "رقم التتبع القادم من callback لا يطابق shipping binding الحالية لهذا الطلب.",
          409,
        );
      }

      updatedOrder = {
        ...order,
        providerBindings: {
          ...order.providerBindings,
          shipping: {
            ...order.providerBindings.shipping,
            state: "booked",
            providerLabel: shippingProvider.label,
            bookingReference:
              order.providerBindings.shipping.bookingReference ??
              shippingBookingReference ??
              buildProviderReference("SHP"),
            carrierEventId:
              order.providerBindings.shipping.carrierEventId ?? shippingEventId,
            updatedAt: now,
            bookedAt: order.providerBindings.shipping.bookedAt ?? occurredAt,
          },
        },
      };
      break;
    }
    case "shipping_in_transit": {
      const shippingProvider = assertShippingProviderBindingReady();

      if (order.providerBindings.shipping.state === "pending") {
        throw new OrderAuthorityError(
          "سجّل حجز الشحنة أولًا قبل callback الخروج للتوصيل.",
          409,
        );
      }

      if (
        shippingBookingReference &&
        order.providerBindings.shipping.bookingReference &&
        shippingBookingReference !== order.providerBindings.shipping.bookingReference
      ) {
        throw new OrderAuthorityError(
          "مرجع الحجز القادم من callback لا يطابق shipping binding الحالية لهذا الطلب.",
          409,
        );
      }

      updatedOrder = {
        ...order,
        status: "out_for_delivery",
        providerBindings: {
          ...order.providerBindings,
          shipping: {
            ...order.providerBindings.shipping,
            state: "in_transit",
            providerLabel: shippingProvider.label,
            bookingReference:
              order.providerBindings.shipping.bookingReference ??
              shippingBookingReference ??
              buildProviderReference("SHP"),
            trackingNumber:
              order.providerBindings.shipping.trackingNumber ??
              shippingTrackingNumber ??
              buildProviderReference("TRK"),
            carrierEventId:
              shippingEventId ?? order.providerBindings.shipping.carrierEventId,
            updatedAt: now,
            bookedAt: order.providerBindings.shipping.bookedAt ?? occurredAt,
            inTransitAt: occurredAt,
          },
        },
      };
      break;
    }
  }

  runAuthorityTransaction(() => {
    upsertAuthorityOrder(updatedOrder);
  });

  await syncAndDeliverNotificationsForOrders([updatedOrder]);

  return {
    order: updatedOrder,
    action,
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
