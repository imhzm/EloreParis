import "server-only";

export type LifecycleProviderReadinessBlocker =
  | "lifecycle_delivery_disabled"
  | "lifecycle_provider_disabled"
  | "lifecycle_provider_not_selected"
  | "lifecycle_provider_unsupported"
  | "lifecycle_provider_region_unconfigured"
  | "lifecycle_provider_from_domain_unconfigured"
  | "lifecycle_provider_configuration_set_unconfigured"
  | "lifecycle_provider_callback_unconfigured";

export type LifecycleProviderReadiness = {
  selectedProvider: string | null;
  region: string | null;
  fromDomainConfigured: boolean;
  configurationSetConfigured: boolean;
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

function configuredFromDomain(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  const separator = normalized.lastIndexOf("@");
  if (separator <= 0 || separator === normalized.length - 1) return false;
  const domain = normalized.slice(separator + 1).toLowerCase();
  return (
    domain.length <= 253 &&
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u.test(domain) &&
    !/(?:example|invalid|localhost|replace|placeholder|changeme)/iu.test(domain)
  );
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
  const selectedProvider = safeIdentifier(env.LIFECYCLE_DELIVERY_PROVIDER_KEY);
  const region = safeIdentifier(env.LIFECYCLE_SES_REGION, 40);
  const fromDomainConfigured = configuredFromDomain(
    env.LIFECYCLE_SES_FROM_EMAIL,
  );
  const configurationSetConfigured = configuredConfigurationSet(
    env.LIFECYCLE_SES_CONFIGURATION_SET,
  );
  // No SES/SNS callback route exists in the current provider scope.
  const callbackConfigured = false;
  const blockers: LifecycleProviderReadinessBlocker[] = [];

  if (!enabled(env.LIFECYCLE_DELIVERY_ENABLED)) {
    blockers.push("lifecycle_delivery_disabled");
  }
  if (!enabled(env.LIFECYCLE_DELIVERY_PROVIDER_ENABLED)) {
    blockers.push("lifecycle_provider_disabled");
  }
  if (!selectedProvider) {
    blockers.push("lifecycle_provider_not_selected");
  } else if (selectedProvider !== "aws-ses") {
    blockers.push("lifecycle_provider_unsupported");
  }
  if (!region) blockers.push("lifecycle_provider_region_unconfigured");
  if (!fromDomainConfigured) {
    blockers.push("lifecycle_provider_from_domain_unconfigured");
  }
  if (!configurationSetConfigured) {
    blockers.push("lifecycle_provider_configuration_set_unconfigured");
  }
  if (!callbackConfigured) {
    blockers.push("lifecycle_provider_callback_unconfigured");
  }

  return {
    selectedProvider,
    region,
    fromDomainConfigured,
    configurationSetConfigured,
    callbackConfigured,
    blockers,
  };
}
