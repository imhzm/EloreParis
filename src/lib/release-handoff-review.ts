import "server-only";

import { isReleasePacketReviewFresh } from "@/lib/release-packet-review";
import type { ReleaseHandoffRecord, ReleasePackageArtifact } from "@/lib/release-package-types";
import type { ReleasePacketHandoffReview } from "@/lib/release-packet-types";

function getActiveOwnerSummaries(currentArtifact: ReleasePackageArtifact) {
  return currentArtifact.releaseReadiness.ownerSummaries.filter(
    (summary) => summary.blockedCount > 0 || summary.warningCount > 0,
  );
}

export function buildReleaseHandoffReview(
  latestHandoff: ReleaseHandoffRecord | null,
  currentArtifact: ReleasePackageArtifact,
  reviewToken: string,
): ReleasePacketHandoffReview {
  const activeOwnerSummaries = getActiveOwnerSummaries(currentArtifact);
  const activeOwnerIds = activeOwnerSummaries.map((summary) => summary.ownerId);
  const evaluatedAt = new Date().toISOString();

  if (!activeOwnerIds.length) {
    return {
      evaluatedAt,
      status: "not_required",
      summary:
        "No active owner lanes currently require a blocker handoff from the executive packet.",
      details: [
        "Current runtime exposes no blocked or warning owner lanes that still need explicit handoff coverage.",
      ],
      latestHandoffId: latestHandoff?.id ?? null,
      reviewExpiresAt: latestHandoff ? latestHandoff.releasePacketGeneratedAt : null,
      activeOwnerIds,
      missingOwnerIds: [],
      unexpectedOwnerIds: [],
    };
  }

  if (!latestHandoff) {
    return {
      evaluatedAt,
      status: "missing",
      summary:
        "No blocker handoff has been recorded yet for the current executive packet.",
      details: [
        `Record a protected handoff for ${activeOwnerSummaries.length} active owner lanes before publishing the next protected release decision.`,
      ],
      latestHandoffId: null,
      reviewExpiresAt: null,
      activeOwnerIds,
      missingOwnerIds: activeOwnerIds,
      unexpectedOwnerIds: [],
    };
  }

  if (latestHandoff.releasePacketReviewToken !== reviewToken) {
    return {
      evaluatedAt,
      status: "stale_packet",
      summary:
        "The latest blocker handoff was recorded against an older executive packet and must be refreshed.",
      details: [
        `Latest handoff ${latestHandoff.id} is tied to review token ${latestHandoff.releasePacketReviewToken}, but the current packet token is ${reviewToken}.`,
      ],
      latestHandoffId: latestHandoff.id,
      reviewExpiresAt: latestHandoff.releasePacketGeneratedAt,
      activeOwnerIds,
      missingOwnerIds: activeOwnerIds,
      unexpectedOwnerIds: latestHandoff.handedOffOwnerIds,
    };
  }

  if (
    !isReleasePacketReviewFresh(
      latestHandoff.releasePacketGeneratedAt,
      currentArtifact.verificationMode,
    )
  ) {
    return {
      evaluatedAt,
      status: "expired_review",
      summary:
        "The latest blocker handoff is based on an expired executive review packet and must be refreshed.",
      details: [
        `Latest handoff ${latestHandoff.id} was recorded from packet ${latestHandoff.releasePacketGeneratedAt}, which is outside the current ${latestHandoff.releasePacketReviewWindowMinutes}-minute review window.`,
      ],
      latestHandoffId: latestHandoff.id,
      reviewExpiresAt: latestHandoff.releasePacketGeneratedAt,
      activeOwnerIds,
      missingOwnerIds: activeOwnerIds.filter(
        (ownerId) => !latestHandoff.handedOffOwnerIds.includes(ownerId),
      ),
      unexpectedOwnerIds: latestHandoff.handedOffOwnerIds.filter(
        (ownerId) => !activeOwnerIds.includes(ownerId),
      ),
    };
  }

  const missingOwnerIds = activeOwnerIds.filter(
    (ownerId) => !latestHandoff.handedOffOwnerIds.includes(ownerId),
  );
  const unexpectedOwnerIds = latestHandoff.handedOffOwnerIds.filter(
    (ownerId) => !activeOwnerIds.includes(ownerId),
  );

  if (missingOwnerIds.length > 0 || unexpectedOwnerIds.length > 0) {
    return {
      evaluatedAt,
      status: "partial",
      summary:
        "The latest blocker handoff does not cover the same owner lanes that are still active in the current executive packet.",
      details: [
        missingOwnerIds.length
          ? `Missing owner lanes: ${missingOwnerIds.join(", ")}.`
          : "No owner lanes are missing from the latest handoff.",
        unexpectedOwnerIds.length
          ? `Unexpected owner lanes: ${unexpectedOwnerIds.join(", ")}.`
          : "No unexpected owner lanes were carried into the latest handoff.",
      ],
      latestHandoffId: latestHandoff.id,
      reviewExpiresAt: latestHandoff.releasePacketGeneratedAt,
      activeOwnerIds,
      missingOwnerIds,
      unexpectedOwnerIds,
    };
  }

  return {
    evaluatedAt,
    status: "current",
    summary:
      "The latest blocker handoff still matches the current executive packet and covers every active owner lane.",
    details: [
      `Latest handoff ${latestHandoff.id} covers ${latestHandoff.handedOffOwnerIds.length} active owner lanes for the current executive packet.`,
    ],
    latestHandoffId: latestHandoff.id,
    reviewExpiresAt: latestHandoff.releasePacketGeneratedAt,
    activeOwnerIds,
    missingOwnerIds: [],
    unexpectedOwnerIds: [],
  };
}
