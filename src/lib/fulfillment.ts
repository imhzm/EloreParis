import type { ResolvedCartLine } from "@/lib/cart";
import {
  buildStoredOrderLineCatalogTruth,
  getStoredOrderLineCatalogTruth,
} from "@/lib/orders";
import type {
  PaymentMethodId,
  ShippingMethodId,
  StoredOrder,
  StoredOrderLineCatalogTruth,
  StoredOrderLine,
} from "@/lib/orders";
import type { NotificationTemplateKey } from "@/lib/notification-types";
import {
  type SupplierId,
  type SupplierRecord,
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
  supplierId: SupplierId | "unmapped";
  supplierName: string;
  fulfillmentModel: SupplierRecord["fulfillmentModel"] | "unmapped";
  shippingClass: string;
  availability: "InStock" | "PreOrder";
  routeLabel: string;
  stockOnHand: number;
  lowStockThreshold: number;
  codEligible: boolean;
  requiresReview: boolean;
};

export type FulfillmentNotification = {
  key: NotificationTemplateKey;
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

export type ProviderHandoffState = "ready" | "staged" | "blocked";

export type ProviderHandoffSnapshot = {
  providerState: ProviderHandoffState;
  providerReadinessLabel: string;
  paymentLaneLabel: string;
  shippingLaneLabel: string;
  nextOwnerLabel: string;
  nextAction: string;
  blockerSummary: string;
  blockers: string[];
  supplierLaneCount: number;
  shippingClassCount: number;
};

type CheckoutLineSnapshot = {
  productSlug: string;
  productName: string;
  sku: string;
  quantity: number;
  lineTotal: number;
  catalogTruth: StoredOrderLineCatalogTruth;
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

function toCheckoutSnapshot(line: ResolvedCartLine): CheckoutLineSnapshot {
  return {
    productSlug: line.product.slug,
    productName: line.product.name,
    sku: line.variant.sku,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
    catalogTruth: buildStoredOrderLineCatalogTruth({
      productSlug: line.product.slug,
      sku: line.variant.sku,
      availability: line.variant.availability,
    }),
  };
}

function toStoredSnapshot(line: StoredOrderLine): CheckoutLineSnapshot {
  return {
    productSlug: line.productSlug,
    productName: line.productName,
    sku: line.sku,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
    catalogTruth: getStoredOrderLineCatalogTruth(line),
  };
}

function buildFulfillmentLinePlans(lineSnapshots: CheckoutLineSnapshot[]) {
  return lineSnapshots.map<FulfillmentLinePlan>((line) => {
    const catalogTruth = line.catalogTruth;
    const requiresLowStockReview = Boolean(
      catalogTruth.mappingStatus === "mapped" &&
        catalogTruth.stockOnHand <= catalogTruth.lowStockThreshold,
    );
    const requiresReview =
      catalogTruth.availability === "PreOrder" ||
      requiresLowStockReview ||
      catalogTruth.mappingStatus !== "mapped";

    let routeLabel = "Local stock dispatch";

    if (catalogTruth.mappingStatus !== "mapped") {
      routeLabel = "Catalog mapping required";
    } else if (
      catalogTruth.availability === "PreOrder" ||
      catalogTruth.fulfillmentModel === "dropship"
    ) {
      routeLabel = "Supplier direct handoff";
    } else if (requiresLowStockReview) {
      routeLabel = "Manual stock confirmation";
    }

    return {
      key: `${line.productSlug}:${line.sku}`,
      productSlug: line.productSlug,
      productName: line.productName,
      sku: line.sku,
      supplierId: catalogTruth.supplierId ?? "unmapped",
      supplierName: catalogTruth.supplierName,
      fulfillmentModel: catalogTruth.fulfillmentModel,
      shippingClass: catalogTruth.shippingClass ?? "unmapped",
      availability: catalogTruth.availability,
      routeLabel,
      stockOnHand: catalogTruth.stockOnHand,
      lowStockThreshold: catalogTruth.lowStockThreshold,
      codEligible: catalogTruth.codEligible,
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

  if (
    linePlans.some(
      (line) =>
        line.supplierId !== "unmapped" &&
        line.stockOnHand <= line.lowStockThreshold,
    )
  ) {
    reasons.add("يوجد عنصر عند أو دون حد المخزون التشغيلي ويحتاج مراجعة قبل الاعتماد النهائي.");
  }

  if (linePlans.some((line) => line.supplierId === "unmapped")) {
    reasons.add("يوجد SKU واحد على الأقل لم يُثبت supplier mapping الخاص به داخل catalog authority بعد.");
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
    (line) =>
      line.fulfillmentModel === "dropship" ||
      line.fulfillmentModel === "unmapped" ||
      line.availability === "PreOrder",
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

type ProviderHandoffInput = {
  deliveryZoneLabel: string;
  recommendedCarrier: string;
  shippingMethodId: ShippingMethodId;
  paymentMethodId: PaymentMethodId;
  paymentLinkRequired: boolean;
  requiresManualReview: boolean;
  manualReviewReasons: string[];
  splitShipment: boolean;
  codEligible: boolean;
  expressEligible: boolean;
  linePlans: FulfillmentLinePlan[];
};

function getPaymentLaneLabel(
  paymentMethodId: PaymentMethodId,
  paymentLinkRequired: boolean,
  codEligible: boolean,
) {
  if (paymentMethodId === "payment_link" || paymentLinkRequired) {
    return "Payment-link ops handoff";
  }

  if (codEligible) {
    return "COD confirmation gate";
  }

  return "Payment review handoff";
}

function getShippingLaneLabel(
  shippingMethodId: ShippingMethodId,
  recommendedCarrier: string,
  expressEligible: boolean,
  splitShipment: boolean,
) {
  if (splitShipment) {
    return `Supplier coordination via ${recommendedCarrier}`;
  }

  if (shippingMethodId === "express" && expressEligible) {
    return `Express dispatch via ${recommendedCarrier}`;
  }

  return `Standard dispatch via ${recommendedCarrier}`;
}

function buildProviderHandoffSnapshot({
  deliveryZoneLabel,
  recommendedCarrier,
  shippingMethodId,
  paymentMethodId,
  paymentLinkRequired,
  requiresManualReview,
  manualReviewReasons,
  splitShipment,
  codEligible,
  expressEligible,
  linePlans,
}: ProviderHandoffInput): ProviderHandoffSnapshot {
  const supplierLaneCount = new Set(linePlans.map((line) => line.supplierId)).size;
  const shippingClassCount = new Set(linePlans.map((line) => line.shippingClass)).size;
  const paymentLaneLabel = getPaymentLaneLabel(
    paymentMethodId,
    paymentLinkRequired,
    codEligible,
  );
  const shippingLaneLabel = getShippingLaneLabel(
    shippingMethodId,
    recommendedCarrier,
    expressEligible,
    splitShipment,
  );

  let providerState: ProviderHandoffState = "ready";
  let providerReadinessLabel = "Provider contract active";
  let nextOwnerLabel =
    shippingMethodId === "express" && expressEligible
      ? "Express dispatch desk"
      : "Dispatch desk";
  let nextAction = `انقل الطلب إلى ${shippingLaneLabel} داخل ${deliveryZoneLabel} بدون إعادة فتح القرار التجاري.`;

  if (requiresManualReview) {
    providerState = "blocked";
    providerReadinessLabel = "Ops review required";
    nextOwnerLabel = "Fulfillment review desk";
    nextAction =
      manualReviewReasons[0] ??
      "أغلق مراجعة المخزون أو lead time أولًا قبل أي handoff للدفع أو الشحن.";
  } else if (paymentLinkRequired) {
    providerState = "staged";
    providerReadinessLabel = "Payment handoff pending";
    nextOwnerLabel = "Payment follow-up";
    nextAction =
      "أنشئ مرجع الطلب ثم أغلق handoff الدفع قبل دفع الطلب إلى مسار التجهيز أو الشحن.";
  } else if (splitShipment) {
    providerState = "staged";
    providerReadinessLabel = "Supplier handoff staged";
    nextOwnerLabel = "Supplier coordination";
    nextAction =
      "ثبّت supplier lanes الحالية أولًا ثم حرّك الطلب إلى نافذة dispatch واحدة واضحة.";
  }

  const blockers = requiresManualReview
    ? manualReviewReasons
    : [
        ...(paymentLinkRequired
          ? ["Handoff الدفع يجب أن يغلق قبل خروج الطلب من queue المراجعة الحالية."]
          : []),
        ...(splitShipment
          ? ["يوجد أكثر من supplier lane فعالة، لذلك يلزم تنسيق الشحن قبل إغلاق handoff النهائي."]
          : []),
      ];

  return {
    providerState,
    providerReadinessLabel,
    paymentLaneLabel,
    shippingLaneLabel,
    nextOwnerLabel,
    nextAction,
    blockerSummary:
      blockers[0] ?? "لا توجد blockers تشغيلية إضافية على handoff الحالي.",
    blockers,
    supplierLaneCount,
    shippingClassCount,
  };
}

function applyPersistedProviderBindings(
  order: StoredOrder,
  snapshot: ProviderHandoffSnapshot,
): ProviderHandoffSnapshot {
  if (snapshot.providerState === "blocked") {
    return snapshot;
  }

  const paymentBinding = order.providerBindings.payment;
  const shippingBinding = order.providerBindings.shipping;

  if (order.paymentMethodId === "payment_link") {
    if (paymentBinding.state === "pending") {
      return {
        ...snapshot,
        providerState: "staged",
        providerReadinessLabel: "Payment link not sent",
        nextOwnerLabel: "Payment follow-up",
        nextAction: `سجّل handoff الدفع عبر ${paymentBinding.providerLabel} قبل نقل الطلب إلى التأكيد أو التجهيز.`,
        blockerSummary: "لم يتم تسجيل payment-link reference بعد داخل authority الحالية.",
        blockers: [
          "لم يتم تسجيل payment-link reference بعد داخل authority الحالية.",
        ],
      };
    }

    if (paymentBinding.state === "link_sent") {
      return {
        ...snapshot,
        providerState: "staged",
        providerReadinessLabel: "Payment callback pending",
        nextOwnerLabel: "Payment callback",
        nextAction: `انتظر callback التأكيد على ${paymentBinding.referenceId ?? "مرجع الدفع الحالي"} قبل دفع الطلب إلى حالة التأكيد.`,
        blockerSummary:
          "تم إرسال payment-link handoff لكن callback التأكيد لم تصل بعد.",
        blockers: [
          "تم إرسال payment-link handoff لكن callback التأكيد لم تصل بعد.",
        ],
      };
    }
  }

  if (shippingBinding.state === "pending" && order.status === "processing") {
    return {
      ...snapshot,
      providerState: "staged",
      providerReadinessLabel: "Carrier booking pending",
      nextOwnerLabel: "Shipping dispatch",
      nextAction: `سجّل booking reference عبر ${shippingBinding.providerLabel} قبل الخروج للتوصيل.`,
      blockerSummary: "لم يتم تسجيل booking reference للشحنة بعد.",
      blockers: ["لم يتم تسجيل booking reference للشحنة بعد."],
    };
  }

  if (shippingBinding.state === "booked") {
    return {
      ...snapshot,
      providerState: "staged",
      providerReadinessLabel: "Carrier booking confirmed",
      nextOwnerLabel: "Carrier callback",
      nextAction: `انتظر callback الخروج للتوصيل على ${shippingBinding.bookingReference ?? "مرجع الشحنة الحالي"} قبل إغلاق مسار الشحن.`,
      blockerSummary:
        "تم تسجيل booking reference لكن callback الخروج للتوصيل لم تصل بعد.",
      blockers: [
        "تم تسجيل booking reference لكن callback الخروج للتوصيل لم تصل بعد.",
      ],
    };
  }

  if (shippingBinding.state === "in_transit") {
    return {
      ...snapshot,
      providerState: "ready",
      providerReadinessLabel: "In-transit callback active",
      nextOwnerLabel: "Customer tracking",
      nextAction: `tracking ${shippingBinding.trackingNumber ?? shippingBinding.bookingReference ?? "الحالي"} هو المرجع التشغيلي الصحيح حتى التسليم.`,
      blockerSummary:
        "لا توجد blockers إضافية بعد وصول callback الخروج للتوصيل الحالية.",
      blockers: [],
    };
  }

  return snapshot;
}

export function getOrderFulfillmentPlan(order: StoredOrder): OrderFulfillmentPlan {
  const deliveryZone = getDeliveryZone(order.customer.city);
  const linePlans = buildFulfillmentLinePlans(order.lines.map(toStoredSnapshot));
  const splitShipment = new Set(linePlans.map((line) => line.supplierId)).size > 1;
  const hasDropshipOrPreOrder = linePlans.some(
    (line) =>
      line.fulfillmentModel === "dropship" ||
      line.fulfillmentModel === "unmapped" ||
      line.availability === "PreOrder",
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

export function getOrderProviderHandoff(order: StoredOrder) {
  const plan = getOrderFulfillmentPlan(order);

  return applyPersistedProviderBindings(
    order,
    buildProviderHandoffSnapshot({
      deliveryZoneLabel: plan.deliveryZoneLabel,
      recommendedCarrier: plan.recommendedCarrier,
      shippingMethodId: order.shippingMethodId,
      paymentMethodId: order.paymentMethodId,
      paymentLinkRequired: plan.paymentLinkRequired,
      requiresManualReview: plan.requiresManualReview,
      manualReviewReasons: plan.manualReviewReasons,
      splitShipment: plan.splitShipment,
      codEligible: plan.codEligible,
      expressEligible: order.shippingMethodId === "express" && plan.expressEligible,
      linePlans: plan.linePlans,
    }),
  );
}

export function getCheckoutProviderHandoff(
  lines: ResolvedCartLine[],
  city: string,
  subtotal: number,
  shippingMethodId: ShippingMethodId,
  paymentMethodId: PaymentMethodId,
) {
  const checkoutRules = getCheckoutRules(lines, city, subtotal);
  const linePlans = buildFulfillmentLinePlans(lines.map(toCheckoutSnapshot));
  const hasDropshipOrPreOrder = linePlans.some(
    (line) =>
      line.fulfillmentModel === "dropship" ||
      line.fulfillmentModel === "unmapped" ||
      line.availability === "PreOrder",
  );
  const splitShipment = new Set(linePlans.map((line) => line.supplierId)).size > 1;

  return buildProviderHandoffSnapshot({
    deliveryZoneLabel: checkoutRules.deliveryZoneLabel,
    recommendedCarrier: resolveCarrier(
      checkoutRules.deliveryZoneId,
      shippingMethodId === "express" && checkoutRules.expressEligible,
      splitShipment,
      hasDropshipOrPreOrder,
    ),
    shippingMethodId,
    paymentMethodId,
    paymentLinkRequired:
      !checkoutRules.codEligible || paymentMethodId === "payment_link",
    requiresManualReview: checkoutRules.manualReviewReasons.length > 0,
    manualReviewReasons: checkoutRules.manualReviewReasons,
    splitShipment,
    codEligible: checkoutRules.codEligible,
    expressEligible:
      shippingMethodId === "express" && checkoutRules.expressEligible,
    linePlans,
  });
}
