import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import { InventoryReservationError } from "@/lib/inventory-reservation-authority";
import {
  OrderAuthorityError,
  updateAuthorityOrderProviderBinding,
} from "@/lib/order-authority";
import {
  inspectAuthorityProviderEvent,
  ProviderEventAuthorityError,
  readAuthenticatedProviderCallback,
  recordAuthorityProviderEvent,
} from "@/lib/provider-event-authority";
import { getShippingProviderRuntimeConfig } from "@/lib/provider-runtime-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const callbackKeys = [
  "orderNumber",
  "bookingReference",
  "trackingNumber",
  "eventId",
  "occurredAt",
] as const;

function requiredString(body: Record<string, unknown>, key: string, maxLength = 200) {
  const value = typeof body[key] === "string" ? body[key].trim() : "";
  if (!value || value.length > maxLength) {
    throw new ProviderEventAuthorityError(`${key} is required for the shipping callback.`);
  }
  return value;
}

export async function POST(request: NextRequest) {
  const shippingProvider = getShippingProviderRuntimeConfig();
  if (!shippingProvider.callbackConfigured) {
    return NextResponse.json(
      { error: "Shipping provider callback is not configured for this runtime." },
      { status: 503 },
    );
  }
  try {
    const { body, payloadHash } = await readAuthenticatedProviderCallback(
      request,
      callbackKeys,
      shippingProvider.callbackSecret,
    );
    const orderNumber = requiredString(body, "orderNumber", 160).toUpperCase();
    const bookingReference = requiredString(body, "bookingReference");
    const trackingNumber = requiredString(body, "trackingNumber");
    const eventId = requiredString(body, "eventId");
    const occurredAt = requiredString(body, "occurredAt", 80);
    if (Number.isNaN(Date.parse(occurredAt))) {
      throw new ProviderEventAuthorityError("occurredAt must be a valid timestamp.");
    }

    if (inspectAuthorityProviderEvent("shipping", eventId, orderNumber, payloadHash).replayed) {
      return NextResponse.json({ ok: true, replayed: true, orderNumber, state: "in_transit" });
    }

    const { order } = await updateAuthorityOrderProviderBinding(
      orderNumber,
      "shipping_in_transit",
      {
        shippingBookingReference: bookingReference,
        shippingTrackingNumber: trackingNumber,
        shippingEventId: eventId,
        occurredAt: new Date(occurredAt).toISOString(),
      },
    );
    const eventRecord = recordAuthorityProviderEvent(
      "shipping",
      eventId,
      order.orderNumber,
      payloadHash,
    );

    if (!eventRecord.replayed) {
      await logOpsAuditEvent({
        action: "ops_order_provider_update",
        actor: { userId: "shipping-provider", name: shippingProvider.label, role: "system" },
        entityType: "order",
        entityId: order.orderNumber,
        summary: `${shippingProvider.label} marked ${order.orderNumber} in transit.`,
        metadata: {
          provider_action: "shipping_in_transit",
          shipping_state: order.providerBindings.shipping.state,
          shipping_event_id: eventId,
          order_status: order.status,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      replayed: eventRecord.replayed,
      orderNumber: order.orderNumber,
      state: order.providerBindings.shipping.state,
    });
  } catch (error) {
    if (
      error instanceof ProviderEventAuthorityError ||
      error instanceof OrderAuthorityError ||
      error instanceof InventoryReservationError
    ) {
      return NextResponse.json(
        { error: error.message, code: "code" in error ? error.code : "order_rejected" },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: "تعذر معالجة callback الشحن داخل authority الحالية." },
      { status: 500 },
    );
  }
}
