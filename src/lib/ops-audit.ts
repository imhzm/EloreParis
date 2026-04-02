import "server-only";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getAuthorityDatabase,
  getAuthorityMetaValue,
  getAuthorityTableCount,
  runAuthorityTransaction,
  setAuthorityMetaValue,
} from "@/lib/authority-database";
import type { OpsAuditAction, OpsAuditActor, OpsAuditEntry } from "@/lib/ops-types";

const OPS_AUDIT_LEGACY_IMPORT_META_KEY = "legacy_ops_audit_import_v2";
const OPS_AUDIT_RETENTION_LIMIT = 200;
let opsAuditReadyPromise: Promise<void> | null = null;

type LogOpsAuditEventInput = {
  action: OpsAuditAction;
  actor: OpsAuditActor;
  entityType: OpsAuditEntry["entityType"];
  entityId: string;
  summary: string;
  metadata?: OpsAuditEntry["metadata"];
};

function getOpsAuditFilePath() {
  const configuredPath = process.env.OPS_AUDIT_FILE?.trim();
  const relativePath =
    configuredPath && configuredPath.length > 0
      ? configuredPath
      : ".data/ops-audit.json";

  return path.resolve(/* turbopackIgnore: true */ process.cwd(), relativePath);
}

function isAuditActor(value: unknown): value is OpsAuditActor {
  if (!value || typeof value !== "object") {
    return false;
  }

  const actor = value as Record<string, unknown>;

  return (
    typeof actor.userId === "string" &&
    typeof actor.name === "string" &&
    typeof actor.role === "string"
  );
}

function normalizeAuditEntry(value: unknown): OpsAuditEntry | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("id" in value) ||
    !("createdAt" in value) ||
    !("action" in value) ||
    !("actor" in value) ||
    !("entityType" in value) ||
    !("entityId" in value) ||
    !("summary" in value) ||
    !("metadata" in value)
  ) {
    return null;
  }

  const auditRecord = value;

  if (
    typeof auditRecord.id !== "string" ||
    typeof auditRecord.createdAt !== "string" ||
    typeof auditRecord.action !== "string" ||
    !isAuditActor(auditRecord.actor) ||
    (auditRecord.entityType !== "ops_session" &&
      auditRecord.entityType !== "order" &&
      auditRecord.entityType !== "notification") ||
    typeof auditRecord.entityId !== "string" ||
    typeof auditRecord.summary !== "string" ||
    !auditRecord.metadata ||
    typeof auditRecord.metadata !== "object" ||
    Array.isArray(auditRecord.metadata)
  ) {
    return null;
  }

  return {
    id: auditRecord.id,
    createdAt: auditRecord.createdAt,
    action: auditRecord.action as OpsAuditAction,
    actor: auditRecord.actor,
    entityType: auditRecord.entityType,
    entityId: auditRecord.entityId,
    summary: auditRecord.summary,
    metadata: auditRecord.metadata as OpsAuditEntry["metadata"],
  };
}

function parseAuditPayload(payloadJson: string) {
  return normalizeAuditEntry(JSON.parse(payloadJson));
}

function upsertAuditEntry(entry: OpsAuditEntry) {
  getAuthorityDatabase()
    .prepare(`
      INSERT INTO authority_ops_audit (
        id,
        created_at,
        action,
        entity_type,
        entity_id,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        created_at = excluded.created_at,
        action = excluded.action,
        entity_type = excluded.entity_type,
        entity_id = excluded.entity_id,
        payload_json = excluded.payload_json
    `)
    .run(
      entry.id,
      entry.createdAt,
      entry.action,
      entry.entityType,
      entry.entityId,
      JSON.stringify(entry),
    );
}

function pruneAuditEntries() {
  getAuthorityDatabase().prepare(`
    DELETE FROM authority_ops_audit
    WHERE id IN (
      SELECT id
      FROM authority_ops_audit
      ORDER BY created_at DESC
      LIMIT -1 OFFSET ${OPS_AUDIT_RETENTION_LIMIT}
    )
  `).run();
}

async function importLegacyAuditIfNeeded() {
  if (getAuthorityMetaValue(OPS_AUDIT_LEGACY_IMPORT_META_KEY) === "1") {
    return;
  }

  if (getAuthorityTableCount("audit") > 0) {
    setAuthorityMetaValue(OPS_AUDIT_LEGACY_IMPORT_META_KEY, "1");
    return;
  }

  try {
    const rawValue = await readFile(getOpsAuditFilePath(), "utf8");
    const parsedValue = JSON.parse(rawValue) as unknown;
    const entries = Array.isArray(parsedValue)
      ? parsedValue
          .map((entry) => normalizeAuditEntry(entry))
          .filter((entry): entry is OpsAuditEntry => entry !== null)
      : [];

    if (entries.length > 0) {
      runAuthorityTransaction(() => {
        for (const entry of entries) {
          upsertAuditEntry(entry);
        }

        pruneAuditEntries();
      });
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      setAuthorityMetaValue(OPS_AUDIT_LEGACY_IMPORT_META_KEY, "1");
      return;
    }

    throw error;
  }

  setAuthorityMetaValue(OPS_AUDIT_LEGACY_IMPORT_META_KEY, "1");
}

async function ensureOpsAuditReady() {
  if (!opsAuditReadyPromise) {
    opsAuditReadyPromise = importLegacyAuditIfNeeded();
  }

  await opsAuditReadyPromise;
}

export async function readOpsAuditEntries() {
  await ensureOpsAuditReady();
  const rows = getAuthorityDatabase()
    .prepare(`
      SELECT payload_json
      FROM authority_ops_audit
      ORDER BY created_at DESC
      LIMIT ?
    `)
    .all(OPS_AUDIT_RETENTION_LIMIT) as { payload_json: string }[];

  return rows
    .map((row) => parseAuditPayload(row.payload_json))
    .filter((entry): entry is OpsAuditEntry => entry !== null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function logOpsAuditEvent({
  action,
  actor,
  entityType,
  entityId,
  summary,
  metadata = {},
}: LogOpsAuditEventInput) {
  await ensureOpsAuditReady();
  const nextEntry: OpsAuditEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    action,
    actor,
    entityType,
    entityId,
    summary,
    metadata,
  };

  runAuthorityTransaction(() => {
    upsertAuditEntry(nextEntry);
    pruneAuditEntries();
  });

  return nextEntry;
}
