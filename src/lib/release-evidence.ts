import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  ReleaseEvidenceCheck,
  ReleaseEvidenceReport,
  ReleaseEvidenceVerificationMode,
} from "@/lib/release-evidence-types";
import { resolveProjectPath } from "@/lib/runtime-paths";

export function getReleaseEvidencePath() {
  const configuredPath = process.env.RELEASE_EVIDENCE_PATH?.trim();
  const relativePath =
    configuredPath && configuredPath.length > 0
      ? configuredPath
      : ".artifacts/release-evidence.json";

  return resolveProjectPath(relativePath);
}

function isReleaseEvidenceVerificationMode(
  value: unknown,
): value is ReleaseEvidenceVerificationMode {
  return value === "local_smoke" || value === "live_postdeploy";
}

function normalizeReleaseEvidenceCheck(value: unknown): ReleaseEvidenceCheck | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const evidenceCheck = value as Record<string, unknown>;

  if (
    typeof evidenceCheck.id !== "string" ||
    typeof evidenceCheck.title !== "string" ||
    typeof evidenceCheck.count !== "number" ||
    !Number.isFinite(evidenceCheck.count)
  ) {
    return null;
  }

  return {
    id: evidenceCheck.id,
    title: evidenceCheck.title,
    count: evidenceCheck.count,
  };
}

export function normalizeReleaseEvidenceReport(
  value: unknown,
): ReleaseEvidenceReport | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const report = value as Record<string, unknown>;
  const authorityStorage =
    report.authorityStorage && typeof report.authorityStorage === "object"
      ? (report.authorityStorage as Record<string, unknown>)
      : null;
  const summary =
    report.summary && typeof report.summary === "object"
      ? (report.summary as Record<string, unknown>)
      : null;
  const checks = Array.isArray(report.checks)
    ? report.checks
        .map((check) => normalizeReleaseEvidenceCheck(check))
        .filter((check): check is ReleaseEvidenceCheck => check !== null)
    : null;
  const notes = Array.isArray(report.notes)
    ? report.notes.filter((note): note is string => typeof note === "string")
    : [];

  if (
    typeof report.generatedAt !== "string" ||
    typeof report.targetBaseUrl !== "string" ||
    typeof report.environment !== "string" ||
    (typeof report.commitReference !== "string" && report.commitReference !== null) ||
    !authorityStorage ||
    typeof authorityStorage.engine !== "string" ||
    typeof authorityStorage.durability !== "string" ||
    !summary ||
    typeof summary.publicRouteChecks !== "number" ||
    typeof summary.protectedRouteChecks !== "number" ||
    typeof summary.assetChecks !== "number" ||
    typeof summary.apiChecks !== "number" ||
    !checks
  ) {
    return null;
  }

  const verificationMode = isReleaseEvidenceVerificationMode(report.verificationMode)
    ? report.verificationMode
    : "local_smoke";

  return {
    generatedAt: report.generatedAt,
    verificationMode,
    targetBaseUrl: report.targetBaseUrl,
    environment: report.environment,
    commitReference: report.commitReference,
    authorityStorage: {
      engine: authorityStorage.engine,
      durability: authorityStorage.durability,
    },
    summary: {
      publicRouteChecks: summary.publicRouteChecks,
      protectedRouteChecks: summary.protectedRouteChecks,
      assetChecks: summary.assetChecks,
      apiChecks: summary.apiChecks,
    },
    checks,
    notes,
  };
}

export function isReleaseEvidenceReport(
  value: unknown,
): value is ReleaseEvidenceReport {
  return normalizeReleaseEvidenceReport(value) !== null;
}

export function readReleaseEvidence(): ReleaseEvidenceReport | null {
  const evidencePath = getReleaseEvidencePath();

  if (!existsSync(evidencePath)) {
    return null;
  }

  try {
    return normalizeReleaseEvidenceReport(JSON.parse(readFileSync(evidencePath, "utf8")));
  } catch {
    return null;
  }
}

export function writeReleaseEvidence(report: ReleaseEvidenceReport) {
  const evidencePath = getReleaseEvidencePath();

  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify(report, null, 2));
}
