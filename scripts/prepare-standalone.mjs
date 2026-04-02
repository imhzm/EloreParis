import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const buildDirectory = path.resolve(process.cwd(), ".next");
const standaloneDirectory = path.join(buildDirectory, "standalone");
const standaloneServerFile = path.join(standaloneDirectory, "server.js");
const publicDirectory = path.resolve(process.cwd(), "public");
const publicTargetDirectory = path.join(standaloneDirectory, "public");
const staticDirectory = path.join(buildDirectory, "static");
const staticTargetDirectory = path.join(
  standaloneDirectory,
  ".next",
  "static",
);

function resetDirectory(targetDirectory) {
  rmSync(targetDirectory, { force: true, recursive: true });
}

function copyDirectoryIfPresent(sourceDirectory, targetDirectory) {
  if (!existsSync(sourceDirectory)) {
    return;
  }

  resetDirectory(targetDirectory);
  mkdirSync(path.dirname(targetDirectory), { recursive: true });
  cpSync(sourceDirectory, targetDirectory, { recursive: true });
}

if (!existsSync(standaloneServerFile)) {
  throw new Error(
    "Next standalone server was not generated. Run `next build` with `output: \"standalone\"` first.",
  );
}

copyDirectoryIfPresent(publicDirectory, publicTargetDirectory);
copyDirectoryIfPresent(staticDirectory, staticTargetDirectory);

console.log("Prepared standalone runtime assets.");
