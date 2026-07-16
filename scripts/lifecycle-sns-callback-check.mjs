import assert from "node:assert/strict";
import {
  generateKeyPairSync,
  sign,
} from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const workspace = mkdtempSync(path.join(os.tmpdir(), "elore-sns-callback-"));
const databasePath = path.join(workspace, "authority.sqlite");
const originalEnvironment = { ...process.env };
const originalFetch = globalThis.fetch;

function compileModule(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const topicArn = "arn:aws:sns:me-south-1:123456789012:elore-lifecycle";
const certificateUrl =
  "https://sns.me-south-1.amazonaws.com/SimpleNotificationService-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.pem";
const timestamp = "2030-07-15T12:00:00.000Z";
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });

function independentStringToSign(envelope) {
  const fields =
    envelope.Type === "Notification"
      ? [
          ["Message", envelope.Message],
          ["MessageId", envelope.MessageId],
          ...(envelope.Subject ? [["Subject", envelope.Subject]] : []),
          ["Timestamp", envelope.Timestamp],
          ["TopicArn", envelope.TopicArn],
          ["Type", envelope.Type],
        ]
      : [
          ["Message", envelope.Message],
          ["MessageId", envelope.MessageId],
          ["SubscribeURL", envelope.SubscribeURL],
          ["Timestamp", envelope.Timestamp],
          ["Token", envelope.Token],
          ["TopicArn", envelope.TopicArn],
          ["Type", envelope.Type],
        ];
  return fields.map(([name, value]) => `${name}\n${value}\n`).join("");
}

function signedEnvelope({
  messageId,
  message,
  type = "Notification",
  topic = topicArn,
  certUrl = certificateUrl,
  signatureVersion = "2",
  subject,
}) {
  const envelope = {
    Type: type,
    MessageId: messageId,
    TopicArn: topic,
    Message: message,
    Timestamp: timestamp,
    SignatureVersion: signatureVersion,
    Signature: "pending",
    SigningCertURL: certUrl,
    ...(subject ? { Subject: subject } : {}),
    ...(type === "Notification"
      ? {
          UnsubscribeURL:
            "https://sns.me-south-1.amazonaws.com/?Action=Unsubscribe",
        }
      : {
          Token: "signed-confirmation-token",
          SubscribeURL:
            "https://sns.me-south-1.amazonaws.com/?Action=ConfirmSubscription",
        }),
  };
  envelope.Signature = sign(
    signatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1",
    Buffer.from(independentStringToSign(envelope), "utf8"),
    privateKey,
  ).toString("base64");
  return envelope;
}

function sesMessage(eventType, providerMessageId, eventTimestamp = timestamp) {
  const detailKey =
    eventType === "Delivery"
      ? "delivery"
      : eventType === "Bounce"
        ? "bounce"
        : eventType === "Complaint"
          ? "complaint"
          : "send";
  return JSON.stringify({
    eventType,
    mail: { messageId: providerMessageId, timestamp },
    [detailKey]: { timestamp: eventTimestamp },
  });
}

function requestFor(envelope, contentType = "text/plain; charset=UTF-8") {
  return new Request("https://elore-paris.com/api/providers/lifecycle/ses-sns", {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(envelope),
  });
}

try {
  process.env.APP_ENV = "local";
  process.env.NODE_ENV = "production";
  process.env.AUTHORITY_DB_PATH = databasePath;

  let authoritySource = readFileSync("src/lib/authority-database.ts", "utf8");
  authoritySource = authoritySource
    .replace('import "server-only";', "")
    .replace(
      'import { resolveProjectPath } from "@/lib/runtime-paths";',
      "const resolveProjectPath = (value) => path.resolve(process.cwd(), value);",
    );
  const authority = await compileModule(authoritySource);

  globalThis.__snsCallbackTestDeps = {
    authority,
    delivery: {
      cancelLifecycleDeliveriesForSubscriptionWithDatabase(database, subscriptionId) {
        return Number(
          database.prepare(`
            UPDATE authority_lifecycle_delivery_outbox
            SET status = 'dead_letter', last_error_code = 'consent_inactive'
            WHERE subscription_id = ?
              AND status IN ('pending', 'processing', 'failed')
          `).run(subscriptionId).changes,
        );
      },
      claimLifecycleDeliveryJobs() {
        return [];
      },
      getLifecycleDeliveryAvailability() {
        return { available: false, code: "disabled" };
      },
      markLifecycleDeliveryAccepted() {
        return false;
      },
      markLifecycleDeliveryFailed() {
        return false;
      },
    },
  };

  let providerSource = readFileSync("src/lib/lifecycle-email-provider.ts", "utf8");
  providerSource = providerSource
    .replace('import "server-only";', "")
    .replace(
      'import { runAuthorityTransaction } from "@/lib/authority-database";',
      "const { runAuthorityTransaction } = globalThis.__snsCallbackTestDeps.authority;",
    )
    .replace(
      /import \{\s*resolveLifecycleDeliveryEnvelope,\s*\} from "@\/lib\/lifecycle-consent-authority";/,
      "const resolveLifecycleDeliveryEnvelope = () => { throw new Error('not used'); };",
    )
    .replace(
      /import \{\s*cancelLifecycleDeliveriesForSubscriptionWithDatabase,\s*claimLifecycleDeliveryJobs,\s*getLifecycleDeliveryAvailability,\s*markLifecycleDeliveryAccepted,\s*markLifecycleDeliveryFailed,\s*type ClaimedLifecycleDelivery,\s*\} from "@\/lib\/lifecycle-delivery-outbox";/,
      "const { cancelLifecycleDeliveriesForSubscriptionWithDatabase, claimLifecycleDeliveryJobs, getLifecycleDeliveryAvailability, markLifecycleDeliveryAccepted, markLifecycleDeliveryFailed } = globalThis.__snsCallbackTestDeps.delivery;",
    )
    .replace(
      /import \{\s*renderLifecycleEmail,\s*type RenderedLifecycleEmail,\s*\} from "@\/lib\/lifecycle-email-templates";/,
      "const renderLifecycleEmail = () => { throw new Error('not used'); };",
    )
    .replace(
      /import \{\s*ProviderEventAuthorityError,\s*readAuthenticatedProviderCallback,\s*\} from "@\/lib\/provider-event-authority";/,
      "class ProviderEventAuthorityError extends Error {}; const readAuthenticatedProviderCallback = () => { throw new Error('not used'); };",
    );
  const emailProvider = await compileModule(providerSource);
  globalThis.__snsCallbackTestDeps.emailProvider = emailProvider;

  let snsSource = readFileSync(
    "src/lib/aws-sns-lifecycle-callback.ts",
    "utf8",
  );
  snsSource = snsSource
    .replace('import "server-only";', "")
    .replace(
      'import { runAuthorityTransaction } from "@/lib/authority-database";',
      "const { runAuthorityTransaction } = globalThis.__snsCallbackTestDeps.authority;",
    )
    .replace(
      /import \{\s*processLifecycleEmailProviderEventWithDatabase,\s*\} from "@\/lib\/lifecycle-email-provider";/,
      "const { processLifecycleEmailProviderEventWithDatabase } = globalThis.__snsCallbackTestDeps.emailProvider;",
    );
  const sns = await compileModule(snsSource);
  const database = authority.getAuthorityDatabase();

  const insertSubscription = database.prepare(`
    INSERT INTO authority_lifecycle_subscriptions (
      id, kind, contact_email, contact_hash, scope_key, product_slug, sku,
      source, status, consent_policy_version, locale, consent_action,
      consent_granted_at, consent_withdrawn_at, fulfilled_at,
      unsubscribe_token_hash, created_at, updated_at, consent_revision
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'test', 'subscribed', 'privacy-v1', 'en',
      'affirmative_form_submit', ?, NULL, NULL, ?, ?, ?, 1)
  `);
  const insertDelivery = database.prepare(`
    INSERT INTO authority_lifecycle_delivery_outbox (
      id, subscription_id, consent_revision, delivery_type, dispatch_key,
      dedupe_key, provider_key, provider_message_id, status, attempts,
      next_attempt_at, lease_token, lease_expires_at, last_error_code,
      created_at, updated_at, accepted_at
    ) VALUES (?, ?, 1, ?, 'sns-test', ?, 'aws-ses', ?, 'accepted', 1,
      ?, NULL, NULL, NULL, ?, ?, ?)
  `);
  function addAccepted({ id, kind, deliveryType, providerMessageId, email }) {
    const productSlug = kind === "back_in_stock" ? "verified-product" : null;
    const sku = kind === "back_in_stock" ? "SKU-01" : null;
    insertSubscription.run(
      id,
      kind,
      email,
      `hash-${id}`,
      kind === "newsletter" ? "newsletter" : `${productSlug}:${sku}`,
      productSlug,
      sku,
      timestamp,
      `token-${id}`,
      timestamp,
      timestamp,
    );
    insertDelivery.run(
      `delivery-${id}`,
      id,
      deliveryType,
      `dedupe-${id}`,
      providerMessageId,
      timestamp,
      timestamp,
      timestamp,
      timestamp,
    );
  }

  addAccepted({
    id: "11111111-1111-4111-8111-111111111111",
    kind: "back_in_stock",
    deliveryType: "back_in_stock_available",
    providerMessageId: "ses-delivery-1",
    email: "restock@example.com",
  });
  addAccepted({
    id: "22222222-2222-4222-8222-222222222222",
    kind: "newsletter",
    deliveryType: "newsletter_confirmation",
    providerMessageId: "ses-bounce-1",
    email: "bounce@example.com",
  });
  addAccepted({
    id: "33333333-3333-4333-8333-333333333333",
    kind: "newsletter",
    deliveryType: "newsletter_confirmation",
    providerMessageId: "ses-complaint-1",
    email: "complaint@example.com",
  });

  let certificateLoads = 0;
  const certificateLoader = async (url, signal) => {
    certificateLoads += 1;
    assert.equal(url.toString(), certificateUrl);
    assert.equal(signal.aborted, false);
    return publicKeyPem;
  };
  const processEnvelope = (envelope) =>
    sns.processAwsSnsLifecycleCallback({
      request: requestFor(envelope),
      expectedTopicArn: topicArn,
      expectedRegion: "me-south-1",
      certificateLoader,
    });

  const deliveryEnvelope = signedEnvelope({
    messageId: "sns-delivery-event-1",
    message: sesMessage("Delivery", "ses-delivery-1"),
    subject: "SES delivery",
  });
  assert.equal(
    sns.createAwsSnsStringToSign(deliveryEnvelope),
    independentStringToSign(deliveryEnvelope),
  );
  assert.deepEqual(await processEnvelope(deliveryEnvelope), {
    accepted: true,
    replayed: false,
    messageType: "Notification",
  });
  assert.equal(
    database.prepare(
      "SELECT status FROM authority_lifecycle_subscriptions WHERE id = ?",
    ).get("11111111-1111-4111-8111-111111111111").status,
    "fulfilled",
  );
  assert.deepEqual(await processEnvelope(deliveryEnvelope), {
    accepted: true,
    replayed: true,
    messageType: "Notification",
  });
  assert.equal(
    database.prepare(
      "SELECT COUNT(*) AS count FROM authority_lifecycle_sns_messages",
    ).get().count,
    1,
  );

  const bounceEnvelope = signedEnvelope({
    messageId: "sns-bounce-event-1",
    message: sesMessage("Bounce", "ses-bounce-1"),
    signatureVersion: "1",
  });
  assert.deepEqual(await processEnvelope(bounceEnvelope), {
    accepted: true,
    replayed: false,
    messageType: "Notification",
  });
  assert.equal(
    database.prepare(
      "SELECT event_type FROM authority_lifecycle_provider_events WHERE event_id = ?",
    ).get("sns-bounce-event-1").event_type,
    "bounced",
  );

  const complaintEnvelope = signedEnvelope({
    messageId: "sns-complaint-event-1",
    message: sesMessage("Complaint", "ses-complaint-1"),
  });
  await processEnvelope(complaintEnvelope);
  assert.deepEqual(
    { ...database.prepare(`
      SELECT status, contact_email FROM authority_lifecycle_subscriptions
      WHERE id = ?
    `).get("33333333-3333-4333-8333-333333333333") },
    { status: "unsubscribed", contact_email: "" },
  );

  const changedDeliveryEnvelope = signedEnvelope({
    messageId: "sns-delivery-event-1",
    message: sesMessage("Delivery", "ses-bounce-1"),
  });
  await assert.rejects(
    processEnvelope(changedDeliveryEnvelope),
    (error) => error.code === "sns_message_conflict" && error.statusCode === 409,
  );

  const loadsBeforeTopicRejection = certificateLoads;
  const wrongTopicEnvelope = signedEnvelope({
    messageId: "wrong-topic",
    message: sesMessage("Delivery", "ses-delivery-1"),
    topic: "arn:aws:sns:me-south-1:123456789012:other-topic",
  });
  await assert.rejects(
    processEnvelope(wrongTopicEnvelope),
    (error) => error.code === "sns_topic_unauthorized" && error.statusCode === 403,
  );
  assert.equal(certificateLoads, loadsBeforeTopicRejection);

  const wrongCertificateEnvelope = signedEnvelope({
    messageId: "wrong-certificate",
    message: sesMessage("Delivery", "ses-delivery-1"),
    certUrl:
      "https://sns.me-south-1.amazonaws.com.attacker.test/SimpleNotificationService-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.pem",
  });
  await assert.rejects(
    processEnvelope(wrongCertificateEnvelope),
    (error) => error.code === "sns_signing_certificate_invalid",
  );
  assert.equal(certificateLoads, loadsBeforeTopicRejection);

  const invalidSignatureEnvelope = signedEnvelope({
    messageId: "invalid-signature",
    message: sesMessage("Delivery", "ses-delivery-1"),
  });
  invalidSignatureEnvelope.Signature = Buffer.alloc(256, 1).toString("base64");
  await assert.rejects(
    processEnvelope(invalidSignatureEnvelope),
    (error) => error.code === "sns_signature_invalid" && error.statusCode === 401,
  );
  assert.equal(
    database.prepare(
      "SELECT COUNT(*) AS count FROM authority_lifecycle_sns_messages WHERE message_id = ?",
    ).get("invalid-signature").count,
    0,
  );

  globalThis.fetch = async () => {
    throw new Error("A confirmation URL or live certificate fetch was attempted.");
  };
  const confirmationEnvelope = signedEnvelope({
    messageId: "subscription-confirmation-1",
    message: "You have chosen to subscribe.",
    type: "SubscriptionConfirmation",
  });
  assert.deepEqual(await processEnvelope(confirmationEnvelope), {
    accepted: true,
    replayed: false,
    messageType: "SubscriptionConfirmation",
    confirmationRequired: true,
  });
  assert.deepEqual(await processEnvelope(confirmationEnvelope), {
    accepted: true,
    replayed: true,
    messageType: "SubscriptionConfirmation",
    confirmationRequired: true,
  });

  const unsupportedEnvelope = signedEnvelope({
    messageId: "unsupported-ses-event",
    message: sesMessage("Send", "ses-delivery-1"),
  });
  await assert.rejects(
    processEnvelope(unsupportedEnvelope),
    (error) => error.code === "ses_event_type_unsupported",
  );
  assert.equal(
    database.prepare(
      "SELECT COUNT(*) AS count FROM authority_lifecycle_sns_messages WHERE message_id = ?",
    ).get("unsupported-ses-event").count,
    0,
  );

  await assert.rejects(
    sns.processAwsSnsLifecycleCallback({
      request: new Request("https://elore-paris.com/api/providers/lifecycle/ses-sns", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "x".repeat(257 * 1024),
      }),
      expectedTopicArn: topicArn,
      expectedRegion: "me-south-1",
      certificateLoader,
    }),
    (error) => error.code === "sns_callback_body_too_large" && error.statusCode === 413,
  );
  await assert.rejects(
    sns.processAwsSnsLifecycleCallback({
      request: requestFor(deliveryEnvelope, "application/x-www-form-urlencoded"),
      expectedTopicArn: topicArn,
      expectedRegion: "me-south-1",
      certificateLoader,
    }),
    (error) => error.code === "sns_callback_content_type_invalid" && error.statusCode === 415,
  );

  const snsRows = JSON.stringify(
    database.prepare("SELECT * FROM authority_lifecycle_sns_messages").all(),
  );
  assert.doesNotMatch(
    snsRows,
    /restock@example|bounce@example|complaint@example|signed-confirmation-token|ConfirmSubscription/u,
  );
  assert.equal(
    database.prepare(
      "SELECT COUNT(*) AS count FROM authority_lifecycle_provider_events",
    ).get().count,
    3,
  );

  const routeSource = readFileSync(
    "src/app/api/providers/lifecycle/ses-sns/route.ts",
    "utf8",
  );
  assert.match(routeSource, /LIFECYCLE_SES_SNS_TOPIC_ARN/u);
  assert.match(routeSource, /processAwsSnsLifecycleCallback/u);
  assert.doesNotMatch(routeSource, /SubscribeURL|ConfirmSubscription|console\./u);

  console.log(
    "SNS topic/certificate/signature validation, SES mapping, atomic dedupe, and safe confirmation handling passed.",
  );
} finally {
  globalThis.fetch = originalFetch;
  const database = globalThis.__cozmateksAuthorityDatabase;
  if (database) database.close();
  delete globalThis.__cozmateksAuthorityDatabase;
  delete globalThis.__cozmateksAuthorityDatabasePath;
  delete globalThis.__snsCallbackTestDeps;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  Object.assign(process.env, originalEnvironment);
  rmSync(workspace, { recursive: true, force: true });
}
