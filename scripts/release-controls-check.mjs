import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

/**
 * Guards the fail-closed contract of the public commerce gate.
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

// Everything except the value under test is satisfied, so the assertion is
// isolated to the gate being probed.
const satisfied = {
  PUBLIC_RELEASE_APPROVED: "true",
  PUBLIC_CATALOG_APPROVED: "true",
  PUBLIC_LEGAL_CONTENT_APPROVED: "true",
  PUBLIC_COMMERCE_ENABLED: "true",
  AUTH_PROVIDER_AUTHORIZE_URL: "https://id.idp-host.test/authorize",
  AUTH_PROVIDER_TOKEN_URL: "https://id.idp-host.test/token",
  AUTH_PROVIDER_CLIENT_ID: "elore-live-client",
  AUTH_PROVIDER_CLIENT_SECRET: "a-real-looking-secret-value-1234",
  PUBLIC_TERMS_VERSION: "terms-2026-07-17-v1",
  PUBLIC_PRIVACY_NOTICE_VERSION: "privacy-2026-07-17-v1",
};

assert.equal(
  controls.isPublicCommerceAvailable(satisfied),
  true,
  "A fully configured environment must be able to reach commerce, or the gate is not a gate but a wall",
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

console.log(
  "Release control checks passed: template values cannot satisfy the commerce, policy, or auth gates.",
);
