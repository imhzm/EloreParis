import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import type {
  ReleaseActionOwner,
  ReleaseReadinessOwnerSummary,
  ReleaseReadinessSnapshot,
  ReleaseReadinessStatus,
} from "@/lib/release-readiness-types";
import type { ReleaseRuntimeSecretAlignment } from "@/lib/release-packet-types";
import type { OpsAuditActor } from "@/lib/ops-types";

export type ReleasePackageIssueSource =
  | "gate"
  | "runtime_preflight"
  | "provider_contract"
  | "runtime_secret";

export type ReleasePackageIssue = {
  id: string;
  title: string;
  status: ReleaseReadinessStatus;
  source: ReleasePackageIssueSource;
  summary: string;
  details: string[];
  owner: ReleaseActionOwner;
  resolutionAction: string;
};

export type ReleasePackageArtifact = {
  generatedAt: string;
  verificationMode: ReleaseEvidenceReport["verificationMode"] | "runtime_snapshot";
  targetBaseUrl: string;
  runtimeEnvironment: string;
  canonicalUrl: string;
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  blockedItems: ReleasePackageIssue[];
  warningItems: ReleasePackageIssue[];
  nextActions: string[];
  releaseReadiness: ReleaseReadinessSnapshot;
  runtimeSecretAlignment: ReleaseRuntimeSecretAlignment;
  releaseEvidence: ReleaseEvidenceReport | null;
};

export type ReleasePackageRecord = {
  id: string;
  publishedAt: string;
  actor: OpsAuditActor;
  overallStatus: ReleaseReadinessStatus;
  verificationMode: ReleasePackageArtifact["verificationMode"];
  targetBaseUrl: string;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  artifact: ReleasePackageArtifact;
};

export type ReleasePackageComparisonStatus =
  | "unpublished"
  | "unchanged"
  | "changed";

export type ReleasePackageCountDelta = {
  published: number;
  current: number;
  delta: number;
};

export type ReleasePackageComparison = {
  comparedAt: string;
  status: ReleasePackageComparisonStatus;
  latestPublishedRecord: ReleasePackageRecord | null;
  currentArtifact: ReleasePackageArtifact;
  countDeltas: {
    blocked: ReleasePackageCountDelta;
    warning: ReleasePackageCountDelta;
    ready: ReleasePackageCountDelta;
  };
  changedFields: {
    overallStatus: boolean;
    verificationMode: boolean;
    targetBaseUrl: boolean;
    runtimeEnvironment: boolean;
    runtimeSecretAlignment: boolean;
    nextActions: boolean;
  };
  blockedItems: {
    added: string[];
    cleared: string[];
  };
  warningItems: {
    added: string[];
    cleared: string[];
  };
  summary: string[];
};

export type ReleaseDecisionVerdict = "hold" | "approve";

export type ReleaseHandoffRecord = {
  id: string;
  handedOffAt: string;
  actor: OpsAuditActor;
  rationale: string;
  notes: string[];
  handedOffOwnerIds: string[];
  ownerSummaries: ReleaseReadinessOwnerSummary[];
  releasePacketGeneratedAt: string;
  releasePacketReviewToken: string;
  releasePacketReviewWindowMinutes: number;
  verificationMode: ReleasePackageArtifact["verificationMode"];
  targetBaseUrl: string;
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
};

export type ReleaseDecisionRecord = {
  id: string;
  decidedAt: string;
  actor: OpsAuditActor;
  verdict: ReleaseDecisionVerdict;
  rationale: string;
  notes: string[];
  acknowledgedBlockedItemIds: string[];
  releasePacketGeneratedAt: string;
  releasePacketReviewToken: string;
  releasePacketReviewWindowMinutes: number;
  releasePackageRecordId: string;
  releasePackagePublishedAt: string;
  verificationMode: ReleasePackageArtifact["verificationMode"];
  targetBaseUrl: string;
  overallStatus: ReleaseReadinessStatus;
  compareStatus: ReleasePackageComparisonStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
};
