import { createHmac, timingSafeEqual } from "node:crypto";

export const PROVIDER_CALLBACK_TIMESTAMP_HEADER = "x-elore-timestamp";
export const PROVIDER_CALLBACK_SIGNATURE_HEADER = "x-elore-signature";

type CallbackSecurityEnvironment = {
  APP_ENV?: string;
  NODE_ENV?: string;
  PROVIDER_CALLBACK_HMAC_REQUIRED?: string;
  PROVIDER_CALLBACK_MAX_SKEW_SECONDS?: string;
};

export type ProviderCallbackAuthenticationResult =
  | { ok: true; mode: "hmac" | "legacy_bearer" }
  | {
      ok: false;
      code:
        | "provider_callback_auth_config_invalid"
        | "provider_callback_authorization_failed"
        | "provider_callback_timestamp_invalid"
        | "provider_callback_signature_invalid";
      statusCode: 401 | 503;
    };

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function resolveHmacRequired(environment: CallbackSecurityEnvironment) {
  const configured = environment.PROVIDER_CALLBACK_HMAC_REQUIRED?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;
  if (configured) return null;
  const appEnvironment = environment.APP_ENV?.trim().toLowerCase();
  if (appEnvironment) return appEnvironment === "production";
  return environment.NODE_ENV?.trim().toLowerCase() === "production";
}

function resolveMaxSkewSeconds(environment: CallbackSecurityEnvironment) {
  const raw = environment.PROVIDER_CALLBACK_MAX_SKEW_SECONDS?.trim();
  if (!raw) return 300;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 30 && parsed <= 900
    ? parsed
    : null;
}

export function createProviderCallbackSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
) {
  return `v1=${createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")}`;
}

export function authenticateProviderCallback({
  headers,
  rawBody,
  secret,
  now = Date.now(),
  environment = process.env,
}: {
  headers: Headers;
  rawBody: string;
  secret: string;
  now?: number;
  environment?: CallbackSecurityEnvironment;
}): ProviderCallbackAuthenticationResult {
  const maxSkewSeconds = resolveMaxSkewSeconds(environment);
  const hmacRequired = resolveHmacRequired(environment);
  if (maxSkewSeconds === null || hmacRequired === null) {
    return { ok: false, code: "provider_callback_auth_config_invalid", statusCode: 503 };
  }

  if (!hmacRequired) {
    const authorization = headers.get("authorization")?.trim() ?? "";
    return constantTimeEqual(authorization, `Bearer ${secret}`)
      ? { ok: true, mode: "legacy_bearer" }
      : {
          ok: false,
          code: "provider_callback_authorization_failed",
          statusCode: 401,
        };
  }

  const timestamp = headers.get(PROVIDER_CALLBACK_TIMESTAMP_HEADER)?.trim() ?? "";
  if (!/^\d{10,11}$/.test(timestamp)) {
    return { ok: false, code: "provider_callback_timestamp_invalid", statusCode: 401 };
  }
  const timestampMs = Number(timestamp) * 1000;
  if (
    !Number.isSafeInteger(timestampMs) ||
    Math.abs(now - timestampMs) > maxSkewSeconds * 1000
  ) {
    return { ok: false, code: "provider_callback_timestamp_invalid", statusCode: 401 };
  }

  const suppliedSignature =
    headers.get(PROVIDER_CALLBACK_SIGNATURE_HEADER)?.trim().toLowerCase() ?? "";
  const expectedSignature = createProviderCallbackSignature(secret, timestamp, rawBody);
  return constantTimeEqual(suppliedSignature, expectedSignature)
    ? { ok: true, mode: "hmac" }
    : { ok: false, code: "provider_callback_signature_invalid", statusCode: 401 };
}
