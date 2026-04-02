import "server-only";

import { randomUUID } from "node:crypto";
import { getAuthorityDatabase, runAuthorityTransaction } from "@/lib/authority-database";
import { getContentGovernanceSummary } from "@/lib/content-governance";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  normalizeReleaseHandoffRecord,
  type ReleaseHandoffDraft,
} from "@/lib/release-handoff";
import { buildReleasePackageComparison } from "@/lib/release-package-comparison";
import {
  buildReleasePacketReviewToken,
  getReleasePacketReviewWindowMinutes,
  isReleasePacketReviewFresh,
} from "@/lib/release-packet-review";
import type { ReleaseHandoffRecord } from "@/lib/release-package-types";
import type { OpsSessionSummary } from "@/lib/ops-types";

const RELEASE_HANDOFF_RETENTION_LIMIT = 20;

export class ReleaseHandoffError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ReleaseHandoffError";
    this.statusCode = statusCode;
  }
}

function upsertReleaseHandoffRecord(record: ReleaseHandoffRecord) {
  getAuthorityDatabase()
    .prepare(`
      INSERT INTO authority_release_handoffs (
        id,
        handed_off_at,
        payload_json
      )
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        handed_off_at = excluded.handed_off_at,
        payload_json = excluded.payload_json
    `)
    .run(record.id, record.handedOffAt, JSON.stringify(record));
}

function pruneReleaseHandoffHistory() {
  getAuthorityDatabase()
    .prepare(`
      DELETE FROM authority_release_handoffs
      WHERE id IN (
        SELECT id
        FROM authority_release_handoffs
        ORDER BY handed_off_at DESC
        LIMIT -1 OFFSET ${RELEASE_HANDOFF_RETENTION_LIMIT}
      )
    `)
    .run();
}

function parseReleaseHandoffRecord(payloadJson: string) {
  try {
    return normalizeReleaseHandoffRecord(JSON.parse(payloadJson));
  } catch {
    return null;
  }
}

export async function publishReleaseHandoffRecord(
  session: OpsSessionSummary,
  handoff: ReleaseHandoffDraft,
) {
  const releaseComparison = buildReleasePackageComparison();
  const contentGovernance = getContentGovernanceSummary();
  const reviewToken = buildReleasePacketReviewToken(
    releaseComparison,
    contentGovernance,
  );
  const reviewWindowMinutes = getReleasePacketReviewWindowMinutes(
    releaseComparison.currentArtifact.verificationMode,
  );
  const activeOwnerSummaries =
    releaseComparison.currentArtifact.releaseReadiness.ownerSummaries.filter(
      (summary) => summary.blockedCount > 0 || summary.warningCount > 0,
    );
  const activeOwnerIds = activeOwnerSummaries.map((summary) => summary.ownerId);
  const missingOwnerIds = activeOwnerIds.filter(
    (ownerId) => !handoff.handedOffOwnerIds.includes(ownerId),
  );
  const unexpectedOwnerIds = handoff.handedOffOwnerIds.filter(
    (ownerId) => !activeOwnerIds.includes(ownerId),
  );

  if (!activeOwnerIds.length) {
    throw new ReleaseHandoffError(
      "The current executive packet does not expose active owner lanes that require handoff.",
      409,
    );
  }

  if (handoff.reviewToken !== reviewToken) {
    throw new ReleaseHandoffError(
      "The blocker handoff must be based on the latest executive release packet.",
      409,
    );
  }

  if (
    !isReleasePacketReviewFresh(
      handoff.releasePacketGeneratedAt,
      releaseComparison.currentArtifact.verificationMode,
    )
  ) {
    throw new ReleaseHandoffError(
      "The executive release packet is stale and must be refreshed before a blocker handoff can be recorded.",
      409,
    );
  }

  if (missingOwnerIds.length > 0) {
    throw new ReleaseHandoffError(
      "The blocker handoff must cover every active owner lane in the current executive packet.",
      409,
    );
  }

  if (unexpectedOwnerIds.length > 0) {
    throw new ReleaseHandoffError(
      "The blocker handoff references owner lanes that are not part of the current executive packet.",
      409,
    );
  }

  const ownerSummaries = activeOwnerSummaries.filter((summary) =>
    handoff.handedOffOwnerIds.includes(summary.ownerId),
  );
  const record: ReleaseHandoffRecord = {
    id: randomUUID(),
    handedOffAt: new Date().toISOString(),
    actor: {
      userId: session.userId,
      name: session.name,
      role: session.role,
    },
    rationale: handoff.rationale,
    notes: handoff.notes,
    handedOffOwnerIds: handoff.handedOffOwnerIds,
    ownerSummaries,
    releasePacketGeneratedAt: handoff.releasePacketGeneratedAt,
    releasePacketReviewToken: handoff.reviewToken,
    releasePacketReviewWindowMinutes: reviewWindowMinutes,
    verificationMode: releaseComparison.currentArtifact.verificationMode,
    targetBaseUrl: releaseComparison.currentArtifact.targetBaseUrl,
    overallStatus: releaseComparison.currentArtifact.overallStatus,
    blockedCount: releaseComparison.currentArtifact.blockedCount,
    warningCount: releaseComparison.currentArtifact.warningCount,
    readyCount: releaseComparison.currentArtifact.readyCount,
  };

  runAuthorityTransaction(() => {
    upsertReleaseHandoffRecord(record);
    pruneReleaseHandoffHistory();
  });

  await logOpsAuditEvent({
    action: "ops_release_handoff_publish",
    actor: {
      userId: session.userId,
      name: session.name,
      role: session.role,
    },
    entityType: "release",
    entityId: record.id,
    summary: `${session.name} handed off ${record.handedOffOwnerIds.length} release owner lanes from the current executive packet.`,
    metadata: {
      review_token: record.releasePacketReviewToken,
      verification_mode: record.verificationMode,
      target_base_url: record.targetBaseUrl,
      overall_status: record.overallStatus,
      blocked_count: record.blockedCount,
      warning_count: record.warningCount,
      ready_count: record.readyCount,
      handed_off_owner_ids: record.handedOffOwnerIds.join(","),
      handed_off_owner_count: record.handedOffOwnerIds.length,
    },
  });

  return record;
}

export function readReleaseHandoffHistory(limit = 6) {
  const safeLimit = Math.min(Math.max(limit, 1), RELEASE_HANDOFF_RETENTION_LIMIT);
  const rows = getAuthorityDatabase()
    .prepare(`
      SELECT payload_json
      FROM authority_release_handoffs
      ORDER BY handed_off_at DESC
      LIMIT ?
    `)
    .all(safeLimit) as { payload_json: string }[];

  return rows
    .map((row) => parseReleaseHandoffRecord(row.payload_json))
    .filter((record): record is ReleaseHandoffRecord => record !== null)
    .sort((left, right) => right.handedOffAt.localeCompare(left.handedOffAt));
}

export function getLatestReleaseHandoffRecord() {
  const row = getAuthorityDatabase()
    .prepare(`
      SELECT payload_json
      FROM authority_release_handoffs
      ORDER BY handed_off_at DESC
      LIMIT 1
    `)
    .get() as { payload_json: string } | undefined;

  if (!row) {
    return null;
  }

  return parseReleaseHandoffRecord(row.payload_json);
}
