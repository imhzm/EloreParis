import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createAuthorityCustomerProviderAuthHandoffPath,
  exchangeAuthorityCustomerAccessHandoffToken,
} from "@/lib/order-authority";
import { isLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const localeParam = requestUrl.searchParams.get("locale")?.trim() ?? "";
  const locale = isLocale(localeParam) ? localeParam : "ar";
  const trackingPath = `/${locale}/track-order`;
  const accountOrdersPath = `/${locale}/account/orders`;
  const handoffToken = requestUrl.searchParams.get("token")?.trim();
  const exchangeResult =
    await exchangeAuthorityCustomerAccessHandoffToken(handoffToken);

  if (!exchangeResult) {
    return NextResponse.redirect(new URL(trackingPath, requestUrl), 307);
  }

  const providerAuthPath = await createAuthorityCustomerProviderAuthHandoffPath(
    exchangeResult.customerKey,
    exchangeResult.orderNumber,
    accountOrdersPath,
  );

  if (!providerAuthPath) {
    return NextResponse.redirect(new URL(trackingPath, requestUrl), 307);
  }

  return NextResponse.redirect(
    new URL(providerAuthPath, requestUrl),
    307,
  );
}
