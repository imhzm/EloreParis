import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.SMOKE_PORT ?? 3066);
const host = process.env.SMOKE_HOST ?? "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const trustedMutationHeaders = {
  Origin: baseUrl,
};
const opsManagerUsername =
  process.env.SMOKE_OPS_MANAGER_USERNAME ?? "smoke.manager";
const opsManagerPassword =
  process.env.SMOKE_OPS_MANAGER_PASSWORD ?? "SmokeManager!123";
const opsCatalogUsername =
  process.env.SMOKE_OPS_CATALOG_USERNAME ?? "smoke.catalog";
const opsCatalogPassword =
  process.env.SMOKE_OPS_CATALOG_PASSWORD ?? "SmokeCatalog!123";
const orderAuthoritySecret =
  process.env.SMOKE_ORDER_AUTHORITY_SECRET ?? "smoke-order-authority";
const authorityDbFile =
  process.env.SMOKE_AUTHORITY_DB_PATH ?? ".data/smoke-authority.sqlite";
const orderAuthorityFile =
  process.env.SMOKE_ORDER_AUTHORITY_FILE ?? ".data/smoke-orders.json";
const opsAuditFile =
  process.env.SMOKE_OPS_AUDIT_FILE ?? ".data/smoke-ops-audit.json";
const notificationAuthorityFile =
  process.env.SMOKE_NOTIFICATION_AUTHORITY_FILE ??
  ".data/smoke-notifications.json";
const releaseEvidenceFile =
  process.env.SMOKE_RELEASE_EVIDENCE_PATH ??
  process.env.RELEASE_EVIDENCE_PATH ??
  ".artifacts/release-evidence.json";
const releasePackageFile =
  process.env.SMOKE_RELEASE_PACKAGE_PATH ?? ".artifacts/release-package.json";
const releasePackageMarkdownFile =
  process.env.SMOKE_RELEASE_PACKAGE_MARKDOWN_PATH ??
  ".artifacts/release-package.md";
const releaseHistoryFile =
  process.env.SMOKE_RELEASE_HISTORY_PATH ?? ".artifacts/release-history.json";
const releaseHistoryMarkdownFile =
  process.env.SMOKE_RELEASE_HISTORY_MARKDOWN_PATH ??
  ".artifacts/release-history.md";
const releaseDiffFile =
  process.env.SMOKE_RELEASE_DIFF_PATH ?? ".artifacts/release-diff.json";
const releaseDiffMarkdownFile =
  process.env.SMOKE_RELEASE_DIFF_MARKDOWN_PATH ??
  ".artifacts/release-diff.md";
const releaseDecisionFile =
  process.env.SMOKE_RELEASE_DECISION_PATH ?? ".artifacts/release-decision.json";
const releaseDecisionMarkdownFile =
  process.env.SMOKE_RELEASE_DECISION_MARKDOWN_PATH ??
  ".artifacts/release-decision.md";
const releasePacketFile =
  process.env.SMOKE_RELEASE_PACKET_PATH ?? ".artifacts/release-packet.json";
const releasePacketMarkdownFile =
  process.env.SMOKE_RELEASE_PACKET_MARKDOWN_PATH ??
  ".artifacts/release-packet.md";
const standaloneStartScript = path.resolve(
  process.cwd(),
  "scripts/start-standalone.mjs",
);

if (!existsSync(".next/BUILD_ID")) {
  throw new Error("Production build not found. Run `npm run build` before `npm run test:smoke`.");
}

const outputBuffer = [];
let server;

function appendLog(chunk) {
  const text = chunk.toString();
  outputBuffer.push(text);

  if (outputBuffer.length > 80) {
    outputBuffer.shift();
  }
}

function formatRecentLogs() {
  return outputBuffer.join("").trim();
}

function safeRemoveAuthorityArtifact(filePath) {
  try {
    rmSync(filePath, { force: true });
  } catch {
    // Ignore smoke cleanup failures.
  }
}

function safeCleanupAuthorityState() {
  safeRemoveAuthorityArtifact(authorityDbFile);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-shm`);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-wal`);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-journal`);
  safeRemoveAuthorityArtifact(orderAuthorityFile);
  safeRemoveAuthorityArtifact(opsAuditFile);
  safeRemoveAuthorityArtifact(notificationAuthorityFile);
}

function resetReleaseArtifacts() {
  safeRemoveAuthorityArtifact(releaseEvidenceFile);
  safeRemoveAuthorityArtifact(releasePackageFile);
  safeRemoveAuthorityArtifact(releasePackageMarkdownFile);
  safeRemoveAuthorityArtifact(releaseHistoryFile);
  safeRemoveAuthorityArtifact(releaseHistoryMarkdownFile);
  safeRemoveAuthorityArtifact(releaseDiffFile);
  safeRemoveAuthorityArtifact(releaseDiffMarkdownFile);
  safeRemoveAuthorityArtifact(releaseDecisionFile);
  safeRemoveAuthorityArtifact(releaseDecisionMarkdownFile);
  safeRemoveAuthorityArtifact(releasePacketFile);
  safeRemoveAuthorityArtifact(releasePacketMarkdownFile);
}

function writeReleaseEvidence(report) {
  mkdirSync(path.dirname(releaseEvidenceFile), { recursive: true });
  writeFileSync(releaseEvidenceFile, JSON.stringify(report, null, 2));
}

function renderReleasePackageMarkdown(releasePackage) {
  const blockedItems = releasePackage.blockedItems
    .map(
      (item) =>
        `- ${item.title} (${item.source})\n  ${item.summary}\n  ${item.details
          .map((detail) => `  - ${detail}`)
          .join("\n")}`,
    )
    .join("\n");
  const warningItems = releasePackage.warningItems
    .map(
      (item) =>
        `- ${item.title} (${item.source})\n  ${item.summary}\n  ${item.details
          .map((detail) => `  - ${detail}`)
          .join("\n")}`,
    )
    .join("\n");
  const nextActions = releasePackage.nextActions
    .map((action) => `- ${action}`)
    .join("\n");
  const evidenceNotes =
    releasePackage.releaseEvidence?.notes.map((note) => `- ${note}`).join("\n") ??
    "- No stored release evidence is available yet.";

  return [
    "# Release Package",
    "",
    `- Generated at: ${releasePackage.generatedAt}`,
    `- Verification mode: ${releasePackage.verificationMode}`,
    `- Target base URL: ${releasePackage.targetBaseUrl}`,
    `- Runtime environment: ${releasePackage.runtimeEnvironment}`,
    `- Canonical URL: ${releasePackage.canonicalUrl}`,
    `- Overall status: ${releasePackage.overallStatus}`,
    `- Blocked items: ${releasePackage.blockedCount}`,
    `- Warning items: ${releasePackage.warningCount}`,
    `- Ready items: ${releasePackage.readyCount}`,
    "",
    "## Blocked Items",
    blockedItems || "- None.",
    "",
    "## Warning Items",
    warningItems || "- None.",
    "",
    "## Next Actions",
    nextActions || "- None.",
    "",
    "## Latest Evidence Notes",
    evidenceNotes,
    "",
  ].join("\n");
}

function writeReleasePackageArtifacts(releasePackage) {
  mkdirSync(path.dirname(releasePackageFile), { recursive: true });
  writeFileSync(releasePackageFile, JSON.stringify(releasePackage, null, 2));
  writeFileSync(
    releasePackageMarkdownFile,
    renderReleasePackageMarkdown(releasePackage),
  );
}

function renderReleaseHistoryMarkdown(releasePackages) {
  if (!releasePackages.length) {
    return "# Release History\n\n- No published release packages are stored yet.\n";
  }

  return [
    "# Release History",
    "",
    ...releasePackages.flatMap((record) => [
      `## ${record.id}`,
      "",
      `- Published at: ${record.publishedAt}`,
      `- Actor: ${record.actor.name} (${record.actor.role})`,
      `- Verification mode: ${record.verificationMode}`,
      `- Target base URL: ${record.targetBaseUrl}`,
      `- Overall status: ${record.overallStatus}`,
      `- Blocked items: ${record.blockedCount}`,
      `- Warning items: ${record.warningCount}`,
      `- Ready items: ${record.readyCount}`,
      "",
    ]),
  ].join("\n");
}

function writeReleaseHistoryArtifacts(releasePackages) {
  mkdirSync(path.dirname(releaseHistoryFile), { recursive: true });
  writeFileSync(releaseHistoryFile, JSON.stringify(releasePackages, null, 2));
  writeFileSync(
    releaseHistoryMarkdownFile,
    renderReleaseHistoryMarkdown(releasePackages),
  );
}

function renderReleaseDiffMarkdown(releaseComparison) {
  return [
    "# Release Drift",
    "",
    `- Compared at: ${releaseComparison.comparedAt}`,
    `- Status: ${releaseComparison.status}`,
    `- Latest published record: ${releaseComparison.latestPublishedRecord?.id ?? "none"}`,
    `- Blocked delta: ${releaseComparison.countDeltas.blocked.delta}`,
    `- Warning delta: ${releaseComparison.countDeltas.warning.delta}`,
    `- Ready delta: ${releaseComparison.countDeltas.ready.delta}`,
    "",
    "## Summary",
    ...(releaseComparison.summary.length
      ? releaseComparison.summary.map((item) => `- ${item}`)
      : ["- No summary items."]),
    "",
  ].join("\n");
}

function writeReleaseDiffArtifacts(releaseComparison) {
  mkdirSync(path.dirname(releaseDiffFile), { recursive: true });
  writeFileSync(releaseDiffFile, JSON.stringify(releaseComparison, null, 2));
  writeFileSync(
    releaseDiffMarkdownFile,
    renderReleaseDiffMarkdown(releaseComparison),
  );
}

function renderReleaseDecisionMarkdown(releaseDecisions) {
  if (!releaseDecisions.length) {
    return "# Release Decisions\n\n- No release decisions are stored yet.\n";
  }

  return [
    "# Release Decisions",
    "",
    ...releaseDecisions.flatMap((record) => [
      `## ${record.id}`,
      "",
      `- Decided at: ${record.decidedAt}`,
      `- Actor: ${record.actor.name} (${record.actor.role})`,
      `- Verdict: ${record.verdict}`,
      `- Reviewed packet: ${record.releasePacketGeneratedAt}`,
      `- Review token: ${record.releasePacketReviewToken}`,
      `- Published package: ${record.releasePackageRecordId}`,
      `- Compare status: ${record.compareStatus}`,
      `- Verification mode: ${record.verificationMode}`,
      `- Target base URL: ${record.targetBaseUrl}`,
      `- Overall status: ${record.overallStatus}`,
      `- Rationale: ${record.rationale}`,
      ...(record.notes.length
        ? ["- Notes:", ...record.notes.map((note) => `  - ${note}`)]
        : ["- Notes: none"]),
      "",
    ]),
  ].join("\n");
}

function writeReleaseDecisionArtifacts(releaseDecisions) {
  mkdirSync(path.dirname(releaseDecisionFile), { recursive: true });
  writeFileSync(releaseDecisionFile, JSON.stringify(releaseDecisions, null, 2));
  writeFileSync(
    releaseDecisionMarkdownFile,
    renderReleaseDecisionMarkdown(releaseDecisions),
  );
}

function renderReleasePacketMarkdown(releasePacket) {
  const executiveSummary = releasePacket.executiveSummary
    .map((item) => `- ${item}`)
    .join("\n");
  const blockerHighlights = releasePacket.blockerHighlights
    .map((item) => `- ${item}`)
    .join("\n");
  const nextActions = releasePacket.nextActions
    .map((item) => `- ${item}`)
    .join("\n");

  return [
    "# Release Packet",
    "",
    `- Generated at: ${releasePacket.generatedAt}`,
    `- Review token: ${releasePacket.reviewToken}`,
    `- Overall status: ${releasePacket.overallStatus}`,
    `- Verification mode: ${releasePacket.verificationMode}`,
    `- Target base URL: ${releasePacket.targetBaseUrl}`,
    `- Runtime environment: ${releasePacket.runtimeEnvironment}`,
    `- Canonical URL: ${releasePacket.canonicalUrl}`,
    `- Latest published record: ${releasePacket.latestPublishedRecord?.id ?? "none"}`,
    `- Latest decision: ${releasePacket.latestDecision?.verdict ?? "none"}`,
    `- Comparison status: ${releasePacket.comparison.status}`,
    `- Content launch blockers: ${releasePacket.contentGovernance.launchBlocked}`,
    "",
    "## Executive Summary",
    executiveSummary || "- None.",
    "",
    "## Blocker Highlights",
    blockerHighlights || "- None.",
    "",
    "## Next Actions",
    nextActions || "- None.",
    "",
  ].join("\n");
}

function writeReleasePacketArtifacts(releasePacket) {
  mkdirSync(path.dirname(releasePacketFile), { recursive: true });
  writeFileSync(releasePacketFile, JSON.stringify(releasePacket, null, 2));
  writeFileSync(
    releasePacketMarkdownFile,
    renderReleasePacketMarkdown(releasePacket),
  );
}

async function shutdownServer() {
  if (!server || server.exitCode !== null || server.killed) {
    return;
  }

  server.kill("SIGTERM");
  await delay(1000);

  if (server.exitCode === null && !server.killed) {
    server.kill("SIGKILL");
    await delay(500);
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(
        `Smoke server exited before readiness.\n\nRecent logs:\n${formatRecentLogs()}`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        cache: "no-store",
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload.status === "ok") {
          return payload;
        }
      }
    } catch {
      // Server is still starting.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for smoke server readiness at ${baseUrl}.`);
}

async function fetchText(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    cache: "no-store",
    ...init,
  });

  const body = await response.text();
  return { response, body };
}

async function fetchJson(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    cache: "no-store",
    ...init,
  });

  const body = await response.json();
  return { response, body };
}

async function fetchHead(pathname, init = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    method: "HEAD",
    cache: "no-store",
    ...init,
  });
}

async function sendJson(method, pathname, body, init = {}) {
  const { headers: extraHeaders = {}, ...restInit } = init;

  return fetchJson(pathname, {
    method,
    ...restInit,
    headers: {
      ...trustedMutationHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

function assertIncludes(body, marker, pathname) {
  assert.ok(
    body.includes(marker),
    `Expected ${pathname} to include marker: ${marker}`,
  );
}

function extractCookie(response, cookieName) {
  const setCookieHeader = response.headers.get("set-cookie");
  assert.ok(setCookieHeader, `Expected response to include ${cookieName} cookie`);

  const match = setCookieHeader.match(new RegExp(`${cookieName}=[^;]+`));
  assert.ok(match, `Expected ${cookieName} cookie in Set-Cookie header`);

  return match[0];
}

const publicSmokeChecks = [
  {
    pathname: "/",
    markers: [
      "nav_search",
      "home_entry_haircare",
      "/manifest.webmanifest",
      "/opengraph-image",
    ],
  },
  {
    pathname: "/shop",
    markers: [
      "shop_hub_collection_haircare",
      "shop_hub_to_trust",
      "shop_hub_to_concerns",
    ],
  },
  {
    pathname: "/shop/haircare",
    markers: [
      "collection_haircare_to_primary",
      "collection_haircare_to_shop_hub",
    ],
  },
  {
    pathname: "/products/radiant-dew-serum",
    markers: ["og-product.svg", "product_to_cart_radiant-dew-serum"],
  },
  {
    pathname: "/journal/niacinamide-vs-vitamin-c-which-fits-your-routine",
    markers: [
      "og-journal.svg",
      "article_to_trust_niacinamide-vs-vitamin-c-which-fits-your-routine",
    ],
  },
  {
    pathname: "/cart",
    markers: ['content="noindex, nofollow"', "footer_support_cart"],
  },
  {
    pathname: "/ops-access?next=%2Fops",
    markers: [
      "Ops access gate",
      "ops_access_to_dashboard",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops-access?next=%2Fops%2Faudit",
    markers: [
      "Ops access gate",
      "ops_access_to_audit",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops-access?next=%2Fops%2Fnotifications",
    markers: [
      "Ops access gate",
      "ops_access_to_notifications",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops-access?next=%2Fops%2Frelease",
    markers: [
      "Ops access gate",
      "ops_access_to_release",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/sitemap.xml",
    markers: [
      "/shop/haircare",
      "/shop/beauty-sets",
      "/products/radiant-dew-serum",
      "/journal/niacinamide-vs-vitamin-c-which-fits-your-routine",
    ],
  },
];

const protectedOpsChecks = [
  {
    pathname: "/ops",
    markers: [
      "Internal ops dashboard",
      "ops_dashboard_to_catalog",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops/orders",
    markers: [
      "Internal order ops",
      "ops_to_fulfillment",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops/catalog",
    markers: [
      "Catalog operations",
      "ops_catalog_product_radiant-dew-serum",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops/content",
    markers: [
      "Internal content governance",
      "ops_content_to_audit",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops/release",
    markers: [
      "Internal release readiness",
      "Runtime preflight",
      "Runtime drift",
      "Release decisions",
      "Release history",
      "ops_release_to_packet",
      "ops_release_to_health",
      "ops_release_to_history",
      "ops_release_to_compare",
      "ops_release_to_decisions",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops/fulfillment",
    markers: [
      "Fulfillment routing",
      "ops_fulfillment_to_orders",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops/audit",
    markers: [
      "Internal audit",
      "ops_audit_to_orders",
      "ops_audit_to_release",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops/notifications",
    markers: [
      "Internal notifications",
      "ops_notifications_to_fulfillment",
      'content="noindex, nofollow"',
    ],
  },
];

const assetChecks = ["/og-product.svg", "/og-journal.svg"];

process.on("SIGINT", () => {
  void shutdownServer().finally(() => process.exit(1));
});

process.on("SIGTERM", () => {
  void shutdownServer().finally(() => process.exit(1));
});

safeCleanupAuthorityState();
resetReleaseArtifacts();

server = spawn(process.execPath, [standaloneStartScript], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: baseUrl,
    PORT: String(port),
    HOSTNAME: host,
    OPS_AUTH_USERS_JSON: JSON.stringify([
      {
        id: "manager",
        name: "Smoke Manager",
        role: "manager",
        username: opsManagerUsername,
        passwordHash:
          "scrypt$V0g4xKAfr5fs8KbyqDGz+w==$KtF2LAD+/iUv3nc2xoaahQflidn+UBhky2Va1Zf2rZ1Pkex5h28D3jTFCjZwcokyukHpX8aV97/pSFkC02QiDg==",
      },
      {
        id: "catalog",
        name: "Smoke Catalog",
        role: "catalog_operator",
        username: opsCatalogUsername,
        passwordHash:
          "scrypt$VZqgRZ7iQ1a6cSa0wMLPcw==$TxYvPyblj+ajRequEMrZXXUFrFL8rIcnUTCGuQExaAHP2WElqMoEe81xghsBI7MP2bBfOou0MoQ3K9NKrkvleg==",
      },
    ]),
    OPS_ACCESS_SIGNING_SECRET: "smoke-ops-signing-secret",
    ENFORCE_OPS_ACCESS: "true",
    AUTHORITY_DB_PATH: authorityDbFile,
    ORDER_AUTHORITY_SECRET: orderAuthoritySecret,
    ORDER_AUTHORITY_FILE: orderAuthorityFile,
    OPS_AUDIT_FILE: opsAuditFile,
    NOTIFICATION_AUTHORITY_FILE: notificationAuthorityFile,
    RELEASE_EVIDENCE_PATH: releaseEvidenceFile,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", appendLog);
server.stderr.on("data", appendLog);

try {
  const health = await waitForServer();
  assert.equal(health.status, "ok");
  assert.equal(health.authorityStorage?.engine, "sqlite");

  const { response: healthResponse } = await fetchJson("/api/health");
  assert.equal(healthResponse.status, 200);
  assert.equal(healthResponse.headers.get("cache-control"), "no-store");

  const opsRedirectResponse = await fetch(`${baseUrl}/ops`, {
    cache: "no-store",
    redirect: "manual",
  });
  assert.equal(opsRedirectResponse.status, 307);
  assert.ok(
    (opsRedirectResponse.headers.get("location") ?? "").includes("/ops-access"),
    "Expected /ops to redirect to /ops-access before authentication",
  );

  for (const pathname of assetChecks) {
    const response = await fetchHead(pathname);
    assert.equal(response.status, 200, `Expected ${pathname} to return 200`);
    assert.equal(
      response.headers.get("content-type"),
      "image/svg+xml",
      `Expected ${pathname} to return image/svg+xml`,
    );
  }

  for (const check of publicSmokeChecks) {
    const { response, body } = await fetchText(check.pathname);
    assert.equal(
      response.status,
      200,
      `Expected ${check.pathname} to return 200`,
    );

    for (const marker of check.markers) {
      assertIncludes(body, marker, check.pathname);
    }
  }

  const { response: createOrderResponse, body: createOrderBody } = await sendJson(
    "POST",
    "/api/orders",
    {
      items: [
        {
          productSlug: "radiant-dew-serum",
          sku: "RD-30",
          quantity: 1,
        },
      ],
      checkout: {
        fullName: "Smoke Test Customer",
        phone: "0501234567",
        email: "smoke@example.com",
        city: "الرياض",
        district: "العليا",
        addressLine: "شارع الملك فهد، مبنى 10",
        notes: "Smoke test order",
        shippingMethodId: "standard",
        paymentMethodId: "payment_link",
        acceptPolicies: true,
        acceptUpdates: true,
      },
    },
  );
  assert.equal(createOrderResponse.status, 201);
  assert.ok(createOrderBody.order.orderNumber, "Expected created order reference");
  assert.ok(
    Array.isArray(createOrderBody.notifications) &&
      createOrderBody.notifications.some(
        (notification) => notification.templateKey === "payment_link",
      ),
    "Expected created order response to include active notification queue items",
  );

  const recentOrderCookie = extractCookie(
    createOrderResponse,
    "cozmateks-recent-order",
  );

  const { response: recentOrderResponse, body: recentOrderBody } = await fetchJson(
    `/api/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`,
    {
      headers: {
        Cookie: recentOrderCookie,
      },
    },
  );
  assert.equal(
    recentOrderResponse.status,
    200,
    "Expected recent-order API lookup to return 200",
  );
  assert.equal(
    recentOrderBody.order.orderNumber,
    createOrderBody.order.orderNumber,
  );
  assert.ok(
    recentOrderBody.notifications.some(
      (notification) => notification.templateKey === "payment_link",
    ),
    "Expected recent-order API to include notification queue items",
  );

  const { response: trackedOrderResponse, body: trackedOrderBody } = await fetchJson(
    `/api/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}?phoneLastFour=4567`,
  );
  assert.equal(
    trackedOrderResponse.status,
    200,
    "Expected tracked-order API lookup to return 200",
  );
  assert.equal(
    trackedOrderBody.order.orderNumber,
    createOrderBody.order.orderNumber,
  );
  assert.ok(
    trackedOrderBody.notifications.some(
      (notification) => notification.templateKey === "payment_link",
    ),
    "Expected tracked-order API to include notification queue items",
  );

  const { response: loginResponse, body: loginBody } = await sendJson(
    "POST",
    "/api/ops-access/login",
    {
      username: opsManagerUsername,
      password: opsManagerPassword,
      nextPath: "/ops",
    },
  );
  assert.equal(loginResponse.status, 200, "Expected manager ops login to return 200");
  assert.equal(loginBody.ok, true);
  assert.equal(loginBody.redirectTo, "/ops");

  const opsCookie = extractCookie(loginResponse, "cozmateks-ops-session");

  const logoutWithoutOriginResponse = await fetch(`${baseUrl}/api/ops-access/logout`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(logoutWithoutOriginResponse.status, 403);

  const { response: opsSessionResponse, body: opsSessionBody } = await fetchJson(
    "/api/ops/session",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    opsSessionResponse.status,
    200,
    "Expected ops session summary to return 200 after login",
  );
  assert.equal(opsSessionBody.session.role, "manager");
  assert.equal(opsSessionBody.session.authMethod, "identity_password");
  assert.equal(opsSessionBody.session.username, opsManagerUsername);

  const { response: opsReleaseResponse, body: opsReleaseBody } = await fetchJson(
    "/api/ops/release",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    opsReleaseResponse.status,
    200,
    "Expected ops release API to return 200 for manager role",
  );
  assert.equal(opsReleaseBody.releaseReadiness.overallStatus, "blocked");
  assert.ok(
    opsReleaseBody.releaseReadiness.gates.some(
      (gate) => gate.id === "transactional-backend",
    ),
    "Expected ops release API to include the transactional-backend gate",
  );
  assert.ok(
    opsReleaseBody.releaseReadiness.runtimePreflight,
    "Expected ops release API to include runtime preflight details",
  );
  assert.ok(
    opsReleaseBody.releaseReadiness.runtimePreflight.checks.some(
      (check) => check.id === "signing-secrets",
    ),
    "Expected ops release API to include the signing-secrets preflight check",
  );

  const { response: opsOrdersResponse, body: opsOrdersBody } = await fetchJson(
    "/api/ops/orders",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    opsOrdersResponse.status,
    200,
    "Expected ops orders API to return 200 for manager role",
  );
  assert.ok(
    opsOrdersBody.orders.some(
      (order) => order.orderNumber === createOrderBody.order.orderNumber,
    ),
    "Expected ops orders API to include the smoke order",
  );

  const {
    response: opsNotificationsResponse,
    body: opsNotificationsBody,
  } = await fetchJson("/api/ops/notifications", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    opsNotificationsResponse.status,
    200,
    "Expected ops notifications API to return 200 for manager role",
  );

  const smokeNotification = opsNotificationsBody.notifications.find(
    (notification) =>
      notification.orderNumber === createOrderBody.order.orderNumber &&
      notification.templateKey === "payment_link",
  );

  assert.ok(
    smokeNotification,
    "Expected ops notifications API to include the smoke payment-link notification",
  );
  assert.equal(smokeNotification.status, "queued");

  const { response: updateOrderResponse, body: updateOrderBody } = await sendJson(
    "PATCH",
    `/api/ops/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`,
    {},
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    updateOrderResponse.status,
    200,
    "Expected ops order status update to return 200",
  );
  assert.equal(updateOrderBody.previousStatus, "payment_pending");
  assert.equal(updateOrderBody.nextStatus, "confirmed");

  const {
    response: updateNotificationResponse,
    body: updateNotificationBody,
  } = await sendJson(
    "PATCH",
    `/api/ops/notifications/${encodeURIComponent(smokeNotification.id)}`,
    {
      status: "sent",
    },
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    updateNotificationResponse.status,
    200,
    "Expected ops notification status update to return 200",
  );
  assert.equal(updateNotificationBody.previousStatus, "queued");
  assert.equal(updateNotificationBody.nextStatus, "sent");

  for (const check of protectedOpsChecks) {
    const { response, body } = await fetchText(check.pathname, {
      headers: {
        Cookie: opsCookie,
      },
    });
    assert.equal(
      response.status,
      200,
      `Expected ${check.pathname} to return 200 with ops session`,
    );

    for (const marker of check.markers) {
      assertIncludes(body, marker, check.pathname);
    }
  }

  const { response: catalogLoginResponse, body: catalogLoginBody } = await sendJson(
    "POST",
    "/api/ops-access/login",
    {
      username: opsCatalogUsername,
      password: opsCatalogPassword,
      nextPath: "/ops",
    },
  );
  assert.equal(
    catalogLoginResponse.status,
    200,
    "Expected catalog-role ops login to return 200",
  );
  assert.equal(catalogLoginBody.redirectTo, "/ops/catalog");

  const catalogCookie = extractCookie(
    catalogLoginResponse,
    "cozmateks-ops-session",
  );

  const catalogRedirectResponse = await fetch(`${baseUrl}/ops/orders`, {
    cache: "no-store",
    headers: {
      Cookie: catalogCookie,
    },
    redirect: "manual",
  });
  assert.equal(catalogRedirectResponse.status, 307);
  assert.ok(
    (catalogRedirectResponse.headers.get("location") ?? "").includes(
      "/ops/catalog",
    ),
    "Expected catalog operator to be redirected back to /ops/catalog",
  );

  const { response: forbiddenOrdersApiResponse, body: forbiddenOrdersApiBody } =
    await fetchJson("/api/ops/orders", {
      headers: {
        Cookie: catalogCookie,
      },
    });
  assert.equal(forbiddenOrdersApiResponse.status, 403);
  assert.match(
    forbiddenOrdersApiBody.error,
    /permission/i,
    "Expected role-aware permission error for catalog operator",
  );

  const {
    response: forbiddenNotificationsApiResponse,
    body: forbiddenNotificationsApiBody,
  } = await fetchJson("/api/ops/notifications", {
    headers: {
      Cookie: catalogCookie,
    },
  });
  assert.equal(forbiddenNotificationsApiResponse.status, 403);
  assert.match(
    forbiddenNotificationsApiBody.error,
    /permission/i,
    "Expected role-aware permission error for notifications API",
  );

  const catalogContentRedirectResponse = await fetch(`${baseUrl}/ops/content`, {
    cache: "no-store",
    headers: {
      Cookie: catalogCookie,
    },
    redirect: "manual",
  });
  assert.equal(catalogContentRedirectResponse.status, 307);
  assert.ok(
    (catalogContentRedirectResponse.headers.get("location") ?? "").includes(
      "/ops/catalog",
    ),
    "Expected catalog operator to be redirected away from /ops/content",
  );

  const catalogReleaseRedirectResponse = await fetch(`${baseUrl}/ops/release`, {
    cache: "no-store",
    headers: {
      Cookie: catalogCookie,
    },
    redirect: "manual",
  });
  assert.equal(catalogReleaseRedirectResponse.status, 307);
  assert.ok(
    (catalogReleaseRedirectResponse.headers.get("location") ?? "").includes(
      "/ops/catalog",
    ),
    "Expected catalog operator to be redirected away from /ops/release",
  );

  const releaseEvidence = {
    generatedAt: new Date().toISOString(),
    verificationMode: "local_smoke",
    targetBaseUrl: baseUrl,
    environment: health.environment,
    commitReference: health.commitReference ?? null,
    authorityStorage: {
      engine: health.authorityStorage.engine,
      durability: health.authorityStorage.durability,
    },
    summary: {
      publicRouteChecks: publicSmokeChecks.length,
      protectedRouteChecks: protectedOpsChecks.length,
      assetChecks: assetChecks.length,
      apiChecks: 22,
    },
    checks: [
      {
        id: "public-routes",
        title: "Public route rendering and SEO markers",
        count: publicSmokeChecks.length,
      },
      {
        id: "protected-ops-routes",
        title: "Protected ops routes behind authenticated sessions",
        count: protectedOpsChecks.length,
      },
      {
        id: "api-contracts",
        title: "Health, order, release, notification, audit, package, packet, history, compare, and decision APIs with packet-bound decision guards",
        count: 22,
      },
      {
        id: "release-assets",
        title: "Release-facing assets and social preview surfaces",
        count: assetChecks.length,
      },
    ],
    notes: [
      "Generated from the standalone smoke suite before any live deploy claim.",
      `Health authority engine: ${health.authorityStorage.engine}.`,
      `Release preflight status: ${opsReleaseBody.releaseReadiness.runtimePreflight.overallStatus}.`,
    ],
  };

  writeReleaseEvidence(releaseEvidence);

  const {
    response: publishEvidenceResponse,
    body: publishEvidenceBody,
  } = await sendJson("POST", "/api/ops/release/evidence", {
    releaseEvidence,
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    publishEvidenceResponse.status,
    201,
    "Expected ops release evidence publish API to return 201 for manager role",
  );
  assert.equal(
    publishEvidenceBody.releaseEvidence.verificationMode,
    "local_smoke",
  );

  const {
    response: releaseEvidenceResponse,
    body: releaseEvidenceBody,
  } = await fetchJson("/api/ops/release/evidence", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseEvidenceResponse.status,
    200,
    "Expected ops release evidence API to return 200 for manager role",
  );
  assert.equal(
    releaseEvidenceBody.releaseEvidence.summary.publicRouteChecks,
    publicSmokeChecks.length,
  );
  assert.equal(
    releaseEvidenceBody.releaseEvidence.summary.protectedRouteChecks,
    protectedOpsChecks.length,
  );
  assert.equal(
    releaseEvidenceBody.releaseEvidence.summary.apiChecks,
    22,
  );

  const {
    response: releasePackageResponse,
    body: releasePackageBody,
  } = await fetchJson("/api/ops/release/package", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releasePackageResponse.status,
    200,
    "Expected ops release package API to return 200 for manager role",
  );
  assert.equal(
    releasePackageBody.releasePackage.releaseEvidence?.summary.apiChecks,
    22,
  );
  assert.ok(
    releasePackageBody.releasePackage.blockedItems.some(
      (item) => item.id === "hosting-runtime",
    ),
    "Expected release package to include the hosting-runtime blocker in local smoke mode",
  );

  const {
    response: publishReleasePackageResponse,
    body: publishReleasePackageBody,
  } = await sendJson("POST", "/api/ops/release/package", {}, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    publishReleasePackageResponse.status,
    201,
    "Expected ops release package publish API to return 201 for manager role",
  );
  assert.equal(
    publishReleasePackageBody.releasePackageRecord.verificationMode,
    "local_smoke",
  );
  assert.equal(
    publishReleasePackageBody.releasePackageRecord.artifact.releaseEvidence?.summary.apiChecks,
    22,
  );

  const {
    response: releaseHistoryResponse,
    body: releaseHistoryBody,
  } = await fetchJson("/api/ops/release/history", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseHistoryResponse.status,
    200,
    "Expected ops release history API to return 200 for manager role",
  );
  const publishedReleaseRecord = releaseHistoryBody.releasePackages.find(
    (record) => record.id === publishReleasePackageBody.releasePackageRecord.id,
  );
  assert.ok(
    publishedReleaseRecord,
    "Expected ops release history API to include the newly published release package",
  );
  assert.equal(
    publishedReleaseRecord.artifact.releaseEvidence?.verificationMode,
    "local_smoke",
  );
  writeReleasePackageArtifacts(publishedReleaseRecord.artifact);
  writeReleaseHistoryArtifacts(releaseHistoryBody.releasePackages);

  const {
    response: releaseCompareResponse,
    body: releaseCompareBody,
  } = await fetchJson("/api/ops/release/compare", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseCompareResponse.status,
    200,
    "Expected ops release compare API to return 200 for manager role",
  );
  assert.equal(releaseCompareBody.releaseComparison.status, "unchanged");
  assert.equal(
    releaseCompareBody.releaseComparison.latestPublishedRecord?.id,
    publishReleasePackageBody.releasePackageRecord.id,
  );
  assert.equal(
    releaseCompareBody.releaseComparison.countDeltas.blocked.delta,
    0,
  );
  writeReleaseDiffArtifacts(releaseCompareBody.releaseComparison);

  const {
    response: preDecisionPacketResponse,
    body: preDecisionPacketBody,
  } = await fetchJson("/api/ops/release/packet", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    preDecisionPacketResponse.status,
    200,
    "Expected ops release packet API to return 200 before decision publication",
  );

  const {
    response: staleDecisionResponse,
    body: staleDecisionBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "hold",
      rationale:
        "Automated smoke verification should reject stale decisions that are not based on the latest packet token.",
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: "stale-release-packet-token",
      notes: [
        "Smoke confirms that release decisions are bound to the latest executive packet.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    staleDecisionResponse.status,
    409,
    "Expected ops release decision API to reject stale packet review tokens",
  );
  assert.equal(
    staleDecisionBody.error,
    "The release decision must be based on the latest executive release packet.",
  );

  const {
    response: rejectedApprovalResponse,
    body: rejectedApprovalBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "approve",
      rationale:
        "Automated smoke verification should reject approvals while blocked launch gates still remain.",
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        "Smoke confirms that approvals fail closed until the protected runtime is honestly ready.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    rejectedApprovalResponse.status,
    409,
    "Expected ops release decision API to reject approvals while blocked launch gates remain",
  );
  assert.equal(
    rejectedApprovalBody.error,
    "A blocked runtime package cannot be approved.",
  );

  const {
    response: publishReleaseDecisionResponse,
    body: publishReleaseDecisionBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "hold",
      rationale:
        "Automated smoke verification keeps the release on hold because protected runtime blockers still remain outside the repository.",
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        `Latest compare status: ${releaseCompareBody.releaseComparison.status}.`,
        `Blocked issue IDs: ${publishedReleaseRecord.artifact.blockedItems.map((item) => item.id).join(", ")}.`,
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    publishReleaseDecisionResponse.status,
    201,
    "Expected ops release decision API to record a hold verdict for the latest protected package",
  );
  assert.equal(
    publishReleaseDecisionBody.releaseDecisionRecord.verdict,
    "hold",
  );
  assert.equal(
    publishReleaseDecisionBody.releaseDecisionRecord.releasePackageRecordId,
    publishReleasePackageBody.releasePackageRecord.id,
  );

  const {
    response: releaseDecisionResponse,
    body: releaseDecisionBody,
  } = await fetchJson("/api/ops/release/decisions", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseDecisionResponse.status,
    200,
    "Expected ops release decisions API to return 200 for manager role",
  );
  const publishedReleaseDecision = releaseDecisionBody.releaseDecisions.find(
    (record) => record.id === publishReleaseDecisionBody.releaseDecisionRecord.id,
  );
  assert.ok(
    publishedReleaseDecision,
    "Expected ops release decisions API to include the newly recorded release decision",
  );
  assert.equal(
    publishedReleaseDecision.compareStatus,
    "unchanged",
  );
  assert.equal(
    publishedReleaseDecision.releasePacketReviewToken,
    preDecisionPacketBody.releasePacket.reviewToken,
  );
  writeReleaseDecisionArtifacts(releaseDecisionBody.releaseDecisions);

  const {
    response: releasePacketResponse,
    body: releasePacketBody,
  } = await fetchJson("/api/ops/release/packet", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releasePacketResponse.status,
    200,
    "Expected ops release packet API to return 200 for manager role",
  );
  assert.equal(
    releasePacketBody.releasePacket.latestPublishedRecord?.id,
    publishReleasePackageBody.releasePackageRecord.id,
  );
  assert.equal(
    releasePacketBody.releasePacket.latestDecision?.id,
    publishReleaseDecisionBody.releaseDecisionRecord.id,
  );
  assert.equal(
    releasePacketBody.releasePacket.comparison.status,
    "unchanged",
  );
  assert.equal(
    releasePacketBody.releasePacket.currentArtifact.releaseEvidence?.summary.apiChecks,
    22,
  );
  assert.ok(
    releasePacketBody.releasePacket.contentGovernance.launchBlocked > 0,
    "Expected executive release packet to surface unresolved content blockers",
  );
  writeReleasePacketArtifacts(releasePacketBody.releasePacket);

  const { response: releaseAuditResponse, body: releaseAuditBody } = await fetchJson(
    "/api/ops/audit",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    releaseAuditResponse.status,
    200,
    "Expected ops audit API to return 200 after release publication flows",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some((entry) => entry.action === "ops_login_success"),
    "Expected audit API to include a login success entry",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_order_status_update" &&
        entry.entityId === createOrderBody.order.orderNumber,
    ),
    "Expected audit API to include the smoke order status update",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_notification_status_update" &&
        entry.entityId === smokeNotification.id,
    ),
    "Expected audit API to include the smoke notification status update",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_release_evidence_publish" &&
        entry.metadata.verification_mode === "local_smoke",
    ),
    "Expected audit API to include the local smoke release evidence publication",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_release_package_publish" &&
        entry.entityId === publishReleasePackageBody.releasePackageRecord.id,
    ),
    "Expected audit API to include the release package publication entry",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_release_decision_publish" &&
        entry.entityId === publishReleaseDecisionBody.releaseDecisionRecord.id,
    ),
    "Expected audit API to include the release decision publication entry",
  );

  const throttledIp = "198.51.100.42";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { response: failedLoginResponse } = await sendJson(
      "POST",
      "/api/ops-access/login",
      {
        username: "blocked.user",
        password: "WrongPassword!123",
        nextPath: "/ops",
      },
      {
        headers: {
          "X-Forwarded-For": throttledIp,
        },
      },
    );

    assert.equal(
      failedLoginResponse.status,
      401,
      "Expected invalid identity login attempts to fail before throttling kicks in",
    );
  }

  const { response: throttledLoginResponse, body: throttledLoginBody } = await sendJson(
    "POST",
    "/api/ops-access/login",
    {
      username: "blocked.user",
      password: "WrongPassword!123",
      nextPath: "/ops",
    },
    {
      headers: {
        "X-Forwarded-For": throttledIp,
      },
    },
  );
  assert.equal(throttledLoginResponse.status, 429);
  assert.equal(typeof throttledLoginBody.retryAfterSeconds, "number");
  assert.ok(
    throttledLoginBody.retryAfterSeconds > 0,
    "Expected throttled login response to include retryAfterSeconds",
  );

  const logoutResponse = await fetch(`${baseUrl}/api/ops-access/logout`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...trustedMutationHeaders,
      Cookie: opsCookie,
    },
  });
  assert.equal(
    logoutResponse.status,
    200,
    "Expected trusted-origin logout request to return 200",
  );
  assert.match(
    logoutResponse.headers.get("set-cookie") ?? "",
    /Max-Age=0/i,
    "Expected logout response to clear the ops session cookie",
  );

  console.log(`Smoke checks passed against ${baseUrl}`);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Unknown smoke-check failure";
  console.error(message);

  const recentLogs = formatRecentLogs();
  if (recentLogs) {
    console.error("\nRecent smoke server logs:\n");
    console.error(recentLogs);
  }

  process.exitCode = 1;
} finally {
  await shutdownServer();
  safeCleanupAuthorityState();
}
