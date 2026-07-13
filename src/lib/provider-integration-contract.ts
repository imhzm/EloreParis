import "server-only";

import { getOpsAccessConfig, getOpsAuthMethodLabel } from "@/lib/ops-access";
import {
  CUSTOMER_ACCOUNT_COOKIE,
  CUSTOMER_ACCOUNT_MAX_AGE_SECONDS,
  CUSTOMER_ACCESS_COOKIE,
  ORDER_ACCESS_COOKIE,
  ORDER_ACCESS_MAX_AGE_SECONDS,
  RECENT_ORDER_COOKIE,
  RECENT_ORDER_MAX_AGE_SECONDS,
} from "@/lib/order-authority";
import {
  getExternalAuthProviderConfig,
  getLivePaymentProviderConfig,
  getLiveShippingProviderConfig,
  getNotificationProviderConfig,
} from "@/lib/live-provider-config";
import { paymentMethods, shippingMethods } from "@/lib/orders";
import {
  getReleaseCommerceOwner,
  getReleaseDeliveryOwner,
  getReleaseSecurityOwner,
} from "@/lib/release-ownership";
import type {
  ReleaseProviderIntegrationContract,
  ReleaseProviderIntegrationLane,
} from "@/lib/release-packet-types";
import type { ReleaseOwnableItem } from "@/lib/release-readiness-types";
import type { ReleaseReadinessStatus } from "@/lib/release-readiness-types";

function getOverallStatus(
  lanes: ReleaseProviderIntegrationLane[],
): ReleaseReadinessStatus {
  if (lanes.some((lane) => lane.status === "blocked")) {
    return "blocked";
  }

  if (lanes.some((lane) => lane.status === "warning")) {
    return "warning";
  }

  return "ready";
}

export function buildProviderIntegrationContract(): ReleaseProviderIntegrationContract {
  const opsAccessConfig = getOpsAccessConfig();
  const authProvider = getExternalAuthProviderConfig();
  const paymentProvider = getLivePaymentProviderConfig();
  const shippingProvider = getLiveShippingProviderConfig();
  const notificationProvider = getNotificationProviderConfig();
  const opsAuthLane: ReleaseProviderIntegrationLane = {
    id: "ops_auth",
    title: "Ops authentication",
    status:
      opsAccessConfig.isProtectionActive && opsAccessConfig.isConfigured
        ? opsAccessConfig.supportsIdentityAuth
          ? "ready"
          : "warning"
        : "blocked",
    ownerPath: "/ops-access",
    currentMode:
      opsAccessConfig.mode === "protected"
        ? `Protected ops gate via ${getOpsAuthMethodLabel(opsAccessConfig.primaryAuthMethod)}`
        : opsAccessConfig.mode === "development_open"
          ? "Development-open ops rehearsal"
          : "Ops access setup required",
    evidence:
      opsAccessConfig.mode === "protected"
        ? `Role-bound access is active across ${opsAccessConfig.users.length} internal identity lanes.`
        : "Ops access still depends on local runtime settings instead of a production-bound access contract.",
    nextAction:
      opsAccessConfig.supportsIdentityAuth
        ? "Keep the current ops gate bound to the release trail while wiring production secrets and rotation policy."
        : "Add identity-backed ops login or equivalent secret-managed auth before treating ops access as production-owned.",
    missingBindings: [
      ...(!opsAccessConfig.isProtectionActive
        ? ["Protection is not enforced for this runtime yet."]
        : []),
      ...(!opsAccessConfig.isConfigured
        ? ["No valid internal ops users are configured for the protected runtime."]
        : []),
      ...(!opsAccessConfig.supportsIdentityAuth
        ? ["Identity-password ops auth is not configured in the current runtime."]
        : []),
    ],
  };

  const customerOrderAccessLane: ReleaseProviderIntegrationLane = {
    id: "customer_order_access",
    title: "Customer auth and order access",
    status: authProvider.externalAuthConfigured ? "warning" : "blocked",
    ownerPath: "/account/orders",
    currentMode:
      authProvider.externalAuthConfigured
        ? `Guest order tracking plus ${authProvider.label} external auth handoff through ${authProvider.authorizeUrl}`
        : "Guest order tracking plus local provider-auth handoff fallback for cross-device customer account ownership",
    evidence: authProvider.externalAuthConfigured
      ? `Recent-order access is signed with ${RECENT_ORDER_COOKIE} for ${Math.round(
          RECENT_ORDER_MAX_AGE_SECONDS / 3600,
        )} hours, successful order lookups refresh ${ORDER_ACCESS_COOKIE} for ${Math.round(
          ORDER_ACCESS_MAX_AGE_SECONDS / 86400,
        )} days, and signed \`/account/access\` handoff links now redirect into ${authProvider.label} before returning to ${authProvider.callbackPath}, where customer account authority mints ${CUSTOMER_ACCOUNT_COOKIE} for ${Math.round(
          CUSTOMER_ACCOUNT_MAX_AGE_SECONDS / 86400,
        )} days and refreshes ${ORDER_ACCESS_COOKIE} plus ${CUSTOMER_ACCESS_COOKIE}.`
      : `Recent-order access is signed with ${RECENT_ORDER_COOKIE} for ${Math.round(
          RECENT_ORDER_MAX_AGE_SECONDS / 3600,
        )} hours, successful order lookups now refresh ${ORDER_ACCESS_COOKIE} for ${Math.round(
          ORDER_ACCESS_MAX_AGE_SECONDS / 86400,
        )} days, but cross-device customer account ownership still resolves through the local fallback path on ${authProvider.callbackPath}.`,
    nextAction:
      authProvider.externalAuthConfigured
        ? "Keep the external customer auth handoff stable, then add recovery, revocation, and durable self-serve credentials before launch can treat customer ownership as complete."
        : "Set AUTH_PROVIDER_AUTHORIZE_URL, AUTH_PROVIDER_TOKEN_URL, AUTH_PROVIDER_CLIENT_ID, and AUTH_PROVIDER_CLIENT_SECRET so customer account continuity stops depending on the local fallback handoff.",
    missingBindings: [
      ...(!authProvider.externalAuthConfigured
        ? [
            "External customer auth authorize/token contract is not fully configured in the runtime.",
          ]
        : []),
      "Durable self-serve customer credentials, recovery, and revocation controls are not implemented in the current runtime.",
    ],
  };

  const paymentLinkMethod = paymentMethods.find(
    (method) => method.id === "payment_link",
  );
  const codMethod = paymentMethods.find(
    (method) => method.id === "cash_on_delivery",
  );
  const paymentRoutingLane: ReleaseProviderIntegrationLane = {
    id: "payment_routing",
    title: "Payment routing",
    status: paymentProvider.requestConfigured ? "warning" : "blocked",
    ownerPath: "/checkout",
    currentMode: paymentProvider.requestConfigured
      ? `${paymentProvider.label} live handoff over ${paymentLinkMethod?.label ?? "Payment link"} + ${codMethod?.label ?? "COD"} gate`
      : `${paymentLinkMethod?.label ?? "Payment link"} + ${codMethod?.label ?? "COD"} gate`,
    evidence:
      paymentProvider.requestConfigured
        ? `Checkout and ops now hand off payment-link creation through ${paymentProvider.label} at ${paymentProvider.requestPath}, while protected callbacks on ${paymentProvider.callbackPath} persist settlement references plus provider event ids inside the authority.`
        : "Checkout still creates the order inside authority first, but payment-link handoff has not been bound to a live outbound provider contract yet.",
    nextAction:
      paymentProvider.requestConfigured
        ? "Keep the payment provider contract stable, then add settlement reconciliation and provider dashboards before approval treats payment as fully production-owned."
        : "Bind PAYMENT_PROVIDER_BASE_URL, PAYMENT_PROVIDER_REQUEST_PATH, and PAYMENT_PROVIDER_API_KEY before approval can treat payment as production-owned.",
    missingBindings: [
      ...(!paymentProvider.requestConfigured
        ? [
            "No outbound payment provider request contract is configured in the runtime.",
          ]
        : []),
      ...(!paymentProvider.callbackConfigured
        ? ["Payment confirmation callbacks are not protected by a dedicated callback secret yet."]
        : []),
      "Settlement reconciliation and gateway-side reporting are not wired beyond callback persistence.",
    ],
  };

  const standardShippingMethod = shippingMethods.find(
    (method) => method.id === "standard",
  );
  const expressShippingMethod = shippingMethods.find(
    (method) => method.id === "express",
  );
  const shippingExecutionLane: ReleaseProviderIntegrationLane = {
    id: "shipping_execution",
    title: "Shipping execution",
    status: shippingProvider.requestConfigured ? "warning" : "blocked",
    ownerPath: "/ops/fulfillment",
    currentMode: shippingProvider.requestConfigured
      ? `${shippingProvider.label} live booking over ${standardShippingMethod?.label ?? "Standard shipping"} + ${expressShippingMethod?.label ?? "Express shipping"} lanes`
      : `${standardShippingMethod?.label ?? "Standard shipping"} + ${expressShippingMethod?.label ?? "Express shipping"} rehearsal`,
    evidence:
      shippingProvider.requestConfigured
        ? `Carrier booking now hands off through ${shippingProvider.label} at ${shippingProvider.requestPath}, and protected callbacks on ${shippingProvider.callbackPath} persist booking references, tracking numbers, and callback event ids instead of only flipping delivery state.`
        : "Carrier assignment, dispatch windows, and shipping fees are authority-driven and estimated, but they are not yet bound to live outbound carrier booking.",
    nextAction:
      shippingProvider.requestConfigured
        ? "Keep the shipping contract stable, then bind live carrier pricing and tariff confirmation before release treats shipping as fully owned."
        : "Bind SHIPPING_PROVIDER_BASE_URL, SHIPPING_PROVIDER_REQUEST_PATH, and SHIPPING_PROVIDER_API_KEY for live booking, tracking sync, and delivery callbacks.",
    missingBindings: [
      ...(!shippingProvider.requestConfigured
        ? [
            "No live shipping provider booking contract is configured in the runtime.",
          ]
        : []),
      ...(!shippingProvider.callbackConfigured
        ? ["No dedicated shipping callback secret is configured in the runtime."]
        : []),
      "Shipping fees remain estimated until a carrier pricing contract is bound.",
      "No live carrier tariff confirmation integration is configured.",
    ],
  };

  const notificationDeliveryLane: ReleaseProviderIntegrationLane = {
    id: "notification_delivery",
    title: "Notification delivery",
    status: notificationProvider.requestConfigured
      ? notificationProvider.callbackConfigured
        ? "ready"
        : "warning"
      : "blocked",
    ownerPath: "/ops/notifications",
    currentMode: notificationProvider.requestConfigured
      ? `${notificationProvider.label} outbound delivery via ${notificationProvider.requestPath}`
      : "Authority queue only without outbound provider dispatch",
    evidence: notificationProvider.requestConfigured
      ? `Queued notifications can now be dispatched through ${notificationProvider.label}, and ${notificationProvider.callbackConfigured ? `callbacks on ${notificationProvider.callbackPath} can reconcile provider delivery state.` : "provider callbacks are still optional and not yet protected by a dedicated callback secret."}`
      : "Notifications still stop at the local authority queue without a live outbound provider dispatch contract.",
    nextAction: notificationProvider.requestConfigured
      ? "Keep the delivery contract stable, then decide whether callback-based delivery reconciliation is required for launch reporting."
      : "Bind NOTIFICATION_PROVIDER_BASE_URL, NOTIFICATION_PROVIDER_REQUEST_PATH, and NOTIFICATION_PROVIDER_API_KEY so queued notifications stop depending on manual toggles only.",
    missingBindings: [
      ...(!notificationProvider.requestConfigured
        ? [
            "No outbound notification provider contract is configured in the runtime.",
          ]
        : []),
      ...(!notificationProvider.callbackConfigured
        ? [
            "Notification delivery callbacks are not protected by a dedicated callback secret yet.",
          ]
        : []),
    ],
  };

  const lanes = [
    opsAuthLane,
    customerOrderAccessLane,
    paymentRoutingLane,
    shippingExecutionLane,
    notificationDeliveryLane,
  ];
  const blockedCount = lanes.filter((lane) => lane.status === "blocked").length;
  const warningCount = lanes.filter((lane) => lane.status === "warning").length;
  const readyCount = lanes.filter((lane) => lane.status === "ready").length;

  return {
    overallStatus: getOverallStatus(lanes),
    blockedCount,
    warningCount,
    readyCount,
    summary: `Integration contract currently resolves to ${blockedCount} blocked, ${warningCount} warning, and ${readyCount} ready lanes across ops auth, customer order access, payment routing, shipping execution, and notification delivery.`,
    lanes,
  };
}

function getProviderLaneOwner(lane: ReleaseProviderIntegrationLane) {
  switch (lane.id) {
    case "ops_auth":
      return getReleaseSecurityOwner();
    case "shipping_execution":
      return getReleaseDeliveryOwner();
    case "notification_delivery":
    case "customer_order_access":
    case "payment_routing":
      return getReleaseCommerceOwner();
  }
}

export function buildProviderIntegrationOwnables(
  contract = buildProviderIntegrationContract(),
) {
  return contract.lanes.map<ReleaseOwnableItem>((lane) => ({
    id: lane.id,
    title: lane.title,
    status: lane.status,
    owner: getProviderLaneOwner(lane),
    resolutionAction: lane.nextAction,
  }));
}
