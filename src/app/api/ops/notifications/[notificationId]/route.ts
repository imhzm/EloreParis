import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import {
  NotificationAuthorityError,
  updateAuthorityNotificationStatus,
} from "@/lib/notification-authority";
import type { NotificationDeliveryStatus } from "@/lib/notification-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotificationRouteContext = {
  params: Promise<{ notificationId: string }>;
};

function isSupportedStatus(
  value: unknown,
): value is Extract<NotificationDeliveryStatus, "queued" | "sent"> {
  return value === "queued" || value === "sent";
}

export async function PATCH(
  request: NextRequest,
  context: NotificationRouteContext,
) {
  try {
    const session = await assertOpsRequestAccess(request, "/ops/notifications");
    const body = (await request.json()) as {
      status?: unknown;
    };

    if (!isSupportedStatus(body.status)) {
      return NextResponse.json(
        { error: "حالة الإشعار المطلوبة غير مدعومة داخل طبقة التشغيل الحالية." },
        { status: 400 },
      );
    }

    const { notificationId } = await context.params;
    const { notification, previousStatus } = await updateAuthorityNotificationStatus(
      notificationId,
      body.status,
    );

    await logOpsAuditEvent({
      action: "ops_notification_status_update",
      actor: {
        userId: session.userId,
        name: session.name,
        role: session.role,
      },
      entityType: "notification",
      entityId: notification.id,
      summary: `${session.name} set ${notification.templateKey} for ${notification.orderNumber} to ${body.status}.`,
      metadata: {
        order_number: notification.orderNumber,
        template_key: notification.templateKey,
        previous_status: previousStatus,
        next_status: body.status,
      },
    });

    return NextResponse.json({
      notification,
      previousStatus,
      nextStatus: body.status,
    });
  } catch (error) {
    if (
      error instanceof OpsAccessError ||
      error instanceof NotificationAuthorityError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحديث حالة الإشعار التشغيلي الحالية." },
      { status: 500 },
    );
  }
}
