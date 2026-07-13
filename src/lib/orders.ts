import type { ResolvedCartLine } from "@/lib/cart";
import { getProductBySlug } from "@/lib/site-content";
import {
  getSupplierRecord,
  getVariantOperations,
  type ShippingClass,
  type SupplierAuthorityRoute,
  type SupplierId,
  type SupplierRecord,
} from "@/lib/variant-operations";

export type ShippingMethodId = "standard" | "express";
export type PaymentMethodId = "payment_link" | "cash_on_delivery";
export type OrderStatus =
  | "received"
  | "payment_pending"
  | "confirmed"
  | "processing"
  | "out_for_delivery";

export type OrderPaymentBindingState =
  | "pending"
  | "link_sent"
  | "confirmed"
  | "not_required";

export type OrderShippingBindingState = "pending" | "booked" | "in_transit";

export type OrderProviderBindingAction =
  | "payment_link_sent"
  | "payment_confirmed"
  | "shipping_booked"
  | "shipping_in_transit";

export type ShippingMethod = {
  id: ShippingMethodId;
  label: string;
  summary: string;
  deliveryWindow: string;
  estimatedFee: number;
  note: string;
};

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  summary: string;
  note: string;
};

export type CheckoutCustomerDetails = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  addressLine: string;
  notes: string;
};

export type StoredOrderLineCatalogTruth = {
  availability: "InStock" | "PreOrder";
  mappingStatus: "mapped" | "pending";
  supplierId: SupplierId | null;
  supplierName: string;
  fulfillmentModel: SupplierRecord["fulfillmentModel"] | "unmapped";
  truthSourceLabel: string;
  continuityOwnerLabel: string;
  continuityRoute: SupplierAuthorityRoute;
  continuityRule: string;
  supplierSku: string | null;
  shippingClass: ShippingClass | null;
  stockOnHand: number;
  lowStockThreshold: number;
  codEligible: boolean;
};

export type StoredOrderLine = {
  key: string;
  productSlug: string;
  productName: string;
  productSubtitle: string;
  sku: string;
  variantLabel: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  shippingNote: string;
  catalogTruth: StoredOrderLineCatalogTruth;
};

export type StoredOrderPaymentBinding = {
  state: OrderPaymentBindingState;
  providerLabel: string;
  referenceId: string | null;
  paymentUrl: string | null;
  settlementReference: string | null;
  settlementEventId: string | null;
  updatedAt: string;
  linkSentAt: string | null;
  confirmedAt: string | null;
};

export type StoredOrderShippingBinding = {
  state: OrderShippingBindingState;
  providerLabel: string;
  bookingReference: string | null;
  trackingNumber: string | null;
  carrierEventId: string | null;
  updatedAt: string;
  bookedAt: string | null;
  inTransitAt: string | null;
};

export type StoredOrderProviderBindings = {
  payment: StoredOrderPaymentBinding;
  shipping: StoredOrderShippingBinding;
};

export type StoredOrder = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  subtotal: number;
  shippingFeeEstimate: number;
  totalEstimate: number;
  shippingMethodId: ShippingMethodId;
  paymentMethodId: PaymentMethodId;
  allowOperationalUpdates: boolean;
  customer: CheckoutCustomerDetails;
  lines: StoredOrderLine[];
  providerBindings: StoredOrderProviderBindings;
};

export type OrderTimelineStep = {
  key: OrderStatus;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming";
};

export const shippingMethods: ShippingMethod[] = [
  {
    id: "standard",
    label: "الشحن القياسي داخل السعودية",
    summary: "نافذة مناسبة للطلبات اليومية مع متابعة مرجعية واضحة بعد اعتماد مزود الشحن.",
    deliveryWindow: "2-4 أيام عمل",
    estimatedFee: 22,
    note: "الرسوم الحالية تقديرية في هذه النسخة التأسيسية، وتتحول إلى تسعير نهائي بعد ربط مزود الشحن.",
  },
  {
    id: "express",
    label: "الشحن السريع للمدن المغطاة",
    summary: "أولوية تجهيز أعلى للطلبات العاجلة داخل المدن التي يغطيها مزود الخدمة.",
    deliveryWindow: "1-2 يوم عمل",
    estimatedFee: 36,
    note: "الخيار السريع مخصص للتجهيزات العاجلة ويظل تقديريًا حتى تثبيت التعاقد التشغيلي.",
  },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: "payment_link",
    label: "رابط دفع آمن بعد مراجعة الجاهزية",
    summary: "خيار صادق لهذه المرحلة: يتم إنشاء الطلب أولًا ثم إرسال رابط الدفع عند تثبيت الجاهزية التشغيلية.",
    note: "لا يتم الادعاء هنا بوجود بوابة دفع نهائية قبل ربطها فعليًا.",
  },
  {
    id: "cash_on_delivery",
    label: "الدفع عند الاستلام",
    summary: "مناسب للطلبات التي تحتاج تأكيدًا بسيطًا قبل التسليم داخل السعودية.",
    note: "تأكيد الإتاحة النهائية لهذا الخيار يعتمد لاحقًا على المدن، شركات الشحن، وسقف الطلب.",
  },
];

const statusDirectory: Record<
  OrderStatus,
  { label: string; description: string }
> = {
  received: {
    label: "تم استلام الطلب",
    description: "وصلت بيانات الطلب وتم تسجيلها داخل طبقة التشغيل الحالية بمرجع واضح.",
  },
  payment_pending: {
    label: "بانتظار رابط الدفع",
    description: "الخطوة التالية هي تثبيت الجاهزية ثم مشاركة مسار الدفع الآمن عند ربطه تشغيليًا.",
  },
  confirmed: {
    label: "تم تأكيد الطلب",
    description: "اكتملت المراجعة الأساسية وأصبح الطلب جاهزًا للتجهيز والشحن.",
  },
  processing: {
    label: "جاري التجهيز",
    description: "يتم الآن تجهيز العناصر وربطها بالخطوة التشغيلية التالية.",
  },
  out_for_delivery: {
    label: "خرج للتوصيل",
    description: "انتقل الطلب إلى مرحلة التوصيل النهائية داخل نافذة الخدمة المتوقعة.",
  },
};

function getOrderStatusSequence(paymentMethodId: PaymentMethodId) {
  return paymentMethodId === "payment_link"
    ? ([
        "received",
        "payment_pending",
        "confirmed",
        "processing",
        "out_for_delivery",
      ] satisfies OrderStatus[])
    : ([
        "received",
        "confirmed",
        "processing",
        "out_for_delivery",
      ] satisfies OrderStatus[]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, "").trim() : "";
}

function isCatalogAvailability(
  value: unknown,
): value is StoredOrderLineCatalogTruth["availability"] {
  return value === "InStock" || value === "PreOrder";
}

function isCatalogMappingStatus(
  value: unknown,
): value is StoredOrderLineCatalogTruth["mappingStatus"] {
  return value === "mapped" || value === "pending";
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && value in statusDirectory;
}

function isSupplierId(value: unknown): value is SupplierId {
  return value === "atelier-core" || value === "desert-distribution";
}

function isSupplierAuthorityRoute(value: unknown): value is SupplierAuthorityRoute {
  return (
    value === "/ops/catalog" ||
    value === "/ops/orders" ||
    value === "/ops/fulfillment"
  );
}

function isShippingClass(value: unknown): value is ShippingClass {
  return value === "serum-light" || value === "foundation-standard";
}

function isOrderPaymentBindingState(
  value: unknown,
): value is OrderPaymentBindingState {
  return (
    value === "pending" ||
    value === "link_sent" ||
    value === "confirmed" ||
    value === "not_required"
  );
}

function isOrderShippingBindingState(
  value: unknown,
): value is OrderShippingBindingState {
  return value === "pending" || value === "booked" || value === "in_transit";
}

function normalizeTimestamp(value: unknown, fallbackValue: string) {
  return typeof value === "string" && value.trim() ? value : fallbackValue;
}

function getCurrentCatalogAvailability(productSlug: string, sku: string) {
  return (
    getProductBySlug(productSlug)?.variants.find((variant) => variant.sku === sku)
      ?.availability ?? "PreOrder"
  );
}

export function buildStoredOrderLineCatalogTruth(input: {
  productSlug: string;
  sku: string;
  availability: StoredOrderLineCatalogTruth["availability"];
}): StoredOrderLineCatalogTruth {
  const variantOperations = getVariantOperations(input.productSlug, input.sku);

  if (!variantOperations) {
    return {
      availability: input.availability,
      mappingStatus: "pending",
      supplierId: null,
      supplierName: "Supplier mapping pending",
      fulfillmentModel: "unmapped",
      truthSourceLabel: "Catalog mapping pending",
      continuityOwnerLabel: "Catalog review desk",
      continuityRoute: "/ops/catalog",
      continuityRule:
        "Restore supplier mapping inside catalog authority before treating this SKU as supplier-backed inventory.",
      supplierSku: null,
      shippingClass: null,
      stockOnHand: 0,
      lowStockThreshold: 0,
      codEligible: false,
    };
  }

  const supplier = getSupplierRecord(variantOperations.supplierId);

  return {
    availability: input.availability,
    mappingStatus: "mapped",
    supplierId: supplier.id,
    supplierName: supplier.name,
    fulfillmentModel: supplier.fulfillmentModel,
    truthSourceLabel: supplier.truthSourceLabel,
    continuityOwnerLabel: supplier.defaultAuthorityOwnerLabel,
    continuityRoute: supplier.defaultAuthorityRoute,
    continuityRule: supplier.continuityRule,
    supplierSku: variantOperations.supplierSku,
    shippingClass: variantOperations.shippingClass,
    stockOnHand: variantOperations.stockOnHand,
    lowStockThreshold: variantOperations.lowStockThreshold,
    codEligible: variantOperations.codEligible,
  };
}

function normalizeStoredOrderLineCatalogTruth(
  value: unknown,
  fallbackInput: {
    productSlug: string;
    sku: string;
    availability: StoredOrderLineCatalogTruth["availability"];
  },
): StoredOrderLineCatalogTruth {
  const fallbackTruth = buildStoredOrderLineCatalogTruth(fallbackInput);

  if (!isRecord(value)) {
    return fallbackTruth;
  }

  return {
    availability: isCatalogAvailability(value.availability)
      ? value.availability
      : fallbackTruth.availability,
    mappingStatus: isCatalogMappingStatus(value.mappingStatus)
      ? value.mappingStatus
      : fallbackTruth.mappingStatus,
    supplierId:
      value.supplierId === null
        ? null
        : isSupplierId(value.supplierId)
          ? value.supplierId
          : fallbackTruth.supplierId,
    supplierName:
      typeof value.supplierName === "string"
        ? value.supplierName
        : fallbackTruth.supplierName,
    fulfillmentModel:
      value.fulfillmentModel === "direct" ||
      value.fulfillmentModel === "dropship" ||
      value.fulfillmentModel === "hybrid" ||
      value.fulfillmentModel === "unmapped"
        ? value.fulfillmentModel
        : fallbackTruth.fulfillmentModel,
    truthSourceLabel:
      typeof value.truthSourceLabel === "string"
        ? value.truthSourceLabel
        : fallbackTruth.truthSourceLabel,
    continuityOwnerLabel:
      typeof value.continuityOwnerLabel === "string"
        ? value.continuityOwnerLabel
        : fallbackTruth.continuityOwnerLabel,
    continuityRoute: isSupplierAuthorityRoute(value.continuityRoute)
      ? value.continuityRoute
      : fallbackTruth.continuityRoute,
    continuityRule:
      typeof value.continuityRule === "string"
        ? value.continuityRule
        : fallbackTruth.continuityRule,
    supplierSku:
      typeof value.supplierSku === "string" ? value.supplierSku : fallbackTruth.supplierSku,
    shippingClass:
      value.shippingClass === null
        ? null
        : isShippingClass(value.shippingClass)
          ? value.shippingClass
          : fallbackTruth.shippingClass,
    stockOnHand:
      typeof value.stockOnHand === "number" ? value.stockOnHand : fallbackTruth.stockOnHand,
    lowStockThreshold:
      typeof value.lowStockThreshold === "number"
        ? value.lowStockThreshold
        : fallbackTruth.lowStockThreshold,
    codEligible:
      typeof value.codEligible === "boolean"
        ? value.codEligible
        : fallbackTruth.codEligible,
  };
}

export function getStoredOrderLineCatalogTruth(line: StoredOrderLine) {
  return line.catalogTruth;
}

type OrderProviderLabels = {
  paymentProviderLabel?: string;
  shippingProviderLabel?: string;
};

const defaultProviderLabels = {
  paymentProviderLabel: "Payment callback contract",
  shippingProviderLabel: "Shipping callback contract",
} satisfies Required<OrderProviderLabels>;

export function createStoredOrderProviderBindings(
  paymentMethodId: PaymentMethodId,
  createdAt: string,
  providerLabels: OrderProviderLabels = {},
): StoredOrderProviderBindings {
  const labels = {
    ...defaultProviderLabels,
    ...providerLabels,
  };

  return {
    payment: {
      state: paymentMethodId === "payment_link" ? "pending" : "not_required",
      providerLabel: labels.paymentProviderLabel,
      referenceId: null,
      paymentUrl: null,
      settlementReference: null,
      settlementEventId: null,
      updatedAt: createdAt,
      linkSentAt: null,
      confirmedAt: paymentMethodId === "payment_link" ? null : createdAt,
    },
    shipping: {
      state: "pending",
      providerLabel: labels.shippingProviderLabel,
      bookingReference: null,
      trackingNumber: null,
      carrierEventId: null,
      updatedAt: createdAt,
      bookedAt: null,
      inTransitAt: null,
    },
  };
}

function normalizeStoredOrderProviderBindings(
  value: unknown,
  paymentMethodId: PaymentMethodId,
  createdAt: string,
): StoredOrderProviderBindings {
  if (!isRecord(value)) {
    return createStoredOrderProviderBindings(paymentMethodId, createdAt);
  }

  const defaultBindings = createStoredOrderProviderBindings(paymentMethodId, createdAt);
  const paymentValue = isRecord(value.payment) ? value.payment : null;
  const shippingValue = isRecord(value.shipping) ? value.shipping : null;

  return {
    payment: {
      state:
        paymentValue && isOrderPaymentBindingState(paymentValue.state)
          ? paymentValue.state
          : defaultBindings.payment.state,
      providerLabel:
        paymentValue && typeof paymentValue.providerLabel === "string"
          ? paymentValue.providerLabel
          : defaultBindings.payment.providerLabel,
      referenceId:
        paymentValue && typeof paymentValue.referenceId === "string"
          ? paymentValue.referenceId
          : null,
      paymentUrl:
        paymentValue && typeof paymentValue.paymentUrl === "string"
          ? paymentValue.paymentUrl
          : null,
      settlementReference:
        paymentValue && typeof paymentValue.settlementReference === "string"
          ? paymentValue.settlementReference
          : null,
      settlementEventId:
        paymentValue && typeof paymentValue.settlementEventId === "string"
          ? paymentValue.settlementEventId
          : null,
      updatedAt: normalizeTimestamp(
        paymentValue?.updatedAt,
        defaultBindings.payment.updatedAt,
      ),
      linkSentAt:
        paymentValue && typeof paymentValue.linkSentAt === "string"
          ? paymentValue.linkSentAt
          : null,
      confirmedAt:
        paymentValue && typeof paymentValue.confirmedAt === "string"
          ? paymentValue.confirmedAt
          : defaultBindings.payment.confirmedAt,
    },
    shipping: {
      state:
        shippingValue && isOrderShippingBindingState(shippingValue.state)
          ? shippingValue.state
          : defaultBindings.shipping.state,
      providerLabel:
        shippingValue && typeof shippingValue.providerLabel === "string"
          ? shippingValue.providerLabel
          : defaultBindings.shipping.providerLabel,
      bookingReference:
        shippingValue && typeof shippingValue.bookingReference === "string"
          ? shippingValue.bookingReference
          : null,
      trackingNumber:
        shippingValue && typeof shippingValue.trackingNumber === "string"
          ? shippingValue.trackingNumber
          : null,
      carrierEventId:
        shippingValue && typeof shippingValue.carrierEventId === "string"
          ? shippingValue.carrierEventId
          : null,
      updatedAt: normalizeTimestamp(
        shippingValue?.updatedAt,
        defaultBindings.shipping.updatedAt,
      ),
      bookedAt:
        shippingValue && typeof shippingValue.bookedAt === "string"
          ? shippingValue.bookedAt
          : null,
      inTransitAt:
        shippingValue && typeof shippingValue.inTransitAt === "string"
          ? shippingValue.inTransitAt
          : null,
    },
  };
}

export function getPhoneLastFour(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

export function getOrderStatusMeta(status: OrderStatus) {
  return statusDirectory[status];
}

export function getShippingMethodById(id: string | null | undefined) {
  return shippingMethods.find((method) => method.id === id);
}

export function getPaymentMethodById(id: string | null | undefined) {
  return paymentMethods.find((method) => method.id === id);
}

function buildOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `CZM-${year}${month}${day}-${randomSuffix}`;
}

export function createStoredOrder(input: {
  lines: ResolvedCartLine[];
  customer: CheckoutCustomerDetails;
  shippingMethodId: ShippingMethodId;
  paymentMethodId: PaymentMethodId;
  allowOperationalUpdates: boolean;
  providerLabels?: OrderProviderLabels;
}) {
  const shippingMethod =
    getShippingMethodById(input.shippingMethodId) ?? shippingMethods[0];
  const paymentMethod =
    getPaymentMethodById(input.paymentMethodId) ?? paymentMethods[0];
  const subtotal = input.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingFeeEstimate = shippingMethod.estimatedFee;

  const createdAt = new Date().toISOString();

  return {
    orderNumber: buildOrderNumber(),
    createdAt,
    status:
      paymentMethod.id === "payment_link" ? "payment_pending" : "received",
    subtotal,
    shippingFeeEstimate,
    totalEstimate: subtotal + shippingFeeEstimate,
    shippingMethodId: shippingMethod.id,
    paymentMethodId: paymentMethod.id,
    allowOperationalUpdates: input.allowOperationalUpdates,
    customer: {
      fullName: normalizeText(input.customer.fullName),
      phone: normalizePhone(input.customer.phone),
      email: normalizeText(input.customer.email),
      city: normalizeText(input.customer.city),
      district: normalizeText(input.customer.district),
      addressLine: normalizeText(input.customer.addressLine),
      notes: normalizeText(input.customer.notes),
    },
    lines: input.lines.map((line) => ({
      key: line.key,
      productSlug: line.product.slug,
      productName: line.product.name,
      productSubtitle: line.product.subtitle,
      sku: line.variant.sku,
      variantLabel: line.variant.label,
      size: line.variant.size,
      quantity: line.quantity,
      unitPrice: line.variant.price,
      lineTotal: line.lineTotal,
      shippingNote: line.product.shippingNote,
      catalogTruth: buildStoredOrderLineCatalogTruth({
        productSlug: line.product.slug,
        sku: line.variant.sku,
        availability: line.variant.availability,
      }),
    })),
    providerBindings: createStoredOrderProviderBindings(
      paymentMethod.id,
      createdAt,
      input.providerLabels,
    ),
  } satisfies StoredOrder;
}

function normalizeStoredOrder(value: unknown): StoredOrder | null {
  if (!isRecord(value)) {
    return null;
  }

  const customer = isRecord(value.customer) ? value.customer : null;
  const lines = Array.isArray(value.lines) ? value.lines : null;

  if (
    typeof value.orderNumber !== "string" ||
    typeof value.createdAt !== "string" ||
    !isOrderStatus(value.status) ||
    typeof value.subtotal !== "number" ||
    typeof value.shippingFeeEstimate !== "number" ||
    typeof value.totalEstimate !== "number" ||
    typeof value.allowOperationalUpdates !== "boolean" &&
      typeof value.allowOperationalUpdates !== "undefined" ||
    !customer ||
    !lines
  ) {
    return null;
  }

  const shippingMethod = getShippingMethodById(
    typeof value.shippingMethodId === "string" ? value.shippingMethodId : "",
  );
  const paymentMethod = getPaymentMethodById(
    typeof value.paymentMethodId === "string" ? value.paymentMethodId : "",
  );

  if (!shippingMethod || !paymentMethod) {
    return null;
  }

  const normalizedLines = lines
    .map((line) => {
      if (!isRecord(line)) {
        return null;
      }

      if (
        typeof line.key !== "string" ||
        typeof line.productSlug !== "string" ||
        typeof line.productName !== "string" ||
        typeof line.productSubtitle !== "string" ||
        typeof line.sku !== "string" ||
        typeof line.variantLabel !== "string" ||
        typeof line.size !== "string" ||
        typeof line.quantity !== "number" ||
        typeof line.unitPrice !== "number" ||
        typeof line.lineTotal !== "number" ||
        typeof line.shippingNote !== "string"
      ) {
        return null;
      }

      return {
        key: line.key,
        productSlug: line.productSlug,
        productName: line.productName,
        productSubtitle: line.productSubtitle,
        sku: line.sku,
        variantLabel: line.variantLabel,
        size: line.size,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        shippingNote: line.shippingNote,
        catalogTruth: normalizeStoredOrderLineCatalogTruth(line.catalogTruth, {
          productSlug: line.productSlug,
          sku: line.sku,
          availability: getCurrentCatalogAvailability(line.productSlug, line.sku),
        }),
      } satisfies StoredOrderLine;
    })
    .filter((line): line is StoredOrderLine => Boolean(line));

  if (normalizedLines.length === 0) {
    return null;
  }

  return {
    orderNumber: value.orderNumber.trim().toUpperCase(),
    createdAt: value.createdAt,
    status: value.status,
    subtotal: value.subtotal,
    shippingFeeEstimate: value.shippingFeeEstimate,
    totalEstimate: value.totalEstimate,
    shippingMethodId: shippingMethod.id,
    paymentMethodId: paymentMethod.id,
    allowOperationalUpdates:
      typeof value.allowOperationalUpdates === "boolean"
        ? value.allowOperationalUpdates
        : false,
    customer: {
      fullName: normalizeText(customer.fullName),
      phone: normalizePhone(customer.phone),
      email: normalizeText(customer.email),
      city: normalizeText(customer.city),
      district: normalizeText(customer.district),
      addressLine: normalizeText(customer.addressLine),
      notes: normalizeText(customer.notes),
    },
    lines: normalizedLines,
    providerBindings: normalizeStoredOrderProviderBindings(
      value.providerBindings,
      paymentMethod.id,
      value.createdAt,
    ),
  };
}

export function sanitizeStoredOrders(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as StoredOrder[];
  }

  return value
    .map((order) => normalizeStoredOrder(order))
    .filter((order): order is StoredOrder => Boolean(order));
}

export function findStoredOrder(
  orders: StoredOrder[],
  orderNumber: string,
  phoneLastFour?: string,
) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const normalizedPhoneLastFour = phoneLastFour?.replace(/\D/g, "").slice(-4);

  if (!normalizedOrderNumber) {
    return null;
  }

  const order = orders.find(
    (candidate) => candidate.orderNumber === normalizedOrderNumber,
  );

  if (!order) {
    return null;
  }

  if (
    normalizedPhoneLastFour &&
    getPhoneLastFour(order.customer.phone) !== normalizedPhoneLastFour
  ) {
    return null;
  }

  return order;
}

export function getOrderTimeline(order: StoredOrder): OrderTimelineStep[] {
  const sequence = getOrderStatusSequence(order.paymentMethodId);
  const currentIndex = Math.max(sequence.indexOf(order.status), 0);

  return sequence.map((key, index) => ({
    key,
    label: statusDirectory[key].label,
    description: statusDirectory[key].description,
    state:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

export function getNextOrderStatus(order: StoredOrder) {
  const sequence = getOrderStatusSequence(order.paymentMethodId);
  const currentIndex = sequence.indexOf(order.status);

  if (currentIndex === -1) {
    return null;
  }

  return sequence[currentIndex + 1] ?? null;
}

export function updateStoredOrderStatus(
  orders: StoredOrder[],
  orderNumber: string,
  nextStatus: OrderStatus,
) {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();

  return orders.map((order) =>
    order.orderNumber === normalizedOrderNumber
      ? {
          ...order,
          status: nextStatus,
        }
      : order,
  );
}
