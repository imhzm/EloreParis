import "server-only";

import { normalizeReleaseEvidenceReport } from "@/lib/release-evidence";
import {
  buildReleaseOwnerSummaries,
  normalizeReleaseActionOwner,
} from "@/lib/release-ownership";
import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import type {
  ReleasePackageArtifact,
  ReleasePackageIssue,
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import type {
  ReleaseReadinessGate,
  ReleaseReadinessSnapshot,
  ReleaseReadinessStatus,
  ReleaseRuntimePreflightCheck,
} from "@/lib/release-readiness-types";
import type { OpsAuditActor } from "@/lib/ops-types";

function mapGateToIssue(gate: ReleaseReadinessGate): ReleasePackageIssue {
  return {
    id: gate.id,
    title: gate.title,
    status: gate.status,
    source: "gate",
    summary: gate.summary,
    details: gate.details,
    owner: gate.owner,
    resolutionAction: gate.resolutionAction,
  };
}

function mapPreflightToIssue(
  check: ReleaseRuntimePreflightCheck,
): ReleasePackageIssue {
  return {
    id: check.id,
    title: check.title,
    status: check.status,
    source: "runtime_preflight",
    summary: check.summary,
    details: check.details,
    owner: check.owner,
    resolutionAction: check.resolutionAction,
  };
}

function collectIssues(snapshot: ReleaseReadinessSnapshot) {
  return [
    ...snapshot.gates.map((gate) => mapGateToIssue(gate)),
    ...snapshot.runtimePreflight.checks.map((check) => mapPreflightToIssue(check)),
  ];
}

function isReleaseReadinessStatus(value: unknown): value is ReleaseReadinessStatus {
  return value === "ready" || value === "warning" || value === "blocked";
}

function normalizeReleaseReadinessGate(
  value: unknown,
): ReleaseReadinessGate | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const gate = value as Record<string, unknown>;

  if (
    typeof gate.id !== "string" ||
    typeof gate.title !== "string" ||
    !isReleaseReadinessStatus(gate.status) ||
    typeof gate.summary !== "string" ||
    !Array.isArray(gate.details)
  ) {
    return null;
  }

  return {
    id: gate.id,
    title: gate.title,
    status: gate.status,
    summary: gate.summary,
    details: gate.details.filter((detail): detail is string => typeof detail === "string"),
    owner: normalizeReleaseActionOwner(gate.owner, gate.id),
    resolutionAction:
      typeof gate.resolutionAction === "string"
        ? gate.resolutionAction
        : "Refresh the current release packet to recover the latest resolution step for this gate.",
  };
}

function normalizeReleaseRuntimePreflightCheck(
  value: unknown,
): ReleaseRuntimePreflightCheck | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const check = value as Record<string, unknown>;

  if (
    typeof check.id !== "string" ||
    typeof check.title !== "string" ||
    !isReleaseReadinessStatus(check.status) ||
    typeof check.summary !== "string" ||
    !Array.isArray(check.details)
  ) {
    return null;
  }

  return {
    id: check.id,
    title: check.title,
    status: check.status,
    summary: check.summary,
    details: check.details.filter((detail): detail is string => typeof detail === "string"),
    owner: normalizeReleaseActionOwner(check.owner, check.id),
    resolutionAction:
      typeof check.resolutionAction === "string"
        ? check.resolutionAction
        : "Refresh the current release packet to recover the latest resolution step for this runtime preflight check.",
  };
}

function normalizeReleaseReadinessSnapshot(
  value: unknown,
): ReleaseReadinessSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const snapshot = value as Record<string, unknown>;
  const gates = Array.isArray(snapshot.gates)
    ? snapshot.gates
        .map((gate) => normalizeReleaseReadinessGate(gate))
        .filter((gate): gate is ReleaseReadinessGate => gate !== null)
    : null;
  const runtimePreflightChecks =
    snapshot.runtimePreflight &&
    typeof snapshot.runtimePreflight === "object" &&
    Array.isArray((snapshot.runtimePreflight as { checks?: unknown[] }).checks)
      ? (snapshot.runtimePreflight as { checks: unknown[] }).checks
          .map((check) => normalizeReleaseRuntimePreflightCheck(check))
          .filter(
            (check): check is ReleaseRuntimePreflightCheck => check !== null,
          )
      : null;
  const nextActions = Array.isArray(snapshot.nextActions)
    ? snapshot.nextActions.filter((action): action is string => typeof action === "string")
    : null;

  if (
    !isReleaseReadinessStatus(snapshot.overallStatus) ||
    typeof snapshot.blockedCount !== "number" ||
    typeof snapshot.warningCount !== "number" ||
    typeof snapshot.readyCount !== "number" ||
    typeof snapshot.runtimeEnvironment !== "string" ||
    typeof snapshot.canonicalUrl !== "string" ||
    !gates ||
    !runtimePreflightChecks ||
    !nextActions
  ) {
    return null;
  }

  return {
    overallStatus: snapshot.overallStatus,
    blockedCount: snapshot.blockedCount,
    warningCount: snapshot.warningCount,
    readyCount: snapshot.readyCount,
    runtimeEnvironment: snapshot.runtimeEnvironment,
    canonicalUrl: snapshot.canonicalUrl,
    gates,
    runtimePreflight: {
      overallStatus:
        snapshot.runtimePreflight &&
        typeof snapshot.runtimePreflight === "object" &&
        isReleaseReadinessStatus(
          (snapshot.runtimePreflight as { overallStatus?: unknown }).overallStatus,
        )
          ? (snapshot.runtimePreflight as { overallStatus: ReleaseReadinessStatus }).overallStatus
          : "blocked",
      blockedCount:
        snapshot.runtimePreflight &&
        typeof snapshot.runtimePreflight === "object" &&
        typeof (snapshot.runtimePreflight as { blockedCount?: unknown }).blockedCount === "number"
          ? (snapshot.runtimePreflight as { blockedCount: number }).blockedCount
          : runtimePreflightChecks.filter((check) => check.status === "blocked").length,
      warningCount:
        snapshot.runtimePreflight &&
        typeof snapshot.runtimePreflight === "object" &&
        typeof (snapshot.runtimePreflight as { warningCount?: unknown }).warningCount === "number"
          ? (snapshot.runtimePreflight as { warningCount: number }).warningCount
          : runtimePreflightChecks.filter((check) => check.status === "warning").length,
      readyCount:
        snapshot.runtimePreflight &&
        typeof snapshot.runtimePreflight === "object" &&
        typeof (snapshot.runtimePreflight as { readyCount?: unknown }).readyCount === "number"
          ? (snapshot.runtimePreflight as { readyCount: number }).readyCount
          : runtimePreflightChecks.filter((check) => check.status === "ready").length,
      checks: runtimePreflightChecks,
    },
    ownerSummaries: buildReleaseOwnerSummaries([
      ...gates,
      ...runtimePreflightChecks,
    ]),
    nextActions,
  };
}

function normalizeReleasePackageIssue(value: unknown): ReleasePackageIssue | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const issue = value as Record<string, unknown>;

  if (
    typeof issue.id !== "string" ||
    typeof issue.title !== "string" ||
    !isReleaseReadinessStatus(issue.status) ||
    (issue.source !== "gate" && issue.source !== "runtime_preflight") ||
    typeof issue.summary !== "string" ||
    !Array.isArray(issue.details)
  ) {
    return null;
  }

  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    source: issue.source,
    summary: issue.summary,
    details: issue.details.filter((detail): detail is string => typeof detail === "string"),
    owner: normalizeReleaseActionOwner(issue.owner, issue.id),
    resolutionAction:
      typeof issue.resolutionAction === "string"
        ? issue.resolutionAction
        : "Refresh the current release packet to recover the latest resolution step for this item.",
  };
}

function isOpsAuditActor(value: unknown): value is OpsAuditActor {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as OpsAuditActor).userId === "string" &&
    typeof (value as OpsAuditActor).name === "string" &&
    typeof (value as OpsAuditActor).role === "string"
  );
}

export function buildReleasePackageArtifact(
  snapshot: ReleaseReadinessSnapshot,
  releaseEvidence: ReleaseEvidenceReport | null,
): ReleasePackageArtifact {
  const issues = collectIssues(snapshot);
  const blockedItems = issues.filter((issue) => issue.status === "blocked");
  const warningItems = issues.filter((issue) => issue.status === "warning");

  return {
    generatedAt: new Date().toISOString(),
    verificationMode: releaseEvidence?.verificationMode ?? "runtime_snapshot",
    targetBaseUrl: releaseEvidence?.targetBaseUrl ?? snapshot.canonicalUrl,
    runtimeEnvironment: snapshot.runtimeEnvironment,
    canonicalUrl: snapshot.canonicalUrl,
    overallStatus: snapshot.overallStatus,
    blockedCount: blockedItems.length,
    warningCount: warningItems.length,
    readyCount: issues.filter((issue) => issue.status === "ready").length,
    blockedItems,
    warningItems,
    nextActions: snapshot.nextActions,
    releaseReadiness: snapshot,
    releaseEvidence,
  };
}

export function normalizeReleasePackageArtifact(
  value: unknown,
): ReleasePackageArtifact | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const artifact = value as Record<string, unknown>;
  const blockedItems = Array.isArray(artifact.blockedItems)
    ? artifact.blockedItems
        .map((issue) => normalizeReleasePackageIssue(issue))
        .filter((issue): issue is ReleasePackageIssue => issue !== null)
    : null;
  const warningItems = Array.isArray(artifact.warningItems)
    ? artifact.warningItems
        .map((issue) => normalizeReleasePackageIssue(issue))
        .filter((issue): issue is ReleasePackageIssue => issue !== null)
    : null;
  const nextActions = Array.isArray(artifact.nextActions)
    ? artifact.nextActions.filter((action): action is string => typeof action === "string")
    : null;
  const releaseEvidence =
    artifact.releaseEvidence === null || artifact.releaseEvidence === undefined
      ? null
      : normalizeReleaseEvidenceReport(artifact.releaseEvidence);
  const releaseReadiness = normalizeReleaseReadinessSnapshot(artifact.releaseReadiness);

  if (
    typeof artifact.generatedAt !== "string" ||
    (artifact.verificationMode !== "local_smoke" &&
      artifact.verificationMode !== "live_postdeploy" &&
      artifact.verificationMode !== "runtime_snapshot") ||
    typeof artifact.targetBaseUrl !== "string" ||
    typeof artifact.runtimeEnvironment !== "string" ||
    typeof artifact.canonicalUrl !== "string" ||
    !isReleaseReadinessStatus(artifact.overallStatus) ||
    typeof artifact.blockedCount !== "number" ||
    typeof artifact.warningCount !== "number" ||
    typeof artifact.readyCount !== "number" ||
    !blockedItems ||
    !warningItems ||
    !nextActions ||
    !releaseReadiness ||
    (artifact.releaseEvidence !== null &&
      artifact.releaseEvidence !== undefined &&
      !releaseEvidence)
  ) {
    return null;
  }

  return {
    ...artifact,
    releaseReadiness,
    releaseEvidence,
  } as ReleasePackageArtifact;
}

export function normalizeReleasePackageRecord(
  value: unknown,
): ReleasePackageRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const artifact = normalizeReleasePackageArtifact(record.artifact);

  if (
    typeof record.id !== "string" ||
    typeof record.publishedAt !== "string" ||
    !isOpsAuditActor(record.actor) ||
    !isReleaseReadinessStatus(record.overallStatus) ||
    (record.verificationMode !== "local_smoke" &&
      record.verificationMode !== "live_postdeploy" &&
      record.verificationMode !== "runtime_snapshot") ||
    typeof record.targetBaseUrl !== "string" ||
    typeof record.blockedCount !== "number" ||
    typeof record.warningCount !== "number" ||
    typeof record.readyCount !== "number" ||
    !artifact
  ) {
    return null;
  }

  return {
    id: record.id,
    publishedAt: record.publishedAt,
    actor: record.actor,
    overallStatus: record.overallStatus,
    verificationMode: record.verificationMode,
    targetBaseUrl: record.targetBaseUrl,
    blockedCount: record.blockedCount,
    warningCount: record.warningCount,
    readyCount: record.readyCount,
    artifact,
  };
}
