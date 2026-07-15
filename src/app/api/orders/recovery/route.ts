import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CHECKOUT_SESSION_COOKIE } from "@/lib/catalog-quote";
import { redactOrderForCustomerView } from "@/lib/customer-order-view";
import {
  OrderAuthorityError,
  RECENT_ORDER_COOKIE,
  RECENT_ORDER_MAX_AGE_SECONDS,
  recoverAuthorityOrderAttempt,
} from "@/lib/order-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const queryKeys = Array.from(request.nextUrl.searchParams.keys());
    const idempotencyKeys = request.nextUrl.searchParams.getAll("idempotencyKey");
    if (
      queryKeys.length !== 1 ||
      queryKeys[0] !== "idempotencyKey" ||
      idempotencyKeys.length !== 1
    ) {
      return json(
        { error: "Recovery requires exactly one idempotencyKey.", code: "recovery_query_invalid" },
        400,
      );
    }

    const checkoutSessionId =
      request.cookies.get(CHECKOUT_SESSION_COOKIE)?.value ?? "";
    const result = await recoverAuthorityOrderAttempt(
      checkoutSessionId,
      idempotencyKeys[0],
    );
    if (result.state !== "completed") return json(result);

    const response = json({
      state: "completed",
      order: redactOrderForCustomerView(result.order),
    });
    response.cookies.set({
      name: RECENT_ORDER_COOKIE,
      value: result.recentOrderToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: RECENT_ORDER_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof OrderAuthorityError) {
      return json({ error: error.message, code: error.code }, error.statusCode);
    }
    return json(
      { error: "Order attempt recovery failed.", code: "recovery_internal_error" },
      500,
    );
  }
}
