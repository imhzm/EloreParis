import "server-only";

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  getAuthorityDatabase,
  runAuthorityTransaction,
} from "@/lib/authority-database";
import { getActiveCatalogAuthority } from "@/lib/catalog-authority";
import {
  cancelLifecycleDeliveriesForSubscriptionWithDatabase,
  enqueueLifecycleDeliveryWithDatabase,
  type ClaimedLifecycleDelivery,
} from "@/lib/lifecycle-delivery-outbox";

const MAX_LIFECYCLE_REQUEST_BYTES = 8 * 1024;
const DEFAULT_LOCAL_POLICY_VERSION = "local-development-v1";
const DEFAULT_LOCAL_UNSUBSCRIBE_SECRET =
  "local-development-lifecycle-unsubscribe-secret";
const UNSUBSCRIBE_TOKEN_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f-]{27,45})\.([A-Za-z0-9_-]{43})$/i;

export type LifecycleKind = "newsletter" | "back_in_stock";
export type LifecycleStatus = "subscribed" | "unsubscribed" | "fulfilled";
export type LifecycleLocale = "ar" | "en";

export class LifecycleAuthorityError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "lifecycle_request_invalid") {
    super(message);
    this.name = "LifecycleAuthorityError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

type LifecycleRow = {
  id: string;
  kind: LifecycleKind;
  contact_email: string;
  contact_hash: string;
  scope_key: string;
  product_slug: string | null;
  sku: string | null;
  source: string;
  status: LifecycleStatus;
  consent_policy_version: string;
  locale: LifecycleLocale;
  consent_action: string;
  consent_granted_at: string;
  consent_withdrawn_at: string | null;
  fulfilled_at: string | null;
  unsubscribe_token_hash: string;
  created_at: string;
  updated_at: string;
  consent_revision: number;
};

type SubscribeLifecycleInput = {
  kind: LifecycleKind;
  email: string;
  consent: boolean;
  source: string;
  locale: LifecycleLocale;
  productSlug?: string;
  sku?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isProductionEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const appEnvironment = env.APP_ENV?.trim().toLowerCase();
  if (appEnvironment) return appEnvironment === "production";
  return env.NODE_ENV?.trim().toLowerCase() === "production";
}

function configuredValue(value: string | undefined, minLength: number) {
  const normalized = value?.trim() ?? "";
  if (
    normalized.length < minLength ||
    /(replace|placeholder|example|changeme|todo|your-|set-this)/i.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function runtimeSecrets(env: NodeJS.ProcessEnv = process.env) {
  const production = isProductionEnvironment(env);
  return {
    policyVersion:
      configuredValue(env.LIFECYCLE_CONSENT_POLICY_VERSION, 3) ??
      (production ? null : DEFAULT_LOCAL_POLICY_VERSION),
    unsubscribeSecret:
      configuredValue(env.LIFECYCLE_UNSUBSCRIBE_SECRET, 32) ??
      (production ? null : DEFAULT_LOCAL_UNSUBSCRIBE_SECRET),
  };
}

export function getLifecycleCollectionAvailability(
  env: NodeJS.ProcessEnv = process.env,
) {
  if (!isProductionEnvironment(env)) return { available: true as const };

  const { policyVersion, unsubscribeSecret } = runtimeSecrets(env);
  const enabled = env.LIFECYCLE_COLLECTION_ENABLED?.trim().toLowerCase() === "true";
  const releaseApproved = env.PUBLIC_RELEASE_APPROVED?.trim().toLowerCase() === "true";
  const legalApproved =
    env.PUBLIC_LEGAL_CONTENT_APPROVED?.trim().toLowerCase() === "true";
  return enabled && releaseApproved && legalApproved && policyVersion && unsubscribeSecret
    ? { available: true as const }
    : {
        available: false as const,
        code: "lifecycle_collection_unavailable",
      };
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  const [localPart, domain, ...rest] = email.split("@");
  const validDomain =
    domain &&
    domain.length <= 253 &&
    domain.includes(".") &&
    domain.split(".").every(
      (label) =>
        label.length >= 1 &&
        label.length <= 63 &&
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    );
  if (
    rest.length > 0 ||
    !localPart ||
    localPart.length > 64 ||
    email.length > 254 ||
    !/^[^\s<>()[\]\\,;:"]+$/.test(localPart) ||
    !validDomain
  ) {
    throw new LifecycleAuthorityError(
      "A valid email address is required.",
      400,
      "email_invalid",
    );
  }
  return email;
}

function normalizeSource(value: string) {
  const source = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.:-]{1,79}$/.test(source)) {
    throw new LifecycleAuthorityError("A valid lifecycle source is required.");
  }
  return source;
}

function normalizeProductSlug(value: string | undefined) {
  const slug = value?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9](?:[a-z0-9-]{0,158}[a-z0-9])?$/.test(slug)) {
    throw new LifecycleAuthorityError("A valid productSlug is required.");
  }
  return slug;
}

function normalizeSku(value: string | undefined) {
  const sku = value?.trim().toUpperCase() ?? "";
  if (!/^[A-Z0-9][A-Z0-9._-]{0,159}$/.test(sku)) {
    throw new LifecycleAuthorityError("A valid sku is required.");
  }
  return sku;
}

function assertActiveCatalogTarget(productSlug: string, sku: string) {
  if (!isProductionEnvironment()) return;
  const catalog = getActiveCatalogAuthority();
  const product = catalog?.payload.products.find(
    (item) =>
      item.status === "approved" &&
      item.slug.trim().toLowerCase() === productSlug.toLowerCase(),
  );
  const variant = product?.variants.find(
    (item) =>
      item.status === "approved" &&
      item.sku.trim().toUpperCase() === sku.toUpperCase(),
  );
  if (!product || !variant) {
    throw new LifecycleAuthorityError(
      "The back-in-stock target is not available in the active catalog.",
      404,
      "back_in_stock_target_not_found",
    );
  }
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function createUnsubscribeToken(row: Pick<LifecycleRow, "id" | "kind" | "scope_key">) {
  const { unsubscribeSecret } = runtimeSecrets();
  if (!unsubscribeSecret) {
    throw new LifecycleAuthorityError(
      "Lifecycle consent runtime is not configured.",
      503,
      "lifecycle_runtime_unavailable",
    );
  }
  const signature = createHmac("sha256", unsubscribeSecret)
    .update(`${row.id}|${row.kind}|${row.scope_key}`)
    .digest("base64url");
  return `${row.id}.${signature}`;
}

function publicSubscription(row: LifecycleRow) {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    productSlug: row.product_slug,
    sku: row.sku,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readLifecycleRow(id: string) {
  return getAuthorityDatabase()
    .prepare("SELECT * FROM authority_lifecycle_subscriptions WHERE id = ?")
    .get(id) as LifecycleRow | undefined;
}

export function subscribeLifecycle(input: SubscribeLifecycleInput) {
  if (input.consent !== true) {
    throw new LifecycleAuthorityError(
      "Affirmative consent is required.",
      400,
      "consent_required",
    );
  }
  if (input.locale !== "ar" && input.locale !== "en") {
    throw new LifecycleAuthorityError("A supported locale is required.");
  }

  const email = normalizeEmail(input.email);
  const source = normalizeSource(input.source);
  const productSlug =
    input.kind === "back_in_stock"
      ? normalizeProductSlug(input.productSlug)
      : null;
  const sku = input.kind === "back_in_stock" ? normalizeSku(input.sku) : null;
  const scopeKey = input.kind === "newsletter" ? "newsletter" : `${productSlug}:${sku}`;
  if (input.kind === "back_in_stock") {
    assertActiveCatalogTarget(productSlug as string, sku as string);
  }
  const contactHash = hashValue(email);
  const { policyVersion, unsubscribeSecret } = runtimeSecrets();
  if (!policyVersion || !unsubscribeSecret) {
    throw new LifecycleAuthorityError(
      "Lifecycle consent runtime is not configured.",
      503,
      "lifecycle_runtime_unavailable",
    );
  }

  const result = runAuthorityTransaction((database) => {
    const existing = database.prepare(`
      SELECT * FROM authority_lifecycle_subscriptions
      WHERE kind = ? AND contact_hash = ? AND scope_key = ?
    `).get(input.kind, contactHash, scopeKey) as LifecycleRow | undefined;

    if (existing?.status === "subscribed") {
      const token = createUnsubscribeToken(existing);
      const tokenHash = hashValue(token);
      if (!constantTimeEqual(tokenHash, existing.unsubscribe_token_hash)) {
        database.prepare(`
          UPDATE authority_lifecycle_subscriptions
          SET unsubscribe_token_hash = ?
          WHERE id = ?
        `).run(tokenHash, existing.id);
        existing.unsubscribe_token_hash = tokenHash;
      }
      if (existing.kind === "newsletter") {
        enqueueLifecycleDeliveryWithDatabase(database, {
          subscriptionId: existing.id,
          deliveryType: "newsletter_confirmation",
          dispatchKey: `consent-${existing.consent_revision}`,
        });
      }
      return { row: existing, created: false };
    }

    const now = new Date().toISOString();
    const id = existing?.id ?? randomUUID();
    const token = createUnsubscribeToken({ id, kind: input.kind, scope_key: scopeKey });
    if (existing) {
      database.prepare(`
        UPDATE authority_lifecycle_subscriptions
        SET contact_email = ?, source = ?, status = 'subscribed',
            consent_policy_version = ?, locale = ?, consent_action = ?,
            consent_granted_at = ?, consent_withdrawn_at = NULL,
            fulfilled_at = NULL, unsubscribe_token_hash = ?,
            consent_revision = consent_revision + 1, updated_at = ?
        WHERE id = ?
      `).run(
        email,
        source,
        policyVersion,
        input.locale,
        "affirmative_form_submit",
        now,
        hashValue(token),
        now,
        id,
      );
    } else {
      database.prepare(`
        INSERT INTO authority_lifecycle_subscriptions (
          id, kind, contact_email, contact_hash, scope_key, product_slug, sku,
          source, status, consent_policy_version, locale, consent_action,
          consent_granted_at, consent_withdrawn_at, fulfilled_at,
          unsubscribe_token_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'subscribed', ?, ?, ?, ?, NULL, NULL, ?, ?, ?)
      `).run(
        id,
        input.kind,
        email,
        contactHash,
        scopeKey,
        productSlug,
        sku,
        source,
        policyVersion,
        input.locale,
        "affirmative_form_submit",
        now,
        hashValue(token),
        now,
        now,
      );
    }
    const row = readLifecycleRow(id) as LifecycleRow;
    if (row.kind === "newsletter") {
      enqueueLifecycleDeliveryWithDatabase(database, {
        subscriptionId: row.id,
        deliveryType: "newsletter_confirmation",
        dispatchKey: `consent-${row.consent_revision}`,
      });
    }
    return { row, created: !existing };
  });

  return {
    subscription: publicSubscription(result.row),
    unsubscribeToken: createUnsubscribeToken(result.row),
    created: result.created,
  };
}

export function createLifecycleUnsubscribeLink({
  unsubscribeToken,
  locale,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL,
}: {
  unsubscribeToken: string;
  locale: LifecycleLocale;
  baseUrl?: string;
}) {
  if (!UNSUBSCRIBE_TOKEN_PATTERN.test(unsubscribeToken.trim())) {
    throw new LifecycleAuthorityError(
      "The unsubscribe token is invalid.",
      400,
      "unsubscribe_token_invalid",
    );
  }
  let url: URL;
  try {
    url = new URL(`/${locale}/unsubscribe`, baseUrl?.trim());
  } catch {
    throw new LifecycleAuthorityError(
      "The public site URL is not configured.",
      503,
      "lifecycle_runtime_unavailable",
    );
  }
  if (isProductionEnvironment() && url.protocol !== "https:") {
    throw new LifecycleAuthorityError(
      "The public unsubscribe URL must use HTTPS.",
      503,
      "lifecycle_runtime_unavailable",
    );
  }
  url.search = "";
  url.hash = `token=${encodeURIComponent(unsubscribeToken.trim())}`;
  return url.toString();
}

export function resolveLifecycleDeliveryEnvelope(
  event: ClaimedLifecycleDelivery,
) {
  const row = getAuthorityDatabase().prepare(`
    SELECT
      s.*,
      d.status AS delivery_status,
      d.delivery_type AS claimed_delivery_type,
      d.dispatch_key AS claimed_dispatch_key,
      d.dedupe_key AS claimed_dedupe_key,
      d.provider_key AS claimed_provider_key,
      d.attempts AS delivery_attempts,
      d.lease_token AS delivery_lease_token,
      d.lease_expires_at AS delivery_lease_expires_at
    FROM authority_lifecycle_delivery_outbox d
    INNER JOIN authority_lifecycle_subscriptions s ON s.id = d.subscription_id
    WHERE d.id = ? AND d.subscription_id = ? AND d.consent_revision = ?
    LIMIT 1
  `).get(
    event.id,
    event.subscriptionId,
    event.consentRevision,
  ) as
    | (LifecycleRow & {
        delivery_status: string;
        claimed_delivery_type: string;
        claimed_dispatch_key: string;
        claimed_dedupe_key: string;
        claimed_provider_key: string | null;
        delivery_attempts: number;
        delivery_lease_token: string | null;
        delivery_lease_expires_at: string | null;
      })
    | undefined;

  const leaseIsCurrent = Boolean(
    row?.delivery_lease_token &&
      row.delivery_lease_expires_at &&
      Date.parse(row.delivery_lease_expires_at) > Date.now() &&
      constantTimeEqual(row.delivery_lease_token, event.leaseToken),
  );
  if (
    !row ||
    row.delivery_status !== "processing" ||
    !leaseIsCurrent ||
    row.claimed_delivery_type !== event.deliveryType ||
    row.claimed_dispatch_key !== event.dispatchKey ||
    row.claimed_dedupe_key !== event.dedupeKey ||
    row.claimed_provider_key !== event.providerKey ||
    row.delivery_attempts !== event.attempts
  ) {
    throw new LifecycleAuthorityError(
      "The lifecycle delivery lease is no longer valid.",
      409,
      "lifecycle_delivery_lease_invalid",
    );
  }
  if (
    row.status !== "subscribed" ||
    row.consent_revision !== event.consentRevision ||
    !row.contact_email
  ) {
    throw new LifecycleAuthorityError(
      "Lifecycle consent is no longer active.",
      409,
      "lifecycle_consent_inactive",
    );
  }

  const unsubscribeToken = createUnsubscribeToken(row);
  return {
    deliveryType: event.deliveryType,
    destinationEmail: row.contact_email,
    locale: row.locale,
    productSlug: row.product_slug,
    sku: row.sku,
    unsubscribeUrl: createLifecycleUnsubscribeLink({
      unsubscribeToken,
      locale: row.locale,
    }),
  };
}

export function unsubscribeLifecycle(token: string) {
  const match = UNSUBSCRIBE_TOKEN_PATTERN.exec(token.trim());
  if (!match) {
    throw new LifecycleAuthorityError(
      "The unsubscribe token is invalid.",
      400,
      "unsubscribe_token_invalid",
    );
  }

  return runAuthorityTransaction((database) => {
    const row = database.prepare(
      "SELECT * FROM authority_lifecycle_subscriptions WHERE id = ?",
    ).get(match[1]) as LifecycleRow | undefined;
    if (!row) return { accepted: true };

    const expectedToken = createUnsubscribeToken(row);
    if (
      !constantTimeEqual(token.trim(), expectedToken) ||
      !constantTimeEqual(hashValue(token.trim()), row.unsubscribe_token_hash)
    ) {
      return { accepted: true };
    }
    if (row.status === "unsubscribed") return { accepted: true };

    const now = new Date().toISOString();
    cancelLifecycleDeliveriesForSubscriptionWithDatabase(database, row.id);
    database.prepare(`
      UPDATE authority_lifecycle_subscriptions
      SET status = 'unsubscribed', contact_email = '',
          consent_withdrawn_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, row.id);
    return { accepted: true };
  });
}

export function fulfillBackInStockSubscription({
  id,
  fulfilledAt = new Date().toISOString(),
}: {
  id: string;
  fulfilledAt?: string;
}) {
  if (Number.isNaN(Date.parse(fulfilledAt))) {
    throw new LifecycleAuthorityError("fulfilledAt must be a valid timestamp.");
  }
  return runAuthorityTransaction((database) => {
    const row = database.prepare(
      "SELECT * FROM authority_lifecycle_subscriptions WHERE id = ?",
    ).get(id.trim()) as LifecycleRow | undefined;
    if (!row || row.kind !== "back_in_stock") {
      throw new LifecycleAuthorityError(
        "Back-in-stock subscription was not found.",
        404,
        "lifecycle_subscription_not_found",
      );
    }
    if (row.status === "unsubscribed") {
      throw new LifecycleAuthorityError(
        "Withdrawn consent cannot be fulfilled.",
        409,
        "lifecycle_consent_withdrawn",
      );
    }
    if (row.status === "fulfilled") return publicSubscription(row);

    const normalizedFulfilledAt = new Date(fulfilledAt).toISOString();
    database.prepare(`
      UPDATE authority_lifecycle_subscriptions
      SET status = 'fulfilled', fulfilled_at = ?, updated_at = ?
      WHERE id = ?
    `).run(normalizedFulfilledAt, normalizedFulfilledAt, row.id);
    return publicSubscription(readLifecycleRow(row.id) as LifecycleRow);
  });
}

function maskEmail(email: string) {
  if (!email) return "withdrawn";
  const [localPart, domain] = email.split("@");
  const domainParts = domain.split(".");
  const domainName = domainParts.shift() ?? "";
  const suffix = domainParts.join(".");
  return `${localPart.slice(0, 1)}***@${domainName.slice(0, 1)}***${suffix ? `.${suffix}` : ""}`;
}

export function getLifecycleOpsSnapshot(limit = 50) {
  const boundedLimit = Math.max(1, Math.min(100, Math.trunc(limit) || 50));
  const database = getAuthorityDatabase();
  const metricRows = database.prepare(`
    SELECT kind, status, COUNT(*) AS count
    FROM authority_lifecycle_subscriptions
    GROUP BY kind, status
  `).all() as Array<{ kind: LifecycleKind; status: LifecycleStatus; count: number }>;
  const count = (kind?: LifecycleKind, status?: LifecycleStatus) =>
    metricRows
      .filter((row) => (!kind || row.kind === kind) && (!status || row.status === status))
      .reduce((total, row) => total + row.count, 0);
  const rows = database.prepare(`
    SELECT * FROM authority_lifecycle_subscriptions
    ORDER BY updated_at DESC, id DESC
    LIMIT ?
  `).all(boundedLimit) as LifecycleRow[];

  return {
    metrics: {
      total: count(),
      subscribed: count(undefined, "subscribed"),
      unsubscribed: count(undefined, "unsubscribed"),
      fulfilled: count(undefined, "fulfilled"),
      newsletterSubscribed: count("newsletter", "subscribed"),
      backInStockSubscribed: count("back_in_stock", "subscribed"),
    },
    recent: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      contactHint: maskEmail(row.contact_email),
      source: row.source,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      consentGrantedAt: row.consent_granted_at,
      consentWithdrawnAt: row.consent_withdrawn_at,
      fulfilledAt: row.fulfilled_at,
      productSlug: row.product_slug,
      sku: row.sku,
      consentPolicyVersion: row.consent_policy_version,
      locale: row.locale,
      consentEvidence: {
        action: row.consent_action,
        source: row.source,
      },
    })),
  };
}

export async function readLifecycleRequestBody(
  request: Request,
  allowedKeys: readonly string[],
) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    throw new LifecycleAuthorityError(
      "Lifecycle requests require application/json.",
      415,
      "unsupported_media_type",
    );
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_LIFECYCLE_REQUEST_BYTES) {
    throw new LifecycleAuthorityError(
      "Lifecycle request payload is too large.",
      413,
      "lifecycle_payload_too_large",
    );
  }
  if (!request.body) {
    throw new LifecycleAuthorityError("Lifecycle request payload is empty.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let bodyText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_LIFECYCLE_REQUEST_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new LifecycleAuthorityError(
        "Lifecycle request payload is too large.",
        413,
        "lifecycle_payload_too_large",
      );
    }
    bodyText += decoder.decode(value, { stream: true });
  }
  bodyText += decoder.decode();

  let body: unknown;
  try {
    body = JSON.parse(bodyText) as unknown;
  } catch {
    throw new LifecycleAuthorityError("Lifecycle request payload is invalid JSON.");
  }
  if (!isRecord(body) || Object.keys(body).some((key) => !allowedKeys.includes(key))) {
    throw new LifecycleAuthorityError(
      "Lifecycle request payload contains unsupported fields.",
    );
  }
  return body;
}
