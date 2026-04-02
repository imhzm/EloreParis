import "server-only";

import {
  buildCurrentReleasePackageArtifact,
  getLatestReleasePackageRecord,
} from "@/lib/release-package-history";
import type {
  ReleasePackageArtifact,
  ReleasePackageComparison,
  ReleasePackageRecord,
} from "@/lib/release-package-types";

function getItemIds(items: ReleasePackageArtifact["blockedItems"]) {
  return new Set(items.map((item) => item.id));
}

function getAddedItems(
  publishedItems: ReleasePackageArtifact["blockedItems"],
  currentItems: ReleasePackageArtifact["blockedItems"],
) {
  const publishedIds = getItemIds(publishedItems);

  return currentItems
    .map((item) => item.id)
    .filter((itemId) => !publishedIds.has(itemId));
}

function getClearedItems(
  publishedItems: ReleasePackageArtifact["blockedItems"],
  currentItems: ReleasePackageArtifact["blockedItems"],
) {
  const currentIds = getItemIds(currentItems);

  return publishedItems
    .map((item) => item.id)
    .filter((itemId) => !currentIds.has(itemId));
}

function hasNextActionsChanged(
  publishedRecord: ReleasePackageRecord | null,
  currentArtifact: ReleasePackageArtifact,
) {
  if (!publishedRecord) {
    return false;
  }

  const publishedActions = publishedRecord.artifact.nextActions;
  const currentActions = currentArtifact.nextActions;

  if (publishedActions.length !== currentActions.length) {
    return true;
  }

  return publishedActions.some((action, index) => action !== currentActions[index]);
}

function buildComparisonSummary(
  latestPublishedRecord: ReleasePackageRecord | null,
  currentArtifact: ReleasePackageArtifact,
  comparison: Omit<
    ReleasePackageComparison,
    "comparedAt" | "latestPublishedRecord" | "currentArtifact" | "summary"
  >,
) {
  if (!latestPublishedRecord) {
    return [
      "No published release package exists in the protected runtime yet.",
      "Publish the current runtime package before treating drift as reviewable history.",
    ];
  }

  if (comparison.status === "unchanged") {
    return [
      `Current runtime package still matches the latest published record ${latestPublishedRecord.id}.`,
      `Verification mode remains ${currentArtifact.verificationMode} against ${currentArtifact.targetBaseUrl}.`,
    ];
  }

  const summary: string[] = [];

  if (comparison.changedFields.overallStatus) {
    summary.push(
      `Overall status changed from ${latestPublishedRecord.overallStatus} to ${currentArtifact.overallStatus}.`,
    );
  }

  if (comparison.changedFields.verificationMode) {
    summary.push(
      `Verification mode changed from ${latestPublishedRecord.verificationMode} to ${currentArtifact.verificationMode}.`,
    );
  }

  if (comparison.changedFields.targetBaseUrl) {
    summary.push(
      `Target base URL changed from ${latestPublishedRecord.targetBaseUrl} to ${currentArtifact.targetBaseUrl}.`,
    );
  }

  if (comparison.blockedItems.added.length) {
    summary.push(`Blocked items added: ${comparison.blockedItems.added.join(", ")}.`);
  }

  if (comparison.blockedItems.cleared.length) {
    summary.push(`Blocked items cleared: ${comparison.blockedItems.cleared.join(", ")}.`);
  }

  if (comparison.warningItems.added.length) {
    summary.push(`Warning items added: ${comparison.warningItems.added.join(", ")}.`);
  }

  if (comparison.warningItems.cleared.length) {
    summary.push(`Warning items cleared: ${comparison.warningItems.cleared.join(", ")}.`);
  }

  if (!summary.length) {
    summary.push(
      "The current runtime package differs from the latest publication in counts or next actions only.",
    );
  }

  return summary;
}

export function buildReleasePackageComparison(): ReleasePackageComparison {
  const latestPublishedRecord = getLatestReleasePackageRecord();
  const currentArtifact = buildCurrentReleasePackageArtifact();

  if (!latestPublishedRecord) {
    return {
      comparedAt: new Date().toISOString(),
      status: "unpublished",
      latestPublishedRecord: null,
      currentArtifact,
      countDeltas: {
        blocked: {
          published: 0,
          current: currentArtifact.blockedCount,
          delta: currentArtifact.blockedCount,
        },
        warning: {
          published: 0,
          current: currentArtifact.warningCount,
          delta: currentArtifact.warningCount,
        },
        ready: {
          published: 0,
          current: currentArtifact.readyCount,
          delta: currentArtifact.readyCount,
        },
      },
      changedFields: {
        overallStatus: false,
        verificationMode: false,
        targetBaseUrl: false,
        runtimeEnvironment: false,
        nextActions: false,
      },
      blockedItems: {
        added: currentArtifact.blockedItems.map((item) => item.id),
        cleared: [],
      },
      warningItems: {
        added: currentArtifact.warningItems.map((item) => item.id),
        cleared: [],
      },
      summary: [
        "No published release package exists in the protected runtime yet.",
        "Publish the current runtime package before treating drift as reviewable history.",
      ],
    };
  }

  const publishedArtifact = latestPublishedRecord.artifact;
  const blockedAdded = getAddedItems(
    publishedArtifact.blockedItems,
    currentArtifact.blockedItems,
  );
  const blockedCleared = getClearedItems(
    publishedArtifact.blockedItems,
    currentArtifact.blockedItems,
  );
  const warningsAdded = getAddedItems(
    publishedArtifact.warningItems,
    currentArtifact.warningItems,
  );
  const warningsCleared = getClearedItems(
    publishedArtifact.warningItems,
    currentArtifact.warningItems,
  );

  const changedFields = {
    overallStatus: latestPublishedRecord.overallStatus !== currentArtifact.overallStatus,
    verificationMode:
      latestPublishedRecord.verificationMode !== currentArtifact.verificationMode,
    targetBaseUrl: latestPublishedRecord.targetBaseUrl !== currentArtifact.targetBaseUrl,
    runtimeEnvironment:
      latestPublishedRecord.artifact.runtimeEnvironment !== currentArtifact.runtimeEnvironment,
    nextActions: hasNextActionsChanged(latestPublishedRecord, currentArtifact),
  };

  const comparisonBase: Omit<
    ReleasePackageComparison,
    "comparedAt" | "latestPublishedRecord" | "currentArtifact" | "summary"
  > = {
    status:
      changedFields.overallStatus ||
      changedFields.verificationMode ||
      changedFields.targetBaseUrl ||
      changedFields.runtimeEnvironment ||
      changedFields.nextActions ||
      blockedAdded.length > 0 ||
      blockedCleared.length > 0 ||
      warningsAdded.length > 0 ||
      warningsCleared.length > 0 ||
      latestPublishedRecord.blockedCount !== currentArtifact.blockedCount ||
      latestPublishedRecord.warningCount !== currentArtifact.warningCount ||
      latestPublishedRecord.readyCount !== currentArtifact.readyCount
        ? "changed"
        : "unchanged",
    countDeltas: {
      blocked: {
        published: latestPublishedRecord.blockedCount,
        current: currentArtifact.blockedCount,
        delta: currentArtifact.blockedCount - latestPublishedRecord.blockedCount,
      },
      warning: {
        published: latestPublishedRecord.warningCount,
        current: currentArtifact.warningCount,
        delta: currentArtifact.warningCount - latestPublishedRecord.warningCount,
      },
      ready: {
        published: latestPublishedRecord.readyCount,
        current: currentArtifact.readyCount,
        delta: currentArtifact.readyCount - latestPublishedRecord.readyCount,
      },
    },
    changedFields,
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
    comparedAt: new Date().toISOString(),
    latestPublishedRecord,
    currentArtifact,
    ...comparisonBase,
    summary: buildComparisonSummary(
      latestPublishedRecord,
      currentArtifact,
      comparisonBase,
    ),
  };
}
