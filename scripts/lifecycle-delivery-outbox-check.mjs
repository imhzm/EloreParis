import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const workspace = mkdtempSync(path.join(os.tmpdir(), "elore-lifecycle-delivery-"));
const databasePath = path.join(workspace, "authority.sqlite");
const originalEnvironment = { ...process.env };

function compileModule(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

try {
  process.env.APP_ENV = "local";
  process.env.NODE_ENV = "production";
  process.env.AUTHORITY_DB_PATH = databasePath;
  process.env.LIFECYCLE_DELIVERY_ENABLED = "false";
  process.env.LIFECYCLE_DELIVERY_PROVIDER_ENABLED = "false";
  process.env.LIFECYCLE_CONSENT_POLICY_VERSION = "privacy-test-v1";
  process.env.LIFECYCLE_UNSUBSCRIBE_SECRET =
    "isolated-lifecycle-envelope-secret-over-32-characters";
  process.env.NEXT_PUBLIC_SITE_URL = "https://elore.example";

  let authoritySource = readFileSync("src/lib/authority-database.ts", "utf8");
  authoritySource = authoritySource
    .replace('import "server-only";', "")
    .replace(
      'import { resolveProjectPath } from "@/lib/runtime-paths";',
      "const resolveProjectPath = (value) => path.resolve(process.cwd(), value);",
    );
  const authority = await compileModule(authoritySource);
  globalThis.__lifecycleDeliveryTestDeps = { authority, activeCatalog: null };

  let deliverySource = readFileSync("src/lib/lifecycle-delivery-outbox.ts", "utf8");
  deliverySource = deliverySource
    .replace('import "server-only";', "")
    .replace(
      /import \{\s*getAuthorityDatabase,\s*runAuthorityTransaction,\s*\} from "@\/lib\/authority-database";/,
      "const { getAuthorityDatabase, runAuthorityTransaction } = globalThis.__lifecycleDeliveryTestDeps.authority;",
    );
  const delivery = await compileModule(deliverySource);
  globalThis.__lifecycleDeliveryTestDeps.delivery = delivery;
  let lifecycleSource = readFileSync("src/lib/lifecycle-consent-authority.ts", "utf8");
  lifecycleSource = lifecycleSource
    .replace('import "server-only";', "")
    .replace(
      /import \{\s*getAuthorityDatabase,\s*runAuthorityTransaction,\s*\} from "@\/lib\/authority-database";/,
      "const { getAuthorityDatabase, runAuthorityTransaction } = globalThis.__lifecycleDeliveryTestDeps.authority;",
    )
    .replace(
      'import { getActiveCatalogAuthority } from "@/lib/catalog-authority";',
      "const getActiveCatalogAuthority = () => globalThis.__lifecycleDeliveryTestDeps.activeCatalog;",
    )
    .replace(
      /import \{\s*cancelLifecycleDeliveriesForSubscriptionWithDatabase,\s*enqueueLifecycleDeliveryWithDatabase,\s*type ClaimedLifecycleDelivery,\s*\} from "@\/lib\/lifecycle-delivery-outbox";/,
      "const { cancelLifecycleDeliveriesForSubscriptionWithDatabase, enqueueLifecycleDeliveryWithDatabase } = globalThis.__lifecycleDeliveryTestDeps.delivery;",
    );
  const lifecycle = await compileModule(lifecycleSource);
  const templates = await compileModule(
    readFileSync("src/lib/lifecycle-email-templates.ts", "utf8").replace(
      'import "server-only";',
      "",
    ),
  );
  const callbackAuth = await compileModule(
    readFileSync("src/lib/provider-callback-auth.ts", "utf8"),
  );
  globalThis.__lifecycleDeliveryTestDeps.callbackAuth = callbackAuth;
  let providerEventSource = readFileSync(
    "src/lib/provider-event-authority.ts",
    "utf8",
  );
  providerEventSource = providerEventSource
    .replace('import "server-only";', "")
    .replace(
      'import { getAuthorityDatabase } from "@/lib/authority-database";',
      "const { getAuthorityDatabase } = globalThis.__lifecycleDeliveryTestDeps.authority;",
    )
    .replace(
      'import { authenticateProviderCallback } from "@/lib/provider-callback-auth";',
      "const { authenticateProviderCallback } = globalThis.__lifecycleDeliveryTestDeps.callbackAuth;",
    );
  const providerEvent = await compileModule(providerEventSource);
  globalThis.__lifecycleDeliveryTestDeps.lifecycle = lifecycle;
  globalThis.__lifecycleDeliveryTestDeps.providerEvent = providerEvent;
  globalThis.__lifecycleDeliveryTestDeps.templates = templates;
  let emailProviderSource = readFileSync(
    "src/lib/lifecycle-email-provider.ts",
    "utf8",
  );
  emailProviderSource = emailProviderSource
    .replace('import "server-only";', "")
    .replace(
      'import { runAuthorityTransaction } from "@/lib/authority-database";',
      "const { runAuthorityTransaction } = globalThis.__lifecycleDeliveryTestDeps.authority;",
    )
    .replace(
      /import \{\s*resolveLifecycleDeliveryEnvelope,\s*\} from "@\/lib\/lifecycle-consent-authority";/,
      "const { resolveLifecycleDeliveryEnvelope } = globalThis.__lifecycleDeliveryTestDeps.lifecycle;",
    )
    .replace(
      /import \{\s*cancelLifecycleDeliveriesForSubscriptionWithDatabase,\s*claimLifecycleDeliveryJobs,\s*getLifecycleDeliveryAvailability,\s*markLifecycleDeliveryAccepted,\s*markLifecycleDeliveryFailed,\s*type ClaimedLifecycleDelivery,\s*\} from "@\/lib\/lifecycle-delivery-outbox";/,
      "const { cancelLifecycleDeliveriesForSubscriptionWithDatabase, claimLifecycleDeliveryJobs, getLifecycleDeliveryAvailability, markLifecycleDeliveryAccepted, markLifecycleDeliveryFailed } = globalThis.__lifecycleDeliveryTestDeps.delivery;",
    )
    .replace(
      /import \{\s*renderLifecycleEmail,\s*type RenderedLifecycleEmail,\s*\} from "@\/lib\/lifecycle-email-templates";/,
      "const { renderLifecycleEmail } = globalThis.__lifecycleDeliveryTestDeps.templates;",
    )
    .replace(
      /import \{\s*ProviderEventAuthorityError,\s*readAuthenticatedProviderCallback,\s*\} from "@\/lib\/provider-event-authority";/,
      "const { ProviderEventAuthorityError, readAuthenticatedProviderCallback } = globalThis.__lifecycleDeliveryTestDeps.providerEvent;",
    );
  const emailProvider = await compileModule(emailProviderSource);
  const database = authority.getAuthorityDatabase();
  const insertSubscription = database.prepare(`
    INSERT INTO authority_lifecycle_subscriptions (
      id, kind, contact_email, contact_hash, scope_key, product_slug, sku,
      source, status, consent_policy_version, locale, consent_action,
      consent_granted_at, consent_withdrawn_at, fulfilled_at,
      unsubscribe_token_hash, created_at, updated_at, consent_revision
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'test', 'subscribed', 'privacy-v1', ?,
      'affirmative_form_submit', ?, NULL, NULL, ?, ?, ?, 1)
  `);
  const nowIso = "2030-07-15T12:00:00.000Z";
  function addSubscription(id, kind, email, productSlug = null, sku = null, locale = "en") {
    insertSubscription.run(
      id,
      kind,
      email,
      `hash-${id}`,
      kind === "newsletter" ? "newsletter" : `${productSlug}:${sku}`,
      productSlug,
      sku,
      locale,
      nowIso,
      `token-hash-${id}`,
      nowIso,
      nowIso,
    );
  }

  const newsletterId = "11111111-1111-4111-8111-111111111111";
  const restockId = "22222222-2222-4222-8222-222222222222";
  const cancelId = "33333333-3333-4333-8333-333333333333";
  addSubscription(newsletterId, "newsletter", "person@example.com");
  const first = delivery.enqueueLifecycleDeliveryWithDatabase(database, {
    subscriptionId: newsletterId,
    deliveryType: "newsletter_confirmation",
    dispatchKey: "consent-1",
  });
  const duplicate = delivery.enqueueLifecycleDeliveryWithDatabase(database, {
    subscriptionId: newsletterId,
    deliveryType: "newsletter_confirmation",
    dispatchKey: "consent-1",
  });
  assert.equal(first.job.id, duplicate.job.id);
  assert.equal(duplicate.created, false);
  assert.equal(delivery.getLifecycleDeliveryAvailability().available, false);
  assert.throws(() => delivery.claimLifecycleDeliveryJobs(), /not enabled/);

  process.env.LIFECYCLE_DELIVERY_ENABLED = "true";
  process.env.LIFECYCLE_DELIVERY_PROVIDER_ENABLED = "true";
  process.env.LIFECYCLE_DELIVERY_PROVIDER_KEY = "isolated-adapter";
  const firstClaim = delivery.claimLifecycleDeliveryJobs({
    now: new Date(nowIso),
    leaseMs: 5_000,
  })[0];
  assert.equal(firstClaim.attempts, 1);
  assert.doesNotMatch(JSON.stringify(firstClaim), /person@example|unsubscribe/i);
  const firstEnvelope = lifecycle.resolveLifecycleDeliveryEnvelope(firstClaim);
  assert.equal(firstEnvelope.destinationEmail, "person@example.com");
  assert.equal(firstEnvelope.locale, "en");
  assert.equal(new URL(firstEnvelope.unsubscribeUrl).search, "");
  assert.match(new URL(firstEnvelope.unsubscribeUrl).hash, /^#token=/);
  assert.equal(
    delivery.markLifecycleDeliveryFailed(firstClaim, {
      errorCode: "timeout person@example.com",
      now: new Date(nowIso),
    }),
    true,
  );
  let deliveryRow = database.prepare(
    "SELECT * FROM authority_lifecycle_delivery_outbox WHERE id = ?",
  ).get(firstClaim.id);
  assert.equal(deliveryRow.status, "failed");
  assert.equal(deliveryRow.last_error_code, "delivery_failed");
  const retryAt = new Date(deliveryRow.next_attempt_at);
  assert.ok(retryAt.getTime() - Date.parse(nowIso) >= 30_000);
  assert.ok(retryAt.getTime() - Date.parse(nowIso) <= 35_000);
  const retryClaim = delivery.claimLifecycleDeliveryJobs({
    now: new Date(retryAt.getTime() + 1),
  })[0];
  assert.throws(
    () => lifecycle.resolveLifecycleDeliveryEnvelope(firstClaim),
    (error) => error.code === "lifecycle_delivery_lease_invalid",
  );
  assert.equal(delivery.markLifecycleDeliveryDelivered(retryClaim), true);

  addSubscription(
    restockId,
    "back_in_stock",
    "restock@example.com",
    "verified-product",
    "SKU-01",
  );
  const restock = delivery.enqueueBackInStockDelivery({
    subscriptionId: restockId,
    dispatchKey: "inventory-event-1",
  });
  const restockDuplicate = delivery.enqueueBackInStockDelivery({
    subscriptionId: restockId,
    dispatchKey: "inventory-event-1",
  });
  assert.equal(restock.job.id, restockDuplicate.job.id);
  const leaseOne = delivery.claimLifecycleDeliveryJobs({ now: new Date(nowIso) })[0];
  database.prepare(
    "UPDATE authority_lifecycle_delivery_outbox SET lease_expires_at = ? WHERE id = ?",
  ).run("2030-07-15T11:59:59.000Z", leaseOne.id);
  const leaseTwo = delivery.claimLifecycleDeliveryJobs({ now: new Date(nowIso) })[0];
  assert.equal(leaseTwo.attempts, 2);
  assert.throws(
    () => lifecycle.resolveLifecycleDeliveryEnvelope(leaseOne),
    (error) => error.code === "lifecycle_delivery_lease_invalid",
  );
  assert.equal(
    lifecycle.resolveLifecycleDeliveryEnvelope(leaseTwo).destinationEmail,
    "restock@example.com",
  );
  assert.equal(delivery.markLifecycleDeliveryDelivered(leaseOne), false);
  assert.equal(delivery.markLifecycleDeliveryDelivered(leaseTwo), true);
  assert.equal(
    database.prepare("SELECT status FROM authority_lifecycle_subscriptions WHERE id = ?")
      .get(restockId).status,
      "subscribed",
  );

  addSubscription(cancelId, "newsletter", "cancel@example.com");
  const cancellable = delivery.enqueueLifecycleDeliveryWithDatabase(database, {
    subscriptionId: cancelId,
    deliveryType: "newsletter_confirmation",
    dispatchKey: "consent-1",
  });
  const cancelledClaim = delivery.claimLifecycleDeliveryJobs({
    now: new Date("2031-01-01T00:00:00.000Z"),
  })[0];
  database.prepare(
    "UPDATE authority_lifecycle_subscriptions SET status = 'unsubscribed', contact_email = '' WHERE id = ?",
  ).run(cancelId);
  assert.equal(
    delivery.cancelLifecycleDeliveriesForSubscriptionWithDatabase(database, cancelId),
    1,
  );
  assert.equal(
    database.prepare("SELECT status FROM authority_lifecycle_delivery_outbox WHERE id = ?")
      .get(cancellable.job.id).status,
    "dead_letter",
  );
  assert.throws(
    () => lifecycle.resolveLifecycleDeliveryEnvelope(cancelledClaim),
    (error) =>
      error.code === "lifecycle_delivery_lease_invalid" ||
      error.code === "lifecycle_consent_inactive",
  );

  const opsJson = JSON.stringify(delivery.getLifecycleDeliveryOpsSnapshot());
  assert.doesNotMatch(opsJson, /person@example|restock@example|cancel@example|token-hash/i);
  assert.match(opsJson, /p\*\*\*@e\*\*\*\.com/);
  assert.equal(delivery.getLifecycleDeliveryOpsSnapshot().metrics.accepted, 2);
  assert.doesNotMatch(opsJson, new RegExp(firstEnvelope.unsubscribeUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const workerId = "44444444-4444-4444-8444-444444444444";
  const workerArId = "66666666-6666-4666-8666-666666666666";
  addSubscription(workerId, "newsletter", "worker@example.com");
  addSubscription(workerArId, "newsletter", "worker-ar@example.com", null, null, "ar");
  delivery.enqueueLifecycleDeliveryWithDatabase(database, {
    subscriptionId: workerId,
    deliveryType: "newsletter_confirmation",
    dispatchKey: "worker-1",
  });
  delivery.enqueueLifecycleDeliveryWithDatabase(database, {
    subscriptionId: workerArId,
    deliveryType: "newsletter_confirmation",
    dispatchKey: "worker-1",
  });
  const sentEnvelopes = [];
  const workerSummary = await emailProvider.drainLifecycleEmailDeliveries({
    adapter: {
      providerKey: "isolated-adapter",
      timeoutMs: 1_000,
      async send(payload, context) {
        sentEnvelopes.push({ payload, context });
        return { providerMessageId: `provider-message-${sentEnvelopes.length}` };
      },
    },
  });
  assert.deepEqual(workerSummary, {
    claimed: 2,
    accepted: 2,
    retried: 0,
    failed: 0,
  });
  assert.equal(sentEnvelopes[0].context.idempotencyKey.length, 64);
  assert.deepEqual(
    sentEnvelopes.map(({ payload }) => ({
      destinationEmail: payload.destinationEmail,
      direction: /<html[^>]+dir="([^"]+)"/u.exec(payload.message.html)?.[1],
      hasSubject: Boolean(payload.message.subject),
      hasRawEnvelope: "unsubscribeUrl" in payload,
    })).sort((left, right) => left.destinationEmail.localeCompare(right.destinationEmail)),
    [
      { destinationEmail: "worker-ar@example.com", direction: "rtl", hasSubject: true, hasRawEnvelope: false },
      { destinationEmail: "worker@example.com", direction: "ltr", hasSubject: true, hasRawEnvelope: false },
    ],
  );
  const acceptedRow = database.prepare(`
    SELECT status, provider_message_id, accepted_at
    FROM authority_lifecycle_delivery_outbox
    WHERE subscription_id = ?
  `).get(workerId);
  assert.equal(acceptedRow.status, "accepted");
  assert.equal(acceptedRow.provider_message_id, "provider-message-1");
  assert.ok(acceptedRow.accepted_at);

  const failedWorkerId = "55555555-5555-4555-8555-555555555555";
  addSubscription(failedWorkerId, "newsletter", "failed-worker@example.com");
  delivery.enqueueLifecycleDeliveryWithDatabase(database, {
    subscriptionId: failedWorkerId,
    deliveryType: "newsletter_confirmation",
    dispatchKey: "worker-1",
  });
  const failedSummary = await emailProvider.drainLifecycleEmailDeliveries({
    adapter: {
      providerKey: "isolated-adapter",
      async send() {
        throw new emailProvider.LifecycleEmailAdapterError({
          code: "provider_rejected",
          retryable: false,
        });
      },
    },
  });
  assert.equal(failedSummary.failed, 1);
  const failedWorkerRow = database.prepare(`
    SELECT status, last_error_code
    FROM authority_lifecycle_delivery_outbox
    WHERE subscription_id = ?
  `).get(failedWorkerId);
  assert.equal(failedWorkerRow.status, "dead_letter");
  assert.equal(failedWorkerRow.last_error_code, "provider_rejected");

  process.env.APP_ENV = "production";
  process.env.PUBLIC_RELEASE_APPROVED = "true";
  process.env.PUBLIC_LEGAL_CONTENT_APPROVED = "true";
  process.env.LIFECYCLE_COLLECTION_ENABLED = "true";
  const callbackSecret = "lifecycle-provider-callback-secret-over-32-characters";
  const eventBody = JSON.stringify({
    eventId: "event-1",
    providerMessageId: `legacy-accepted:${leaseTwo.id}`,
    eventType: "delivered",
    occurredAt: new Date().toISOString(),
  });
  const timestamp = String(Math.floor(Date.now() / 1_000));
  const callbackHeaders = new Headers({
    "content-type": "application/json",
    [callbackAuth.PROVIDER_CALLBACK_TIMESTAMP_HEADER]: timestamp,
    [callbackAuth.PROVIDER_CALLBACK_SIGNATURE_HEADER]:
      callbackAuth.createProviderCallbackSignature(
        callbackSecret,
        timestamp,
        eventBody,
      ),
  });
  const processWebhook = (body = eventBody, headers = callbackHeaders) =>
    emailProvider.processLifecycleEmailProviderWebhook({
      request: new Request("https://example.test/lifecycle-callback", {
        method: "POST",
        headers,
        body,
      }),
      providerKey: "isolated-adapter",
      callbackSecret,
    });
  assert.deepEqual(await processWebhook(), { accepted: true, replayed: false });
  const fulfilledAfterDelivery = database.prepare(`
    SELECT status, fulfilled_at FROM authority_lifecycle_subscriptions WHERE id = ?
  `).get(restockId);
  assert.equal(fulfilledAfterDelivery.status, "fulfilled");
  assert.ok(fulfilledAfterDelivery.fulfilled_at);
  assert.deepEqual(await processWebhook(), { accepted: true, replayed: true });
  assert.equal(
    database.prepare(
      "SELECT fulfilled_at FROM authority_lifecycle_subscriptions WHERE id = ?",
    ).get(restockId).fulfilled_at,
    fulfilledAfterDelivery.fulfilled_at,
  );
  await assert.rejects(
    processWebhook(eventBody, new Headers({
      "content-type": "application/json",
      [callbackAuth.PROVIDER_CALLBACK_TIMESTAMP_HEADER]: timestamp,
      [callbackAuth.PROVIDER_CALLBACK_SIGNATURE_HEADER]: "v1=invalid",
    })),
    (error) => error.code === "provider_callback_signature_invalid",
  );
  const providerEventRow = database.prepare(`
    SELECT event_type, COUNT(*) AS count
    FROM authority_lifecycle_provider_events
    GROUP BY event_type
  `).get();
  assert.equal(providerEventRow.event_type, "delivered");
  assert.equal(providerEventRow.count, 1);
  assert.doesNotMatch(
    JSON.stringify(database.prepare(
      "SELECT * FROM authority_lifecycle_provider_events",
    ).all()),
    /worker@example|unsubscribe|callback-secret/i,
  );
  assert.doesNotMatch(
    JSON.stringify(delivery.getLifecycleDeliveryOpsSnapshot()),
    /worker(?:-ar)?@example|unsubscribe|#token=/i,
  );

  process.env.PUBLIC_RELEASE_APPROVED = "false";
  process.env.PUBLIC_LEGAL_CONTENT_APPROVED = "false";
  process.env.LIFECYCLE_COLLECTION_ENABLED = "false";
  assert.equal(delivery.getLifecycleDeliveryAvailability().available, false);
  process.env.PUBLIC_RELEASE_APPROVED = "true";
  process.env.PUBLIC_LEGAL_CONTENT_APPROVED = "true";
  process.env.LIFECYCLE_COLLECTION_ENABLED = "true";
  assert.equal(delivery.getLifecycleDeliveryAvailability().available, true);

  assert.doesNotMatch(deliverySource, /fetch\s*\(|provider-gateway|dispatchNotification/);
  console.log(
    "Lifecycle delivery dedupe, gates, leases, retries, delivery, cancellation, and redaction passed.",
  );
} finally {
  const database = globalThis.__cozmateksAuthorityDatabase;
  if (database) database.close();
  delete globalThis.__cozmateksAuthorityDatabase;
  delete globalThis.__cozmateksAuthorityDatabasePath;
  delete globalThis.__lifecycleDeliveryTestDeps;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  Object.assign(process.env, originalEnvironment);
  rmSync(workspace, { recursive: true, force: true });
}
