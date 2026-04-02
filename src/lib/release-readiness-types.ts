export type ReleaseReadinessStatus = "ready" | "warning" | "blocked";

export type ReleaseOwnerLane =
  | "delivery"
  | "platform"
  | "security"
  | "commerce"
  | "content";

export type ReleaseActionOwner = {
  id: string;
  label: string;
  lane: ReleaseOwnerLane;
  defaultPath: string;
  summary: string;
};

export type ReleaseOwnableItem = {
  id: string;
  title: string;
  status: ReleaseReadinessStatus;
  owner: ReleaseActionOwner;
  resolutionAction: string;
};

export type ReleaseReadinessGate = {
  id: string;
  title: string;
  status: ReleaseReadinessStatus;
  summary: string;
  details: string[];
  owner: ReleaseActionOwner;
  resolutionAction: string;
};

export type ReleaseRuntimePreflightCheck = {
  id: string;
  title: string;
  status: ReleaseReadinessStatus;
  summary: string;
  details: string[];
  owner: ReleaseActionOwner;
  resolutionAction: string;
};

export type ReleaseReadinessOwnerSummary = {
  ownerId: string;
  ownerLabel: string;
  lane: ReleaseOwnerLane;
  defaultPath: string;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  itemIds: string[];
  itemTitles: string[];
  nextStep: string;
};

export type ReleaseRuntimePreflightSnapshot = {
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  checks: ReleaseRuntimePreflightCheck[];
};

export type ReleaseReadinessSnapshot = {
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  runtimeEnvironment: string;
  canonicalUrl: string;
  gates: ReleaseReadinessGate[];
  runtimePreflight: ReleaseRuntimePreflightSnapshot;
  ownerSummaries: ReleaseReadinessOwnerSummary[];
  nextActions: string[];
};
