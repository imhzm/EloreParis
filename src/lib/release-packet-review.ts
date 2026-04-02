import { createHash } from "node:crypto";
import type { ContentGovernanceSummary } from "@/lib/content-governance";
import type { ReleasePackageComparison } from "@/lib/release-package-types";

export function buildReleasePacketReviewToken(
  comparison: ReleasePackageComparison,
  contentGovernance: ContentGovernanceSummary,
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        currentArtifact: {
          overallStatus: comparison.currentArtifact.overallStatus,
          verificationMode: comparison.currentArtifact.verificationMode,
          targetBaseUrl: comparison.currentArtifact.targetBaseUrl,
          runtimeEnvironment: comparison.currentArtifact.runtimeEnvironment,
          canonicalUrl: comparison.currentArtifact.canonicalUrl,
          blockedItemIds: comparison.currentArtifact.blockedItems.map((item) => item.id),
          warningItemIds: comparison.currentArtifact.warningItems.map((item) => item.id),
          nextActions: comparison.currentArtifact.nextActions,
        },
        latestPublishedRecordId: comparison.latestPublishedRecord?.id ?? null,
        comparisonStatus: comparison.status,
        blockedDelta: comparison.countDeltas.blocked.delta,
        warningDelta: comparison.countDeltas.warning.delta,
        readyDelta: comparison.countDeltas.ready.delta,
        contentGovernance: {
          launchBlocked: contentGovernance.launchBlocked,
          awaitingStyleSamples: contentGovernance.awaitingStyleSamples,
          awaitingBusinessInputs: contentGovernance.awaitingBusinessInputs,
          ownersMapped: contentGovernance.ownersMapped,
        },
      }),
    )
    .digest("hex");
}
