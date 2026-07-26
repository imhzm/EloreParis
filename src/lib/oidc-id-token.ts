import "server-only";

import {
  constants,
  createPublicKey,
  timingSafeEqual,
  verify as verifySignature,
  type JsonWebKey,
  type KeyObject,
} from "node:crypto";

type JsonRecord = Record<string, unknown>;

type SupportedSigningAlgorithm = "ES256" | "PS256" | "RS256";

type ParsedIdToken = {
  algorithm: SupportedSigningAlgorithm;
  claims: JsonRecord;
  keyId: string;
  signature: Buffer;
  signingInput: Buffer;
};

type CachedJwks = {
  expiresAt: number;
  keys: JsonRecord[];
};

export type OidcIdTokenVerificationConfig = {
  clientId: string;
  issuer: string;
  jwksUrl: string;
  providerLabel: string;
};

export type VerifiedOidcIdToken = {
  claims: JsonRecord;
  subject: string;
};

export class OidcIdTokenVerificationError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 401) {
    super(message);
    this.name = "OidcIdTokenVerificationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const ALLOWED_ALGORITHMS = new Set<SupportedSigningAlgorithm>([
  "ES256",
  "PS256",
  "RS256",
]);
const CLOCK_TOLERANCE_SECONDS = 60;
const DEFAULT_JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
const JWKS_CACHE_LIMIT = 8;
const JWKS_MAX_BYTES = 64 * 1024;
const JWKS_MAX_KEYS = 32;
const JWKS_TIMEOUT_MS = 5_000;
const JWT_MAX_BYTES = 16 * 1024;

const jwksCache = new Map<string, CachedJwks>();
const jwksRequests = new Map<string, Promise<CachedJwks>>();

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fail(code: string, message: string, statusCode = 401): never {
  throw new OidcIdTokenVerificationError(code, message, statusCode);
}

function parseJsonSegment(segment: string, label: string) {
  if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) {
    fail("malformed_token", `Auth provider returned a malformed id_token ${label}.`);
  }

  try {
    const parsed = JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as unknown;
    if (!isRecord(parsed)) {
      fail("malformed_token", `Auth provider returned an invalid id_token ${label}.`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof OidcIdTokenVerificationError) throw error;
    fail("malformed_token", `Auth provider returned an invalid id_token ${label}.`);
  }
}

function parseIdToken(value: unknown): ParsedIdToken {
  if (typeof value !== "string" || !value.trim()) {
    fail("id_token_missing", "Auth provider did not return the required signed id_token.");
  }

  const token = value.trim();
  if (Buffer.byteLength(token, "utf8") > JWT_MAX_BYTES) {
    fail("token_too_large", "Auth provider returned an oversized id_token.");
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    fail("malformed_token", "Auth provider returned a malformed id_token.");
  }

  const header = parseJsonSegment(parts[0], "header");
  const claims = parseJsonSegment(parts[1], "claims");
  const algorithm = header.alg;
  const keyId = typeof header.kid === "string" ? header.kid.trim() : "";
  const tokenType = typeof header.typ === "string" ? header.typ.trim().toUpperCase() : "";

  if (
    typeof algorithm !== "string" ||
    !ALLOWED_ALGORITHMS.has(algorithm as SupportedSigningAlgorithm)
  ) {
    fail("unsupported_algorithm", "Auth provider id_token uses an unsupported signing algorithm.");
  }
  if (!keyId || keyId.length > 255 || /[\u0000-\u001f\u007f]/.test(keyId)) {
    fail("key_id_missing", "Auth provider id_token does not identify a valid signing key.");
  }
  if (tokenType && tokenType !== "JWT") {
    fail("unsupported_token_type", "Auth provider id_token uses an unsupported token type.");
  }
  if (Array.isArray(header.crit) ? header.crit.length > 0 : header.crit !== undefined) {
    fail("unsupported_critical_header", "Auth provider id_token uses unsupported critical headers.");
  }
  if (!/^[A-Za-z0-9_-]+$/.test(parts[2])) {
    fail("malformed_signature", "Auth provider returned a malformed id_token signature.");
  }

  const signature = Buffer.from(parts[2], "base64url");
  if (!signature.length) {
    fail("malformed_signature", "Auth provider returned an empty id_token signature.");
  }

  return {
    algorithm: algorithm as SupportedSigningAlgorithm,
    claims,
    keyId,
    signature,
    signingInput: Buffer.from(`${parts[0]}.${parts[1]}`, "ascii"),
  };
}

async function readBoundedResponseBody(response: Response) {
  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > JWKS_MAX_BYTES) {
    fail("jwks_too_large", "Auth provider JWKS response is too large.", 502);
  }

  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > JWKS_MAX_BYTES) {
        await reader.cancel();
        fail("jwks_too_large", "Auth provider JWKS response is too large.", 502);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes).toString("utf8");
}

function resolveCacheTtl(response: Response) {
  const cacheControl = response.headers.get("cache-control")?.toLowerCase() ?? "";
  if (/\b(?:no-cache|no-store)\b/.test(cacheControl)) return 0;
  const maxAge = cacheControl.match(/\bmax-age=(\d+)\b/);
  if (!maxAge) return DEFAULT_JWKS_CACHE_TTL_MS;
  return Math.min(Number.parseInt(maxAge[1], 10) * 1000, 60 * 60 * 1000);
}

async function fetchJwks(jwksUrl: string, providerLabel: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JWKS_TIMEOUT_MS);

  try {
    const response = await fetch(jwksUrl, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      fail(
        "jwks_unavailable",
        `${providerLabel} signing keys are temporarily unavailable.`,
        502,
      );
    }

    const payloadText = await readBoundedResponseBody(response);
    let payload: unknown;
    try {
      payload = JSON.parse(payloadText) as unknown;
    } catch {
      fail("jwks_malformed", `${providerLabel} returned malformed signing keys.`, 502);
    }

    if (!isRecord(payload) || !Array.isArray(payload.keys)) {
      fail("jwks_malformed", `${providerLabel} returned malformed signing keys.`, 502);
    }
    if (!payload.keys.length || payload.keys.length > JWKS_MAX_KEYS) {
      fail("jwks_key_count_invalid", `${providerLabel} returned an invalid signing-key set.`, 502);
    }

    const keys = payload.keys.filter(isRecord);
    if (keys.length !== payload.keys.length) {
      fail("jwks_malformed", `${providerLabel} returned malformed signing keys.`, 502);
    }

    return {
      expiresAt: Date.now() + resolveCacheTtl(response),
      keys,
    } satisfies CachedJwks;
  } catch (error) {
    if (error instanceof OidcIdTokenVerificationError) throw error;
    fail("jwks_unavailable", `${providerLabel} signing keys are temporarily unavailable.`, 502);
  } finally {
    clearTimeout(timeout);
  }
}

async function loadJwks(
  jwksUrl: string,
  providerLabel: string,
  forceRefresh = false,
) {
  const cached = jwksCache.get(jwksUrl);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return { entry: cached, fromCache: true };
  }

  const activeRequest = jwksRequests.get(jwksUrl);
  if (activeRequest) {
    return { entry: await activeRequest, fromCache: false };
  }

  const request = fetchJwks(jwksUrl, providerLabel);
  jwksRequests.set(jwksUrl, request);
  try {
    const entry = await request;
    if (jwksCache.size >= JWKS_CACHE_LIMIT && !jwksCache.has(jwksUrl)) {
      const oldestKey = jwksCache.keys().next().value as string | undefined;
      if (oldestKey) jwksCache.delete(oldestKey);
    }
    jwksCache.set(jwksUrl, entry);
    return { entry, fromCache: false };
  } finally {
    jwksRequests.delete(jwksUrl);
  }
}

function matchesSigningKey(
  key: JsonRecord,
  algorithm: SupportedSigningAlgorithm,
  keyId: string,
) {
  if (key.kid !== keyId) return false;
  if (key.alg !== undefined && key.alg !== algorithm) return false;
  if (key.use !== undefined && key.use !== "sig") return false;
  if (
    key.key_ops !== undefined &&
    (!Array.isArray(key.key_ops) || !key.key_ops.includes("verify"))
  ) {
    return false;
  }

  if (algorithm === "ES256") {
    return key.kty === "EC" && key.crv === "P-256";
  }
  return key.kty === "RSA";
}

function findSigningKey(keys: JsonRecord[], token: ParsedIdToken) {
  const matches = keys.filter((key) =>
    matchesSigningKey(key, token.algorithm, token.keyId),
  );
  if (matches.length > 1) {
    fail("ambiguous_signing_key", "Auth provider returned duplicate signing keys.", 502);
  }
  return matches[0] ?? null;
}

function importSigningKey(key: JsonRecord, algorithm: SupportedSigningAlgorithm) {
  if (typeof key.d === "string" && key.d) {
    fail("private_jwk_rejected", "Auth provider exposed an invalid signing key.", 502);
  }

  let publicKey: KeyObject;
  try {
    publicKey = createPublicKey({ key: key as JsonWebKey, format: "jwk" });
  } catch {
    fail("signing_key_invalid", "Auth provider returned an invalid signing key.", 502);
  }

  if (
    (algorithm === "RS256" || algorithm === "PS256") &&
    (publicKey.asymmetricKeyType !== "rsa" ||
      (publicKey.asymmetricKeyDetails?.modulusLength ?? 0) < 2048)
  ) {
    fail("weak_signing_key", "Auth provider returned an unsupported RSA signing key.", 502);
  }
  if (
    algorithm === "ES256" &&
    (publicKey.asymmetricKeyType !== "ec" ||
      publicKey.asymmetricKeyDetails?.namedCurve !== "prime256v1")
  ) {
    fail("invalid_ec_key", "Auth provider returned an unsupported EC signing key.", 502);
  }

  return publicKey;
}

function verifyCryptographicSignature(token: ParsedIdToken, key: JsonRecord) {
  const publicKey = importSigningKey(key, token.algorithm);
  const keyOptions = token.algorithm === "RS256"
    ? { key: publicKey, padding: constants.RSA_PKCS1_PADDING }
    : token.algorithm === "PS256"
      ? {
          key: publicKey,
          padding: constants.RSA_PKCS1_PSS_PADDING,
          saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
        }
      : { key: publicKey, dsaEncoding: "ieee-p1363" as const };

  if (
    token.algorithm === "ES256" &&
    token.signature.length !== 64
  ) {
    fail("malformed_signature", "Auth provider returned a malformed ES256 signature.");
  }

  const verified = verifySignature(
    "sha256",
    token.signingInput,
    keyOptions,
    token.signature,
  );
  if (!verified) {
    fail("signature_invalid", "Auth provider id_token signature failed validation.");
  }
}

function normalizeIssuer(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\/$/, "");
  try {
    const parsed = new URL(normalized);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeSubject(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized && normalized.length <= 255 && !/[\u0000-\u001f\u007f]/.test(normalized)
    ? normalized
    : null;
}

function timingSafeStringEquals(actual: unknown, expected: string) {
  if (typeof actual !== "string") return false;
  const actualBuffer = Buffer.from(actual, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);
}

function validateClaims(
  claims: JsonRecord,
  config: OidcIdTokenVerificationConfig,
  expectedNonce: string,
) {
  const issuer = normalizeIssuer(claims.iss);
  const configuredIssuer = normalizeIssuer(config.issuer);
  const subject = normalizeSubject(claims.sub);
  const audience = claims.aud;
  const audiences = typeof audience === "string"
    ? [audience]
    : Array.isArray(audience) && audience.every((entry) => typeof entry === "string")
      ? audience
      : [];
  const authorizedParty = typeof claims.azp === "string" ? claims.azp : null;
  const expiresAt = claims.exp;
  const issuedAt = claims.iat;
  const notBefore = claims.nbf;
  const now = Math.floor(Date.now() / 1000);

  const claimsAreValid =
    Boolean(issuer && configuredIssuer && issuer === configuredIssuer) &&
    Boolean(subject) &&
    timingSafeStringEquals(claims.nonce, expectedNonce) &&
    audiences.length > 0 &&
    audiences.includes(config.clientId) &&
    (audiences.length === 1 || authorizedParty === config.clientId) &&
    (authorizedParty === null || authorizedParty === config.clientId) &&
    typeof expiresAt === "number" &&
    Number.isFinite(expiresAt) &&
    expiresAt > now - CLOCK_TOLERANCE_SECONDS &&
    typeof issuedAt === "number" &&
    Number.isFinite(issuedAt) &&
    issuedAt <= now + CLOCK_TOLERANCE_SECONDS &&
    issuedAt <= expiresAt + CLOCK_TOLERANCE_SECONDS &&
    (notBefore === undefined ||
      (typeof notBefore === "number" &&
        Number.isFinite(notBefore) &&
        notBefore <= now + CLOCK_TOLERANCE_SECONDS));

  if (!claimsAreValid || !subject) {
    fail("claims_invalid", "Auth provider id_token claims failed validation.");
  }

  return subject;
}

export async function verifyOidcIdToken(
  value: unknown,
  config: OidcIdTokenVerificationConfig,
  expectedNonce: string,
): Promise<VerifiedOidcIdToken> {
  const token = parseIdToken(value);
  let loaded = await loadJwks(config.jwksUrl, config.providerLabel);
  let signingKey = findSigningKey(loaded.entry.keys, token);

  if (!signingKey && loaded.fromCache) {
    loaded = await loadJwks(config.jwksUrl, config.providerLabel, true);
    signingKey = findSigningKey(loaded.entry.keys, token);
  }
  if (!signingKey) {
    fail("signing_key_not_found", "Auth provider id_token signing key is not trusted.");
  }

  verifyCryptographicSignature(token, signingKey);
  const subject = validateClaims(token.claims, config, expectedNonce);
  return { claims: token.claims, subject };
}
