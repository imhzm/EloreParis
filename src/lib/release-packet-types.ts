import type { ContentGovernanceSummary } from "@/lib/content-governance";
import type {
  ReleaseDecisionRecord,
  ReleaseHandoffRecord,
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

export type ReleasePacketHandoffReviewStatus =
  | "not_required"
  | "missing"
  | "stale_packet"
  | "expired_review"
  | "partial"
  | "current";

export type ReleasePacketHandoffReview = {
  evaluatedAt: string;
  status: ReleasePacketHandoffReviewStatus;
  summary: string;
  details: string[];
  latestHandoffId: string | null;
  reviewExpiresAt: string | null;
  activeOwnerIds: string[];
  missingOwnerIds: string[];
  unexpectedOwnerIds: string[];
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
    runtimeSecretAlignment: boolean;
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

export type ReleaseProviderIntegrationLane = {
  id:
    | "ops_auth"
    | "customer_order_access"
    | "payment_routing"
    | "shipping_execution"
    | "notification_delivery";
  title: string;
  status: ReleaseReadinessStatus;
  ownerPath: string;
  currentMode: string;
  evidence: string;
  nextAction: string;
  missingBindings: string[];
};

export type ReleaseProviderIntegrationContract = {
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  summary: string;
  lanes: ReleaseProviderIntegrationLane[];
};

export type ReleaseRuntimeSecretBinding = {
  id:
    | "order_authority"
    | "ops_access_signing"
    | "auth_provider_callback"
    | "payment_provider_callback"
    | "shipping_provider_callback"
    | "notification_provider_callback";
  label: string;
  envVar: string;
  status: ReleaseReadinessStatus;
  currentMode: string;
  summary: string;
  nextAction: string;
  details: string[];
};

export type ReleaseRuntimeSecretAlignment = {
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  summary: string;
  bindings: ReleaseRuntimeSecretBinding[];
};

export type ReleaseRuntimeMonitoring = {
  status: ReleaseReadinessStatus;
  stage: "local" | "preview" | "production";
  searchIndexingEnabled: boolean;
  summary: string;
  details: string[];
};

export type ReleaseRollbackBaseline = {
  status: ReleaseReadinessStatus;
  summary: string;
  nextAction: string;
  packageRecordId: string | null;
  packagePublishedAt: string | null;
  verificationMode: ReleasePackageArtifact["verificationMode"] | null;
  targetBaseUrl: string | null;
  decisionId: string | null;
  decisionVerdict: ReleaseDecisionRecord["verdict"] | null;
  decidedAt: string | null;
  details: string[];
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
  latestHandoff: ReleaseHandoffRecord | null;
  latestHandoffReview: ReleasePacketHandoffReview;
  latestDecision: ReleaseDecisionRecord | null;
  latestDecisionReview: ReleasePacketDecisionReview;
  latestDecisionDelta: ReleasePacketDecisionDelta;
  comparison: ReleasePackageComparison;
  contentGovernance: ContentGovernanceSummary;
  runtimeSecretAlignment: ReleaseRuntimeSecretAlignment;
  integrationContract: ReleaseProviderIntegrationContract;
  runtimeMonitoring: ReleaseRuntimeMonitoring;
  rollbackBaseline: ReleaseRollbackBaseline;
};
