import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createAuthorityCustomerProviderAuthHandoffPath,
  exchangeAuthorityCustomerAccessHandoffToken,
} from "@/lib/order-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const handoffToken = requestUrl.searchParams.get("token")?.trim();
  const exchangeResult =
    await exchangeAuthorityCustomerAccessHandoffToken(handoffToken);

  if (!exchangeResult) {
    return NextResponse.redirect(new URL("/track-order", requestUrl), 307);
  }

  const providerAuthPath = await createAuthorityCustomerProviderAuthHandoffPath(
    exchangeResult.customerKey,
    exchangeResult.orderNumber,
  );

  return NextResponse.redirect(
    new URL(providerAuthPath, requestUrl),
    307,
  );
}
