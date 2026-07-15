import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
const providerReadiness = readFileSync(
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
for (const field of ["selectedProvider", "region", "fromDomainConfigured", "configurationSetConfigured", "callbackConfigured", "blockers"]) {
  assert.ok(deliverySurface.includes(field), `Provider readiness UI is missing field: ${field}`);
  assert.ok(route.includes(field), `Provider readiness projection is missing field: ${field}`);
}
for (const key of ["LIFECYCLE_DELIVERY_PROVIDER_KEY", "LIFECYCLE_SES_REGION", "LIFECYCLE_SES_FROM_EMAIL", "LIFECYCLE_SES_CONFIGURATION_SET"]) {
  assert.ok(providerReadiness.includes(key), `Provider readiness helper is missing env key: ${key}`);
}
for (const blocker of ["lifecycle_provider_region_unconfigured", "lifecycle_provider_from_domain_unconfigured", "lifecycle_provider_configuration_set_unconfigured", "lifecycle_provider_callback_unconfigured"]) {
  assert.ok(providerReadiness.includes(blocker), `Provider readiness helper is missing blocker: ${blocker}`);
}
assert.doesNotMatch(route, /LIFECYCLE_SES_FROM_EMAIL|fromEmail|callbackSecret|configurationSetValue/);
assert.doesNotMatch(deliverySurface, /fromEmail|callbackSecret|configurationSetValue/);
assert.match(deliveryStyles, /@media \(max-width: 760px\)/);
assert.match(deliveryStyles, /@media \(max-width: 480px\)/);

console.log("Protected ops lifecycle source checks passed.");
