import assert from "node:assert/strict";
import {
  createHash,
  createHmac,
  createSign,
  generateKeyPairSync,
  randomBytes,
} from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const serverFile = path.resolve(root, ".next/standalone/server.js");
const databasePath = path.resolve(
  root,
  `.data/provider-auth-security-check-${process.pid}.sqlite`,
);
const appBaseUrl = "http://127.0.0.1:3074";
const orderSecret = "provider-auth-order-authority-secret";
const authSecret = "provider-auth-callback-signing-secret";
const clientId = "provider-auth-security-client";
const clientSecret = "provider-auth-security-client-secret";
const keyA = generateKeyPairSync("rsa", { modulusLength: 2048 });
const keyB = generateKeyPairSync("rsa", { modulusLength: 2048 });
const rogueKey = generateKeyPairSync("rsa", { modulusLength: 2048 });

function exportSigningJwk(keyPair, kid) {
  return {
    ...keyPair.publicKey.export({ format: "jwk" }),
    alg: "RS256",
    kid,
    key_ops: ["verify"],
    use: "sig",
  };
}

const publicKeyA = exportSigningJwk(keyA, "key-a");
const publicKeyB = exportSigningJwk(keyB, "key-b");

if (!existsSync(serverFile)) {
  throw new Error("Standalone build is missing. Run `npm run build` first.");
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signToken(payload, secret) {
  const encodedPayload = base64UrlJson(payload);
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function buildIdToken({ issuer, subject, nonce, scenario }) {
  const header = base64UrlJson({
    alg: scenario.alg,
    kid: scenario.kid,
    typ: "JWT",
  });
  const payload = base64UrlJson({
    iss: issuer,
    sub: subject,
    aud: clientId,
    nonce,
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
    ...scenario.claimOverrides,
  });
  const signingInput = `${header}.${payload}`;
  const signature = scenario.alg === "RS256"
    ? createSign("RSA-SHA256")
        .update(signingInput)
        .end()
        .sign(scenario.signingKey)
        .toString("base64url")
    : createHmac("sha256", "algorithm-confusion-secret")
        .update(signingInput)
        .digest("base64url");

  return `${signingInput}.${signature}`;
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk.toString();
  return body;
}

async function removeDatabaseFiles() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const filePath = `${databasePath}${suffix}`;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        rmSync(filePath, { force: true });
        break;
      } catch (error) {
        if (error?.code !== "EBUSY") throw error;
        if (attempt === 19) {
          console.warn(`Deferred cleanup for locked SQLite test file: ${filePath}`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }
}

let activeSubject = "customer-subject-01";
let nextTokenScenario = {
  alg: "RS256",
  claimOverrides: {},
  kid: "key-a",
  omitIdToken: false,
  signingKey: keyA.privateKey,
  wrongNonce: false,
};
let publishedJwks = [publicKeyA];
let jwksFailure = false;
let jwksFetchCount = 0;
let profileFetchCount = 0;
const authorizationCodes = new Map();
const accessTokens = new Map();
let providerBaseUrl = "";

function setNextTokenScenario(overrides = {}) {
  nextTokenScenario = {
    alg: "RS256",
    claimOverrides: {},
    kid: "key-a",
    omitIdToken: false,
    signingKey: keyA.privateKey,
    wrongNonce: false,
    ...overrides,
  };
}

const provider = createServer(async (request, response) => {
  const url = new URL(request.url, providerBaseUrl);
  if (request.method === "GET" && url.pathname === "/jwks") {
    jwksFetchCount += 1;
    if (jwksFailure) {
      sendJson(response, 503, { error: "JWKS temporarily unavailable." });
      return;
    }
    response.setHeader("Cache-Control", "public, max-age=300");
    sendJson(response, 200, { keys: publishedJwks });
    return;
  }

  if (request.method === "GET" && url.pathname === "/authorize") {
    const state = url.searchParams.get("state");
    const nonce = url.searchParams.get("nonce");
    const codeChallenge = url.searchParams.get("code_challenge");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.ok(state && nonce && codeChallenge);
    assert.equal(url.searchParams.has("code_verifier"), false);
    const code = randomBytes(20).toString("base64url");
    authorizationCodes.set(code, {
      state,
      nonce,
      codeChallenge,
      subject: activeSubject,
      tokenScenario: { ...nextTokenScenario },
    });
    setNextTokenScenario();
    response.writeHead(307, {
      Location: `${appBaseUrl}/api/providers/auth?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    });
    response.end();
    return;
  }

  if (request.method === "POST" && url.pathname === "/token") {
    const body = new URLSearchParams(await readBody(request));
    const code = body.get("code");
    const record = code ? authorizationCodes.get(code) : null;
    const verifier = body.get("code_verifier") ?? "";
    if (
      !record ||
      body.get("grant_type") !== "authorization_code" ||
      body.get("client_id") !== clientId ||
      body.get("client_secret") !== clientSecret ||
      createHash("sha256").update(verifier).digest("base64url") !== record.codeChallenge
    ) {
      sendJson(response, 400, { error: "PKCE authorization code exchange failed." });
      return;
    }
    authorizationCodes.delete(code);
    const accessToken = randomBytes(24).toString("base64url");
    accessTokens.set(accessToken, record.subject);
    const tokenResponse = {
      access_token: accessToken,
      token_type: "Bearer",
    };
    if (!record.tokenScenario.omitIdToken) {
      tokenResponse.id_token = buildIdToken({
        issuer: providerBaseUrl,
        subject: record.subject,
        nonce: record.tokenScenario.wrongNonce
          ? `${record.nonce}-wrong`
          : record.nonce,
        scenario: record.tokenScenario,
      });
    }
    sendJson(response, 200, tokenResponse);
    return;
  }

  if (request.method === "GET" && url.pathname === "/profile") {
    profileFetchCount += 1;
    const accessToken = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
    const subject = accessTokens.get(accessToken);
    if (!subject) {
      sendJson(response, 401, { error: "invalid access token" });
      return;
    }
    sendJson(response, 200, {
      sub: subject,
      email: "oauth-security@example.com",
      email_verified: true,
      phone: "0501234567",
      phone_number_verified: true,
    });
    return;
  }

  sendJson(response, 404, { error: "not found" });
});

await new Promise((resolve) => provider.listen(0, "127.0.0.1", resolve));
providerBaseUrl = `http://127.0.0.1:${provider.address().port}`;
rmSync(databasePath, { force: true });

let serverOutput = "";
let verificationDatabase = null;
const app = spawn(process.execPath, [serverFile], {
  cwd: root,
  env: {
    ...process.env,
    COZMATEKS_PROJECT_ROOT: root,
    HOSTNAME: "127.0.0.1",
    PORT: "3074",
    APP_ENV: "development",
    AUTHORITY_DB_PATH: databasePath,
    ORDER_AUTHORITY_SECRET: orderSecret,
    AUTH_PROVIDER_CALLBACK_SECRET: authSecret,
    AUTH_PROVIDER_LABEL: "Provider auth security test",
    AUTH_PROVIDER_ISSUER: providerBaseUrl,
    AUTH_PROVIDER_JWKS_URL: `${providerBaseUrl}/jwks`,
    AUTH_PROVIDER_AUTHORIZE_URL: `${providerBaseUrl}/authorize`,
    AUTH_PROVIDER_TOKEN_URL: `${providerBaseUrl}/token`,
    AUTH_PROVIDER_PROFILE_URL: `${providerBaseUrl}/profile`,
    AUTH_PROVIDER_CLIENT_ID: clientId,
    AUTH_PROVIDER_CLIENT_SECRET: clientSecret,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
const appExited = new Promise((resolve) => app.once("exit", resolve));
app.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
app.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function waitForApp() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${appBaseUrl}/api/health`);
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`App did not start.\n${serverOutput}`);
}

function seedOrder() {
  const createdAt = new Date().toISOString();
  const customer = {
    fullName: "OAuth Security Customer",
    phone: "0501234567",
    email: "oauth-security@example.com",
    city: "Riyadh",
    district: "Test",
    addressLine: "Test address",
    notes: "",
  };
  const order = {
    orderNumber: "ELR-AUTH-SECURITY-001",
    createdAt,
    status: "received",
    subtotal: 100,
    shippingFeeEstimate: 22,
    totalEstimate: 122,
    shippingMethodId: "standard",
    paymentMethodId: "cash_on_delivery",
    allowOperationalUpdates: true,
    customer,
    lines: [{
      key: "qa-product:QA-AUTH-001",
      productSlug: "qa-product",
      productName: "QA product",
      productSubtitle: "Security test",
      sku: "QA-AUTH-001",
      variantLabel: "Test size",
      size: "30 ml",
      quantity: 1,
      unitPrice: 100,
      lineTotal: 100,
      shippingNote: "Test",
    }],
  };
  const database = new DatabaseSync(databasePath);
  database.prepare(`
    INSERT INTO authority_orders (
      order_number, phone_last_four, status, created_at, updated_at, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(order.orderNumber, "4567", order.status, createdAt, createdAt, JSON.stringify(order));
  database.close();
  const customerKey = createHash("sha256")
    .update(["0501234567", "oauth-security@example.com", orderSecret].join("|"))
    .digest("hex");
  return { order, customerKey };
}

function createHandoffToken(orderNumber, customerKey) {
  return signToken({
    scope: "customer_access_handoff",
    customerKey,
    orderNumber,
    exp: Date.now() + 60_000,
  }, orderSecret);
}

async function beginAuth(orderNumber, customerKey) {
  const handoff = createHandoffToken(orderNumber, customerKey);
  const response = await fetch(
    `${appBaseUrl}/account/access?locale=en&token=${encodeURIComponent(handoff)}`,
    { redirect: "manual" },
  );
  assert.equal(response.status, 307);
  const authorizeUrl = new URL(response.headers.get("location"));
  assert.equal(authorizeUrl.origin, providerBaseUrl);
  assert.equal(authorizeUrl.searchParams.get("code_challenge_method"), "S256");
  assert.ok(authorizeUrl.searchParams.get("nonce"));
  assert.ok(authorizeUrl.searchParams.get("code_challenge"));
  assert.equal(authorizeUrl.searchParams.has("code_verifier"), false);
  return authorizeUrl;
}

async function completeAuth(authorizeUrl) {
  const providerResponse = await fetch(authorizeUrl, { redirect: "manual" });
  assert.equal(providerResponse.status, 307);
  const callbackUrl = providerResponse.headers.get("location");
  const callbackResponse = await fetch(callbackUrl, { redirect: "manual" });
  return { callbackUrl, callbackResponse };
}

function assertAuthFailure(authResult, locale = "en") {
  assert.equal(authResult.callbackResponse.status, 307);
  assert.equal(
    new URL(authResult.callbackResponse.headers.get("location"), appBaseUrl).pathname,
    `/${locale}/track-order`,
  );
  assert.doesNotMatch(
    authResult.callbackResponse.headers.get("set-cookie") ?? "",
    /cozmateks-customer-account=/,
  );
}

try {
  await waitForApp();
  const { order, customerKey } = seedOrder();

  const firstAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assert.equal(firstAuth.callbackResponse.status, 307);
  assert.equal(new URL(firstAuth.callbackResponse.headers.get("location"), appBaseUrl).pathname, "/en/account/orders");
  assert.match(firstAuth.callbackResponse.headers.get("set-cookie") ?? "", /cozmateks-customer-account=/);

  verificationDatabase = new DatabaseSync(databasePath);
  const binding = verificationDatabase.prepare(`
    SELECT issuer, subject, customer_key
    FROM authority_customer_identities
  `).get();
  assert.equal(binding.issuer, providerBaseUrl);
  assert.equal(binding.subject, "customer-subject-01");
  assert.equal(binding.customer_key, customerKey);
  assert.equal(jwksFetchCount, 1, "The first signed token must fetch JWKS once.");

  const replay = await fetch(firstAuth.callbackUrl, { redirect: "manual" });
  assert.equal(replay.status, 307);
  assert.equal(new URL(replay.headers.get("location"), appBaseUrl).pathname, "/ar/track-order");
  assert.doesNotMatch(replay.headers.get("set-cookie") ?? "", /cozmateks-customer-account=/);

  const cachedKeyAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assert.equal(
    new URL(cachedKeyAuth.callbackResponse.headers.get("location"), appBaseUrl).pathname,
    "/en/account/orders",
  );
  assert.equal(jwksFetchCount, 1, "A fresh JWKS cache must avoid a second fetch.");

  const profileBeforeInvalidSignature = profileFetchCount;
  setNextTokenScenario({ signingKey: rogueKey.privateKey });
  const invalidSignatureAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assertAuthFailure(invalidSignatureAuth);
  assert.equal(jwksFetchCount, 1, "A known kid with a bad signature must not force-refresh JWKS.");
  assert.equal(
    profileFetchCount,
    profileBeforeInvalidSignature,
    "An invalid signature must fail before the profile endpoint is called.",
  );

  activeSubject = "customer-subject-02";
  const conflictingAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assertAuthFailure(conflictingAuth);
  assert.equal(verificationDatabase.prepare("SELECT COUNT(*) AS count FROM authority_customer_identities").get().count, 1);

  activeSubject = "customer-subject-01";
  setNextTokenScenario({ wrongNonce: true });
  const wrongNonceAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assertAuthFailure(wrongNonceAuth);

  publishedJwks = [publicKeyB];
  setNextTokenScenario({ kid: "key-b", signingKey: keyB.privateKey });
  const rotatedKeyAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assert.equal(
    new URL(rotatedKeyAuth.callbackResponse.headers.get("location"), appBaseUrl).pathname,
    "/en/account/orders",
  );
  assert.equal(jwksFetchCount, 2, "An unseen kid must refresh JWKS exactly once.");

  setNextTokenScenario({ kid: "key-b", signingKey: keyB.privateKey });
  const cachedRotatedKeyAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assert.equal(
    new URL(cachedRotatedKeyAuth.callbackResponse.headers.get("location"), appBaseUrl).pathname,
    "/en/account/orders",
  );
  assert.equal(jwksFetchCount, 2, "The rotated key must be cached after refresh.");

  setNextTokenScenario({
    claimOverrides: { aud: [clientId, "secondary-audience"] },
    kid: "key-b",
    signingKey: keyB.privateKey,
  });
  const missingAuthorizedPartyAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assertAuthFailure(missingAuthorizedPartyAuth);

  setNextTokenScenario({
    claimOverrides: {
      aud: [clientId, "secondary-audience"],
      azp: clientId,
    },
    kid: "key-b",
    signingKey: keyB.privateKey,
  });
  const multiAudienceAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assert.equal(
    new URL(multiAudienceAuth.callbackResponse.headers.get("location"), appBaseUrl).pathname,
    "/en/account/orders",
  );

  for (const claimOverrides of [
    { exp: Math.floor(Date.now() / 1000) - 120 },
    { iat: Math.floor(Date.now() / 1000) + 120 },
    { nbf: Math.floor(Date.now() / 1000) + 120 },
    { iss: `${providerBaseUrl}/wrong-issuer` },
  ]) {
    setNextTokenScenario({
      claimOverrides,
      kid: "key-b",
      signingKey: keyB.privateKey,
    });
    const invalidClaimsAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
    assertAuthFailure(invalidClaimsAuth);
  }
  assert.equal(jwksFetchCount, 2, "Invalid signed claims must use the trusted cached key.");

  setNextTokenScenario({ kid: "unknown-key", signingKey: keyB.privateKey });
  const unknownKidAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assertAuthFailure(unknownKidAuth);
  assert.equal(jwksFetchCount, 3, "An unknown kid must get only one forced refresh.");

  setNextTokenScenario({ alg: "HS256", kid: "key-b", signingKey: keyB.privateKey });
  const algorithmConfusionAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assertAuthFailure(algorithmConfusionAuth);
  assert.equal(jwksFetchCount, 3, "An unsupported alg must fail before JWKS lookup.");

  jwksFailure = true;
  setNextTokenScenario({ kid: "unpublished-key", signingKey: rogueKey.privateKey });
  const unavailableJwksAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assertAuthFailure(unavailableJwksAuth);
  assert.equal(jwksFetchCount, 4, "A failed forced refresh must remain bounded to one request.");
  jwksFailure = false;

  setNextTokenScenario({ kid: "key-b", signingKey: keyB.privateKey });
  const retainedCacheAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assert.equal(
    new URL(retainedCacheAuth.callbackResponse.headers.get("location"), appBaseUrl).pathname,
    "/en/account/orders",
  );
  assert.equal(jwksFetchCount, 4, "A failed refresh must not discard the last trusted JWKS cache.");

  const profileBeforeMissingIdToken = profileFetchCount;
  setNextTokenScenario({ omitIdToken: true });
  const missingIdTokenAuth = await completeAuth(await beginAuth(order.orderNumber, customerKey));
  assertAuthFailure(missingIdTokenAuth);
  assert.equal(
    profileFetchCount,
    profileBeforeMissingIdToken,
    "OIDC must not fall back to an unsigned profile when id_token is missing.",
  );

  const states = verificationDatabase.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN consumed_at IS NOT NULL THEN 1 ELSE 0 END) AS consumed
    FROM authority_customer_auth_states
  `).get();
  assert.equal(states.total, states.consumed);
  verificationDatabase.close();
  verificationDatabase = null;

  console.log("Provider auth JWKS signature, rotation, PKCE, nonce, replay, and durable issuer-subject binding checks passed.");
} finally {
  verificationDatabase?.close();
  verificationDatabase = null;
  app.kill("SIGTERM");
  await Promise.race([
    appExited,
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (app.exitCode === null) {
    app.kill("SIGKILL");
    await appExited;
  }
  await new Promise((resolve) => provider.close(resolve));
  await removeDatabaseFiles();
}
