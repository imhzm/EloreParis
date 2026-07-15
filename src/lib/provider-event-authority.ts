import "server-only";

import { createHash } from "node:crypto";
import { getAuthorityDatabase } from "@/lib/authority-database";
import { authenticateProviderCallback } from "@/lib/provider-callback-auth";

const MAX_PROVIDER_CALLBACK_BYTES = 16 * 1024;

export class ProviderEventAuthorityError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "provider_event_invalid") {
    super(message);
    this.name = "ProviderEventAuthorityError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

async function readBoundedProviderCallbackText(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    throw new ProviderEventAuthorityError(
      "Provider callbacks require application/json.",
      415,
      "unsupported_media_type",
    );
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PROVIDER_CALLBACK_BYTES) {
    throw new ProviderEventAuthorityError(
      "Provider callback payload is too large.",
      413,
      "provider_payload_too_large",
    );
  }
  if (!request.body) {
    throw new ProviderEventAuthorityError("Provider callback payload is empty.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let bodyText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_PROVIDER_CALLBACK_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new ProviderEventAuthorityError(
        "Provider callback payload is too large.",
        413,
        "provider_payload_too_large",
      );
    }
    bodyText += decoder.decode(value, { stream: true });
  }
  bodyText += decoder.decode();

  return bodyText;
}

function parseProviderCallback(bodyText: string, allowedKeys: readonly string[]) {
  let body: unknown;
  try {
    body = JSON.parse(bodyText) as unknown;
  } catch {
    throw new ProviderEventAuthorityError("Provider callback payload is invalid JSON.");
  }
  if (
    !isRecord(body) ||
    Object.keys(body).some((key) => !allowedKeys.includes(key))
  ) {
    throw new ProviderEventAuthorityError(
      "Provider callback payload contains unsupported fields.",
    );
  }

  const payloadHash = createHash("sha256")
    .update(JSON.stringify(canonicalize(body)))
    .digest("hex");
  return { body, payloadHash, rawBody: bodyText };
}

export async function readBoundedProviderCallback(
  request: Request,
  allowedKeys: readonly string[],
) {
  return parseProviderCallback(
    await readBoundedProviderCallbackText(request),
    allowedKeys,
  );
}

export async function readAuthenticatedProviderCallback(
  request: Request,
  allowedKeys: readonly string[],
  expectedSecret: string,
) {
  const rawBody = await readBoundedProviderCallbackText(request);
  const authentication = authenticateProviderCallback({
    headers: request.headers,
    rawBody,
    secret: expectedSecret,
  });
  if (!authentication.ok) {
    throw new ProviderEventAuthorityError(
      "Provider callback authentication failed.",
      authentication.statusCode,
      authentication.code,
    );
  }
  return {
    ...parseProviderCallback(rawBody, allowedKeys),
    authenticationMode: authentication.mode,
  };
}

type ProviderEventRow = {
  order_number: string;
  payload_hash: string;
};

function readProviderEvent(provider: string, eventId: string) {
  return getAuthorityDatabase().prepare(`
    SELECT order_number, payload_hash
    FROM authority_provider_events
    WHERE provider = ? AND event_id = ?
  `).get(provider, eventId) as ProviderEventRow | undefined;
}

function assertMatchingProviderEvent(
  row: ProviderEventRow,
  orderNumber: string,
  payloadHash: string,
) {
  if (row.order_number !== orderNumber || row.payload_hash !== payloadHash) {
    throw new ProviderEventAuthorityError(
      "The provider event id was already used with a different payload.",
      409,
      "provider_event_conflict",
    );
  }
}

export function inspectAuthorityProviderEvent(
  provider: "payment" | "shipping" | "notification",
  eventId: string,
  orderNumber: string,
  payloadHash: string,
) {
  const row = readProviderEvent(provider, eventId);
  if (!row) return { replayed: false };
  assertMatchingProviderEvent(row, orderNumber, payloadHash);
  return { replayed: true };
}

export function recordAuthorityProviderEvent(
  provider: "payment" | "shipping" | "notification",
  eventId: string,
  orderNumber: string,
  payloadHash: string,
) {
  try {
    getAuthorityDatabase().prepare(`
      INSERT INTO authority_provider_events (
        provider, event_id, order_number, payload_hash, processed_at
      ) VALUES (?, ?, ?, ?, ?)
    `).run(provider, eventId, orderNumber, payloadHash, new Date().toISOString());
    return { replayed: false };
  } catch (error) {
    const existing = readProviderEvent(provider, eventId);
    if (!existing) throw error;
    assertMatchingProviderEvent(existing, orderNumber, payloadHash);
    return { replayed: true };
  }
}
