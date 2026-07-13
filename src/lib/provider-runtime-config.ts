import "server-only";

import { getOpsAccessConfig, type OpsAccessConfig } from "@/lib/ops-access";
import type {
  ReleaseRuntimeSecretAlignment,
  ReleaseRuntimeSecretBinding,
} from "@/lib/release-packet-types";

function normalizeValue(value: string | undefined) {
  return value?.trim() ?? "";
}

function looksLikePlaceholder(value: string) {
  return /(replace|placeholder|example|changeme|todo|your-|set-this)/i.test(
    value,
  );
}

function isConfiguredSecret(value: string) {
  return value.length >= 16 && !looksLikePlaceholder(value);
}

function isStrongSecret(value: string, minimumLength: number) {
  return value.length >= minimumLength && !looksLikePlaceholder(value);
}

export type RuntimeProviderBindingConfig = {
  label: string;
  callbackSecret: string;
  callbackPath: string;
  callbackConfigured: boolean;
};

export type RuntimeAuthProviderConfig = RuntimeProviderBindingConfig & {
  providerManaged: boolean;
};

type RuntimeSecretSourceMode =
  | "dedicated"
  | "shared"
  | "derived"
  | "development_fallback";

type RuntimeSecretSource = {
  value: string;
  currentMode: string;
  mode: RuntimeSecretSourceMode;
};

const SIGNING_SECRET_MIN_LENGTH = 24;
const PROVIDER_SECRET_MIN_LENGTH = 16;

function getAuthorityFallbackSecret() {
  return (
    normalizeValue(process.env.ORDER_AUTHORITY_SECRET) ||
    normalizeValue(process.env.OPS_ACCESS_CODE) ||
    "development-order-authority"
  );
}

function describeSecretStrength(
  envVar: string,
  value: string,
  minimumLength: number,
) {
  if (!value) {
    return `${envVar}: missing`;
  }

  if (looksLikePlaceholder(value)) {
    return `${envVar}: placeholder text is still configured`;
  }

  if (value.length < minimumLength) {
    return `${envVar}: configured but only ${value.length} chars (minimum ${minimumLength})`;
  }

  return `${envVar}: configured (${value.length} chars)`;
}

function getRuntimeSecretStatus(
  source: RuntimeSecretSource,
  minimumLength: number,
): ReleaseRuntimeSecretBinding["status"] {
  if (!isStrongSecret(source.value, minimumLength)) {
    return "blocked";
  }

  return source.mode === "dedicated" ? "ready" : "warning";
}

function buildRuntimeSecretBinding({
  id,
  label,
  envVar,
  source,
  minimumLength,
  readySummary,
  warningSummary,
  blockedSummary,
  readyAction,
  warningAction,
  blockedAction,
  extraDetails = [],
}: {
  id: ReleaseRuntimeSecretBinding["id"];
  label: string;
  envVar: string;
  source: RuntimeSecretSource;
  minimumLength: number;
  readySummary: string;
  warningSummary: string;
  blockedSummary: string;
  readyAction: string;
  warningAction: string;
  blockedAction: string;
  extraDetails?: string[];
}): ReleaseRuntimeSecretBinding {
  const status = getRuntimeSecretStatus(source, minimumLength);

  return {
    id,
    label,
    envVar,
    status,
    currentMode: source.currentMode,
    summary:
      status === "ready"
        ? readySummary
        : status === "warning"
          ? warningSummary
          : blockedSummary,
    nextAction:
      status === "ready"
        ? readyAction
        : status === "warning"
          ? warningAction
          : blockedAction,
    details: [
      describeSecretStrength(envVar, source.value, minimumLength),
      `Effective source: ${source.currentMode}`,
      ...extraDetails,
    ],
  };
}

function getOrderAuthoritySecretSource(): RuntimeSecretSource {
  const explicitSecret = normalizeValue(process.env.ORDER_AUTHORITY_SECRET);

  if (explicitSecret) {
    return {
      value: explicitSecret,
      currentMode: "Dedicated ORDER_AUTHORITY_SECRET",
      mode: "dedicated",
    };
  }

  const accessCode = normalizeValue(process.env.OPS_ACCESS_CODE);

  if (accessCode) {
    return {
      value: accessCode,
      currentMode: "Shared OPS_ACCESS_CODE fallback",
      mode: "shared",
    };
  }

  return {
    value: "development-order-authority",
    currentMode: "Development fallback secret",
    mode: "development_fallback",
  };
}

function getOpsAccessSigningSecretSource(
  opsAccessConfig: OpsAccessConfig,
): RuntimeSecretSource {
  const explicitSecret = normalizeValue(process.env.OPS_ACCESS_SIGNING_SECRET);

  if (explicitSecret) {
    return {
      value: explicitSecret,
      currentMode: "Dedicated OPS_ACCESS_SIGNING_SECRET",
      mode: "dedicated",
    };
  }

  if (opsAccessConfig.users.length === 1 && opsAccessConfig.users[0].accessCode) {
    return {
      value: opsAccessConfig.signingSecret,
      currentMode: `Shared access-code secret from ${opsAccessConfig.users[0].id}`,
      mode: "shared",
    };
  }

  if (opsAccessConfig.accessCode) {
    return {
      value: opsAccessConfig.signingSecret,
      currentMode: "Shared OPS_ACCESS_CODE fallback",
      mode: "shared",
    };
  }

  return {
    value: opsAccessConfig.signingSecret,
    currentMode: opsAccessConfig.users.length
      ? "Derived from configured ops identities"
      : "Derived from empty/default ops config",
    mode: "derived",
  };
}

function getAuthProviderSecretSource(): RuntimeSecretSource {
  const explicitSecret = normalizeValue(process.env.AUTH_PROVIDER_CALLBACK_SECRET);

  if (explicitSecret) {
    return {
      value: explicitSecret,
      currentMode: "Dedicated AUTH_PROVIDER_CALLBACK_SECRET",
      mode: "dedicated",
    };
  }

  const orderAuthoritySecret = normalizeValue(process.env.ORDER_AUTHORITY_SECRET);

  if (orderAuthoritySecret) {
    return {
      value: orderAuthoritySecret,
      currentMode: "Shared ORDER_AUTHORITY_SECRET fallback",
      mode: "shared",
    };
  }

  const accessCode = normalizeValue(process.env.OPS_ACCESS_CODE);

  if (accessCode) {
    return {
      value: accessCode,
      currentMode: "Shared OPS_ACCESS_CODE fallback",
      mode: "shared",
    };
  }

  return {
    value: "development-order-authority",
    currentMode: "Development fallback secret",
    mode: "development_fallback",
  };
}

function getSimpleEnvSecretSource(
  envVar:
    | "PAYMENT_PROVIDER_CALLBACK_SECRET"
    | "SHIPPING_PROVIDER_CALLBACK_SECRET"
    | "NOTIFICATION_PROVIDER_CALLBACK_SECRET",
): RuntimeSecretSource {
  return {
    value: normalizeValue(process.env[envVar]),
    currentMode: normalizeValue(process.env[envVar])
      ? `Dedicated ${envVar}`
      : `Missing ${envVar}`,
    mode: "dedicated",
  };
}

function getRuntimeSecretOverallStatus(
  bindings: ReleaseRuntimeSecretBinding[],
): ReleaseRuntimeSecretAlignment["overallStatus"] {
  if (bindings.some((binding) => binding.status === "blocked")) {
    return "blocked";
  }

  if (bindings.some((binding) => binding.status === "warning")) {
    return "warning";
  }

  return "ready";
}

function buildRuntimeSecretBindings(
  opsAccessConfig: OpsAccessConfig,
): ReleaseRuntimeSecretBinding[] {
  const orderAuthorityBinding = buildRuntimeSecretBinding({
    id: "order_authority",
    label: "Order authority signing secret",
    envVar: "ORDER_AUTHORITY_SECRET",
    source: getOrderAuthoritySecretSource(),
    minimumLength: SIGNING_SECRET_MIN_LENGTH,
    readySummary:
      "Order and customer-access tokens resolve from a dedicated non-placeholder authority secret.",
    warningSummary:
      "Order and customer-access tokens are still borrowing a shared fallback secret instead of a dedicated authority secret.",
    blockedSummary:
      "Order and customer-access tokens still depend on a missing, placeholder, or weak authority secret.",
    readyAction:
      "Keep ORDER_AUTHORITY_SECRET rotation bound to the release trail before publishing live approval claims.",
    warningAction:
      "Freeze a dedicated ORDER_AUTHORITY_SECRET instead of sharing OPS_ACCESS_CODE across customer-order authority flows.",
    blockedAction:
      "Set a strong dedicated ORDER_AUTHORITY_SECRET before trusting protected customer-order and account handoff flows.",
    extraDetails: [
      `Fallback chain: ORDER_AUTHORITY_SECRET -> OPS_ACCESS_CODE -> development-order-authority`,
    ],
  });

  const opsSigningBinding = buildRuntimeSecretBinding({
    id: "ops_access_signing",
    label: "Ops session signing secret",
    envVar: "OPS_ACCESS_SIGNING_SECRET",
    source: getOpsAccessSigningSecretSource(opsAccessConfig),
    minimumLength: SIGNING_SECRET_MIN_LENGTH,
    readySummary:
      "Protected ops sessions resolve from a dedicated signing secret instead of a derived fallback.",
    warningSummary:
      "Protected ops sessions still rely on a shared or derived signing secret instead of a frozen dedicated secret.",
    blockedSummary:
      "Protected ops sessions still depend on a missing, placeholder, or weak signing secret.",
    readyAction:
      "Keep OPS_ACCESS_SIGNING_SECRET rotation explicit inside the protected runtime contract.",
    warningAction:
      "Replace the shared or derived ops signing fallback with a dedicated OPS_ACCESS_SIGNING_SECRET before live release operations.",
    blockedAction:
      "Set a strong OPS_ACCESS_SIGNING_SECRET before trusting protected ops sessions in the hosted runtime.",
    extraDetails: [
      `Primary auth method: ${opsAccessConfig.primaryAuthMethod}`,
      `Configured ops users: ${opsAccessConfig.users.length}`,
    ],
  });

  const authProviderBinding = buildRuntimeSecretBinding({
    id: "auth_provider_callback",
    label: "Customer auth handoff secret",
    envVar: "AUTH_PROVIDER_CALLBACK_SECRET",
    source: getAuthProviderSecretSource(),
    minimumLength: PROVIDER_SECRET_MIN_LENGTH,
    readySummary:
      "Cross-device customer-account handoff resolves from a dedicated provider callback secret.",
    warningSummary:
      "Cross-device customer-account handoff still works, but it is borrowing a shared fallback secret instead of a dedicated provider secret.",
    blockedSummary:
      "Cross-device customer-account handoff still depends on a missing, placeholder, or weak callback secret.",
    readyAction:
      "Keep AUTH_PROVIDER_CALLBACK_SECRET rotation independent from the order authority secret.",
    warningAction:
      "Set a dedicated AUTH_PROVIDER_CALLBACK_SECRET instead of sharing the order-authority or ops fallback secret.",
    blockedAction:
      "Set a strong AUTH_PROVIDER_CALLBACK_SECRET before treating provider-backed account handoff as durable.",
    extraDetails: [
      `Callback path: /api/providers/auth`,
      `Fallback chain: AUTH_PROVIDER_CALLBACK_SECRET -> ORDER_AUTHORITY_SECRET -> OPS_ACCESS_CODE -> development-order-authority`,
    ],
  });

  const paymentProviderBinding = buildRuntimeSecretBinding({
    id: "payment_provider_callback",
    label: "Payment callback secret",
    envVar: "PAYMENT_PROVIDER_CALLBACK_SECRET",
    source: getSimpleEnvSecretSource("PAYMENT_PROVIDER_CALLBACK_SECRET"),
    minimumLength: PROVIDER_SECRET_MIN_LENGTH,
    readySummary:
      "Payment callback staging resolves from a dedicated non-placeholder provider secret.",
    warningSummary:
      "Payment callback staging is active, but the secret binding still depends on a fallback contract.",
    blockedSummary:
      "Payment callback staging still depends on a missing, placeholder, or weak provider secret.",
    readyAction:
      "Keep PAYMENT_PROVIDER_CALLBACK_SECRET rotation explicit while wiring the live gateway contract.",
    warningAction:
      "Replace the fallback payment callback secret with a dedicated PAYMENT_PROVIDER_CALLBACK_SECRET binding.",
    blockedAction:
      "Set a strong PAYMENT_PROVIDER_CALLBACK_SECRET before relying on protected payment callbacks.",
    extraDetails: [`Callback path: /api/providers/payment`],
  });

  const shippingProviderBinding = buildRuntimeSecretBinding({
    id: "shipping_provider_callback",
    label: "Shipping callback secret",
    envVar: "SHIPPING_PROVIDER_CALLBACK_SECRET",
    source: getSimpleEnvSecretSource("SHIPPING_PROVIDER_CALLBACK_SECRET"),
    minimumLength: PROVIDER_SECRET_MIN_LENGTH,
    readySummary:
      "Shipping callback staging resolves from a dedicated non-placeholder provider secret.",
    warningSummary:
      "Shipping callback staging is active, but the secret binding still depends on a fallback contract.",
    blockedSummary:
      "Shipping callback staging still depends on a missing, placeholder, or weak provider secret.",
    readyAction:
      "Keep SHIPPING_PROVIDER_CALLBACK_SECRET rotation explicit while wiring live carrier callbacks.",
    warningAction:
      "Replace the fallback shipping callback secret with a dedicated SHIPPING_PROVIDER_CALLBACK_SECRET binding.",
    blockedAction:
      "Set a strong SHIPPING_PROVIDER_CALLBACK_SECRET before relying on protected shipping callbacks.",
    extraDetails: [`Callback path: /api/providers/shipping`],
  });

  const notificationProviderBinding = buildRuntimeSecretBinding({
    id: "notification_provider_callback",
    label: "Notification callback secret",
    envVar: "NOTIFICATION_PROVIDER_CALLBACK_SECRET",
    source: getSimpleEnvSecretSource("NOTIFICATION_PROVIDER_CALLBACK_SECRET"),
    minimumLength: PROVIDER_SECRET_MIN_LENGTH,
    readySummary:
      "Notification delivery callbacks resolve from a dedicated non-placeholder provider secret.",
    warningSummary:
      "Notification delivery callbacks are active, but the secret binding still depends on a fallback contract.",
    blockedSummary:
      "Notification delivery callbacks still depend on a missing, placeholder, or weak provider secret.",
    readyAction:
      "Keep NOTIFICATION_PROVIDER_CALLBACK_SECRET rotation explicit while reconciling provider delivery events.",
    warningAction:
      "Replace the fallback notification callback secret with a dedicated NOTIFICATION_PROVIDER_CALLBACK_SECRET binding.",
    blockedAction:
      "Set a strong NOTIFICATION_PROVIDER_CALLBACK_SECRET before relying on protected notification callbacks.",
    extraDetails: [`Callback path: /api/providers/notifications`],
  });

  return [
    orderAuthorityBinding,
    opsSigningBinding,
    authProviderBinding,
    paymentProviderBinding,
    shippingProviderBinding,
    notificationProviderBinding,
  ];
}

export function getPaymentProviderRuntimeConfig(): RuntimeProviderBindingConfig {
  const callbackSecret = normalizeValue(process.env.PAYMENT_PROVIDER_CALLBACK_SECRET);

  return {
    label:
      normalizeValue(process.env.PAYMENT_PROVIDER_LABEL) ||
      "Payment callback contract",
    callbackSecret,
    callbackPath: "/api/providers/payment",
    callbackConfigured: isConfiguredSecret(callbackSecret),
  };
}

export function getShippingProviderRuntimeConfig(): RuntimeProviderBindingConfig {
  const callbackSecret = normalizeValue(process.env.SHIPPING_PROVIDER_CALLBACK_SECRET);

  return {
    label:
      normalizeValue(process.env.SHIPPING_PROVIDER_LABEL) ||
      "Shipping callback contract",
    callbackSecret,
    callbackPath: "/api/providers/shipping",
    callbackConfigured: isConfiguredSecret(callbackSecret),
  };
}

export function getAuthProviderRuntimeConfig(): RuntimeAuthProviderConfig {
  const configuredSecret = normalizeValue(process.env.AUTH_PROVIDER_CALLBACK_SECRET);
  const providerManaged = isConfiguredSecret(configuredSecret);

  return {
    label:
      normalizeValue(process.env.AUTH_PROVIDER_LABEL) ||
      "Customer auth handoff contract",
    callbackSecret: providerManaged
      ? configuredSecret
      : getAuthorityFallbackSecret(),
    callbackPath: "/api/providers/auth",
    callbackConfigured: true,
    providerManaged,
  };
}

export function getRuntimeSecretAlignmentSnapshot(): ReleaseRuntimeSecretAlignment {
  const opsAccessConfig = getOpsAccessConfig();
  const bindings = buildRuntimeSecretBindings(opsAccessConfig);
  const blockedCount = bindings.filter((binding) => binding.status === "blocked").length;
  const warningCount = bindings.filter((binding) => binding.status === "warning").length;
  const readyCount = bindings.filter((binding) => binding.status === "ready").length;

  return {
    overallStatus: getRuntimeSecretOverallStatus(bindings),
    blockedCount,
    warningCount,
    readyCount,
    summary: `Runtime secret alignment resolves to ${blockedCount} blocked, ${warningCount} warning, and ${readyCount} ready bindings across order authority, ops session signing, and provider callback secrets.`,
    bindings,
  };
}

export function getRuntimeSigningSecretBindings() {
  return getRuntimeSecretAlignmentSnapshot().bindings.filter(
    (binding) =>
      binding.id === "order_authority" || binding.id === "ops_access_signing",
  );
}
