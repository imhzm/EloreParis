import "server-only";

import {
  getContentGovernanceSummary,
} from "@/lib/content-governance";
import { getAuthorityStorageInfo } from "@/lib/authority-database";
import { getHostingDirection } from "@/lib/hosting-direction";
import { getOpsAccessConfig } from "@/lib/ops-access";
import {
  buildReleaseOwnerSummaries,
  getReleaseCommerceOwner,
  getReleaseContentOwner,
  getReleaseDeliveryOwner,
  getReleasePlatformOwner,
  getReleaseSecurityOwner,
} from "@/lib/release-ownership";
import { getReleaseRuntimePreflightSnapshot } from "@/lib/release-runtime-preflight";
import type {
  ReleaseReadinessGate,
  ReleaseReadinessSnapshot,
  ReleaseReadinessStatus,
} from "@/lib/release-readiness-types";
import { getSiteUrl } from "@/lib/site-content";

function isLocalCanonicalUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1" ||
      parsedUrl.hostname === "::1"
    );
  } catch {
    return true;
  }
}

function getRuntimeEnvironment() {
  if (process.env.VERCEL_ENV?.trim()) {
    return `vercel:${process.env.VERCEL_ENV.trim()}`;
  }

  return process.env.NODE_ENV ?? "development";
}

function getOverallStatus(gates: ReleaseReadinessGate[]): ReleaseReadinessStatus {
  if (gates.some((gate) => gate.status === "blocked")) {
    return "blocked";
  }

  if (gates.some((gate) => gate.status === "warning")) {
    return "warning";
  }

  return "ready";
}

export function getReleaseReadinessSnapshot(): ReleaseReadinessSnapshot {
  const siteUrl = getSiteUrl();
  const authorityStorage = getAuthorityStorageInfo();
  const contentSummary = getContentGovernanceSummary();
  const hostingDirection = getHostingDirection();
  const opsAccessConfig = getOpsAccessConfig();
  const runtimePreflight = getReleaseRuntimePreflightSnapshot();
  const deliveryOwner = getReleaseDeliveryOwner();
  const platformOwner = getReleasePlatformOwner();
  const commerceOwner = getReleaseCommerceOwner();
  const securityOwner = getReleaseSecurityOwner();
  const contentOwner = getReleaseContentOwner();

  const gates: ReleaseReadinessGate[] = [
    {
      id: "ci-health",
      title: "Local and CI validation",
      status: "ready",
      summary:
        "The repository already enforces lint, typecheck, build, and smoke checks before future release claims.",
      details: [
        "GitHub Actions CI runs on every push to main.",
        "Smoke checks verify key public routes, protected ops routes, and transactional APIs.",
      ],
      owner: deliveryOwner,
      resolutionAction:
        "Keep CI green on main and republish a protected release package after any release-surface change.",
    },
    {
      id: "hosting-direction",
      title: "Hosting direction freeze",
      status: "ready",
      summary:
        "The repository now freezes the primary runtime to a Render web service that runs the Next standalone server on persistent storage, which matches the current SQLite-backed operational authorities.",
      details: [
        `Primary provider: ${hostingDirection.primaryProvider}`,
        `Service type: ${hostingDirection.primaryServiceType}`,
        `Runtime artifact: ${hostingDirection.runtimeArtifact}`,
        `Persistent state path: ${hostingDirection.persistencePath}`,
        `Secondary path: ${hostingDirection.optionalSecondaryPath}`,
      ],
      owner: platformOwner,
      resolutionAction:
        "Keep Render plus persistent disk as the only supported launch path until shared backend ownership replaces the single-host runtime.",
    },
    {
      id: "hosting-runtime",
      title: "Hosted canonical runtime",
      status: isLocalCanonicalUrl(siteUrl) ? "blocked" : "ready",
      summary: isLocalCanonicalUrl(siteUrl)
        ? "Canonical URLs still resolve to a local runtime because no live hosted Render environment or production domain is wired yet."
        : "Canonical URLs now resolve to a hosted runtime instead of a local fallback.",
      details: isLocalCanonicalUrl(siteUrl)
        ? [
            `Current canonical URL: ${siteUrl}`,
            "A real Render deployment plus production domain configuration is still required.",
          ]
        : [`Current canonical URL: ${siteUrl}`],
      owner: platformOwner,
      resolutionAction:
        "Create the live Render service, bind the production domain, and republish the release package from the hosted runtime.",
    },
    {
      id: "transactional-backend",
      title: "Durable transactional authority",
      status: authorityStorage.engine === "sqlite" ? "warning" : "ready",
      summary:
        authorityStorage.engine === "sqlite"
          ? "Orders, notifications, and audit logs now match the frozen persistent-host path, but they still run on single-host SQLite instead of a shared durable backend."
          : "Transactional state is backed by a non-local shared authority.",
      details: [
        `Current storage engine: ${authorityStorage.engine}`,
        `Durability mode: ${authorityStorage.durability}`,
        `Storage path: ${authorityStorage.path}`,
      ],
      owner: commerceOwner,
      resolutionAction:
        "Replace the current single-host SQLite authority with shared durable ownership for orders, notifications, and audit data before multi-operator production use.",
    },
    {
      id: "ops-auth",
      title: "Ops identity and RBAC",
      status: opsAccessConfig.supportsIdentityAuth ? "warning" : "blocked",
      summary: opsAccessConfig.supportsIdentityAuth
        ? "Role-aware identity login exists, but it is still env-backed and not provider-backed auth/RBAC."
        : "Ops surfaces still need identity-backed login before production operations can be trusted.",
      details: [
        `Access mode: ${opsAccessConfig.mode}`,
        `Primary auth method: ${opsAccessConfig.primaryAuthMethod}`,
        `Identity login available: ${opsAccessConfig.supportsIdentityAuth ? "yes" : "no"}`,
      ],
      owner: securityOwner,
      resolutionAction:
        "Upgrade the current env-backed identities into provider-backed auth with real RBAC before trusting live internal operations.",
    },
    {
      id: "content-approval",
      title: "Public content approval gates",
      status: contentSummary.launchBlocked > 0 ? "blocked" : "ready",
      summary:
        contentSummary.launchBlocked > 0
          ? "Public copy and trust surfaces are still blocked behind sample-pack and business-input approvals."
          : "Public content approval blockers are cleared.",
      details: [
        `${contentSummary.awaitingStyleSamples} groups are waiting for real style samples.`,
        `${contentSummary.awaitingBusinessInputs} groups are waiting for approved business inputs.`,
        `${contentSummary.launchBlocked} governance groups still block final launch claims.`,
      ],
      owner: contentOwner,
      resolutionAction:
        "Clear the remaining sample-pack, legal, and business-input approvals in /ops/content before any public launch claim.",
    },
  ];
  const ownerSummaries = buildReleaseOwnerSummaries([
    ...gates,
    ...runtimePreflight.checks,
  ]);

  return {
    overallStatus: getOverallStatus(gates),
    blockedCount: gates.filter((gate) => gate.status === "blocked").length,
    warningCount: gates.filter((gate) => gate.status === "warning").length,
    readyCount: gates.filter((gate) => gate.status === "ready").length,
    runtimeEnvironment: getRuntimeEnvironment(),
    canonicalUrl: siteUrl,
    gates,
    runtimePreflight,
    ownerSummaries,
    nextActions: [
      "Create the primary Render web service from render.yaml, attach the persistent disk, and set the deploy-hook plus live-base-url secrets for the manual Render workflow.",
      "Use the runtime preflight section inside /ops/release to clear the public URL, persistent path, signing-secret, and protected-identity blockers before the first live deploy claim.",
      "Keep the current SQLite-backed authority only as a single-host launch path; replace it with a shared durable backend for orders, notifications, and audit data when the backend ownership phase starts.",
      "Upgrade the current signed-session ops gate into provider-backed auth and real RBAC.",
      "Clear the remaining sample-pack, legal, and business-input gates tracked in CONTENT-OWNERSHIP.md before public launch claims.",
    ],
  };
}
