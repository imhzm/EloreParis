// Boots the standalone build with the release gates OPEN and the DEMO sample
// catalogue (scripts/fixtures/demo-catalog-fixture.mjs), so the shop grid and the
// product page can be previewed populated across collections.
//
// This does NOT weaken governance: it writes to an isolated scratch database under
// .data/, passes approvals as environment to one local process, and refuses to run
// against anything else. Every product is an ÉLORÉ placeholder with `evidence://demo`
// sentinels and `DEMO-...` identifiers — never real, sellable stock (CLAUDE.md §19).
//
//   node scripts/dev-seed-demo-catalog.mjs [--port 3100]
//
// Ctrl-C stops the server. The scratch database is deleted on start, not on exit.

import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { demoPayload, products } from "./fixtures/demo-catalog-fixture.mjs";

const root = process.cwd();
const serverFile = path.resolve(root, ".next/standalone/server.js");

const portArg = process.argv.indexOf("--port");
const port = portArg === -1 ? "3100" : process.argv[portArg + 1];
const baseUrl = `http://127.0.0.1:${port}`;

const databasePath = path.resolve(root, ".data/dev-seed-demo-catalog.sqlite");
const legacyOrderPath = path.resolve(root, ".data/dev-seed-demo-catalog-orders.json");

if (!databasePath.includes("dev-seed-demo-catalog")) {
  throw new Error("Refusing to run: the database path is not this script's scratch file.");
}
if (!existsSync(serverFile)) {
  throw new Error("Standalone build is missing. Run `npm run build` first.");
}

rmSync(databasePath, { force: true });
rmSync(legacyOrderPath, { force: true });

const OPS_ACCESS_CODE = "dev-seed-access-code";
const OPS_ACCESS_SIGNING_SECRET = "dev-seed-signing-secret";

const server = spawn(process.execPath, [serverFile], {
  cwd: root,
  env: {
    ...process.env,
    COZMATEKS_PROJECT_ROOT: root,
    HOSTNAME: "127.0.0.1",
    PORT: port,
    APP_ENV: "development",
    AUTHORITY_DB_PATH: databasePath,
    ORDER_AUTHORITY_FILE: legacyOrderPath,
    OPS_ACCESS_CODE,
    OPS_ACCESS_SIGNING_SECRET,
    PUBLIC_TERMS_VERSION: "qa-terms-v1",
    PUBLIC_PRIVACY_NOTICE_VERSION: "qa-privacy-v1",
    PUBLIC_CATALOG_APPROVED: "true",
    PUBLIC_LEGAL_CONTENT_APPROVED: "true",
    PAYMENT_PROVIDER_LABEL: "Demo payment provider",
    PAYMENT_PROVIDER_CALLBACK_SECRET: "qa-payment-callback-secret",
    PAYMENT_PROVIDER_BASE_URL: "http://127.0.0.1:1/unused",
    PAYMENT_PROVIDER_REQUEST_PATH: "/payments/links",
    PAYMENT_PROVIDER_API_KEY: "qa-payment-api-key",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
server.stdout.on("data", (chunk) => { output += chunk; });
server.stderr.on("data", (chunk) => { output += chunk; });

const stop = () => { server.kill(); };
process.on("SIGINT", () => { stop(); process.exit(0); });
process.on("SIGTERM", () => { stop(); process.exit(0); });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  stop();
  throw new Error(`Server did not start.\n${output}`);
}

await waitForServer();

const loginResponse = await fetch(`${baseUrl}/api/ops-access/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: baseUrl },
  body: JSON.stringify({ accessCode: OPS_ACCESS_CODE, nextPath: "/ops/catalog" }),
});
if (!loginResponse.ok) {
  stop();
  throw new Error(`ops sign-in failed: ${loginResponse.status} ${await loginResponse.text()}`);
}
const sessionCookie = (loginResponse.headers.get("set-cookie") ?? "").split(";", 1)[0];

async function api(method, body) {
  const response = await fetch(`${baseUrl}/api/ops/catalog/authority`, {
    method,
    headers: {
      Cookie: sessionCookie,
      ...(body === undefined ? {} : { "Content-Type": "application/json", Origin: baseUrl }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

const imported = await api("POST", demoPayload);
if (imported.response.status !== 201) {
  stop();
  throw new Error(`import failed: ${imported.response.status} ${JSON.stringify(imported.body, null, 2)}`);
}

const published = await api("PATCH", { action: "publish", importId: imported.body.importId });
if (published.response.status !== 200) {
  stop();
  throw new Error(`publish failed: ${published.response.status} ${JSON.stringify(published.body, null, 2)}`);
}

const check = await fetch(`${baseUrl}/api/catalog?locale=ar`);
const snapshot = await check.json();

console.log(`
  DEMO sample catalogue seeded (${products.length} products across collections):

    shop / skincare   ${baseUrl}/ar/shop/skincare
    shop / makeup     ${baseUrl}/ar/shop/makeup
    shop / bodycare   ${baseUrl}/ar/shop/bodycare
    a product         ${baseUrl}/ar/product/${products[0].slug}
    cart              ${baseUrl}/ar/cart
    ops               ${baseUrl}/ops   (access code: ${OPS_ACCESS_CODE})

  catalogue available: ${snapshot.available}   products: ${snapshot.products?.length ?? 0}
  scratch db: ${databasePath}

  These are ÉLORÉ demo placeholders — replace with your real approved catalogue
  before any real customer can order. Ctrl-C to stop.
`);
