import "server-only";

import path from "node:path";
import process from "node:process";

const standaloneSuffix = path.normalize(path.join(".next", "standalone"));

export function getProjectRootDirectory() {
  const configuredRoot = process.env.COZMATEKS_PROJECT_ROOT?.trim();

  if (configuredRoot) {
    return path.resolve(configuredRoot);
  }

  const currentWorkingDirectory = path.normalize(process.cwd());

  if (currentWorkingDirectory.endsWith(standaloneSuffix)) {
    return path.resolve(currentWorkingDirectory, "..", "..");
  }

  return currentWorkingDirectory;
}

export function resolveProjectPath(candidatePath: string) {
  return path.isAbsolute(candidatePath)
    ? candidatePath
    : path.resolve(getProjectRootDirectory(), candidatePath);
}
