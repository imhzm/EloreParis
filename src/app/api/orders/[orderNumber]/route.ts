import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createAuthorityCustomerAccessHandoffPath,
  createAuthorityCustomerAccessToken,
  createAuthorityOrderAccessToken,
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_ACCESS_MAX_AGE_SECONDS,
  getAuthorityOrderForCustomerAccessCookie,
  getAuthorityOrderForAccessCookie,
  getAuthorityOrderForRecentAccess,
  getAuthorityOrderForTracking,
  ORDER_ACCESS_COOKIE,
  ORDER_ACCESS_MAX_AGE_SECONDS,
  OrderAuthorityError,
  RECENT_ORDER_COOKIE,
} from "@/lib/order-authority";
import { listAuthorityNotificationsForOrder } from "@/lib/notification-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function GET(request: NextRequest, context: OrderRouteContext) {
  try {
    const { orderNumber } = await context.params;
    const url = new URL(request.url);
    const phoneLastFour = url.searchParams.get("phoneLastFour")?.trim() ?? "";
    const recentOrderToken = request.cookies.get(RECENT_ORDER_COOKIE)?.value;
    const orderAccessToken = request.cookies.get(ORDER_ACCESS_COOKIE)?.value;
    const customerAccessToken = request.cookies.get(CUSTOMER_ACCESS_COOKIE)?.value;

    const order = phoneLastFour
      ? await getAuthorityOrderForTracking(orderNumber, phoneLastFour)
      : (await getAuthorityOrderForAccessCookie(orderNumber, orderAccessToken)) ??
        (await getAuthorityOrderForCustomerAccessCookie(
          orderNumber,
          customerAccessToken,
        )) ??
        (await getAuthorityOrderForRecentAccess(orderNumber, recentOrderToken));

    if (!order) {
      return NextResponse.json(
        { error: "لم يتم العثور على طلب مطابق لهذه البيانات داخل authority الحالية." },
        { status: 404 },
      );
    }

    const notifications = await listAuthorityNotificationsForOrder(order);
    const nextOrderAccessToken = await createAuthorityOrderAccessToken(
      order.orderNumber,
    );

    const response = NextResponse.json({
      order,
      notifications,
      customerAccessHandoffPath:
        await createAuthorityCustomerAccessHandoffPath(order),
    });
    response.cookies.set({
      name: ORDER_ACCESS_COOKIE,
      value: nextOrderAccessToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ORDER_ACCESS_MAX_AGE_SECONDS,
    });
    response.cookies.set({
      name: CUSTOMER_ACCESS_COOKIE,
      value: await createAuthorityCustomerAccessToken(order),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CUSTOMER_ACCESS_MAX_AGE_SECONDS,
    });

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
