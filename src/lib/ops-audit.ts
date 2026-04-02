import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { OpsAuditAction, OpsAuditActor, OpsAuditEntry } from "@/lib/ops-types";

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

async function writeAuditEntries(entries: OpsAuditEntry[]) {
  const filePath = getOpsAuditFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(entries, null, 2), "utf8");
}

export async function readOpsAuditEntries() {
  const filePath = getOpsAuditFilePath();

  try {
    const rawValue = await readFile(filePath, "utf8");
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [] as OpsAuditEntry[];
    }

    return parsedValue
      .map((entry) => normalizeAuditEntry(entry))
      .filter((entry): entry is OpsAuditEntry => entry !== null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [] as OpsAuditEntry[];
    }

    throw error;
  }
}

export async function logOpsAuditEvent({
  action,
  actor,
  entityType,
  entityId,
  summary,
  metadata = {},
}: LogOpsAuditEventInput) {
  const entries = await readOpsAuditEntries();
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

  await writeAuditEntries([nextEntry, ...entries].slice(0, 200));
  return nextEntry;
}
