import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getAuthorityOrderForRecentAccess,
  getAuthorityOrderForTracking,
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

    const order = phoneLastFour
      ? await getAuthorityOrderForTracking(orderNumber, phoneLastFour)
      : await getAuthorityOrderForRecentAccess(orderNumber, recentOrderToken);

    if (!order) {
      return NextResponse.json(
        { error: "لم يتم العثور على طلب مطابق لهذه البيانات داخل authority الحالية." },
        { status: 404 },
      );
    }

    const notifications = await listAuthorityNotificationsForOrder(order);

    return NextResponse.json({ order, notifications });
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
