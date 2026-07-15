import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const authPath = resolve(root, "src/lib/provider-callback-auth.ts");
const authSource = readFileSync(authPath, "utf8");
const compiledAuth = ts.transpileModule(authSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: authPath,
}).outputText;
const authModule = await import(
  `data:text/javascript;base64,${Buffer.from(compiledAuth).toString("base64")}`
);

const {
  authenticateProviderCallback,
  createProviderCallbackSignature,
  PROVIDER_CALLBACK_SIGNATURE_HEADER,
  PROVIDER_CALLBACK_TIMESTAMP_HEADER,
} = authModule;

const secret = "provider-test-secret";
const rawBody = JSON.stringify({ eventId: "evt-1", status: "sent" });
const now = Date.UTC(2026, 6, 15, 12, 0, 0);
const timestamp = String(Math.floor(now / 1000));
const signature = createProviderCallbackSignature(secret, timestamp, rawBody);

function authenticate(headers, options = {}) {
  return authenticateProviderCallback({
    headers: new Headers(headers),
    rawBody,
    secret,
    now,
    environment: options.environment ?? {},
  });
}

assert.deepEqual(
  authenticate({ authorization: `Bearer ${secret}` }),
  { ok: true, mode: "legacy_bearer" },
  "development compatibility must retain legacy Bearer callbacks",
);
assert.deepEqual(
  authenticate(
    { authorization: `Bearer ${secret}` },
    { environment: { APP_ENV: "development", NODE_ENV: "production" } },
  ),
  { ok: true, mode: "legacy_bearer" },
  "an explicit development APP_ENV must override standalone NODE_ENV",
);
assert.equal(
  authenticate({ authorization: "Bearer wrong" }).ok,
  false,
  "legacy Bearer callbacks must reject an incorrect secret",
);

const productionEnvironment = { NODE_ENV: "production" };
assert.equal(
  authenticate(
    { authorization: `Bearer ${secret}` },
    { environment: productionEnvironment },
  ).ok,
  false,
  "production must not silently accept legacy Bearer callbacks",
);
assert.deepEqual(
  authenticate(
    {
      [PROVIDER_CALLBACK_TIMESTAMP_HEADER]: timestamp,
      [PROVIDER_CALLBACK_SIGNATURE_HEADER]: signature,
    },
    { environment: productionEnvironment },
  ),
  { ok: true, mode: "hmac" },
  "a current signature over the exact raw body must authenticate",
);

const tampered = authenticateProviderCallback({
  headers: new Headers({
    [PROVIDER_CALLBACK_TIMESTAMP_HEADER]: timestamp,
    [PROVIDER_CALLBACK_SIGNATURE_HEADER]: signature,
  }),
  rawBody: `${rawBody} `,
  secret,
  now,
  environment: productionEnvironment,
});
assert.equal(tampered.ok, false, "raw-body tampering must invalidate the signature");
assert.equal(
  authenticate(
    {
      [PROVIDER_CALLBACK_TIMESTAMP_HEADER]: String(Number(timestamp) - 301),
      [PROVIDER_CALLBACK_SIGNATURE_HEADER]: signature,
    },
    { environment: productionEnvironment },
  ).ok,
  false,
  "stale callback timestamps must be rejected",
);
assert.equal(
  authenticate(
    {
      [PROVIDER_CALLBACK_TIMESTAMP_HEADER]: String(Number(timestamp) + 301),
      [PROVIDER_CALLBACK_SIGNATURE_HEADER]: signature,
    },
    { environment: productionEnvironment },
  ).ok,
  false,
  "future callback timestamps outside the skew window must be rejected",
);
assert.deepEqual(
  authenticate(
    {},
    {
      environment: {
        PROVIDER_CALLBACK_HMAC_REQUIRED: "true",
        PROVIDER_CALLBACK_MAX_SKEW_SECONDS: "9999",
      },
    },
  ),
  {
    ok: false,
    code: "provider_callback_auth_config_invalid",
    statusCode: 503,
  },
  "unsafe skew configuration must fail closed",
);
assert.deepEqual(
  authenticate(
    {},
    { environment: { PROVIDER_CALLBACK_HMAC_REQUIRED: "treu" } },
  ),
  {
    ok: false,
    code: "provider_callback_auth_config_invalid",
    statusCode: 503,
  },
  "an invalid HMAC mode must fail closed instead of enabling legacy auth",
);

const routePaths = [
  "src/app/api/providers/payment/route.ts",
  "src/app/api/providers/shipping/route.ts",
  "src/app/api/providers/notifications/route.ts",
];
for (const routePath of routePaths) {
  const source = readFileSync(resolve(root, routePath), "utf8");
  assert.match(
    source,
    /readAuthenticatedProviderCallback\s*\(/,
    `${routePath} must authenticate the bounded raw body before parsing`,
  );
  assert.doesNotMatch(
    source,
    /function\s+isAuthorizedProviderCallback/,
    `${routePath} must not retain an independent Bearer-only auth path`,
  );
}

const notificationRoute = readFileSync(
  resolve(root, "src/app/api/providers/notifications/route.ts"),
  "utf8",
);
assert.match(notificationRoute, /inspectAuthorityProviderEvent\s*\(/);
assert.match(notificationRoute, /recordAuthorityProviderEvent\s*\(/);
assert.match(notificationRoute, /authenticationMode\s*===\s*"hmac"/);

console.log("Provider callback HMAC and replay-security checks passed.");
