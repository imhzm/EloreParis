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
  comparison: ReleasePackageComparison;
  contentGovernance: ContentGovernanceSummary;
};
