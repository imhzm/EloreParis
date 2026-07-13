import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  OrderAuthorityError,
  updateAuthorityOrderProviderBinding,
} from "@/lib/order-authority";
import { getShippingProviderRuntimeConfig } from "@/lib/provider-runtime-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedProviderCallback(
  request: NextRequest,
  expectedSecret: string,
) {
  const authorizationHeader = request.headers.get("authorization")?.trim() ?? "";
  return authorizationHeader === `Bearer ${expectedSecret}`;
}

export async function POST(request: NextRequest) {
  const shippingProvider = getShippingProviderRuntimeConfig();

  if (!shippingProvider.callbackConfigured) {
    return NextResponse.json(
      { error: "Shipping provider callback is not configured for this runtime." },
      { status: 503 },
    );
  }

  if (!isAuthorizedProviderCallback(request, shippingProvider.callbackSecret)) {
    return NextResponse.json(
      { error: "Shipping provider callback authorization failed." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      orderNumber?: unknown;
      bookingReference?: unknown;
      trackingNumber?: unknown;
      eventId?: unknown;
      occurredAt?: unknown;
    };
    const orderNumber =
      typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const bookingReference =
      typeof body.bookingReference === "string"
        ? body.bookingReference.trim()
        : undefined;
    const trackingNumber =
      typeof body.trackingNumber === "string"
        ? body.trackingNumber.trim()
        : undefined;
    const shippingEventId =
      typeof body.eventId === "string" ? body.eventId.trim() : undefined;
    const occurredAt =
      typeof body.occurredAt === "string" ? body.occurredAt.trim() : undefined;

    if (!orderNumber) {
      return NextResponse.json(
        { error: "orderNumber is required for the shipping callback." },
        { status: 400 },
      );
    }

    const { order } = await updateAuthorityOrderProviderBinding(
      orderNumber,
      "shipping_in_transit",
      {
        shippingBookingReference: bookingReference,
        shippingTrackingNumber: trackingNumber,
        shippingEventId,
        occurredAt,
      },
    );

    await logOpsAuditEvent({
      action: "ops_order_provider_update",
      actor: {
        userId: "shipping-provider",
        name: shippingProvider.label,
        role: "system",
      },
      entityType: "order",
      entityId: order.orderNumber,
      summary: `${shippingProvider.label} pushed ${order.orderNumber} into in-transit delivery state.`,
      metadata: {
        provider_action: "shipping_in_transit",
        shipping_state: order.providerBindings.shipping.state,
        shipping_reference:
          order.providerBindings.shipping.bookingReference ?? "missing",
        tracking_number:
          order.providerBindings.shipping.trackingNumber ?? "missing",
        shipping_event_id:
          order.providerBindings.shipping.carrierEventId ?? "missing",
        order_status: order.status,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        order,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof OrderAuthorityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر معالجة callback الشحن داخل authority الحالية." },
      { status: 500 },
    );
  }
}
