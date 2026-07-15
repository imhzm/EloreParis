import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";
import {
  createAuthorityOrderFromQuote,
  OrderAuthorityError,
  RECENT_ORDER_COOKIE,
  RECENT_ORDER_MAX_AGE_SECONDS,
} from "@/lib/order-authority";
import {
  MAX_ORDER_REQUEST_BYTES,
  parseCreateOrderRequest,
} from "@/lib/order-request-validation";
import { ProviderGatewayError } from "@/lib/provider-gateway";
import { getCatalogAuthorityReadiness } from "@/lib/catalog-authority";
import { isPublicCommerceAvailable } from "@/lib/release-controls";
import { getSearchRuntimeStage } from "@/lib/search-visibility";
import { CHECKOUT_SESSION_COOKIE } from "@/lib/catalog-quote";
import { drainAuthorityOutbox } from "@/lib/order-outbox";
import { redactOrderForCustomerView } from "@/lib/customer-order-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(
  code: string,
  error: string,
  status: number,
) {
  return NextResponse.json({ error, code }, { status });
}

async function readBoundedRequestBody(request: Request) {
  if (!request.body) return { ok: true as const, body: "" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    byteLength += value.byteLength;
    if (byteLength > MAX_ORDER_REQUEST_BYTES) {
      try {
        await reader.cancel();
      } catch {
        // The payload is already rejected even if the client closed first.
      }
      return { ok: false as const };
    }

    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();
  return { ok: true as const, body };
}

export async function POST(request: NextRequest) {
  try {
    const catalogAuthority = getCatalogAuthorityReadiness();
    if (
      getSearchRuntimeStage() === "production" &&
      (!isPublicCommerceAvailable() || !catalogAuthority.ready)
    ) {
      return errorResponse(
        "commerce_disabled",
        "إنشاء الطلبات غير متاح مؤقتًا حتى اكتمال جاهزية المتجر.",
        503,
      );
    }

    const contentType =
      request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ??
      "";
    if (contentType !== "application/json") {
      return errorResponse(
        "unsupported_media_type",
        "يجب إرسال بيانات الطلب بصيغة JSON.",
        415,
      );
    }

    const declaredContentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(declaredContentLength) &&
      declaredContentLength > MAX_ORDER_REQUEST_BYTES
    ) {
      return errorResponse(
        "payload_too_large",
        "حجم بيانات الطلب أكبر من الحد المسموح.",
        413,
      );
    }

    const requestBody = await readBoundedRequestBody(request);
    if (!requestBody.ok) {
      return errorResponse(
        "payload_too_large",
        "حجم بيانات الطلب أكبر من الحد المسموح.",
        413,
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(requestBody.body) as unknown;
    } catch {
      return errorResponse(
        "invalid_json",
        "تعذر قراءة بيانات الطلب. يرجى إرسال JSON صالح.",
        400,
      );
    }

    const parsedRequest = parseCreateOrderRequest(body);
    if (!parsedRequest.ok) {
      return errorResponse(
        "invalid_order_payload",
        "بيانات الطلب غير صالحة أو تتجاوز الحدود المسموحة.",
        400,
      );
    }

    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    const checkoutSessionId =
      request.cookies.get(CHECKOUT_SESSION_COOKIE)?.value ?? "";
    const { order, recentOrderToken, replayed } =
      await createAuthorityOrderFromQuote({
        ...parsedRequest.value,
        idempotencyKey,
        checkoutSessionId,
      });
    const response = NextResponse.json(
      {
        order: redactOrderForCustomerView(order),
        notifications: [],
      },
      {
        status: replayed ? 200 : 201,
        headers: {
          "Cache-Control": "no-store",
          "Idempotency-Replayed": replayed ? "true" : "false",
        },
      },
    );

    response.cookies.set({
      name: RECENT_ORDER_COOKIE,
      value: recentOrderToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: RECENT_ORDER_MAX_AGE_SECONDS,
    });

    if (!replayed) {
      after(async () => {
        try {
          await drainAuthorityOutbox({ aggregateId: order.orderNumber, limit: 10 });
        } catch (error) {
          console.error(
            "Authority outbox post-response drain failed.",
            error instanceof Error ? error.message : "Unknown outbox failure.",
          );
        }
      });
    }

    return response;
  } catch (error) {
    if (error instanceof OrderAuthorityError) {
      return errorResponse(error.code, error.message, error.statusCode);
    }

    if (error instanceof ProviderGatewayError) {
      return errorResponse(
        "provider_unavailable",
        "تعذر إكمال الربط مع مزود الدفع أو الشحن حاليًا. يرجى المحاولة لاحقًا.",
        error.statusCode,
      );
    }

    return errorResponse(
      "internal_error",
      "تعذر إنشاء الطلب حاليًا. يرجى المحاولة مرة أخرى لاحقًا.",
      500,
    );
  }
}
