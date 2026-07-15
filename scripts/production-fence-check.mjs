import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const serverFile = path.resolve(process.cwd(), ".next/standalone/server.js");

if (!existsSync(serverFile)) {
  throw new Error("Standalone build is missing. Run `npm run build` first.");
}

const orderPayload = {
  items: [{ productSlug: "blocked-prototype", sku: "BLOCKED-SKU", quantity: 1 }],
  checkout: {
    fullName: "Production Fence Test",
    phone: "0501234567",
    email: "fence@example.com",
    city: "Riyadh",
    district: "Olaya",
    addressLine: "Production fence test address",
    notes: "",
    shippingMethodId: "standard",
    paymentMethodId: "cash_on_delivery",
    acceptPolicies: true,
    acceptUpdates: false,
  },
};

async function waitForServer(baseUrl, output) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The standalone runtime may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Production fence server did not start.\n${output()}`);
}

async function runCase({ name, port, release, catalog, discovery, editorial, legal, commerce, auth = false }) {
  const baseUrl = `http://127.0.0.1:${port}`;
  const authorityDatabasePath = path.resolve(process.cwd(), `.data/production-fence-${port}.sqlite`);
  rmSync(authorityDatabasePath, { force: true });
  let serverOutput = "";
  const server = spawn(process.execPath, [serverFile], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      COZMATEKS_PROJECT_ROOT: process.cwd(),
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      APP_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://elore-paris.com",
      PUBLIC_RELEASE_APPROVED: String(release),
      PUBLIC_CATALOG_APPROVED: String(catalog),
      PUBLIC_DISCOVERY_CONTENT_APPROVED: String(discovery),
      PUBLIC_EDITORIAL_CONTENT_APPROVED: String(editorial),
      PUBLIC_LEGAL_CONTENT_APPROVED: String(legal),
      PUBLIC_COMMERCE_ENABLED: String(commerce),
      PUBLIC_TERMS_VERSION: legal ? "production-fence-terms-v1" : "",
      PUBLIC_PRIVACY_NOTICE_VERSION: legal ? "production-fence-privacy-v1" : "",
      AUTH_PROVIDER_AUTHORIZE_URL: auth ? "https://identity.example.com/authorize" : "",
      AUTH_PROVIDER_TOKEN_URL: auth ? "https://identity.example.com/token" : "",
      AUTH_PROVIDER_CLIENT_ID: auth ? "elore-production-fence" : "",
      AUTH_PROVIDER_CLIENT_SECRET: auth ? "production-fence-client-secret" : "",
      AUTHORITY_DB_PATH: authorityDatabasePath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForServer(baseUrl, () => serverOutput);

    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const health = await healthResponse.json();
    assert.equal(health.runtimeStage, "production", `${name}: runtime stage`);
    assert.equal(health.publicReleaseApproved, release, `${name}: release flag`);
    assert.equal(health.publicCatalogApproved, catalog, `${name}: catalog flag`);
    assert.equal(health.publicDiscoveryContentApproved, discovery, `${name}: discovery flag`);
    assert.equal(health.publicEditorialContentApproved, editorial, `${name}: editorial flag`);
    assert.equal(health.publicLegalContentApproved, legal, `${name}: legal flag`);
    assert.equal(health.publicCommerceEnabled, commerce, `${name}: commerce flag`);
    assert.equal(health.externalCustomerAuthConfigured, auth, `${name}: customer auth readiness`);
    assert.equal(health.catalogAuthority.ready, false, `${name}: empty catalog authority`);
    assert.deepEqual(
      health.catalogAuthority.blockers,
      ["active_catalog_publication_missing"],
      `${name}: catalog authority blocker`,
    );
    assert.equal(
      health.publicCommerceConfigured,
      release && catalog && legal && commerce && auth,
      `${name}: configured commerce prerequisites`,
    );
    assert.equal(health.publicCommerceAvailable, false, `${name}: evidence-backed commerce readiness`);

    const protectedCatalogAuthority = await fetch(
      `${baseUrl}/api/ops/catalog/authority`,
    );
    assert.equal(
      protectedCatalogAuthority.status,
      503,
      `${name}: unconfigured production ops catalog authority must fail closed`,
    );
    assert.equal(
      health.searchIndexingEnabled,
      release && catalog && discovery && editorial && legal,
      `${name}: derived indexing readiness`,
    );

    const retiredJournal = await fetch(`${baseUrl}/journal/serum-or-moisturizer-how-to-choose-right-morning-layer`, { redirect: "manual" });
    assert.equal(retiredJournal.status, 410, `${name}: retired journal status`);
    assert.match(retiredJournal.headers.get("x-robots-tag") ?? "", /noindex/i, `${name}: retired journal noindex`);

    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    assert.equal(orderResponse.status, 503, `${name}: order fence status`);
    const orderError = await orderResponse.json();
    assert.equal(orderError.code, "commerce_disabled", `${name}: order fence code`);

    const quoteResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: orderPayload.items,
        shippingMethodId: "standard",
      }),
    });
    assert.equal(quoteResponse.status, 503, `${name}: quote fence status`);
    const quoteError = await quoteResponse.json();
    assert.equal(quoteError.code, "commerce_disabled", `${name}: quote fence code`);

    if (!(release && catalog && discovery && editorial && legal)) {
      const robots = await fetch(`${baseUrl}/robots.txt`);
      assert.match(await robots.text(), /Disallow:\s*\//i, `${name}: robots fence`);

      const homepage = await fetch(baseUrl);
      assert.match(
        homepage.headers.get("x-robots-tag") ?? "",
        /noindex/i,
        `${name}: X-Robots-Tag fence`,
      );

      const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
      assert.doesNotMatch(await sitemap.text(), /<url>/i, `${name}: sitemap fence`);
    } else {
      const robots = await fetch(`${baseUrl}/robots.txt`);
      assert.match(await robots.text(), /Allow:\s*\//i, `${name}: robots allow`);

      const homepage = await fetch(baseUrl);
      assert.equal(homepage.headers.get("x-robots-tag"), null, `${name}: X-Robots-Tag allow`);

      const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
      const sitemapBody = await sitemap.text();
      assert.match(sitemapBody, /https:\/\/elore-paris\.com\/ar\/concerns</i, `${name}: Arabic discovery sitemap entry`);
      assert.match(sitemapBody, /https:\/\/elore-paris\.com\/en\/ingredients\/vitamin-c</i, `${name}: English discovery sitemap entry`);
      assert.doesNotMatch(sitemapBody, /<loc>https:\/\/elore-paris\.com\/(?:concerns|routines|ingredients)(?:\/|<)/i, `${name}: legacy discovery sitemap entry`);
      assert.match(sitemapBody, /https:\/\/elore-paris\.com\/ar\/trust\/privacy</i, `${name}: Arabic trust sitemap entry`);
      assert.match(sitemapBody, /https:\/\/elore-paris\.com\/en\/terms</i, `${name}: English legal sitemap entry`);
      assert.doesNotMatch(sitemapBody, /<loc>https:\/\/elore-paris\.com\/(?:trust|about|contact|faq|terms)(?:\/|<)/i, `${name}: legacy trust/support sitemap entry`);
      assert.doesNotMatch(sitemapBody, /<loc>https:\/\/elore-paris\.com\/journal(?:\/|<)/i, `${name}: unapproved journal sitemap entry`);
      assert.match(sitemapBody, /https:\/\/elore-paris\.com\/ar\/journal\/morning-ritual-for-hot-weather</i, `${name}: Arabic journal sitemap entry`);
      assert.match(sitemapBody, /https:\/\/elore-paris\.com\/en\/journal\/read-an-ingredient-before-you-choose</i, `${name}: English journal sitemap entry`);
    }
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 5_000);
      server.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    rmSync(authorityDatabasePath, { force: true });
  }
}

await runCase({
  name: "all approvals disabled",
  port: 3067,
  release: false,
  catalog: false,
  discovery: false,
  editorial: false,
  legal: false,
  commerce: false,
});

await runCase({
  name: "commerce enabled without catalog approval",
  port: 3068,
  release: true,
  catalog: false,
  discovery: false,
  editorial: false,
  legal: false,
  commerce: true,
});

await runCase({
  name: "catalog approved without discovery approval",
  port: 3069,
  release: true,
  catalog: true,
  discovery: false,
  editorial: false,
  legal: false,
  commerce: true,
});

await runCase({
  name: "editorial approval withheld independently",
  port: 3071,
  release: true,
  catalog: true,
  discovery: true,
  editorial: false,
  legal: true,
  commerce: true,
});

await runCase({
  name: "commerce approvals enabled without customer auth",
  port: 3072,
  release: true,
  catalog: true,
  discovery: true,
  editorial: true,
  legal: true,
  commerce: true,
});

await runCase({
  name: "all approvals enabled",
  port: 3070,
  release: true,
  catalog: true,
  discovery: true,
  editorial: true,
  legal: true,
  commerce: true,
  auth: true,
});

console.log("Production release, catalog, commerce, customer auth, and indexing fences passed.");
