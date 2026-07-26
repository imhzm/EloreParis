import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const testScripts = Object.keys(packageJson.scripts ?? {})
  .filter((scriptName) => scriptName.startsWith("test:") && scriptName !== "test:all")
  .sort((left, right) => left.localeCompare(right));

if (testScripts.length === 0) {
  console.error("No test:* scripts were found in package.json.");
  process.exit(1);
}

console.log(`Running ${testScripts.length} project checks in deterministic order.`);

const root = process.cwd();
const baseUrl = process.env.ELORE_TEST_BASE_URL?.trim() || "http://127.0.0.1:3056";
const serverFile = path.resolve(root, ".next/standalone/server.js");
const scratchDatabase = path.resolve(root, `.data/all-checks-${process.pid}.sqlite`);
const scratchOrders = path.resolve(root, `.data/all-checks-orders-${process.pid}.json`);
let managedServer = null;

async function serverIsReady() {
  try {
    const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(1_500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureBrowserRuntime() {
  if (await serverIsReady()) {
    console.log(`Reusing the existing browser-test runtime at ${baseUrl}.`);
    return;
  }
  if (!existsSync(serverFile)) {
    throw new Error("Standalone build is missing. Run `npm run build` before `npm run test:all`.");
  }

  const parsedUrl = new URL(baseUrl);
  if (!["127.0.0.1", "localhost"].includes(parsedUrl.hostname)) {
    throw new Error("The managed test runtime must use a loopback host.");
  }

  managedServer = spawn(process.execPath, [serverFile], {
    cwd: root,
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      PORT: parsedUrl.port || "3056",
      APP_ENV: "development",
      AUTHORITY_DB_PATH: scratchDatabase,
      ORDER_AUTHORITY_FILE: scratchOrders,
    },
    stdio: "inherit",
  });

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (managedServer.exitCode !== null) {
      throw new Error(`Browser-test runtime exited with code ${managedServer.exitCode}.`);
    }
    if (await serverIsReady()) {
      console.log(`Started the isolated browser-test runtime at ${baseUrl}.`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for the browser-test runtime at ${baseUrl}.`);
}

async function cleanupManagedRuntime() {
  if (managedServer && managedServer.exitCode === null) {
    managedServer.kill();
    await Promise.race([
      new Promise((resolve) => managedServer.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
    if (managedServer.exitCode === null) managedServer.kill("SIGKILL");
  }
  for (const base of [scratchDatabase, scratchOrders]) {
    for (const suffix of ["", "-shm", "-wal"]) rmSync(`${base}${suffix}`, { force: true });
  }
}

process.once("SIGINT", async () => {
  await cleanupManagedRuntime();
  process.exit(130);
});
process.once("SIGTERM", async () => {
  await cleanupManagedRuntime();
  process.exit(143);
});

try {
  await ensureBrowserRuntime();

  for (const scriptName of testScripts) {
    console.log(`\n> ${scriptName}`);
    const npmCli = process.env.npm_execpath?.trim();
    const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
    const commandArgs = npmCli
      ? [npmCli, "run", scriptName]
      : ["run", scriptName];
    const testEnvironment = { ...process.env };
    if (scriptName === "test:smoke") {
      // The smoke suite deliberately boots its own protected standalone server.
      // Keep it isolated from the shared browser runtime managed above.
      testEnvironment.TEST_PORT = String(31_000 + (process.pid % 1_000));
    }
    const result = spawnSync(
      command,
      commandArgs,
      { cwd: root, env: testEnvironment, stdio: "inherit" },
    );

    if (result.error) {
      throw new Error(`Unable to start ${scriptName}: ${result.error.message}`);
    }

    if (result.status !== 0) {
      throw new Error(`${scriptName} failed with exit code ${result.status ?? "unknown"}.`);
    }
  }

  console.log(`\nAll ${testScripts.length} project checks passed.`);
} finally {
  await cleanupManagedRuntime();
}
