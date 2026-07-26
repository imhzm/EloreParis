import assert from "node:assert/strict";
import { buildLiveReleaseEvidence } from "./live-release-verifier.mjs";

const commit = "0123456789abcdef0123456789abcdef01234567";
const baseUrl = "https://elore-paris.com";
const authorityDatabasePath = "/var/lib/elore-paris/authority.sqlite";
const html = '<html lang="ar"><script src="/_next/static/chunks/app.js"></script></html>';
const responseMap = new Map([
  [`${baseUrl}/api/health`, new Response(JSON.stringify({
    status: "ok",
    service: "elore-paris-storefront",
    hostingProvider: "hostinger_vps",
    commitReference: commit,
  }), { status: 200, headers: { "Content-Type": "application/json" } })],
  [`${baseUrl}/`, new Response(null, { status: 308, headers: { Location: `${baseUrl}/ar` } })],
  [`${baseUrl}/ar`, new Response(html, { status: 200, headers: {
    "Content-Security-Policy": "default-src 'self'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
  } })],
  [`${baseUrl}/en`, new Response('<html lang="en"></html>', { status: 200 })],
  [`${baseUrl}/robots.txt`, new Response(`Sitemap: ${baseUrl}/sitemap.xml`, { status: 200 })],
  [`${baseUrl}/sitemap.xml`, new Response(`<loc>${baseUrl}/ar</loc>`, { status: 200 })],
  ["https://www.elore-paris.com/", new Response(null, { status: 301, headers: { Location: `${baseUrl}/` } })],
  [`${baseUrl}/api/ops/session`, new Response(null, { status: 401 })],
  [`${baseUrl}/api/ops/release/package`, new Response(null, { status: 403 })],
  [`${baseUrl}/api/internal/outbox-drain`, new Response(null, { status: 404 })],
  [`${baseUrl}/_next/static/chunks/app.js`, new Response("console.log('ok')", { status: 200, headers: { "Cache-Control": "public, max-age=31536000, immutable" } })],
]);
const fakeFetch = async (url) => {
  const response = responseMap.get(String(url));
  if (!response) throw new Error(`Unexpected URL: ${url}`);
  return response.clone();
};

const evidence = await buildLiveReleaseEvidence({
  baseUrl,
  expectedCommit: commit,
  authorityDatabasePath,
  fetchImpl: fakeFetch,
  generatedAt: new Date("2026-07-26T12:00:00.000Z"),
});
assert.equal(evidence.verificationMode, "live_postdeploy");
assert.equal(evidence.commitReference, commit);
assert.equal(evidence.targetBaseUrl, baseUrl);
assert.equal(evidence.checks.length, 11);
assert.ok(evidence.checks.every((check) => check.status === "passed"));
assert.deepEqual(evidence.summary, {
  publicRouteChecks: 6,
  protectedRouteChecks: 3,
  assetChecks: 1,
  apiChecks: 1,
});

await assert.rejects(
  buildLiveReleaseEvidence({
    baseUrl,
    expectedCommit: "f".repeat(40),
    authorityDatabasePath,
    fetchImpl: fakeFetch,
  }),
  /api-health/,
);
await assert.rejects(
  buildLiveReleaseEvidence({
    baseUrl: "http://elore-paris.com",
    expectedCommit: commit,
    authorityDatabasePath,
    fetchImpl: fakeFetch,
  }),
  /canonical HTTPS origin/,
);
await assert.rejects(
  buildLiveReleaseEvidence({
    baseUrl,
    expectedCommit: commit,
    authorityDatabasePath: "/tmp/authority.sqlite",
    fetchImpl: fakeFetch,
  }),
  /persistent application state directory/,
);

console.log("Live release verifier checks passed.");
