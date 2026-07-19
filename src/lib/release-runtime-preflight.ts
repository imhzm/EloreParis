import "server-only";

import { accessSync, constants, existsSync } from "node:fs";
import path from "node:path";
import { getAuthorityDatabasePath } from "@/lib/authority-database";
import { getHostingDirection } from "@/lib/hosting-direction";
import { getOpsAccessConfig } from "@/lib/ops-access";
import { getRuntimeSigningSecretBindings } from "@/lib/provider-runtime-config";
import { isHostedHttpsUrl } from "@/lib/public-site-url";
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

function getOverallStatus(
  checks: ReadonlyArray<{ status: ReleaseReadinessStatus }>,
): ReleaseReadinessStatus {
  if (checks.some((check) => check.status === "blocked")) {
    return "blocked";
  }

  if (checks.some((check) => check.status === "warning")) {
    return "warning";
  }

  return "ready";
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
  const hasHostedHttpsSiteUrl = isHostedHttpsUrl(nextPublicSiteUrl);
  const hostingProvider = process.env.HOSTING_PROVIDER?.trim();
  const identityUsers = opsAccessConfig.users.filter(
    (user) => Boolean(user.username) && Boolean(user.passwordHash),
  );
  const managerIdentities = identityUsers.filter(
    (user) => user.role === "manager",
  );
  const platformOwner = getReleasePlatformOwner();
  const securityOwner = getReleaseSecurityOwner();
  const signingSecretBindings = getRuntimeSigningSecretBindings();
  const signingSecretStatus = getOverallStatus(signingSecretBindings);
  const signingSecretResolution =
    signingSecretBindings.find((binding) => binding.status !== "ready")?.nextAction ??
    "Keep ORDER_AUTHORITY_SECRET and OPS_ACCESS_SIGNING_SECRET rotation explicit inside the hosted runtime.";

  const checks: ReleaseRuntimePreflightCheck[] = [
    {
      id: "public-site-url",
      title: "Public site URL contract",
      status: hasHostedHttpsSiteUrl ? "ready" : "blocked",
      summary: nextPublicSiteUrl
        ? hasHostedHttpsSiteUrl
          ? "A non-local public site URL is configured explicitly for metadata, canonical URLs, and live release verification."
          : "NEXT_PUBLIC_SITE_URL is not an explicit hosted HTTPS URL, so public metadata and search indexing remain fenced."
        : "No explicit hosted public site URL is configured, so canonical URLs still depend on a local runtime contract.",
      details: [
        `Resolved site URL: ${siteUrl}`,
        `NEXT_PUBLIC_SITE_URL: ${nextPublicSiteUrl || "missing"}`,
        `HOSTING_PROVIDER: ${hostingProvider || "missing"}`,
      ],
      owner: platformOwner,
      resolutionAction:
        "Set NEXT_PUBLIC_SITE_URL=https://elore-paris.com explicitly in the Hostinger environment.",
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
          ? "Authority data and release evidence both align with the Hostinger persistent-state contract."
          : authorityPathAccess.writable && releaseEvidencePathAccess.writable
            ? "Runtime write paths are usable, but they are not aligned with the `/var/lib/elore-paris` Hostinger contract."
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
      status: signingSecretStatus,
      summary:
        signingSecretStatus === "ready"
          ? "Order-token and ops-session signing now resolve from dedicated runtime secrets."
          : signingSecretStatus === "warning"
            ? "Effective signing secrets exist, but at least one protected path still depends on a shared or derived fallback binding."
            : "The runtime still depends on missing, placeholder, or weak effective signing secrets for protected order and ops flows.",
      details: signingSecretBindings.flatMap((binding) => [
        `${binding.label}: ${binding.summary}`,
        ...binding.details,
      ]),
      owner: securityOwner,
      resolutionAction: signingSecretResolution,
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
