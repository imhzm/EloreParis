import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

function normalizeCommitReference(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

export function getRuntimeDeploymentCommitReference() {
  const projectRoot = process.env.COZMATEKS_PROJECT_ROOT?.trim() || process.cwd();

  try {
    const fileReference = normalizeCommitReference(
      readFileSync(path.resolve(projectRoot, ".deployment-commit"), "utf8"),
    );
    if (fileReference) return fileReference;
  } catch {
    // Local and pre-release runtimes do not have immutable deployment metadata.
  }

  return normalizeCommitReference(process.env.DEPLOYMENT_COMMIT_SHA);
}
