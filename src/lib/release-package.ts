import "server-only";

import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import type { ReleasePackageArtifact, ReleasePackageIssue } from "@/lib/release-package-types";
import type {
  ReleaseReadinessGate,
  ReleaseReadinessSnapshot,
  ReleaseRuntimePreflightCheck,
} from "@/lib/release-readiness-types";

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
