import type { StoredOrder } from "@/lib/orders";

/** Keeps customer-facing fulfillment state while removing supplier and provider internals. */
export function redactOrderForCustomerView(order: StoredOrder): StoredOrder {
  return {
    ...order,
    allowOperationalUpdates: false,
    customer: {
      fullName: order.customer.fullName,
      phone: order.customer.phone,
      email: "",
      city: order.customer.city,
      district: order.customer.district,
      addressLine: "",
      notes: "",
    },
    lines: order.lines.map((line) => ({
      ...line,
      catalogTruth: {
        availability: line.catalogTruth.availability,
        mappingStatus: "pending",
        supplierId: null,
        supplierName: "",
        fulfillmentModel: "unmapped",
        truthSourceLabel: "",
        continuityOwnerLabel: "",
        continuityRoute: "/ops/orders",
        continuityRule: "",
        supplierSku: null,
        shippingClass: null,
        stockOnHand: 0,
        lowStockThreshold: 0,
        codEligible: false,
      },
    })),
    providerBindings: {
      payment: {
        state: order.providerBindings.payment.state,
        providerLabel: "",
        referenceId: null,
        paymentUrl: order.providerBindings.payment.paymentUrl,
        settlementReference: null,
        settlementEventId: null,
        updatedAt: order.providerBindings.payment.updatedAt,
        linkSentAt: order.providerBindings.payment.linkSentAt,
        confirmedAt: order.providerBindings.payment.confirmedAt,
      },
      shipping: {
        state: order.providerBindings.shipping.state,
        providerLabel: "",
        bookingReference: null,
        trackingNumber: order.providerBindings.shipping.trackingNumber,
        carrierEventId: null,
        updatedAt: order.providerBindings.shipping.updatedAt,
        bookedAt: order.providerBindings.shipping.bookedAt,
        inTransitAt: order.providerBindings.shipping.inTransitAt,
      },
    },
  };
}

/** Limits order-list props to display data; authenticated accounts may retain a payment handoff URL. */
export function redactOrderForCustomerList(
  order: StoredOrder,
  options: { allowPaymentUrl: boolean },
): StoredOrder {
  const redacted = redactOrderForCustomerView(order);
  return {
    ...redacted,
    customer: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      district: "",
      addressLine: "",
      notes: "",
    },
    pricingSnapshot: undefined,
    providerBindings: {
      ...redacted.providerBindings,
      payment: {
        ...redacted.providerBindings.payment,
        paymentUrl: options.allowPaymentUrl
          ? redacted.providerBindings.payment.paymentUrl
          : null,
      },
    },
  };
}

/** Removes customer PII and operational provider data from weak tracking sessions. */
export function redactOrderForPublicTracking(order: StoredOrder): StoredOrder {
  return {
    ...order,
    allowOperationalUpdates: false,
    customer: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      district: "",
      addressLine: "",
      notes: "",
    },
    lines: order.lines.map((line) => ({
      ...line,
      productSlug: "",
      sku: "",
      catalogTruth: {
        availability: line.catalogTruth.availability,
        mappingStatus: "pending",
        supplierId: null,
        supplierName: "",
        fulfillmentModel: "unmapped",
        truthSourceLabel: "",
        continuityOwnerLabel: "",
        continuityRoute: "/ops/orders",
        continuityRule: "",
        supplierSku: null,
        shippingClass: null,
        stockOnHand: 0,
        lowStockThreshold: 0,
        codEligible: false,
      },
    })),
    providerBindings: {
      payment: {
        state: order.providerBindings.payment.state,
        providerLabel: "",
        referenceId: null,
        paymentUrl: null,
        settlementReference: null,
        settlementEventId: null,
        updatedAt: order.createdAt,
        linkSentAt: null,
        confirmedAt: order.providerBindings.payment.confirmedAt ? order.createdAt : null,
      },
      shipping: {
        state: order.providerBindings.shipping.state,
        providerLabel: "",
        bookingReference: null,
        trackingNumber: order.providerBindings.shipping.trackingNumber,
        carrierEventId: null,
        updatedAt: order.createdAt,
        bookedAt: order.providerBindings.shipping.bookedAt ? order.createdAt : null,
        inTransitAt: order.providerBindings.shipping.inTransitAt ? order.createdAt : null,
      },
    },
  };
}
