import process from "node:process";

const secret = process.env.OUTBOX_WORKER_SECRET?.trim() ?? "";
const targetUrl = process.env.OUTBOX_WORKER_URL?.trim() ||
  "http://127.0.0.1:3056/api/internal/outbox-drain";
const probe = process.argv.slice(2).includes("--probe");
const drainLimit = 3;

if (
  secret.length < 32 ||
  /replace|change-me|example|placeholder/i.test(secret)
) {
  throw new Error("OUTBOX_WORKER_SECRET must be a non-placeholder secret of at least 32 characters.");
}

const response = await fetch(targetUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(probe ? { mode: "probe" } : { mode: "drain", limit: drainLimit }),
  redirect: "error",
  signal: AbortSignal.timeout(probe ? 10_000 : 55_000),
});

if (!response.ok) {
  throw new Error(`Outbox worker endpoint returned HTTP ${response.status}.`);
}

const payload = await response.json();
if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
  throw new Error("Outbox worker endpoint returned an invalid response.");
}

const normalizeCount = (value, name) => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Outbox worker returned an invalid ${name} count.`);
  }
  return value;
};

const normalizeOutbox = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Outbox worker endpoint returned an invalid persisted outbox summary.");
  }
  return {
    pending: normalizeCount(value.pending, "outbox.pending"),
    processing: normalizeCount(value.processing, "outbox.processing"),
    succeeded: normalizeCount(value.succeeded, "outbox.succeeded"),
    failed: normalizeCount(value.failed, "outbox.failed"),
  };
};

if (probe) {
  if (payload.mode !== "probe" || payload.probe !== true) {
    throw new Error("Outbox worker probe returned an invalid response.");
  }
  const outbox = normalizeOutbox(payload.outbox);
  if (outbox.failed > 0) {
    throw new Error("Outbox worker probe found persisted terminal failures.");
  }
  console.log(JSON.stringify({ status: "probe-passed" }));
} else {
  if (
    payload.mode !== "drain" ||
    !payload.result ||
    typeof payload.result !== "object" ||
    Array.isArray(payload.result) ||
    !payload.reservations ||
    typeof payload.reservations !== "object" ||
    Array.isArray(payload.reservations)
  ) {
    throw new Error("Outbox worker endpoint returned an invalid drain result.");
  }
  const result = {
    claimed: normalizeCount(payload.result.claimed, "claimed"),
    succeeded: normalizeCount(payload.result.succeeded, "succeeded"),
    retried: normalizeCount(payload.result.retried, "retried"),
    failed: normalizeCount(payload.result.failed, "failed"),
  };
  const reservations = {
    inspected: normalizeCount(payload.reservations.inspected, "reservations.inspected"),
    expired: normalizeCount(payload.reservations.expired, "reservations.expired"),
  };
  const outbox = normalizeOutbox(payload.outbox);
  if (
    result.claimed > drainLimit ||
    result.claimed !== result.succeeded + result.retried + result.failed ||
    reservations.expired > reservations.inspected ||
    outbox.failed < result.failed
  ) {
    throw new Error("Outbox worker response count invariants failed.");
  }
  const terminalFailures = Math.max(result.failed, outbox.failed);
  const status = terminalFailures > 0
    ? "failed"
    : result.retried > 0
      ? "degraded"
      : "ok";
  console.log(JSON.stringify({ status, ...result, persistedFailed: outbox.failed }));
  if (terminalFailures > 0) process.exitCode = 1;
}
