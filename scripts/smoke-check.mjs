import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const port = 3066;
const baseUrl = `http://127.0.0.1:${port}`;
const opsAccessCode = "smoke-test-ops-access-code";
const serverFile = path.resolve(process.cwd(), ".next/standalone/server.js");
const journalSlugs = [
  "morning-ritual-for-hot-weather",
  "uneven-tone-without-overcomplication",
  "makeup-longevity-without-heavy-layers",
  "post-wash-hair-rhythm-in-humidity",
  "after-shower-bodycare-by-texture",
  "read-an-ingredient-before-you-choose",
];
const legacyJournalRedirects = {
  "practical-morning-routine-glow-sunscreen-fast-layering": "/journal/morning-ritual-for-hot-weather",
  "pigmentation-routine-feels-random-what-to-fix-first": "/journal/uneven-tone-without-overcomplication",
  "how-to-choose-makeup-longwear-without-heavy-layering": "/journal/makeup-longevity-without-heavy-layers",
  "calm-hair-after-washing-humid-days-without-heavy-layers": "/journal/post-wash-hair-rhythm-in-humidity",
  "after-shower-body-routine-that-is-easy-to-keep": "/journal/after-shower-bodycare-by-texture",
  "niacinamide-explained-plain-language": "/ingredients/niacinamide",
};

function readLegacyJournalSlugs() {
  const source = readFileSync(path.resolve(process.cwd(), "src/lib/journal-routing.ts"), "utf8");
  const block = source.match(/export const legacyJournalSlugs = \[([\s\S]*?)\] as const;/)?.[1];
  assert.ok(block, "Legacy journal registry is missing");
  return Array.from(block.matchAll(/"([a-z0-9-]+)"/g), (match) => match[1]);
}

function readLegacyJournalSourceSlugs() {
  const source = readFileSync(path.resolve(process.cwd(), "src/lib/site-content.ts"), "utf8");
  const start = source.indexOf("export const journalArticles");
  const end = source.indexOf("export type TrustPolicyRecord", start);
  assert.ok(start >= 0 && end > start, "Legacy journal source block is missing");
  const block = source.slice(start, end);
  return Array.from(block.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g), (match) => match[1]);
}

if (!existsSync(serverFile)) {
  throw new Error("Standalone build is missing. Run `npm run build` first.");
}

const server = spawn(process.execPath, [serverFile], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    COZMATEKS_PROJECT_ROOT: process.cwd(),
    HOSTNAME: "127.0.0.1",
    PORT: String(port),
    APP_ENV: "local",
    PUBLIC_COMMERCE_ENABLED: "false",
    OPS_ACCESS_CODE: opsAccessCode,
    OPS_ACCESS_SIGNING_SECRET: "smoke-test-signing-secret-with-sufficient-entropy",
    ENFORCE_OPS_ACCESS: "true",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready.\n${serverOutput}`);
}

async function expectStatus(pathname, expectedStatus, init) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    ...init,
  });
  assert.equal(
    response.status,
    expectedStatus,
    `${pathname} returned ${response.status}; expected ${expectedStatus}`,
  );
  return response;
}

async function expectOrderApiError(expectedStatus, expectedCode, init) {
  const response = await expectStatus("/api/orders", expectedStatus, init);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  const payload = await response.json();
  assert.equal(payload.code, expectedCode);
  assert.equal(typeof payload.error, "string");
  assert.ok(payload.error.length > 0);
}

function buildOrderRequestPayload(overrides = {}) {
  return {
    items: [{ productSlug: "test-product", sku: "TEST-SKU", quantity: 1 }],
    checkout: {
      fullName: "Smoke Test Customer",
      phone: "0501234567",
      email: "smoke@example.com",
      city: "Riyadh",
      district: "Olaya",
      addressLine: "123 Smoke Test Street",
      notes: "",
      shippingMethodId: "standard",
      paymentMethodId: "cash_on_delivery",
      acceptPolicies: true,
      acceptUpdates: false,
    },
    ...overrides,
  };
}

async function run() {
  await waitForServer();

  const health = await expectStatus("/api/health", 200);
  const healthBody = await health.json();
  assert.equal(healthBody.status, "ok");
  assert.equal(healthBody.service, "elore-paris-storefront");
  assert.equal(healthBody.publicReleaseApproved, false);
  assert.equal(healthBody.publicCatalogApproved, false);
  assert.equal(healthBody.publicDiscoveryContentApproved, false);
  assert.equal(healthBody.publicEditorialContentApproved, false);
  assert.equal(healthBody.publicLegalContentApproved, false);
  assert.equal(healthBody.publicCommerceEnabled, false);
  assert.equal(healthBody.externalCustomerAuthConfigured, false);
  assert.equal(healthBody.publicCommerceAvailable, false);

  await expectOrderApiError(415, "unsupported_media_type", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  });
  await expectOrderApiError(400, "invalid_json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid-json",
  });
  await expectOrderApiError(413, "payload_too_large", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oversized: "x".repeat(33 * 1024) }),
  });
  await expectOrderApiError(400, "invalid_order_payload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildOrderRequestPayload({ items: [] })),
  });
  await expectOrderApiError(400, "invalid_order_payload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildOrderRequestPayload({
        items: Array.from({ length: 51 }, (_, index) => ({
          productSlug: `test-product-${index}`,
          sku: `TEST-SKU-${index}`,
          quantity: 1,
        })),
      }),
    ),
  });
  await expectOrderApiError(400, "invalid_order_payload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildOrderRequestPayload({
        checkout: {
          ...buildOrderRequestPayload().checkout,
          acceptPolicies: "true",
        },
      }),
    ),
  });
  await expectOrderApiError(400, "invalid_order_payload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildOrderRequestPayload({
        items: [{ productSlug: "test-product", sku: "TEST-SKU", quantity: 1.5 }],
      }),
    ),
  });
  await expectOrderApiError(400, "invalid_order_payload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildOrderRequestPayload({
        checkout: {
          ...buildOrderRequestPayload().checkout,
          notes: "x".repeat(1_001),
        },
      }),
    ),
  });

  const discoveryClusters = {
    concerns: ["pigmentation", "makeup-longwear"],
    routines: [
      "morning-routine-oily-skin",
      "occasion-base-routine",
      "humidity-proof-hair-routine",
      "after-shower-body-routine",
    ],
    ingredients: ["niacinamide", "vitamin-c", "hyaluronic-acid", "panthenol", "shea-butter"],
  };
  const localizedDiscoveryRoutes = Object.entries(discoveryClusters).flatMap(
    ([cluster, slugs]) => ["ar", "en"].flatMap((locale) => [
      `/${locale}/${cluster}`,
      ...slugs.map((slug) => `/${locale}/${cluster}/${slug}`),
    ]),
  );
  const legacyDiscoveryRoutes = Object.entries(discoveryClusters).flatMap(
    ([cluster, slugs]) => [`/${cluster}`, ...slugs.map((slug) => `/${cluster}/${slug}`)],
  );
  const trustSupportPaths = [
    "/trust", "/trust/verification", "/trust/privacy", "/trust/shipping",
    "/trust/returns", "/trust/authenticity", "/about", "/contact", "/faq", "/terms",
  ];
  const localizedTrustSupportRoutes = ["ar", "en"].flatMap((locale) =>
    trustSupportPaths.map((pathname) => `/${locale}${pathname}`),
  );
  const localizedJournalRoutes = ["ar", "en"].flatMap((locale) => [
    `/${locale}/journal`,
    ...journalSlugs.map((slug) => `/${locale}/journal/${slug}`),
  ]);

  const storefrontRoutes = [
    "/ar",
    "/en",
    "/ar/shop",
    "/en/shop",
    "/ar/shop/skincare",
    "/en/shop/skincare",
    "/ar/shop/makeup",
    "/en/shop/makeup",
    "/ar/shop/haircare",
    "/en/shop/haircare",
    "/ar/shop/bodycare",
    "/en/shop/bodycare",
    "/ar/shop/tools",
    "/en/shop/tools",
    "/ar/shop/beauty-sets",
    "/en/shop/beauty-sets",
    ...localizedDiscoveryRoutes,
    ...localizedTrustSupportRoutes,
    ...localizedJournalRoutes,
    "/ar/search",
    "/en/search",
    "/ar/search?q=vitamin%20c",
    "/en/search?q=niacinamide",
    "/ar/cart",
    "/en/cart",
    "/ar/checkout",
    "/en/checkout",
    "/ar/track-order",
    "/en/track-order",
    "/ar/account/orders",
    "/en/account/orders",
    "/robots.txt",
    "/sitemap.xml",
  ];

  const rootRedirect = await expectStatus("/", 308);
  assert.equal(
    rootRedirect.headers.get("location"),
    "/ar",
    "Root URL must redirect deterministically to the Arabic market route",
  );

  const shopRedirect = await expectStatus("/shop?source=smoke", 308);
  assert.equal(shopRedirect.headers.get("location"), "/ar/shop?source=smoke");

  for (const commercePath of ["/cart", "/checkout"]) {
    const commerceRedirect = await expectStatus(`${commercePath}?source=smoke`, 308);
    assert.equal(
      commerceRedirect.headers.get("location"),
      `/ar${commercePath}?source=smoke`,
      `Legacy commerce route ${commercePath} must preserve its query in one redirect`,
    );
  }

  const trackingRedirect = await expectStatus(
    "/track-order?order=ELR-SMOKE&source=smoke&source=repeat",
    308,
  );

  const accountOrdersRedirect = await expectStatus(
    "/account/orders?source=smoke&source=repeat",
    308,
  );
  assert.equal(
    accountOrdersRedirect.headers.get("location"),
    "/ar/account/orders?source=smoke&source=repeat",
    "Legacy account orders route must preserve every query value in one redirect",
  );

  const invalidEnglishHandoff = await expectStatus(
    "/account/access?locale=en&token=invalid",
    307,
  );
  assert.equal(
    new URL(invalidEnglishHandoff.headers.get("location"), baseUrl).pathname,
    "/en/track-order",
    "Invalid English account handoff must fail closed to localized tracking",
  );
  const invalidLocaleHandoff = await expectStatus(
    "/account/access?locale=fr&token=invalid",
    307,
  );
  assert.equal(
    new URL(invalidLocaleHandoff.headers.get("location"), baseUrl).pathname,
    "/ar/track-order",
    "Unsupported account handoff locale must fail closed to Arabic tracking",
  );
  assert.equal(
    trackingRedirect.headers.get("location"),
    "/ar/track-order?order=ELR-SMOKE&source=smoke&source=repeat",
    "Legacy tracking route must preserve every query value in one redirect",
  );

  for (const slug of ["skincare", "makeup", "haircare", "bodycare", "tools", "beauty-sets"]) {
    const collectionRedirect = await expectStatus(`/shop/${slug}?source=smoke`, 308);
    assert.equal(
      collectionRedirect.headers.get("location"),
      `/ar/shop/${slug}?source=smoke`,
      `Legacy ${slug} collection must redirect once and preserve its query`,
    );
  }

  for (const legacyPath of legacyDiscoveryRoutes) {
    const discoveryRedirect = await expectStatus(`${legacyPath}?source=smoke`, 308);
    assert.equal(
      discoveryRedirect.headers.get("location"),
      `/ar${legacyPath}?source=smoke`,
      `Legacy discovery route ${legacyPath} must preserve its query in one redirect`,
    );
  }

  for (const legacyPath of trustSupportPaths) {
    const redirect = await expectStatus(`${legacyPath}?source=smoke`, 308);
    assert.equal(
      redirect.headers.get("location"),
      `/ar${legacyPath}?source=smoke`,
      `Legacy trust/support route ${legacyPath} must preserve its query in one redirect`,
    );
  }

  const journalIndexRedirect = await expectStatus("/journal?source=smoke", 308);
  assert.equal(journalIndexRedirect.headers.get("location"), "/ar/journal?source=smoke");

  const searchRedirect = await expectStatus("/search?q=vitamin%20c&source=smoke", 308);
  assert.equal(searchRedirect.headers.get("location"), "/ar/search?q=vitamin+c&source=smoke");

  for (const [legacySlug, destination] of Object.entries(legacyJournalRedirects)) {
    const redirect = await expectStatus(`/journal/${legacySlug}?source=smoke`, 308);
    assert.equal(redirect.headers.get("location"), `/ar${destination}?source=smoke`);
  }

  const legacyJournalSlugs = readLegacyJournalSlugs();
  assert.deepEqual(
    [...legacyJournalSlugs].sort(),
    [...readLegacyJournalSourceSlugs()].sort(),
    "Lightweight journal routing registry drifted from the quarantined source corpus",
  );
  assert.equal(legacyJournalSlugs.length, 120, "Legacy journal registry count changed unexpectedly");
  const retiredJournalSlugs = legacyJournalSlugs.filter((slug) => !(slug in legacyJournalRedirects));
  assert.equal(retiredJournalSlugs.length, 114, "Retired journal registry must contain 114 entries");
  for (const slug of retiredJournalSlugs) {
    const retired = await expectStatus(`/journal/${slug}`, 410);
    assert.match(retired.headers.get("x-robots-tag") ?? "", /noindex/i);
  }

  await expectStatus("/ar/shop/not-a-category", 404);
  await expectStatus("/ar/concerns/not-a-route", 404);
  await expectStatus("/en/routines/not-a-route", 404);
  await expectStatus("/ar/ingredients/not-a-route", 404);
  await expectStatus("/en/trust/not-a-route", 404);
  await expectStatus("/journal/not-a-known-legacy-article", 404);
  await expectStatus("/ar/journal/not-a-route", 404);
  await expectStatus("/en/journal/not-a-route", 404);
  await expectStatus("/ar/search/not-a-route", 404);
  await expectStatus("/en/search/not-a-route", 404);

  for (const pathname of storefrontRoutes) {
    const response = await expectStatus(pathname, 200);
    if (pathname.endsWith(".txt") || pathname.endsWith(".xml")) continue;
    const body = await response.text();
    assert.ok(body.length > 500, `${pathname} returned unexpectedly short HTML`);
    assert.ok(!body.includes("ops_nav_dashboard"), `${pathname} exposes admin navigation`);
    assert.ok(!body.includes("Admin Control Center"), `${pathname} exposes admin content`);
    if (localizedDiscoveryRoutes.includes(pathname)) {
      assert.ok(!body.includes('href="/products/'), `${pathname} exposes an unapproved product link`);
      assert.ok(!body.includes('"@type":"Product"'), `${pathname} exposes Product schema`);
      assert.ok(!body.includes("Radiant Dew"), `${pathname} exposes prototype product content`);
      assert.ok(!body.includes("Velvet Base"), `${pathname} exposes prototype product content`);
    }
    if (localizedJournalRoutes.includes(pathname)) {
      assert.ok(!body.includes('href="/products/'), `${pathname} exposes an unapproved product link`);
      assert.ok(!body.includes('"@type":"Product"'), `${pathname} exposes Product schema`);
      assert.ok(!body.includes('"@type":"Offer"'), `${pathname} exposes Offer schema`);
      assert.ok(!body.includes('"@type":"FAQPage"'), `${pathname} exposes FAQPage schema`);
      assert.ok(!body.includes("Radiant Dew"), `${pathname} exposes a fixture product`);
      assert.ok(!body.includes("Velvet Base"), `${pathname} exposes a fixture product`);
    }
    if (pathname.startsWith("/ar/search") || pathname.startsWith("/en/search")) {
      assert.ok(!body.includes('href="/products/'), `${pathname} exposes an unapproved product link`);
      assert.ok(!body.includes("Radiant Dew"), `${pathname} exposes a fixture product`);
      assert.ok(!body.includes("Velvet Base"), `${pathname} exposes a fixture product`);
    }
  }

  const xssPayload = encodeURIComponent('</script><script>window.__search_xss=1337</script>');
  const xssResponse = await expectStatus(`/ar/search?q=${xssPayload}`, 200);
  const xssBody = await xssResponse.text();
  assert.ok(!xssBody.includes("<script>window.__search_xss=1337</script>"), "Search query escaped into executable markup");

  const quarantinedProductRedirect = await expectStatus(
    "/products/radiant-dew-serum",
    308,
  );
  assert.equal(quarantinedProductRedirect.headers.get("location"), "/ar/shop");

  await expectStatus(
    "/api/orders/CZM-SMOKE-INVALID?phoneLastFour=12",
    400,
  );

  const trackingThrottlePath =
    "/api/orders/CZM-SMOKE-THROTTLE?phoneLastFour=1234";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await expectStatus(trackingThrottlePath, 404);
  }
  const throttledTrackingResponse = await expectStatus(
    trackingThrottlePath,
    429,
  );
  assert.ok(
    Number(throttledTrackingResponse.headers.get("retry-after")) > 0,
    "Tracking throttle did not return a Retry-After header",
  );

  const protectedResponse = await expectStatus("/ops", 307);
  assert.ok(
    protectedResponse.headers.get("location")?.includes("/ops-access"),
    "Protected dashboard did not redirect to the access gate",
  );

  const accessPage = await expectStatus("/ops-access", 200);
  const accessBody = await accessPage.text();
  assert.ok(accessBody.length > 500, "Ops access page returned unexpectedly short HTML");

  const loginResponse = await expectStatus("/api/ops-access/login", 200, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({ accessCode: opsAccessCode, nextPath: "/ops" }),
  });
  const loginBody = await loginResponse.json();
  assert.equal(loginBody.redirectTo, "/ops");
  const sessionCookie = loginResponse.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(sessionCookie, "Ops login did not issue a session cookie");

  const adminRoutes = [
    "/ops",
    "/ops/orders",
    "/ops/catalog",
    "/ops/fulfillment",
    "/ops/release",
    "/ops/content",
    "/ops/notifications",
    "/ops/audit",
  ];

  for (const pathname of adminRoutes) {
    const response = await expectStatus(pathname, 200, {
      headers: { Cookie: sessionCookie },
    });
    const body = await response.text();
    assert.ok(body.length > 500, `${pathname} returned unexpectedly short admin HTML`);
    assert.ok(body.includes("ops_nav_dashboard"), `${pathname} did not render admin navigation`);
  }

  const adminApiRoutes = [
    "/api/ops/orders",
    "/api/ops/session",
    "/api/ops/release",
  ];

  for (const pathname of adminApiRoutes) {
    const response = await expectStatus(pathname, 200, {
      headers: { Cookie: sessionCookie },
    });
    assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  }

  const ordersResponse = await expectStatus("/api/ops/orders", 200, {
    headers: { Cookie: sessionCookie },
  });
  const { orders } = await ordersResponse.json();
  if (Array.isArray(orders) && orders.length > 0) {
    const [sampleOrder] = orders;
    const phoneLastFour = String(sampleOrder.customer.phone).replace(/\D/g, "").slice(-4);
    const trackedOrderResponse = await expectStatus(
      `/api/orders/${encodeURIComponent(sampleOrder.orderNumber)}?phoneLastFour=${phoneLastFour}`,
      200,
    );
    const trackingCookies = trackedOrderResponse.headers.get("set-cookie") ?? "";
    assert.doesNotMatch(trackingCookies, /cozmateks-order-access=/);
    assert.doesNotMatch(trackingCookies, /cozmateks-customer-access=/);

    const trackedOrderBody = await trackedOrderResponse.json();
    assert.equal(trackedOrderBody.accessMode, "tracking");
    assert.equal(trackedOrderBody.order.customer.phone, "");
    assert.equal(trackedOrderBody.order.customer.email, "");
    assert.equal(trackedOrderBody.order.providerBindings.payment.paymentUrl, null);
    assert.equal(trackedOrderBody.order.providerBindings.payment.referenceId, null);
    assert.deepEqual(trackedOrderBody.notifications, []);
    assert.equal(
      trackedOrderBody.customerAccessHandoffPath,
      undefined,
      "Knowledge-based tracking exposed a customer account handoff",
    );
  }

  console.log("Smoke checks passed: storefront and protected operations dashboard are healthy.");
}

try {
  await run();
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
  }
}
