import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const serverFile = path.resolve(root, ".next/standalone/server.js");
const databasePath = path.resolve(root, ".data/catalog-authority-check.sqlite");
const legacyOrderPath = path.resolve(root, ".data/catalog-authority-check-no-legacy.json");
const baseUrl = "http://127.0.0.1:3073";

function createTestSignedToken(payload, secret) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

if (!existsSync(serverFile)) {
  throw new Error("Standalone build is missing. Run `npm run build` first.");
}

const decidedAt = "2026-07-15T10:00:00.000Z";
const product = {
  slug: "qa-authority-product",
  collection: "skincare",
  status: "approved",
  brand: "QA AUTHORITY ONLY",
  nameAr: "منتج تحقق داخلي",
  nameEn: "Internal authority verification product",
  descriptionAr: "سجل مؤقت لاختبار سلطة الكتالوج ولا ينشر خارج قاعدة الاختبار.",
  descriptionEn: "Temporary record used only by the isolated catalog authority test.",
  compliance: {
    sfdaNotificationId: "QA-SFDA-001",
    ecosmaProductReference: "QA-ECOSMA-001",
    notificationStatus: "active",
    safetyStandardVersion: "SFDA.CO/GSO 1943:2024",
    claimsStandardVersion: "SFDA.CO/GSO 2528:2024",
    manufacturerName: "QA Manufacturer",
    manufacturerAddress: "QA manufacturing address",
    manufacturerCountry: "France",
    saudiImporterName: "QA Saudi Importer",
    saudiImporterAddress: "QA importer address",
    saudiImporterLicense: "QA-LICENSE-001",
    productFunctionAr: "ترطيب تجميلي للاختبار الداخلي فقط",
    productFunctionEn: "Cosmetic moisturising test record only",
    fullInci: "Aqua, Glycerin",
    storageAr: "يحفظ في مكان جاف",
    storageEn: "Store in a dry place",
    directionsAr: "يستخدم وفق الملصق",
    directionsEn: "Use according to the label",
    warningsAr: ["للاستخدام الخارجي فقط"],
    warningsEn: ["For external use only"],
    countryOfOrigin: "France",
    expiryMode: "pao",
    shelfLifeMonths: null,
    paoMonths: 12,
    internalLabelArtworkRef: "evidence://qa/internal-label",
    externalLabelArtworkRef: "evidence://qa/external-label",
    publicImageRightsEvidence: "evidence://qa/image-rights",
  },
  returnProfile: {
    returnWindowDays: 7,
    hygieneSealRequired: true,
    openedReturnEligible: false,
    healthResaleExceptionApplies: true,
    exceptionReasonAr: "سجل اختبار لختم النظافة",
    exceptionReasonEn: "Test hygiene-seal record",
    approvedPolicyVersion: "qa-return-v1",
  },
  media: [{
    url: "/elore-assets/ritual-still-life.webp",
    altAr: "صورة تحقق داخلية",
    altEn: "Internal verification image",
    rightsEvidenceRef: "evidence://qa/image-rights",
  }],
  claims: [],
  variants: [
    {
      sku: "QA-AUTH-001",
      barcode: "6287000099993",
      status: "approved",
      labelAr: "الحجم التجريبي",
      labelEn: "Verification size",
      size: "30 ml",
      grossHalalas: 11500,
      compareAtHalalas: null,
      stockOnHand: 3,
      safetyStock: 1,
      codEligible: true,
    },
    {
      sku: "QA-RACE-001",
      barcode: "6287000099986",
      status: "approved",
      labelAr: "اختبار آخر وحدة",
      labelEn: "Last-unit race verification",
      size: "10 ml",
      grossHalalas: 5000,
      compareAtHalalas: null,
      stockOnHand: 1,
      safetyStock: 0,
      codEligible: true,
    },
    {
      sku: "QA-PAY-001",
      barcode: "6287000099979",
      status: "approved",
      labelAr: "اختبار الدفع",
      labelEn: "Payment verification",
      size: "15 ml",
      grossHalalas: 7000,
      compareAtHalalas: null,
      stockOnHand: 1,
      safetyStock: 0,
      codEligible: false,
    },
    {
      sku: "QA-EXP-001",
      barcode: "6287000099962",
      status: "approved",
      labelAr: "اختبار انتهاء الحجز",
      labelEn: "Reservation expiry verification",
      size: "20 ml",
      grossHalalas: 8000,
      compareAtHalalas: null,
      stockOnHand: 1,
      safetyStock: 0,
      codEligible: false,
    },
  ],
};

const approval = (subjectType, subjectId, approvalType) => ({
  subjectType,
  subjectId,
  approvalType,
  status: "approved",
  evidenceRef: `evidence://qa/${subjectType}/${subjectId}/${approvalType}`,
  approvedBy: "qa-catalog-auditor",
  decidedAt,
});

const validPayload = {
  sourceRef: "isolated://catalog-authority-check",
  generatedAt: decidedAt,
  currency: "SAR",
  taxProfile: {
    rateBps: 1500,
    pricesIncludeTax: true,
    evidenceRef: "https://zatca.gov.sa/en/HelpCenter/guidelines/Documents/Guideline-For-Retail-Sector-under-VAT-Provisions.pdf",
    approvedBy: "qa-tax-auditor",
    approvedAt: decidedAt,
  },
  inventoryLocation: { code: "QA-RUH-01", name: "Isolated QA location" },
  shippingMethods: [{
    id: "standard",
    labelAr: "شحن قياسي للاختبار",
    labelEn: "QA standard shipping",
    grossHalalas: 2300,
    enabled: true,
    evidenceRef: "evidence://qa/shipping/standard",
    estimatedDeliveryAr: "مدة اختبار فقط",
    estimatedDeliveryEn: "Verification timeline only",
  }],
  products: [product],
  approvals: [
    approval("catalog", "catalog", "publication"),
    approval("catalog", "catalog", "price"),
    approval("product", product.slug, "data"),
    approval("product", product.slug, "media"),
    approval("product", product.slug, "claims"),
    approval("product", product.slug, "compliance"),
    approval("variant", product.variants[0].sku, "price"),
    approval("variant", product.variants[1].sku, "price"),
    approval("variant", product.variants[2].sku, "price"),
    approval("variant", product.variants[3].sku, "price"),
  ],
};

async function waitForServer(output) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Catalog authority server did not start.\n${output()}`);
}

let sessionCookie = "";

async function api(method, body) {
  const response = await fetch(`${baseUrl}/api/ops/catalog/authority`, {
    method,
    headers: {
      Cookie: sessionCookie,
      ...(body === undefined
        ? {}
        : { "Content-Type": "application/json", Origin: baseUrl }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

rmSync(databasePath, { force: true });
rmSync(legacyOrderPath, { force: true });
const paymentRequests = [];
const paymentMock = createServer((request, response) => {
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    if (request.method !== "POST" || request.url !== "/payments/links") {
      response.writeHead(404).end();
      return;
    }
    const payload = JSON.parse(body);
    paymentRequests.push({
      orderNumber: payload.orderNumber,
      idempotencyKey: request.headers["idempotency-key"],
      returnUrl: payload.returnUrl,
      locale: payload.metadata?.locale,
    });
    const origin = `http://127.0.0.1:${paymentMock.address().port}`;
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      paymentReferenceId: `PAY-${payload.orderNumber}`,
      paymentUrl: `${origin}/pay/${payload.orderNumber}`,
    }));
  });
});
await new Promise((resolve) => paymentMock.listen(0, "127.0.0.1", resolve));
const paymentBaseUrl = `http://127.0.0.1:${paymentMock.address().port}`;
let serverOutput = "";
const server = spawn(process.execPath, [serverFile], {
  cwd: root,
  env: {
    ...process.env,
    COZMATEKS_PROJECT_ROOT: root,
    HOSTNAME: "127.0.0.1",
    PORT: "3073",
    APP_ENV: "development",
    AUTHORITY_DB_PATH: databasePath,
    ORDER_AUTHORITY_FILE: legacyOrderPath,
    OPS_ACCESS_CODE: "catalog-authority-test-access",
    OPS_ACCESS_SIGNING_SECRET: "catalog-authority-test-signing-secret",
    PUBLIC_TERMS_VERSION: "qa-terms-v1",
    PUBLIC_PRIVACY_NOTICE_VERSION: "qa-privacy-v1",
    PUBLIC_CATALOG_APPROVED: "true",
    PAYMENT_PROVIDER_LABEL: "QA payment provider",
    PAYMENT_PROVIDER_CALLBACK_SECRET: "qa-payment-callback-secret",
    PAYMENT_PROVIDER_BASE_URL: paymentBaseUrl,
    PAYMENT_PROVIDER_REQUEST_PATH: "/payments/links",
    PAYMENT_PROVIDER_API_KEY: "qa-payment-api-key",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

try {
  await waitForServer(() => serverOutput);

  const loginResponse = await fetch(`${baseUrl}/api/ops-access/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({
      accessCode: "catalog-authority-test-access",
      nextPath: "/ops/catalog",
    }),
  });
  assert.equal(loginResponse.status, 200);
  sessionCookie = (loginResponse.headers.get("set-cookie") ?? "").split(";", 1)[0];
  assert.match(sessionCookie, /^cozmateks-ops-session=/);

  const empty = await api("GET");
  assert.equal(empty.response.status, 200);
  assert.equal(empty.body.readiness.ready, false);
  assert.deepEqual(empty.body.readiness.blockers, ["active_catalog_publication_missing"]);

  const untrustedMutation = await fetch(`${baseUrl}/api/ops/catalog/authority`, {
    method: "POST",
    headers: {
      Cookie: sessionCookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validPayload),
  });
  assert.equal(untrustedMutation.status, 403);
  assert.equal((await untrustedMutation.json()).code, "untrusted_mutation_request");

  const invalid = await api("POST", {
    ...validPayload,
    products: [product, product],
  });
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.code, "catalog_import_invalid");
  assert.match(invalid.body.issues.join("\n"), /Duplicate product slug/i);

  const imported = await api("POST", validPayload);
  assert.equal(imported.response.status, 201);
  assert.equal(imported.body.readiness.ready, true);
  assert.equal(imported.body.readiness.productCount, 1);
  assert.equal(imported.body.readiness.variantCount, 4);

  const duplicate = await api("POST", validPayload);
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.body.code, "catalog_import_duplicate");

  const beforePublish = await api("GET");
  assert.equal(beforePublish.body.readiness.ready, false);
  assert.equal(beforePublish.body.imports.length, 1);
  assert.equal(beforePublish.body.imports[0].readiness.ready, true);

  const published = await api("PATCH", {
    action: "publish",
    importId: imported.body.importId,
  });
  assert.equal(published.response.status, 200);
  assert.equal(published.body.readiness.ready, true);

  const active = await api("GET");
  assert.equal(active.body.readiness.ready, true);
  assert.equal(active.body.readiness.importId, imported.body.importId);
  assert.equal(active.body.imports[0].status, "active");

  const publicCatalogResponse = await fetch(`${baseUrl}/api/catalog?locale=ar`);
  assert.equal(publicCatalogResponse.status, 200);
  assert.match(publicCatalogResponse.headers.get("cache-control") ?? "", /no-store/i);
  const publicCatalog = await publicCatalogResponse.json();
  assert.equal(publicCatalog.available, true);
  assert.equal(publicCatalog.locale, "ar");
  assert.equal(publicCatalog.products.length, 1);
  assert.equal(publicCatalog.products[0].name, product.nameAr);
  assert.equal(publicCatalog.products[0].variants.length, 4);
  const serializedPublicCatalog = JSON.stringify(publicCatalog);
  for (const forbiddenKey of [
    "catalogVersion", "sourceHash", "sourceRef", "barcode", "stockOnHand",
    "safetyStock", "reserved", "codEligible", "rightsEvidenceRef",
    "sfdaNotificationId", "ecosmaProductReference", "approvedBy",
    "evidenceRef", "saudiImporterLicense", "internalLabelArtworkRef",
  ]) {
    assert.equal(
      serializedPublicCatalog.includes(forbiddenKey),
      false,
      `Public catalog leaked ${forbiddenKey}`,
    );
  }

  const englishCatalogResponse = await fetch(`${baseUrl}/api/catalog?locale=en`);
  assert.equal(englishCatalogResponse.status, 200);
  const englishCatalog = await englishCatalogResponse.json();
  assert.equal(englishCatalog.products[0].name, product.nameEn);

  for (const locale of ["ar", "en"]) {
    const shopResponse = await fetch(`${baseUrl}/${locale}/shop`);
    assert.equal(shopResponse.status, 200);
    const shopHtml = await shopResponse.text();
    assert.match(shopHtml, new RegExp(`/${locale}/product/${product.slug}`));
    assert.match(shopHtml, /data-shop-scene/);

    const productResponse = await fetch(`${baseUrl}/${locale}/product/${product.slug}`);
    assert.equal(productResponse.status, 200);
    const productHtml = await productResponse.text();
    assert.match(productHtml, /data-public-product/);
    assert.equal((productHtml.match(/data-product-scene/g) ?? []).length, 5);
    assert.match(productHtml, /"@type":"Product"/);

    for (const privateValue of [
      product.compliance.sfdaNotificationId,
      product.compliance.ecosmaProductReference,
      product.compliance.saudiImporterLicense,
      product.compliance.internalLabelArtworkRef,
      product.media[0].rightsEvidenceRef,
      product.variants[0].barcode,
    ]) {
      assert.equal(
        productHtml.includes(privateValue),
        false,
        `Localized product page leaked private catalog value: ${privateValue}`,
      );
    }
  }

  const missingProductResponse = await fetch(`${baseUrl}/ar/product/not-a-real-product`);
  assert.equal(missingProductResponse.status, 404);

  const legacyProductResponse = await fetch(`${baseUrl}/products/${product.slug}`, {
    redirect: "manual",
  });
  assert.ok([307, 308].includes(legacyProductResponse.status));
  assert.equal(
    new URL(legacyProductResponse.headers.get("location"), baseUrl).pathname,
    `/ar/product/${product.slug}`,
  );

  const localizedPluralResponse = await fetch(`${baseUrl}/en/products/${product.slug}`, {
    redirect: "manual",
  });
  assert.ok([307, 308].includes(localizedPluralResponse.status));
  assert.equal(
    new URL(localizedPluralResponse.headers.get("location"), baseUrl).pathname,
    `/en/product/${product.slug}`,
  );

  const invalidCatalogLocale = await fetch(`${baseUrl}/api/catalog?locale=fr`);
  assert.equal(invalidCatalogLocale.status, 400);
  assert.equal((await invalidCatalogLocale.json()).code, "catalog_locale_invalid");

  const resolvedCartResponse = await fetch(`${baseUrl}/api/catalog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale: "ar",
      items: [{ productSlug: product.slug, sku: product.variants[0].sku, quantity: 2 }],
    }),
  });
  assert.equal(resolvedCartResponse.status, 200);
  const resolvedCart = await resolvedCartResponse.json();
  assert.equal(resolvedCart.products.length, 1);
  assert.equal(resolvedCart.products[0].variants.length, 1);
  assert.equal(resolvedCart.products[0].variants[0].sku, product.variants[0].sku);
  assert.deepEqual(resolvedCart.unavailableKeys, []);

  const invalidResolverResponse = await fetch(`${baseUrl}/api/catalog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale: "ar", items: [], unexpected: true }),
  });
  assert.equal(invalidResolverResponse.status, 400);
  assert.equal((await invalidResolverResponse.json()).code, "catalog_resolve_invalid");

  const mixedQuoteResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        { productSlug: product.slug, sku: product.variants[0].sku, quantity: 1 },
        { productSlug: "unknown-product", sku: "UNKNOWN-SKU", quantity: 1 },
      ],
      shippingMethodId: "standard",
    }),
  });
  assert.equal(mixedQuoteResponse.status, 409);
  const mixedQuoteError = await mixedQuoteResponse.json();
  assert.equal(mixedQuoteError.code, "quote_items_unavailable");
  assert.match(mixedQuoteError.issues.join("\n"), /unknown-product:UNKNOWN-SKU:unknown/i);

  const invalidLocaleQuoteResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productSlug: product.slug, sku: product.variants[0].sku, quantity: 1 }],
      shippingMethodId: "standard",
      locale: "fr",
    }),
  });
  assert.equal(invalidLocaleQuoteResponse.status, 400);
  assert.equal((await invalidLocaleQuoteResponse.json()).code, "quote_payload_invalid");

  const extraQuoteFieldResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productSlug: product.slug, sku: product.variants[0].sku, quantity: 1 }],
      shippingMethodId: "standard",
      locale: "en",
      unexpected: true,
    }),
  });
  assert.equal(extraQuoteFieldResponse.status, 400);
  assert.equal((await extraQuoteFieldResponse.json()).code, "quote_payload_invalid");

  const quoteResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productSlug: product.slug, sku: product.variants[0].sku, quantity: 2 }],
      shippingMethodId: "standard",
    }),
  });
  assert.equal(quoteResponse.status, 201);
  assert.match(quoteResponse.headers.get("cache-control") ?? "", /no-store/i);
  assert.match(quoteResponse.headers.get("set-cookie") ?? "", /elore-checkout-session=/i);
  const quoteBody = await quoteResponse.json();
  assert.equal(quoteBody.quote.locale, "ar");
  assert.equal(quoteBody.quote.currency, "SAR");
  assert.equal(quoteBody.quote.taxInclusive, true);
  assert.equal(quoteBody.quote.vatRateBps, 1500);
  assert.equal(quoteBody.quote.lines.length, 1);
  assert.equal(quoteBody.quote.lines[0].unitGrossHalalas, 11500);
  assert.equal(quoteBody.quote.lines[0].lineGrossHalalas, 23000);
  assert.equal(quoteBody.quote.lines[0].lineVatHalalas, 3000);
  assert.equal(quoteBody.quote.shipping.grossHalalas, 2300);
  assert.equal(quoteBody.quote.shipping.vatHalalas, 300);
  assert.equal(quoteBody.quote.totalGrossHalalas, 25300);
  assert.equal(quoteBody.quote.totalVatHalalas, 3300);
  assert.equal(quoteBody.quote.policySet.termsVersion, "qa-terms-v1");
  assert.equal(quoteBody.quote.policySet.privacyNoticeVersion, "qa-privacy-v1");
  assert.deepEqual(quoteBody.quote.paymentOptions, [
    { id: "payment_link", enabled: true, reasonCode: null },
    { id: "cash_on_delivery", enabled: true, reasonCode: null },
  ]);
  assert.equal("checkoutSessionId" in quoteBody.quote, false);
  assert.equal("catalogVersion" in quoteBody.quote, false);
  assert.equal("catalogHash" in quoteBody.quote, false);
  assert.equal(JSON.stringify(quoteBody).includes("stockOnHand"), false);

  const checkoutCookie = (quoteResponse.headers.get("set-cookie") ?? "")
    .split(";", 1)[0];
  const quoteRaceSessionId = "checkout_quote_race_session_0001";
  const quoteRacePayload = {
    items: [{ productSlug: product.slug, sku: product.variants[1].sku, quantity: 1 }],
    shippingMethodId: "standard",
    locale: "en",
  };
  const quoteRaceResponses = await Promise.all(
    Array.from({ length: 2 }, () =>
      fetch(`${baseUrl}/api/checkout/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `elore-checkout-session=${quoteRaceSessionId}`,
        },
        body: JSON.stringify(quoteRacePayload),
      }),
    ),
  );
  assert.deepEqual(quoteRaceResponses.map((response) => response.status), [201, 201]);
  const quoteRaceBodies = await Promise.all(
    quoteRaceResponses.map((response) => response.json()),
  );
  assert.equal(quoteRaceBodies[0].quote.quoteId, quoteRaceBodies[1].quote.quoteId);
  const quoteReuseDatabase = new DatabaseSync(databasePath);
  assert.equal(
    quoteReuseDatabase.prepare(`
      SELECT COUNT(*) AS count
      FROM authority_checkout_quotes
      WHERE checkout_session_id = ? AND status = 'active'
    `).get(quoteRaceSessionId).count,
    1,
  );
  quoteReuseDatabase.prepare(`
    DELETE FROM authority_checkout_quotes
    WHERE checkout_session_id = ?
  `).run(quoteRaceSessionId);
  quoteReuseDatabase.close();

  const orderPayload = {
    quoteId: quoteBody.quote.quoteId,
    checkout: {
      fullName: "Catalog Authority Customer",
      phone: "0501234567",
      email: "catalog-authority@example.com",
      city: "Riyadh",
      district: "Olaya",
      addressLine: "Isolated catalog authority verification address",
      notes: "",
      shippingMethodId: "standard",
      paymentMethodId: "cash_on_delivery",
      acceptPolicies: true,
      acceptUpdates: false,
      termsVersion: "qa-terms-v1",
      privacyNoticeVersion: "qa-privacy-v1",
    },
  };
  const idempotencyKey = "qa-order-00000001";
  const policyMismatchResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: checkoutCookie,
      "Idempotency-Key": "qa-policy-mismatch-0001",
    },
    body: JSON.stringify({
      ...orderPayload,
      checkout: { ...orderPayload.checkout, termsVersion: "wrong-policy-version" },
    }),
  });
  assert.equal(policyMismatchResponse.status, 409);
  assert.equal((await policyMismatchResponse.json()).code, "policy_version_mismatch");

  const orderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: checkoutCookie,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(orderPayload),
  });
  assert.equal(orderResponse.status, 201);
  assert.equal(orderResponse.headers.get("idempotency-replayed"), "false");
  const orderBody = await orderResponse.json();
  assert.equal(orderResponse.headers.get("set-cookie")?.includes("cozmateks-customer-access="), false);
  assert.equal("customerAccessHandoffPath" in orderBody, false);
  assert.deepEqual(orderBody.notifications, []);
  assert.equal(orderBody.order.customer.phone, "966501234567");
  assert.equal(orderBody.order.customer.email, "");
  assert.equal(orderBody.order.lines[0].catalogTruth.supplierId, null);
  assert.equal(orderBody.order.providerBindings.payment.referenceId, null);
  assert.equal(orderBody.order.pricingSnapshot.quoteId, quoteBody.quote.quoteId);
  assert.equal(orderBody.order.pricingSnapshot.locale, "ar");
  assert.equal(orderBody.order.pricingSnapshot.totalGrossHalalas, 25300);
  assert.equal(orderBody.order.pricingSnapshot.totalVatHalalas, 3300);
  assert.equal(orderBody.order.pricingSnapshot.termsVersion, "qa-terms-v1");
  assert.equal(orderBody.order.pricingSnapshot.privacyNoticeVersion, "qa-privacy-v1");

  const replayResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: checkoutCookie,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(orderPayload),
  });
  assert.equal(replayResponse.status, 200);
  assert.equal(replayResponse.headers.get("idempotency-replayed"), "true");
  const replayBody = await replayResponse.json();
  assert.equal(replayBody.order.orderNumber, orderBody.order.orderNumber);

  const recoveredOrderResponse = await fetch(
    `${baseUrl}/api/orders/recovery?idempotencyKey=${encodeURIComponent(idempotencyKey)}`,
    { headers: { Cookie: checkoutCookie } },
  );
  assert.equal(recoveredOrderResponse.status, 200);
  assert.match(recoveredOrderResponse.headers.get("cache-control") ?? "", /no-store/i);
  assert.match(recoveredOrderResponse.headers.get("set-cookie") ?? "", /cozmateks-recent-order=/i);
  const recoveredOrderBody = await recoveredOrderResponse.json();
  assert.equal(recoveredOrderBody.state, "completed");
  assert.equal(recoveredOrderBody.order.orderNumber, orderBody.order.orderNumber);
  assert.equal(recoveredOrderBody.order.customer.email, "");

  const unknownRecoveryResponse = await fetch(
    `${baseUrl}/api/orders/recovery?idempotencyKey=qa-unknown-attempt-0001`,
    { headers: { Cookie: checkoutCookie } },
  );
  assert.equal(unknownRecoveryResponse.status, 200);
  assert.deepEqual(await unknownRecoveryResponse.json(), { state: "unknown" });

  const wrongSessionRecoveryResponse = await fetch(
    `${baseUrl}/api/orders/recovery?idempotencyKey=${encodeURIComponent(idempotencyKey)}`,
    { headers: { Cookie: "elore-checkout-session=checkout_wrong_session_0001" } },
  );
  assert.equal(wrongSessionRecoveryResponse.status, 200);
  assert.deepEqual(await wrongSessionRecoveryResponse.json(), { state: "unknown" });

  const inProgressKey = "qa-in-progress-attempt-0001";
  const recoveryDatabase = new DatabaseSync(databasePath);
  recoveryDatabase.prepare(`
    INSERT INTO authority_order_idempotency (
      checkout_session_id, idempotency_key, request_hash, state,
      order_number, created_at, updated_at
    ) VALUES (?, ?, ?, 'in_progress', NULL, ?, ?)
  `).run(
    checkoutCookie.split("=", 2)[1],
    inProgressKey,
    "0".repeat(64),
    new Date().toISOString(),
    new Date().toISOString(),
  );
  const inProgressRecoveryResponse = await fetch(
    `${baseUrl}/api/orders/recovery?idempotencyKey=${encodeURIComponent(inProgressKey)}`,
    { headers: { Cookie: checkoutCookie } },
  );
  assert.equal(inProgressRecoveryResponse.status, 200);
  assert.deepEqual(await inProgressRecoveryResponse.json(), { state: "in_progress" });
  recoveryDatabase.prepare(`
    DELETE FROM authority_order_idempotency
    WHERE checkout_session_id = ? AND idempotency_key = ?
  `).run(checkoutCookie.split("=", 2)[1], inProgressKey);
  recoveryDatabase.close();

  const conflictResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: checkoutCookie,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      ...orderPayload,
      checkout: { ...orderPayload.checkout, notes: "different payload" },
    }),
  });
  assert.equal(conflictResponse.status, 409);
  assert.equal((await conflictResponse.json()).code, "idempotency_conflict");

  const exhaustedQuote = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: checkoutCookie },
    body: JSON.stringify({
      items: [{ productSlug: product.slug, sku: product.variants[0].sku, quantity: 1 }],
      shippingMethodId: "standard",
    }),
  });
  assert.equal(exhaustedQuote.status, 409);
  assert.equal((await exhaustedQuote.json()).code, "quote_items_unavailable");

  async function createRaceQuote() {
    const response = await fetch(`${baseUrl}/api/checkout/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productSlug: product.slug, sku: product.variants[1].sku, quantity: 1 }],
        shippingMethodId: "standard",
      }),
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    return {
      quoteId: body.quote.quoteId,
      checkoutCookie: (response.headers.get("set-cookie") ?? "").split(";", 1)[0],
    };
  }

  const [raceQuoteOne, raceQuoteTwo] = await Promise.all([
    createRaceQuote(),
    createRaceQuote(),
  ]);
  const raceCheckout = {
    ...orderPayload.checkout,
    notes: "last-unit concurrency verification",
  };
  const raceOrder = (quote, idempotencyKey) => fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: quote.checkoutCookie,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ quoteId: quote.quoteId, checkout: raceCheckout }),
  });
  const raceResponses = await Promise.all([
    raceOrder(raceQuoteOne, "qa-race-order-00000001"),
    raceOrder(raceQuoteTwo, "qa-race-order-00000002"),
  ]);
  const raceResults = await Promise.all(raceResponses.map(async (response) => ({
    status: response.status,
    body: await response.json(),
  })));
  assert.deepEqual(
    raceResults.map((result) => result.status).sort((left, right) => left - right),
    [201, 409],
  );
  assert.equal(
    raceResults.find((result) => result.status === 409)?.body.code,
    "insufficient_stock",
  );

  async function confirmCodOrder(orderNumber) {
    const response = await fetch(`${baseUrl}/api/ops/orders/${orderNumber}`, {
      method: "PATCH",
      headers: { Cookie: sessionCookie, Origin: baseUrl },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.previousStatus, "received");
    assert.equal(body.nextStatus, "confirmed");
  }

  await confirmCodOrder(orderBody.order.orderNumber);
  const raceWinner = raceResults.find((result) => result.status === 201);
  assert.ok(raceWinner);
  await confirmCodOrder(raceWinner.body.order.orderNumber);

  const paymentQuoteResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productSlug: product.slug, sku: product.variants[2].sku, quantity: 1 }],
      shippingMethodId: "standard",
      locale: "en",
    }),
  });
  assert.equal(paymentQuoteResponse.status, 201);
  const paymentQuoteBody = await paymentQuoteResponse.json();
  assert.equal(paymentQuoteBody.quote.locale, "en");
  const paymentCheckoutCookie = (paymentQuoteResponse.headers.get("set-cookie") ?? "")
    .split(";", 1)[0];
  const paymentOrderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: paymentCheckoutCookie,
      "Idempotency-Key": "qa-payment-order-000001",
    },
    body: JSON.stringify({
      quoteId: paymentQuoteBody.quote.quoteId,
      checkout: {
        ...orderPayload.checkout,
        paymentMethodId: "payment_link",
        notes: "payment callback verification",
      },
    }),
  });
  assert.equal(paymentOrderResponse.status, 201);
  const paymentOrderBody = await paymentOrderResponse.json();
  assert.equal(paymentOrderBody.order.pricingSnapshot.locale, "en");
  const paymentOrderNumber = paymentOrderBody.order.orderNumber;

  const drainResponse = await fetch(`${baseUrl}/api/ops/outbox`, {
    method: "POST",
    headers: {
      Cookie: sessionCookie,
      Origin: baseUrl,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 20 }),
  });
  assert.equal(drainResponse.status, 200);
  const drainBody = await drainResponse.json();
  let outboxState = drainBody.outbox;
  const outboxDeadline = Date.now() + 5_000;
  while (outboxState.succeeded < 7 && Date.now() < outboxDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const statusResponse = await fetch(`${baseUrl}/api/ops/outbox`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(statusResponse.status, 200);
    outboxState = (await statusResponse.json()).outbox;
  }
  assert.equal(outboxState.succeeded, 7);
  assert.equal(outboxState.pending, 0);
  assert.equal(outboxState.processing, 0);
  assert.equal(outboxState.failed, 0);
  assert.equal(paymentRequests.length, 1);
  assert.equal(paymentRequests[0].orderNumber, paymentOrderNumber);
  assert.equal(paymentRequests[0].locale, "en");
  const paymentReturnUrl = new URL(paymentRequests[0].returnUrl);
  assert.equal(paymentReturnUrl.pathname, "/en/checkout/success");
  assert.equal(paymentReturnUrl.searchParams.get("order"), paymentOrderNumber);
  assert.equal(
    paymentRequests[0].idempotencyKey,
    `cozmateks:${paymentOrderNumber}:payment-link`,
  );

  const customerIdentityEmail = "catalog-authority@example.com";
  const customerIdentityPhone = "966501234567";
  const authoritySecret = "catalog-authority-test-access";
  const customerKey = createHash("sha256")
    .update(`${customerIdentityPhone}|${customerIdentityEmail}|${authoritySecret}`)
    .digest("hex");
  const tokenExpiry = Date.now() + 60_000;
  const customerAccessToken = createTestSignedToken(
    { scope: "customer_access", customerKey, exp: tokenExpiry },
    authoritySecret,
  );
  const customerAccountToken = createTestSignedToken(
    {
      scope: "customer_account",
      customerKey,
      providerLabel: "Customer auth handoff contract",
      exp: tokenExpiry,
    },
    authoritySecret,
  );
  const customerAccessOrdersResponse = await fetch(`${baseUrl}/account/orders`, {
    headers: { Cookie: `cozmateks-customer-access=${customerAccessToken}` },
  });
  assert.equal(customerAccessOrdersResponse.status, 200);
  const customerAccessOrdersHtml = await customerAccessOrdersResponse.text();
  assert.match(customerAccessOrdersHtml, new RegExp(paymentOrderNumber));

  const customerAccountOrdersResponse = await fetch(`${baseUrl}/account/orders`, {
    headers: { Cookie: `cozmateks-customer-account=${customerAccountToken}` },
  });
  assert.equal(customerAccountOrdersResponse.status, 200);
  const customerAccountOrdersHtml = await customerAccountOrdersResponse.text();
  assert.match(customerAccountOrdersHtml, new RegExp(paymentOrderNumber));

  const sensitiveCustomerValues = [
    customerIdentityEmail,
    customerIdentityPhone,
    "Isolated catalog authority verification address",
    `PAY-${paymentOrderNumber}`,
    imported.body.importId,
  ];
  for (const sensitiveValue of sensitiveCustomerValues) {
    assert.equal(customerAccessOrdersHtml.includes(sensitiveValue), false);
    assert.equal(customerAccountOrdersHtml.includes(sensitiveValue), false);
  }
  const expectedPaymentUrl = `${paymentBaseUrl}/pay/${paymentOrderNumber}`;
  assert.equal(customerAccessOrdersHtml.includes(expectedPaymentUrl), false);
  assert.equal(customerAccountOrdersHtml.includes(expectedPaymentUrl), true);

  const paymentCallback = {
    orderNumber: paymentOrderNumber,
    paymentReferenceId: `PAY-${paymentOrderNumber}`,
    settlementReference: `SET-${paymentOrderNumber}`,
    eventId: "qa-payment-event-0001",
    settledAt: new Date().toISOString(),
  };
  const callbackHeaders = {
    Authorization: "Bearer qa-payment-callback-secret",
    "Content-Type": "application/json",
  };
  const missingEventCallback = await fetch(`${baseUrl}/api/providers/payment`, {
    method: "POST",
    headers: callbackHeaders,
    body: JSON.stringify({ ...paymentCallback, eventId: "" }),
  });
  assert.equal(missingEventCallback.status, 400);

  const firstPaymentCallback = await fetch(`${baseUrl}/api/providers/payment`, {
    method: "POST",
    headers: callbackHeaders,
    body: JSON.stringify(paymentCallback),
  });
  assert.equal(firstPaymentCallback.status, 200);
  const firstPaymentCallbackBody = await firstPaymentCallback.json();
  assert.equal(firstPaymentCallbackBody.replayed, false);
  assert.equal(firstPaymentCallbackBody.state, "confirmed");

  const replayedPaymentCallback = await fetch(`${baseUrl}/api/providers/payment`, {
    method: "POST",
    headers: callbackHeaders,
    body: JSON.stringify(paymentCallback),
  });
  assert.equal(replayedPaymentCallback.status, 200);
  assert.equal((await replayedPaymentCallback.json()).replayed, true);

  const conflictingPaymentCallback = await fetch(`${baseUrl}/api/providers/payment`, {
    method: "POST",
    headers: callbackHeaders,
    body: JSON.stringify({ ...paymentCallback, settlementReference: "SET-CONFLICT" }),
  });
  assert.equal(conflictingPaymentCallback.status, 409);
  assert.equal((await conflictingPaymentCallback.json()).code, "provider_event_conflict");

  const settledCustomerAccountResponse = await fetch(`${baseUrl}/account/orders`, {
    headers: { Cookie: `cozmateks-customer-account=${customerAccountToken}` },
  });
  assert.equal(settledCustomerAccountResponse.status, 200);
  assert.equal(
    (await settledCustomerAccountResponse.text()).includes(`SET-${paymentOrderNumber}`),
    false,
  );

  const expiryQuoteResponse = await fetch(`${baseUrl}/api/checkout/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productSlug: product.slug, sku: product.variants[3].sku, quantity: 1 }],
      shippingMethodId: "standard",
    }),
  });
  assert.equal(expiryQuoteResponse.status, 201);
  const expiryQuoteBody = await expiryQuoteResponse.json();
  const expiryCheckoutCookie = (expiryQuoteResponse.headers.get("set-cookie") ?? "")
    .split(";", 1)[0];
  const expiryOrderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: expiryCheckoutCookie,
      "Idempotency-Key": "qa-expiry-order-0000001",
    },
    body: JSON.stringify({
      quoteId: expiryQuoteBody.quote.quoteId,
      checkout: {
        ...orderPayload.checkout,
        paymentMethodId: "payment_link",
        notes: "reservation expiry verification",
      },
    }),
  });
  assert.equal(expiryOrderResponse.status, 201);
  const expiryOrderNumber = (await expiryOrderResponse.json()).order.orderNumber;

  const expiryDrainResponse = await fetch(`${baseUrl}/api/ops/outbox`, {
    method: "POST",
    headers: {
      Cookie: sessionCookie,
      Origin: baseUrl,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 20 }),
  });
  assert.equal(expiryDrainResponse.status, 200);
  let expiryOutboxState = (await expiryDrainResponse.json()).outbox;
  const expiryOutboxDeadline = Date.now() + 5_000;
  while (expiryOutboxState.succeeded < 10 && Date.now() < expiryOutboxDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const statusResponse = await fetch(`${baseUrl}/api/ops/outbox`, {
      headers: { Cookie: sessionCookie },
    });
    expiryOutboxState = (await statusResponse.json()).outbox;
  }
  assert.equal(expiryOutboxState.succeeded, 10);
  assert.equal(paymentRequests.length, 2);

  const maintenanceDatabase = new DatabaseSync(databasePath);
  maintenanceDatabase.prepare(`
    UPDATE authority_inventory_reservations
    SET expires_at = ?
    WHERE order_number = ? AND state = 'active'
  `).run("2026-07-15T00:00:00.000Z", expiryOrderNumber);
  maintenanceDatabase.close();

  const maintenanceResponse = await fetch(`${baseUrl}/api/ops/outbox`, {
    method: "POST",
    headers: {
      Cookie: sessionCookie,
      Origin: baseUrl,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 20 }),
  });
  assert.equal(maintenanceResponse.status, 200);
  assert.equal((await maintenanceResponse.json()).reservations.expired, 1);

  const latePaymentCallback = await fetch(`${baseUrl}/api/providers/payment`, {
    method: "POST",
    headers: callbackHeaders,
    body: JSON.stringify({
      orderNumber: expiryOrderNumber,
      paymentReferenceId: `PAY-${expiryOrderNumber}`,
      settlementReference: `SET-${expiryOrderNumber}`,
      eventId: "qa-payment-event-late-0001",
      settledAt: new Date().toISOString(),
    }),
  });
  assert.equal(latePaymentCallback.status, 409);
  assert.equal((await latePaymentCallback.json()).code, "reservation_unavailable");

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  const health = await healthResponse.json();
  assert.equal(health.catalogAuthority.ready, true);
  assert.equal(health.publicCommerceAvailable, false);
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 5_000);
    server.once("exit", () => { clearTimeout(timeout); resolve(); });
  });
  await new Promise((resolve) => paymentMock.close(resolve));
}

const database = new DatabaseSync(databasePath);
try {
  assert.equal(database.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_schema_migrations WHERE id = ?")
      .get("2026-07-15-catalog-authority-v1").count,
    1,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_schema_migrations WHERE id = ?")
      .get("2026-07-15-checkout-quote-v1").count,
    1,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_schema_migrations WHERE id = ?")
      .get("2026-07-15-idempotent-order-v1").count,
    1,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_schema_migrations WHERE id = ?")
      .get("2026-07-15-outbox-lease-v1").count,
    1,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_schema_migrations WHERE id = ?")
      .get("2026-07-15-active-quote-reuse-v1").count,
    1,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_catalog_products").get().count,
    1,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_catalog_variants").get().count,
    4,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_checkout_quotes").get().count,
    5,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_orders").get().count,
    4,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_order_idempotency").get().count,
    4,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_inventory_reservations").get().count,
    4,
  );
  assert.equal(
    database.prepare("SELECT on_hand FROM authority_inventory_balances WHERE sku = ?")
      .get("QA-AUTH-001").on_hand,
    1,
  );
  assert.equal(
    database.prepare("SELECT on_hand FROM authority_inventory_balances WHERE sku = ?")
      .get("QA-RACE-001").on_hand,
    0,
  );
  assert.equal(
    database.prepare("SELECT on_hand FROM authority_inventory_balances WHERE sku = ?")
      .get("QA-PAY-001").on_hand,
    0,
  );
  assert.equal(
    database.prepare("SELECT on_hand FROM authority_inventory_balances WHERE sku = ?")
      .get("QA-EXP-001").on_hand,
    1,
  );
  assert.equal(
    database.prepare("SELECT SUM(reserved) AS reserved FROM authority_inventory_balances")
      .get().reserved,
    0,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_inventory_reservations WHERE state = 'committed'")
      .get().count,
    3,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_inventory_reservations WHERE state = 'expired'")
      .get().count,
    1,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_outbox").get().count,
    10,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_outbox WHERE status = 'succeeded'")
      .get().count,
    10,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_provider_events WHERE provider = 'payment'")
      .get().count,
    1,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_orders WHERE status = 'payment_expired'")
      .get().count,
    1,
  );
} finally {
  database.close();
  rmSync(databasePath, { force: true });
  rmSync(legacyOrderPath, { force: true });
}

console.log("Catalog, quote, idempotent order, reservation, outbox, VAT, inventory, and integrity checks passed.");
