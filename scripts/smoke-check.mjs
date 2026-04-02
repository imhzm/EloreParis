import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const port = Number(process.env.SMOKE_PORT ?? 3066);
const host = process.env.SMOKE_HOST ?? "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const opsManagerCode =
  process.env.SMOKE_OPS_MANAGER_CODE ?? "smoke-ops-manager";
const opsCatalogCode =
  process.env.SMOKE_OPS_CATALOG_CODE ?? "smoke-ops-catalog";
const orderAuthoritySecret =
  process.env.SMOKE_ORDER_AUTHORITY_SECRET ?? "smoke-order-authority";
const orderAuthorityFile =
  process.env.SMOKE_ORDER_AUTHORITY_FILE ?? ".data/smoke-orders.json";
const opsAuditFile =
  process.env.SMOKE_OPS_AUDIT_FILE ?? ".data/smoke-ops-audit.json";
const nextCliPath = require.resolve("next/dist/bin/next");

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

function safeCleanupOrderStore() {
  try {
    rmSync(orderAuthorityFile, { force: true });
  } catch {
    // Ignore smoke cleanup failures.
  }

  try {
    rmSync(opsAuditFile, { force: true });
  } catch {
    // Ignore smoke cleanup failures.
  }
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
  return fetchJson(pathname, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
    ...init,
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
];

const assetChecks = ["/og-product.svg", "/og-journal.svg"];

process.on("SIGINT", () => {
  void shutdownServer().finally(() => process.exit(1));
});

process.on("SIGTERM", () => {
  void shutdownServer().finally(() => process.exit(1));
});

safeCleanupOrderStore();

server = spawn(process.execPath, [nextCliPath, "start", "--port", String(port)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: baseUrl,
    OPS_ACCESS_USERS_JSON: JSON.stringify([
      {
        id: "manager",
        name: "Smoke Manager",
        role: "manager",
        accessCode: opsManagerCode,
      },
      {
        id: "catalog",
        name: "Smoke Catalog",
        role: "catalog_operator",
        accessCode: opsCatalogCode,
      },
    ]),
    OPS_ACCESS_SIGNING_SECRET: "smoke-ops-signing-secret",
    ENFORCE_OPS_ACCESS: "true",
    ORDER_AUTHORITY_SECRET: orderAuthoritySecret,
    ORDER_AUTHORITY_FILE: orderAuthorityFile,
    OPS_AUDIT_FILE: opsAuditFile,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", appendLog);
server.stderr.on("data", appendLog);

try {
  const health = await waitForServer();
  assert.equal(health.status, "ok");

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
        shippingMethodId: "express",
        paymentMethodId: "payment_link",
        acceptPolicies: true,
        acceptUpdates: true,
      },
    },
  );
  assert.equal(createOrderResponse.status, 201);
  assert.ok(createOrderBody.order.orderNumber, "Expected created order reference");

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
  assert.equal(recentOrderResponse.status, 200);
  assert.equal(
    recentOrderBody.order.orderNumber,
    createOrderBody.order.orderNumber,
  );

  const { response: trackedOrderResponse, body: trackedOrderBody } = await fetchJson(
    `/api/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}?phoneLastFour=4567`,
  );
  assert.equal(trackedOrderResponse.status, 200);
  assert.equal(
    trackedOrderBody.order.orderNumber,
    createOrderBody.order.orderNumber,
  );

  const { response: loginResponse, body: loginBody } = await sendJson(
    "POST",
    "/api/ops-access/login",
    {
      accessCode: opsManagerCode,
      nextPath: "/ops",
    },
  );
  assert.equal(loginResponse.status, 200);
  assert.equal(loginBody.ok, true);
  assert.equal(loginBody.redirectTo, "/ops");

  const opsCookie = extractCookie(loginResponse, "cozmateks-ops-session");

  const { response: opsSessionResponse, body: opsSessionBody } = await fetchJson(
    "/api/ops/session",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(opsSessionResponse.status, 200);
  assert.equal(opsSessionBody.session.role, "manager");

  const { response: opsOrdersResponse, body: opsOrdersBody } = await fetchJson(
    "/api/ops/orders",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(opsOrdersResponse.status, 200);
  assert.ok(
    opsOrdersBody.orders.some(
      (order) => order.orderNumber === createOrderBody.order.orderNumber,
    ),
    "Expected ops orders API to include the smoke order",
  );

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
  assert.equal(updateOrderResponse.status, 200);
  assert.equal(updateOrderBody.previousStatus, "payment_pending");
  assert.equal(updateOrderBody.nextStatus, "confirmed");

  const { response: auditResponse, body: auditBody } = await fetchJson(
    "/api/ops/audit",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(auditResponse.status, 200);
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
      accessCode: opsCatalogCode,
      nextPath: "/ops",
    },
  );
  assert.equal(catalogLoginResponse.status, 200);
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
  safeCleanupOrderStore();
}
