import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

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
const gitAttributes = readFileSync(path.join(root, ".gitattributes"), "utf8");

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
];

for (const [pattern, description] of requiredDeployContracts) {
  assert.match(deployScript, pattern, `Hostinger deploy is missing: ${description}`);
}

const trapPosition = deployScript.indexOf("trap rollback_on_exit EXIT");
const switchPosition = deployScript.indexOf("SWITCH_STARTED=true");
const restartPosition = deployScript.indexOf('systemctl restart "${SERVICE_NAME}"', switchPosition);
assert.ok(trapPosition >= 0 && trapPosition < switchPosition, "Rollback trap must be armed before release switch");
assert.ok(switchPosition < restartPosition, "Release switch must be tracked before service restart");
assert.ok(!deployScript.includes("rm -rf"), "Deploy must not recursively delete release paths");

assert.match(
  environmentTemplate,
  /^PROMOTION_MEDIA_ROOT=\/var\/lib\/elore-paris\/media\/promotions$/m,
  "Promotion media must use persistent writable storage",
);
assert.match(serviceUnit, /^CacheDirectory=elore-paris$/m, "Next image cache must be persistent and writable");
assert.match(gitAttributes, /^\*\.sh text eol=lf$/m, "Shell scripts must retain LF endings");

console.log(
  JSON.stringify(
    {
      status: "passed",
      immutableCommit: true,
      unprivilegedBuild: true,
      commitAwareRollback: true,
      persistentRuntimeStorage: true,
    },
    null,
    2,
  ),
);
