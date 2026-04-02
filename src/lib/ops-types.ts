export type OpsRole =
  | "manager"
  | "catalog_operator"
  | "fulfillment_operator"
  | "auditor";

export type OpsAccessMode =
  | "development_open"
  | "protected"
  | "setup_required";

export type OpsAuthMethod = "access_code" | "identity_password";

export type OpsSessionSummary = {
  sessionId: string;
  userId: string;
  name: string;
  role: OpsRole;
  mode: OpsAccessMode;
  authMethod: OpsAuthMethod;
  username: string | null;
  allowedPaths: string[];
};

export type OpsAuditAction =
  | "ops_login_success"
  | "ops_login_failure"
  | "ops_login_rate_limited"
  | "ops_logout"
  | "ops_order_status_update"
  | "ops_notification_status_update"
  | "ops_release_evidence_publish"
  | "ops_release_package_publish"
  | "ops_release_handoff_publish"
  | "ops_release_decision_publish";

export type OpsAuditActor = {
  userId: string;
  name: string;
  role: OpsRole | "system";
};

export type OpsAuditMetadataValue = string | number | boolean;

export type OpsAuditEntry = {
  id: string;
  createdAt: string;
  action: OpsAuditAction;
  actor: OpsAuditActor;
  entityType: "ops_session" | "order" | "notification" | "release";
  entityId: string;
  summary: string;
  metadata: Record<string, OpsAuditMetadataValue>;
};
