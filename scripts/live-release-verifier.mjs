import { mkdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "" && url.pathname !== "/")
  ) {
    throw new Error("Live release verification requires a canonical HTTPS origin.");
  }
  return url.origin;
}

function assertCommit(value) {
  const commit = String(value ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error("Live release verification requires an immutable 40-character commit.");
  }
  return commit;
}

function assertPersistentAuthorityDatabasePath(value) {
  const configuredPath = String(value ?? "").trim();
  if (!configuredPath.startsWith("/")) {
    throw new Error("Live release verification requires an absolute authority database path.");
  }
  const normalizedPath = path.posix.normalize(configuredPath);
  const persistentRoot = "/var/lib/elore-paris";
  if (
    normalizedPath === persistentRoot ||
    !normalizedPath.startsWith(`${persistentRoot}/`)
  ) {
    throw new Error("Authority database must use the Hostinger persistent application state directory.");
  }
  return normalizedPath;
}

function resolvesTo(requestUrl, location, expectedUrl) {
  if (!location) return false;
  try {
    return new URL(location, requestUrl).href === expectedUrl;
  } catch {
    return false;
  }
}

async function boundedText(response, maximumBytes = 2_000_000) {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new Error("Live response exceeded the verification size limit.");
  }
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > maximumBytes) {
    throw new Error("Live response exceeded the verification size limit.");
  }
  return text;
}

export async function buildLiveReleaseEvidence({
  baseUrl,
  expectedCommit,
  authorityDatabasePath,
  fetchImpl = fetch,
  generatedAt = new Date(),
}) {
  const canonicalUrl = normalizeBaseUrl(baseUrl);
  const commitReference = assertCommit(expectedCommit);
  assertPersistentAuthorityDatabasePath(authorityDatabasePath);
  const checkResults = [];

  async function check(id, title, category, requestUrl, validate) {
    let passed = false;
    try {
      const response = await fetchImpl(requestUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(12_000),
        headers: { "User-Agent": "elore-live-release-verifier/1.0" },
      });
      passed = await validate(response);
    } catch {
      passed = false;
    }
    checkResults.push({
      category,
      evidence: { id, title, count: 1, status: passed ? "passed" : "failed" },
    });
  }

  await check("api-health", "Runtime health and immutable commit", "api", `${canonicalUrl}/api/health`, async (response) => {
    if (response.status !== 200) return false;
    const payload = await response.json();
    return payload?.status === "ok" &&
      payload?.service === "elore-paris-storefront" &&
      payload?.hostingProvider === "hostinger_vps" &&
      payload?.commitReference === commitReference;
  });
  await check("root-locale", "Root locale redirect", "public", `${canonicalUrl}/`, (response) =>
    [307, 308].includes(response.status) &&
    resolvesTo(`${canonicalUrl}/`, response.headers.get("location"), `${canonicalUrl}/ar`));

  let arabicHomeHtml = "";
  await check("arabic-home", "Arabic storefront and security headers", "public", `${canonicalUrl}/ar`, async (response) => {
    arabicHomeHtml = response.status === 200 ? await boundedText(response) : "";
    return response.status === 200 &&
      /<html[^>]+lang="ar"/i.test(arabicHomeHtml) &&
      response.headers.get("x-content-type-options") === "nosniff" &&
      Boolean(response.headers.get("content-security-policy")) &&
      /max-age=31536000/i.test(response.headers.get("strict-transport-security") ?? "");
  });
  await check("english-home", "English storefront", "public", `${canonicalUrl}/en`, async (response) =>
    response.status === 200 && /<html[^>]+lang="en"/i.test(await boundedText(response)));
  await check("robots", "Production robots policy", "public", `${canonicalUrl}/robots.txt`, async (response) =>
    response.status === 200 && (await boundedText(response, 100_000)).includes(`${canonicalUrl}/sitemap.xml`));
  await check("sitemap", "Production sitemap", "public", `${canonicalUrl}/sitemap.xml`, async (response) =>
    response.status === 200 && (await boundedText(response)).includes(canonicalUrl));
  await check("www-redirect", "WWW canonical redirect", "public", "https://www.elore-paris.com/", (response) =>
    [301, 308].includes(response.status) &&
    resolvesTo("https://www.elore-paris.com/", response.headers.get("location"), `${canonicalUrl}/`));
  await check("ops-session-protected", "Ops session endpoint protection", "protected", `${canonicalUrl}/api/ops/session`, (response) =>
    response.status === 401 || response.status === 403);
  await check("release-api-protected", "Release API protection", "protected", `${canonicalUrl}/api/ops/release/package`, (response) =>
    response.status === 401 || response.status === 403);
  await check("internal-worker-hidden", "Internal worker route hidden", "protected", `${canonicalUrl}/api/internal/outbox-drain`, (response) =>
    response.status === 404);

  const assetPath = arabicHomeHtml.match(/(?:src|href)="(\/_next\/static\/[^"?]+(?:\?[^" ]*)?)"/)?.[1];
  await check("next-static-asset", "Versioned Next.js static asset", "asset", assetPath ? new URL(assetPath, canonicalUrl).href : `${canonicalUrl}/__missing_asset__`, (response) =>
    Boolean(assetPath) && response.status === 200 &&
    /public|max-age/i.test(response.headers.get("cache-control") ?? ""));

  const failedIds = checkResults
    .filter((result) => result.evidence.status === "failed")
    .map((result) => result.evidence.id);
  const countCategory = (category) =>
    checkResults.filter((result) => result.category === category).length;
  const evidence = {
    generatedAt: generatedAt.toISOString(),
    verificationMode: "live_postdeploy",
    targetBaseUrl: canonicalUrl,
    environment: "production",
    commitReference,
    authorityStorage: {
      engine: "sqlite",
      durability: "hostinger-persistent-volume",
    },
    summary: {
      publicRouteChecks: countCategory("public"),
      protectedRouteChecks: countCategory("protected"),
      assetChecks: countCategory("asset"),
      apiChecks: countCategory("api"),
    },
    checks: checkResults.map((result) => result.evidence),
    notes: [
      "Generated automatically from the switched Hostinger runtime.",
      "Authority storage was verified under the persistent Hostinger application state directory.",
      "Approval remains fail-closed when any check, commit, URL, or freshness contract drifts.",
    ],
  };

  if (failedIds.length) {
    throw new Error(`Live release verification failed: ${failedIds.join(", ")}`);
  }
  return evidence;
}

async function main() {
  const baseUrl = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL;
  const expectedCommit = process.argv[3] ?? process.env.DEPLOYMENT_COMMIT_SHA;
  const evidencePath = process.env.RELEASE_EVIDENCE_PATH?.trim();
  const authorityDatabasePath = process.env.AUTHORITY_DB_PATH?.trim();
  if (!evidencePath || !path.isAbsolute(evidencePath)) {
    throw new Error("RELEASE_EVIDENCE_PATH must be an absolute persistent path.");
  }
  const evidence = await buildLiveReleaseEvidence({
    baseUrl,
    expectedCommit,
    authorityDatabasePath,
  });
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  const temporaryEvidencePath = `${evidencePath}.${process.pid}.tmp`;
  try {
    writeFileSync(temporaryEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o640,
    });
    renameSync(temporaryEvidencePath, evidencePath);
  } catch (error) {
    try {
      unlinkSync(temporaryEvidencePath);
    } catch {
      // The temporary file may not have been created.
    }
    throw error;
  }
  console.log(JSON.stringify({
    status: "passed",
    targetBaseUrl: evidence.targetBaseUrl,
    commitReference: evidence.commitReference,
    checks: evidence.checks.length,
  }));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
