import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const workerFile = path.join(root, "scripts", "run-outbox-worker.mjs");
const serverFile = path.join(root, ".next", "standalone", "server.js");
const workerSecret = "outbox-worker-security-secret-at-least-32-bytes";

if (!existsSync(serverFile)) {
  throw new Error("Standalone build is missing. Run `npm run build` first.");
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk.toString();
  return body;
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

function runWorker({ targetUrl, probe = false }) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [workerFile, ...(probe ? ["--probe"] : [])],
      {
        cwd: root,
        env: {
          ...process.env,
          OUTBOX_WORKER_SECRET: workerSecret,
          OUTBOX_WORKER_URL: targetUrl,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

let mockPayload = null;
const workerRequests = [];
const mockServer = createServer(async (request, response) => {
  const rawBody = await readBody(request);
  workerRequests.push({
    authorization: request.headers.authorization ?? "",
    body: JSON.parse(rawBody),
  });
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(mockPayload));
});

await listen(mockServer);
const mockAddress = mockServer.address();
assert.ok(mockAddress && typeof mockAddress === "object");
const mockUrl = `http://127.0.0.1:${mockAddress.port}/api/internal/outbox-drain`;

try {
  mockPayload = {
    mode: "probe",
    probe: true,
    outbox: { pending: 1, processing: 0, succeeded: 0, failed: 0 },
  };
  const probeRun = await runWorker({ targetUrl: mockUrl, probe: true });
  assert.equal(probeRun.code, 0, probeRun.stderr);
  assert.deepEqual(workerRequests.at(-1)?.body, { mode: "probe" });
  assert.equal(workerRequests.at(-1)?.authorization, `Bearer ${workerSecret}`);
  assert.match(probeRun.stdout, /"status":"probe-passed"/);

  mockPayload = {
    mode: "drain",
    result: { claimed: 3, succeeded: 2, retried: 1, failed: 0 },
    reservations: { inspected: 2, expired: 1 },
    outbox: { pending: 4, processing: 0, succeeded: 2, failed: 0 },
  };
  const healthyDrain = await runWorker({ targetUrl: mockUrl });
  assert.equal(healthyDrain.code, 0, healthyDrain.stderr);
  assert.deepEqual(workerRequests.at(-1)?.body, { mode: "drain", limit: 3 });
  assert.match(healthyDrain.stdout, /"status":"degraded"/);

  mockPayload = {
    mode: "drain",
    result: { claimed: 0, succeeded: 0, retried: 0, failed: 0 },
    reservations: { inspected: 0, expired: 0 },
    outbox: { pending: 0, processing: 0, succeeded: 4, failed: 1 },
  };
  const persistedFailure = await runWorker({ targetUrl: mockUrl });
  assert.equal(
    persistedFailure.code,
    1,
    "Persisted terminal outbox failures must fail the unattended worker.",
  );

  mockPayload = {
    mode: "drain",
    result: { claimed: 2, succeeded: 1, retried: 0, failed: 0 },
    reservations: { inspected: 0, expired: 0 },
    outbox: { pending: 0, processing: 0, succeeded: 1, failed: 0 },
  };
  const invalidInvariant = await runWorker({ targetUrl: mockUrl });
  assert.equal(
    invalidInvariant.code,
    1,
    "A drain result whose outcomes do not add up to claimed must fail closed.",
  );
} finally {
  await close(mockServer);
}

const runtimeRoot = mkdtempSync(path.join(os.tmpdir(), "elore-outbox-route-"));
const runtimeDatabase = path.join(runtimeRoot, "authority.sqlite");
const runtimePortServer = createServer();
await listen(runtimePortServer);
const runtimeAddress = runtimePortServer.address();
assert.ok(runtimeAddress && typeof runtimeAddress === "object");
const runtimePort = runtimeAddress.port;
await close(runtimePortServer);
const runtimeBaseUrl = `http://127.0.0.1:${runtimePort}`;
let runtimeOutput = "";
const runtime = spawn(process.execPath, [serverFile], {
  cwd: root,
  env: {
    ...process.env,
    APP_ENV: "development",
    AUTHORITY_DB_PATH: runtimeDatabase,
    COZMATEKS_PROJECT_ROOT: runtimeRoot,
    HOSTNAME: "127.0.0.1",
    PORT: String(runtimePort),
    OUTBOX_WORKER_SECRET: workerSecret,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
runtime.stdout.on("data", (chunk) => { runtimeOutput += chunk.toString(); });
runtime.stderr.on("data", (chunk) => { runtimeOutput += chunk.toString(); });

async function waitForRuntime() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (runtime.exitCode !== null) {
      throw new Error(`Outbox route runtime exited with ${runtime.exitCode}.\n${runtimeOutput}`);
    }
    try {
      const response = await fetch(`${runtimeBaseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Outbox route runtime did not become ready.\n${runtimeOutput}`);
}

function snapshotOutbox(database) {
  return database.prepare(`
    SELECT id, status, attempts, next_attempt_at, last_error,
           lease_token, lease_expires_at, completed_at, updated_at
    FROM authority_outbox
    ORDER BY id
  `).all();
}

async function callRoute(rawBody) {
  return fetch(`${runtimeBaseUrl}/api/internal/outbox-drain`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${workerSecret}`,
      "Content-Type": "application/json",
    },
    body: rawBody,
  });
}

let database = null;
try {
  await waitForRuntime();
  database = new DatabaseSync(runtimeDatabase);
  const now = new Date().toISOString();
  database.prepare(`
    INSERT INTO authority_outbox (
      id, aggregate_type, aggregate_id, event_type, dedupe_key, status,
      attempts, next_attempt_at, last_error, payload_json, created_at, updated_at
    ) VALUES (?, 'order', ?, 'order.created', ?, 'pending', 0, ?, NULL, ?, ?, ?)
  `).run(
    "outbox_probe_guard",
    "ELR-OUTBOX-PROBE-001",
    "ELR-OUTBOX-PROBE-001:order.created",
    new Date(Date.now() - 60_000).toISOString(),
    JSON.stringify({ orderNumber: "ELR-OUTBOX-PROBE-001" }),
    now,
    now,
  );
  const before = snapshotOutbox(database);

  for (const rawBody of [
    "{",
    "null",
    "[]",
    "{}",
    JSON.stringify({ probe: true }),
    JSON.stringify({ limit: 3 }),
    JSON.stringify({ mode: "unknown" }),
    JSON.stringify({ mode: "probe", limit: 3 }),
  ]) {
    const invalidResponse = await callRoute(rawBody);
    assert.equal(invalidResponse.status, 400, `Expected 400 for body ${rawBody}`);
    assert.deepEqual(snapshotOutbox(database), before, `Invalid body mutated outbox: ${rawBody}`);
  }

  const probeResponse = await callRoute(JSON.stringify({ mode: "probe" }));
  assert.equal(probeResponse.status, 200);
  const probePayload = await probeResponse.json();
  assert.equal(probePayload.mode, "probe");
  assert.equal(probePayload.probe, true);
  assert.equal(probePayload.outbox.pending, 1);
  assert.deepEqual(snapshotOutbox(database), before, "Probe mode must not mutate due outbox data.");
} finally {
  database?.close();
  runtime.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => runtime.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (runtime.exitCode === null) runtime.kill("SIGKILL");
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${runtimeDatabase}${suffix}`, { force: true });
  }
  rmSync(runtimeRoot, { force: true, recursive: true });
}

console.log("Outbox worker request validation, no-mutation probe, and exit semantics passed.");
