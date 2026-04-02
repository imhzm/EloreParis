import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import type {
  ReleaseReadinessSnapshot,
  ReleaseReadinessStatus,
} from "@/lib/release-readiness-types";
import type { OpsAuditActor } from "@/lib/ops-types";

export type ReleasePackageIssueSource = "gate" | "runtime_preflight";

export type ReleasePackageIssue = {
  id: string;
  title: string;
  status: ReleaseReadinessStatus;
  source: ReleasePackageIssueSource;
  summary: string;
  details: string[];
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
