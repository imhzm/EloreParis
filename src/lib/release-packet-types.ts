import type { ContentGovernanceSummary } from "@/lib/content-governance";
import type {
  ReleaseDecisionRecord,
  ReleasePackageArtifact,
  ReleasePackageComparison,
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import type { ReleaseReadinessStatus } from "@/lib/release-readiness-types";

export type ReleasePacketDecisionReviewStatus =
  | "unpublished"
  | "missing"
  | "stale_package"
  | "stale_packet"
  | "expired_review"
  | "current";

export type ReleasePacketDecisionReview = {
  evaluatedAt: string;
  status: ReleasePacketDecisionReviewStatus;
  summary: string;
  details: string[];
  latestDecisionId: string | null;
  reviewExpiresAt: string | null;
};

export type ReleasePacketDecisionDeltaStatus =
  | "unpublished"
  | "missing"
  | "package_missing"
  | "unchanged"
  | "changed";

export type ReleasePacketDecisionCountDelta = {
  baseline: number;
  current: number;
  delta: number;
};

export type ReleasePacketDecisionDelta = {
  status: ReleasePacketDecisionDeltaStatus;
  decisionPackageRecordId: string | null;
  baselinePublishedAt: string | null;
  countDeltas: {
    blocked: ReleasePacketDecisionCountDelta;
    warning: ReleasePacketDecisionCountDelta;
    ready: ReleasePacketDecisionCountDelta;
  } | null;
  changedFields: {
    overallStatus: boolean;
    verificationMode: boolean;
    targetBaseUrl: boolean;
    runtimeEnvironment: boolean;
    nextActions: boolean;
  } | null;
  blockedItems: {
    added: string[];
    cleared: string[];
  } | null;
  warningItems: {
    added: string[];
    cleared: string[];
  } | null;
  summary: string[];
};

export type ReleasePacketArtifact = {
  generatedAt: string;
  reviewToken: string;
  reviewWindowMinutes: number;
  reviewExpiresAt: string;
  overallStatus: ReleaseReadinessStatus;
  verificationMode: ReleasePackageArtifact["verificationMode"];
  targetBaseUrl: string;
  runtimeEnvironment: string;
  canonicalUrl: string;
  executiveSummary: string[];
  blockerHighlights: string[];
  nextActions: string[];
  currentArtifact: ReleasePackageArtifact;
  latestPublishedRecord: ReleasePackageRecord | null;
  latestDecision: ReleaseDecisionRecord | null;
  latestDecisionReview: ReleasePacketDecisionReview;
  latestDecisionDelta: ReleasePacketDecisionDelta;
  comparison: ReleasePackageComparison;
  contentGovernance: ContentGovernanceSummary;
};
