import { createSignedToken, verifySignedToken } from "@/lib/signed-token";

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

function decodePayload(value: unknown): value is OpsSessionPayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "exp" in value &&
    value.scope === "ops_manager" &&
    typeof value.exp === "number"
  );
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
  return createSignedToken(
    {
      scope: "ops_manager",
      exp: Date.now() + maxAgeSeconds * 1000,
    } satisfies OpsSessionPayload,
    accessCode,
  );
}

export async function verifyOpsSessionToken(token: string, accessCode: string) {
  return Boolean(await verifySignedToken(token, accessCode, decodePayload));
}

export function shouldUseSecureOpsCookies() {
  return process.env.NODE_ENV === "production";
}
