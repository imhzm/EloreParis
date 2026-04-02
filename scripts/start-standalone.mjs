import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const standaloneServerFile = path.resolve(
  process.cwd(),
  ".next/standalone/server.js",
);

if (!existsSync(standaloneServerFile)) {
  throw new Error(
    "Standalone server is missing. Run `npm run build` before `npm run start`.",
  );
}

const childProcess = spawn(process.execPath, [standaloneServerFile], {
  env: {
    ...process.env,
    COZMATEKS_PROJECT_ROOT: process.cwd(),
    HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0",
    PORT: process.env.PORT ?? "3056",
  },
  stdio: "inherit",
});

function stopChildProcess(signal) {
  if (childProcess.exitCode !== null || childProcess.killed) {
    return;
  }

  childProcess.kill(signal);
}

process.on("SIGINT", () => {
  stopChildProcess("SIGINT");
});

process.on("SIGTERM", () => {
  stopChildProcess("SIGTERM");
});

process.on("exit", () => {
  stopChildProcess("SIGTERM");
});

childProcess.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

childProcess.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
