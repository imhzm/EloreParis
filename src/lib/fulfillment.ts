import type { ResolvedCartLine } from "@/lib/cart";
import type {
  PaymentMethodId,
  ShippingMethodId,
  StoredOrder,
  StoredOrderLine,
} from "@/lib/orders";
import { getProductBySlug } from "@/lib/site-content";
import {
  getSupplierRecord,
  getVariantOperations,
  type SupplierId,
} from "@/lib/variant-operations";

export type DeliveryZoneId = "pending" | "metro" | "major" | "extended";

export type CheckoutOptionAvailability<T extends string> = {
  id: T;
  enabled: boolean;
  reason?: string;
};

export type CheckoutRules = {
  deliveryZoneId: DeliveryZoneId;
  deliveryZoneLabel: string;
  expressEligible: boolean;
  codEligible: boolean;
  recommendedShippingMethodId: ShippingMethodId;
  recommendedPaymentMethodId: PaymentMethodId;
  shippingOptions: CheckoutOptionAvailability<ShippingMethodId>[];
  paymentOptions: CheckoutOptionAvailability<PaymentMethodId>[];
  manualReviewReasons: string[];
};

export type FulfillmentLinePlan = {
  key: string;
  productSlug: string;
  productName: string;
  sku: string;
  supplierId: SupplierId;
  supplierName: string;
  fulfillmentModel: "direct" | "dropship" | "hybrid";
  shippingClass: string;
  availability: "InStock" | "PreOrder";
  routeLabel: string;
  stockOnHand: number;
  lowStockThreshold: number;
  codEligible: boolean;
  requiresReview: boolean;
};

export type FulfillmentNotification = {
  key: string;
  label: string;
  channel: "whatsapp" | "email" | "dashboard";
  status: "active" | "completed" | "upcoming" | "disabled";
  note: string;
};

export type OrderFulfillmentPlan = {
  deliveryZoneId: DeliveryZoneId;
  deliveryZoneLabel: string;
  recommendedCarrier: string;
  estimatedDispatchWindow: string;
  supplierMode: "local_stock" | "supplier_assisted" | "mixed";
  splitShipment: boolean;
  expressEligible: boolean;
  codEligible: boolean;
  paymentLinkRequired: boolean;
  requiresManualReview: boolean;
  manualReviewReasons: string[];
  linePlans: FulfillmentLinePlan[];
  notifications: FulfillmentNotification[];
};

type CheckoutLineSnapshot = {
  productSlug: string;
  productName: string;
  sku: string;
  quantity: number;
  lineTotal: number;
  availability: "InStock" | "PreOrder";
};

function normalizeArabic(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

const metroCityMatchers = [
  "الرياض",
  "riyadh",
  "جده",
  "جدة",
  "jeddah",
  "الخبر",
  "khobar",
  "الدمام",
  "dammam",
];

const majorCityMatchers = [
  "مكه",
  "مكة",
  "makkah",
  "mecca",
  "المدينة",
  "المدينه",
  "medina",
  "taif",
  "الطايف",
  "الطائف",
  "abha",
  "ابها",
  "خميس مشيط",
  "khamis",
];

function getDeliveryZone(city: string) {
  const normalizedCity = normalizeArabic(city);

  if (!normalizedCity) {
    return {
      id: "pending" as const,
      label: "بعد تحديد المدينة",
    };
  }

  if (metroCityMatchers.some((matcher) => normalizedCity.includes(normalizeArabic(matcher)))) {
    return {
      id: "metro" as const,
      label: "نطاق حضري سريع",
    };
  }

  if (majorCityMatchers.some((matcher) => normalizedCity.includes(normalizeArabic(matcher)))) {
    return {
      id: "major" as const,
      label: "مدينة رئيسية",
    };
  }

  return {
    id: "extended" as const,
    label: "نطاق ممتد داخل السعودية",
  };
}

function getLineAvailability(productSlug: string, sku: string) {
  const product = getProductBySlug(productSlug);
  return (
    product?.variants.find((variant) => variant.sku === sku)?.availability ?? "PreOrder"
  );
}

function toCheckoutSnapshot(line: ResolvedCartLine): CheckoutLineSnapshot {
  return {
    productSlug: line.product.slug,
    productName: line.product.name,
    sku: line.variant.sku,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
    availability: line.variant.availability,
  };
}

function toStoredSnapshot(line: StoredOrderLine): CheckoutLineSnapshot {
  return {
    productSlug: line.productSlug,
    productName: line.productName,
    sku: line.sku,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
    availability: getLineAvailability(line.productSlug, line.sku),
  };
}

function buildFulfillmentLinePlans(lineSnapshots: CheckoutLineSnapshot[]) {
  return lineSnapshots.map<FulfillmentLinePlan>((line) => {
    const variantOps = getVariantOperations(line.productSlug, line.sku);
    const supplier = variantOps
      ? getSupplierRecord(variantOps.supplierId)
      : null;
    const requiresLowStockReview = Boolean(
      variantOps && variantOps.stockOnHand <= variantOps.lowStockThreshold,
    );
    const requiresReview =
      line.availability === "PreOrder" || requiresLowStockReview || !variantOps;

    let routeLabel = "Local stock dispatch";

    if (!variantOps) {
      routeLabel = "Catalog mapping required";
    } else if (line.availability === "PreOrder" || supplier?.fulfillmentModel === "dropship") {
      routeLabel = "Supplier direct handoff";
    } else if (requiresLowStockReview) {
      routeLabel = "Manual stock confirmation";
    }

    return {
      key: `${line.productSlug}:${line.sku}`,
      productSlug: line.productSlug,
      productName: line.productName,
      sku: line.sku,
      supplierId: variantOps?.supplierId ?? "desert-distribution",
      supplierName: supplier?.name ?? "Supplier mapping pending",
      fulfillmentModel: supplier?.fulfillmentModel ?? "dropship",
      shippingClass: variantOps?.shippingClass ?? "foundation-standard",
      availability: line.availability,
      routeLabel,
      stockOnHand: variantOps?.stockOnHand ?? 0,
      lowStockThreshold: variantOps?.lowStockThreshold ?? 0,
      codEligible: variantOps?.codEligible ?? false,
      requiresReview,
    };
  });
}

function buildManualReviewReasons(
  linePlans: FulfillmentLinePlan[],
  deliveryZoneId: DeliveryZoneId,
  totalEstimate: number,
  operationalUpdatesAllowed = true,
) {
  const reasons = new Set<string>();

  if (linePlans.some((line) => line.availability === "PreOrder")) {
    reasons.add("يوجد عنصر يعمل كطلب ممتد ويحتاج تأكيد lead time قبل الجدولة.");
  }

  if (linePlans.some((line) => line.stockOnHand <= line.lowStockThreshold)) {
    reasons.add("يوجد عنصر عند أو دون حد المخزون التشغيلي ويحتاج مراجعة قبل الاعتماد النهائي.");
  }

  const supplierIds = new Set(linePlans.map((line) => line.supplierId));
  if (supplierIds.size > 1) {
    reasons.add("الطلب موزع على أكثر من مورد ويحتاج قرار split shipment واضح.");
  }

  if (deliveryZoneId === "extended") {
    reasons.add("الطلب داخل نطاق ممتد ويحتاج مراجعة نافذة الخدمة وCOD قبل الاعتماد.");
  }

  if (totalEstimate > 350) {
    reasons.add("إجمالي الطلب أعلى من سقف COD التشغيلي الحالي.");
  }

  if (!operationalUpdatesAllowed) {
    reasons.add("العميلة لم توافق على التحديثات التشغيلية، لذلك المتابعة ستكون يدوية فقط.");
  }

  return Array.from(reasons);
}

function getStatusSequence(paymentMethodId: PaymentMethodId) {
  return paymentMethodId === "payment_link"
    ? ([
        "payment_pending",
        "confirmed",
        "processing",
        "out_for_delivery",
      ] as ReadonlyArray<StoredOrder["status"]>)
    : ([
        "received",
        "confirmed",
        "processing",
        "out_for_delivery",
      ] as ReadonlyArray<StoredOrder["status"]>);
}

export function getCheckoutRules(
  lines: ResolvedCartLine[],
  city: string,
  subtotal: number,
): CheckoutRules {
  const deliveryZone = getDeliveryZone(city);
  const linePlans = buildFulfillmentLinePlans(lines.map(toCheckoutSnapshot));
  const hasDropshipOrPreOrder = linePlans.some(
    (line) => line.fulfillmentModel === "dropship" || line.availability === "PreOrder",
  );
  const splitShipment = new Set(linePlans.map((line) => line.supplierId)).size > 1;
  const expressEligible =
    deliveryZone.id !== "pending" &&
    deliveryZone.id !== "extended" &&
    !hasDropshipOrPreOrder;
  const codEligible =
    deliveryZone.id !== "pending" &&
    deliveryZone.id !== "extended" &&
    subtotal <= 350 &&
    linePlans.every(
      (line) => line.codEligible && line.availability === "InStock",
    );

  const manualReviewReasons = buildManualReviewReasons(
    linePlans,
    deliveryZone.id,
    subtotal,
  );

  return {
    deliveryZoneId: deliveryZone.id,
    deliveryZoneLabel: deliveryZone.label,
    expressEligible,
    codEligible,
    recommendedShippingMethodId: expressEligible ? "express" : "standard",
    recommendedPaymentMethodId: codEligible ? "cash_on_delivery" : "payment_link",
    shippingOptions: [
      {
        id: "standard",
        enabled: true,
        reason:
          splitShipment || hasDropshipOrPreOrder
            ? "مناسب للطلبات المختلطة أو الممتدة لأنه يمنح هامش تجهيز أوسع."
            : undefined,
      },
      {
        id: "express",
        enabled: expressEligible,
        reason: expressEligible
          ? undefined
          : deliveryZone.id === "pending"
            ? "حددي المدينة أولًا لحساب أهلية الشحن السريع."
            : hasDropshipOrPreOrder
              ? "الشحن السريع غير متاح للطلبات التي تحتوي عناصر preorder أو dropship."
              : "الشحن السريع غير مفعّل لهذا النطاق الجغرافي في النموذج الحالي.",
      },
    ],
    paymentOptions: [
      {
        id: "payment_link",
        enabled: true,
        reason:
          !codEligible && deliveryZone.id !== "pending"
            ? "هذا هو المسار التشغيلي الأنسب للطلب الحالي حسب المدينة وطبيعة العناصر."
            : undefined,
      },
      {
        id: "cash_on_delivery",
        enabled: codEligible,
        reason: codEligible
          ? undefined
          : deliveryZone.id === "pending"
            ? "حددي المدينة أولًا لحساب أهلية الدفع عند الاستلام."
            : subtotal > 350
              ? "الدفع عند الاستلام متاح حاليًا للطلبات حتى 350 ر.س فقط."
              : hasDropshipOrPreOrder
                ? "الدفع عند الاستلام غير متاح للعناصر الممتدة أو الموردة مباشرة من المورد."
                : "بعض عناصر السلة غير مؤهلة تشغيليًا للدفع عند الاستلام.",
      },
    ],
    manualReviewReasons,
  };
}

function getNotificationChannel(order: StoredOrder) {
  return order.customer.email ? "email" : "whatsapp";
}

function getNotificationStatus(
  order: StoredOrder,
  triggerStatus: StoredOrder["status"],
) {
  const statusSequence = getStatusSequence(order.paymentMethodId);
  const currentIndex = statusSequence.indexOf(order.status);
  const triggerIndex = statusSequence.indexOf(triggerStatus);

  if (!order.allowOperationalUpdates) {
    return "disabled" as const;
  }

  if (triggerIndex === -1) {
    return "upcoming" as const;
  }

  if (currentIndex > triggerIndex) {
    return "completed" as const;
  }

  if (currentIndex === triggerIndex) {
    return "active" as const;
  }

  return "upcoming" as const;
}

function buildNotifications(order: StoredOrder): FulfillmentNotification[] {
  const channel = getNotificationChannel(order);

  const notifications: FulfillmentNotification[] = [
    {
      key: "order_received",
      label: "تأكيد استلام الطلب",
      channel,
      status: getNotificationStatus(
        {
          ...order,
          status: order.paymentMethodId === "payment_link" ? "payment_pending" : "received",
        },
        order.paymentMethodId === "payment_link" ? "payment_pending" : "received",
      ),
      note:
        order.paymentMethodId === "payment_link"
          ? "يرسل مرجع الطلب مع توضيح أن الخطوة التالية هي رابط الدفع."
          : "يرسل مرجع الطلب مع توضيح أن الطلب دخل queue التجهيز.",
    },
  ];

  if (order.paymentMethodId === "payment_link") {
    notifications.push({
      key: "payment_link",
      label: "إرسال رابط الدفع",
      channel,
      status: getNotificationStatus(order, "payment_pending"),
      note: order.allowOperationalUpdates
        ? "جاهز عندما تصبح حالة الطلب payment_pending أو تبقى عليه."
        : "موقوف لأن التحديثات التشغيلية غير مفعّلة لهذا الطلب.",
    });
  }

  notifications.push(
    {
      key: "preparation_update",
      label: "تحديث التجهيز",
      channel,
      status: getNotificationStatus(order, "processing"),
      note: "يوضح أن الطلب دخل مرحلة تجهيز العناصر والتغليف.",
    },
    {
      key: "delivery_update",
      label: "تحديث الخروج للتوصيل",
      channel: "dashboard",
      status: getNotificationStatus(order, "out_for_delivery"),
      note: "يُظهر المرحلة النهائية مع نافذة التوصيل المتوقعة في الواجهة الحالية.",
    },
  );

  return notifications;
}

function resolveCarrier(
  deliveryZoneId: DeliveryZoneId,
  expressEligible: boolean,
  splitShipment: boolean,
  hasDropshipOrPreOrder: boolean,
) {
  if (expressEligible && deliveryZoneId === "metro") {
    return "Metro Priority Desk";
  }

  if (expressEligible && deliveryZoneId === "major") {
    return "Regional Express Lane";
  }

  if (splitShipment) {
    return "Split-ship coordination queue";
  }

  if (hasDropshipOrPreOrder) {
    return "Supplier direct dispatch";
  }

  return deliveryZoneId === "extended"
    ? "Saudi Parcel Extended"
    : "Saudi Parcel Standard";
}

function resolveDispatchWindow(
  deliveryZoneId: DeliveryZoneId,
  expressEligible: boolean,
  hasDropshipOrPreOrder: boolean,
  requiresManualReview: boolean,
) {
  if (hasDropshipOrPreOrder) {
    return "1-3 أيام عمل قبل التحويل لشريك الشحن.";
  }

  if (requiresManualReview) {
    return "خلال يوم عمل بعد تأكيد المخزون والتغليف.";
  }

  if (expressEligible) {
    return deliveryZoneId === "metro"
      ? "نفس اليوم قبل cutoff التشغيلي."
      : "خلال يوم عمل واحد.";
  }

  return deliveryZoneId === "extended"
    ? "1-2 يوم عمل قبل الإرسال للنطاق الممتد."
    : "خلال يوم عمل واحد.";
}

export function getOrderFulfillmentPlan(order: StoredOrder): OrderFulfillmentPlan {
  const deliveryZone = getDeliveryZone(order.customer.city);
  const linePlans = buildFulfillmentLinePlans(order.lines.map(toStoredSnapshot));
  const splitShipment = new Set(linePlans.map((line) => line.supplierId)).size > 1;
  const hasDropshipOrPreOrder = linePlans.some(
    (line) => line.fulfillmentModel === "dropship" || line.availability === "PreOrder",
  );
  const codEligible =
    deliveryZone.id !== "pending" &&
    deliveryZone.id !== "extended" &&
    order.totalEstimate <= 350 &&
    linePlans.every(
      (line) => line.codEligible && line.availability === "InStock",
    );
  const expressEligible =
    deliveryZone.id !== "pending" &&
    deliveryZone.id !== "extended" &&
    !hasDropshipOrPreOrder;
  const manualReviewReasons = buildManualReviewReasons(
    linePlans,
    deliveryZone.id,
    order.totalEstimate,
    order.allowOperationalUpdates,
  );
  const supplierMode =
    splitShipment
      ? "mixed"
      : hasDropshipOrPreOrder
        ? "supplier_assisted"
        : "local_stock";

  return {
    deliveryZoneId: deliveryZone.id,
    deliveryZoneLabel: deliveryZone.label,
    recommendedCarrier: resolveCarrier(
      deliveryZone.id,
      order.shippingMethodId === "express" && expressEligible,
      splitShipment,
      hasDropshipOrPreOrder,
    ),
    estimatedDispatchWindow: resolveDispatchWindow(
      deliveryZone.id,
      order.shippingMethodId === "express" && expressEligible,
      hasDropshipOrPreOrder,
      manualReviewReasons.length > 0,
    ),
    supplierMode,
    splitShipment,
    expressEligible,
    codEligible,
    paymentLinkRequired: !codEligible || order.paymentMethodId === "payment_link",
    requiresManualReview: manualReviewReasons.length > 0,
    manualReviewReasons,
    linePlans,
    notifications: buildNotifications(order),
  };
}
