import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  OrderAuthorityError,
  updateAuthorityOrderProviderBinding,
} from "@/lib/order-authority";
import { getPaymentProviderRuntimeConfig } from "@/lib/provider-runtime-config";

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
  const paymentProvider = getPaymentProviderRuntimeConfig();

  if (!paymentProvider.callbackConfigured) {
    return NextResponse.json(
      { error: "Payment provider callback is not configured for this runtime." },
      { status: 503 },
    );
  }

  if (!isAuthorizedProviderCallback(request, paymentProvider.callbackSecret)) {
    return NextResponse.json(
      { error: "Payment provider callback authorization failed." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      orderNumber?: unknown;
      paymentReferenceId?: unknown;
      settlementReference?: unknown;
      eventId?: unknown;
      settledAt?: unknown;
    };
    const orderNumber =
      typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const paymentReferenceId =
      typeof body.paymentReferenceId === "string"
        ? body.paymentReferenceId.trim()
        : undefined;
    const settlementReference =
      typeof body.settlementReference === "string"
        ? body.settlementReference.trim()
        : undefined;
    const paymentEventId =
      typeof body.eventId === "string" ? body.eventId.trim() : undefined;
    const settledAt =
      typeof body.settledAt === "string" ? body.settledAt.trim() : undefined;

    if (!orderNumber) {
      return NextResponse.json(
        { error: "orderNumber is required for the payment callback." },
        { status: 400 },
      );
    }

    const { order } = await updateAuthorityOrderProviderBinding(
      orderNumber,
      "payment_confirmed",
      {
        paymentReferenceId,
        settlementReference,
        paymentEventId,
        occurredAt: settledAt,
      },
    );

    await logOpsAuditEvent({
      action: "ops_order_provider_update",
      actor: {
        userId: "payment-provider",
        name: paymentProvider.label,
        role: "system",
      },
      entityType: "order",
      entityId: order.orderNumber,
      summary: `${paymentProvider.label} confirmed payment for ${order.orderNumber}.`,
      metadata: {
        provider_action: "payment_confirmed",
        payment_state: order.providerBindings.payment.state,
        payment_reference: order.providerBindings.payment.referenceId ?? "missing",
        settlement_reference:
          order.providerBindings.payment.settlementReference ?? "missing",
        payment_event_id:
          order.providerBindings.payment.settlementEventId ?? "missing",
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
      { error: "تعذر معالجة callback الدفع داخل authority الحالية." },
      { status: 500 },
    );
  }
}
