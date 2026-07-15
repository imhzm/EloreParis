import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  getAuthorityDatabase,
  runAuthorityTransaction,
} from "@/lib/authority-database";
import { getActiveCatalogAuthority } from "@/lib/catalog-authority";
import type { Locale } from "@/lib/i18n";
import { getLivePaymentProviderConfig } from "@/lib/live-provider-config";

export const CHECKOUT_SESSION_COOKIE = "elore-checkout-session";
export const CHECKOUT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
export const CHECKOUT_QUOTE_MAX_ITEMS = 50;

type QuoteItem = {
  productSlug: string;
  sku: string;
  quantity: number;
};

type CreateQuoteInput = {
  items: QuoteItem[];
  shippingMethodId: "standard" | "express";
  locale: Locale;
};

export type CheckoutQuote = {
  quoteId: string;
  checkoutSessionId: string;
  locale: Locale;
  catalogVersion: string;
  catalogHash: string;
  currency: "SAR";
  taxInclusive: true;
  vatRateBps: number;
  roundingPolicy: "line_nearest_halalah";
  expiresAt: string;
  policySet: {
    termsVersion: string;
    privacyNoticeVersion: string;
    termsPath: string;
    privacyNoticePath: string;
  };
  lines: Array<{
    productSlug: string;
    sku: string;
    nameAr: string;
    nameEn: string;
    labelAr: string;
    labelEn: string;
    size: string;
    quantity: number;
    unitGrossHalalas: number;
    unitVatHalalas: number;
    lineGrossHalalas: number;
    lineVatHalalas: number;
  }>;
  shipping: {
    methodId: "standard" | "express";
    labelAr: string;
    labelEn: string;
    estimatedDeliveryAr: string;
    estimatedDeliveryEn: string;
    grossHalalas: number;
    vatHalalas: number;
  };
  paymentOptions: Array<{
    id: "payment_link" | "cash_on_delivery";
    enabled: boolean;
    reasonCode: "provider_unavailable" | "unavailable_for_cart" | null;
  }>;
  subtotalGrossHalalas: number;
  subtotalVatHalalas: number;
  totalGrossHalalas: number;
  totalVatHalalas: number;
};

export class CatalogQuoteError extends Error {
  statusCode: number;
  code: string;
  issues: string[];

  constructor(code: string, message: string, statusCode = 400, issues: string[] = []) {
    super(message);
    this.name = "CatalogQuoteError";
    this.code = code;
    this.statusCode = statusCode;
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseCreateQuoteInput(value: unknown): CreateQuoteInput {
  const inputKeys = isRecord(value) ? Object.keys(value) : [];
  const hasLegacyShape =
    inputKeys.length === 2 &&
    inputKeys.every((key) => ["items", "shippingMethodId"].includes(key));
  const hasLocalizedShape =
    inputKeys.length === 3 &&
    inputKeys.every((key) => ["items", "shippingMethodId", "locale"].includes(key));
  if (
    !isRecord(value) ||
    (!hasLegacyShape && !hasLocalizedShape) ||
    !Array.isArray(value.items) ||
    value.items.length < 1 ||
    value.items.length > CHECKOUT_QUOTE_MAX_ITEMS ||
    !["standard", "express"].includes(String(value.shippingMethodId)) ||
    (hasLocalizedShape && value.locale !== "ar" && value.locale !== "en")
  ) {
    throw new CatalogQuoteError(
      "quote_payload_invalid",
      "Quote requests require items, one supported shippingMethodId, and an optional supported locale.",
      400,
    );
  }

  const items: QuoteItem[] = [];
  const keys = new Set<string>();
  for (const [index, item] of value.items.entries()) {
    if (
      !isRecord(item) ||
      Object.keys(item).length !== 3 ||
      !["productSlug", "sku", "quantity"].every((key) => key in item) ||
      typeof item.productSlug !== "string" ||
      typeof item.sku !== "string" ||
      !Number.isSafeInteger(item.quantity) ||
      Number(item.quantity) < 1 ||
      Number(item.quantity) > 10
    ) {
      throw new CatalogQuoteError(
        "quote_payload_invalid",
        `Quote item ${index} is invalid.`,
        400,
      );
    }
    const productSlug = item.productSlug.trim().toLowerCase();
    const sku = item.sku.trim();
    if (!productSlug || !sku || productSlug.length > 160 || sku.length > 160) {
      throw new CatalogQuoteError("quote_payload_invalid", `Quote item ${index} is invalid.`, 400);
    }
    const key = `${productSlug}:${sku.toLowerCase()}`;
    if (keys.has(key)) {
      throw new CatalogQuoteError(
        "quote_duplicate_item",
        "Duplicate SKUs must be merged before requesting a quote.",
        400,
      );
    }
    keys.add(key);
    items.push({ productSlug, sku, quantity: Number(item.quantity) });
  }

  return {
    items,
    shippingMethodId: value.shippingMethodId as "standard" | "express",
    locale: value.locale === "en" ? "en" : "ar",
  };
}

function vatFromInclusiveGross(grossHalalas: number, rateBps: number) {
  if (rateBps === 0) return 0;
  return Math.round((grossHalalas * rateBps) / (10_000 + rateBps));
}

function getAvailableUnits(importId: string, sku: string) {
  const row = getAuthorityDatabase().prepare(`
    SELECT on_hand, reserved, safety_stock
    FROM authority_inventory_balances
    WHERE import_id = ? AND sku = ?
    LIMIT 1
  `).get(importId, sku) as
    | { on_hand: number; reserved: number; safety_stock: number }
    | undefined;

  return row
    ? Math.max(0, row.on_hand - row.reserved - row.safety_stock)
    : 0;
}

function sanitizeCheckoutSessionId(value: string) {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9_-]{16,160}$/.test(normalized)) {
    throw new CatalogQuoteError(
      "checkout_session_invalid",
      "Checkout session is invalid.",
      400,
    );
  }
  return normalized;
}

function getApprovedCheckoutPolicySet() {
  const termsVersion = process.env.PUBLIC_TERMS_VERSION?.trim();
  const privacyNoticeVersion = process.env.PUBLIC_PRIVACY_NOTICE_VERSION?.trim();
  if (!termsVersion || !privacyNoticeVersion) {
    throw new CatalogQuoteError(
      "policy_authority_unavailable",
      "Approved checkout policy versions are not configured.",
      503,
    );
  }
  return {
    termsVersion,
    privacyNoticeVersion,
    termsPath: "/terms",
    privacyNoticePath: "/trust/privacy",
  };
}

export function createCheckoutQuote(value: unknown, rawCheckoutSessionId: string) {
  const input = parseCreateQuoteInput(value);
  const checkoutSessionId = sanitizeCheckoutSessionId(rawCheckoutSessionId);
  const catalog = getActiveCatalogAuthority();
  if (!catalog) {
    throw new CatalogQuoteError(
      "catalog_unavailable",
      "No approved catalog publication is active.",
      503,
    );
  }

  const shippingMethod = catalog.payload.shippingMethods.find(
    (method) => method.id === input.shippingMethodId && method.enabled,
  );
  if (!shippingMethod) {
    throw new CatalogQuoteError(
      "shipping_method_unavailable",
      "The selected shipping method is not approved for quoting.",
      409,
    );
  }

  const lines: CheckoutQuote["lines"] = [];
  const unavailable: string[] = [];
  let cashOnDeliveryEligible = true;
  for (const item of input.items) {
    const product = catalog.payload.products.find(
      (candidate) =>
        candidate.slug === item.productSlug && candidate.status === "approved",
    );
    const variant = product?.variants.find(
      (candidate) =>
        candidate.sku.toLowerCase() === item.sku.toLowerCase() &&
        candidate.status === "approved",
    );
    if (!product || !variant) {
      unavailable.push(`${item.productSlug}:${item.sku}:unknown`);
      continue;
    }
    const availableUnits = getAvailableUnits(catalog.importId, variant.sku);
    if (availableUnits < item.quantity) {
      unavailable.push(`${item.productSlug}:${item.sku}:insufficient_stock`);
      continue;
    }
    const unitVatHalalas = vatFromInclusiveGross(
      variant.grossHalalas,
      catalog.payload.taxProfile.rateBps,
    );
    cashOnDeliveryEligible = cashOnDeliveryEligible && variant.codEligible;
    lines.push({
      productSlug: product.slug,
      sku: variant.sku,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      labelAr: variant.labelAr,
      labelEn: variant.labelEn,
      size: variant.size,
      quantity: item.quantity,
      unitGrossHalalas: variant.grossHalalas,
      unitVatHalalas,
      lineGrossHalalas: variant.grossHalalas * item.quantity,
      lineVatHalalas: unitVatHalalas * item.quantity,
    });
  }

  if (unavailable.length) {
    throw new CatalogQuoteError(
      "quote_items_unavailable",
      "The complete cart could not be quoted from current catalog and inventory truth.",
      409,
      unavailable,
    );
  }

  const subtotalGrossHalalas = lines.reduce(
    (sum, line) => sum + line.lineGrossHalalas,
    0,
  );
  const subtotalVatHalalas = lines.reduce(
    (sum, line) => sum + line.lineVatHalalas,
    0,
  );
  const shippingVatHalalas = vatFromInclusiveGross(
    shippingMethod.grossHalalas,
    catalog.payload.taxProfile.rateBps,
  );
  const now = Date.now();
  const policySet = getApprovedCheckoutPolicySet();
  const paymentProvider = getLivePaymentProviderConfig();
  const paymentLinkEnabled =
    paymentProvider.callbackConfigured && paymentProvider.requestConfigured;
  const quote: CheckoutQuote = {
    quoteId: `quote_${randomUUID()}`,
    checkoutSessionId,
    locale: input.locale,
    catalogVersion: catalog.importId,
    catalogHash: catalog.sourceHash,
    currency: "SAR",
    taxInclusive: true,
    vatRateBps: catalog.payload.taxProfile.rateBps,
    roundingPolicy: "line_nearest_halalah",
    expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
    policySet,
    lines,
    shipping: {
      methodId: shippingMethod.id,
      labelAr: shippingMethod.labelAr,
      labelEn: shippingMethod.labelEn,
      estimatedDeliveryAr: shippingMethod.estimatedDeliveryAr,
      estimatedDeliveryEn: shippingMethod.estimatedDeliveryEn,
      grossHalalas: shippingMethod.grossHalalas,
      vatHalalas: shippingVatHalalas,
    },
    paymentOptions: [
      {
        id: "payment_link",
        enabled: paymentLinkEnabled,
        reasonCode: paymentLinkEnabled ? null : "provider_unavailable",
      },
      {
        id: "cash_on_delivery",
        enabled: cashOnDeliveryEligible,
        reasonCode: cashOnDeliveryEligible ? null : "unavailable_for_cart",
      },
    ],
    subtotalGrossHalalas,
    subtotalVatHalalas,
    totalGrossHalalas: subtotalGrossHalalas + shippingMethod.grossHalalas,
    totalVatHalalas: subtotalVatHalalas + shippingVatHalalas,
  };

  const requestHash = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  return runAuthorityTransaction((database) => {
    const nowIso = new Date(now).toISOString();
    database.prepare(`
      UPDATE authority_checkout_quotes
      SET status = 'expired'
      WHERE checkout_session_id = ?
        AND status = 'active'
        AND expires_at <= ?
    `).run(checkoutSessionId, nowIso);

    const activeQuote = database.prepare(`
      SELECT id
      FROM authority_checkout_quotes
      WHERE checkout_session_id = ?
        AND request_hash = ?
        AND catalog_import_id = ?
        AND status = 'active'
        AND expires_at > ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(
      checkoutSessionId,
      requestHash,
      catalog.importId,
      nowIso,
    ) as { id: string } | undefined;

    if (activeQuote) {
      const existing = getCheckoutQuoteForSession(activeQuote.id, checkoutSessionId);
      if (!existing || existing.status !== "active") {
        throw new CatalogQuoteError(
          "quote_storage_invalid",
          "The reusable quote is unavailable from authority storage.",
          500,
        );
      }
      return existing.quote;
    }

    database.prepare(`
      INSERT INTO authority_checkout_quotes (
        id, checkout_session_id, request_hash, catalog_import_id, status,
        currency, expires_at, created_at, payload_json
      ) VALUES (?, ?, ?, ?, 'active', 'SAR', ?, ?, ?)
    `).run(
      quote.quoteId,
      checkoutSessionId,
      requestHash,
      catalog.importId,
      quote.expiresAt,
      nowIso,
      JSON.stringify(quote),
    );

    return quote;
  });
}

export function createCheckoutSessionId() {
  return `checkout_${randomUUID()}`;
}

export function getCheckoutQuoteForSession(
  quoteId: string,
  checkoutSessionId: string,
) {
  const row = getAuthorityDatabase().prepare(`
    SELECT status, expires_at, payload_json
    FROM authority_checkout_quotes
    WHERE id = ? AND checkout_session_id = ?
  `).get(quoteId, checkoutSessionId) as
    | { status: "active" | "consumed" | "expired"; expires_at: string; payload_json: string }
    | undefined;

  if (!row) return null;
  let storedQuote: Omit<CheckoutQuote, "locale"> & { locale?: unknown };
  try {
    storedQuote = JSON.parse(row.payload_json) as Omit<CheckoutQuote, "locale"> & {
      locale?: unknown;
    };
  } catch {
    throw new CatalogQuoteError(
      "quote_storage_invalid",
      "Stored quote payload is unreadable.",
      500,
    );
  }
  if (
    storedQuote.quoteId !== quoteId ||
    storedQuote.checkoutSessionId !== checkoutSessionId ||
    storedQuote.currency !== "SAR" ||
    storedQuote.taxInclusive !== true ||
    !Array.isArray(storedQuote.lines) ||
    !Array.isArray(storedQuote.paymentOptions) ||
    (storedQuote.locale !== undefined &&
      storedQuote.locale !== "ar" &&
      storedQuote.locale !== "en")
  ) {
    throw new CatalogQuoteError(
      "quote_storage_invalid",
      "Stored quote payload does not match its authority record.",
      500,
    );
  }
  const quote: CheckoutQuote = {
    ...storedQuote,
    locale: storedQuote.locale === "en" ? "en" : "ar",
  };
  return { quote, status: row.status, expiresAt: row.expires_at };
}
