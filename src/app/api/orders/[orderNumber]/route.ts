import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createAuthorityOrderAccessToken,
  CUSTOMER_ACCESS_COOKIE,
  getAuthorityOrderForCustomerAccessCookie,
  getAuthorityOrderForAccessCookie,
  getAuthorityOrderForRecentAccess,
  getAuthorityOrderForTracking,
  ORDER_ACCESS_COOKIE,
  ORDER_ACCESS_MAX_AGE_SECONDS,
  OrderAuthorityError,
  RECENT_ORDER_COOKIE,
} from "@/lib/order-authority";
import {
  redactOrderForCustomerView,
  redactOrderForPublicTracking,
} from "@/lib/customer-order-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRouteContext = {
  params: Promise<{ orderNumber: string }>;
};

const TRACKING_WINDOW_MS = 5 * 60 * 1000;
const TRACKING_ATTEMPT_LIMIT = 8;
const MAX_TRACKING_BUCKETS = 5_000;
const trackingAttempts = new Map<string, { count: number; resetAt: number }>();

function consumeTrackingAttempt(orderNumber: string) {
  const key = orderNumber.trim().toUpperCase();
  const now = Date.now();
  const current = trackingAttempts.get(key);

  if (!current || current.resetAt <= now) {
    if (trackingAttempts.size >= MAX_TRACKING_BUCKETS) {
      for (const [candidateKey, candidate] of trackingAttempts) {
        if (candidate.resetAt <= now) {
          trackingAttempts.delete(candidateKey);
        }
      }

      if (trackingAttempts.size >= MAX_TRACKING_BUCKETS) {
        const oldestKey = trackingAttempts.keys().next().value;
        if (typeof oldestKey === "string") {
          trackingAttempts.delete(oldestKey);
        }
      }
    }

    trackingAttempts.set(key, {
      count: 1,
      resetAt: now + TRACKING_WINDOW_MS,
    });
    return null;
  }

  current.count += 1;
  if (current.count <= TRACKING_ATTEMPT_LIMIT) {
    return null;
  }

  return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
}

export async function GET(request: NextRequest, context: OrderRouteContext) {
  try {
    const { orderNumber } = await context.params;
    const url = new URL(request.url);
    const phoneLastFour = url.searchParams.get("phoneLastFour")?.trim() ?? "";
    const recentOrderToken = request.cookies.get(RECENT_ORDER_COOKIE)?.value;
    const orderAccessToken = request.cookies.get(ORDER_ACCESS_COOKIE)?.value;
    const customerAccessToken = request.cookies.get(CUSTOMER_ACCESS_COOKIE)?.value;

    if (phoneLastFour && !/^\d{4}$/.test(phoneLastFour)) {
      return NextResponse.json(
        { error: "يجب إدخال آخر أربعة أرقام من رقم الجوال." },
        { status: 400 },
      );
    }

    if (phoneLastFour) {
      const retryAfter = consumeTrackingAttempt(orderNumber);
      if (retryAfter !== null) {
        return NextResponse.json(
          { error: "تم تجاوز عدد محاولات التتبع المسموح. يرجى المحاولة لاحقًا." },
          {
            status: 429,
            headers: { "Retry-After": retryAfter.toString() },
          },
        );
      }
    }

    let accessMode: "tracking" | "customer" | "recent" | "order" = "tracking";
    let order = phoneLastFour
      ? await getAuthorityOrderForTracking(orderNumber, phoneLastFour)
      : null;

    if (!phoneLastFour) {
      order = await getAuthorityOrderForCustomerAccessCookie(orderNumber, customerAccessToken);
      if (order) accessMode = "customer";
      if (!order) {
        order = await getAuthorityOrderForRecentAccess(orderNumber, recentOrderToken);
        if (order) accessMode = "recent";
      }
      if (!order) {
        order = await getAuthorityOrderForAccessCookie(orderNumber, orderAccessToken);
        if (order) accessMode = "order";
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: "لم يتم العثور على طلب مطابق لهذه البيانات داخل authority الحالية." },
        { status: 404 },
      );
    }

    const hasStrongAccess = accessMode === "customer" || accessMode === "recent";
    const notifications: [] = [];
    const responseOrder = hasStrongAccess
      ? redactOrderForCustomerView(order)
      : redactOrderForPublicTracking(order);

    const response = NextResponse.json({
      order: responseOrder,
      notifications,
      accessMode,
      customerAccessHandoffPath: undefined,
    });
    if (hasStrongAccess) {
      const nextOrderAccessToken = await createAuthorityOrderAccessToken(order.orderNumber);
      response.cookies.set({
        name: ORDER_ACCESS_COOKIE,
        value: nextOrderAccessToken,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ORDER_ACCESS_MAX_AGE_SECONDS,
      });
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof OrderAuthorityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر استعادة الطلب من authority الحالية." },
      { status: 500 },
    );
  }
}
