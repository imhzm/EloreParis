import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_ACCESS_MAX_AGE_SECONDS,
  CUSTOMER_ACCOUNT_COOKIE,
  CUSTOMER_ACCOUNT_MAX_AGE_SECONDS,
  bindAuthorityCustomerProviderIdentity,
  createAuthorityCustomerProviderSession,
  exchangeAuthorityCustomerProviderAuthStateToken,
  ORDER_ACCESS_COOKIE,
  ORDER_ACCESS_MAX_AGE_SECONDS,
} from "@/lib/order-authority";
import {
  exchangeExternalAuthCodeForCustomerIdentity,
  ProviderGatewayError,
} from "@/lib/provider-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/ar/account/orders";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const stateToken = requestUrl.searchParams.get("state")?.trim();
  const authorizationCode = requestUrl.searchParams.get("code")?.trim();
  const returnTo = resolveReturnTo(requestUrl.searchParams.get("returnTo"));
  let failurePath = returnTo.startsWith("/en/")
    ? "/en/track-order"
    : "/ar/track-order";
  let exchangeResult = null;

  if (!exchangeResult && stateToken && authorizationCode) {
    try {
      const authState = await exchangeAuthorityCustomerProviderAuthStateToken(
        stateToken,
      );

      if (authState) {
        failurePath = authState.returnTo.startsWith("/en/")
          ? "/en/track-order"
          : "/ar/track-order";
        const customerIdentity =
          await exchangeExternalAuthCodeForCustomerIdentity(authorizationCode, {
            codeVerifier: authState.codeVerifier,
            expectedNonce: authState.nonce,
          });
        const identityMatches =
          await bindAuthorityCustomerProviderIdentity(
            authState.customerKey,
            customerIdentity,
          );

        if (identityMatches) {
          exchangeResult = await createAuthorityCustomerProviderSession(
            authState.customerKey,
            authState.orderNumber,
            customerIdentity,
          );
        }

        if (exchangeResult) {
          const response = NextResponse.redirect(
            new URL(resolveReturnTo(authState.returnTo), requestUrl),
            307,
          );

          response.cookies.set({
            name: CUSTOMER_ACCOUNT_COOKIE,
            value: exchangeResult.customerAccountToken,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: CUSTOMER_ACCOUNT_MAX_AGE_SECONDS,
          });
          response.cookies.set({
            name: CUSTOMER_ACCESS_COOKIE,
            value: exchangeResult.customerAccessToken,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: CUSTOMER_ACCESS_MAX_AGE_SECONDS,
          });
          response.cookies.set({
            name: ORDER_ACCESS_COOKIE,
            value: exchangeResult.orderAccessToken,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: ORDER_ACCESS_MAX_AGE_SECONDS,
          });
          response.headers.set("Cache-Control", "no-store");

          return response;
        }
      }
    } catch (error) {
      if (!(error instanceof ProviderGatewayError)) {
        throw error;
      }
    }
  }

  if (!exchangeResult) {
    return NextResponse.redirect(new URL(failurePath, requestUrl), 307);
  }

  const response = NextResponse.redirect(new URL(returnTo, requestUrl), 307);

  response.cookies.set({
    name: CUSTOMER_ACCOUNT_COOKIE,
    value: exchangeResult.customerAccountToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_ACCOUNT_MAX_AGE_SECONDS,
  });
  response.cookies.set({
    name: CUSTOMER_ACCESS_COOKIE,
    value: exchangeResult.customerAccessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_ACCESS_MAX_AGE_SECONDS,
  });
  response.cookies.set({
    name: ORDER_ACCESS_COOKIE,
    value: exchangeResult.orderAccessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORDER_ACCESS_MAX_AGE_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
