import { createServer } from "node:http";
import process from "node:process";

const host = process.env.MOCK_PROVIDER_HOST ?? "127.0.0.1";
const port = Number(process.env.MOCK_PROVIDER_PORT ?? 4071);
const baseUrl = process.env.MOCK_PROVIDER_BASE_URL ?? `http://${host}:${port}`;
const paymentApiKey =
  process.env.MOCK_PAYMENT_PROVIDER_API_KEY ?? "smoke-payment-provider-api-key";
const shippingApiKey =
  process.env.MOCK_SHIPPING_PROVIDER_API_KEY ?? "smoke-shipping-provider-api-key";
const notificationApiKey =
  process.env.MOCK_NOTIFICATION_PROVIDER_API_KEY ??
  "smoke-notification-provider-api-key";
const authClientId =
  process.env.MOCK_AUTH_PROVIDER_CLIENT_ID ?? "smoke-auth-client-id";
const authClientSecret =
  process.env.MOCK_AUTH_PROVIDER_CLIENT_SECRET ?? "smoke-auth-client-secret";
const authProfileEmail =
  process.env.MOCK_AUTH_PROVIDER_EMAIL ?? "smoke@example.com";
const authProfilePhone =
  process.env.MOCK_AUTH_PROVIDER_PHONE ?? "0501234567";
const authProfileSubject =
  process.env.MOCK_AUTH_PROVIDER_SUBJECT ?? "smoke-customer-01";

let paymentCounter = 1;
let shippingCounter = 1;
let notificationCounter = 1;
let authCounter = 1;
const authorizationCodes = new Map();
const accessTokens = new Map();

function formatCounter(prefix, counter) {
  return `${prefix}-${String(counter).padStart(2, "0")}`;
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

function sendHtml(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.end(body);
}

async function readRequestBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(request, response) {
  const rawBody = await readRequestBody(request);

  try {
    return JSON.parse(rawBody);
  } catch {
    sendJson(response, 400, {
      error: "Provider mock expected a JSON body.",
    });
    return null;
  }
}

function readBearerToken(request) {
  const authorizationHeader = request.headers.authorization?.trim() ?? "";
  const bearerPrefix = "Bearer ";

  if (!authorizationHeader.startsWith(bearerPrefix)) {
    return null;
  }

  return authorizationHeader.slice(bearerPrefix.length).trim();
}

function assertBearerToken(request, response, expectedToken, providerLabel) {
  const receivedToken = readBearerToken(request);

  if (receivedToken !== expectedToken) {
    sendJson(response, 401, {
      error: `${providerLabel} authorization failed.`,
    });
    return false;
  }

  return true;
}

function buildNotificationDeliveryId() {
  const deliveryId = formatCounter("NTF-SMOKE", notificationCounter);
  notificationCounter += 1;
  return deliveryId;
}

function buildPaymentReference() {
  const referenceId = formatCounter("PAY-SMOKE", paymentCounter);
  paymentCounter += 1;
  return referenceId;
}

function buildShippingReference() {
  const bookingReference = formatCounter("SHP-SMOKE", shippingCounter);
  shippingCounter += 1;
  return bookingReference;
}

function buildAuthCode() {
  const code = formatCounter("auth-code", authCounter);
  authCounter += 1;
  return code;
}

function buildAccessToken(code) {
  return `smoke-access-${code.toLowerCase()}`;
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", baseUrl);

  if (request.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/payments/links") {
    if (
      !assertBearerToken(
        request,
        response,
        paymentApiKey,
        "Payment provider",
      )
    ) {
      return;
    }

    const body = await readJsonBody(request, response);

    if (!body) {
      return;
    }

    if (typeof body.orderNumber !== "string" || !body.orderNumber.trim()) {
      sendJson(response, 400, {
        error: "orderNumber is required.",
      });
      return;
    }

    const paymentReferenceId = buildPaymentReference();
    sendJson(response, 200, {
      paymentReferenceId,
      paymentUrl: `${baseUrl}/checkout/pay/${encodeURIComponent(paymentReferenceId)}`,
      eventId: `${paymentReferenceId.toLowerCase()}-link`,
    });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/shipments/bookings") {
    if (
      !assertBearerToken(
        request,
        response,
        shippingApiKey,
        "Shipping provider",
      )
    ) {
      return;
    }

    const body = await readJsonBody(request, response);

    if (!body) {
      return;
    }

    if (typeof body.orderNumber !== "string" || !body.orderNumber.trim()) {
      sendJson(response, 400, {
        error: "orderNumber is required.",
      });
      return;
    }

    const bookingReference = buildShippingReference();
    sendJson(response, 200, {
      bookingReference,
      eventId: `${bookingReference.toLowerCase()}-booked`,
    });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/notifications/send") {
    if (
      !assertBearerToken(
        request,
        response,
        notificationApiKey,
        "Notification provider",
      )
    ) {
      return;
    }

    const body = await readJsonBody(request, response);

    if (!body) {
      return;
    }

    if (typeof body.notificationId !== "string" || !body.notificationId.trim()) {
      sendJson(response, 400, {
        error: "notificationId is required.",
      });
      return;
    }

    const deliveryId = buildNotificationDeliveryId();
    sendJson(response, 200, {
      deliveryId,
      eventId: `${deliveryId.toLowerCase()}-accepted`,
      sentAt: new Date().toISOString(),
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/auth/authorize") {
    const clientId = requestUrl.searchParams.get("client_id")?.trim() ?? "";
    const redirectUri = requestUrl.searchParams.get("redirect_uri")?.trim() ?? "";
    const state = requestUrl.searchParams.get("state")?.trim() ?? "";

    if (!clientId || clientId !== authClientId || !redirectUri || !state) {
      sendJson(response, 400, {
        error: "client_id, redirect_uri, and state are required.",
      });
      return;
    }

    const authorizationCode = buildAuthCode();
    authorizationCodes.set(authorizationCode, {
      email: authProfileEmail,
      phone: authProfilePhone,
      subject: authProfileSubject,
    });

    response.statusCode = 307;
    response.setHeader(
      "Location",
      `${redirectUri}?code=${encodeURIComponent(authorizationCode)}&state=${encodeURIComponent(state)}`,
    );
    response.end();
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/auth/token") {
    const body = new URLSearchParams(await readRequestBody(request));
    const grantType = body.get("grant_type")?.trim() ?? "";
    const code = body.get("code")?.trim() ?? "";
    const clientId = body.get("client_id")?.trim() ?? "";
    const clientSecret = body.get("client_secret")?.trim() ?? "";

    if (
      grantType !== "authorization_code" ||
      !code ||
      clientId !== authClientId ||
      clientSecret !== authClientSecret ||
      !authorizationCodes.has(code)
    ) {
      sendJson(response, 400, {
        error: "Authorization code exchange failed.",
      });
      return;
    }

    const accessToken = buildAccessToken(code);
    accessTokens.set(accessToken, authorizationCodes.get(code));
    authorizationCodes.delete(code);

    sendJson(response, 200, {
      access_token: accessToken,
      token_type: "Bearer",
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/auth/profile") {
    const accessToken = readBearerToken(request);
    const identity = accessToken ? accessTokens.get(accessToken) : null;

    if (!identity) {
      sendJson(response, 401, {
        error: "Auth profile authorization failed.",
      });
      return;
    }

    sendJson(response, 200, {
      email: identity.email,
      phone: identity.phone,
      sub: identity.subject,
    });
    return;
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname.startsWith("/checkout/pay/")
  ) {
    sendHtml(
      response,
      200,
      "<!doctype html><title>Smoke payment link</title><p>Smoke provider payment link</p>",
    );
    return;
  }

  sendJson(response, 404, {
    error: `No mock provider route matched ${request.method} ${requestUrl.pathname}.`,
  });
});

server.listen(port, host, () => {
  // Keep output small; smoke-check reads health for readiness.
  console.log(`Mock provider server listening on ${baseUrl}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 1000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
