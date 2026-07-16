import "server-only";

import { createHash } from "node:crypto";
import { getAuthorityDatabase, runAuthorityTransaction } from "@/lib/authority-database";

// Unlike the ops login throttle, which only counts *failed* attempts, public
// endpoints must count every attempt: a successful subscribe is still an abuse
// primitive when it is someone else's address being enrolled, and every accepted
// call costs a durable row.
export type PublicRequestThrottlePolicy = {
  maxRequests: number;
  windowMs: number;
  blockMs: number;
};

export const LIFECYCLE_COLLECTION_THROTTLE_POLICY: PublicRequestThrottlePolicy = {
  maxRequests: 8,
  windowMs: 10 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
};

export const LIFECYCLE_WITHDRAWAL_THROTTLE_POLICY: PublicRequestThrottlePolicy = {
  // Withdrawal is deliberately more generous than collection: a person clicking
  // an unsubscribe link twice must never be turned away.
  maxRequests: 20,
  windowMs: 10 * 60 * 1000,
  blockMs: 10 * 60 * 1000,
};

type PublicRequestThrottleTargetType = "ip_address" | "subject";

type PublicRequestThrottleTarget = {
  key: string;
  label: string;
  type: PublicRequestThrottleTargetType;
};

type PublicRequestThrottleRecord = {
  throttle_key: string;
  request_count: number;
  window_started_at: string;
  blocked_until: string | null;
};

export class PublicRequestThrottleError extends Error {
  statusCode: number;
  code: string;
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many requests. Wait briefly before trying again.");
    this.name = "PublicRequestThrottleError";
    this.statusCode = 429;
    this.code = "request_throttled";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);

    if (firstIp) return firstIp;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}

function maskIpAddress(value: string) {
  if (value.includes(":")) {
    return `${value.split(":").slice(0, 2).join(":")}:*`;
  }

  const segments = value.split(".");
  return segments.length === 4
    ? `${segments[0]}.${segments[1]}.${segments[2]}.*`
    : value;
}

function createThrottleKey(
  scope: string,
  type: PublicRequestThrottleTargetType,
  value: string,
) {
  const digest = createHash("sha256")
    .update(`${scope}:${type}:${value}`)
    .digest("base64url");

  return `${scope}:${type}:${digest}`;
}

function buildTargets(scope: string, request: Request, subject?: string) {
  const targets: PublicRequestThrottleTarget[] = [];
  const ipAddress = getRequestIpAddress(request);
  const normalizedSubject = subject?.trim().toLowerCase() ?? "";

  if (ipAddress) {
    targets.push({
      key: createThrottleKey(scope, "ip_address", ipAddress),
      label: `ip:${maskIpAddress(ipAddress)}`,
      type: "ip_address",
    });
  }

  // The subject bucket is what stops a rotating-IP client from enrolling one
  // victim's address repeatedly. The raw subject is never stored — only its
  // hash inside the key, and a constant label.
  if (normalizedSubject) {
    targets.push({
      key: createThrottleKey(scope, "subject", normalizedSubject),
      label: `${scope}:subject`,
      type: "subject",
    });
  }

  return targets;
}

function readRecords(targets: PublicRequestThrottleTarget[]) {
  if (targets.length === 0) return [] as PublicRequestThrottleRecord[];

  const placeholders = targets.map(() => "?").join(", ");

  return getAuthorityDatabase()
    .prepare(`
      SELECT throttle_key, request_count, window_started_at, blocked_until
      FROM authority_public_request_throttle
      WHERE throttle_key IN (${placeholders})
    `)
    .all(...targets.map((target) => target.key)) as PublicRequestThrottleRecord[];
}

/**
 * Records one attempt against every bucket for this caller and throws a 429 once
 * any bucket is over its policy. Callers should invoke this before doing any
 * durable work.
 */
export function assertPublicRequestAllowed(input: {
  request: Request;
  scope: string;
  policy: PublicRequestThrottlePolicy;
  subject?: string;
}) {
  const targets = buildTargets(input.scope, input.request, input.subject);

  if (targets.length === 0) return;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  let blockedUntilMs = 0;

  runAuthorityTransaction(() => {
    const records = new Map(
      readRecords(targets).map((record) => [record.throttle_key, record]),
    );
    const upsert = getAuthorityDatabase().prepare(`
      INSERT INTO authority_public_request_throttle (
        throttle_key,
        scope,
        label,
        request_count,
        window_started_at,
        last_request_at,
        blocked_until
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(throttle_key) DO UPDATE SET
        request_count = excluded.request_count,
        window_started_at = excluded.window_started_at,
        last_request_at = excluded.last_request_at,
        blocked_until = excluded.blocked_until
    `);

    for (const target of targets) {
      const record = records.get(target.key);
      const activeBlockMs = record?.blocked_until
        ? Date.parse(record.blocked_until)
        : 0;

      if (activeBlockMs > now) {
        blockedUntilMs = Math.max(blockedUntilMs, activeBlockMs);
        continue;
      }

      const windowStartedMs = record ? Date.parse(record.window_started_at) : 0;
      const isWithinWindow =
        record !== undefined && now - windowStartedMs <= input.policy.windowMs;
      const nextCount = isWithinWindow ? record.request_count + 1 : 1;
      const windowStartedAt = isWithinWindow
        ? record.window_started_at
        : nowIso;
      const nextBlockMs =
        nextCount > input.policy.maxRequests ? now + input.policy.blockMs : 0;

      if (nextBlockMs > 0) {
        blockedUntilMs = Math.max(blockedUntilMs, nextBlockMs);
      }

      upsert.run(
        target.key,
        input.scope,
        target.label,
        nextCount,
        windowStartedAt,
        nowIso,
        nextBlockMs > 0 ? new Date(nextBlockMs).toISOString() : null,
      );
    }
  });

  if (blockedUntilMs > now) {
    throw new PublicRequestThrottleError(
      Math.max(1, Math.ceil((blockedUntilMs - now) / 1000)),
    );
  }
}
