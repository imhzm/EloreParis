import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  assertOpsApiAccess,
  initiateAuthorityPaymentLink,
  initiateAuthorityShipmentBooking,
  OrderAuthorityError,
  updateAuthorityOrderProviderBinding,
} from "@/lib/order-authority";
import { ProviderGatewayError } from "@/lib/provider-gateway";
import type { OrderProviderBindingAction } from "@/lib/orders";
import {
  RequestHardeningError,
  assertTrustedMutationRequest,
} from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpsOrderProviderRouteContext = {
  params: Promise<{ orderNumber: string }>;
};

function isOrderProviderBindingAction(
  value: unknown,
): value is OrderProviderBindingAction {
  return (
    value === "payment_link_sent" ||
    value === "payment_confirmed" ||
    value === "shipping_booked" ||
    value === "shipping_in_transit"
  );
}

export async function PATCH(
  request: NextRequest,
  context: OpsOrderProviderRouteContext,
) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsApiAccess(request);
    const body = (await request.json()) as {
      action?: unknown;
      paymentReferenceId?: unknown;
      settlementReference?: unknown;
      eventId?: unknown;
      shippingBookingReference?: unknown;
      shippingTrackingNumber?: unknown;
      occurredAt?: unknown;
    };

    if (!isOrderProviderBindingAction(body.action)) {
      return NextResponse.json(
        { error: "Provider action is required for this mutation." },
        { status: 400 },
      );
    }

    const { orderNumber } = await context.params;
    const providerUpdate =
      body.action === "payment_link_sent"
        ? await initiateAuthorityPaymentLink(orderNumber)
        : body.action === "shipping_booked"
          ? await initiateAuthorityShipmentBooking(orderNumber)
          : await updateAuthorityOrderProviderBinding(orderNumber, body.action, {
              paymentReferenceId:
                typeof body.paymentReferenceId === "string"
                  ? body.paymentReferenceId.trim()
                  : undefined,
              settlementReference:
                typeof body.settlementReference === "string"
                  ? body.settlementReference.trim()
                  : undefined,
              paymentEventId:
                body.action === "payment_confirmed"
                  ? typeof body.eventId === "string"
                    ? body.eventId.trim()
                    : undefined
                  : undefined,
              shippingBookingReference:
                typeof body.shippingBookingReference === "string"
                  ? body.shippingBookingReference.trim()
                  : undefined,
              shippingTrackingNumber:
                typeof body.shippingTrackingNumber === "string"
                  ? body.shippingTrackingNumber.trim()
                  : undefined,
              shippingEventId:
                body.action === "shipping_in_transit"
                  ? typeof body.eventId === "string"
                    ? body.eventId.trim()
                    : undefined
                  : undefined,
              occurredAt:
                typeof body.occurredAt === "string"
                  ? body.occurredAt.trim()
                  : undefined,
            });
    const { order, action } = providerUpdate;

    await logOpsAuditEvent({
      action: "ops_order_provider_update",
      actor: {
        userId: session.userId,
        name: session.name,
        role: session.role,
      },
      entityType: "order",
      entityId: order.orderNumber,
      summary: `${session.name} recorded ${action} for ${order.orderNumber}.`,
      metadata: {
        provider_action: action,
        payment_state: order.providerBindings.payment.state,
        shipping_state: order.providerBindings.shipping.state,
        payment_reference: order.providerBindings.payment.referenceId ?? "missing",
        settlement_reference:
          order.providerBindings.payment.settlementReference ?? "missing",
        shipping_reference:
          order.providerBindings.shipping.bookingReference ?? "missing",
        tracking_number:
          order.providerBindings.shipping.trackingNumber ?? "missing",
        order_status: order.status,
      },
    });

    return NextResponse.json({
      order,
      action,
    });
  } catch (error) {
    if (
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
      { error: "تعذر تحديث provider handoff لهذا الطلب داخل authority الحالية." },
      { status: 500 },
    );
  }
}
