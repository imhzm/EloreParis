import { createHash } from "node:crypto";
import type { ContentGovernanceSummary } from "@/lib/content-governance";
import type { ReleasePackageArtifact } from "@/lib/release-package-types";
import type { ReleasePackageComparison } from "@/lib/release-package-types";

export function getReleasePacketReviewWindowMinutes(
  verificationMode: ReleasePackageArtifact["verificationMode"],
) {
  switch (verificationMode) {
    case "live_postdeploy":
      return 120;
    case "local_smoke":
      return 45;
    case "runtime_snapshot":
      return 30;
  }
}

export function getReleasePacketReviewExpiresAt(
  generatedAt: string,
  verificationMode: ReleasePackageArtifact["verificationMode"],
) {
  const generatedAtTime = Date.parse(generatedAt);

  if (!Number.isFinite(generatedAtTime)) {
    return null;
  }

  return new Date(
    generatedAtTime + getReleasePacketReviewWindowMinutes(verificationMode) * 60_000,
  ).toISOString();
}

export function isReleasePacketReviewFresh(
  generatedAt: string,
  verificationMode: ReleasePackageArtifact["verificationMode"],
  now = new Date(),
) {
  const expiresAt = getReleasePacketReviewExpiresAt(generatedAt, verificationMode);

  if (!expiresAt) {
    return false;
  }

  return Date.parse(expiresAt) >= now.getTime();
}

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
          runtimeSecretAlignment: comparison.currentArtifact.runtimeSecretAlignment,
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
