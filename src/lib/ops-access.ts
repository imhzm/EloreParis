import type { NextRequest } from "next/server";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";
import type {
  OpsAccessMode,
  OpsRole,
  OpsSessionSummary,
} from "@/lib/ops-types";

export const OPS_SESSION_COOKIE = "cozmateks-ops-session";
export const OPS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

type OpsUserConfig = {
  id: string;
  name: string;
  role: OpsRole;
  accessCode: string;
};

export type OpsAccessConfig = {
  accessCode: string;
  users: OpsUserConfig[];
  signingSecret: string;
  isConfigured: boolean;
  isProtectionActive: boolean;
  mode: OpsAccessMode;
};

type OpsSessionPayload = {
  scope: "ops_session";
  sessionId: string;
  userId: string;
  name: string;
  role: OpsRole;
  exp: number;
};

const roleLabels: Record<OpsRole, string> = {
  manager: "Ops manager",
  catalog_operator: "Catalog operator",
  fulfillment_operator: "Fulfillment operator",
  auditor: "Ops auditor",
};

const rolePathMap: Record<OpsRole, string[]> = {
  manager: ["/ops", "/ops/orders", "/ops/fulfillment", "/ops/catalog", "/ops/audit"],
  catalog_operator: ["/ops/catalog"],
  fulfillment_operator: ["/ops/orders", "/ops/fulfillment"],
  auditor: ["/ops/audit"],
};

function normalizeSecret(value: string | undefined) {
  return value?.trim() ?? "";
}

function isOpsRole(value: unknown): value is OpsRole {
  return (
    value === "manager" ||
    value === "catalog_operator" ||
    value === "fulfillment_operator" ||
    value === "auditor"
  );
}

function normalizeOpsUserId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function decodePayload(value: unknown): value is OpsSessionPayload {
  return (
    value !== null &&
    typeof value === "object" &&
    "scope" in value &&
    "sessionId" in value &&
    "userId" in value &&
    "name" in value &&
    "role" in value &&
    "exp" in value &&
    value.scope === "ops_session" &&
    typeof value.sessionId === "string" &&
    typeof value.userId === "string" &&
    typeof value.name === "string" &&
    isOpsRole(value.role) &&
    typeof value.exp === "number"
  );
}

function parseOpsUsers(rawValue: string | undefined) {
  const value = rawValue?.trim();

  if (!value) {
    return [] as OpsUserConfig[];
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [] as OpsUserConfig[];
    }

    return parsedValue
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const rawId = "id" in entry && typeof entry.id === "string" ? entry.id : "";
        const rawName =
          "name" in entry && typeof entry.name === "string" ? entry.name : "";
        const rawRole = "role" in entry ? entry.role : "";
        const rawCode =
          "accessCode" in entry && typeof entry.accessCode === "string"
            ? entry.accessCode.trim()
            : "";

        if (!rawName || !rawCode || !isOpsRole(rawRole)) {
          return null;
        }

        const id = normalizeOpsUserId(rawId || rawName);

        if (!id) {
          return null;
        }

        return {
          id,
          name: rawName.trim(),
          role: rawRole,
          accessCode: rawCode,
        } satisfies OpsUserConfig;
      })
      .filter((entry): entry is OpsUserConfig => entry !== null);
  } catch {
    return [] as OpsUserConfig[];
  }
}

function buildLegacyOpsUser(accessCode: string): OpsUserConfig | null {
  if (!accessCode) {
    return null;
  }

  return {
    id: "ops-manager",
    name: "Ops manager",
    role: "manager",
    accessCode,
  };
}

function getOpsUsers(accessCode: string) {
  const configuredUsers = parseOpsUsers(process.env.OPS_ACCESS_USERS_JSON);

  if (configuredUsers.length > 0) {
    return configuredUsers;
  }

  const legacyUser = buildLegacyOpsUser(accessCode);
  return legacyUser ? [legacyUser] : [];
}

function getOpsSigningSecret(users: OpsUserConfig[], accessCode: string) {
  const explicitSecret = normalizeSecret(process.env.OPS_ACCESS_SIGNING_SECRET);

  if (explicitSecret) {
    return explicitSecret;
  }

  if (users.length === 1) {
    return users[0].accessCode;
  }

  if (accessCode) {
    return accessCode;
  }

  const derivedSource = users
    .map((user) => `${user.id}:${user.role}:${user.accessCode}`)
    .sort()
    .join("|");

  return `cozmateks-ops:${derivedSource}`;
}

function buildAllowedPaths(role: OpsRole) {
  return [...rolePathMap[role]];
}

function mapPayloadToSessionSummary(
  payload: OpsSessionPayload,
  mode: OpsAccessMode,
): OpsSessionSummary {
  return {
    sessionId: payload.sessionId,
    userId: payload.userId,
    name: payload.name,
    role: payload.role,
    mode,
    allowedPaths: buildAllowedPaths(payload.role),
  };
}

export class OpsAccessError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "OpsAccessError";
    this.statusCode = statusCode;
  }
}

export function getOpsRoleLabel(role: OpsRole) {
  return roleLabels[role];
}

export function getOpsAccessConfig(): OpsAccessConfig {
  const accessCode = normalizeSecret(process.env.OPS_ACCESS_CODE);
  const isProtectionActive =
    process.env.NODE_ENV === "production" ||
    process.env.ENFORCE_OPS_ACCESS === "true";
  const users = getOpsUsers(accessCode);
  const isConfigured = users.length > 0;

  if (!isProtectionActive) {
    return {
      accessCode,
      users,
      signingSecret: getOpsSigningSecret(users, accessCode),
      isConfigured,
      isProtectionActive,
      mode: "development_open",
    };
  }

  if (!isConfigured) {
    return {
      accessCode,
      users,
      signingSecret: "",
      isConfigured,
      isProtectionActive,
      mode: "setup_required",
    };
  }

  return {
    accessCode,
    users,
    signingSecret: getOpsSigningSecret(users, accessCode),
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

export function getDefaultOpsPathForRole(role: OpsRole) {
  return rolePathMap[role][0] ?? "/ops";
}

function normalizeOpsAccessPath(pathname: string) {
  if (pathname.startsWith("/api/ops/orders")) {
    return "/ops/orders";
  }

  if (pathname.startsWith("/api/ops/audit")) {
    return "/ops/audit";
  }

  if (pathname.startsWith("/api/ops/session")) {
    return "/ops-session";
  }

  if (pathname.startsWith("/api/ops-access/logout")) {
    return "/ops-session";
  }

  return pathname;
}

export function canRoleAccessOpsPath(role: OpsRole, pathname: string) {
  const normalizedPath = normalizeOpsAccessPath(pathname);

  if (normalizedPath === "/ops-session") {
    return true;
  }

  return rolePathMap[role].some((allowedPath) =>
    allowedPath === "/ops"
      ? normalizedPath === "/ops"
      : normalizedPath === allowedPath ||
        normalizedPath.startsWith(`${allowedPath}/`),
  );
}

export function findOpsUserByAccessCode(
  submittedCode: string,
  config = getOpsAccessConfig(),
) {
  const normalizedCode = submittedCode.trim();

  if (!normalizedCode) {
    return null;
  }

  return (
    config.users.find((user) => user.accessCode === normalizedCode) ?? null
  );
}

export function getDevelopmentOpenOpsSession(): OpsSessionSummary {
  return {
    sessionId: "development-open",
    userId: "local-rehearsal",
    name: "Local rehearsal",
    role: "manager",
    mode: "development_open",
    allowedPaths: buildAllowedPaths("manager"),
  };
}

export async function createOpsSessionToken(
  user: OpsUserConfig,
  config = getOpsAccessConfig(),
  maxAgeSeconds = OPS_SESSION_MAX_AGE_SECONDS,
) {
  return createSignedToken(
    {
      scope: "ops_session",
      sessionId: crypto.randomUUID(),
      userId: user.id,
      name: user.name,
      role: user.role,
      exp: Date.now() + maxAgeSeconds * 1000,
    } satisfies OpsSessionPayload,
    config.signingSecret,
  );
}

export async function verifyOpsSessionToken(
  token: string,
  config = getOpsAccessConfig(),
) {
  if (!config.signingSecret) {
    return null;
  }

  const payload = await verifySignedToken(
    token,
    config.signingSecret,
    decodePayload,
  );

  return payload ? mapPayloadToSessionSummary(payload, config.mode) : null;
}

export async function getOpsSessionFromCookieValue(
  sessionCookie: string | undefined,
  config = getOpsAccessConfig(),
) {
  if (!config.isProtectionActive) {
    return getDevelopmentOpenOpsSession();
  }

  if (!sessionCookie) {
    return null;
  }

  return verifyOpsSessionToken(sessionCookie, config);
}

export async function assertOpsRequestAccess(
  request: NextRequest,
  pathname: string,
  config = getOpsAccessConfig(),
) {
  if (!config.isProtectionActive) {
    return getDevelopmentOpenOpsSession();
  }

  if (!config.isConfigured) {
    throw new OpsAccessError(
      "Ops access is enabled but no valid internal users are configured.",
      503,
    );
  }

  const sessionCookie = request.cookies.get(OPS_SESSION_COOKIE)?.value;
  const session = await getOpsSessionFromCookieValue(sessionCookie, config);

  if (!session) {
    throw new OpsAccessError("Ops access is required for this endpoint.", 401);
  }

  if (!canRoleAccessOpsPath(session.role, pathname)) {
    throw new OpsAccessError(
      "The current ops session does not have permission for this route.",
      403,
    );
  }

  return session;
}

export function shouldUseSecureOpsCookies() {
  return process.env.NODE_ENV === "production";
}
