import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { once } from "node:events";
import path from "node:path";
import process from "node:process";
import { product, validPayload } from "./fixtures/qa-catalog-fixture.mjs";

const root = process.cwd();
const serverFile = path.resolve(root, ".next/standalone/server.js");
const databasePath = path.resolve(root, ".data/promotion-authority-check.sqlite");
const mediaRoot = path.resolve(root, ".data/promotion-authority-check-media");
const baseUrl = "http://127.0.0.1:3075";

if (!existsSync(serverFile)) throw new Error("Standalone build is missing. Run npm run build first.");
rmSync(databasePath, { force: true });
rmSync(mediaRoot, { recursive: true, force: true });

let output = "";
const server = spawn(process.execPath, [serverFile], {
  cwd: root,
  env: {
    ...process.env,
    COZMATEKS_PROJECT_ROOT: root,
    HOSTNAME: "127.0.0.1",
    PORT: "3075",
    APP_ENV: "development",
    AUTHORITY_DB_PATH: databasePath,
    PROMOTION_MEDIA_ROOT: mediaRoot,
    OPS_ACCESS_CODE: "promotion-authority-test-access",
    OPS_ACCESS_SIGNING_SECRET: "promotion-authority-test-signing-secret",
    PUBLIC_TERMS_VERSION: "promotion-terms-v1",
    PUBLIC_PRIVACY_NOTICE_VERSION: "promotion-privacy-v1",
    PUBLIC_CATALOG_APPROVED: "true",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => { output += chunk.toString(); });
server.stderr.on("data", (chunk) => { output += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Promotion authority server did not start.\n${output}`);
}

let sessionCookie = "";
async function request(method, route, body, headers = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      Cookie: sessionCookie,
      ...headers,
      ...(body === undefined || body instanceof FormData
        ? {}
        : { "Content-Type": "application/json", Origin: baseUrl }),
      ...(body instanceof FormData ? { Origin: baseUrl } : {}),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  const payload = response.headers.get("content-type")?.startsWith("application/json")
    ? await response.json()
    : await response.arrayBuffer();
  return { response, payload };
}

try {
  await waitForServer();
  const login = await fetch(`${baseUrl}/api/ops-access/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ accessCode: "promotion-authority-test-access", nextPath: "/ops/promotions" }),
  });
  assert.equal(login.status, 200);
  sessionCookie = (login.headers.get("set-cookie") ?? "").split(";", 1)[0];

  const imported = await request("POST", "/api/ops/catalog/authority", validPayload);
  assert.equal(imported.response.status, 201);
  const published = await request("PATCH", "/api/ops/catalog/authority", {
    action: "publish",
    importId: imported.payload.importId,
  });
  assert.equal(published.response.status, 200);

  const imagePath = path.resolve(root, "public/elore-assets/hero-ritual-poise-mobile-concept-1003x1568.avif");
  const form = new FormData();
  form.set("file", new File([readFileSync(imagePath)], "campaign.avif", { type: "image/avif" }));
  form.set("altAr", "صورة اختبار لحملة محكومة");
  form.set("altEn", "Governed campaign test image");
  form.set("rightsEvidenceRef", "evidence://promotion-authority-test");
  const uploaded = await request("POST", "/api/ops/media", form);
  assert.equal(uploaded.response.status, 201);
  assert.equal(uploaded.payload.asset.status, "pending");
  assert.equal((await fetch(`${baseUrl}${uploaded.payload.asset.publicUrl}`)).status, 404);
  const approved = await request("PATCH", "/api/ops/media", {
    action: "approve",
    assetId: uploaded.payload.asset.id,
  });
  assert.equal(approved.response.status, 200);
  const served = await fetch(`${baseUrl}${uploaded.payload.asset.publicUrl}`);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/webp");

  const promotionInput = {
    mode: "automatic",
    code: null,
    name: "Promotion authority regression",
    titleAr: "عرض محكوم",
    titleEn: "Governed offer",
    descriptionAr: "اختبار ربط العرض",
    descriptionEn: "Promotion integration regression",
    state: "active",
    discountType: "percentage",
    percentageBps: 1000,
    fixedHalalas: null,
    maxDiscountHalalas: 5000,
    minSubtotalHalalas: 0,
    usageLimitTotal: 10,
    usageLimitPerCustomer: 1,
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2027-01-01T00:00:00.000Z",
    priority: 10,
    appliesToAll: true,
    targets: [],
    mediaAssetId: uploaded.payload.asset.id,
    publicBadge: "REGRESSION",
    publicPath: "/ar/shop",
  };
  const created = await request("PUT", "/api/ops/promotions", promotionInput);
  assert.equal(created.response.status, 201);
  const stalePayload = { ...promotionInput, id: created.payload.promotion.id, expectedVersion: 1, state: "paused" };
  assert.equal((await request("PUT", "/api/ops/promotions", stalePayload)).response.status, 200);
  assert.equal((await request("PUT", "/api/ops/promotions", stalePayload)).response.status, 409);
  const reactivated = await request("PUT", "/api/ops/promotions", {
    ...promotionInput,
    id: created.payload.promotion.id,
    expectedVersion: 2,
  });
  assert.equal(reactivated.response.status, 200);

  const quote = await request("POST", "/api/checkout/quote", {
    items: [{ productSlug: product.slug, sku: product.variants[0].sku, quantity: 1 }],
    shippingMethodId: "standard",
    locale: "en",
  });
  assert.equal(quote.response.status, 201);
  const checkoutCookie = (quote.response.headers.get("set-cookie") ?? "").split(";", 1)[0];
  const expectedDiscount = Math.min(Math.floor(product.variants[0].grossHalalas * 0.1), 5000);
  assert.equal(quote.payload.quote.discountGrossHalalas, expectedDiscount);
  assert.equal(
    quote.payload.quote.totalGrossHalalas,
    quote.payload.quote.subtotalGrossHalalas - expectedDiscount + quote.payload.quote.shipping.grossHalalas,
  );

  const orderBody = {
    quoteId: quote.payload.quote.quoteId,
    checkout: {
      fullName: "Promotion Regression Customer",
      phone: "966512345678",
      email: "promotion-regression@example.com",
      city: "Riyadh",
      district: "Olaya",
      addressLine: "Promotion regression address 123",
      notes: "",
      shippingMethodId: "standard",
      paymentMethodId: "cash_on_delivery",
      acceptPolicies: true,
      acceptUpdates: false,
      termsVersion: quote.payload.quote.policySet.termsVersion,
      privacyNoticeVersion: quote.payload.quote.policySet.privacyNoticeVersion,
    },
  };
  const orderHeaders = { Cookie: checkoutCookie, "Idempotency-Key": "promotion-authority-order-0001" };
  const order = await request("POST", "/api/orders", orderBody, orderHeaders);
  assert.equal(order.response.status, 201);
  assert.equal(order.payload.order.pricingSnapshot.promotion.promotionId, created.payload.promotion.id);
  const replay = await request("POST", "/api/orders", orderBody, orderHeaders);
  assert.equal(replay.response.status, 200);
  assert.equal(replay.response.headers.get("idempotency-replayed"), "true");
  const snapshot = await request("GET", "/api/ops/promotions");
  assert.equal(snapshot.payload.promotions.find((item) => item.id === created.payload.promotion.id).redemptionCount, 1);

  console.log("Promotion, coupon-ready pricing, media approval, checkout redemption, usage, and idempotency checks passed.");
} finally {
  if (server.exitCode === null) {
    server.kill();
    await once(server, "exit");
  }
  rmSync(databasePath, { force: true });
  rmSync(`${databasePath}-wal`, { force: true });
  rmSync(`${databasePath}-shm`, { force: true });
  rmSync(mediaRoot, { recursive: true, force: true });
}
