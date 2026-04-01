const encoder = new TextEncoder();

export const OPS_SESSION_COOKIE = "cozmateks-ops-session";
export const OPS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type OpsAccessMode =
  | "development_open"
  | "protected"
  | "setup_required";

export type OpsAccessConfig = {
  accessCode: string;
  isConfigured: boolean;
  isProtectionActive: boolean;
  mode: OpsAccessMode;
};

type OpsSessionPayload = {
  scope: "ops_manager";
  exp: number;
};

function normalizeSecret(value: string | undefined) {
  return value?.trim() ?? "";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padding = "=".repeat((4 - (value.length % 4 || 4)) % 4);
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function safeStringEquals(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

function decodePayload(value: string) {
  try {
    const payloadText = new TextDecoder().decode(base64UrlToBytes(value));
    const payload = JSON.parse(payloadText) as Partial<OpsSessionPayload>;

    if (payload.scope !== "ops_manager" || typeof payload.exp !== "number") {
      return null;
    }

    return payload as OpsSessionPayload;
  } catch {
    return null;
  }
}

export function getOpsAccessConfig(): OpsAccessConfig {
  const accessCode = normalizeSecret(process.env.OPS_ACCESS_CODE);
  const isProtectionActive =
    process.env.NODE_ENV === "production" ||
    process.env.ENFORCE_OPS_ACCESS === "true";
  const isConfigured = accessCode.length > 0;

  if (!isProtectionActive) {
    return {
      accessCode,
      isConfigured,
      isProtectionActive,
      mode: "development_open",
    };
  }

  if (!isConfigured) {
    return {
      accessCode,
      isConfigured,
      isProtectionActive,
      mode: "setup_required",
    };
  }

  return {
    accessCode,
    isConfigured,
    isProtectionActive,
    mode: "protected",
  };
}

export function sanitizeOpsNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) {
    return "/ops";
  }

  if (value.startsWith("/ops-access") || value.startsWith("/api/")) {
    return "/ops";
  }

  return value.startsWith("/ops") ? value : "/ops";
}

export async function createOpsSessionToken(
  accessCode: string,
  maxAgeSeconds = OPS_SESSION_MAX_AGE_SECONDS,
) {
  const payload = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        scope: "ops_manager",
        exp: Date.now() + maxAgeSeconds * 1000,
      } satisfies OpsSessionPayload),
    ),
  );
  const signature = await signValue(payload, accessCode);

  return `${payload}.${signature}`;
}

export async function verifyOpsSessionToken(token: string, accessCode: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await signValue(payload, accessCode);

  if (!safeStringEquals(signature, expectedSignature)) {
    return false;
  }

  const decodedPayload = decodePayload(payload);

  if (!decodedPayload) {
    return false;
  }

  return decodedPayload.exp > Date.now();
}

export function shouldUseSecureOpsCookies() {
  return process.env.NODE_ENV === "production";
}
