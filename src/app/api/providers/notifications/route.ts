import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import { getNotificationProviderConfig } from "@/lib/live-provider-config";
import {
  getAuthorityNotificationById,
  getAuthorityNotificationByProviderDeliveryId,
  NotificationAuthorityError,
  updateAuthorityNotificationStatus,
} from "@/lib/notification-authority";
import type { NotificationDeliveryStatus } from "@/lib/notification-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedProviderCallback(
  request: NextRequest,
  expectedSecret: string,
) {
  const authorizationHeader = request.headers.get("authorization")?.trim() ?? "";
  return authorizationHeader === `Bearer ${expectedSecret}`;
}

function normalizeCallbackStatus(value: unknown): NotificationDeliveryStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (
    normalizedValue === "sent" ||
    normalizedValue === "delivered" ||
    normalizedValue === "accepted"
  ) {
    return "sent";
  }

  if (
    normalizedValue === "queued" ||
    normalizedValue === "pending" ||
    normalizedValue === "retrying"
  ) {
    return "queued";
  }

  if (
    normalizedValue === "blocked" ||
    normalizedValue === "failed" ||
    normalizedValue === "rejected"
  ) {
    return "blocked";
  }

  return null;
}

export async function POST(request: NextRequest) {
  const providerConfig = getNotificationProviderConfig();

  if (!providerConfig.callbackConfigured) {
    return NextResponse.json(
      {
        error:
          "Notification provider callback is not configured for this runtime.",
      },
      { status: 503 },
    );
  }

  if (
    !isAuthorizedProviderCallback(request, providerConfig.callbackSecret)
  ) {
    return NextResponse.json(
      { error: "Notification provider callback authorization failed." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      notificationId?: unknown;
      providerDeliveryId?: unknown;
      eventId?: unknown;
      status?: unknown;
      occurredAt?: unknown;
      errorMessage?: unknown;
    };
    const callbackStatus = normalizeCallbackStatus(body.status);
    const notificationId =
      typeof body.notificationId === "string" ? body.notificationId.trim() : "";
    const providerDeliveryId =
      typeof body.providerDeliveryId === "string"
        ? body.providerDeliveryId.trim()
        : "";
    const providerEventId =
      typeof body.eventId === "string" ? body.eventId.trim() : undefined;
    const occurredAt =
      typeof body.occurredAt === "string" ? body.occurredAt.trim() : undefined;
    const errorMessage =
      typeof body.errorMessage === "string" ? body.errorMessage.trim() : undefined;

    if (!callbackStatus) {
      return NextResponse.json(
        { error: "A supported notification delivery status is required." },
        { status: 400 },
      );
    }

    const notification = notificationId
      ? await getAuthorityNotificationById(notificationId)
      : providerDeliveryId
        ? await getAuthorityNotificationByProviderDeliveryId(providerDeliveryId)
        : null;

    if (!notification) {
      return NextResponse.json(
        { error: "Notification callback target was not found." },
        { status: 404 },
      );
    }

    const { notification: updatedNotification } =
      await updateAuthorityNotificationStatus(
        notification.id,
        callbackStatus,
        {
          sentAt: callbackStatus === "sent" ? occurredAt ?? new Date().toISOString() : null,
          providerLabel: providerConfig.label,
          providerDeliveryId: providerDeliveryId || notification.providerDeliveryId,
          providerEventId:
            providerEventId ?? notification.providerEventId ?? null,
          lastError: callbackStatus === "blocked" ? errorMessage ?? "Provider marked delivery as blocked." : null,
        },
      );

    await logOpsAuditEvent({
      action: "ops_notification_status_update",
      actor: {
        userId: "notification-provider",
        name: providerConfig.label,
        role: "system",
      },
      entityType: "notification",
      entityId: updatedNotification.id,
      summary: `${providerConfig.label} marked ${updatedNotification.templateKey} for ${updatedNotification.orderNumber} as ${callbackStatus}.`,
      metadata: {
        order_number: updatedNotification.orderNumber,
        template_key: updatedNotification.templateKey,
        callback_status: callbackStatus,
        provider_delivery_id:
          updatedNotification.providerDeliveryId ?? "missing",
        provider_event_id: updatedNotification.providerEventId ?? "missing",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        notification: updatedNotification,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof NotificationAuthorityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to process the notification provider callback." },
      { status: 500 },
    );
  }
}
