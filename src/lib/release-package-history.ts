import "server-only";

import { randomUUID } from "node:crypto";
import { getAuthorityDatabase, runAuthorityTransaction } from "@/lib/authority-database";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  buildReleasePackageArtifact,
  normalizeReleasePackageRecord,
} from "@/lib/release-package";
import type {
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import { readReleaseEvidence } from "@/lib/release-evidence";
import { getReleaseReadinessSnapshot } from "@/lib/release-readiness";
import type { OpsSessionSummary } from "@/lib/ops-types";

const RELEASE_PACKAGE_RETENTION_LIMIT = 20;

function upsertReleasePackageRecord(record: ReleasePackageRecord) {
  getAuthorityDatabase()
    .prepare(`
      INSERT INTO authority_release_packages (
        id,
        published_at,
        overall_status,
        verification_mode,
        target_base_url,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        published_at = excluded.published_at,
        overall_status = excluded.overall_status,
        verification_mode = excluded.verification_mode,
        target_base_url = excluded.target_base_url,
        payload_json = excluded.payload_json
    `)
    .run(
      record.id,
      record.publishedAt,
      record.overallStatus,
      record.verificationMode,
      record.targetBaseUrl,
      JSON.stringify(record),
    );
}

function pruneReleasePackageHistory() {
  getAuthorityDatabase()
    .prepare(`
      DELETE FROM authority_release_packages
      WHERE id IN (
        SELECT id
        FROM authority_release_packages
        ORDER BY published_at DESC
        LIMIT -1 OFFSET ${RELEASE_PACKAGE_RETENTION_LIMIT}
      )
    `)
    .run();
}

function parseReleasePackageRecord(payloadJson: string) {
  try {
    return normalizeReleasePackageRecord(JSON.parse(payloadJson));
  } catch {
    return null;
  }
}

export function buildCurrentReleasePackageArtifact() {
  return buildReleasePackageArtifact(
    getReleaseReadinessSnapshot(),
    readReleaseEvidence(),
  );
}

export async function publishReleasePackageRecord(session: OpsSessionSummary) {
  const artifact = buildCurrentReleasePackageArtifact();
  const record: ReleasePackageRecord = {
    id: randomUUID(),
    publishedAt: new Date().toISOString(),
    actor: {
      userId: session.userId,
      name: session.name,
      role: session.role,
    },
    overallStatus: artifact.overallStatus,
    verificationMode: artifact.verificationMode,
    targetBaseUrl: artifact.targetBaseUrl,
    blockedCount: artifact.blockedCount,
    warningCount: artifact.warningCount,
    readyCount: artifact.readyCount,
    artifact,
  };

  runAuthorityTransaction(() => {
    upsertReleasePackageRecord(record);
    pruneReleasePackageHistory();
  });

  await logOpsAuditEvent({
    action: "ops_release_package_publish",
    actor: {
      userId: session.userId,
      name: session.name,
      role: session.role,
    },
    entityType: "release",
    entityId: record.id,
    summary: `${session.name} published a ${record.verificationMode} release package for ${record.targetBaseUrl}.`,
    metadata: {
      verification_mode: record.verificationMode,
      target_base_url: record.targetBaseUrl,
      overall_status: record.overallStatus,
      blocked_count: record.blockedCount,
      warning_count: record.warningCount,
    },
  });

  return record;
}

export function readReleasePackageHistory(limit = 6) {
  const safeLimit = Math.min(Math.max(limit, 1), RELEASE_PACKAGE_RETENTION_LIMIT);
  const rows = getAuthorityDatabase()
    .prepare(`
      SELECT payload_json
      FROM authority_release_packages
      ORDER BY published_at DESC
      LIMIT ?
    `)
    .all(safeLimit) as { payload_json: string }[];

  return rows
    .map((row) => parseReleasePackageRecord(row.payload_json))
    .filter((record): record is ReleasePackageRecord => record !== null)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function getLatestReleasePackageRecord() {
  const row = getAuthorityDatabase()
    .prepare(`
      SELECT payload_json
      FROM authority_release_packages
      ORDER BY published_at DESC
      LIMIT 1
    `)
    .get() as { payload_json: string } | undefined;

  if (!row) {
    return null;
  }

  return parseReleasePackageRecord(row.payload_json);
}

export function getReleasePackageRecordById(id: string) {
  const row = getAuthorityDatabase()
    .prepare(`
      SELECT payload_json
      FROM authority_release_packages
      WHERE id = ?
      LIMIT 1
    `)
    .get(id) as { payload_json: string } | undefined;

  if (!row) {
    return null;
  }

  return parseReleasePackageRecord(row.payload_json);
}
