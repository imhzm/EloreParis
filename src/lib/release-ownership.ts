import "server-only";

import type {
  ReleaseActionOwner,
  ReleaseOwnableItem,
  ReleaseReadinessOwnerSummary,
} from "@/lib/release-readiness-types";

const RELEASE_OWNERS = {
  delivery: {
    id: "release-delivery",
    label: "Release delivery",
    lane: "delivery",
    defaultPath: "/ops/release",
    summary:
      "Owns package publication, decision review, CI discipline, and the honest release claim path.",
  },
  platform: {
    id: "platform-runtime",
    label: "Platform runtime",
    lane: "platform",
    defaultPath: "/ops/release",
    summary:
      "Owns hosting, canonical domain, persistent runtime paths, and launch-environment wiring.",
  },
  security: {
    id: "security-access",
    label: "Security and access",
    lane: "security",
    defaultPath: "/ops/audit",
    summary:
      "Owns signing-secret quality, protected ops identities, and the path to provider-backed access control.",
  },
  commerce: {
    id: "commerce-backend",
    label: "Commerce backend",
    lane: "commerce",
    defaultPath: "/ops/orders",
    summary:
      "Owns transactional durability for orders, notifications, and downstream operational authority.",
  },
  content: {
    id: "content-governance",
    label: "Content governance",
    lane: "content",
    defaultPath: "/ops/content",
    summary:
      "Owns style samples, business/legal inputs, and trust-surface approval before public launch claims.",
  },
} as const satisfies Record<string, ReleaseActionOwner>;

const FALLBACK_OWNER: ReleaseActionOwner = {
  id: "release-unassigned",
  label: "Release review",
  lane: "delivery",
  defaultPath: "/ops/release",
  summary:
    "Legacy release history item without explicit ownership metadata. Re-evaluate from the current runtime packet.",
};

const ISSUE_OWNER_FALLBACKS: Record<string, ReleaseActionOwner> = {
  "ci-health": RELEASE_OWNERS.delivery,
  "hosting-direction": RELEASE_OWNERS.platform,
  "hosting-runtime": RELEASE_OWNERS.platform,
  "transactional-backend": RELEASE_OWNERS.commerce,
  "ops-auth": RELEASE_OWNERS.security,
  "content-approval": RELEASE_OWNERS.content,
  "public-site-url": RELEASE_OWNERS.platform,
  "persistent-runtime-paths": RELEASE_OWNERS.platform,
  "signing-secrets": RELEASE_OWNERS.security,
  "ops-bootstrap-identities": RELEASE_OWNERS.security,
};

export function getReleaseDeliveryOwner() {
  return RELEASE_OWNERS.delivery;
}

export function getReleasePlatformOwner() {
  return RELEASE_OWNERS.platform;
}

export function getReleaseSecurityOwner() {
  return RELEASE_OWNERS.security;
}

export function getReleaseCommerceOwner() {
  return RELEASE_OWNERS.commerce;
}

export function getReleaseContentOwner() {
  return RELEASE_OWNERS.content;
}

export function getReleaseFallbackOwner(issueId?: string) {
  if (issueId && ISSUE_OWNER_FALLBACKS[issueId]) {
    return ISSUE_OWNER_FALLBACKS[issueId];
  }

  return FALLBACK_OWNER;
}

export function normalizeReleaseActionOwner(
  value: unknown,
  issueId?: string,
): ReleaseActionOwner {
  if (
    value &&
    typeof value === "object" &&
    typeof (value as ReleaseActionOwner).id === "string" &&
    typeof (value as ReleaseActionOwner).label === "string" &&
    typeof (value as ReleaseActionOwner).lane === "string" &&
    typeof (value as ReleaseActionOwner).defaultPath === "string" &&
    typeof (value as ReleaseActionOwner).summary === "string"
  ) {
    return value as ReleaseActionOwner;
  }

  return getReleaseFallbackOwner(issueId);
}

export function buildReleaseOwnerSummaries(
  items: ReleaseOwnableItem[],
): ReleaseReadinessOwnerSummary[] {
  const ownerMap = new Map<string, ReleaseReadinessOwnerSummary>();
  const itemMap = new Map(items.map((item) => [item.id, item]));

  for (const item of items) {
    const existingSummary = ownerMap.get(item.owner.id);

    if (existingSummary) {
      if (item.status === "blocked") {
        existingSummary.blockedCount += 1;
      } else if (item.status === "warning") {
        existingSummary.warningCount += 1;
      } else {
        existingSummary.readyCount += 1;
      }

      existingSummary.itemIds.push(item.id);
      existingSummary.itemTitles.push(item.title);
      continue;
    }

    ownerMap.set(item.owner.id, {
      ownerId: item.owner.id,
      ownerLabel: item.owner.label,
      lane: item.owner.lane,
      defaultPath: item.owner.defaultPath,
      blockedCount: item.status === "blocked" ? 1 : 0,
      warningCount: item.status === "warning" ? 1 : 0,
      readyCount: item.status === "ready" ? 1 : 0,
      itemIds: [item.id],
      itemTitles: [item.title],
      nextStep: item.resolutionAction,
    });
  }

  return Array.from(ownerMap.values())
    .map((summary) => {
      const ownerItems = summary.itemIds
        .map((itemId) => itemMap.get(itemId))
        .filter((item): item is ReleaseOwnableItem => Boolean(item));
      const prioritizedItem =
        ownerItems.find((item) => item.status === "blocked") ??
        ownerItems.find((item) => item.status === "warning") ??
        ownerItems[0];

      return {
        ...summary,
        nextStep: prioritizedItem?.resolutionAction ?? summary.nextStep,
      };
    })
    .sort((left, right) => {
      if (right.blockedCount !== left.blockedCount) {
        return right.blockedCount - left.blockedCount;
      }

      if (right.warningCount !== left.warningCount) {
        return right.warningCount - left.warningCount;
      }

      return left.ownerLabel.localeCompare(right.ownerLabel);
    });
}
