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

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function parseIdTokenClaims(value: unknown, providerLabel: string) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parts = value.split(".");
  if (parts.length !== 3) {
    throw new ProviderGatewayError(providerLabel, "Auth provider returned a malformed id_token.");
  }
  try {
    const header = ensureProviderRecord(
      JSON.parse(base64UrlDecode(parts[0])) as unknown,
      providerLabel,
    );
    if (
      typeof header.alg !== "string" ||
      !["RS256", "PS256", "ES256"].includes(header.alg)
    ) {
      throw new ProviderGatewayError(
        providerLabel,
        "Auth provider id_token uses an unsupported signing algorithm.",
        401,
      );
    }
    const claims = JSON.parse(base64UrlDecode(parts[1])) as unknown;
    return ensureProviderRecord(claims, providerLabel);
  } catch (error) {
    if (error instanceof ProviderGatewayError) throw error;
    throw new ProviderGatewayError(providerLabel, "Auth provider returned invalid id_token claims.");
  }
}

function claimIsExplicitlyTrue(value: unknown, candidatePaths: string[]) {
  return candidatePaths.some((path) => readPathValue(value, path) === true);
}

function validateIdTokenClaims({
  claims,
  config,
  expectedNonce,
}: {
  claims: ProviderJsonRecord;
  config: RuntimeExternalAuthProviderConfig;
  expectedNonce: string;
}) {
  const issuer = normalizeIssuer(pickFirstString(claims, ["iss"]) ?? "");
  const configuredIssuer = normalizeIssuer(config.issuer);
  const subject = normalizeSubject(pickFirstString(claims, ["sub"]));
  const nonce = pickFirstString(claims, ["nonce"]);
  const audience = readPathValue(claims, "aud");
  const audienceMatches =
    audience === config.clientId ||
    (Array.isArray(audience) && audience.some((entry) => entry === config.clientId));
  const expiresAt = readPathValue(claims, "exp");

  if (
    !issuer ||
    !configuredIssuer ||
    issuer !== configuredIssuer ||
    !subject ||
    nonce !== expectedNonce ||
    !audienceMatches ||
    typeof expiresAt !== "number" ||
    expiresAt * 1000 <= Date.now()
  ) {
    throw new ProviderGatewayError(config.label, "Auth provider id_token claims failed validation.", 401);
  }

  return subject;
}

function buildAbsoluteAppUrl(pathname: string) {
  try {
    return new URL(pathname, getSiteUrl()).toString();
  } catch {
    return pathname;
  }
}

function resolveProviderUrl(baseUrl: string, requestPath: string) {
  if (/^https?:\/\//i.test(requestPath)) {
    return requestPath;
  }

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

async function parseProviderResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json().catch(() => null)) as unknown;
  }

  const text = await response.text().catch(() => "");
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
      signal: controller.signal,
    });
    const payload = await parseProviderResponse(response);

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
            totalWeight: order.lines.reduce(
              (sum, line) => sum + Math.max(line.quantity, 1),
              0,
            ),
            cashOnDeliveryAmount:
              order.paymentMethodId === "cash_on_delivery"
                ? order.totalEstimate
                : 0,
          },
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
          items: order.lines.map((line) => ({
            sku: line.sku,
            name: line.productName,
            quantity: line.quantity,
          })),
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
  const exchange = await exchangeAuthorizationCode(
    config,
    code,
    securityContext?.codeVerifier,
  );
  const idTokenClaims = parseIdTokenClaims(
    readPathValue(exchange.tokenPayload, "id_token"),
    config.label,
  );
  if (idTokenClaims && !securityContext) {
    throw new ProviderGatewayError(
      config.label,
      "Auth provider id_token cannot be accepted without the original nonce context.",
      401,
    );
  }
  const idTokenSubject = idTokenClaims && securityContext
    ? validateIdTokenClaims({
        claims: idTokenClaims,
        config,
        expectedNonce: securityContext.expectedNonce,
      })
    : null;
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
      : exchange.tokenPayload;

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
  const subject = idTokenSubject ?? profileSubject;

  if (!subject || (idTokenSubject && profileSubject && idTokenSubject !== profileSubject)) {
    throw new ProviderGatewayError(config.label, "Auth provider subject claim is missing or inconsistent.", 401);
  }

  return {
    issuer,
    email,
    phone,
    subject,
  } satisfies ProviderCustomerIdentity;
}
