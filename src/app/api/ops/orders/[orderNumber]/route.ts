import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  advanceAuthorityOrderStatus,
  assertOpsApiAccess,
  OrderAuthorityError,
} from "@/lib/order-authority";
import {
  RequestHardeningError,
  assertTrustedMutationRequest,
} from "@/lib/request-hardening";

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
    assertTrustedMutationRequest(request);
    const session = await assertOpsApiAccess(request);
    const { orderNumber } = await context.params;
    const { order, previousStatus, nextStatus } =
      await advanceAuthorityOrderStatus(orderNumber);

    if (session) {
      await logOpsAuditEvent({
        action: "ops_order_status_update",
        actor: {
          userId: session.userId,
          name: session.name,
          role: session.role,
        },
        entityType: "order",
        entityId: order.orderNumber,
        summary: `${session.name} moved ${order.orderNumber} from ${previousStatus} to ${nextStatus}.`,
        metadata: {
          previous_status: previousStatus,
          next_status: nextStatus,
          payment_method: order.paymentMethodId,
        },
      });
    }

    return NextResponse.json({
      order,
      previousStatus,
      nextStatus,
    });
  } catch (error) {
    if (
      error instanceof OrderAuthorityError ||
      error instanceof RequestHardeningError
    ) {
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
