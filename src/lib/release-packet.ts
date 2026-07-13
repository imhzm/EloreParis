import "server-only";

import { getContentGovernanceSummary } from "@/lib/content-governance";
import { getRuntimeSecretAlignmentSnapshot } from "@/lib/provider-runtime-config";
import { buildProviderIntegrationContract } from "@/lib/provider-integration-contract";
import { buildReleaseDecisionDelta } from "@/lib/release-decision-delta";
import { buildReleaseDecisionReview } from "@/lib/release-decision-review";
import { readReleaseDecisionHistory } from "@/lib/release-decision-history";
import { readReleaseHandoffHistory } from "@/lib/release-handoff-history";
import { getReleasePackageRecordById } from "@/lib/release-package-history";
import { buildReleaseHandoffReview } from "@/lib/release-handoff-review";
import { buildReleasePackageComparison } from "@/lib/release-package-comparison";
import {
  buildReleasePacketReviewToken,
  getReleasePacketReviewExpiresAt,
  getReleasePacketReviewWindowMinutes,
} from "@/lib/release-packet-review";
import { getSearchRuntimeStage, isSearchIndexingEnabled } from "@/lib/search-visibility";
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
  summary.push(packet.runtimeSecretAlignment.summary);
  summary.push(packet.integrationContract.summary);
  summary.push(packet.runtimeMonitoring.summary);
  summary.push(packet.rollbackBaseline.summary);
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

function buildRuntimeMonitoring(
  packet: Pick<
    ReleasePacketArtifact,
    "runtimeEnvironment" | "canonicalUrl" | "targetBaseUrl" | "verificationMode"
  >,
): ReleasePacketArtifact["runtimeMonitoring"] {
  const stage = getSearchRuntimeStage();
  const searchIndexingEnabled = isSearchIndexingEnabled();
  const expectedIndexingEnabled = stage === "production";
  const status = expectedIndexingEnabled === searchIndexingEnabled ? "ready" : "warning";
  const summary =
    stage === "production"
      ? searchIndexingEnabled
        ? "The runtime is in a production-search posture: canonical URLs are expected to be indexable."
        : "The runtime reports a production stage but search indexing is still disabled, so launch visibility is not aligned yet."
      : searchIndexingEnabled
        ? "The runtime is still non-production, but search indexing is enabled unexpectedly."
        : "The runtime is fenced from search indexing, which matches local or preview verification mode.";

  return {
    status,
    stage,
    searchIndexingEnabled,
    summary,
    details: [
      `Runtime environment: ${packet.runtimeEnvironment}`,
      `Runtime stage: ${stage}`,
      `Search indexing enabled: ${searchIndexingEnabled ? "yes" : "no"}`,
      `Canonical URL: ${packet.canonicalUrl}`,
      `Target base URL: ${packet.targetBaseUrl}`,
      `Verification mode: ${packet.verificationMode}`,
    ],
  };
}

function buildRollbackBaseline(
  packet: Pick<
    ReleasePacketArtifact,
    "comparison" | "latestPublishedRecord" | "targetBaseUrl"
  >,
): ReleasePacketArtifact["rollbackBaseline"] {
  const latestApprovedDecision = readReleaseDecisionHistory(20).find(
    (decision) => decision.verdict === "approve",
  );

  if (!latestApprovedDecision) {
    return {
      status: "blocked",
      summary:
        "No approved protected release package exists yet, so rollback still lacks a trusted baseline.",
      nextAction:
        "Publish a protected package from the intended runtime and record an approval before relying on rollback as an operating control.",
      packageRecordId: null,
      packagePublishedAt: null,
      verificationMode: null,
      targetBaseUrl: null,
      decisionId: null,
      decisionVerdict: null,
      decidedAt: null,
      details: [
        "The release history does not contain an approved decision yet.",
        "Hold decisions are useful for governance, but they do not establish a trusted rollback checkpoint.",
      ],
    };
  }

  const approvedPackage = getReleasePackageRecordById(
    latestApprovedDecision.releasePackageRecordId,
  );

  if (!approvedPackage) {
    return {
      status: "blocked",
      summary:
        "An approval exists in the decision trail, but its protected release package is missing from durable history.",
      nextAction:
        "Republish the protected release package before treating the historical approval as a rollback baseline.",
      packageRecordId: latestApprovedDecision.releasePackageRecordId,
      packagePublishedAt: null,
      verificationMode: null,
      targetBaseUrl: latestApprovedDecision.targetBaseUrl,
      decisionId: latestApprovedDecision.id,
      decisionVerdict: latestApprovedDecision.verdict,
      decidedAt: latestApprovedDecision.decidedAt,
      details: [
        `Approved decision: ${latestApprovedDecision.id}`,
        `Referenced package: ${latestApprovedDecision.releasePackageRecordId}`,
      ],
    };
  }

  const latestPublishedMatchesBaseline =
    packet.latestPublishedRecord?.id === approvedPackage.id;
  const currentRuntimeMatchesBaseline =
    latestPublishedMatchesBaseline && packet.comparison.status === "unchanged";

  return {
    status: "ready",
    summary: currentRuntimeMatchesBaseline
      ? `The current runtime still matches the latest approved package ${approvedPackage.id}, so rollback has a current trusted checkpoint.`
      : latestPublishedMatchesBaseline
        ? `The latest approved package ${approvedPackage.id} remains the immediate rollback target for the current runtime.`
        : `Rollback currently points to approved package ${approvedPackage.id}, which sits behind the latest publication trail.`,
    nextAction: currentRuntimeMatchesBaseline
      ? "Keep this approved package as the active rollback checkpoint until a newer approved package replaces it."
      : latestPublishedMatchesBaseline
        ? "Use this approved package as the first rollback target if the current runtime regresses after deploy."
        : "Re-verify whether this older approved package is still deployable before relying on it as the fallback checkpoint.",
    packageRecordId: approvedPackage.id,
    packagePublishedAt: approvedPackage.publishedAt,
    verificationMode: approvedPackage.verificationMode,
    targetBaseUrl: approvedPackage.targetBaseUrl,
    decisionId: latestApprovedDecision.id,
    decisionVerdict: latestApprovedDecision.verdict,
    decidedAt: latestApprovedDecision.decidedAt,
    details: [
      `Approved decision: ${latestApprovedDecision.id}`,
      `Decision recorded at: ${latestApprovedDecision.decidedAt}`,
      `Approved package: ${approvedPackage.id}`,
      `Package published at: ${approvedPackage.publishedAt}`,
      `Verification mode: ${approvedPackage.verificationMode}`,
      `Rollback target base URL: ${approvedPackage.targetBaseUrl}`,
      `Latest published package in runtime: ${packet.latestPublishedRecord?.id ?? "none"}`,
      `Current runtime drift status: ${packet.comparison.status}`,
    ],
  };
}

export function buildReleasePacketArtifact(): ReleasePacketArtifact {
  const comparison = buildReleasePackageComparison();
  const currentArtifact = comparison.currentArtifact;
  const latestPublishedRecord = comparison.latestPublishedRecord;
  const latestHandoff = readReleaseHandoffHistory(1)[0] ?? null;
  const latestDecision = readReleaseDecisionHistory(1)[0] ?? null;
  const contentGovernance = getContentGovernanceSummary();
  const runtimeSecretAlignment = getRuntimeSecretAlignmentSnapshot();
  const integrationContract = buildProviderIntegrationContract();
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
    runtimeSecretAlignment,
    integrationContract,
    runtimeMonitoring: {
      status: "blocked",
      stage: "local",
      searchIndexingEnabled: false,
      summary: "",
      details: [],
    },
    rollbackBaseline: {
      status: "blocked",
      summary: "",
      nextAction: "",
      packageRecordId: null,
      packagePublishedAt: null,
      verificationMode: null,
      targetBaseUrl: null,
      decisionId: null,
      decisionVerdict: null,
      decidedAt: null,
      details: [],
    },
  };

  packet.runtimeMonitoring = buildRuntimeMonitoring(packet);
  packet.rollbackBaseline = buildRollbackBaseline(packet);
  packet.executiveSummary = buildExecutiveSummary(packet);
  packet.blockerHighlights = buildBlockerHighlights(currentArtifact, comparison);

  return packet;
}
