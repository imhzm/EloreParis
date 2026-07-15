import "server-only";

import { randomUUID } from "node:crypto";
import {
  getAuthorityDatabase,
  runAuthorityTransaction,
} from "@/lib/authority-database";
import { syncAndDeliverNotificationsForOrders } from "@/lib/notification-dispatch";
import {
  initiateAuthorityPaymentLink,
  readAuthorityOrders,
} from "@/lib/order-authority";

const MAX_OUTBOX_ATTEMPTS = 8;
const DEFAULT_LEASE_MS = 60_000;
const MAX_BATCH_SIZE = 50;

type AuthorityOutboxStatus = "pending" | "processing" | "succeeded" | "failed";

type AuthorityOutboxRow = {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  dedupe_key: string;
  status: AuthorityOutboxStatus;
  attempts: number;
  next_attempt_at: string;
  payload_json: string;
  lease_token: string | null;
};

export type ClaimedAuthorityOutboxEvent = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  dedupeKey: string;
  attempts: number;
  payloadJson: string;
  leaseToken: string;
};

function normalizeBatchSize(limit: number | undefined) {
  if (!Number.isInteger(limit)) return 10;
  return Math.min(Math.max(limit ?? 10, 1), MAX_BATCH_SIZE);
}

function sanitizeOutboxError(error: unknown) {
  const message = error instanceof Error ? error.message : "Outbox processing failed.";
  return message.replace(/[\r\n\t]+/g, " ").slice(0, 1_000);
}

function retryDelayMs(attempts: number) {
  const exponential = Math.min(15_000 * 2 ** Math.max(attempts - 1, 0), 3_600_000);
  return exponential + Math.floor(Math.random() * 2_500);
}

export function claimAuthorityOutboxEvents({
  limit,
  aggregateId,
  leaseMs = DEFAULT_LEASE_MS,
}: {
  limit?: number;
  aggregateId?: string;
  leaseMs?: number;
} = {}) {
  const batchSize = normalizeBatchSize(limit);
  const normalizedAggregateId = aggregateId?.trim() || null;

  return runAuthorityTransaction((database) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const leaseExpiresAt = new Date(
      now.getTime() + Math.min(Math.max(leaseMs, 5_000), 300_000),
    ).toISOString();
    const rows = (normalizedAggregateId
      ? database.prepare(`
          SELECT id, aggregate_type, aggregate_id, event_type, dedupe_key,
                 status, attempts, next_attempt_at, payload_json, lease_token
          FROM authority_outbox
          WHERE aggregate_id = ? AND attempts < ? AND (
            (status IN ('pending', 'failed') AND next_attempt_at <= ?)
            OR (status = 'processing' AND lease_expires_at <= ?)
          )
          ORDER BY created_at, id
          LIMIT ?
        `).all(normalizedAggregateId, MAX_OUTBOX_ATTEMPTS, nowIso, nowIso, batchSize)
      : database.prepare(`
          SELECT id, aggregate_type, aggregate_id, event_type, dedupe_key,
                 status, attempts, next_attempt_at, payload_json, lease_token
          FROM authority_outbox
          WHERE attempts < ? AND (
            (status IN ('pending', 'failed') AND next_attempt_at <= ?)
            OR (status = 'processing' AND lease_expires_at <= ?)
          )
          ORDER BY created_at, id
          LIMIT ?
        `).all(MAX_OUTBOX_ATTEMPTS, nowIso, nowIso, batchSize)) as AuthorityOutboxRow[];

    const claimed: ClaimedAuthorityOutboxEvent[] = [];
    const claim = database.prepare(`
      UPDATE authority_outbox
      SET status = 'processing', attempts = attempts + 1,
          lease_token = ?, lease_expires_at = ?, updated_at = ?
      WHERE id = ? AND attempts < ? AND (
        (status IN ('pending', 'failed') AND next_attempt_at <= ?)
        OR (status = 'processing' AND lease_expires_at <= ?)
      )
    `);

    for (const row of rows) {
      const leaseToken = randomUUID();
      const result = claim.run(
        leaseToken,
        leaseExpiresAt,
        nowIso,
        row.id,
        MAX_OUTBOX_ATTEMPTS,
        nowIso,
        nowIso,
      ) as { changes: number | bigint };
      if (Number(result.changes) !== 1) continue;

      claimed.push({
        id: row.id,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        eventType: row.event_type,
        dedupeKey: row.dedupe_key,
        attempts: row.attempts + 1,
        payloadJson: row.payload_json,
        leaseToken,
      });
    }

    return claimed;
  });
}

export function markAuthorityOutboxSucceeded(event: ClaimedAuthorityOutboxEvent) {
  const now = new Date().toISOString();
  const result = getAuthorityDatabase().prepare(`
    UPDATE authority_outbox
    SET status = 'succeeded', completed_at = ?, last_error = NULL,
        lease_token = NULL, lease_expires_at = NULL, updated_at = ?
    WHERE id = ? AND status = 'processing' AND lease_token = ?
  `).run(now, now, event.id, event.leaseToken) as { changes: number | bigint };

  return Number(result.changes) === 1;
}

export function rescheduleAuthorityOutboxEvent(
  event: ClaimedAuthorityOutboxEvent,
  error: unknown,
  terminal = false,
) {
  const now = new Date();
  const exhausted = terminal || event.attempts >= MAX_OUTBOX_ATTEMPTS;
  const nextAttemptAt = exhausted
    ? now.toISOString()
    : new Date(now.getTime() + retryDelayMs(event.attempts)).toISOString();
  const result = getAuthorityDatabase().prepare(`
    UPDATE authority_outbox
    SET status = ?, attempts = ?, next_attempt_at = ?, last_error = ?,
        lease_token = NULL, lease_expires_at = NULL, updated_at = ?
    WHERE id = ? AND status = 'processing' AND lease_token = ?
  `).run(
    exhausted ? "failed" : "pending",
    exhausted ? MAX_OUTBOX_ATTEMPTS : event.attempts,
    nextAttemptAt,
    sanitizeOutboxError(error),
    now.toISOString(),
    event.id,
    event.leaseToken,
  ) as { changes: number | bigint };

  return Number(result.changes) === 1;
}

function parseOutboxOrderNumber(event: ClaimedAuthorityOutboxEvent) {
  let payload: unknown;
  try {
    payload = JSON.parse(event.payloadJson) as unknown;
  } catch {
    throw new Error("Outbox payload is not valid JSON.");
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    !("orderNumber" in payload) ||
    typeof payload.orderNumber !== "string" ||
    payload.orderNumber.trim().toUpperCase() !== event.aggregateId
  ) {
    throw new Error("Outbox order payload does not match its aggregate.");
  }
  return event.aggregateId;
}

async function processAuthorityOutboxEvent(event: ClaimedAuthorityOutboxEvent) {
  const orderNumber = parseOutboxOrderNumber(event);
  const order = (await readAuthorityOrders()).find(
    (candidate) => candidate.orderNumber === orderNumber,
  );
  if (!order) throw new Error("Outbox order is no longer available.");

  switch (event.eventType) {
    case "order.created":
      return;
    case "payment.link.requested":
      await initiateAuthorityPaymentLink(orderNumber);
      return;
    case "notification.order.received":
      await syncAndDeliverNotificationsForOrders([order]);
      return;
    default:
      throw new Error(`Unsupported outbox event type: ${event.eventType}`);
  }
}

export async function drainAuthorityOutbox({
  limit,
  aggregateId,
}: {
  limit?: number;
  aggregateId?: string;
} = {}) {
  const claimed = claimAuthorityOutboxEvents({ limit, aggregateId });
  const summary = { claimed: claimed.length, succeeded: 0, retried: 0, failed: 0 };

  for (const event of claimed) {
    try {
      await processAuthorityOutboxEvent(event);
      if (!markAuthorityOutboxSucceeded(event)) {
        throw new Error("Outbox lease ownership was lost before completion.");
      }
      summary.succeeded += 1;
    } catch (error) {
      const terminal =
        error instanceof Error &&
        (error.message.startsWith("Unsupported outbox event type:") ||
          error.message.includes("payload"));
      rescheduleAuthorityOutboxEvent(event, error, terminal);
      if (terminal || event.attempts >= MAX_OUTBOX_ATTEMPTS) summary.failed += 1;
      else summary.retried += 1;
    }
  }

  return summary;
}

export function getAuthorityOutboxSummary() {
  const rows = getAuthorityDatabase().prepare(`
    SELECT status, COUNT(*) AS count
    FROM authority_outbox
    GROUP BY status
  `).all() as Array<{ status: AuthorityOutboxStatus; count: number }>;
  const summary: Record<AuthorityOutboxStatus, number> = {
    pending: 0,
    processing: 0,
    succeeded: 0,
    failed: 0,
  };
  for (const row of rows) summary[row.status] = row.count;
  return summary;
}
