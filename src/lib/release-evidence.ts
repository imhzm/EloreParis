import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";

export function getReleaseEvidencePath() {
  const configuredPath = process.env.RELEASE_EVIDENCE_PATH?.trim();
  const relativePath =
    configuredPath && configuredPath.length > 0
      ? configuredPath
      : ".artifacts/release-evidence.json";

  return path.resolve(/* turbopackIgnore: true */ process.cwd(), relativePath);
}

export function readReleaseEvidence(): ReleaseEvidenceReport | null {
  const evidencePath = getReleaseEvidencePath();

  if (!existsSync(evidencePath)) {
    return null;
  }

  try {
    return JSON.parse(
      readFileSync(evidencePath, "utf8"),
    ) as ReleaseEvidenceReport;
  } catch {
    return null;
  }
}
