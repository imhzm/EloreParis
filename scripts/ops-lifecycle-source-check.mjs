import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const route = readFileSync("src/app/api/ops/lifecycle/route.ts", "utf8");
const access = readFileSync("src/lib/ops-access.ts", "utf8");
const surface = readFileSync("src/components/ops-lifecycle-consent-surface.tsx", "utf8");
const notifications = readFileSync("src/components/ops-notifications-surface.tsx", "utf8");
const deliverySurface = readFileSync(
  "src/components/ops-lifecycle-delivery-outbox-surface.tsx",
  "utf8",
);
const deliveryStyles = readFileSync(
  "src/components/ops-lifecycle-delivery-outbox-surface.module.css",
  "utf8",
);
const providerReadinessSource = readFileSync(
  "src/lib/lifecycle-provider-readiness.ts",
  "utf8",
);

assert.match(route, /assertOpsRequestAccess\(request, "\/ops\/notifications"\)/);
assert.ok(
  route.indexOf("assertOpsRequestAccess") < route.indexOf("getLifecycleOpsSnapshot(limit)"),
  "Ops authorization must run before lifecycle data is read.",
);
assert.match(access, /pathname\.startsWith\("\/api\/ops\/lifecycle"\)[\s\S]*?return "\/ops\/notifications"/);
assert.match(route, /maskedContactHint\(entry\.contactHint\)/);
assert.match(route, /Cache-Control": "no-store"/);
assert.doesNotMatch(route, /contact_email|unsubscribe_token|rawProfile|payload_json/);
assert.doesNotMatch(route, /\.\.\.entry|lifecycle:\s*snapshot/);
assert.match(route, /getLifecycleDeliveryOpsSnapshot\(limit\)/);
assert.match(route, /deliveryOutbox:\s*\{/);
assert.match(route, /getLifecycleProviderReadiness\(\)/);
assert.match(route, /providerReadiness:\s*\{/);
assert.ok(
  route.indexOf("assertOpsRequestAccess") <
    route.indexOf("getLifecycleDeliveryOpsSnapshot(limit)"),
  "Ops authorization must run before lifecycle delivery data is read.",
);
for (const metric of ["pending", "processing", "accepted", "failed", "deadLetter"]) {
  assert.ok(route.includes(metric), `Lifecycle route is missing delivery metric: ${metric}`);
}

for (const state of ["isLoading", "role=\"alert\"", "filteredRecords.length > 0", "لا توجد سجلات lifecycle"]) {
  assert.ok(surface.includes(state), `Lifecycle surface is missing state: ${state}`);
}
for (const status of ["subscribed", "unsubscribed", "fulfilled"]) {
  assert.ok(surface.includes(status), `Lifecycle surface is missing status: ${status}`);
}
assert.doesNotMatch(surface, /contactEmail|rawEmail|unsubscribeToken|providerToken/);
assert.match(notifications, /<OpsLifecycleConsentSurface \/>/);
assert.match(notifications, /<OpsLifecycleDeliveryOutboxSurface \/>/);

assert.match(deliverySurface, /fetch\("\/api\/ops\/lifecycle\?limit=50"/);
for (const state of ["isLoading", 'role="alert"', "filteredRecords.length > 0", "لا توجد أحداث lifecycle delivery"]) {
  assert.ok(deliverySurface.includes(state), `Delivery outbox surface is missing state: ${state}`);
}
for (const status of ["pending", "processing", "accepted", "failed", "dead_letter"]) {
  assert.ok(deliverySurface.includes(status), `Delivery outbox surface is missing status: ${status}`);
}
for (const evidence of ["attempts", "maxAttempts", "nextAttemptAt", "leaseExpiresAt", "lastErrorCode"]) {
  assert.ok(deliverySurface.includes(evidence), `Delivery outbox surface is missing retry evidence: ${evidence}`);
}
assert.match(deliverySurface, /safeMaskedDestination\(record\.contactHint\)/);
assert.doesNotMatch(deliverySurface, /contactEmail|rawEmail|unsubscribeToken|providerToken|payloadJson|payload_json/);
assert.doesNotMatch(deliverySurface, /providerEvents|Delivered|deliveredAt|تسليمات مكتملة/);
for (const field of [
  "ready",
  "deliveryEnabled",
  "providerEnabled",
  "selectedProvider",
  "providerSupported",
  "region",
  "regionConfigured",
  "fromDomainConfigured",
  "configurationSetConfigured",
  "timeoutValid",
  "timeoutOverrideConfigured",
  "callbackConfigured",
  "blockers",
]) {
  assert.ok(deliverySurface.includes(field), `Provider readiness UI is missing field: ${field}`);
  assert.ok(route.includes(field), `Provider readiness projection is missing field: ${field}`);
}
for (const key of [
  "LIFECYCLE_DELIVERY_PROVIDER_KEY",
  "LIFECYCLE_SES_REGION",
  "LIFECYCLE_SES_FROM_EMAIL",
  "LIFECYCLE_SES_CONFIGURATION_SET",
  "LIFECYCLE_SES_TIMEOUT_MS",
  "LIFECYCLE_SES_SNS_TOPIC_ARN",
]) {
  assert.ok(providerReadinessSource.includes(key), `Provider readiness helper is missing env key: ${key}`);
}
for (const blocker of [
  "lifecycle_provider_region_unconfigured",
  "lifecycle_provider_from_domain_unconfigured",
  "lifecycle_provider_configuration_set_unconfigured",
  "lifecycle_provider_timeout_invalid",
  "lifecycle_provider_callback_unconfigured",
]) {
  assert.ok(providerReadinessSource.includes(blocker), `Provider readiness helper is missing blocker: ${blocker}`);
}
assert.doesNotMatch(route, /LIFECYCLE_SES_FROM_EMAIL|LIFECYCLE_SES_SNS_TOPIC_ARN|fromEmail|snsTopicArn|callbackSecret|configurationSetValue/);
assert.doesNotMatch(deliverySurface, /fromEmail|snsTopicArn|callbackSecret|configurationSetValue/);
assert.match(deliveryStyles, /@media \(max-width: 760px\)/);
assert.match(deliveryStyles, /@media \(max-width: 480px\)/);

const compiledProviderReadiness = ts.transpileModule(
  providerReadinessSource.replace('import "server-only";', ""),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const readinessModule = await import(
  `data:text/javascript;base64,${Buffer.from(compiledProviderReadiness).toString("base64")}`
);
const validProviderEnvironment = {
  LIFECYCLE_DELIVERY_ENABLED: "true",
  LIFECYCLE_DELIVERY_PROVIDER_ENABLED: "true",
  LIFECYCLE_DELIVERY_PROVIDER_KEY: "aws-ses",
  LIFECYCLE_SES_REGION: "me-south-1",
  LIFECYCLE_SES_FROM_EMAIL: "lifecycle@elore-paris.com",
  LIFECYCLE_SES_CONFIGURATION_SET: "elore-lifecycle-production",
  LIFECYCLE_SES_SNS_TOPIC_ARN:
    "arn:aws:sns:me-south-1:123456789012:elore-lifecycle-events",
};
const ready = readinessModule.getLifecycleProviderReadiness(
  validProviderEnvironment,
);
assert.equal(ready.ready, true);
assert.equal(ready.callbackConfigured, true);
assert.equal(ready.timeoutValid, true);
assert.equal(ready.timeoutOverrideConfigured, false);
assert.deepEqual(ready.blockers, []);
assert.doesNotMatch(
  JSON.stringify(ready),
  /lifecycle@elore-paris\.com|123456789012|elore-lifecycle-events|elore-lifecycle-production/u,
  "Provider readiness output must not expose sender, SNS account/topic, or configuration-set values.",
);

const invalid = readinessModule.getLifecycleProviderReadiness({
  ...validProviderEnvironment,
  LIFECYCLE_SES_TIMEOUT_MS: "30001",
  LIFECYCLE_SES_SNS_TOPIC_ARN:
    "arn:aws:sns:eu-west-1:123456789012:elore-lifecycle-events",
});
assert.equal(invalid.ready, false);
assert.equal(invalid.timeoutValid, false);
assert.equal(invalid.timeoutOverrideConfigured, true);
assert.equal(invalid.callbackConfigured, false);
assert.ok(invalid.blockers.includes("lifecycle_provider_timeout_invalid"));
assert.ok(invalid.blockers.includes("lifecycle_provider_callback_unconfigured"));

console.log("Protected ops lifecycle source checks passed.");
