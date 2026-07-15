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
import { getPaymentProviderRuntimeConfig } from "@/lib/provider-runtime-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const callbackKeys = [
  "orderNumber",
  "paymentReferenceId",
  "settlementReference",
  "eventId",
  "settledAt",
] as const;

function requiredString(body: Record<string, unknown>, key: string, maxLength = 200) {
  const value = typeof body[key] === "string" ? body[key].trim() : "";
  if (!value || value.length > maxLength) {
    throw new ProviderEventAuthorityError(`${key} is required for the payment callback.`);
  }
  return value;
}

export async function POST(request: NextRequest) {
  const paymentProvider = getPaymentProviderRuntimeConfig();
  if (!paymentProvider.callbackConfigured) {
    return NextResponse.json(
      { error: "Payment provider callback is not configured for this runtime." },
      { status: 503 },
    );
  }
  try {
    const { body, payloadHash } = await readAuthenticatedProviderCallback(
      request,
      callbackKeys,
      paymentProvider.callbackSecret,
    );
    const orderNumber = requiredString(body, "orderNumber", 160).toUpperCase();
    const paymentReferenceId = requiredString(body, "paymentReferenceId");
    const settlementReference = requiredString(body, "settlementReference");
    const eventId = requiredString(body, "eventId");
    const settledAt = requiredString(body, "settledAt", 80);
    if (Number.isNaN(Date.parse(settledAt))) {
      throw new ProviderEventAuthorityError("settledAt must be a valid timestamp.");
    }

    if (inspectAuthorityProviderEvent("payment", eventId, orderNumber, payloadHash).replayed) {
      return NextResponse.json({ ok: true, replayed: true, orderNumber, state: "confirmed" });
    }

    const { order } = await updateAuthorityOrderProviderBinding(
      orderNumber,
      "payment_confirmed",
      {
        paymentReferenceId,
        settlementReference,
        paymentEventId: eventId,
        occurredAt: new Date(settledAt).toISOString(),
      },
    );
    const eventRecord = recordAuthorityProviderEvent(
      "payment",
      eventId,
      order.orderNumber,
      payloadHash,
    );

    if (!eventRecord.replayed) {
      await logOpsAuditEvent({
        action: "ops_order_provider_update",
        actor: { userId: "payment-provider", name: paymentProvider.label, role: "system" },
        entityType: "order",
        entityId: order.orderNumber,
        summary: `${paymentProvider.label} confirmed payment for ${order.orderNumber}.`,
        metadata: {
          provider_action: "payment_confirmed",
          payment_state: order.providerBindings.payment.state,
          payment_event_id: eventId,
          order_status: order.status,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      replayed: eventRecord.replayed,
      orderNumber: order.orderNumber,
      state: order.providerBindings.payment.state,
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
      { error: "تعذر معالجة callback الدفع داخل authority الحالية." },
      { status: 500 },
    );
  }
}
