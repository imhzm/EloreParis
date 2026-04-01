import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const port = Number(process.env.SMOKE_PORT ?? 3066);
const host = process.env.SMOKE_HOST ?? "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
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

async function fetchText(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    cache: "no-store",
  });

  const body = await response.text();
  return { response, body };
}

async function fetchJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    cache: "no-store",
  });

  const body = await response.json();
  return { response, body };
}

async function fetchHead(pathname) {
  return fetch(`${baseUrl}${pathname}`, {
    method: "HEAD",
    cache: "no-store",
  });
}

function assertIncludes(body, marker, pathname) {
  assert.ok(
    body.includes(marker),
    `Expected ${pathname} to include marker: ${marker}`,
  );
}

const smokeChecks = [
  {
    pathname: "/",
    markers: ["nav_search", "/manifest.webmanifest", "/opengraph-image"],
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
    pathname: "/sitemap.xml",
    markers: [
      "/products/radiant-dew-serum",
      "/journal/niacinamide-vs-vitamin-c-which-fits-your-routine",
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

server = spawn(process.execPath, [nextCliPath, "start", "--port", String(port)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: baseUrl,
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

  for (const pathname of assetChecks) {
    const response = await fetchHead(pathname);
    assert.equal(response.status, 200, `Expected ${pathname} to return 200`);
    assert.equal(
      response.headers.get("content-type"),
      "image/svg+xml",
      `Expected ${pathname} to return image/svg+xml`,
    );
  }

  for (const check of smokeChecks) {
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
}
