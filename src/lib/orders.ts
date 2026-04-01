import type { ResolvedCartLine } from "@/lib/cart";

export const ORDER_STORAGE_KEY = "cozmateks-orders";

export type ShippingMethodId = "standard" | "express";
export type PaymentMethodId = "payment_link" | "cash_on_delivery";
export type OrderStatus =
  | "received"
  | "payment_pending"
  | "confirmed"
  | "processing"
  | "out_for_delivery";

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
  customer: CheckoutCustomerDetails;
  lines: StoredOrderLine[];
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

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && value in statusDirectory;
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
}) {
  const shippingMethod =
    getShippingMethodById(input.shippingMethodId) ?? shippingMethods[0];
  const paymentMethod =
    getPaymentMethodById(input.paymentMethodId) ?? paymentMethods[0];
  const subtotal = input.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingFeeEstimate = shippingMethod.estimatedFee;

  return {
    orderNumber: buildOrderNumber(),
    createdAt: new Date().toISOString(),
    status:
      paymentMethod.id === "payment_link" ? "payment_pending" : "received",
    subtotal,
    shippingFeeEstimate,
    totalEstimate: subtotal + shippingFeeEstimate,
    shippingMethodId: shippingMethod.id,
    paymentMethodId: paymentMethod.id,
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
    })),
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
