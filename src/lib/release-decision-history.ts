import "server-only";

import { randomUUID } from "node:crypto";
import { getAuthorityDatabase, runAuthorityTransaction } from "@/lib/authority-database";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  normalizeReleaseDecisionRecord,
  type ReleaseDecisionDraft,
} from "@/lib/release-decision";
import { getContentGovernanceSummary } from "@/lib/content-governance";
import { buildReleasePackageComparison } from "@/lib/release-package-comparison";
import {
  buildReleasePacketReviewToken,
  getReleasePacketReviewWindowMinutes,
  isReleasePacketReviewFresh,
} from "@/lib/release-packet-review";
import type { ReleaseDecisionRecord } from "@/lib/release-package-types";
import type { OpsSessionSummary } from "@/lib/ops-types";

const RELEASE_DECISION_RETENTION_LIMIT = 20;

export class ReleaseDecisionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ReleaseDecisionError";
    this.statusCode = statusCode;
  }
}

function upsertReleaseDecisionRecord(record: ReleaseDecisionRecord) {
  getAuthorityDatabase()
    .prepare(`
      INSERT INTO authority_release_decisions (
        id,
        decided_at,
        verdict,
        release_package_record_id,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        decided_at = excluded.decided_at,
        verdict = excluded.verdict,
        release_package_record_id = excluded.release_package_record_id,
        payload_json = excluded.payload_json
    `)
    .run(
      record.id,
      record.decidedAt,
      record.verdict,
      record.releasePackageRecordId,
      JSON.stringify(record),
    );
}

function pruneReleaseDecisionHistory() {
  getAuthorityDatabase()
    .prepare(`
      DELETE FROM authority_release_decisions
      WHERE id IN (
        SELECT id
        FROM authority_release_decisions
        ORDER BY decided_at DESC
        LIMIT -1 OFFSET ${RELEASE_DECISION_RETENTION_LIMIT}
      )
    `)
    .run();
}

function parseReleaseDecisionRecord(payloadJson: string) {
  try {
    return normalizeReleaseDecisionRecord(JSON.parse(payloadJson));
  } catch {
    return null;
  }
}

export async function publishReleaseDecisionRecord(
  session: OpsSessionSummary,
  decision: ReleaseDecisionDraft,
) {
  const releaseComparison = buildReleasePackageComparison();
  const contentGovernance = getContentGovernanceSummary();
  const latestPublishedRecord = releaseComparison.latestPublishedRecord;
  const reviewToken = buildReleasePacketReviewToken(
    releaseComparison,
    contentGovernance,
  );
  const reviewWindowMinutes = getReleasePacketReviewWindowMinutes(
    releaseComparison.currentArtifact.verificationMode,
  );

  if (!latestPublishedRecord) {
    throw new ReleaseDecisionError(
      "A release package must be published before a release decision can be recorded.",
      409,
    );
  }

  if (decision.reviewToken !== reviewToken) {
    throw new ReleaseDecisionError(
      "The release decision must be based on the latest executive release packet.",
      409,
    );
  }

  if (
    !isReleasePacketReviewFresh(
      decision.releasePacketGeneratedAt,
      releaseComparison.currentArtifact.verificationMode,
    )
  ) {
    throw new ReleaseDecisionError(
      "The executive release packet is stale and must be refreshed before a release decision can be recorded.",
      409,
    );
  }

  if (
    decision.verdict === "approve" &&
    releaseComparison.currentArtifact.overallStatus === "blocked"
  ) {
    throw new ReleaseDecisionError(
      "A blocked runtime package cannot be approved.",
      409,
    );
  }

  if (decision.verdict === "approve" && releaseComparison.status !== "unchanged") {
    throw new ReleaseDecisionError(
      "The current runtime must match the latest published package before approval can be recorded.",
      409,
    );
  }

  if (
    decision.verdict === "approve" &&
    !releaseComparison.currentArtifact.releaseEvidence
  ) {
    throw new ReleaseDecisionError(
      "Release evidence must exist before an approval decision can be recorded.",
      409,
    );
  }

  const record: ReleaseDecisionRecord = {
    id: randomUUID(),
    decidedAt: new Date().toISOString(),
    actor: {
      userId: session.userId,
      name: session.name,
      role: session.role,
    },
    verdict: decision.verdict,
    rationale: decision.rationale,
    notes: decision.notes,
    releasePacketGeneratedAt: decision.releasePacketGeneratedAt,
    releasePacketReviewToken: decision.reviewToken,
    releasePacketReviewWindowMinutes: reviewWindowMinutes,
    releasePackageRecordId: latestPublishedRecord.id,
    releasePackagePublishedAt: latestPublishedRecord.publishedAt,
    verificationMode: releaseComparison.currentArtifact.verificationMode,
    targetBaseUrl: releaseComparison.currentArtifact.targetBaseUrl,
    overallStatus: releaseComparison.currentArtifact.overallStatus,
    compareStatus: releaseComparison.status,
    blockedCount: releaseComparison.currentArtifact.blockedCount,
    warningCount: releaseComparison.currentArtifact.warningCount,
    readyCount: releaseComparison.currentArtifact.readyCount,
  };

  runAuthorityTransaction(() => {
    upsertReleaseDecisionRecord(record);
    pruneReleaseDecisionHistory();
  });

  await logOpsAuditEvent({
    action: "ops_release_decision_publish",
    actor: {
      userId: session.userId,
      name: session.name,
      role: session.role,
    },
    entityType: "release",
    entityId: record.id,
    summary: `${session.name} recorded a ${record.verdict} release decision against package ${record.releasePackageRecordId}.`,
    metadata: {
      verdict: record.verdict,
      compare_status: record.compareStatus,
      release_package_record_id: record.releasePackageRecordId,
      release_packet_review_token: record.releasePacketReviewToken,
      release_packet_review_window_minutes: record.releasePacketReviewWindowMinutes,
      verification_mode: record.verificationMode,
      blocked_count: record.blockedCount,
      warning_count: record.warningCount,
      ready_count: record.readyCount,
    },
  });

  return record;
}

export function readReleaseDecisionHistory(limit = 6) {
  const safeLimit = Math.min(Math.max(limit, 1), RELEASE_DECISION_RETENTION_LIMIT);
  const rows = getAuthorityDatabase()
    .prepare(`
      SELECT payload_json
      FROM authority_release_decisions
      ORDER BY decided_at DESC
      LIMIT ?
    `)
    .all(safeLimit) as { payload_json: string }[];

  return rows
    .map((row) => parseReleaseDecisionRecord(row.payload_json))
    .filter((record): record is ReleaseDecisionRecord => record !== null)
    .sort((left, right) => right.decidedAt.localeCompare(left.decidedAt));
}
