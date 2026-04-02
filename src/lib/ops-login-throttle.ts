import "server-only";

import { createHash } from "node:crypto";
import { getAuthorityDatabase, runAuthorityTransaction } from "@/lib/authority-database";

const LOGIN_FAILURE_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_FAILURE_THRESHOLD = 5;
const LOGIN_BLOCK_DURATION_MS = 15 * 60 * 1000;

type OpsLoginThrottleTargetType = "username" | "access_code" | "ip_address";

type OpsLoginThrottleTarget = {
  key: string;
  label: string;
  type: OpsLoginThrottleTargetType;
};

type LoginThrottleRecord = {
  throttle_key: string;
  label: string;
  failed_count: number;
  first_failed_at: string;
  last_failed_at: string;
  blocked_until: string | null;
};

export class OpsLoginThrottleError extends Error {
  statusCode: number;
  retryAfterSeconds: number;
  blockedUntil: string;

  constructor(message: string, blockedUntil: string, retryAfterSeconds: number) {
    super(message);
    this.name = "OpsLoginThrottleError";
    this.statusCode = 429;
    this.retryAfterSeconds = retryAfterSeconds;
    this.blockedUntil = blockedUntil;
  }
}

function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);

    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

function maskIpAddress(value: string) {
  if (value.includes(":")) {
    const segments = value.split(":");
    return `${segments.slice(0, 2).join(":")}:*`;
  }

  const segments = value.split(".");
  return segments.length === 4
    ? `${segments[0]}.${segments[1]}.${segments[2]}.*`
    : value;
}

function createThrottleKey(type: OpsLoginThrottleTargetType, value: string) {
  const digest = createHash("sha256")
    .update(`${type}:${value}`)
    .digest("base64url");

  return `${type}:${digest}`;
}

function upsertThrottleRecord(record: {
  key: string;
  label: string;
  failedCount: number;
  firstFailedAt: string;
  lastFailedAt: string;
  blockedUntil: string | null;
}) {
  getAuthorityDatabase()
    .prepare(`
      INSERT INTO authority_ops_login_throttle (
        throttle_key,
        label,
        failed_count,
        first_failed_at,
        last_failed_at,
        blocked_until
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(throttle_key) DO UPDATE SET
        label = excluded.label,
        failed_count = excluded.failed_count,
        first_failed_at = excluded.first_failed_at,
        last_failed_at = excluded.last_failed_at,
        blocked_until = excluded.blocked_until
    `)
    .run(
      record.key,
      record.label,
      record.failedCount,
      record.firstFailedAt,
      record.lastFailedAt,
      record.blockedUntil,
    );
}

function readThrottleRecords(targets: OpsLoginThrottleTarget[]) {
  if (targets.length === 0) {
    return [] as LoginThrottleRecord[];
  }

  const placeholders = targets.map(() => "?").join(", ");

  return getAuthorityDatabase()
    .prepare(`
      SELECT
        throttle_key,
        label,
        failed_count,
        first_failed_at,
        last_failed_at,
        blocked_until
      FROM authority_ops_login_throttle
      WHERE throttle_key IN (${placeholders})
    `)
    .all(...targets.map((target) => target.key)) as LoginThrottleRecord[];
}

export function getOpsLoginThrottleTargets(input: {
  username?: string;
  accessCode?: string;
  request: Request;
}) {
  const targets: OpsLoginThrottleTarget[] = [];
  const normalizedUsername = input.username?.trim().toLowerCase() ?? "";
  const normalizedAccessCode = input.accessCode?.trim() ?? "";
  const ipAddress = getRequestIpAddress(input.request);

  if (normalizedUsername) {
    targets.push({
      key: createThrottleKey("username", normalizedUsername),
      label: `username:${normalizedUsername}`,
      type: "username",
    });
  }

  if (normalizedAccessCode) {
    targets.push({
      key: createThrottleKey("access_code", normalizedAccessCode),
      label: "access_code:fallback",
      type: "access_code",
    });
  }

  if (ipAddress) {
    targets.push({
      key: createThrottleKey("ip_address", ipAddress),
      label: `ip:${maskIpAddress(ipAddress)}`,
      type: "ip_address",
    });
  }

  return targets.filter(
    (target, index, allTargets) =>
      allTargets.findIndex((candidate) => candidate.key === target.key) === index,
  );
}

export function assertOpsLoginThrottleAllowed(targets: OpsLoginThrottleTarget[]) {
  const now = Date.now();
  const blockedRecords = readThrottleRecords(targets)
    .filter((record) => record.blocked_until)
    .map((record) => ({
      label: record.label,
      blockedUntil: record.blocked_until as string,
    }))
    .filter((record) => Date.parse(record.blockedUntil) > now)
    .sort(
      (left, right) =>
        Date.parse(right.blockedUntil) - Date.parse(left.blockedUntil),
    );

  if (!blockedRecords.length) {
    return null;
  }

  const activeBlock = blockedRecords[0];
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((Date.parse(activeBlock.blockedUntil) - now) / 1000),
  );

  throw new OpsLoginThrottleError(
    "Too many failed ops login attempts. Wait briefly before trying again.",
    activeBlock.blockedUntil,
    retryAfterSeconds,
  );
}

export function recordFailedOpsLoginAttempt(targets: OpsLoginThrottleTarget[]) {
  if (targets.length === 0) {
    return;
  }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const currentRecords = new Map(
    readThrottleRecords(targets).map((record) => [record.throttle_key, record]),
  );

  runAuthorityTransaction(() => {
    for (const target of targets) {
      const existingRecord = currentRecords.get(target.key);
      const isWithinWindow =
        existingRecord &&
        now - Date.parse(existingRecord.last_failed_at) <= LOGIN_FAILURE_WINDOW_MS;
      const nextFailedCount = isWithinWindow
        ? existingRecord.failed_count + 1
        : 1;
      const firstFailedAt =
        isWithinWindow && existingRecord
          ? existingRecord.first_failed_at
          : nowIso;
      const blockedUntil =
        nextFailedCount >= LOGIN_FAILURE_THRESHOLD
          ? new Date(now + LOGIN_BLOCK_DURATION_MS).toISOString()
          : null;

      upsertThrottleRecord({
        key: target.key,
        label: target.label,
        failedCount: nextFailedCount,
        firstFailedAt,
        lastFailedAt: nowIso,
        blockedUntil,
      });
    }
  });
}

export function clearOpsLoginThrottleAttempts(targets: OpsLoginThrottleTarget[]) {
  if (targets.length === 0) {
    return;
  }

  const placeholders = targets.map(() => "?").join(", ");

  getAuthorityDatabase()
    .prepare(`
      DELETE FROM authority_ops_login_throttle
      WHERE throttle_key IN (${placeholders})
    `)
    .run(...targets.map((target) => target.key));
}

export function getOpsLoginThrottlePolicy() {
  return {
    maxAttempts: LOGIN_FAILURE_THRESHOLD,
    cooldownSeconds: LOGIN_BLOCK_DURATION_MS / 1000,
    windowSeconds: LOGIN_FAILURE_WINDOW_MS / 1000,
  };
}
