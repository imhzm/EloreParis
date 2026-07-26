function isEnabled(value?: string | null) {
  return value?.trim().toLowerCase() === "true";
}

/**
 * The vocabulary an unedited template speaks.
 *
 * One list, shared by every "is this actually configured?" check. It used to be
 * duplicated with different members: the secret check rejected `replace` and
 * `your-`, the version check did not — so `PUBLIC_TERMS_VERSION` left at the
 * `replace-with-…` default that every env template in this repo ships would
 * satisfy the policy gate and be recorded onto real quotes and orders as the
 * version the customer agreed to. Two lists six lines apart will always drift;
 * there is now one.
 */
const UNEDITED_TEMPLATE_VALUE =
  /(replace|placeholder|example|changeme|todo|your-|set-this)/i;

function isConfiguredSecret(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length >= 8 && !UNEDITED_TEMPLATE_VALUE.test(normalized);
}

function isConfiguredIdentifier(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length >= 3 && !UNEDITED_TEMPLATE_VALUE.test(normalized);
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function isLoopbackHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);
  return normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "127.0.0.1" ||
    normalized === "::1";
}

function isNonPublicProviderHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);
  if (
    isLoopbackHostname(normalized) ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".test") ||
    normalized.endsWith(".invalid") ||
    normalized.endsWith(".example") ||
    (!normalized.includes(".") && !normalized.includes(":")) ||
    normalized === "0.0.0.0" ||
    normalized === "::"
  ) {
    return true;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) {
    const [first, second, third] = normalized.split(".").map(Number);
    return first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 0 && third === 0) ||
      (first === 192 && second === 0 && third === 2) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      (first === 198 && second === 51 && third === 100) ||
      (first === 203 && second === 0 && third === 113);
  }

  if (/^(?:fc|fd|fe[89ab])/i.test(normalized)) return true;
  const mappedIpv4 = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!mappedIpv4) return false;
  const high = Number.parseInt(mappedIpv4[1], 16);
  const low = Number.parseInt(mappedIpv4[2], 16);
  return isNonPublicProviderHostname(
    [high >>> 8, high & 0xff, low >>> 8, low & 0xff].join("."),
  );
}

export function isTrustedProviderUrl(
  value?: string | null,
  env: NodeJS.ProcessEnv = process.env,
) {
  try {
    const url = new URL(value?.trim() ?? "");
    if (
      !url.hostname ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return false;
    }
    if (url.protocol === "https:") {
      return !isNonPublicProviderHostname(url.hostname);
    }
    return env.APP_ENV !== "production" &&
      url.protocol === "http:" &&
      isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}

export function isTrustedProviderRequestPath(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return /^\/(?!\/)[^\\\u0000-\u001f\u007f]*$/.test(normalized);
}

function isConfiguredVersion(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length >= 3 && !UNEDITED_TEMPLATE_VALUE.test(normalized);
}

export function isExternalCustomerAuthConfigured(
  env: NodeJS.ProcessEnv = process.env,
) {
  const scope = env.AUTH_PROVIDER_SCOPE?.trim() || "openid profile email phone";
  const profileUrl = env.AUTH_PROVIDER_PROFILE_URL?.trim() ?? "";
  return (
    isTrustedProviderUrl(env.AUTH_PROVIDER_ISSUER, env) &&
    isTrustedProviderUrl(env.AUTH_PROVIDER_AUTHORIZE_URL, env) &&
    isTrustedProviderUrl(env.AUTH_PROVIDER_TOKEN_URL, env) &&
    isTrustedProviderUrl(env.AUTH_PROVIDER_JWKS_URL, env) &&
    (!profileUrl || isTrustedProviderUrl(profileUrl, env)) &&
    isConfiguredIdentifier(env.AUTH_PROVIDER_CLIENT_ID) &&
    isConfiguredSecret(env.AUTH_PROVIDER_CLIENT_SECRET) &&
    scope.split(/\s+/).includes("openid")
  );
}

export function isPublicCatalogApproved(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isEnabled(env.PUBLIC_CATALOG_APPROVED);
}

export function isPublicDiscoveryContentApproved(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isEnabled(env.PUBLIC_DISCOVERY_CONTENT_APPROVED);
}

export function isPublicEditorialContentApproved(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isEnabled(env.PUBLIC_EDITORIAL_CONTENT_APPROVED);
}

export function isPublicLegalContentApproved(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isEnabled(env.PUBLIC_LEGAL_CONTENT_APPROVED);
}

export function isPublicCommerceEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isEnabled(env.PUBLIC_COMMERCE_ENABLED);
}

export function isGuestCommerceAvailable(
  env: NodeJS.ProcessEnv = process.env,
) {
  return (
    isEnabled(env.PUBLIC_RELEASE_APPROVED) &&
    isPublicCatalogApproved(env) &&
    isPublicLegalContentApproved(env) &&
    isPublicCommerceEnabled(env) &&
    isConfiguredVersion(env.PUBLIC_TERMS_VERSION) &&
    isConfiguredVersion(env.PUBLIC_PRIVACY_NOTICE_VERSION)
  );
}

/**
 * Backward-compatible public commerce gate.
 *
 * Customer account sign-in is an optional enhancement. Guest checkout remains
 * available when the release, catalog, legal, and commerce controls are ready.
 */
export function isPublicCommerceAvailable(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isGuestCommerceAvailable(env);
}
