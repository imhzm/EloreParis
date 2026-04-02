import "server-only";

import { getContentGovernanceSummary } from "@/lib/content-governance";
import { buildReleaseDecisionReview } from "@/lib/release-decision-review";
import { readReleaseDecisionHistory } from "@/lib/release-decision-history";
import { buildReleasePackageComparison } from "@/lib/release-package-comparison";
import {
  buildReleasePacketReviewToken,
  getReleasePacketReviewExpiresAt,
  getReleasePacketReviewWindowMinutes,
} from "@/lib/release-packet-review";
import type { ReleasePacketArtifact } from "@/lib/release-packet-types";

function buildExecutiveSummary(packet: ReleasePacketArtifact) {
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

  summary.push(packet.latestDecisionReview.summary);

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
    (item) => `${item.title}: ${item.summary}`,
  );

  if (blockedHighlights.length) {
    return blockedHighlights.slice(0, 5);
  }

  const warningHighlights = currentArtifact.warningItems.map(
    (item) => `${item.title}: ${item.summary}`,
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
    latestDecision,
    latestDecisionReview: buildReleaseDecisionReview(
      latestDecision,
      latestPublishedRecord,
      reviewToken,
    ),
    comparison,
    contentGovernance,
  };

  packet.executiveSummary = buildExecutiveSummary(packet);
  packet.blockerHighlights = buildBlockerHighlights(currentArtifact, comparison);

  return packet;
}
