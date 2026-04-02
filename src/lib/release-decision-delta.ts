import "server-only";

import { getReleasePackageRecordById } from "@/lib/release-package-history";
import type {
  ReleasePackageArtifact,
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import type {
  ReleasePacketDecisionDelta,
} from "@/lib/release-packet-types";

function getItemIds(items: ReleasePackageArtifact["blockedItems"]) {
  return new Set(items.map((item) => item.id));
}

function getAddedItems(
  baselineItems: ReleasePackageArtifact["blockedItems"],
  currentItems: ReleasePackageArtifact["blockedItems"],
) {
  const baselineIds = getItemIds(baselineItems);

  return currentItems
    .map((item) => item.id)
    .filter((itemId) => !baselineIds.has(itemId));
}

function getClearedItems(
  baselineItems: ReleasePackageArtifact["blockedItems"],
  currentItems: ReleasePackageArtifact["blockedItems"],
) {
  const currentIds = getItemIds(currentItems);

  return baselineItems
    .map((item) => item.id)
    .filter((itemId) => !currentIds.has(itemId));
}

function hasNextActionsChanged(
  baselineRecord: ReleasePackageRecord,
  currentArtifact: ReleasePackageArtifact,
) {
  const baselineActions = baselineRecord.artifact.nextActions;
  const currentActions = currentArtifact.nextActions;

  if (baselineActions.length !== currentActions.length) {
    return true;
  }

  return baselineActions.some((action, index) => action !== currentActions[index]);
}

function buildMissingDelta(
  status: ReleasePacketDecisionDelta["status"],
): ReleasePacketDecisionDelta {
  if (status === "unpublished") {
    return {
      status,
      decisionPackageRecordId: null,
      baselinePublishedAt: null,
      countDeltas: null,
      changedFields: null,
      blockedItems: null,
      warningItems: null,
      summary: [
        "No published release package exists yet, so there is no decision baseline to compare against the current runtime.",
      ],
    };
  }

  return {
    status,
    decisionPackageRecordId: null,
    baselinePublishedAt: null,
    countDeltas: null,
    changedFields: null,
    blockedItems: null,
    warningItems: null,
    summary: [
      "No release decision exists yet, so there is no protected verdict baseline to compare against the current runtime.",
    ],
  };
}

function buildPackageMissingDelta(decisionPackageRecordId: string) {
  return {
    status: "package_missing" as const,
    decisionPackageRecordId,
    baselinePublishedAt: null,
    countDeltas: null,
    changedFields: null,
    blockedItems: null,
    warningItems: null,
    summary: [
      `The latest release decision points to ${decisionPackageRecordId}, but that package is no longer available in the retained release history.`,
      "Publish a fresh protected package and record a new decision to restore a reliable baseline.",
    ],
  };
}

function buildDecisionDeltaSummary(
  baselineRecord: ReleasePackageRecord,
  currentArtifact: ReleasePackageArtifact,
  delta: Omit<ReleasePacketDecisionDelta, "decisionPackageRecordId" | "baselinePublishedAt" | "summary">,
) {
  if (delta.status === "unchanged") {
    return [
      `Current runtime still matches the package reviewed by the latest decision, ${baselineRecord.id}.`,
      `Verification mode remains ${currentArtifact.verificationMode} against ${currentArtifact.targetBaseUrl}.`,
    ];
  }

  const summary: string[] = [];

  if (delta.changedFields?.overallStatus) {
    summary.push(
      `Overall status changed from ${baselineRecord.overallStatus} to ${currentArtifact.overallStatus}.`,
    );
  }

  if (delta.changedFields?.verificationMode) {
    summary.push(
      `Verification mode changed from ${baselineRecord.verificationMode} to ${currentArtifact.verificationMode}.`,
    );
  }

  if (delta.changedFields?.targetBaseUrl) {
    summary.push(
      `Target base URL changed from ${baselineRecord.targetBaseUrl} to ${currentArtifact.targetBaseUrl}.`,
    );
  }

  if (delta.blockedItems?.added.length) {
    summary.push(`Blocked items added since the latest decision: ${delta.blockedItems.added.join(", ")}.`);
  }

  if (delta.blockedItems?.cleared.length) {
    summary.push(`Blocked items cleared since the latest decision: ${delta.blockedItems.cleared.join(", ")}.`);
  }

  if (delta.warningItems?.added.length) {
    summary.push(`Warning items added since the latest decision: ${delta.warningItems.added.join(", ")}.`);
  }

  if (delta.warningItems?.cleared.length) {
    summary.push(`Warning items cleared since the latest decision: ${delta.warningItems.cleared.join(", ")}.`);
  }

  if (!summary.length) {
    summary.push(
      "The current runtime differs from the package reviewed by the latest decision in counts or next actions only.",
    );
  }

  return summary;
}

export function buildReleaseDecisionDelta(
  latestDecisionPackageRecordId: string | null,
  currentArtifact: ReleasePackageArtifact,
  fallbackStatus: "unpublished" | "missing",
): ReleasePacketDecisionDelta {
  if (!latestDecisionPackageRecordId) {
    return buildMissingDelta(fallbackStatus);
  }

  const baselineRecord = getReleasePackageRecordById(latestDecisionPackageRecordId);

  if (!baselineRecord) {
    return buildPackageMissingDelta(latestDecisionPackageRecordId);
  }

  const blockedAdded = getAddedItems(
    baselineRecord.artifact.blockedItems,
    currentArtifact.blockedItems,
  );
  const blockedCleared = getClearedItems(
    baselineRecord.artifact.blockedItems,
    currentArtifact.blockedItems,
  );
  const warningsAdded = getAddedItems(
    baselineRecord.artifact.warningItems,
    currentArtifact.warningItems,
  );
  const warningsCleared = getClearedItems(
    baselineRecord.artifact.warningItems,
    currentArtifact.warningItems,
  );

  const deltaBase: Omit<
    ReleasePacketDecisionDelta,
    "decisionPackageRecordId" | "baselinePublishedAt" | "summary"
  > = {
    status:
      baselineRecord.overallStatus !== currentArtifact.overallStatus ||
      baselineRecord.verificationMode !== currentArtifact.verificationMode ||
      baselineRecord.targetBaseUrl !== currentArtifact.targetBaseUrl ||
      baselineRecord.artifact.runtimeEnvironment !== currentArtifact.runtimeEnvironment ||
      hasNextActionsChanged(baselineRecord, currentArtifact) ||
      blockedAdded.length > 0 ||
      blockedCleared.length > 0 ||
      warningsAdded.length > 0 ||
      warningsCleared.length > 0 ||
      baselineRecord.blockedCount !== currentArtifact.blockedCount ||
      baselineRecord.warningCount !== currentArtifact.warningCount ||
      baselineRecord.readyCount !== currentArtifact.readyCount
        ? "changed"
        : "unchanged",
    countDeltas: {
      blocked: {
        baseline: baselineRecord.blockedCount,
        current: currentArtifact.blockedCount,
        delta: currentArtifact.blockedCount - baselineRecord.blockedCount,
      },
      warning: {
        baseline: baselineRecord.warningCount,
        current: currentArtifact.warningCount,
        delta: currentArtifact.warningCount - baselineRecord.warningCount,
      },
      ready: {
        baseline: baselineRecord.readyCount,
        current: currentArtifact.readyCount,
        delta: currentArtifact.readyCount - baselineRecord.readyCount,
      },
    },
    changedFields: {
      overallStatus: baselineRecord.overallStatus !== currentArtifact.overallStatus,
      verificationMode:
        baselineRecord.verificationMode !== currentArtifact.verificationMode,
      targetBaseUrl: baselineRecord.targetBaseUrl !== currentArtifact.targetBaseUrl,
      runtimeEnvironment:
        baselineRecord.artifact.runtimeEnvironment !== currentArtifact.runtimeEnvironment,
      nextActions: hasNextActionsChanged(baselineRecord, currentArtifact),
    },
    blockedItems: {
      added: blockedAdded,
      cleared: blockedCleared,
    },
    warningItems: {
      added: warningsAdded,
      cleared: warningsCleared,
    },
  };

  return {
    decisionPackageRecordId: baselineRecord.id,
    baselinePublishedAt: baselineRecord.publishedAt,
    ...deltaBase,
    summary: buildDecisionDeltaSummary(
      baselineRecord,
      currentArtifact,
      deltaBase,
    ),
  };
}
