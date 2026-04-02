import "server-only";

import { accessSync, constants, existsSync } from "node:fs";
import path from "node:path";
import { getAuthorityDatabasePath } from "@/lib/authority-database";
import { getHostingDirection } from "@/lib/hosting-direction";
import { getOpsAccessConfig } from "@/lib/ops-access";
import {
  getReleasePlatformOwner,
  getReleaseSecurityOwner,
} from "@/lib/release-ownership";
import { getReleaseEvidencePath } from "@/lib/release-evidence";
import type {
  ReleaseReadinessStatus,
  ReleaseRuntimePreflightCheck,
  ReleaseRuntimePreflightSnapshot,
} from "@/lib/release-readiness-types";
import { getSiteUrl } from "@/lib/site-content";

function isHostedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return !["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function getOverallStatus(
  checks: ReleaseRuntimePreflightCheck[],
): ReleaseReadinessStatus {
  if (checks.some((check) => check.status === "blocked")) {
    return "blocked";
  }

  if (checks.some((check) => check.status === "warning")) {
    return "warning";
  }

  return "ready";
}

function looksLikePlaceholder(value: string) {
  return /(replace|placeholder|example|changeme|todo|your-|set-this)/i.test(
    value,
  );
}

function describeSecret(name: string, value: string | undefined) {
  if (!value) {
    return `${name}: missing`;
  }

  if (looksLikePlaceholder(value)) {
    return `${name}: placeholder text is still configured`;
  }

  return `${name}: configured (${value.length} chars)`;
}

function isStrongConfiguredSecret(value: string | undefined) {
  if (!value) {
    return false;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length >= 24 && !looksLikePlaceholder(trimmedValue);
}

function normalizePathForComparison(candidatePath: string) {
  return path.resolve(candidatePath).replace(/\\/g, "/").replace(/\/+$/, "");
}

function isPathUnderRoot(candidatePath: string, rootPath: string) {
  const normalizedCandidatePath = normalizePathForComparison(candidatePath);
  const normalizedRootPath = normalizePathForComparison(rootPath);

  return (
    normalizedCandidatePath === normalizedRootPath ||
    normalizedCandidatePath.startsWith(`${normalizedRootPath}/`)
  );
}

function getNearestExistingDirectory(targetPath: string) {
  let currentPath = path.dirname(targetPath);

  while (!existsSync(currentPath)) {
    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      return currentPath;
    }

    currentPath = parentPath;
  }

  return currentPath;
}

function getPathWriteAccess(targetPath: string) {
  const existingDirectory = getNearestExistingDirectory(targetPath);

  try {
    accessSync(existingDirectory, constants.W_OK);
    return {
      writable: true,
      checkedDirectory: existingDirectory,
    };
  } catch {
    return {
      writable: false,
      checkedDirectory: existingDirectory,
    };
  }
}

export function getReleaseRuntimePreflightSnapshot(): ReleaseRuntimePreflightSnapshot {
  const siteUrl = getSiteUrl();
  const hostingDirection = getHostingDirection();
  const opsAccessConfig = getOpsAccessConfig();
  const authorityDatabasePath = getAuthorityDatabasePath();
  const releaseEvidencePath = getReleaseEvidencePath();
  const authorityPathAccess = getPathWriteAccess(authorityDatabasePath);
  const releaseEvidencePathAccess = getPathWriteAccess(releaseEvidencePath);
  const nextPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  const orderAuthoritySecret = process.env.ORDER_AUTHORITY_SECRET?.trim();
  const opsAccessSigningSecret = process.env.OPS_ACCESS_SIGNING_SECRET?.trim();
  const identityUsers = opsAccessConfig.users.filter(
    (user) => Boolean(user.username) && Boolean(user.passwordHash),
  );
  const managerIdentities = identityUsers.filter(
    (user) => user.role === "manager",
  );
  const platformOwner = getReleasePlatformOwner();
  const securityOwner = getReleaseSecurityOwner();

  const checks: ReleaseRuntimePreflightCheck[] = [
    {
      id: "public-site-url",
      title: "Public site URL contract",
      status: nextPublicSiteUrl
        ? isHostedUrl(nextPublicSiteUrl)
          ? "ready"
          : "blocked"
        : renderExternalUrl && isHostedUrl(renderExternalUrl)
          ? "warning"
          : "blocked",
      summary: nextPublicSiteUrl
        ? isHostedUrl(nextPublicSiteUrl)
          ? "A non-local public site URL is configured explicitly for metadata, canonical URLs, and live release verification."
          : "NEXT_PUBLIC_SITE_URL is still configured against a local runtime, so public metadata is not yet bound to a real hosted domain."
        : renderExternalUrl && isHostedUrl(renderExternalUrl)
          ? "The runtime can resolve a hosted URL from Render, but the final public site URL is still not frozen explicitly."
          : "No hosted public site URL is configured yet, so canonical URLs still depend on a local or missing runtime contract.",
      details: [
        `Resolved site URL: ${siteUrl}`,
        `NEXT_PUBLIC_SITE_URL: ${nextPublicSiteUrl || "missing"}`,
        `RENDER_EXTERNAL_URL: ${renderExternalUrl || "missing"}`,
      ],
      owner: platformOwner,
      resolutionAction:
        "Set NEXT_PUBLIC_SITE_URL to the hosted production domain and keep the Render external URL only as a fallback signal.",
    },
    {
      id: "persistent-runtime-paths",
      title: "Persistent runtime paths",
      status:
        authorityPathAccess.writable &&
        releaseEvidencePathAccess.writable &&
        isPathUnderRoot(authorityDatabasePath, hostingDirection.persistencePath) &&
        isPathUnderRoot(releaseEvidencePath, hostingDirection.persistencePath)
          ? "ready"
          : authorityPathAccess.writable && releaseEvidencePathAccess.writable
            ? "warning"
            : "blocked",
      summary:
        authorityPathAccess.writable &&
        releaseEvidencePathAccess.writable &&
        isPathUnderRoot(authorityDatabasePath, hostingDirection.persistencePath) &&
        isPathUnderRoot(releaseEvidencePath, hostingDirection.persistencePath)
          ? "Authority data and release evidence both align with the frozen Render persistent-disk contract."
          : authorityPathAccess.writable && releaseEvidencePathAccess.writable
            ? "Runtime write paths are usable, but they are not yet aligned with the frozen `/var/data` Render disk contract."
            : "The current runtime cannot confirm writable paths for authority storage and release evidence publication.",
      details: [
        `Expected persistent root: ${hostingDirection.persistencePath}`,
        `Authority DB path: ${authorityDatabasePath}`,
        `Release evidence path: ${releaseEvidencePath}`,
        `Authority path writable from: ${authorityPathAccess.checkedDirectory}`,
        `Release evidence path writable from: ${releaseEvidencePathAccess.checkedDirectory}`,
      ],
      owner: platformOwner,
      resolutionAction:
        "Move authority and evidence paths under the frozen persistent disk root before any hosted release publication.",
    },
    {
      id: "signing-secrets",
      title: "Signing secrets quality",
      status:
        isStrongConfiguredSecret(orderAuthoritySecret) &&
        isStrongConfiguredSecret(opsAccessSigningSecret)
          ? "ready"
          : "blocked",
      summary:
        isStrongConfiguredSecret(orderAuthoritySecret) &&
        isStrongConfiguredSecret(opsAccessSigningSecret)
          ? "The runtime now has explicit non-placeholder secrets for order tokens and ops sessions."
          : "The runtime still depends on missing, placeholder, or weak signing secrets for protected order and ops flows.",
      details: [
        describeSecret("ORDER_AUTHORITY_SECRET", orderAuthoritySecret),
        describeSecret("OPS_ACCESS_SIGNING_SECRET", opsAccessSigningSecret),
      ],
      owner: securityOwner,
      resolutionAction:
        "Set strong non-placeholder ORDER_AUTHORITY_SECRET and OPS_ACCESS_SIGNING_SECRET values in the hosted runtime environment.",
    },
    {
      id: "ops-bootstrap-identities",
      title: "Ops bootstrap identities",
      status:
        opsAccessConfig.isProtectionActive &&
        managerIdentities.length > 0 &&
        identityUsers.length > 0
          ? "ready"
          : identityUsers.length > 0 || opsAccessConfig.supportsAccessCodeAuth
            ? "warning"
            : "blocked",
      summary:
        opsAccessConfig.isProtectionActive &&
        managerIdentities.length > 0 &&
        identityUsers.length > 0
          ? "The runtime has protected ops access plus a manager-capable identity path for launch-only internal operations."
          : identityUsers.length > 0 || opsAccessConfig.supportsAccessCodeAuth
            ? "Ops bootstrap auth exists, but it is not yet fully aligned with the protected identity-first launch path."
            : "No usable protected ops identity path is configured for live release operations.",
      details: [
        `Protection active: ${opsAccessConfig.isProtectionActive ? "yes" : "no"}`,
        `Configured ops users: ${opsAccessConfig.users.length}`,
        `Identity-backed users: ${identityUsers.length}`,
        `Manager identities: ${managerIdentities.length}`,
        `Primary auth method: ${opsAccessConfig.primaryAuthMethod}`,
      ],
      owner: securityOwner,
      resolutionAction:
        "Configure at least one manager-capable protected identity before live release publication, evidence publication, or approval actions.",
    },
  ];

  return {
    overallStatus: getOverallStatus(checks),
    blockedCount: checks.filter((check) => check.status === "blocked").length,
    warningCount: checks.filter((check) => check.status === "warning").length,
    readyCount: checks.filter((check) => check.status === "ready").length,
    checks,
  };
}
