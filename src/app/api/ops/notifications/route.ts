import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import {
  listAuthorityNotifications,
} from "@/lib/notification-authority";
import { listAuthorityOrders, OrderAuthorityError } from "@/lib/order-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/notifications");
    const orders = await listAuthorityOrders();
    const notifications = await listAuthorityNotifications(orders);

    return NextResponse.json({ notifications });
  } catch (error) {
    if (error instanceof OpsAccessError || error instanceof OrderAuthorityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحميل قائمة الإشعارات التشغيلية الحالية." },
      { status: 500 },
    );
  }
}
