import "server-only";

import type { OpsAuditActor } from "@/lib/ops-types";
import type {
  ReleaseDecisionRecord,
  ReleaseDecisionVerdict,
  ReleasePackageArtifact,
} from "@/lib/release-package-types";

export type ReleaseDecisionDraft = {
  verdict: ReleaseDecisionVerdict;
  rationale: string;
  notes: string[];
};

function isReleaseDecisionVerdict(value: unknown): value is ReleaseDecisionVerdict {
  return value === "hold" || value === "approve";
}

function isVerificationMode(
  value: unknown,
): value is ReleasePackageArtifact["verificationMode"] {
  return (
    value === "local_smoke" ||
    value === "live_postdeploy" ||
    value === "runtime_snapshot"
  );
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

function normalizeDecisionNotes(value: unknown) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const notes = value
    .map((note) => (typeof note === "string" ? note.trim() : ""))
    .filter((note) => note.length > 0);

  if (notes.length > 6 || notes.some((note) => note.length > 240)) {
    return null;
  }

  return notes;
}

export function normalizeReleaseDecisionDraft(
  value: unknown,
): ReleaseDecisionDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Record<string, unknown>;
  const rationale =
    typeof draft.rationale === "string" ? draft.rationale.trim() : "";
  const notes = normalizeDecisionNotes(draft.notes);

  if (
    !isReleaseDecisionVerdict(draft.verdict) ||
    rationale.length < 16 ||
    rationale.length > 500 ||
    !notes
  ) {
    return null;
  }

  return {
    verdict: draft.verdict,
    rationale,
    notes,
  };
}

export function normalizeReleaseDecisionRecord(
  value: unknown,
): ReleaseDecisionRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const notes = normalizeDecisionNotes(record.notes);

  if (
    typeof record.id !== "string" ||
    typeof record.decidedAt !== "string" ||
    !isOpsAuditActor(record.actor) ||
    !isReleaseDecisionVerdict(record.verdict) ||
    typeof record.rationale !== "string" ||
    typeof record.releasePackageRecordId !== "string" ||
    typeof record.releasePackagePublishedAt !== "string" ||
    !isVerificationMode(record.verificationMode) ||
    typeof record.targetBaseUrl !== "string" ||
    (record.overallStatus !== "ready" &&
      record.overallStatus !== "warning" &&
      record.overallStatus !== "blocked") ||
    (record.compareStatus !== "unpublished" &&
      record.compareStatus !== "unchanged" &&
      record.compareStatus !== "changed") ||
    typeof record.blockedCount !== "number" ||
    typeof record.warningCount !== "number" ||
    typeof record.readyCount !== "number" ||
    !notes
  ) {
    return null;
  }

  return {
    id: record.id,
    decidedAt: record.decidedAt,
    actor: record.actor,
    verdict: record.verdict,
    rationale: record.rationale,
    notes,
    releasePackageRecordId: record.releasePackageRecordId,
    releasePackagePublishedAt: record.releasePackagePublishedAt,
    verificationMode: record.verificationMode,
    targetBaseUrl: record.targetBaseUrl,
    overallStatus: record.overallStatus,
    compareStatus: record.compareStatus,
    blockedCount: record.blockedCount,
    warningCount: record.warningCount,
    readyCount: record.readyCount,
  };
}
