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
import {
  inspectAuthorityProviderEvent,
  ProviderEventAuthorityError,
  readAuthenticatedProviderCallback,
  recordAuthorityProviderEvent,
} from "@/lib/provider-event-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const callbackKeys = [
  "notificationId",
  "providerDeliveryId",
  "eventId",
  "status",
  "occurredAt",
  "errorMessage",
] as const;

function optionalString(
  body: Record<string, unknown>,
  key: string,
  maxLength = 200,
) {
  if (body[key] === undefined || body[key] === null) return undefined;
  if (typeof body[key] !== "string") {
    throw new ProviderEventAuthorityError(`${key} must be a string.`);
  }
  const value = body[key].trim();
  if (value.length > maxLength) {
    throw new ProviderEventAuthorityError(`${key} is too long.`);
  }
  return value || undefined;
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

  try {
    const { body, payloadHash, authenticationMode } =
      await readAuthenticatedProviderCallback(
        request,
        callbackKeys,
        providerConfig.callbackSecret,
      );
    const callbackStatus = normalizeCallbackStatus(body.status);
    const notificationId = optionalString(body, "notificationId", 160) ?? "";
    const providerDeliveryId =
      optionalString(body, "providerDeliveryId", 200) ?? "";
    const providerEventId = optionalString(body, "eventId", 200);
    const occurredAt = optionalString(body, "occurredAt", 80);
    const errorMessage = optionalString(body, "errorMessage", 500);

    if (authenticationMode === "hmac" && !providerEventId) {
      throw new ProviderEventAuthorityError(
        "eventId is required for signed notification callbacks.",
        400,
        "provider_event_id_required",
      );
    }
    if (occurredAt && Number.isNaN(Date.parse(occurredAt))) {
      throw new ProviderEventAuthorityError(
        "occurredAt must be a valid timestamp.",
      );
    }

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

    if (
      providerEventId &&
      inspectAuthorityProviderEvent(
        "notification",
        providerEventId,
        notification.orderNumber,
        payloadHash,
      ).replayed
    ) {
      return NextResponse.json({
        ok: true,
        replayed: true,
        notification,
      });
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

    const eventRecord = providerEventId
      ? recordAuthorityProviderEvent(
          "notification",
          providerEventId,
          updatedNotification.orderNumber,
          payloadHash,
        )
      : null;

    if (!eventRecord?.replayed) {
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
    }

    return NextResponse.json(
      {
        ok: true,
        replayed: eventRecord?.replayed ?? false,
        notification: updatedNotification,
      },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof NotificationAuthorityError ||
      error instanceof ProviderEventAuthorityError
    ) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error instanceof ProviderEventAuthorityError
            ? { code: error.code }
            : {}),
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to process the notification provider callback." },
      { status: 500 },
    );
  }
}
