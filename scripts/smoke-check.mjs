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

function safeCleanupAuthorityArtifacts() {
  safeRemoveAuthorityArtifact(authorityDbFile);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-shm`);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-wal`);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-journal`);
  safeRemoveAuthorityArtifact(orderAuthorityFile);
  safeRemoveAuthorityArtifact(opsAuditFile);
  safeRemoveAuthorityArtifact(notificationAuthorityFile);
  safeRemoveAuthorityArtifact(releaseEvidenceFile);
}

function writeReleaseEvidence(report) {
  mkdirSync(path.dirname(releaseEvidenceFile), { recursive: true });
  writeFileSync(releaseEvidenceFile, JSON.stringify(report, null, 2));
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
      "ops_release_to_health",
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

safeCleanupAuthorityArtifacts();

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

  const { response: auditResponse, body: auditBody } = await fetchJson(
    "/api/ops/audit",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    auditResponse.status,
    200,
    "Expected ops audit API to return 200 for manager role",
  );
  assert.ok(
    auditBody.auditEntries.some((entry) => entry.action === "ops_login_success"),
    "Expected audit API to include a login success entry",
  );
  assert.ok(
    auditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_order_status_update" &&
        entry.entityId === createOrderBody.order.orderNumber,
    ),
    "Expected audit API to include the smoke order status update",
  );
  assert.ok(
    auditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_notification_status_update" &&
        entry.entityId === smokeNotification.id,
    ),
    "Expected audit API to include the smoke notification status update",
  );

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
      apiChecks: 8,
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
        title: "Health, orders, notifications, audit, and release APIs",
        count: 8,
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
  safeCleanupAuthorityArtifacts();
}
