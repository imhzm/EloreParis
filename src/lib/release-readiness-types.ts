export type ReleaseReadinessStatus = "ready" | "warning" | "blocked";

export type ReleaseReadinessGate = {
  id: string;
  title: string;
  status: ReleaseReadinessStatus;
  summary: string;
  details: string[];
};

export type ReleaseReadinessSnapshot = {
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  runtimeEnvironment: string;
  canonicalUrl: string;
  gates: ReleaseReadinessGate[];
  nextActions: string[];
};
