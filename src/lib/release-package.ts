import "server-only";

import { normalizeReleaseEvidenceReport } from "@/lib/release-evidence";
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
    !artifact.releaseReadiness ||
    typeof artifact.releaseReadiness !== "object" ||
    (artifact.releaseEvidence !== null &&
      artifact.releaseEvidence !== undefined &&
      !releaseEvidence)
  ) {
    return null;
  }

  return {
    ...artifact,
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
