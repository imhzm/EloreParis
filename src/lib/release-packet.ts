import "server-only";

import { getContentGovernanceSummary } from "@/lib/content-governance";
import { buildReleaseDecisionDelta } from "@/lib/release-decision-delta";
import { buildReleaseDecisionReview } from "@/lib/release-decision-review";
import { readReleaseDecisionHistory } from "@/lib/release-decision-history";
import { readReleaseHandoffHistory } from "@/lib/release-handoff-history";
import { buildReleaseHandoffReview } from "@/lib/release-handoff-review";
import { buildReleasePackageComparison } from "@/lib/release-package-comparison";
import {
  buildReleasePacketReviewToken,
  getReleasePacketReviewExpiresAt,
  getReleasePacketReviewWindowMinutes,
} from "@/lib/release-packet-review";
import type { ReleasePacketArtifact } from "@/lib/release-packet-types";

function buildExecutiveSummary(packet: ReleasePacketArtifact) {
  const blockedOwnerSummaries = packet.currentArtifact.releaseReadiness.ownerSummaries.filter(
    (summary) => summary.blockedCount > 0,
  );
  const summary = [
    `Current runtime package is ${packet.overallStatus} with ${packet.currentArtifact.blockedCount} blocked, ${packet.currentArtifact.warningCount} warnings, and ${packet.currentArtifact.readyCount} ready items.`,
  ];

  if (packet.latestPublishedRecord) {
    summary.push(
      `Latest protected package ${packet.latestPublishedRecord.id} was published in ${packet.latestPublishedRecord.verificationMode} mode for ${packet.latestPublishedRecord.targetBaseUrl}.`,
    );
  } else {
    summary.push(
      "No protected release package has been published yet from the current runtime authority.",
    );
  }

  if (packet.latestDecision) {
    summary.push(
      `${packet.latestDecision.actor.name} left the latest protected package on ${packet.latestDecision.verdict} with compare status ${packet.latestDecision.compareStatus}.`,
    );
  } else {
    summary.push(
      "No protected release decision has been recorded yet for the latest package trail.",
    );
  }

  summary.push(packet.latestHandoffReview.summary);
  summary.push(packet.latestDecisionReview.summary);
  summary.push(packet.latestDecisionDelta.summary[0]);

  if (packet.comparison.status === "unchanged") {
    summary.push(
      "Current runtime is still in sync with the latest published package.",
    );
  } else if (packet.comparison.status === "changed") {
    summary.push(
      "Current runtime has drifted from the latest published package and needs release review before any approval claim.",
    );
  } else {
    summary.push(
      "Current runtime is ahead of the protected publication trail and still needs a package publication before drift review is meaningful.",
    );
  }

  summary.push(
    `${packet.contentGovernance.launchBlocked} content governance groups still block launch, with ${packet.contentGovernance.awaitingStyleSamples} waiting for style samples and ${packet.contentGovernance.awaitingBusinessInputs} waiting for business inputs.`,
  );
  if (blockedOwnerSummaries.length) {
    summary.push(
      `${blockedOwnerSummaries.length} owner lanes still carry blocked work, led by ${blockedOwnerSummaries[0].ownerLabel} with ${blockedOwnerSummaries[0].blockedCount} blocked items.`,
    );
  } else {
    summary.push(
      "No owner lane currently carries blocked release work inside the runtime packet.",
    );
  }
  summary.push(
    `This executive packet should be refreshed within ${packet.reviewWindowMinutes} minutes, before ${packet.reviewExpiresAt}, before a protected release decision is recorded.`,
  );

  return summary;
}

function buildBlockerHighlights(
  currentArtifact: ReleasePacketArtifact["currentArtifact"],
  comparison: ReleasePacketArtifact["comparison"],
) {
  const blockedHighlights = currentArtifact.blockedItems.map(
    (item) =>
      `${item.title}: ${item.summary} Owner: ${item.owner.label}. Next step: ${item.resolutionAction}`,
  );

  if (blockedHighlights.length) {
    return blockedHighlights.slice(0, 5);
  }

  const warningHighlights = currentArtifact.warningItems.map(
    (item) =>
      `${item.title}: ${item.summary} Owner: ${item.owner.label}. Next step: ${item.resolutionAction}`,
  );

  if (warningHighlights.length) {
    return warningHighlights.slice(0, 5);
  }

  if (comparison.status === "unpublished") {
    return [
      "The current runtime has not published a protected release package yet, so drift and decision governance remain incomplete.",
    ];
  }

  return [
    "No blocked items remain in the current runtime package. Review current warnings and the latest decision trail before promotion.",
  ];
}

export function buildReleasePacketArtifact(): ReleasePacketArtifact {
  const comparison = buildReleasePackageComparison();
  const currentArtifact = comparison.currentArtifact;
  const latestPublishedRecord = comparison.latestPublishedRecord;
  const latestHandoff = readReleaseHandoffHistory(1)[0] ?? null;
  const latestDecision = readReleaseDecisionHistory(1)[0] ?? null;
  const contentGovernance = getContentGovernanceSummary();
  const generatedAt = new Date().toISOString();
  const reviewToken = buildReleasePacketReviewToken(comparison, contentGovernance);
  const reviewWindowMinutes = getReleasePacketReviewWindowMinutes(
    currentArtifact.verificationMode,
  );
  const reviewExpiresAt =
    getReleasePacketReviewExpiresAt(
      generatedAt,
      currentArtifact.verificationMode,
    ) ?? generatedAt;

  const packet: ReleasePacketArtifact = {
    generatedAt,
    reviewToken,
    reviewWindowMinutes,
    reviewExpiresAt,
    overallStatus: currentArtifact.overallStatus,
    verificationMode: currentArtifact.verificationMode,
    targetBaseUrl: currentArtifact.targetBaseUrl,
    runtimeEnvironment: currentArtifact.runtimeEnvironment,
    canonicalUrl: currentArtifact.canonicalUrl,
    executiveSummary: [],
    blockerHighlights: [],
    nextActions: currentArtifact.nextActions,
    currentArtifact,
    latestPublishedRecord,
    latestHandoff,
    latestHandoffReview: buildReleaseHandoffReview(
      latestHandoff,
      currentArtifact,
      reviewToken,
    ),
    latestDecision,
    latestDecisionReview: buildReleaseDecisionReview(
      latestDecision,
      latestPublishedRecord,
      currentArtifact,
      reviewToken,
    ),
    latestDecisionDelta: buildReleaseDecisionDelta(
      latestDecision?.releasePackageRecordId ?? null,
      currentArtifact,
      latestPublishedRecord ? "missing" : "unpublished",
    ),
    comparison,
    contentGovernance,
  };

  packet.executiveSummary = buildExecutiveSummary(packet);
  packet.blockerHighlights = buildBlockerHighlights(currentArtifact, comparison);

  return packet;
}
