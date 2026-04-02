import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  advanceAuthorityOrderStatus,
  assertOpsApiAccess,
  OrderAuthorityError,
} from "@/lib/order-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpsOrderRouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: OpsOrderRouteContext,
) {
  try {
    await assertOpsApiAccess(request);
    const { orderNumber } = await context.params;
    const { order, previousStatus, nextStatus } =
      await advanceAuthorityOrderStatus(orderNumber);

    return NextResponse.json({
      order,
      previousStatus,
      nextStatus,
    });
  } catch (error) {
    if (error instanceof OrderAuthorityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحديث حالة الطلب داخل authority الحالية." },
      { status: 500 },
    );
  }
}
