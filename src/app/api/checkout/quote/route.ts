import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CatalogQuoteError,
  CHECKOUT_SESSION_COOKIE,
  CHECKOUT_SESSION_MAX_AGE_SECONDS,
  createCheckoutQuote,
  createCheckoutSessionId,
} from "@/lib/catalog-quote";
import { getCatalogAuthorityReadiness } from "@/lib/catalog-authority";
import { isPublicCommerceAvailable } from "@/lib/release-controls";
import { getSearchRuntimeStage } from "@/lib/search-visibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUOTE_REQUEST_BYTES = 16 * 1024;

async function readQuoteBody(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    throw new CatalogQuoteError(
      "unsupported_media_type",
      "Quote requests require application/json.",
      415,
    );
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_QUOTE_REQUEST_BYTES) {
    throw new CatalogQuoteError("quote_payload_too_large", "Quote payload is too large.", 413);
  }
  if (!request.body) {
    throw new CatalogQuoteError("invalid_json", "Quote payload is empty.", 400);
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_QUOTE_REQUEST_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new CatalogQuoteError("quote_payload_too_large", "Quote payload is too large.", 413);
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new CatalogQuoteError("invalid_json", "Quote payload is not valid JSON.", 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const catalogReadiness = getCatalogAuthorityReadiness();
    if (
      !catalogReadiness.ready ||
      (getSearchRuntimeStage() === "production" && !isPublicCommerceAvailable())
    ) {
      throw new CatalogQuoteError(
        "commerce_disabled",
        "Checkout quoting is unavailable until catalog and commerce approvals are complete.",
        503,
      );
    }

    const body = await readQuoteBody(request);
    const existingSession = request.cookies.get(CHECKOUT_SESSION_COOKIE)?.value;
    const checkoutSessionId = existingSession || createCheckoutSessionId();
    const quote = createCheckoutQuote(body, checkoutSessionId);
    const response = NextResponse.json(
      {
        quote: {
          quoteId: quote.quoteId,
          locale: quote.locale,
          currency: quote.currency,
          taxInclusive: quote.taxInclusive,
          vatRateBps: quote.vatRateBps,
          expiresAt: quote.expiresAt,
          policySet: quote.policySet,
          lines: quote.lines.map((line) => ({
            productSlug: line.productSlug,
            sku: line.sku,
            nameAr: line.nameAr,
            nameEn: line.nameEn,
            labelAr: line.labelAr,
            labelEn: line.labelEn,
            size: line.size,
            quantity: line.quantity,
            unitGrossHalalas: line.unitGrossHalalas,
            lineGrossHalalas: line.lineGrossHalalas,
            lineVatHalalas: line.lineVatHalalas,
          })),
          shipping: quote.shipping,
          paymentOptions: quote.paymentOptions,
          subtotalGrossHalalas: quote.subtotalGrossHalalas,
          subtotalVatHalalas: quote.subtotalVatHalalas,
          promotion: quote.promotion,
          discountGrossHalalas: quote.discountGrossHalalas,
          discountVatHalalas: quote.discountVatHalalas,
          totalGrossHalalas: quote.totalGrossHalalas,
          totalVatHalalas: quote.totalVatHalalas,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
    if (!existingSession) {
      response.cookies.set({
        name: CHECKOUT_SESSION_COOKIE,
        value: checkoutSessionId,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: CHECKOUT_SESSION_MAX_AGE_SECONDS,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof CatalogQuoteError) {
      return NextResponse.json(
        { error: error.message, code: error.code, issues: error.issues },
        {
          status: error.statusCode,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
    return NextResponse.json(
      { error: "Quote authority failed.", code: "quote_internal_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
