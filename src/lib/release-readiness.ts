import "server-only";

import {
  getContentGovernanceSummary,
} from "@/lib/content-governance";
import { getAuthorityStorageInfo } from "@/lib/authority-database";
import { getOpsAccessConfig } from "@/lib/ops-access";
import type {
  ReleaseReadinessGate,
  ReleaseReadinessSnapshot,
  ReleaseReadinessStatus,
} from "@/lib/release-readiness-types";
import { siteUrl } from "@/lib/site-content";

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
  const authorityStorage = getAuthorityStorageInfo();
  const contentSummary = getContentGovernanceSummary();
  const opsAccessConfig = getOpsAccessConfig();

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
    },
    {
      id: "hosting-runtime",
      title: "Hosted canonical runtime",
      status: isLocalCanonicalUrl(siteUrl) ? "blocked" : "ready",
      summary: isLocalCanonicalUrl(siteUrl)
        ? "Canonical URLs still resolve to a local runtime, so launch-readiness cannot be claimed yet."
        : "Canonical URLs now resolve to a hosted runtime instead of a local fallback.",
      details: isLocalCanonicalUrl(siteUrl)
        ? [
            `Current canonical URL: ${siteUrl}`,
            "A real hosted deployment plus production credentials is still required.",
          ]
        : [`Current canonical URL: ${siteUrl}`],
    },
    {
      id: "transactional-backend",
      title: "Durable transactional authority",
      status: authorityStorage.engine === "sqlite" ? "blocked" : "ready",
      summary:
        authorityStorage.engine === "sqlite"
          ? "Orders, notifications, and audit logs still depend on app-local SQLite storage instead of a shared durable backend."
          : "Transactional state is backed by a non-local shared authority.",
      details: [
        `Current storage engine: ${authorityStorage.engine}`,
        `Durability mode: ${authorityStorage.durability}`,
        `Storage path: ${authorityStorage.path}`,
      ],
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
    },
  ];

  return {
    overallStatus: getOverallStatus(gates),
    blockedCount: gates.filter((gate) => gate.status === "blocked").length,
    warningCount: gates.filter((gate) => gate.status === "warning").length,
    readyCount: gates.filter((gate) => gate.status === "ready").length,
    runtimeEnvironment: getRuntimeEnvironment(),
    canonicalUrl: siteUrl,
    gates,
    nextActions: [
      "Link the project to a real hosted runtime and add the production deployment credentials.",
      "Replace the current SQLite-backed authority with a shared durable backend for orders, notifications, and audit data.",
      "Upgrade the current signed-session ops gate into provider-backed auth and real RBAC.",
      "Clear the remaining sample-pack, legal, and business-input gates tracked in CONTENT-OWNERSHIP.md before public launch claims.",
    ],
  };
}
