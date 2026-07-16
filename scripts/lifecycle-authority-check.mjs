import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const workspace = mkdtempSync(path.join(os.tmpdir(), "elore-lifecycle-authority-"));
const databasePath = path.join(workspace, "authority.sqlite");

function compileModule(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const originalEnvironment = {
  APP_ENV: process.env.APP_ENV,
  NODE_ENV: process.env.NODE_ENV,
  AUTHORITY_DB_PATH: process.env.AUTHORITY_DB_PATH,
  PUBLIC_RELEASE_APPROVED: process.env.PUBLIC_RELEASE_APPROVED,
  PUBLIC_LEGAL_CONTENT_APPROVED: process.env.PUBLIC_LEGAL_CONTENT_APPROVED,
  LIFECYCLE_COLLECTION_ENABLED: process.env.LIFECYCLE_COLLECTION_ENABLED,
  LIFECYCLE_CONSENT_POLICY_VERSION: process.env.LIFECYCLE_CONSENT_POLICY_VERSION,
  LIFECYCLE_UNSUBSCRIBE_SECRET: process.env.LIFECYCLE_UNSUBSCRIBE_SECRET,
  LIFECYCLE_DELIVERY_ENABLED: process.env.LIFECYCLE_DELIVERY_ENABLED,
  LIFECYCLE_DELIVERY_PROVIDER_ENABLED:
    process.env.LIFECYCLE_DELIVERY_PROVIDER_ENABLED,
  LIFECYCLE_DELIVERY_PROVIDER_KEY: process.env.LIFECYCLE_DELIVERY_PROVIDER_KEY,
};

try {
  process.env.APP_ENV = "local";
  process.env.NODE_ENV = "production";
  process.env.AUTHORITY_DB_PATH = databasePath;
  process.env.LIFECYCLE_CONSENT_POLICY_VERSION = "privacy-2026-07";
  process.env.LIFECYCLE_UNSUBSCRIBE_SECRET =
    "isolated-lifecycle-secret-with-more-than-32-characters";

  let authoritySource = readFileSync(
    path.join(root, "src/lib/authority-database.ts"),
    "utf8",
  );
  authoritySource = authoritySource
    .replace('import "server-only";', "")
    .replace(
      'import { resolveProjectPath } from "@/lib/runtime-paths";',
      "const resolveProjectPath = (value) => path.resolve(process.cwd(), value);",
    );
  const authority = await compileModule(authoritySource);

  globalThis.__lifecycleAuthorityTestDeps = {
    authority,
    activeCatalog: null,
  };
  let deliverySource = readFileSync(
    path.join(root, "src/lib/lifecycle-delivery-outbox.ts"),
    "utf8",
  );
  deliverySource = deliverySource
    .replace('import "server-only";', "")
    .replace(
      /import \{\s*getAuthorityDatabase,\s*runAuthorityTransaction,\s*\} from "@\/lib\/authority-database";/,
      "const { getAuthorityDatabase, runAuthorityTransaction } = globalThis.__lifecycleAuthorityTestDeps.authority;",
    );
  const delivery = await compileModule(deliverySource);
  globalThis.__lifecycleAuthorityTestDeps.delivery = delivery;
  let lifecycleSource = readFileSync(
    path.join(root, "src/lib/lifecycle-consent-authority.ts"),
    "utf8",
  );
  lifecycleSource = lifecycleSource
    .replace('import "server-only";', "")
    .replace(
      /import \{\s*getAuthorityDatabase,\s*runAuthorityTransaction,\s*\} from "@\/lib\/authority-database";/,
      "const { getAuthorityDatabase, runAuthorityTransaction } = globalThis.__lifecycleAuthorityTestDeps.authority;",
    )
    .replace(
      'import { getActiveCatalogAuthority } from "@/lib/catalog-authority";',
      "const getActiveCatalogAuthority = () => globalThis.__lifecycleAuthorityTestDeps.activeCatalog;",
    )
    .replace(
      /import \{\s*cancelLifecycleDeliveriesForSubscriptionWithDatabase,\s*enqueueLifecycleDeliveryWithDatabase,\s*type ClaimedLifecycleDelivery,\s*\} from "@\/lib\/lifecycle-delivery-outbox";/,
      "const { cancelLifecycleDeliveriesForSubscriptionWithDatabase, enqueueLifecycleDeliveryWithDatabase } = globalThis.__lifecycleAuthorityTestDeps.delivery;",
    );
  const lifecycle = await compileModule(lifecycleSource);

  assert.equal(
    lifecycle.getLifecycleCollectionAvailability().available,
    true,
    "explicit local APP_ENV must override standalone NODE_ENV=production",
  );
  assert.throws(
    () =>
      lifecycle.subscribeLifecycle({
        kind: "newsletter",
        email: "person@example.com",
        consent: false,
        source: "home_newsletter",
        locale: "ar",
      }),
    (error) => error.code === "consent_required",
  );

  const newsletterInput = {
    kind: "newsletter",
    email: "Person@Example.com",
    consent: true,
    source: "home_newsletter",
    locale: "ar",
  };
  const newsletter = lifecycle.subscribeLifecycle(newsletterInput);
  const retriedNewsletter = lifecycle.subscribeLifecycle(newsletterInput);
  assert.equal(retriedNewsletter.subscription.id, newsletter.subscription.id);
  assert.equal(retriedNewsletter.unsubscribeToken, newsletter.unsubscribeToken);
  assert.equal(retriedNewsletter.created, false);
  const unsubscribeLink = lifecycle.createLifecycleUnsubscribeLink({
    unsubscribeToken: newsletter.unsubscribeToken,
    locale: "ar",
    baseUrl: "http://localhost:3056/path-that-must-not-survive?token=unsafe",
  });
  const unsubscribeUrl = new URL(unsubscribeLink);
  assert.equal(unsubscribeUrl.pathname, "/ar/unsubscribe");
  assert.equal(unsubscribeUrl.search, "");
  assert.equal(
    new URLSearchParams(unsubscribeUrl.hash.slice(1)).get("token"),
    newsletter.unsubscribeToken,
    "the secret must live only in the URL fragment, which is not sent to the server",
  );

  const database = authority.getAuthorityDatabase();
  assert.match(
    database
      .prepare(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'authority_lifecycle_subscriptions'",
      )
      .get().sql,
    /fulfilled/,
  );
  assert.equal(
    database.prepare("SELECT COUNT(*) AS count FROM authority_lifecycle_subscriptions").get()
      .count,
    1,
  );

  lifecycle.unsubscribeLifecycle(newsletter.unsubscribeToken);
  lifecycle.unsubscribeLifecycle(newsletter.unsubscribeToken);
  const withdrawnRow = database
    .prepare(
      "SELECT contact_email, contact_hash, status FROM authority_lifecycle_subscriptions WHERE id = ?",
    )
    .get(newsletter.subscription.id);
  assert.equal(withdrawnRow.contact_email, "");
  assert.equal(withdrawnRow.contact_hash.length, 64);
  assert.equal(withdrawnRow.status, "unsubscribed");
  assert.equal(lifecycle.getLifecycleOpsSnapshot().recent[0].contactHint, "withdrawn");

  const resubscribed = lifecycle.subscribeLifecycle(newsletterInput);
  assert.equal(resubscribed.subscription.id, newsletter.subscription.id);
  assert.equal(resubscribed.subscription.status, "subscribed");
  assert.notEqual(lifecycle.getLifecycleOpsSnapshot().recent[0].contactHint, "withdrawn");

  const restock = lifecycle.subscribeLifecycle({
    kind: "back_in_stock",
    email: "restock@example.com",
    consent: true,
    source: "pdp_back_in_stock",
    locale: "en",
    productSlug: "verified-product",
    sku: "SKU-01",
  });
  const fulfilled = lifecycle.fulfillBackInStockSubscription({
    id: restock.subscription.id,
    fulfilledAt: "2026-07-15T12:00:00.000Z",
  });
  assert.equal(fulfilled.status, "fulfilled");
  const snapshotJson = JSON.stringify(lifecycle.getLifecycleOpsSnapshot());
  assert.doesNotMatch(snapshotJson, /person@example\.com|restock@example\.com/i);
  assert.doesNotMatch(snapshotJson, new RegExp(newsletter.unsubscribeToken, "i"));
  const snapshot = lifecycle.getLifecycleOpsSnapshot();
  assert.equal(snapshot.metrics.fulfilled, 1);
  assert.equal(snapshot.recent.some((item) => item.consentPolicyVersion === "privacy-2026-07"), true);
  assert.equal(snapshot.recent.some((item) => item.locale === "en"), true);

  process.env.APP_ENV = "production";
  process.env.PUBLIC_RELEASE_APPROVED = "false";
  process.env.PUBLIC_LEGAL_CONTENT_APPROVED = "false";
  process.env.LIFECYCLE_COLLECTION_ENABLED = "false";
  assert.equal(lifecycle.getLifecycleCollectionAvailability().available, false);

  process.env.PUBLIC_RELEASE_APPROVED = "true";
  process.env.PUBLIC_LEGAL_CONTENT_APPROVED = "true";
  process.env.LIFECYCLE_COLLECTION_ENABLED = "true";
  assert.throws(
    () =>
      lifecycle.createLifecycleUnsubscribeLink({
        unsubscribeToken: newsletter.unsubscribeToken,
        locale: "en",
        baseUrl: "http://elore.example",
      }),
    (error) => error.code === "lifecycle_runtime_unavailable",
  );
  assert.match(
    lifecycle.createLifecycleUnsubscribeLink({
      unsubscribeToken: newsletter.unsubscribeToken,
      locale: "en",
      baseUrl: "https://elore.example",
    }),
    /^https:\/\/elore\.example\/en\/unsubscribe#token=/,
  );
  assert.throws(
    () =>
      lifecycle.subscribeLifecycle({
        kind: "back_in_stock",
        email: "production@example.com",
        consent: true,
        source: "pdp_back_in_stock",
        locale: "ar",
        productSlug: "missing-product",
        sku: "MISSING-1",
      }),
    (error) => error.code === "back_in_stock_target_not_found",
  );
  globalThis.__lifecycleAuthorityTestDeps.activeCatalog = {
    importId: "active-import",
    sourceHash: "test",
    payload: {
      products: [
        {
          slug: "verified-product",
          status: "approved",
          variants: [{ sku: "SKU-02", status: "approved" }],
        },
      ],
    },
  };
  const productionRestock = lifecycle.subscribeLifecycle({
    kind: "back_in_stock",
    email: "production@example.com",
    consent: true,
    source: "pdp_back_in_stock",
    locale: "ar",
    productSlug: "verified-product",
    sku: "SKU-02",
  });
  assert.equal(productionRestock.subscription.status, "subscribed");

  await assert.rejects(
    lifecycle.readLifecycleRequestBody(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.com", unexpected: true }),
      }),
      ["email"],
    ),
    (error) => error.code === "lifecycle_request_invalid",
  );
  await assert.rejects(
    lifecycle.readLifecycleRequestBody(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: "x".repeat(9 * 1024) }),
      }),
      ["value"],
    ),
    (error) => error.code === "lifecycle_payload_too_large",
  );

  const requestHardening = await compileModule(
    readFileSync(path.join(root, "src/lib/request-hardening.ts"), "utf8"),
  );
  assert.throws(() =>
    requestHardening.assertTrustedMutationRequest(
      new Request("https://elore.example/api/newsletter", {
        method: "POST",
        headers: { origin: "https://attacker.example" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    requestHardening.assertTrustedMutationRequest(
      new Request("https://elore.example/api/newsletter", {
        method: "POST",
        headers: { origin: "https://elore.example" },
      }),
    ),
  );

  for (const routePath of [
    "src/app/api/newsletter/route.ts",
    "src/app/api/back-in-stock/route.ts",
  ]) {
    const source = readFileSync(path.join(root, routePath), "utf8");
    assert.match(source, /assertTrustedMutationRequest\s*\(request\)/);
    assert.match(source, /readLifecycleRequestBody\s*\(/);
    assert.match(source, /export async function DELETE/);
    assert.doesNotMatch(source, /Klaviyo|Mailchimp|CRM|setTimeout/);
  }

  const publicUnsubscribeRoute = readFileSync(
    path.join(root, "src/app/api/lifecycle/unsubscribe/route.ts"),
    "utf8",
  );
  assert.match(publicUnsubscribeRoute, /export async function DELETE/);
  assert.doesNotMatch(publicUnsubscribeRoute, /export (?:async )?function GET/);
  assert.match(publicUnsubscribeRoute, /assertTrustedMutationRequest\s*\(request\)/);

  const confirmationSource = readFileSync(
    path.join(root, "src/components/lifecycle-unsubscribe-confirmation.tsx"),
    "utf8",
  );
  const historyCleanupIndex = confirmationSource.indexOf("window.history.replaceState");
  const requestIndex = confirmationSource.indexOf('fetch("/api/lifecycle/unsubscribe"');
  assert.ok(historyCleanupIndex >= 0 && requestIndex > historyCleanupIndex);
  assert.match(confirmationSource, /method:\s*"DELETE"/);
  assert.match(confirmationSource, /onClick=\{confirmUnsubscribe\}/);
  assert.doesNotMatch(confirmationSource, /console\.(?:log|info|warn|error)/);
  assert.doesNotMatch(confirmationSource, />\s*\{unsubscribeToken\}\s*</);

  // The storefront lives under a route group so that [locale]/layout.tsx can be
  // a root layout and read the locale from params. Route groups do not appear
  // in URLs, only on disk.
  const unsubscribePageSource = readFileSync(
    path.join(root, "src/app/(storefront)/[locale]/unsubscribe/page.tsx"),
    "utf8",
  );
  assert.doesNotMatch(unsubscribePageSource, /searchParams|unsubscribeToken/);
  assert.match(unsubscribePageSource, /referrer:\s*"no-referrer"/);
  assert.match(unsubscribePageSource, /index:\s*false/);

  console.log(
    "Lifecycle consent migration, idempotency, suppression, fulfillment, gates, catalog binding, and request hardening passed.",
  );
} finally {
  const database = globalThis.__cozmateksAuthorityDatabase;
  if (database) database.close();
  delete globalThis.__cozmateksAuthorityDatabase;
  delete globalThis.__cozmateksAuthorityDatabasePath;
  delete globalThis.__lifecycleAuthorityTestDeps;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(workspace, { recursive: true, force: true });
}
