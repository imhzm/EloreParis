import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const deployScript = readFileSync(
  path.join(root, "deploy", "hostinger", "deploy-release.sh"),
  "utf8",
);
const environmentTemplate = readFileSync(
  path.join(root, "deploy", "hostinger", "elore-paris.env.example"),
  "utf8",
);
const serviceUnit = readFileSync(
  path.join(root, "deploy", "hostinger", "elore-paris.service"),
  "utf8",
);
const outboxServiceUnit = readFileSync(
  path.join(root, "deploy", "hostinger", "elore-paris-outbox.service"),
  "utf8",
);
const outboxTimerUnit = readFileSync(
  path.join(root, "deploy", "hostinger", "elore-paris-outbox.timer"),
  "utf8",
);
const orderOutboxSource = readFileSync(
  path.join(root, "src", "lib", "order-outbox.ts"),
  "utf8",
);
const liveProviderConfigSource = readFileSync(
  path.join(root, "src", "lib", "live-provider-config.ts"),
  "utf8",
);
const nginxConfig = readFileSync(
  path.join(root, "deploy", "hostinger", "elore-paris.nginx.conf"),
  "utf8",
);
const gitAttributes = readFileSync(path.join(root, ".gitattributes"), "utf8");
const serverFile = path.join(root, ".next", "standalone", "server.js");
const expectedCommit = "0123456789abcdef0123456789abcdef01234567";

const requiredDeployContracts = [
  [/\[\[ "\$\{EUID\}" -ne 0 \]\]/, "root wrapper guard"],
  [/\^\[0-9a-fA-F\]\{40\}\$/, "immutable 40-character commit guard"],
  [/flock -n 9/, "single-deployment lock"],
  [/merge-base --is-ancestor "\$\{DEPLOY_COMMIT\}" origin\/main/, "origin/main ancestry guard"],
  [/runuser -u "\$\{APP_USER\}" -- env/, "unprivileged application build"],
  [/HOME="\$\{BUILD_HOME\}"/, "isolated unprivileged build home"],
  [/NEXT_PUBLIC_SITE_URL must be the canonical hosted URL https:\/\/elore-paris\.com/, "canonical host guard"],
  [/chown -R root:"\$\{APP_GROUP\}" "\$\{RELEASE_DIR\}"/, "immutable release ownership"],
  [/trap rollback_on_exit EXIT/, "failure rollback trap"],
  [/wait_for_health "\$\{DEPLOY_COMMIT\}"/, "new release commit-aware health verification"],
  [/wait_for_health "\$\{PREVIOUS_COMMIT\}"/, "rollback health verification"],
  [/elore-paris-outbox\.timer/, "unattended outbox timer installation"],
  [/run-outbox-worker\.mjs" --probe/, "side-effect-free outbox deploy probe"],
  [/RELEASE_EVIDENCE_BACKUP/, "release evidence rollback state"],
  [/OUTBOX_UNITS_CHANGED/, "systemd unit rollback state"],
  [/nginx -t/, "Nginx configuration validation"],
  [/scripts\/live-release-verifier\.mjs/, "canonical live post-deploy verification"],
];

for (const [pattern, description] of requiredDeployContracts) {
  assert.match(deployScript, pattern, `Hostinger deploy is missing: ${description}`);
}

const trapPosition = deployScript.indexOf("trap rollback_on_exit EXIT");
const switchPosition = deployScript.indexOf("SWITCH_STARTED=true");
const restartPosition = deployScript.indexOf('systemctl restart "${SERVICE_NAME}"', switchPosition);
const timerPausePosition = deployScript.indexOf("systemctl stop elore-paris-outbox.timer");
const rollbackHealthPosition = deployScript.indexOf('wait_for_health "${PREVIOUS_COMMIT}"');
const timerRestorePosition = deployScript.indexOf("systemctl start elore-paris-outbox.timer");
const outboxInstallPosition = deployScript.indexOf('"${RELEASE_DIR}/deploy/hostinger/elore-paris-outbox.service"');
const nginxMutationFlagPosition = deployScript.indexOf("NGINX_CONFIG_CHANGED=true");
const nginxInstallPosition = deployScript.indexOf('"${RELEASE_DIR}/deploy/hostinger/elore-paris.nginx.conf"');
assert.ok(trapPosition >= 0 && trapPosition < switchPosition, "Rollback trap must be armed before release switch");
assert.ok(timerPausePosition >= 0 && timerPausePosition < switchPosition, "The old outbox timer must pause before release switch");
assert.ok(rollbackHealthPosition >= 0 && rollbackHealthPosition < timerRestorePosition, "Rollback must recover the previous runtime before restarting its timer");
assert.ok(switchPosition < restartPosition, "Release switch must be tracked before service restart");
assert.ok(trapPosition < outboxInstallPosition, "Rollback trap must be armed before systemd unit installation");
assert.ok(nginxMutationFlagPosition < nginxInstallPosition, "Nginx rollback state must be set before config mutation");
assert.ok(!deployScript.includes("rm -rf"), "Deploy must not recursively delete release paths");
assert.ok(!deployScript.includes("systemctl start elore-paris-outbox.service"), "Deploy must not drain live outbox events as a smoke test");
assert.match(deployScript, /Outbox unit paths must be regular files, not masked or linked units/, "Deploy must reject non-restorable systemd unit states");
assert.match(deployScript, /-e "\$\{unit_path\}" && ! -f "\$\{unit_path\}"/, "Deploy must reject every non-regular systemd unit path");
assert.match(deployScript, /CRITICAL: rollback step failed/, "Rollback failures must be operator-visible");
assert.match(deployScript, /WARNING: deployed successfully but could not remove backup artifact/, "Successful cleanup must be best-effort");

assert.match(
  environmentTemplate,
  /^PROMOTION_MEDIA_ROOT=\/var\/lib\/elore-paris\/media\/promotions$/m,
  "Promotion media must use persistent writable storage",
);
assert.match(
  environmentTemplate,
  /^AUTHORITY_DB_PATH=\/var\/lib\/elore-paris\/authority\.sqlite$/m,
  "Authority data must use persistent Hostinger storage",
);
assert.match(serviceUnit, /^CacheDirectory=elore-paris$/m, "Next image cache must be persistent and writable");
assert.match(outboxServiceUnit, /^Type=oneshot$/m, "Outbox worker must be a bounded oneshot service");
assert.match(outboxServiceUnit, /scripts\/run-outbox-worker\.mjs/, "Outbox worker must use the release script");
assert.match(outboxServiceUnit, /^TimeoutStartSec=65s$/m, "Outbox worker service must have a finite runtime budget");
assert.match(orderOutboxSource, /DEFAULT_LEASE_MS = 300_000/, "Outbox leases must exceed a worker request window");
assert.match(orderOutboxSource, /claimAuthorityOutboxEvents\(\{\s*limit: 1,/s, "Outbox events must be claimed just in time");
assert.match(liveProviderConfigSource, /PROVIDER_REQUEST_TIMEOUT_MAX_MS = 10_000/, "Provider requests must have a bounded timeout");
const outboxWorkerSource = readFileSync(
  path.join(root, "scripts", "run-outbox-worker.mjs"),
  "utf8",
);
assert.match(outboxWorkerSource, /--probe/, "Outbox worker must support a side-effect-free deploy probe");
assert.match(outboxWorkerSource, /const drainLimit = 3/, "Outbox worker batches must remain bounded for the service timeout");
assert.match(outboxWorkerSource, /outbox\.failed/, "Persisted terminal outbox failures must affect worker health");
assert.match(outboxTimerUnit, /^OnUnitActiveSec=60s$/m, "Outbox retries must run every minute");
assert.match(outboxTimerUnit, /^Persistent=true$/m, "Missed outbox runs must resume after downtime");
assert.match(
  nginxConfig,
  /location = \/api\/internal\/outbox-drain\s*\{\s*return 404;/s,
  "Internal worker route must not be exposed by Nginx",
);
assert.match(gitAttributes, /^\*\.sh text eol=lf$/m, "Shell scripts must retain LF endings");

if (!existsSync(serverFile)) {
  throw new Error("Standalone build is missing. Run `npm run build` first.");
}

const runtimeRoot = mkdtempSync(path.join(os.tmpdir(), "elore-hostinger-health-"));
const runtimeDatabase = path.join(runtimeRoot, "authority.sqlite");
writeFileSync(path.join(runtimeRoot, ".deployment-commit"), `${expectedCommit}\n`, {
  encoding: "utf8",
  mode: 0o440,
});

let runtimeOutput = "";
const runtime = spawn(process.execPath, [serverFile], {
  cwd: root,
  env: {
    ...process.env,
    APP_ENV: "production",
    AUTHORITY_DB_PATH: runtimeDatabase,
    COZMATEKS_PROJECT_ROOT: runtimeRoot,
    DEPLOYMENT_COMMIT_SHA: "",
    HOSTING_PROVIDER: "hostinger_vps",
    HOSTNAME: "127.0.0.1",
    PORT: "3075",
    OUTBOX_WORKER_SECRET: "hostinger-outbox-worker-secret-at-least-32-bytes",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
runtime.stdout.on("data", (chunk) => { runtimeOutput += chunk.toString(); });
runtime.stderr.on("data", (chunk) => { runtimeOutput += chunk.toString(); });

try {
  let healthResponse = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const candidate = await fetch("http://127.0.0.1:3075/api/health");
      if (candidate.ok) {
        healthResponse = candidate;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.ok(healthResponse, `Hostinger health runtime did not start.\n${runtimeOutput}`);
  const health = await healthResponse.json();
  assert.equal(health.hostingProvider, "hostinger_vps");
  assert.equal(health.commitReference, expectedCommit);
  const unauthorizedWorkerResponse = await fetch(
    "http://127.0.0.1:3075/api/internal/outbox-drain",
    { method: "POST" },
  );
  assert.equal(unauthorizedWorkerResponse.status, 401);
  const workerProbeResponse = await fetch(
    "http://127.0.0.1:3075/api/internal/outbox-drain",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer hostinger-outbox-worker-secret-at-least-32-bytes",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "probe" }),
    },
  );
  assert.equal(workerProbeResponse.status, 200);
  const workerProbe = await workerProbeResponse.json();
  assert.equal(workerProbe.mode, "probe");
  assert.equal(workerProbe.probe, true);
  assert.ok(workerProbe.outbox && typeof workerProbe.outbox === "object");

  const authorizedWorkerResponse = await fetch(
    "http://127.0.0.1:3075/api/internal/outbox-drain",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer hostinger-outbox-worker-secret-at-least-32-bytes",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "drain", limit: 3 }),
    },
  );
  assert.equal(authorizedWorkerResponse.status, 200);
  const workerResult = await authorizedWorkerResponse.json();
  assert.equal(workerResult.mode, "drain");
  assert.deepEqual(workerResult.result, {
    claimed: 0,
    succeeded: 0,
    retried: 0,
    failed: 0,
  });
  assert.deepEqual(workerResult.outbox, workerProbe.outbox);
} finally {
  runtime.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => runtime.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (runtime.exitCode === null) runtime.kill("SIGKILL");
  rmSync(runtimeRoot, { force: true, recursive: true });
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      immutableCommit: true,
      unprivilegedBuild: true,
      commitAwareRollback: true,
      runtimeIdentityVerified: true,
      persistentRuntimeStorage: true,
      unattendedOutboxRetry: true,
    },
    null,
    2,
  ),
);
