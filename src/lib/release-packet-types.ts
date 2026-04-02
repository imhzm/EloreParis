import type { ContentGovernanceSummary } from "@/lib/content-governance";
import type {
  ReleaseDecisionRecord,
  ReleasePackageArtifact,
  ReleasePackageComparison,
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import type { ReleaseReadinessStatus } from "@/lib/release-readiness-types";

export type ReleasePacketArtifact = {
  generatedAt: string;
  reviewToken: string;
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
  comparison: ReleasePackageComparison;
  contentGovernance: ContentGovernanceSummary;
};
