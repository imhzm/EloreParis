import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

/**
 * Guards the fail-closed contract of the public guest-commerce gate.
 *
 * The gate exists so that a copied env template cannot switch commerce on. That
 * held for secrets but not for policy versions: isConfiguredVersion carried its
 * own, shorter placeholder list which omitted `replace` — the exact word every
 * env template in this repo uses. PUBLIC_TERMS_VERSION left at its shipped
 * default would have counted as an approved version and been stamped onto real
 * quotes and orders as the terms the customer agreed to.
 *
 * The two lists are now one. This asserts they stay that way.
 */

const source = readFileSync("src/lib/release-controls.ts", "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const controls = await import(
  "data:text/javascript;base64," + Buffer.from(transpiled).toString("base64")
);

function transpileToDataUrl(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  return "data:text/javascript;base64," + Buffer.from(output).toString("base64");
}

// Everything except the value under test is satisfied, so the assertion is
// isolated to the gate being probed.
const guestCommerceReady = {
  PUBLIC_RELEASE_APPROVED: "true",
  PUBLIC_CATALOG_APPROVED: "true",
  PUBLIC_LEGAL_CONTENT_APPROVED: "true",
  PUBLIC_COMMERCE_ENABLED: "true",
  PUBLIC_TERMS_VERSION: "terms-2026-07-17-v1",
  PUBLIC_PRIVACY_NOTICE_VERSION: "privacy-2026-07-17-v1",
};

const satisfied = {
  ...guestCommerceReady,
  APP_ENV: "production",
  AUTH_PROVIDER_ISSUER: "https://identity.example.com",
  AUTH_PROVIDER_AUTHORIZE_URL: "https://identity.example.com/authorize",
  AUTH_PROVIDER_TOKEN_URL: "https://identity.example.com/token",
  AUTH_PROVIDER_JWKS_URL: "https://identity.example.com/.well-known/jwks.json",
  AUTH_PROVIDER_PROFILE_URL: "https://identity.example.com/profile",
  AUTH_PROVIDER_CLIENT_ID: "elore-live-client",
  AUTH_PROVIDER_CLIENT_SECRET: "a-real-looking-secret-value-1234",
  AUTH_PROVIDER_SCOPE: "openid profile email phone",
};

assert.equal(
  controls.isGuestCommerceAvailable(guestCommerceReady),
  true,
  "Guest checkout must remain available when commerce is ready without an external identity provider",
);
assert.equal(
  controls.isPublicCommerceAvailable(guestCommerceReady),
  true,
  "The backward-compatible public commerce gate must follow guest-commerce readiness",
);
assert.equal(
  controls.isExternalCustomerAuthConfigured(guestCommerceReady),
  false,
  "External customer auth must remain an independent optional-account readiness signal",
);
assert.equal(
  controls.isExternalCustomerAuthConfigured(satisfied),
  true,
  "A complete provider contract must enable the optional customer-account lane",
);

// The vocabulary an unedited template speaks. Every one of these must be
// refused wherever a value is claimed to be "configured".
const templateValues = [
  "replace-with-approved-terms-version",
  "replace-with-a-strong-secret",
  "set-this-to-approved-version",
  "your-terms-version",
  "placeholder",
  "example-version",
  "changeme",
  "todo",
  "",
  "  ",
];

for (const field of ["PUBLIC_TERMS_VERSION", "PUBLIC_PRIVACY_NOTICE_VERSION"]) {
  for (const value of templateValues) {
    assert.equal(
      controls.isPublicCommerceAvailable({ ...satisfied, [field]: value }),
      false,
      `${field}=${JSON.stringify(value)} is an unedited template value and must not satisfy the policy gate`,
    );
  }
}

for (const value of templateValues) {
  assert.equal(
    controls.isExternalCustomerAuthConfigured({
      ...satisfied,
      AUTH_PROVIDER_CLIENT_SECRET: value,
    }),
    false,
    `AUTH_PROVIDER_CLIENT_SECRET=${JSON.stringify(value)} must not count as configured`,
  );
}

for (const requiredField of [
  "AUTH_PROVIDER_ISSUER",
  "AUTH_PROVIDER_AUTHORIZE_URL",
  "AUTH_PROVIDER_TOKEN_URL",
  "AUTH_PROVIDER_JWKS_URL",
  "AUTH_PROVIDER_CLIENT_ID",
]) {
  assert.equal(
    controls.isExternalCustomerAuthConfigured({
      ...satisfied,
      [requiredField]: "",
    }),
    false,
    `${requiredField} is required before optional OIDC account auth is ready`,
  );
}

for (const unsafeProviderUrl of [
  "http://identity.example.com/jwks",
  "https://user:password@identity.example.com/jwks",
  "https://127.0.0.1/jwks",
  "https://10.0.0.8/jwks",
  "https://identity.internal/jwks",
]) {
  assert.equal(
    controls.isExternalCustomerAuthConfigured({
      ...satisfied,
      AUTH_PROVIDER_JWKS_URL: unsafeProviderUrl,
    }),
    false,
    `Unsafe JWKS endpoint ${unsafeProviderUrl} must fail closed`,
  );
}

assert.equal(
  controls.isExternalCustomerAuthConfigured({
    ...satisfied,
    AUTH_PROVIDER_SCOPE: "profile email",
  }),
  false,
  "OIDC readiness requires the openid scope because a signed id_token is mandatory",
);

assert.equal(
  controls.isTrustedProviderUrl("http://127.0.0.1:4071", { APP_ENV: "development" }),
  true,
  "Loopback HTTP provider mocks are allowed only outside production",
);
assert.equal(
  controls.isTrustedProviderUrl("http://127.0.0.1:4071", { APP_ENV: "production" }),
  false,
  "Production provider calls must not target loopback HTTP",
);
for (const requestPath of [
  "https://attacker.example/path",
  "//attacker.example/path",
  "\\\\attacker.example\\path",
  "relative/path",
]) {
  assert.equal(
    controls.isTrustedProviderRequestPath(requestPath),
    false,
    `Outbound provider request path ${requestPath} must not override its trusted base URL`,
  );
}
assert.equal(
  controls.isTrustedProviderRequestPath("/payments/links"),
  true,
  "A normal relative provider API path must remain supported",
);

// Each flag is load-bearing on its own.
for (const flag of [
  "PUBLIC_RELEASE_APPROVED",
  "PUBLIC_CATALOG_APPROVED",
  "PUBLIC_LEGAL_CONTENT_APPROVED",
  "PUBLIC_COMMERCE_ENABLED",
]) {
  assert.equal(
    controls.isPublicCommerceAvailable({ ...satisfied, [flag]: "false" }),
    false,
    `${flag}=false must close the commerce gate on its own`,
  );
  assert.equal(
    controls.isPublicCommerceAvailable({ ...satisfied, [flag]: undefined }),
    false,
    `${flag} unset must close the commerce gate on its own`,
  );
}

// The shipped templates must not be able to open anything.
for (const template of [".env.example", "deploy/hostinger/elore-paris.env.example"]) {
  const parsed = Object.fromEntries(
    readFileSync(template, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );

  assert.equal(
    controls.isPublicCommerceAvailable(parsed),
    false,
    `${template} must not be able to enable commerce as shipped`,
  );
  assert.equal(
    controls.isPublicCatalogApproved(parsed),
    false,
    `${template} must not be able to approve the catalog as shipped`,
  );
}

const publicSiteUrlModuleUrl = transpileToDataUrl(
  readFileSync("src/lib/public-site-url.ts", "utf8"),
);
const searchVisibilitySource = readFileSync(
  "src/lib/search-visibility.ts",
  "utf8",
)
  .replace('"./release-controls"', JSON.stringify(
    "data:text/javascript;base64," + Buffer.from(transpiled).toString("base64"),
  ))
  .replace('"./public-site-url"', JSON.stringify(publicSiteUrlModuleUrl));
const searchVisibility = await import(transpileToDataUrl(searchVisibilitySource));

const indexingReadyEnvironment = {
  APP_ENV: "production",
  NEXT_PUBLIC_SITE_URL: "https://elore-paris.com",
  PUBLIC_RELEASE_APPROVED: "true",
  PUBLIC_CATALOG_APPROVED: "true",
  PUBLIC_DISCOVERY_CONTENT_APPROVED: "true",
  PUBLIC_EDITORIAL_CONTENT_APPROVED: "true",
  PUBLIC_LEGAL_CONTENT_APPROVED: "true",
};

assert.equal(
  searchVisibility.isSearchIndexingEnabled(indexingReadyEnvironment),
  true,
  "A fully approved production release on an explicit hosted HTTPS URL may enable indexing",
);

for (const siteUrl of [
  undefined,
  "",
  "elore-paris.com",
  "http://elore-paris.com",
  "https://localhost",
  "https://shop.localhost",
  "https://0.0.0.0",
  "https://127.0.0.1",
  "https://127.42.0.9",
  "https://[::]",
  "https://[::1]",
  "https://[::ffff:127.0.0.1]",
  "https://10.0.0.8",
  "https://172.16.4.2",
  "https://192.168.1.10",
  "https://169.254.4.8",
  "https://100.64.0.1",
  "https://[fd00::1]",
  "https://[fe80::1]",
  "https://preview.internal",
  "https://brand.test",
  "https://single-label-host",
  "https://user:password@elore-paris.com",
]) {
  assert.equal(
    searchVisibility.isSearchIndexingEnabled({
      ...indexingReadyEnvironment,
      NEXT_PUBLIC_SITE_URL: siteUrl,
    }),
    false,
    `NEXT_PUBLIC_SITE_URL=${JSON.stringify(siteUrl)} must keep indexing fail-closed`,
  );
}

console.log(
  "Release control checks passed: guest commerce is independent from optional customer auth, template values cannot satisfy release gates, and indexing requires an explicit hosted HTTPS site URL.",
);
