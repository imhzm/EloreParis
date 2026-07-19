import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
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
  CatalogQuoteError,
  getCheckoutQuoteForSession,
  type CheckoutQuote,
} from "@/lib/catalog-quote";
import { getActiveCatalogAuthority } from "@/lib/catalog-authority";
import { commitAuthorityInventoryReservations } from "@/lib/inventory-reservation-authority";
import {
  buildExternalAuthProviderAuthorizeUrl,
  bookShipmentWithProvider,
  createPaymentLinkWithProvider,
  ProviderGatewayError,
} from "@/lib/provider-gateway";
import { syncAndDeliverNotificationsForOrders } from "@/lib/notification-dispatch";
import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";
import {
  buildStoredOrderLineCatalogTruth,
  createStoredOrderProviderBindings,
  type OrderProviderBindingAction,
  getNextOrderStatus,
  getPhoneLastFour,
  sanitizeStoredOrders,
  type StoredOrder,
} from "@/lib/orders";
import type { AuthorityCheckoutSubmissionInput } from "@/lib/order-request-validation";
import { redactOrderForCustomerList } from "@/lib/customer-order-view";
import {
  getExternalAuthProviderConfig,
} from "@/lib/live-provider-config";
import {
  PromotionAuthorityError,
  redeemPromotionForOrder,
} from "@/lib/promotion-authority";
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
  issuer?: string;
  subject?: string;
  exp: number;
};

type CustomerAccessHandoffPayload = {
  scope: "customer_access_handoff";
  customerKey: string;
  orderNumber: string;
  exp: number;
};

type CustomerProviderAuthStatePayload = {
  customerKey: string;
  orderNumber: string;
  returnTo: string;
  nonce: string;
  codeVerifier: string;
};

type CreateAuthorityOrderFromQuoteInput = {
  quoteId: string;
  checkoutSessionId: string;
  idempotencyKey: string;
  checkout: AuthorityCheckoutSubmissionInput;
};

export type AuthorityOrderAttemptRecovery =
  | { state: "unknown" }
  | { state: "in_progress" }
  | { state: "completed"; order: StoredOrder; recentOrderToken: string };

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
  code: string;

  constructor(message: string, statusCode = 400, code = "order_rejected") {
    super(message);
    this.name = "OrderAuthorityError";
    this.statusCode = statusCode;
    this.code = code;
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

function buildOrderNumber() {
  return `CZM-${randomBytes(12).toString("hex").toUpperCase()}`;
}

function normalizeCustomerEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCustomerPhone(phone: string) {
  return phone.replace(/\D/g, "").trim();
}

function normalizeProviderIssuer(issuer: string) {
  const normalized = issuer.trim().replace(/\/$/, "");
  try {
    const parsed = new URL(normalized);
    const isLocalDevelopmentIssuer =
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !isLocalDevelopmentIssuer) return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeProviderSubject(subject: string) {
  const normalized = subject.trim();
  return normalized && normalized.length <= 255 && !/[\u0000-\u001f\u007f]/.test(normalized)
    ? normalized
    : null;
}

function hashProviderAuthState(stateToken: string) {
  return createHash("sha256").update(stateToken).digest("hex");
}

function createPkceCodeChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
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
  const configuredBaseUrl = process.env.PAYMENT_PROVIDER_BASE_URL?.trim();
  if (!normalizedValue || !configuredBaseUrl) return null;

  try {
    const allowedBase = new URL(configuredBaseUrl);
    const candidate = new URL(normalizedValue, allowedBase);
    const isLocalDevelopmentUrl =
      candidate.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(candidate.hostname);

    if (
      (candidate.protocol !== "https:" && !isLocalDevelopmentUrl) ||
      candidate.host !== allowedBase.host
    ) {
      return null;
    }

    return candidate.toString();
  } catch {
    return null;
  }
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
    ((!("issuer" in value) && !("subject" in value)) ||
      ("issuer" in value &&
        "subject" in value &&
        typeof value.issuer === "string" &&
        typeof value.subject === "string")) &&
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

function insertAuthorityOrder(order: StoredOrder) {
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

function updateAuthorityOrderIfStatusMatches(
  order: StoredOrder,
  expectedStatus: StoredOrder["status"],
) {
  const result = getAuthorityDatabase()
    .prepare(`
      UPDATE authority_orders
      SET
        phone_last_four = ?,
        status = ?,
        created_at = ?,
        updated_at = ?,
        payload_json = ?
      WHERE order_number = ?
        AND status = ?
    `)
    .run(
      getPhoneLastFour(order.customer.phone),
      order.status,
      order.createdAt,
      new Date().toISOString(),
      JSON.stringify(order),
      order.orderNumber,
      expectedStatus,
    ) as { changes: number | bigint };

  return Number(result.changes) === 1;
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

function normalizeIdempotencyKey(value: string) {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,159}$/.test(normalized)) {
    throw new OrderAuthorityError(
      "Idempotency-Key must be a stable 16-160 character token.",
      400,
      "idempotency_key_invalid",
    );
  }
  return normalized;
}

function normalizeCheckoutSessionId(value: string) {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9_-]{16,160}$/.test(normalized)) {
    throw new OrderAuthorityError(
      "A valid checkout session cookie is required.",
      400,
      "checkout_session_invalid",
    );
  }
  return normalized;
}

async function createRecentOrderToken(orderNumber: string) {
  return createSignedToken(
    {
      scope: "recent_order",
      orderNumber,
      exp: Date.now() + RECENT_ORDER_MAX_AGE_SECONDS * 1000,
    } satisfies RecentOrderPayload,
    getOrderAuthoritySecret(),
  );
}

function buildQuotedStoredOrder(
  quote: CheckoutQuote,
  checkout: AuthorityCheckoutSubmissionInput,
) {
  if (checkout.shippingMethodId !== quote.shipping.methodId) {
    throw new OrderAuthorityError(
      "The selected shipping method does not match the persisted quote.",
      409,
      "quote_stale",
    );
  }
  if (!checkout.acceptPolicies) {
    throw new OrderAuthorityError(
      "Terms, privacy, shipping, and return policies must be accepted before order creation.",
      400,
      "policies_not_accepted",
    );
  }
  const paymentOption = quote.paymentOptions.find(
    (option) => option.id === checkout.paymentMethodId,
  );
  if (!paymentOption?.enabled) {
    throw new OrderAuthorityError(
      "The selected payment method is not available for this quote.",
      409,
      "payment_method_unavailable",
    );
  }
  if (
    checkout.termsVersion !== quote.policySet.termsVersion ||
    checkout.privacyNoticeVersion !== quote.policySet.privacyNoticeVersion
  ) {
    throw new OrderAuthorityError(
      "The accepted policy versions do not match the persisted quote.",
      409,
      "policy_version_mismatch",
    );
  }

  const catalog = getActiveCatalogAuthority();
  if (!catalog || catalog.importId !== quote.catalogVersion || catalog.sourceHash !== quote.catalogHash) {
    throw new OrderAuthorityError(
      "The approved catalog changed after this quote was created.",
      409,
      "quote_stale",
    );
  }
  if (checkout.paymentMethodId === "payment_link") {
    assertPaymentProviderBindingReady();
  } else {
    const codUnavailable = quote.lines.some((line) => {
      const product = catalog.payload.products.find(
        (candidate) => candidate.slug === line.productSlug,
      );
      const variant = product?.variants.find(
        (candidate) => candidate.sku === line.sku,
      );
      return !variant?.codEligible;
    });
    if (codUnavailable) {
      throw new OrderAuthorityError(
        "Cash on delivery is not approved for every quoted SKU.",
        409,
        "payment_method_unavailable",
      );
    }
  }

  const createdAt = new Date().toISOString();
  const providerBindings = createStoredOrderProviderBindings(
    checkout.paymentMethodId,
    createdAt,
    {
      paymentProviderLabel: getPaymentProviderRuntimeConfig().label,
      shippingProviderLabel: getShippingProviderRuntimeConfig().label,
    },
  );
  const order: StoredOrder = {
    orderNumber: buildOrderNumber(),
    createdAt,
    status: checkout.paymentMethodId === "payment_link" ? "payment_pending" : "received",
    subtotal: quote.subtotalGrossHalalas / 100,
    shippingFeeEstimate: quote.shipping.grossHalalas / 100,
    totalEstimate: quote.totalGrossHalalas / 100,
    shippingMethodId: checkout.shippingMethodId,
    paymentMethodId: checkout.paymentMethodId,
    allowOperationalUpdates: checkout.acceptUpdates,
    customer: {
      fullName: checkout.fullName.trim(),
      phone: checkout.phone.replace(/\D/g, ""),
      email: checkout.email.trim().toLowerCase(),
      city: checkout.city.trim(),
      district: checkout.district.trim(),
      addressLine: checkout.addressLine.trim(),
      notes: checkout.notes.trim(),
    },
    lines: quote.lines.map((line) => ({
      key: `${line.productSlug}:${line.sku}`,
      productSlug: line.productSlug,
      productName: line.nameAr,
      productSubtitle: line.nameEn,
      sku: line.sku,
      variantLabel: line.labelAr,
      size: line.size,
      quantity: line.quantity,
      unitPrice: line.unitGrossHalalas / 100,
      lineTotal: line.lineGrossHalalas / 100,
      shippingNote: quote.shipping.estimatedDeliveryAr,
      catalogTruth: buildStoredOrderLineCatalogTruth({
        productSlug: line.productSlug,
        sku: line.sku,
        availability: "InStock",
      }),
    })),
    providerBindings,
    pricingSnapshot: {
      quoteId: quote.quoteId,
      locale: quote.locale,
      catalogVersion: quote.catalogVersion,
      catalogHash: quote.catalogHash,
      currency: "SAR",
      taxInclusive: true,
      vatRateBps: quote.vatRateBps,
      roundingPolicy: quote.roundingPolicy,
      subtotalGrossHalalas: quote.subtotalGrossHalalas,
      subtotalVatHalalas: quote.subtotalVatHalalas,
      discountGrossHalalas: quote.discountGrossHalalas,
      discountVatHalalas: quote.discountVatHalalas,
      promotion: quote.promotion,
      shippingGrossHalalas: quote.shipping.grossHalalas,
      shippingVatHalalas: quote.shipping.vatHalalas,
      totalGrossHalalas: quote.totalGrossHalalas,
      totalVatHalalas: quote.totalVatHalalas,
      termsVersion: checkout.termsVersion,
      privacyNoticeVersion: checkout.privacyNoticeVersion,
      lines: quote.lines.map((line) => ({
        sku: line.sku,
        quantity: line.quantity,
        unitGrossHalalas: line.unitGrossHalalas,
        unitVatHalalas: line.unitVatHalalas,
        lineGrossHalalas: line.lineGrossHalalas,
        lineVatHalalas: line.lineVatHalalas,
      })),
    },
  };
  return order;
}

export async function createAuthorityOrderFromQuote({
  quoteId,
  checkoutSessionId,
  idempotencyKey: rawIdempotencyKey,
  checkout,
}: CreateAuthorityOrderFromQuoteInput) {
  await ensureAuthorityOrdersReady();
  const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey);
  const normalizedSessionId = normalizeCheckoutSessionId(checkoutSessionId);
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ quoteId, checkout }))
    .digest("hex");

  const result = runAuthorityTransaction((database) => {
    const existing = database.prepare(`
      SELECT request_hash, state, order_number
      FROM authority_order_idempotency
      WHERE checkout_session_id = ? AND idempotency_key = ?
    `).get(normalizedSessionId, idempotencyKey) as
      | { request_hash: string; state: "in_progress" | "completed"; order_number: string | null }
      | undefined;

    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw new OrderAuthorityError(
          "This Idempotency-Key was already used with a different order payload.",
          409,
          "idempotency_conflict",
        );
      }
      if (existing.state !== "completed" || !existing.order_number) {
        throw new OrderAuthorityError(
          "The original order request is still being processed.",
          409,
          "idempotency_in_progress",
        );
      }
      const replayedOrder = readPersistedOrder(existing.order_number);
      if (!replayedOrder) {
        throw new OrderAuthorityError(
          "The idempotency record points to an unavailable order.",
          500,
          "idempotency_storage_invalid",
        );
      }
      return { order: replayedOrder, replayed: true };
    }

    const now = new Date().toISOString();
    database.prepare(`
      INSERT INTO authority_order_idempotency (
        checkout_session_id, idempotency_key, request_hash, state,
        order_number, created_at, updated_at
      ) VALUES (?, ?, ?, 'in_progress', NULL, ?, ?)
    `).run(normalizedSessionId, idempotencyKey, requestHash, now, now);

    let quoteRecord;
    try {
      quoteRecord = getCheckoutQuoteForSession(quoteId, normalizedSessionId);
    } catch (error) {
      if (error instanceof CatalogQuoteError) {
        throw new OrderAuthorityError(error.message, error.statusCode, error.code);
      }
      throw error;
    }
    if (!quoteRecord) {
      throw new OrderAuthorityError(
        "Quote was not found for this checkout session.",
        404,
        "quote_not_found",
      );
    }
    if (quoteRecord.status !== "active") {
      throw new OrderAuthorityError(
        "Quote has already been consumed or expired.",
        409,
        "quote_unavailable",
      );
    }
    if (Date.parse(quoteRecord.expiresAt) <= Date.now()) {
      database.prepare(`
        UPDATE authority_checkout_quotes SET status = 'expired'
        WHERE id = ? AND status = 'active'
      `).run(quoteId);
      throw new OrderAuthorityError(
        "Quote has expired. Request a new quote before ordering.",
        409,
        "quote_expired",
      );
    }

    const order = buildQuotedStoredOrder(quoteRecord.quote, checkout);
    const reservationExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const reservationTargets: Array<{
      sku: string;
      quantity: number;
      locationId: string;
    }> = [];

    for (const line of quoteRecord.quote.lines) {
      const balance = database.prepare(`
        SELECT location_id
        FROM authority_inventory_balances
        WHERE import_id = ? AND sku = ?
          AND on_hand - reserved - safety_stock >= ?
        ORDER BY (on_hand - reserved - safety_stock) DESC
        LIMIT 1
      `).get(
        quoteRecord.quote.catalogVersion,
        line.sku,
        line.quantity,
      ) as { location_id: string } | undefined;
      if (!balance) {
        throw new OrderAuthorityError(
          `Inventory is no longer available for ${line.sku}.`,
          409,
          "insufficient_stock",
        );
      }
      const updated = database.prepare(`
        UPDATE authority_inventory_balances
        SET reserved = reserved + ?, version = version + 1, updated_at = ?
        WHERE import_id = ? AND sku = ? AND location_id = ?
          AND on_hand - reserved - safety_stock >= ?
      `).run(
        line.quantity,
        now,
        quoteRecord.quote.catalogVersion,
        line.sku,
        balance.location_id,
        line.quantity,
      ) as { changes: number | bigint };
      if (Number(updated.changes) !== 1) {
        throw new OrderAuthorityError(
          `Inventory changed while reserving ${line.sku}.`,
          409,
          "insufficient_stock",
        );
      }
      reservationTargets.push({
        sku: line.sku,
        quantity: line.quantity,
        locationId: balance.location_id,
      });
    }

    insertAuthorityOrder(order);
    if (quoteRecord.quote.promotion) {
      const customerKeyHash = createHash("sha256")
        .update(checkout.phone.replace(/\D/g, ""))
        .digest("hex");
      try {
        redeemPromotionForOrder(database, {
          promotion: quoteRecord.quote.promotion,
          quoteId,
          orderNumber: order.orderNumber,
          customerKeyHash,
          now,
        });
      } catch (error) {
        if (error instanceof PromotionAuthorityError) {
          throw new OrderAuthorityError(error.message, error.statusCode, error.code);
        }
        throw error;
      }
    }
    const insertReservation = database.prepare(`
      INSERT INTO authority_inventory_reservations (
        id, reservation_key, quote_id, order_number, catalog_import_id,
        sku, location_id, quantity, state, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `);
    for (const target of reservationTargets) {
      insertReservation.run(
        `reservation_${randomUUID()}`,
        `${order.orderNumber}:${target.sku}`,
        quoteId,
        order.orderNumber,
        quoteRecord.quote.catalogVersion,
        target.sku,
        target.locationId,
        target.quantity,
        reservationExpiresAt,
        now,
        now,
      );
    }

    database.prepare(`
      UPDATE authority_checkout_quotes SET status = 'consumed'
      WHERE id = ? AND status = 'active'
    `).run(quoteId);

    const insertOutbox = database.prepare(`
      INSERT INTO authority_outbox (
        id, aggregate_type, aggregate_id, event_type, dedupe_key, status,
        attempts, next_attempt_at, last_error, payload_json, created_at, updated_at
      ) VALUES (?, 'order', ?, ?, ?, 'pending', 0, ?, NULL, ?, ?, ?)
    `);
    const eventTypes = [
      "order.created",
      ...(order.paymentMethodId === "payment_link" ? ["payment.link.requested"] : []),
      "notification.order.received",
    ];
    for (const eventType of eventTypes) {
      insertOutbox.run(
        `outbox_${randomUUID()}`,
        order.orderNumber,
        eventType,
        `${order.orderNumber}:${eventType}`,
        now,
        JSON.stringify({ orderNumber: order.orderNumber }),
        now,
        now,
      );
    }

    database.prepare(`
      UPDATE authority_order_idempotency
      SET state = 'completed', order_number = ?, updated_at = ?
      WHERE checkout_session_id = ? AND idempotency_key = ?
    `).run(order.orderNumber, now, normalizedSessionId, idempotencyKey);

    return { order, replayed: false };
  });

  const recentOrderToken = await createRecentOrderToken(result.order.orderNumber);

  return { ...result, recentOrderToken };
}

export async function recoverAuthorityOrderAttempt(
  checkoutSessionId: string,
  rawIdempotencyKey: string,
): Promise<AuthorityOrderAttemptRecovery> {
  await ensureAuthorityOrdersReady();
  const normalizedSessionId = normalizeCheckoutSessionId(checkoutSessionId);
  const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey);
  const record = getAuthorityDatabase().prepare(`
    SELECT state, order_number
    FROM authority_order_idempotency
    WHERE checkout_session_id = ? AND idempotency_key = ?
    LIMIT 1
  `).get(normalizedSessionId, idempotencyKey) as
    | { state: "in_progress" | "completed"; order_number: string | null }
    | undefined;

  if (!record) return { state: "unknown" };
  if (record.state === "in_progress") return { state: "in_progress" };
  if (!record.order_number) {
    throw new OrderAuthorityError(
      "The completed idempotency record does not reference an order.",
      500,
      "idempotency_storage_invalid",
    );
  }

  const order = readPersistedOrder(record.order_number);
  if (!order) {
    throw new OrderAuthorityError(
      "The idempotency record points to an unavailable order.",
      500,
      "idempotency_storage_invalid",
    );
  }

  return {
    state: "completed",
    order,
    recentOrderToken: await createRecentOrderToken(order.orderNumber),
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

function doesProviderIdentityBindingMatch(
  customerKey: string,
  issuer: string,
  subject: string,
) {
  const row = getAuthorityDatabase()
    .prepare(`
      SELECT customer_key
      FROM authority_customer_identities
      WHERE issuer = ? AND subject = ?
      LIMIT 1
    `)
    .get(issuer, subject) as { customer_key: string } | undefined;

  return row?.customer_key === customerKey;
}

export async function bindAuthorityCustomerProviderIdentity(
  customerKey: string,
  identity: {
    issuer: string;
    subject: string;
    email?: string | null;
    phone?: string | null;
  },
) {
  const issuer = normalizeProviderIssuer(identity.issuer);
  const subject = normalizeProviderSubject(identity.subject);
  if (!issuer || !subject) return false;

  const existingIdentity = getAuthorityDatabase()
    .prepare(`
      SELECT customer_key
      FROM authority_customer_identities
      WHERE issuer = ? AND subject = ?
      LIMIT 1
    `)
    .get(issuer, subject) as { customer_key: string } | undefined;

  if (existingIdentity) {
    return existingIdentity.customer_key === customerKey;
  }

  const customerIssuerBinding = getAuthorityDatabase()
    .prepare(`
      SELECT subject
      FROM authority_customer_identities
      WHERE customer_key = ? AND issuer = ?
      LIMIT 1
    `)
    .get(customerKey, issuer) as { subject: string } | undefined;

  if (customerIssuerBinding) return customerIssuerBinding.subject === subject;

  if (!(await doesAuthorityCustomerIdentityMatch(customerKey, identity))) {
    return false;
  }

  return runAuthorityTransaction((database) => {
    const identityOwner = database
      .prepare(`
        SELECT customer_key
        FROM authority_customer_identities
        WHERE issuer = ? AND subject = ?
        LIMIT 1
      `)
      .get(issuer, subject) as { customer_key: string } | undefined;
    if (identityOwner) return identityOwner.customer_key === customerKey;

    const existingCustomerIssuer = database
      .prepare(`
        SELECT subject
        FROM authority_customer_identities
        WHERE customer_key = ? AND issuer = ?
        LIMIT 1
      `)
      .get(customerKey, issuer) as { subject: string } | undefined;
    if (existingCustomerIssuer) return existingCustomerIssuer.subject === subject;

    const now = new Date().toISOString();
    database.prepare(`
      INSERT INTO authority_customer_identities (
        issuer, subject, customer_key, provider_label, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      issuer,
      subject,
      customerKey,
      getAuthProviderRuntimeConfig().label,
      now,
      now,
    );
    return true;
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
  identity: { issuer: string; subject: string },
) {
  const authProvider = getAuthProviderRuntimeConfig();

  return createSignedToken(
    {
      scope: "customer_account",
      customerKey,
      providerLabel: authProvider.label,
      issuer: identity.issuer,
      subject: identity.subject,
      exp: Date.now() + CUSTOMER_ACCOUNT_MAX_AGE_SECONDS * 1000,
    } satisfies CustomerAccountPayload,
    getCustomerAuthProviderSecret(),
  );
}

export async function createAuthorityCustomerProviderSession(
  customerKey: string,
  orderNumber: string,
  identity: { issuer: string; subject: string },
) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const orders = await getAuthorityOrdersForCustomerKey(customerKey);

  const issuer = normalizeProviderIssuer(identity.issuer);
  const subject = normalizeProviderSubject(identity.subject);
  if (
    !issuer ||
    !subject ||
    !doesProviderIdentityBindingMatch(customerKey, issuer, subject) ||
    !orders.some((order) => order.orderNumber === normalizedOrderNumber)
  ) {
    return null;
  }

  return {
    customerAccountToken: await createAuthorityCustomerAccountTokenForCustomerKey(
      customerKey,
      { issuer, subject },
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
  returnTo = "/ar/account/orders",
) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const externalAuthProvider = getExternalAuthProviderConfig();
  const safeReturnTo =
    returnTo === "/en/account/orders"
      ? "/en/account/orders"
      : "/ar/account/orders";

  if (externalAuthProvider.externalAuthConfigured) {
    const orders = await getAuthorityOrdersForCustomerKey(customerKey);
    if (!orders.some((order) => order.orderNumber === normalizedOrderNumber)) {
      return null;
    }

    const stateToken = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(48).toString("base64url");
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + CUSTOMER_PROVIDER_AUTH_HANDOFF_MAX_AGE_SECONDS * 1000,
    ).toISOString();

    runAuthorityTransaction((database) => {
      database.prepare(`
        DELETE FROM authority_customer_auth_states
        WHERE expires_at <= ? OR consumed_at IS NOT NULL
      `).run(now.toISOString());
      database.prepare(`
        INSERT INTO authority_customer_auth_states (
          state_hash, customer_key, order_number, return_to,
          nonce, code_verifier, expires_at, consumed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
      `).run(
        hashProviderAuthState(stateToken),
        customerKey,
        normalizedOrderNumber,
        safeReturnTo,
        nonce,
        codeVerifier,
        expiresAt,
        now.toISOString(),
      );
    });

    return buildExternalAuthProviderAuthorizeUrl(stateToken, {
      nonce,
      codeChallenge: createPkceCodeChallenge(codeVerifier),
    });
  }

  return null;
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

  const orders = await getAuthorityOrdersForCustomerKey(payload.customerKey);
  return orders.map((order) =>
    redactOrderForCustomerList(order, { allowPaymentUrl: false }),
  );
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

  if (
    payload.issuer &&
    payload.subject &&
    !doesProviderIdentityBindingMatch(
      payload.customerKey,
      payload.issuer,
      payload.subject,
    )
  ) {
    return [] as StoredOrder[];
  }

  const orders = await getAuthorityOrdersForCustomerKey(payload.customerKey);
  return orders.map((order) =>
    redactOrderForCustomerList(order, { allowPaymentUrl: true }),
  );
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

export async function exchangeAuthorityCustomerProviderAuthStateToken(
  stateToken: string | undefined,
) {
  if (!stateToken) {
    return null;
  }

  const normalizedStateToken = stateToken.trim();
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(normalizedStateToken)) return null;
  const stateHash = hashProviderAuthState(normalizedStateToken);
  const now = new Date().toISOString();

  return runAuthorityTransaction((database) => {
    const state = database.prepare(`
      SELECT customer_key, order_number, return_to, nonce, code_verifier
      FROM authority_customer_auth_states
      WHERE state_hash = ?
        AND consumed_at IS NULL
        AND expires_at > ?
      LIMIT 1
    `).get(stateHash, now) as
      | {
          customer_key: string;
          order_number: string;
          return_to: string;
          nonce: string;
          code_verifier: string;
        }
      | undefined;
    if (!state) return null;

    const update = database.prepare(`
      UPDATE authority_customer_auth_states
      SET consumed_at = ?
      WHERE state_hash = ? AND consumed_at IS NULL
    `).run(now, stateHash) as { changes: number | bigint };
    if (Number(update.changes) !== 1) return null;

    return {
      customerKey: state.customer_key,
      orderNumber: state.order_number,
      returnTo: state.return_to,
      nonce: state.nonce,
      codeVerifier: state.code_verifier,
    } satisfies CustomerProviderAuthStatePayload;
  });
}

export async function listAuthorityOrders() {
  return readAuthorityOrders();
}

export async function advanceAuthorityOrderStatus(
  orderNumber: string,
  expectedStatus?: StoredOrder["status"],
) {
  await ensureAuthorityOrdersReady();
  const order = readPersistedOrder(orderNumber);

  if (!order) {
    throw new OrderAuthorityError(
      "الطلب المطلوب غير موجود داخل authority الحالية.",
      404,
    );
  }

  if (expectedStatus && order.status !== expectedStatus) {
    throw new OrderAuthorityError(
      "حالة الطلب تغيّرت منذ آخر تحميل. حدّث القائمة وراجع الحالة الحالية قبل تنفيذ الإجراء مرة أخرى.",
      409,
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

  if (!runAuthorityTransaction((database) => {
    const updated = updateAuthorityOrderIfStatusMatches(updatedOrder, order.status);
    if (updated && nextStatus === "confirmed") {
      commitAuthorityInventoryReservations(
        database,
        order.orderNumber,
        order.paymentMethodId === "cash_on_delivery"
          ? "cod_order_confirmed"
          : "payment_confirmed",
      );
    }
    return updated;
  })) {
    throw new OrderAuthorityError(
      "حالة الطلب تغيّرت أثناء تنفيذ الإجراء. حدّث القائمة وراجع الحالة الحالية قبل المحاولة مرة أخرى.",
      409,
    );
  }

  await syncAndDeliverNotificationsForOrders([updatedOrder]);

  return {
    order: updatedOrder,
    previousStatus: order.status,
    nextStatus,
  };
}

export async function initiateAuthorityPaymentLink(orderNumber: string) {
  await ensureAuthorityOrdersReady();
  const order = readPersistedOrder(orderNumber);

  if (!order) {
    throw new OrderAuthorityError(
      "الطلب المطلوب غير موجود في سجل الطلبات الحالي.",
      404,
    );
  }

  if (order.paymentMethodId !== "payment_link") {
    throw new OrderAuthorityError(
      "هذا الطلب لا يحتاج إلى إنشاء رابط دفع.",
      409,
    );
  }

  if (
    order.providerBindings.payment.state !== "pending" &&
    order.providerBindings.payment.referenceId
  ) {
    return {
      order,
      action: "payment_link_sent" as const,
    };
  }

  assertPaymentProviderBindingReady();
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
  const order = readPersistedOrder(orderNumber);

  if (!order) {
    throw new OrderAuthorityError(
      "الطلب المطلوب غير موجود في سجل الطلبات الحالي.",
      404,
    );
  }

  if (
    order.providerBindings.shipping.state !== "pending" &&
    order.providerBindings.shipping.bookingReference
  ) {
    return {
      order,
      action: "shipping_booked" as const,
    };
  }

  assertShippingProviderBindingReady();
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

      if (!order.providerBindings.payment.paymentUrl && !paymentUrl) {
        throw new ProviderGatewayError(
          paymentProvider.label,
          "Payment provider returned a checkout URL outside the configured provider origin.",
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

  runAuthorityTransaction((database) => {
    upsertAuthorityOrder(updatedOrder);
    if (action === "payment_confirmed") {
      commitAuthorityInventoryReservations(
        database,
        updatedOrder.orderNumber,
        "payment_provider_confirmed",
      );
    }
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
