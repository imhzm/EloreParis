export type OpsRole =
  | "manager"
  | "catalog_operator"
  | "fulfillment_operator"
  | "auditor";

export type OpsAccessMode =
  | "development_open"
  | "protected"
  | "setup_required";

export type OpsSessionSummary = {
  sessionId: string;
  userId: string;
  name: string;
  role: OpsRole;
  mode: OpsAccessMode;
  allowedPaths: string[];
};

export type OpsAuditAction =
  | "ops_login_success"
  | "ops_login_failure"
  | "ops_logout"
  | "ops_order_status_update";

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
  entityType: "ops_session" | "order";
  entityId: string;
  summary: string;
  metadata: Record<string, OpsAuditMetadataValue>;
};
