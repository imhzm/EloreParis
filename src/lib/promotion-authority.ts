import "server-only";

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getAuthorityDatabase, runAuthorityTransaction } from "@/lib/authority-database";
import { getActiveCatalogAuthority } from "@/lib/catalog-authority";

export type PromotionMode = "automatic" | "coupon";
export type PromotionState = "draft" | "active" | "paused" | "archived";
export type PromotionDiscountType = "percentage" | "fixed_amount";
export type PromotionTarget = { type: "product" | "sku"; key: string };

export type PromotionQuoteSnapshot = {
  promotionId: string;
  promotionVersion: number;
  mode: PromotionMode;
  code: string | null;
  titleAr: string;
  titleEn: string;
  discountHalalas: number;
};

export type PromotionRecord = {
  id: string;
  version: number;
  mode: PromotionMode;
  code: string | null;
  name: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  state: PromotionState;
  discountType: PromotionDiscountType;
  percentageBps: number | null;
  fixedHalalas: number | null;
  maxDiscountHalalas: number | null;
  minSubtotalHalalas: number;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  startsAt: string;
  endsAt: string | null;
  priority: number;
  appliesToAll: boolean;
  targets: PromotionTarget[];
  mediaAssetId: string | null;
  publicBadge: string | null;
  publicPath: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  redemptionCount: number;
};

type PromotionRow = {
  id: string;
  version: number;
  mode: PromotionMode;
  code_normalized: string | null;
  name: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  state: PromotionState;
  discount_type: PromotionDiscountType;
  percentage_bps: number | null;
  fixed_halalas: number | null;
  max_discount_halalas: number | null;
  min_subtotal_halalas: number;
  usage_limit_total: number | null;
  usage_limit_per_customer: number | null;
  starts_at: string;
  ends_at: string | null;
  priority: number;
  applies_to_all: number;
  media_asset_id: string | null;
  public_badge: string | null;
  public_path: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  redemption_count: number;
};

type PromotionWriteInput = Omit<
  PromotionRecord,
  "id" | "version" | "createdBy" | "createdAt" | "updatedBy" | "updatedAt" | "redemptionCount"
> & { id?: string; expectedVersion?: number };

export class PromotionAuthorityError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
    public issues: string[] = [],
  ) {
    super(message);
    this.name = "PromotionAuthorityError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== "string") {
    throw new PromotionAuthorityError("promotion_invalid", `${field} must be a string.`);
  }
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new PromotionAuthorityError(
      "promotion_invalid",
      `${field} must contain ${min}-${max} characters.`,
    );
  }
  return normalized;
}

function optionalString(value: unknown, field: string, max: number) {
  if (value === null || value === undefined || value === "") return null;
  return boundedString(value, field, 1, max);
}

function optionalPublicPath(value: unknown) {
  const candidate = optionalString(value, "publicPath", 240);
  if (candidate === null) return null;
  if (
    !candidate.startsWith("/") || candidate.startsWith("//") ||
    candidate.includes("\\") || candidate.split(/[/?#]/).includes("..") ||
    !/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/?#-]+$/.test(candidate)
  ) {
    throw new PromotionAuthorityError(
      "promotion_invalid",
      "publicPath must be a safe local site path.",
    );
  }
  return candidate;
}

function optionalPositiveInteger(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new PromotionAuthorityError("promotion_invalid", `${field} must be a positive integer.`);
  }
  return Number(value);
}

export function normalizePromotionCode(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(normalized)) {
    throw new PromotionAuthorityError(
      "coupon_code_invalid",
      "Coupon codes must contain 3-32 letters, numbers, underscores, or hyphens.",
    );
  }
  return normalized;
}

function parseIsoDate(value: unknown, field: string, optional = false) {
  if (optional && (value === null || value === undefined || value === "")) return null;
  const raw = boundedString(value, field, 1, 64);
  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    throw new PromotionAuthorityError("promotion_invalid", `${field} must be an ISO date.`);
  }
  return new Date(timestamp).toISOString();
}

function parseTargets(value: unknown) {
  if (!Array.isArray(value) || value.length > 500) {
    throw new PromotionAuthorityError("promotion_invalid", "targets must contain at most 500 items.");
  }
  const seen = new Set<string>();
  return value.map((target, index): PromotionTarget => {
    if (!isRecord(target) || (target.type !== "product" && target.type !== "sku")) {
      throw new PromotionAuthorityError("promotion_invalid", `Target ${index} is invalid.`);
    }
    const key = boundedString(target.key, `targets[${index}].key`, 1, 160);
    const normalizedKey = target.type === "product" ? key.toLowerCase() : key.toUpperCase();
    const dedupeKey = `${target.type}:${normalizedKey.toLowerCase()}`;
    if (seen.has(dedupeKey)) {
      throw new PromotionAuthorityError("promotion_invalid", `Target ${index} is duplicated.`);
    }
    seen.add(dedupeKey);
    return { type: target.type, key: normalizedKey };
  });
}

export function parsePromotionWriteInput(value: unknown): PromotionWriteInput {
  if (!isRecord(value)) {
    throw new PromotionAuthorityError("promotion_invalid", "Promotion payload must be an object.");
  }
  const mode = value.mode;
  const state = value.state;
  const discountType = value.discountType;
  if (mode !== "automatic" && mode !== "coupon") {
    throw new PromotionAuthorityError("promotion_invalid", "mode is invalid.");
  }
  if (!["draft", "active", "paused", "archived"].includes(String(state))) {
    throw new PromotionAuthorityError("promotion_invalid", "state is invalid.");
  }
  if (discountType !== "percentage" && discountType !== "fixed_amount") {
    throw new PromotionAuthorityError("promotion_invalid", "discountType is invalid.");
  }
  const percentageBps = optionalPositiveInteger(value.percentageBps, "percentageBps");
  const fixedHalalas = optionalPositiveInteger(value.fixedHalalas, "fixedHalalas");
  if (
    (discountType === "percentage" && (!percentageBps || percentageBps > 10_000 || fixedHalalas)) ||
    (discountType === "fixed_amount" && (!fixedHalalas || percentageBps))
  ) {
    throw new PromotionAuthorityError("promotion_invalid", "Discount values do not match discountType.");
  }
  const startsAt = parseIsoDate(value.startsAt, "startsAt") as string;
  const endsAt = parseIsoDate(value.endsAt, "endsAt", true);
  if (endsAt && endsAt <= startsAt) {
    throw new PromotionAuthorityError("promotion_invalid", "endsAt must be after startsAt.");
  }
  const appliesToAll = value.appliesToAll;
  if (typeof appliesToAll !== "boolean") {
    throw new PromotionAuthorityError("promotion_invalid", "appliesToAll must be boolean.");
  }
  const targets = parseTargets(value.targets);
  if (appliesToAll === (targets.length > 0)) {
    throw new PromotionAuthorityError(
      "promotion_invalid",
      "Use either appliesToAll or one or more explicit targets.",
    );
  }
  const priority = value.priority;
  if (!Number.isSafeInteger(priority) || Number(priority) < -100_000 || Number(priority) > 100_000) {
    throw new PromotionAuthorityError("promotion_invalid", "priority must be an integer from -100000 to 100000.");
  }
  const minSubtotalHalalas = value.minSubtotalHalalas;
  if (!Number.isSafeInteger(minSubtotalHalalas) || Number(minSubtotalHalalas) < 0) {
    throw new PromotionAuthorityError("promotion_invalid", "minSubtotalHalalas must be a non-negative integer.");
  }
  const id = value.id === undefined ? undefined : boundedString(value.id, "id", 8, 160);
  const expectedVersion = value.expectedVersion === undefined
    ? undefined
    : optionalPositiveInteger(value.expectedVersion, "expectedVersion") ?? undefined;
  if (id && !expectedVersion) {
    throw new PromotionAuthorityError("promotion_invalid", "expectedVersion is required when updating.");
  }
  const code = mode === "coupon"
    ? normalizePromotionCode(boundedString(value.code, "code", 3, 32))
    : null;
  if (mode === "automatic" && value.code !== null && value.code !== undefined && value.code !== "") {
    throw new PromotionAuthorityError("promotion_invalid", "Automatic promotions cannot have coupon codes.");
  }
  return {
    id,
    expectedVersion,
    mode,
    code,
    name: boundedString(value.name, "name", 2, 120),
    titleAr: boundedString(value.titleAr, "titleAr", 2, 160),
    titleEn: boundedString(value.titleEn, "titleEn", 2, 160),
    descriptionAr: boundedString(value.descriptionAr, "descriptionAr", 0, 1_000),
    descriptionEn: boundedString(value.descriptionEn, "descriptionEn", 0, 1_000),
    state: state as PromotionState,
    discountType,
    percentageBps,
    fixedHalalas,
    maxDiscountHalalas: optionalPositiveInteger(value.maxDiscountHalalas, "maxDiscountHalalas"),
    minSubtotalHalalas: Number(minSubtotalHalalas),
    usageLimitTotal: optionalPositiveInteger(value.usageLimitTotal, "usageLimitTotal"),
    usageLimitPerCustomer: optionalPositiveInteger(value.usageLimitPerCustomer, "usageLimitPerCustomer"),
    startsAt,
    endsAt,
    priority: Number(priority),
    appliesToAll,
    targets,
    mediaAssetId: optionalString(value.mediaAssetId, "mediaAssetId", 160),
    publicBadge: optionalString(value.publicBadge, "publicBadge", 80),
    publicPath: optionalPublicPath(value.publicPath),
  };
}

function validateTargetsAgainstCatalog(input: PromotionWriteInput) {
  if (input.appliesToAll) return;
  const catalog = getActiveCatalogAuthority();
  if (!catalog) {
    throw new PromotionAuthorityError(
      "catalog_unavailable",
      "An active catalog is required before saving targeted promotions.",
      409,
    );
  }
  const products = new Set(catalog.payload.products.map((product) => product.slug.toLowerCase()));
  const skus = new Set(
    catalog.payload.products.flatMap((product) => product.variants.map((variant) => variant.sku.toLowerCase())),
  );
  const invalid = input.targets.filter((target) =>
    target.type === "product"
      ? !products.has(target.key.toLowerCase())
      : !skus.has(target.key.toLowerCase()),
  );
  if (invalid.length) {
    throw new PromotionAuthorityError(
      "promotion_target_invalid",
      "One or more promotion targets do not exist in the active catalog.",
      400,
      invalid.map((target) => `${target.type}:${target.key}`),
    );
  }
}

function targetsForPromotion(database: DatabaseSync, promotionId: string) {
  return database.prepare(`
    SELECT target_type, target_key FROM authority_promotion_targets
    WHERE promotion_id = ? ORDER BY target_type, target_key
  `).all(promotionId).map((row) => {
    const target = row as { target_type: PromotionTarget["type"]; target_key: string };
    return { type: target.target_type, key: target.target_key };
  });
}

function mapPromotionRow(database: DatabaseSync, row: PromotionRow): PromotionRecord {
  return {
    id: row.id,
    version: row.version,
    mode: row.mode,
    code: row.code_normalized,
    name: row.name,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    state: row.state,
    discountType: row.discount_type,
    percentageBps: row.percentage_bps,
    fixedHalalas: row.fixed_halalas,
    maxDiscountHalalas: row.max_discount_halalas,
    minSubtotalHalalas: row.min_subtotal_halalas,
    usageLimitTotal: row.usage_limit_total,
    usageLimitPerCustomer: row.usage_limit_per_customer,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    priority: row.priority,
    appliesToAll: row.applies_to_all === 1,
    targets: targetsForPromotion(database, row.id),
    mediaAssetId: row.media_asset_id,
    publicBadge: row.public_badge,
    publicPath: row.public_path,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
    redemptionCount: row.redemption_count,
  };
}

const promotionSelect = `
  SELECT p.*, COUNT(r.id) AS redemption_count
  FROM authority_promotions p
  LEFT JOIN authority_promotion_redemptions r ON r.promotion_id = p.id
`;

export function listPromotions() {
  const database = getAuthorityDatabase();
  const rows = database.prepare(`${promotionSelect}
    GROUP BY p.id ORDER BY p.updated_at DESC, p.id DESC
  `).all() as PromotionRow[];
  return rows.map((row) => mapPromotionRow(database, row));
}

export function listPublicPromotions(now = new Date()) {
  const database = getAuthorityDatabase();
  const nowIso = now.toISOString();
  const rows = database.prepare(`${promotionSelect}
    WHERE p.state = 'active' AND p.mode = 'automatic'
      AND p.starts_at <= ? AND (p.ends_at IS NULL OR p.ends_at > ?)
      AND p.public_path IS NOT NULL
    GROUP BY p.id
    ORDER BY p.priority DESC, p.updated_at DESC
    LIMIT 6
  `).all(nowIso, nowIso) as PromotionRow[];
  return rows.map((row) => {
    const promotion = mapPromotionRow(database, row);
    return {
      id: promotion.id,
      titleAr: promotion.titleAr,
      titleEn: promotion.titleEn,
      descriptionAr: promotion.descriptionAr,
      descriptionEn: promotion.descriptionEn,
      badge: promotion.publicBadge,
      path: promotion.publicPath as string,
      imageUrl: promotion.mediaAssetId
        ? `/api/media/${encodeURIComponent(promotion.mediaAssetId)}`
        : null,
    };
  });
}

export function savePromotion(value: unknown, actor: string) {
  const input = parsePromotionWriteInput(value);
  validateTargetsAgainstCatalog(input);
  const actorName = boundedString(actor, "actor", 2, 160);
  const now = new Date().toISOString();
  const id = input.id ?? `promotion_${randomUUID()}`;

  try {
    return runAuthorityTransaction((database) => {
      if (input.mediaAssetId) {
        const media = database.prepare(`
          SELECT status FROM authority_media_assets WHERE id = ?
        `).get(input.mediaAssetId) as { status: string } | undefined;
        if (!media || media.status !== "approved") {
          throw new PromotionAuthorityError(
            "promotion_media_unapproved",
            "Promotion media must reference an approved authority asset.",
            409,
          );
        }
      }

      if (input.id) {
        const result = database.prepare(`
          UPDATE authority_promotions SET
            version = version + 1, mode = ?, code_normalized = ?, name = ?,
            title_ar = ?, title_en = ?, description_ar = ?, description_en = ?,
            state = ?, discount_type = ?, percentage_bps = ?, fixed_halalas = ?,
            max_discount_halalas = ?, min_subtotal_halalas = ?, usage_limit_total = ?,
            usage_limit_per_customer = ?, starts_at = ?, ends_at = ?, priority = ?,
            applies_to_all = ?, media_asset_id = ?, public_badge = ?, public_path = ?,
            updated_by = ?, updated_at = ?
          WHERE id = ? AND version = ?
        `).run(
          input.mode, input.code, input.name, input.titleAr, input.titleEn,
          input.descriptionAr, input.descriptionEn, input.state, input.discountType,
          input.percentageBps, input.fixedHalalas, input.maxDiscountHalalas,
          input.minSubtotalHalalas, input.usageLimitTotal, input.usageLimitPerCustomer,
          input.startsAt, input.endsAt, input.priority, input.appliesToAll ? 1 : 0,
          input.mediaAssetId, input.publicBadge, input.publicPath, actorName, now,
          id, input.expectedVersion,
        ) as { changes: number | bigint };
        if (Number(result.changes) !== 1) {
          throw new PromotionAuthorityError(
            "promotion_version_conflict",
            "Promotion changed since it was loaded. Refresh before saving.",
            409,
          );
        }
        database.prepare("DELETE FROM authority_promotion_targets WHERE promotion_id = ?").run(id);
      } else {
        database.prepare(`
          INSERT INTO authority_promotions (
            id, version, mode, code_normalized, name, title_ar, title_en,
            description_ar, description_en, state, discount_type, percentage_bps,
            fixed_halalas, max_discount_halalas, min_subtotal_halalas,
            usage_limit_total, usage_limit_per_customer, starts_at, ends_at,
            priority, applies_to_all, media_asset_id, public_badge, public_path,
            created_by, created_at, updated_by, updated_at
          ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id, input.mode, input.code, input.name, input.titleAr, input.titleEn,
          input.descriptionAr, input.descriptionEn, input.state, input.discountType,
          input.percentageBps, input.fixedHalalas, input.maxDiscountHalalas,
          input.minSubtotalHalalas, input.usageLimitTotal, input.usageLimitPerCustomer,
          input.startsAt, input.endsAt, input.priority, input.appliesToAll ? 1 : 0,
          input.mediaAssetId, input.publicBadge, input.publicPath,
          actorName, now, actorName, now,
        );
      }

      const insertTarget = database.prepare(`
        INSERT INTO authority_promotion_targets (promotion_id, target_type, target_key)
        VALUES (?, ?, ?)
      `);
      for (const target of input.targets) insertTarget.run(id, target.type, target.key);

      const row = database.prepare(`${promotionSelect}
        WHERE p.id = ? GROUP BY p.id
      `).get(id) as PromotionRow;
      return mapPromotionRow(database, row);
    });
  } catch (error) {
    if (error instanceof PromotionAuthorityError) throw error;
    if (error instanceof Error && /UNIQUE constraint failed: authority_promotions.code_normalized/i.test(error.message)) {
      throw new PromotionAuthorityError("coupon_code_conflict", "Coupon code is already in use.", 409);
    }
    throw error;
  }
}

type QuoteLine = { productSlug: string; sku: string; lineGrossHalalas: number };

function eligibleSubtotal(promotion: PromotionRecord, lines: QuoteLine[]) {
  if (promotion.appliesToAll) return lines.reduce((sum, line) => sum + line.lineGrossHalalas, 0);
  const targets = new Set(
    promotion.targets.map((target) => `${target.type}:${target.key.toLowerCase()}`),
  );
  return lines.reduce((sum, line) => {
    const eligible =
      targets.has(`product:${line.productSlug.toLowerCase()}`) ||
      targets.has(`sku:${line.sku.toLowerCase()}`);
    return sum + (eligible ? line.lineGrossHalalas : 0);
  }, 0);
}

function promotionDiscount(promotion: PromotionRecord, eligibleGrossHalalas: number) {
  const raw = promotion.discountType === "percentage"
    ? Math.floor((eligibleGrossHalalas * (promotion.percentageBps ?? 0)) / 10_000)
    : Math.min(eligibleGrossHalalas, promotion.fixedHalalas ?? 0);
  return Math.min(raw, promotion.maxDiscountHalalas ?? raw);
}

export function evaluatePromotionForQuote(input: {
  lines: QuoteLine[];
  subtotalGrossHalalas: number;
  couponCode?: string | null;
  now?: Date;
}): PromotionQuoteSnapshot | null {
  const database = getAuthorityDatabase();
  const now = (input.now ?? new Date()).toISOString();
  const normalizedCode = input.couponCode ? normalizePromotionCode(input.couponCode) : null;
  const rows = database.prepare(`${promotionSelect}
    WHERE p.state = 'active'
      AND p.starts_at <= ?
      AND (p.ends_at IS NULL OR p.ends_at > ?)
      AND ((? IS NULL AND p.mode = 'automatic') OR (? IS NOT NULL AND p.code_normalized = ?))
    GROUP BY p.id
    ORDER BY p.priority DESC, p.updated_at DESC
  `).all(now, now, normalizedCode, normalizedCode, normalizedCode) as PromotionRow[];

  const candidates = rows.map((row) => mapPromotionRow(database, row));
  let best: { promotion: PromotionRecord; discount: number } | null = null;
  for (const promotion of candidates) {
    if (
      input.subtotalGrossHalalas < promotion.minSubtotalHalalas ||
      (promotion.usageLimitTotal !== null && promotion.redemptionCount >= promotion.usageLimitTotal)
    ) continue;
    const discount = promotionDiscount(promotion, eligibleSubtotal(promotion, input.lines));
    if (discount > 0 && (!best || discount > best.discount)) best = { promotion, discount };
  }

  if (normalizedCode && !best) {
    throw new PromotionAuthorityError(
      "coupon_unavailable",
      "Coupon is invalid, inactive, outside its date window, or not eligible for this cart.",
      409,
    );
  }
  if (!best) return null;
  return {
    promotionId: best.promotion.id,
    promotionVersion: best.promotion.version,
    mode: best.promotion.mode,
    code: best.promotion.code,
    titleAr: best.promotion.titleAr,
    titleEn: best.promotion.titleEn,
    discountHalalas: best.discount,
  };
}

export function redeemPromotionForOrder(
  database: DatabaseSync,
  input: {
    promotion: PromotionQuoteSnapshot;
    quoteId: string;
    orderNumber: string;
    customerKeyHash: string;
    now?: string;
  },
) {
  const now = input.now ?? new Date().toISOString();
  const row = database.prepare(`
    SELECT version, state, starts_at, ends_at, usage_limit_total, usage_limit_per_customer
    FROM authority_promotions WHERE id = ?
  `).get(input.promotion.promotionId) as {
    version: number;
    state: PromotionState;
    starts_at: string;
    ends_at: string | null;
    usage_limit_total: number | null;
    usage_limit_per_customer: number | null;
  } | undefined;
  if (
    !row || row.version !== input.promotion.promotionVersion || row.state !== "active" ||
    row.starts_at > now || (row.ends_at !== null && row.ends_at <= now)
  ) {
    throw new PromotionAuthorityError(
      "promotion_stale",
      "Promotion changed or expired after the quote was issued.",
      409,
    );
  }
  const usage = database.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN customer_key_hash = ? THEN 1 ELSE 0 END) AS customer
    FROM authority_promotion_redemptions WHERE promotion_id = ?
  `).get(input.customerKeyHash, input.promotion.promotionId) as { total: number; customer: number | null };
  if (
    (row.usage_limit_total !== null && usage.total >= row.usage_limit_total) ||
    (row.usage_limit_per_customer !== null && (usage.customer ?? 0) >= row.usage_limit_per_customer)
  ) {
    throw new PromotionAuthorityError(
      "promotion_usage_exhausted",
      "Promotion usage limit was reached before the order could be created.",
      409,
    );
  }
  database.prepare(`
    INSERT INTO authority_promotion_redemptions (
      id, promotion_id, promotion_version, quote_id, order_number,
      customer_key_hash, discount_halalas, redeemed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `redemption_${randomUUID()}`,
    input.promotion.promotionId,
    input.promotion.promotionVersion,
    input.quoteId,
    input.orderNumber,
    input.customerKeyHash,
    input.promotion.discountHalalas,
    now,
  );
}
