import "server-only";

export type LifecycleProviderReadinessBlocker =
  | "lifecycle_delivery_disabled"
  | "lifecycle_provider_disabled"
  | "lifecycle_provider_not_selected"
  | "lifecycle_provider_unsupported"
  | "lifecycle_provider_region_unconfigured"
  | "lifecycle_provider_from_domain_unconfigured"
  | "lifecycle_provider_configuration_set_unconfigured"
  | "lifecycle_provider_timeout_invalid"
  | "lifecycle_provider_callback_unconfigured";

export type LifecycleProviderReadiness = {
  ready: boolean;
  deliveryEnabled: boolean;
  providerEnabled: boolean;
  selectedProvider: string | null;
  providerSupported: boolean;
  region: string | null;
  regionConfigured: boolean;
  fromDomainConfigured: boolean;
  configurationSetConfigured: boolean;
  timeoutValid: boolean;
  timeoutOverrideConfigured: boolean;
  callbackConfigured: boolean;
  blockers: LifecycleProviderReadinessBlocker[];
};

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function safeIdentifier(value: string | undefined, maximumLength = 80) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized &&
    normalized.length <= maximumLength &&
    /^[a-z0-9][a-z0-9_.:-]*$/u.test(normalized) &&
    !/(?:replace|placeholder|example|changeme|todo|unassigned)/iu.test(normalized)
    ? normalized
    : null;
}

function configuredRegion(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[a-z]{2}(?:-[a-z0-9]+)+-\d$/u.test(normalized) &&
    !/(?:replace|placeholder|example|changeme|todo|unassigned)/iu.test(
      normalized,
    )
    ? normalized
    : null;
}

function configuredFromDomain(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u.test(normalized) ||
    normalized.startsWith(".") ||
    normalized.includes("..") ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    return false;
  }
  const separator = normalized.lastIndexOf("@");
  if (separator <= 0 || separator === normalized.length - 1) return false;
  const domain = normalized.slice(separator + 1).toLowerCase();
  return (
    domain.length <= 253 &&
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u.test(domain) &&
    !/(?:example|invalid|localhost|replace|placeholder|changeme)/iu.test(domain)
  );
}

function configuredTimeout(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return { valid: true, overrideConfigured: false };
  }
  if (!/^\d{4,5}$/u.test(normalized)) {
    return { valid: false, overrideConfigured: true };
  }
  const timeoutMs = Number(normalized);
  return {
    valid:
      Number.isSafeInteger(timeoutMs) &&
      String(timeoutMs) === normalized &&
      timeoutMs >= 1_000 &&
      timeoutMs <= 30_000,
    overrideConfigured: true,
  };
}

function configuredSnsTopicArn(
  value: string | undefined,
  expectedRegion: string | null,
) {
  const normalized = value?.trim() ?? "";
  if (
    !normalized ||
    normalized.length > 512 ||
    /[\u0000-\u001f\u007f]/u.test(normalized) ||
    /(?:replace|placeholder|example|changeme|todo|unassigned)/iu.test(normalized)
  ) {
    return false;
  }
  const match = normalized.match(
    /^arn:(?:aws|aws-us-gov|aws-cn):sns:([a-z]{2}(?:-[a-z0-9]+)+-\d):(\d{12}):([A-Za-z0-9_-]{1,256})$/u,
  );
  return Boolean(match && expectedRegion && match[1] === expectedRegion);
}

function configuredConfigurationSet(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  return (
    normalized.length >= 2 &&
    normalized.length <= 64 &&
    /^[A-Za-z0-9_-]+$/u.test(normalized) &&
    !/(?:replace|placeholder|example|changeme|todo|unassigned)/iu.test(normalized)
  );
}

export function getLifecycleProviderReadiness(
  env: NodeJS.ProcessEnv = process.env,
): LifecycleProviderReadiness {
  const deliveryEnabled = enabled(env.LIFECYCLE_DELIVERY_ENABLED);
  const providerEnabled = enabled(env.LIFECYCLE_DELIVERY_PROVIDER_ENABLED);
  const selectedProvider = safeIdentifier(env.LIFECYCLE_DELIVERY_PROVIDER_KEY);
  const providerSupported = selectedProvider === "aws-ses";
  const region = configuredRegion(env.LIFECYCLE_SES_REGION);
  const regionConfigured = region !== null;
  const fromDomainConfigured = configuredFromDomain(
    env.LIFECYCLE_SES_FROM_EMAIL,
  );
  const configurationSetConfigured = configuredConfigurationSet(
    env.LIFECYCLE_SES_CONFIGURATION_SET,
  );
  const timeout = configuredTimeout(env.LIFECYCLE_SES_TIMEOUT_MS);
  const callbackConfigured = configuredSnsTopicArn(
    env.LIFECYCLE_SES_SNS_TOPIC_ARN,
    region,
  );
  const blockers: LifecycleProviderReadinessBlocker[] = [];

  if (!deliveryEnabled) {
    blockers.push("lifecycle_delivery_disabled");
  }
  if (!providerEnabled) {
    blockers.push("lifecycle_provider_disabled");
  }
  if (!selectedProvider) {
    blockers.push("lifecycle_provider_not_selected");
  } else if (!providerSupported) {
    blockers.push("lifecycle_provider_unsupported");
  }
  if (!regionConfigured) {
    blockers.push("lifecycle_provider_region_unconfigured");
  }
  if (!fromDomainConfigured) {
    blockers.push("lifecycle_provider_from_domain_unconfigured");
  }
  if (!configurationSetConfigured) {
    blockers.push("lifecycle_provider_configuration_set_unconfigured");
  }
  if (!timeout.valid) {
    blockers.push("lifecycle_provider_timeout_invalid");
  }
  if (!callbackConfigured) {
    blockers.push("lifecycle_provider_callback_unconfigured");
  }

  return {
    ready: blockers.length === 0,
    deliveryEnabled,
    providerEnabled,
    selectedProvider,
    providerSupported,
    region,
    regionConfigured,
    fromDomainConfigured,
    configurationSetConfigured,
    timeoutValid: timeout.valid,
    timeoutOverrideConfigured: timeout.overrideConfigured,
    callbackConfigured,
    blockers,
  };
}
