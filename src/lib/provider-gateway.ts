import "server-only";

import type { StoredNotification } from "@/lib/notification-types";
import type { StoredOrder } from "@/lib/orders";
import {
  getExternalAuthProviderConfig,
  getLivePaymentProviderConfig,
  getLiveShippingProviderConfig,
  getNotificationProviderConfig,
  type RuntimeExternalAuthProviderConfig,
  type RuntimeLiveProviderConfig,
  type RuntimeNotificationProviderConfig,
} from "@/lib/live-provider-config";
import {
  OidcIdTokenVerificationError,
  verifyOidcIdToken,
} from "@/lib/oidc-id-token";
import { getSiteUrl } from "@/lib/site-content";

type ProviderJsonRecord = Record<string, unknown>;

export type ProviderCustomerIdentity = {
  issuer: string;
  email: string | null;
  phone: string | null;
  subject: string;
};

export type ExternalAuthSecurityContext = {
  codeVerifier: string;
  expectedNonce: string;
};

type ProviderFetchConfig = {
  label: string;
  timeoutMs: number;
};

const PROVIDER_RESPONSE_MAX_BYTES = 256 * 1024;

export class ProviderGatewayError extends Error {
  provider: string;
  statusCode: number;

  constructor(provider: string, message: string, statusCode = 502) {
    super(message);
    this.name = "ProviderGatewayError";
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

function isRecord(value: unknown): value is ProviderJsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeEmail(value: string | null | undefined) {
  const normalizedValue = normalizeValue(value).toLowerCase();
  return normalizedValue || null;
}

function normalizePhone(value: string | null | undefined) {
  const normalizedValue = normalizeValue(value).replace(/\D/g, "");
  return normalizedValue || null;
}

function normalizeIssuer(value: string) {
  const normalized = value.trim().replace(/\/$/, "");
  try {
    const issuer = new URL(normalized);
    const isLocalDevelopmentIssuer =
      issuer.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(issuer.hostname);
    if (issuer.protocol !== "https:" && !isLocalDevelopmentIssuer) return null;
    return issuer.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeSubject(value: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized && normalized.length <= 255 && !/[\u0000-\u001f\u007f]/.test(normalized)
    ? normalized
    : null;
}

function claimIsExplicitlyTrue(value: unknown, candidatePaths: string[]) {
  return candidatePaths.some((path) => readPathValue(value, path) === true);
}

function buildAbsoluteAppUrl(pathname: string) {
  try {
    return new URL(pathname, getSiteUrl()).toString();
  } catch {
    return pathname;
  }
}

function resolveProviderUrl(baseUrl: string, requestPath: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = requestPath.startsWith("/")
    ? requestPath.slice(1)
    : requestPath;

  return new URL(normalizedPath, normalizedBaseUrl).toString();
}

function formatAuthHeaderValue(headerName: string, token: string) {
  if (
    headerName.toLowerCase() === "authorization" &&
    !/^[a-z]+\s+/i.test(token)
  ) {
    return `Bearer ${token}`;
  }

  return token;
}

function buildProviderJsonHeaders(
  headerName: string,
  token: string,
  extraHeaders: HeadersInit = {},
) {
  const headers = new Headers(extraHeaders);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  headers.set(headerName, formatAuthHeaderValue(headerName, token));
  return headers;
}

async function readBoundedProviderResponse(
  response: Response,
  providerLabel: string,
) {
  const contentLength = Number.parseInt(
    response.headers.get("content-length") ?? "",
    10,
  );
  if (
    Number.isFinite(contentLength) &&
    contentLength > PROVIDER_RESPONSE_MAX_BYTES
  ) {
    throw new ProviderGatewayError(
      providerLabel,
      "Provider response exceeded the maximum accepted size.",
      502,
    );
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
      if (totalBytes > PROVIDER_RESPONSE_MAX_BYTES) {
        await reader.cancel();
        throw new ProviderGatewayError(
          providerLabel,
          "Provider response exceeded the maximum accepted size.",
          502,
        );
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes).toString("utf8");
}

async function parseProviderResponse(
  response: Response,
  providerLabel: string,
) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await readBoundedProviderResponse(response, providerLabel);

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }

  return text ? { message: text } : null;
}

async function requestProviderJson(
  url: string,
  config: ProviderFetchConfig,
  init: RequestInit,
) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    const payload = await parseProviderResponse(response, config.label);

    if (!response.ok) {
      const providerMessage =
        isRecord(payload) && typeof payload.error === "string"
          ? payload.error
          : isRecord(payload) && typeof payload.message === "string"
            ? payload.message
            : `Provider request failed with status ${response.status}.`;

      throw new ProviderGatewayError(config.label, providerMessage, 502);
    }

    return payload;
  } catch (error) {
    if (error instanceof ProviderGatewayError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderGatewayError(
        config.label,
        "Provider request timed out before a response was received.",
        504,
      );
    }

    throw new ProviderGatewayError(
      config.label,
      error instanceof Error
        ? error.message
        : "Provider request failed unexpectedly.",
      502,
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function readPathValue(value: unknown, path: string) {
  let currentValue: unknown = value;

  for (const key of path.split(".")) {
    if (!isRecord(currentValue) || !(key in currentValue)) {
      return null;
    }

    currentValue = currentValue[key];
  }

  return currentValue;
}

function pickFirstString(value: unknown, candidatePaths: string[]) {
  for (const path of candidatePaths) {
    const candidateValue = readPathValue(value, path);

    if (typeof candidateValue === "string" && candidateValue.trim()) {
      return candidateValue.trim();
    }
  }

  return null;
}

function ensureProviderRecord(value: unknown, providerLabel: string) {
  if (!isRecord(value)) {
    throw new ProviderGatewayError(
      providerLabel,
      "Provider returned an invalid payload shape.",
    );
  }

  return value;
}

function assertLiveRequestConfigured(
  config: RuntimeLiveProviderConfig | RuntimeNotificationProviderConfig,
) {
  if (!config.requestConfigured) {
    throw new ProviderGatewayError(
      config.label,
      `${config.label} is not fully configured for live outbound requests in this runtime.`,
      503,
    );
  }
}

function requireVerifiedShipmentWeightGrams(
  order: StoredOrder,
  providerLabel: string,
): number {
  const snapshot = order.shippingWeightSnapshot;
  const pricingSnapshot = order.pricingSnapshot;
  const reject = () => {
    throw new ProviderGatewayError(
      providerLabel,
      `Shipping booking for ${order.orderNumber} is blocked because its authority-backed product weight and packed-shipment snapshot are missing or inconsistent.`,
      409,
    );
  };

  if (
    !snapshot ||
    snapshot.unit !== "g" ||
    !pricingSnapshot ||
    snapshot.catalogVersion !== pricingSnapshot.catalogVersion ||
    snapshot.catalogHash !== pricingSnapshot.catalogHash ||
    !Number.isSafeInteger(snapshot.outerPackagingWeightGrams) ||
    snapshot.outerPackagingWeightGrams < 1 ||
    !Number.isSafeInteger(snapshot.additionalItemPackagingWeightGrams) ||
    snapshot.additionalItemPackagingWeightGrams < 0 ||
    !snapshot.packingEvidenceRef.trim() ||
    !snapshot.packingApprovedBy.trim() ||
    Number.isNaN(Date.parse(snapshot.packingApprovedAt))
  ) {
    return reject();
  }

  let itemCount = 0;
  let itemsWeightGrams = 0;
  let productPackagingWeightGrams = 0;
  const pricedQuantities = new Map(
    pricingSnapshot.lines.map((line) => [line.sku, line.quantity]),
  );
  if (
    pricedQuantities.size !== pricingSnapshot.lines.length ||
    order.lines.length !== pricingSnapshot.lines.length
  ) {
    return reject();
  }
  for (const line of order.lines) {
    const truth = line.catalogTruth;
    if (
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1 ||
      !Number.isSafeInteger(truth.itemWeightGrams) ||
      Number(truth.itemWeightGrams) < 1 ||
      !Number.isSafeInteger(truth.packagingWeightGrams) ||
      Number(truth.packagingWeightGrams) < 0 ||
      !truth.weightEvidenceRef?.trim() ||
      !truth.weightVerifiedBy?.trim() ||
      !truth.weightVerifiedAt ||
      Number.isNaN(Date.parse(truth.weightVerifiedAt))
    ) {
      return reject();
    }
    if (pricedQuantities.get(line.sku) !== line.quantity) {
      return reject();
    }
    itemCount += line.quantity;
    itemsWeightGrams += line.quantity * Number(truth.itemWeightGrams);
    productPackagingWeightGrams +=
      line.quantity * Number(truth.packagingWeightGrams);
    if (
      !Number.isSafeInteger(itemCount) ||
      !Number.isSafeInteger(itemsWeightGrams) ||
      !Number.isSafeInteger(productPackagingWeightGrams)
    ) {
      return reject();
    }
  }

  const totalPackagingWeightGrams =
    productPackagingWeightGrams +
    snapshot.outerPackagingWeightGrams +
    Math.max(0, itemCount - 1) *
      snapshot.additionalItemPackagingWeightGrams;
  const totalWeightGrams = itemsWeightGrams + totalPackagingWeightGrams;
  if (
    !Number.isSafeInteger(totalPackagingWeightGrams) ||
    !Number.isSafeInteger(totalWeightGrams) ||
    totalWeightGrams < 1 ||
    totalWeightGrams > 100_000 ||
    snapshot.itemCount !== itemCount ||
    snapshot.itemsWeightGrams !== itemsWeightGrams ||
    snapshot.productPackagingWeightGrams !== productPackagingWeightGrams ||
    snapshot.totalPackagingWeightGrams !== totalPackagingWeightGrams ||
    snapshot.totalWeightGrams !== totalWeightGrams
  ) {
    return reject();
  }

  return totalWeightGrams;
}

export async function createPaymentLinkWithProvider(order: StoredOrder) {
  const config = getLivePaymentProviderConfig();
  assertLiveRequestConfigured(config);
  const orderLocale = order.pricingSnapshot?.locale === "en" ? "en" : "ar";

  const response = ensureProviderRecord(
    await requestProviderJson(
      resolveProviderUrl(config.requestBaseUrl, config.requestPath),
      {
        label: config.label,
        timeoutMs: config.requestTimeoutMs,
      },
      {
        method: "POST",
        headers: buildProviderJsonHeaders(
          config.requestAuthHeaderName,
          config.requestAuthToken,
          {
            "Idempotency-Key": `cozmateks:${order.orderNumber}:payment-link`,
          },
        ),
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          amount: order.totalEstimate,
          currency: "SAR",
          callbackUrl: buildAbsoluteAppUrl(config.callbackPath),
          returnUrl: buildAbsoluteAppUrl(
            `/${orderLocale}/checkout/success?order=${encodeURIComponent(order.orderNumber)}`,
          ),
          customer: {
            fullName: order.customer.fullName,
            email: order.customer.email,
            phone: order.customer.phone,
          },
          shippingAddress: {
            city: order.customer.city,
            district: order.customer.district,
            addressLine: order.customer.addressLine,
          },
          metadata: {
            locale: orderLocale,
            paymentMethodId: order.paymentMethodId,
            shippingMethodId: order.shippingMethodId,
          },
          items: order.lines.map((line) => ({
            sku: line.sku,
            name: line.productName,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          })),
        }),
      },
    ),
    config.label,
  );

  const paymentReferenceId = pickFirstString(response, [
    "paymentReferenceId",
    "referenceId",
    "payment.referenceId",
    "payment.id",
    "data.referenceId",
    "data.id",
    "id",
  ]);

  if (!paymentReferenceId) {
    throw new ProviderGatewayError(
      config.label,
      "Payment provider did not return a payment reference id.",
    );
  }

  return {
    providerLabel: config.label,
    paymentReferenceId,
    settlementReference: pickFirstString(response, [
      "settlementReference",
      "settlement.reference",
      "payment.settlementReference",
      "data.settlementReference",
    ]),
    providerEventId: pickFirstString(response, [
      "eventId",
      "event.id",
      "payment.eventId",
      "data.eventId",
    ]),
    paymentUrl: pickFirstString(response, [
      "paymentUrl",
      "checkoutUrl",
      "url",
      "payment.url",
      "data.paymentUrl",
    ]),
  };
}

export async function bookShipmentWithProvider(order: StoredOrder) {
  const config = getLiveShippingProviderConfig();
  assertLiveRequestConfigured(config);
  const totalWeightGrams = requireVerifiedShipmentWeightGrams(
    order,
    config.label,
  );

  const response = ensureProviderRecord(
    await requestProviderJson(
      resolveProviderUrl(config.requestBaseUrl, config.requestPath),
      {
        label: config.label,
        timeoutMs: config.requestTimeoutMs,
      },
      {
        method: "POST",
        headers: buildProviderJsonHeaders(
          config.requestAuthHeaderName,
          config.requestAuthToken,
          {
            "Idempotency-Key": `cozmateks:${order.orderNumber}:shipping-booking`,
          },
        ),
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          callbackUrl: buildAbsoluteAppUrl(config.callbackPath),
          shipment: {
            shippingMethodId: order.shippingMethodId,
            totalWeightGrams,
            cashOnDeliveryAmount:
              order.paymentMethodId === "cash_on_delivery"
                ? order.totalEstimate
                : 0,
          },
          items: order.lines.map((line) => ({
            sku: line.sku,
            name: line.productName,
            quantity: line.quantity,
            itemWeightGrams: line.catalogTruth.itemWeightGrams,
            packagingWeightGrams: line.catalogTruth.packagingWeightGrams,
          })),
          customer: {
            fullName: order.customer.fullName,
            phone: order.customer.phone,
            email: order.customer.email,
          },
          destination: {
            city: order.customer.city,
            district: order.customer.district,
            addressLine: order.customer.addressLine,
            notes: order.customer.notes,
          },
        }),
      },
    ),
    config.label,
  );

  const bookingReference = pickFirstString(response, [
    "bookingReference",
    "referenceId",
    "shipment.bookingReference",
    "shipment.id",
    "data.bookingReference",
    "data.id",
    "id",
  ]);

  if (!bookingReference) {
    throw new ProviderGatewayError(
      config.label,
      "Shipping provider did not return a booking reference.",
    );
  }

  return {
    providerLabel: config.label,
    bookingReference,
    trackingNumber: pickFirstString(response, [
      "trackingNumber",
      "tracking.number",
      "shipment.trackingNumber",
      "data.trackingNumber",
    ]),
    providerEventId: pickFirstString(response, [
      "eventId",
      "event.id",
      "shipment.eventId",
      "data.eventId",
    ]),
  };
}

export async function dispatchNotificationWithProvider(
  notification: StoredNotification,
  order: StoredOrder,
) {
  const config = getNotificationProviderConfig();
  assertLiveRequestConfigured(config);

  const response = ensureProviderRecord(
    await requestProviderJson(
      resolveProviderUrl(config.requestBaseUrl, config.requestPath),
      {
        label: config.label,
        timeoutMs: config.requestTimeoutMs,
      },
      {
        method: "POST",
        headers: buildProviderJsonHeaders(
          config.requestAuthHeaderName,
          config.requestAuthToken,
          {
            "Idempotency-Key": `cozmateks:${notification.id}:notification`,
          },
        ),
        body: JSON.stringify({
          notificationId: notification.id,
          orderNumber: notification.orderNumber,
          templateKey: notification.templateKey,
          channel: notification.channel,
          callbackUrl: config.callbackConfigured
            ? buildAbsoluteAppUrl(config.callbackPath)
            : null,
          recipient: {
            fullName: order.customer.fullName,
            phone: order.customer.phone,
            email: order.customer.email,
          },
          content: {
            label: notification.label,
            note: notification.note,
          },
          order: {
            status: order.status,
            totalEstimate: order.totalEstimate,
            trackingNumber: order.providerBindings.shipping.trackingNumber,
            paymentReferenceId: order.providerBindings.payment.referenceId,
            paymentUrl: order.providerBindings.payment.paymentUrl,
          },
        }),
      },
    ),
    config.label,
  );

  const deliveryId = pickFirstString(response, [
    "deliveryId",
    "messageId",
    "notification.id",
    "data.deliveryId",
    "data.id",
    "id",
  ]);

  if (!deliveryId) {
    throw new ProviderGatewayError(
      config.label,
      "Notification provider did not return a delivery id.",
    );
  }

  return {
    providerLabel: config.label,
    providerDeliveryId: deliveryId,
    providerEventId: pickFirstString(response, [
      "eventId",
      "event.id",
      "notification.eventId",
      "data.eventId",
    ]),
    sentAt:
      pickFirstString(response, [
        "sentAt",
        "processedAt",
        "notification.sentAt",
        "data.sentAt",
      ]) ?? new Date().toISOString(),
  };
}

export function buildExternalAuthProviderAuthorizeUrl(
  stateToken: string,
  security?: { nonce: string; codeChallenge: string },
) {
  const config = getExternalAuthProviderConfig();

  if (!config.externalAuthConfigured) {
    throw new ProviderGatewayError(
      config.label,
      "Customer auth provider is not fully configured for external authorization.",
      503,
    );
  }

  const authorizeUrl = new URL(config.authorizeUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    buildAbsoluteAppUrl(config.callbackPath),
  );
  authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("state", stateToken);
  if (security) {
    authorizeUrl.searchParams.set("nonce", security.nonce);
    authorizeUrl.searchParams.set("code_challenge", security.codeChallenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
  }

  return authorizeUrl.toString();
}

async function exchangeAuthorizationCode(
  config: RuntimeExternalAuthProviderConfig,
  code: string,
  codeVerifier?: string,
) {
  const response = ensureProviderRecord(
    await requestProviderJson(
      config.tokenUrl,
      {
        label: config.label,
        timeoutMs: 10_000,
      },
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: buildAbsoluteAppUrl(config.callbackPath),
          ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
        }).toString(),
      },
    ),
    config.label,
  );

  const accessToken = pickFirstString(response, [
    "access_token",
    "accessToken",
    "data.accessToken",
    "tokens.accessToken",
  ]);

  if (!accessToken) {
    throw new ProviderGatewayError(
      config.label,
      "Auth provider did not return an access token for the authorization code exchange.",
    );
  }

  return {
    accessToken,
    tokenPayload: response,
  };
}

export async function exchangeExternalAuthCodeForCustomerIdentity(
  code: string,
  securityContext?: ExternalAuthSecurityContext,
) {
  const config = getExternalAuthProviderConfig();

  if (!config.externalAuthConfigured) {
    throw new ProviderGatewayError(
      config.label,
      "Customer auth provider is not configured for external authorization.",
      503,
    );
  }

  const issuer = normalizeIssuer(config.issuer);
  if (!issuer) {
    throw new ProviderGatewayError(config.label, "Customer auth provider issuer is invalid.", 503);
  }
  if (!securityContext) {
    throw new ProviderGatewayError(
      config.label,
      "Customer auth cannot continue without its original PKCE and nonce context.",
      401,
    );
  }
  const exchange = await exchangeAuthorizationCode(
    config,
    code,
    securityContext.codeVerifier,
  );
  let verifiedIdToken;
  try {
    verifiedIdToken = await verifyOidcIdToken(
      readPathValue(exchange.tokenPayload, "id_token"),
      {
        clientId: config.clientId,
        issuer: config.issuer,
        jwksUrl: config.jwksUrl,
        providerLabel: config.label,
      },
      securityContext.expectedNonce,
    );
  } catch (error) {
    if (error instanceof OidcIdTokenVerificationError) {
      throw new ProviderGatewayError(
        config.label,
        error.message,
        error.statusCode,
      );
    }
    throw error;
  }
  const idTokenSubject = verifiedIdToken.subject;
  const profilePayload =
    config.profileUrl && config.profileUrl.length > 0
      ? ensureProviderRecord(
          await requestProviderJson(
            config.profileUrl,
            {
              label: config.label,
              timeoutMs: 10_000,
            },
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${exchange.accessToken}`,
              },
            },
          ),
          config.label,
        )
      : verifiedIdToken.claims;

  const email = claimIsExplicitlyTrue(profilePayload, [
    "email_verified",
    "user.email_verified",
    "profile.email_verified",
    "data.email_verified",
  ])
    ? normalizeEmail(
        pickFirstString(profilePayload, [
          "email",
          "user.email",
          "profile.email",
          "data.email",
        ]),
      )
    : null;
  const phone = claimIsExplicitlyTrue(profilePayload, [
    "phone_number_verified",
    "phone_verified",
    "user.phone_verified",
    "profile.phone_verified",
    "data.phone_verified",
  ])
    ? normalizePhone(
        pickFirstString(profilePayload, [
          "phone",
          "phoneNumber",
          "user.phone",
          "profile.phone",
          "data.phone",
        ]),
      )
    : null;
  const profileSubject = normalizeSubject(pickFirstString(profilePayload, [
      "sub",
      "subject",
      "user.id",
      "profile.id",
      "data.id",
    ]));
  if (profileSubject && idTokenSubject !== profileSubject) {
    throw new ProviderGatewayError(config.label, "Auth provider subject claim is missing or inconsistent.", 401);
  }

  return {
    issuer,
    email,
    phone,
    subject: idTokenSubject,
  } satisfies ProviderCustomerIdentity;
}
