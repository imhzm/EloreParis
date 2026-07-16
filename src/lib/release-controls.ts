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

function isHttpsUrl(value?: string | null) {
  try {
    return new URL(value?.trim() ?? "").protocol === "https:";
  } catch {
    return false;
  }
}

function isConfiguredVersion(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length >= 3 && !UNEDITED_TEMPLATE_VALUE.test(normalized);
}

export function isExternalCustomerAuthConfigured(
  env: NodeJS.ProcessEnv = process.env,
) {
  return (
    isHttpsUrl(env.AUTH_PROVIDER_AUTHORIZE_URL) &&
    isHttpsUrl(env.AUTH_PROVIDER_TOKEN_URL) &&
    Boolean(env.AUTH_PROVIDER_CLIENT_ID?.trim()) &&
    isConfiguredSecret(env.AUTH_PROVIDER_CLIENT_SECRET)
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

export function isPublicCommerceAvailable(
  env: NodeJS.ProcessEnv = process.env,
) {
  return (
    isEnabled(env.PUBLIC_RELEASE_APPROVED) &&
    isPublicCatalogApproved(env) &&
    isPublicLegalContentApproved(env) &&
    isPublicCommerceEnabled(env) &&
    isConfiguredVersion(env.PUBLIC_TERMS_VERSION) &&
    isConfiguredVersion(env.PUBLIC_PRIVACY_NOTICE_VERSION) &&
    isExternalCustomerAuthConfigured(env)
  );
}
