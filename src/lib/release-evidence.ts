import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import { normalizeReleaseEvidenceReport as normalizeReleaseEvidenceReportPolicy } from "@/lib/release-evidence-policy";
import { resolveProjectPath } from "@/lib/runtime-paths";

export { validateReleaseEvidenceForApproval } from "@/lib/release-evidence-policy";

export function getReleaseEvidencePath() {
  const configuredPath = process.env.RELEASE_EVIDENCE_PATH?.trim();
  const relativePath =
    configuredPath && configuredPath.length > 0
      ? configuredPath
      : ".artifacts/release-evidence.json";

  return resolveProjectPath(relativePath);
}

export function normalizeReleaseEvidenceReport(
  value: unknown,
): ReleaseEvidenceReport | null {
  return normalizeReleaseEvidenceReportPolicy(value);
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
