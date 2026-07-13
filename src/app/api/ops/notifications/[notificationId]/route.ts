import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import {
  getAuthorityNotificationById,
  NotificationAuthorityError,
  updateAuthorityNotificationStatus,
} from "@/lib/notification-authority";
import { deliverNotificationForOrder } from "@/lib/notification-dispatch";
import { listAuthorityOrders, OrderAuthorityError } from "@/lib/order-authority";
import { ProviderGatewayError } from "@/lib/provider-gateway";
import type { NotificationDeliveryStatus } from "@/lib/notification-types";
import {
  RequestHardeningError,
  assertTrustedMutationRequest,
} from "@/lib/request-hardening";

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
    assertTrustedMutationRequest(request);
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
    const notificationRecord = await getAuthorityNotificationById(notificationId);

    if (!notificationRecord) {
      return NextResponse.json(
        { error: "Notification record was not found in the current authority." },
        { status: 404 },
      );
    }

    const updateResult =
      body.status === "sent"
        ? await (async () => {
            const orders = await listAuthorityOrders();
            const order = orders.find(
              (candidate) =>
                candidate.orderNumber === notificationRecord.orderNumber,
            );

            if (!order) {
              throw new NotificationAuthorityError(
                "The notification order could not be found in the current authority.",
                404,
              );
            }

            const deliveredNotification = await deliverNotificationForOrder(
              notificationRecord,
              order,
            );

            if (deliveredNotification.id !== notificationRecord.id) {
              throw new NotificationAuthorityError(
                "The delivered notification does not match the requested record.",
                409,
              );
            }

            return {
              notification: deliveredNotification,
              previousStatus: notificationRecord.status,
            };
          })()
        : await updateAuthorityNotificationStatus(notificationId, body.status, {
            lastError: null,
          });
    const { notification, previousStatus } = updateResult;

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
        provider_label: notification.providerLabel ?? "missing",
        provider_delivery_id: notification.providerDeliveryId ?? "missing",
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
      error instanceof NotificationAuthorityError ||
      error instanceof OrderAuthorityError ||
      error instanceof ProviderGatewayError ||
      error instanceof RequestHardeningError
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
