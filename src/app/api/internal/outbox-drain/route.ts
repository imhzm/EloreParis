import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { expireDueAuthorityInventoryReservations } from "@/lib/inventory-reservation-authority";
import {
  drainAuthorityOutbox,
  getAuthorityOutboxSummary,
} from "@/lib/order-outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_DRAIN_LIMIT = 3;

type WorkerRequestBody =
  | { mode: "probe" }
  | { mode: "drain"; limit: number };

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isAuthorizedWorkerRequest(request: NextRequest) {
  const configuredSecret = process.env.OUTBOX_WORKER_SECRET?.trim() ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (
    configuredSecret.length < 32 ||
    /replace|change-me|example|placeholder/i.test(configuredSecret) ||
    suppliedSecret.length !== configuredSecret.length
  ) {
    return false;
  }
  return timingSafeEqual(
    Buffer.from(suppliedSecret, "utf8"),
    Buffer.from(configuredSecret, "utf8"),
  );
}

function parseWorkerRequestBody(value: unknown): WorkerRequestBody | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (body.mode === "probe") {
    return keys.length === 1 && keys[0] === "mode" ? { mode: "probe" } : null;
  }
  if (body.mode !== "drain" || keys.some((key) => key !== "mode" && key !== "limit")) {
    return null;
  }

  const limit = body.limit === undefined ? DEFAULT_DRAIN_LIMIT : body.limit;
  if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > 50) {
    return null;
  }
  return { mode: "drain", limit: Number(limit) };
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedWorkerRequest(request)) {
    return response({ error: "Worker authorization failed." }, 401);
  }

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return response({ error: "Worker request body must be valid JSON." }, 400);
  }
  const body = parseWorkerRequestBody(parsedBody);
  if (!body) {
    return response({ error: "Worker mode must be explicitly set to probe or drain." }, 400);
  }

  try {
    if (body.mode === "probe") {
      return response({
        mode: "probe",
        probe: true,
        outbox: getAuthorityOutboxSummary(),
      });
    }

    const reservations = expireDueAuthorityInventoryReservations({
      limit: body.limit,
    });
    const result = await drainAuthorityOutbox({ limit: body.limit });
    return response({
      mode: "drain",
      result,
      reservations,
      outbox: getAuthorityOutboxSummary(),
    });
  } catch (error) {
    console.error(
      "Unattended authority outbox drain failed.",
      error instanceof Error ? error.message : "Unknown outbox failure.",
    );
    return response({ error: "Unable to process the authority outbox." }, 500);
  }
}
