// Boots the standalone build with the release gates OPEN and one approved product
// in a throwaway catalogue, then leaves it running so the purchase journey can be
// looked at.
//
// WHY THIS EXISTS
//
// The pack's Definition of Done (CLAUDE.md §18) requires testing the journey
// Home -> Collection -> Product -> Cart -> Checkout, and Milestone 9 asks for a
// checkout smoke test. Neither was reachable. Governance is fail-closed by design:
// PUBLIC_CATALOG_APPROVED gates the catalogue, and src/proxy.ts 307s every
// /{locale}/product/* to /shop while it is shut. That is correct for production and
// it also meant nobody could SEE the product page — which is how it came to ship a
// purchase panel that renders at opacity 0.
//
// This does NOT weaken any of that. It writes to a scratch database under .data/,
// passes the approvals as environment to one local process, and refuses to run
// against anything that looks like real data. The fixture product is branded
// "QA AUTHORITY ONLY" and is the same record scripts/catalog-authority-check.mjs
// already imports, so it can never be mistaken for real merchandise (CLAUDE.md §19:
// no fake product data on the real path).
//
//   node scripts/dev-seed-approved-catalog.mjs [--port 3100]
//
// Ctrl-C stops the server. The scratch database is deleted on start, not on exit,
// so you can inspect it afterwards.

import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { product, validPayload } from "./fixtures/qa-catalog-fixture.mjs";

const root = process.cwd();
const serverFile = path.resolve(root, ".next/standalone/server.js");

const portArg = process.argv.indexOf("--port");
const port = portArg === -1 ? "3100" : process.argv[portArg + 1];
const baseUrl = `http://127.0.0.1:${port}`;

const databasePath = path.resolve(root, ".data/dev-seed-approved-catalog.sqlite");
const legacyOrderPath = path.resolve(root, ".data/dev-seed-approved-catalog-orders.json");

// Refuse to touch anything that is not the scratch path this script owns.
if (!databasePath.includes("dev-seed-approved-catalog")) {
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
    PAYMENT_PROVIDER_LABEL: "QA payment provider",
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

const imported = await api("POST", validPayload);
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
  Approved catalogue seeded. The purchase journey is reachable:

    product   ${baseUrl}/ar/product/${product.slug}
    shop      ${baseUrl}/ar/shop
    cart      ${baseUrl}/ar/cart
    ops       ${baseUrl}/ops   (access code: ${OPS_ACCESS_CODE})

  catalogue available: ${snapshot.available}   products: ${snapshot.products?.length ?? 0}
  scratch db: ${databasePath}

  Ctrl-C to stop.
`);
