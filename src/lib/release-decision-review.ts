import "server-only";

import type {
  ReleaseDecisionRecord,
  ReleasePackageArtifact,
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import type {
  ReleasePacketDecisionReview,
} from "@/lib/release-packet-types";

function getDecisionReviewExpiresAt(decision: ReleaseDecisionRecord) {
  const generatedAtTime = Date.parse(decision.releasePacketGeneratedAt);

  if (!Number.isFinite(generatedAtTime)) {
    return null;
  }

  return new Date(
    generatedAtTime + decision.releasePacketReviewWindowMinutes * 60_000,
  ).toISOString();
}

export function buildReleaseDecisionReview(
  latestDecision: ReleaseDecisionRecord | null,
  latestPublishedRecord: ReleasePackageRecord | null,
  currentArtifact: ReleasePackageArtifact,
  currentReviewToken: string,
  now = new Date(),
): ReleasePacketDecisionReview {
  const evaluatedAt = now.toISOString();
  const latestDecisionId = latestDecision?.id ?? null;

  if (!latestPublishedRecord) {
    return {
      evaluatedAt,
      status: "unpublished",
      summary:
        "No protected release package has been published yet, so the decision trail cannot be current.",
      details: [
        "Publish a protected release package before relying on the release decision trail.",
      ],
      latestDecisionId,
      reviewExpiresAt: null,
    };
  }

  if (!latestDecision) {
    return {
      evaluatedAt,
      status: "missing",
      summary:
        "No release decision has been recorded yet for the latest protected package.",
      details: [
        `Latest protected package is ${latestPublishedRecord.id}.`,
        "Record a hold or approve verdict from the protected release surface.",
      ],
      latestDecisionId: null,
      reviewExpiresAt: null,
    };
  }

  const reviewExpiresAt = getDecisionReviewExpiresAt(latestDecision);

  if (latestDecision.releasePackageRecordId !== latestPublishedRecord.id) {
    return {
      evaluatedAt,
      status: "stale_package",
      summary:
        "The latest recorded release decision points to an older protected package and must be refreshed.",
      details: [
        `Latest decision targets ${latestDecision.releasePackageRecordId}.`,
        `Latest protected package is ${latestPublishedRecord.id}.`,
        `Current runtime package is ${currentArtifact.overallStatus} with ${currentArtifact.blockedCount} blocked and ${currentArtifact.warningCount} warnings.`,
      ],
      latestDecisionId,
      reviewExpiresAt,
    };
  }

  if (latestDecision.releasePacketReviewToken !== currentReviewToken) {
    return {
      evaluatedAt,
      status: "stale_packet",
      summary:
        "The latest recorded release decision no longer matches the current executive release packet.",
      details: [
        "Current runtime blockers, drift state, or governance inputs changed after the verdict was recorded.",
        "Refresh the release surface and record a new protected decision.",
        `Current runtime package is ${currentArtifact.overallStatus} with ${currentArtifact.blockedCount} blocked and ${currentArtifact.warningCount} warnings.`,
      ],
      latestDecisionId,
      reviewExpiresAt,
    };
  }

  if (!reviewExpiresAt || Date.parse(reviewExpiresAt) < now.getTime()) {
    return {
      evaluatedAt,
      status: "expired_review",
      summary:
        "The latest recorded release decision is outside its allowed review window and must be refreshed.",
      details: [
        `Latest decision review window expired at ${reviewExpiresAt ?? "an invalid timestamp"}.`,
        "Refresh the executive packet and record a new protected decision.",
        `Current runtime package is ${currentArtifact.overallStatus} with ${currentArtifact.blockedCount} blocked and ${currentArtifact.warningCount} warnings.`,
      ],
      latestDecisionId,
      reviewExpiresAt,
    };
  }

  return {
    evaluatedAt,
    status: "current",
    summary:
      "The latest recorded release decision still matches the current protected package and executive packet.",
    details: [
      `Latest protected package is ${latestPublishedRecord.id}.`,
      `The current review window remains valid until ${reviewExpiresAt}.`,
    ],
    latestDecisionId,
    reviewExpiresAt,
  };
}
