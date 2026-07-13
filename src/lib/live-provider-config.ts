import "server-only";

import {
  getAuthProviderRuntimeConfig,
  getPaymentProviderRuntimeConfig,
  getShippingProviderRuntimeConfig,
  type RuntimeAuthProviderConfig,
  type RuntimeProviderBindingConfig,
} from "@/lib/provider-runtime-config";

const PROVIDER_REQUEST_TOKEN_MIN_LENGTH = 8;
const PROVIDER_CALLBACK_SECRET_MIN_LENGTH = 16;

function normalizeValue(value: string | undefined) {
  return value?.trim() ?? "";
}

function looksLikePlaceholder(value: string) {
  return /(replace|placeholder|example|changeme|todo|your-|set-this)/i.test(
    value,
  );
}

function isConfiguredToken(value: string, minimumLength = PROVIDER_REQUEST_TOKEN_MIN_LENGTH) {
  return value.length >= minimumLength && !looksLikePlaceholder(value);
}

function isConfiguredSecret(
  value: string,
  minimumLength = PROVIDER_CALLBACK_SECRET_MIN_LENGTH,
) {
  return value.length >= minimumLength && !looksLikePlaceholder(value);
}

function normalizeHeaderName(value: string | undefined) {
  return normalizeValue(value) || "Authorization";
}

function normalizeTimeout(value: string | undefined, fallbackValue: number) {
  const parsedValue = Number.parseInt(normalizeValue(value), 10);
  return Number.isFinite(parsedValue) && parsedValue >= 1000
    ? parsedValue
    : fallbackValue;
}

type ProviderEnvPrefix = "PAYMENT" | "SHIPPING" | "NOTIFICATION";

export type RuntimeLiveProviderConfig = RuntimeProviderBindingConfig & {
  requestBaseUrl: string;
  requestPath: string;
  requestTimeoutMs: number;
  requestAuthHeaderName: string;
  requestAuthToken: string;
  requestConfigured: boolean;
};

export type RuntimeNotificationProviderConfig = {
  label: string;
  callbackSecret: string;
  callbackPath: string;
  callbackConfigured: boolean;
  requestBaseUrl: string;
  requestPath: string;
  requestTimeoutMs: number;
  requestAuthHeaderName: string;
  requestAuthToken: string;
  requestConfigured: boolean;
};

export type RuntimeExternalAuthProviderConfig = RuntimeAuthProviderConfig & {
  authorizeUrl: string;
  tokenUrl: string;
  profileUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  externalAuthConfigured: boolean;
};

function resolveLiveRequestConfig(
  envPrefix: ProviderEnvPrefix,
  defaultPath: string,
) {
  const requestBaseUrl = normalizeValue(process.env[`${envPrefix}_PROVIDER_BASE_URL`]);
  const requestPath =
    normalizeValue(process.env[`${envPrefix}_PROVIDER_REQUEST_PATH`]) ||
    defaultPath;
  const requestAuthHeaderName = normalizeHeaderName(
    process.env[`${envPrefix}_PROVIDER_API_KEY_HEADER`],
  );
  const requestAuthToken = normalizeValue(process.env[`${envPrefix}_PROVIDER_API_KEY`]);
  const requestTimeoutMs = normalizeTimeout(
    process.env[`${envPrefix}_PROVIDER_TIMEOUT_MS`],
    10_000,
  );

  return {
    requestBaseUrl,
    requestPath,
    requestTimeoutMs,
    requestAuthHeaderName,
    requestAuthToken,
    requestConfigured:
      Boolean(requestBaseUrl && requestPath) && isConfiguredToken(requestAuthToken),
  };
}

function extendProviderWithLiveRequestConfig(
  baseConfig: RuntimeProviderBindingConfig,
  envPrefix: Exclude<ProviderEnvPrefix, "NOTIFICATION">,
  defaultPath: string,
): RuntimeLiveProviderConfig {
  return {
    ...baseConfig,
    ...resolveLiveRequestConfig(envPrefix, defaultPath),
  };
}

export function getLivePaymentProviderConfig(): RuntimeLiveProviderConfig {
  return extendProviderWithLiveRequestConfig(
    getPaymentProviderRuntimeConfig(),
    "PAYMENT",
    "/payments/links",
  );
}

export function getLiveShippingProviderConfig(): RuntimeLiveProviderConfig {
  return extendProviderWithLiveRequestConfig(
    getShippingProviderRuntimeConfig(),
    "SHIPPING",
    "/shipments/bookings",
  );
}

export function getNotificationProviderConfig(): RuntimeNotificationProviderConfig {
  const callbackSecret = normalizeValue(
    process.env.NOTIFICATION_PROVIDER_CALLBACK_SECRET,
  );

  return {
    label:
      normalizeValue(process.env.NOTIFICATION_PROVIDER_LABEL) ||
      "Notification delivery contract",
    callbackSecret,
    callbackPath:
      normalizeValue(process.env.NOTIFICATION_PROVIDER_CALLBACK_PATH) ||
      "/api/providers/notifications",
    callbackConfigured: isConfiguredSecret(callbackSecret),
    ...resolveLiveRequestConfig("NOTIFICATION", "/notifications/send"),
  };
}

export function getExternalAuthProviderConfig(): RuntimeExternalAuthProviderConfig {
  const baseConfig = getAuthProviderRuntimeConfig();
  const authorizeUrl = normalizeValue(process.env.AUTH_PROVIDER_AUTHORIZE_URL);
  const tokenUrl = normalizeValue(process.env.AUTH_PROVIDER_TOKEN_URL);
  const profileUrl = normalizeValue(process.env.AUTH_PROVIDER_PROFILE_URL);
  const clientId = normalizeValue(process.env.AUTH_PROVIDER_CLIENT_ID);
  const clientSecret = normalizeValue(process.env.AUTH_PROVIDER_CLIENT_SECRET);
  const externalAuthConfigured =
    Boolean(authorizeUrl && tokenUrl && clientId) &&
    isConfiguredToken(clientSecret);

  return {
    ...baseConfig,
    authorizeUrl,
    tokenUrl,
    profileUrl,
    clientId,
    clientSecret,
    scope:
      normalizeValue(process.env.AUTH_PROVIDER_SCOPE) ||
      "openid profile email phone",
    externalAuthConfigured,
  };
}
