import "server-only";

import { getReleasePacketReviewWindowMinutes } from "@/lib/release-packet-review";
import type { OpsAuditActor } from "@/lib/ops-types";
import type { ReleaseHandoffRecord, ReleasePackageArtifact } from "@/lib/release-package-types";
import type {
  ReleaseReadinessOwnerSummary,
} from "@/lib/release-readiness-types";

export type ReleaseHandoffDraft = {
  rationale: string;
  notes: string[];
  handedOffOwnerIds: string[];
  releasePacketGeneratedAt: string;
  reviewToken: string;
};

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

function normalizeNotes(value: unknown) {
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

function normalizeHandedOffOwnerIds(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const handedOffOwnerIds = Array.from(
    new Set(
      value
        .map((ownerId) => (typeof ownerId === "string" ? ownerId.trim() : ""))
        .filter((ownerId) => ownerId.length > 0),
    ),
  );

  if (
    handedOffOwnerIds.length > 8 ||
    handedOffOwnerIds.some((ownerId) => ownerId.length > 120)
  ) {
    return null;
  }

  return handedOffOwnerIds;
}

function normalizeOwnerSummary(value: unknown): ReleaseReadinessOwnerSummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const summary = value as Record<string, unknown>;

  if (
    typeof summary.ownerId !== "string" ||
    typeof summary.ownerLabel !== "string" ||
    (summary.lane !== "delivery" &&
      summary.lane !== "platform" &&
      summary.lane !== "security" &&
      summary.lane !== "commerce" &&
      summary.lane !== "content") ||
    typeof summary.defaultPath !== "string" ||
    typeof summary.blockedCount !== "number" ||
    typeof summary.warningCount !== "number" ||
    typeof summary.readyCount !== "number" ||
    !Array.isArray(summary.itemIds) ||
    !Array.isArray(summary.itemTitles) ||
    typeof summary.nextStep !== "string"
  ) {
    return null;
  }

  return {
    ownerId: summary.ownerId,
    ownerLabel: summary.ownerLabel,
    lane: summary.lane,
    defaultPath: summary.defaultPath,
    blockedCount: summary.blockedCount,
    warningCount: summary.warningCount,
    readyCount: summary.readyCount,
    itemIds: summary.itemIds.filter((itemId): itemId is string => typeof itemId === "string"),
    itemTitles: summary.itemTitles.filter((title): title is string => typeof title === "string"),
    nextStep: summary.nextStep,
  };
}

export function normalizeReleaseHandoffDraft(
  value: unknown,
): ReleaseHandoffDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Record<string, unknown>;
  const rationale =
    typeof draft.rationale === "string" ? draft.rationale.trim() : "";
  const releasePacketGeneratedAt =
    typeof draft.releasePacketGeneratedAt === "string"
      ? draft.releasePacketGeneratedAt.trim()
      : "";
  const reviewToken =
    typeof draft.reviewToken === "string" ? draft.reviewToken.trim() : "";
  const notes = normalizeNotes(draft.notes);
  const handedOffOwnerIds = normalizeHandedOffOwnerIds(draft.handedOffOwnerIds);

  if (
    rationale.length < 16 ||
    rationale.length > 500 ||
    releasePacketGeneratedAt.length < 10 ||
    !Number.isFinite(Date.parse(releasePacketGeneratedAt)) ||
    reviewToken.length < 16 ||
    !notes ||
    !handedOffOwnerIds ||
    handedOffOwnerIds.length === 0
  ) {
    return null;
  }

  return {
    rationale,
    notes,
    handedOffOwnerIds,
    releasePacketGeneratedAt,
    reviewToken,
  };
}

export function normalizeReleaseHandoffRecord(
  value: unknown,
): ReleaseHandoffRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const notes = normalizeNotes(record.notes);
  const handedOffOwnerIds = normalizeHandedOffOwnerIds(record.handedOffOwnerIds);
  const ownerSummaries = Array.isArray(record.ownerSummaries)
    ? record.ownerSummaries
        .map((summary) => normalizeOwnerSummary(summary))
        .filter((summary): summary is ReleaseReadinessOwnerSummary => summary !== null)
    : null;
  const reviewWindowMinutes =
    typeof record.releasePacketReviewWindowMinutes === "number"
      ? record.releasePacketReviewWindowMinutes
      : isVerificationMode(record.verificationMode)
        ? getReleasePacketReviewWindowMinutes(record.verificationMode)
        : null;

  if (
    typeof record.id !== "string" ||
    typeof record.handedOffAt !== "string" ||
    !isOpsAuditActor(record.actor) ||
    typeof record.rationale !== "string" ||
    typeof record.releasePacketGeneratedAt !== "string" ||
    typeof record.releasePacketReviewToken !== "string" ||
    reviewWindowMinutes === null ||
    !isVerificationMode(record.verificationMode) ||
    typeof record.targetBaseUrl !== "string" ||
    (record.overallStatus !== "ready" &&
      record.overallStatus !== "warning" &&
      record.overallStatus !== "blocked") ||
    typeof record.blockedCount !== "number" ||
    typeof record.warningCount !== "number" ||
    typeof record.readyCount !== "number" ||
    !notes ||
    !handedOffOwnerIds ||
    !ownerSummaries
  ) {
    return null;
  }

  return {
    id: record.id,
    handedOffAt: record.handedOffAt,
    actor: record.actor,
    rationale: record.rationale,
    notes,
    handedOffOwnerIds,
    ownerSummaries,
    releasePacketGeneratedAt: record.releasePacketGeneratedAt,
    releasePacketReviewToken: record.releasePacketReviewToken,
    releasePacketReviewWindowMinutes: reviewWindowMinutes,
    verificationMode: record.verificationMode,
    targetBaseUrl: record.targetBaseUrl,
    overallStatus: record.overallStatus,
    blockedCount: record.blockedCount,
    warningCount: record.warningCount,
    readyCount: record.readyCount,
  };
}
