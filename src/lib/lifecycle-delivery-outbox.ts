import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  getAuthorityDatabase,
  runAuthorityTransaction,
} from "@/lib/authority-database";

const MAX_DELIVERY_ATTEMPTS = 6;
const DEFAULT_LEASE_MS = 60_000;
const MAX_BATCH_SIZE = 50;

export type LifecycleDeliveryType =
  | "newsletter_confirmation"
  | "back_in_stock_available";
export type LifecycleDeliveryStatus =
  | "pending"
  | "processing"
  | "accepted"
  | "failed"
  | "dead_letter";

type LifecycleDeliveryRow = {
  id: string;
  subscription_id: string;
  consent_revision: number;
  delivery_type: LifecycleDeliveryType;
  dispatch_key: string;
  dedupe_key: string;
  provider_key: string | null;
  provider_message_id: string | null;
  status: LifecycleDeliveryStatus;
  attempts: number;
  next_attempt_at: string;
  lease_token: string | null;
  lease_expires_at: string | null;
  last_error_code: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
};

type LifecycleSubscriptionDeliveryRow = {
  id: string;
  kind: "newsletter" | "back_in_stock";
  status: "subscribed" | "unsubscribed" | "fulfilled";
  contact_email: string;
  consent_revision: number;
  product_slug: string | null;
  sku: string | null;
};

export type ClaimedLifecycleDelivery = {
  id: string;
  subscriptionId: string;
  consentRevision: number;
  deliveryType: LifecycleDeliveryType;
  dispatchKey: string;
  dedupeKey: string;
  providerKey: string;
  attempts: number;
  leaseToken: string;
};

export class LifecycleDeliveryError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "lifecycle_delivery_invalid") {
    super(message);
    this.name = "LifecycleDeliveryError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function isProductionEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const appEnvironment = env.APP_ENV?.trim().toLowerCase();
  if (appEnvironment) return appEnvironment === "production";
  return env.NODE_ENV?.trim().toLowerCase() === "production";
}

function normalizeProviderKey(value: string | undefined) {
  const providerKey = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9][a-z0-9_.:-]{1,79}$/.test(providerKey) &&
    !/(replace|placeholder|example|changeme|todo|unassigned)/i.test(providerKey)
    ? providerKey
    : null;
}

export function getLifecycleDeliveryAvailability(
  env: NodeJS.ProcessEnv = process.env,
) {
  const providerKey = normalizeProviderKey(env.LIFECYCLE_DELIVERY_PROVIDER_KEY);
  const deliveryEnabled =
    env.LIFECYCLE_DELIVERY_ENABLED?.trim().toLowerCase() === "true";
  const providerEnabled =
    env.LIFECYCLE_DELIVERY_PROVIDER_ENABLED?.trim().toLowerCase() === "true";
  const productionGatesReady =
    !isProductionEnvironment(env) ||
    (env.PUBLIC_RELEASE_APPROVED?.trim().toLowerCase() === "true" &&
      env.PUBLIC_LEGAL_CONTENT_APPROVED?.trim().toLowerCase() === "true" &&
      env.LIFECYCLE_COLLECTION_ENABLED?.trim().toLowerCase() === "true");

  return deliveryEnabled && providerEnabled && providerKey && productionGatesReady
    ? { available: true as const, providerKey }
    : {
        available: false as const,
        providerKey,
        code: "lifecycle_delivery_unavailable",
      };
}

function normalizeDispatchKey(value: string) {
  const dispatchKey = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/.test(dispatchKey)) {
    throw new LifecycleDeliveryError("A valid lifecycle dispatch key is required.");
  }
  return dispatchKey;
}

function createDedupeKey(
  subscriptionId: string,
  consentRevision: number,
  deliveryType: LifecycleDeliveryType,
  dispatchKey: string,
) {
  return createHash("sha256")
    .update(`${subscriptionId}|${consentRevision}|${deliveryType}|${dispatchKey}`)
    .digest("hex");
}

function readSubscriptionForDelivery(database: DatabaseSync, subscriptionId: string) {
  return database.prepare(`
    SELECT id, kind, status, contact_email, consent_revision, product_slug, sku
    FROM authority_lifecycle_subscriptions
    WHERE id = ?
  `).get(subscriptionId) as LifecycleSubscriptionDeliveryRow | undefined;
}

function readDelivery(database: DatabaseSync, id: string) {
  return database.prepare(`
    SELECT * FROM authority_lifecycle_delivery_outbox WHERE id = ?
  `).get(id) as LifecycleDeliveryRow | undefined;
}

export function enqueueLifecycleDeliveryWithDatabase(
  database: DatabaseSync,
  {
    subscriptionId,
    deliveryType,
    dispatchKey,
  }: {
    subscriptionId: string;
    deliveryType: LifecycleDeliveryType;
    dispatchKey: string;
  },
) {
  const subscription = readSubscriptionForDelivery(database, subscriptionId.trim());
  if (!subscription || subscription.status !== "subscribed") {
    throw new LifecycleDeliveryError(
      "An active lifecycle subscription is required.",
      409,
      "lifecycle_consent_inactive",
    );
  }
  if (
    (deliveryType === "newsletter_confirmation" && subscription.kind !== "newsletter") ||
    (deliveryType === "back_in_stock_available" &&
      subscription.kind !== "back_in_stock")
  ) {
    throw new LifecycleDeliveryError(
      "The lifecycle delivery type does not match its subscription.",
    );
  }

  const normalizedDispatchKey = normalizeDispatchKey(dispatchKey);
  const dedupeKey = createDedupeKey(
    subscription.id,
    subscription.consent_revision,
    deliveryType,
    normalizedDispatchKey,
  );
  const existing = database.prepare(`
    SELECT * FROM authority_lifecycle_delivery_outbox WHERE dedupe_key = ?
  `).get(dedupeKey) as LifecycleDeliveryRow | undefined;
  if (existing) return { job: existing, created: false };

  const id = randomUUID();
  const now = new Date().toISOString();
  database.prepare(`
    INSERT INTO authority_lifecycle_delivery_outbox (
      id, subscription_id, consent_revision, delivery_type, dispatch_key,
      dedupe_key, provider_key, status, attempts, next_attempt_at,
      lease_token, lease_expires_at, last_error_code, created_at, updated_at,
      accepted_at
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending', 0, ?, NULL, NULL, NULL, ?, ?, NULL)
  `).run(
    id,
    subscription.id,
    subscription.consent_revision,
    deliveryType,
    normalizedDispatchKey,
    dedupeKey,
    now,
    now,
    now,
  );
  return { job: readDelivery(database, id) as LifecycleDeliveryRow, created: true };
}

export function enqueueBackInStockDelivery({
  subscriptionId,
  dispatchKey,
}: {
  subscriptionId: string;
  dispatchKey: string;
}) {
  return runAuthorityTransaction((database) =>
    enqueueLifecycleDeliveryWithDatabase(database, {
      subscriptionId,
      deliveryType: "back_in_stock_available",
      dispatchKey,
    }),
  );
}

export function cancelLifecycleDeliveriesForSubscriptionWithDatabase(
  database: DatabaseSync,
  subscriptionId: string,
) {
  const now = new Date().toISOString();
  const result = database.prepare(`
    UPDATE authority_lifecycle_delivery_outbox
    SET status = 'dead_letter', last_error_code = 'consent_withdrawn',
        lease_token = NULL, lease_expires_at = NULL, updated_at = ?
    WHERE subscription_id = ?
      AND status IN ('pending', 'processing', 'failed')
  `).run(now, subscriptionId) as { changes: number | bigint };
  return Number(result.changes);
}

function normalizeBatchSize(limit: number | undefined) {
  if (!Number.isSafeInteger(limit)) return 10;
  return Math.max(1, Math.min(MAX_BATCH_SIZE, limit as number));
}

export function claimLifecycleDeliveryJobs({
  limit,
  leaseMs = DEFAULT_LEASE_MS,
  now = new Date(),
}: {
  limit?: number;
  leaseMs?: number;
  now?: Date;
} = {}) {
  const availability = getLifecycleDeliveryAvailability();
  if (!availability.available) {
    throw new LifecycleDeliveryError(
      "Lifecycle delivery processing is not enabled for this runtime.",
      503,
      availability.code,
    );
  }
  const batchSize = normalizeBatchSize(limit);
  const nowIso = now.toISOString();
  const leaseExpiresAt = new Date(
    now.getTime() + Math.max(5_000, Math.min(300_000, leaseMs)),
  ).toISOString();

  return runAuthorityTransaction((database) => {
    const rows = database.prepare(`
      SELECT d.*
      FROM authority_lifecycle_delivery_outbox d
      INNER JOIN authority_lifecycle_subscriptions s ON s.id = d.subscription_id
      WHERE d.attempts < ?
        AND s.status = 'subscribed'
        AND s.consent_revision = d.consent_revision
        AND (
          (d.status IN ('pending', 'failed') AND d.next_attempt_at <= ?)
          OR (d.status = 'processing' AND d.lease_expires_at <= ?)
        )
      ORDER BY d.created_at, d.id
      LIMIT ?
    `).all(MAX_DELIVERY_ATTEMPTS, nowIso, nowIso, batchSize) as LifecycleDeliveryRow[];
    const claimed: ClaimedLifecycleDelivery[] = [];

    for (const row of rows) {
      const leaseToken = randomUUID();
      const result = database.prepare(`
        UPDATE authority_lifecycle_delivery_outbox
        SET status = 'processing', attempts = attempts + 1, provider_key = ?,
            lease_token = ?, lease_expires_at = ?, updated_at = ?
        WHERE id = ? AND attempts < ?
          AND (
            (status IN ('pending', 'failed') AND next_attempt_at <= ?)
            OR (status = 'processing' AND lease_expires_at <= ?)
          )
          AND EXISTS (
            SELECT 1 FROM authority_lifecycle_subscriptions s
            WHERE s.id = subscription_id AND s.status = 'subscribed'
              AND s.consent_revision = authority_lifecycle_delivery_outbox.consent_revision
          )
      `).run(
        availability.providerKey,
        leaseToken,
        leaseExpiresAt,
        nowIso,
        row.id,
        MAX_DELIVERY_ATTEMPTS,
        nowIso,
        nowIso,
      ) as { changes: number | bigint };
      if (Number(result.changes) !== 1) continue;
      claimed.push({
        id: row.id,
        subscriptionId: row.subscription_id,
        consentRevision: row.consent_revision,
        deliveryType: row.delivery_type,
        dispatchKey: row.dispatch_key,
        dedupeKey: row.dedupe_key,
        providerKey: availability.providerKey,
        attempts: row.attempts + 1,
        leaseToken,
      });
    }
    return claimed;
  });
}

function sanitizeErrorCode(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^[a-z][a-z0-9_:-]{0,79}$/.test(normalized)
    ? normalized
    : "delivery_failed";
}

function retryDelayMs(event: ClaimedLifecycleDelivery) {
  const exponential = Math.min(
    30_000 * 2 ** Math.max(event.attempts - 1, 0),
    6 * 60 * 60 * 1_000,
  );
  const jitter = Number.parseInt(event.id.replaceAll("-", "").slice(-4), 16) % 5_000;
  return exponential + jitter;
}

export function markLifecycleDeliveryFailed(
  event: ClaimedLifecycleDelivery,
  {
    errorCode,
    retryable = true,
    now = new Date(),
  }: { errorCode: string; retryable?: boolean; now?: Date },
) {
  const deadLetter = !retryable || event.attempts >= MAX_DELIVERY_ATTEMPTS;
  const nextAttemptAt = deadLetter
    ? now.toISOString()
    : new Date(now.getTime() + retryDelayMs(event)).toISOString();
  const result = getAuthorityDatabase().prepare(`
    UPDATE authority_lifecycle_delivery_outbox
    SET status = ?, next_attempt_at = ?, last_error_code = ?,
        lease_token = NULL, lease_expires_at = NULL, updated_at = ?
    WHERE id = ? AND status = 'processing' AND lease_token = ?
  `).run(
    deadLetter ? "dead_letter" : "failed",
    nextAttemptAt,
    sanitizeErrorCode(errorCode),
    now.toISOString(),
    event.id,
    event.leaseToken,
  ) as { changes: number | bigint };
  return Number(result.changes) === 1;
}

function normalizeProviderMessageId(value: string) {
  const providerMessageId = value.trim();
  if (
    !providerMessageId ||
    providerMessageId.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(providerMessageId)
  ) {
    throw new LifecycleDeliveryError(
      "The provider message id is invalid.",
      502,
      "provider_response_invalid",
    );
  }
  return providerMessageId;
}

export function markLifecycleDeliveryAccepted(
  event: ClaimedLifecycleDelivery,
  providerMessageId: string,
  acceptedAt = new Date(),
) {
  const normalizedProviderMessageId = normalizeProviderMessageId(providerMessageId);
  return runAuthorityTransaction((database) => {
    const acceptedAtIso = acceptedAt.toISOString();
    const result = database.prepare(`
      UPDATE authority_lifecycle_delivery_outbox
      SET status = 'accepted', provider_message_id = ?, accepted_at = ?,
          last_error_code = NULL,
          lease_token = NULL, lease_expires_at = NULL, updated_at = ?
      WHERE id = ? AND status = 'processing' AND lease_token = ?
    `).run(
      normalizedProviderMessageId,
      acceptedAtIso,
      acceptedAtIso,
      event.id,
      event.leaseToken,
    ) as { changes: number | bigint };
    if (Number(result.changes) !== 1) return false;

    return true;
  });
}

/** @deprecated Provider acceptance is not proof of final delivery. */
export function markLifecycleDeliveryDelivered(
  event: ClaimedLifecycleDelivery,
  deliveredAt = new Date(),
) {
  return markLifecycleDeliveryAccepted(
    event,
    `legacy-accepted:${event.id}`,
    deliveredAt,
  );
}

function maskContact(email: string) {
  if (!email) return "withdrawn";
  const [localPart, domain = ""] = email.split("@");
  const [domainName, ...suffix] = domain.split(".");
  return `${localPart.slice(0, 1)}***@${domainName.slice(0, 1)}***${
    suffix.length ? `.${suffix.join(".")}` : ""
  }`;
}

export function getLifecycleDeliveryOpsSnapshot(limit = 50) {
  const boundedLimit = Math.max(1, Math.min(100, Math.trunc(limit) || 50));
  const database = getAuthorityDatabase();
  const metricRows = database.prepare(`
    SELECT status, COUNT(*) AS count
    FROM authority_lifecycle_delivery_outbox
    GROUP BY status
  `).all() as Array<{ status: LifecycleDeliveryStatus; count: number }>;
  const metric = (status: LifecycleDeliveryStatus) =>
    metricRows.find((row) => row.status === status)?.count ?? 0;
  const rows = database.prepare(`
    SELECT d.*, s.contact_email, s.product_slug, s.sku
    FROM authority_lifecycle_delivery_outbox d
    INNER JOIN authority_lifecycle_subscriptions s ON s.id = d.subscription_id
    ORDER BY d.updated_at DESC, d.id DESC
    LIMIT ?
  `).all(boundedLimit) as Array<
    LifecycleDeliveryRow & {
      contact_email: string;
      product_slug: string | null;
      sku: string | null;
    }
  >;
  const availability = getLifecycleDeliveryAvailability();

  return {
    availability,
    metrics: {
      pending: metric("pending"),
      processing: metric("processing"),
      accepted: metric("accepted"),
      failed: metric("failed"),
      deadLetter: metric("dead_letter"),
    },
    recent: rows.map((row) => ({
      id: row.id,
      subscriptionId: row.subscription_id,
      deliveryType: row.delivery_type,
      providerKey: row.provider_key,
      status: row.status,
      attempts: row.attempts,
      maxAttempts: MAX_DELIVERY_ATTEMPTS,
      nextAttemptAt: row.next_attempt_at,
      leaseExpiresAt: row.lease_expires_at,
      lastErrorCode: row.last_error_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      acceptedAt: row.accepted_at,
      contactHint: maskContact(row.contact_email),
      productSlug: row.product_slug,
      sku: row.sku,
    })),
  };
}

export type LifecycleDeliveryOpsSnapshot = ReturnType<
  typeof getLifecycleDeliveryOpsSnapshot
>;
