import { getOrderFulfillmentPlan } from "@/lib/fulfillment";
import { getOrderStatusMeta, type StoredOrder } from "@/lib/orders";

export type OpsCustomerLane =
  | "verification"
  | "payment"
  | "delivery"
  | "warehouse"
  | "stable";

export type OpsCustomerRecord = {
  key: string;
  name: string;
  city: string;
  maskedPhone: string;
  maskedEmail: string;
  orderCount: number;
  openOrderCount: number;
  recordedValue: number;
  latestOrderAt: string;
  latestOrderNumber: string;
  latestStatusLabel: string;
  lane: OpsCustomerLane;
  laneLabel: string;
  laneNote: string;
  isRepeatCustomer: boolean;
};

type InternalCustomerRecord = OpsCustomerRecord & {
  searchValues: Set<string>;
  lanePriority: number;
};

export type OpsCustomerSnapshot = {
  customers: OpsCustomerRecord[];
  query: string;
  totalCustomerCount: number;
  repeatCustomerCount: number;
  attentionCustomerCount: number;
  totalRecordedValue: number;
};

const terminalStatuses = new Set<StoredOrder["status"]>([
  "payment_expired",
  "cancelled",
]);

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("ar");
}

function buildCustomerKey(order: StoredOrder) {
  const phone = order.customer.phone.replace(/\D/g, "");
  const email = order.customer.email.trim().toLowerCase();

  return phone || email || order.orderNumber;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `•••• ${digits.slice(-4)}` : "غير متاح";
}

function maskEmail(value: string) {
  const [localPart = "", domain = ""] = value.trim().split("@");

  if (!localPart || !domain) return "غير متاح";
  return `${localPart.slice(0, 1)}•••@${domain}`;
}

function getCustomerLane(order: StoredOrder) {
  const plan = getOrderFulfillmentPlan(order);

  if (plan.requiresManualReview || order.status === "received") {
    return {
      lane: "verification" as const,
      label: "يحتاج تحقق",
      note:
        plan.manualReviewReasons[0] ??
        "تحتاج بيانات العميل أو الطلب إلى مراجعة قبل استكمال التنفيذ.",
      priority: 0,
    };
  }

  if (plan.paymentLinkRequired && order.status === "payment_pending") {
    return {
      lane: "payment" as const,
      label: "متابعة الدفع",
      note: "الدفع هو العائق الحالي قبل انتقال الطلب إلى التجهيز.",
      priority: 1,
    };
  }

  if (order.status === "out_for_delivery") {
    return {
      lane: "delivery" as const,
      label: "متابعة التوصيل",
      note: "العميل ينتظر تحديثًا واضحًا عن حركة الشحنة والتسليم.",
      priority: 2,
    };
  }

  if (order.status === "confirmed" || order.status === "processing") {
    return {
      lane: "warehouse" as const,
      label: "قيد التنفيذ",
      note: "الطلب مرتبط حاليًا بالتجهيز أو التسليم الداخلي.",
      priority: 3,
    };
  }

  return {
    lane: "stable" as const,
    label: "مستقر",
    note: "لا توجد متابعة تشغيلية عاجلة لهذا العميل حاليًا.",
    priority: 4,
  };
}

function buildCustomerRecords(orders: StoredOrder[]) {
  const customers = new Map<string, InternalCustomerRecord>();
  const sortedOrders = [...orders].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  for (const order of sortedOrders) {
    const key = buildCustomerKey(order);
    const lane = getCustomerLane(order);
    const isOpen = !terminalStatuses.has(order.status);
    const existing = customers.get(key);
    const searchValues = [
      order.customer.fullName,
      order.customer.phone,
      order.customer.email,
      order.customer.city,
      order.customer.district,
      order.orderNumber,
    ].map(normalizeSearchValue);

    if (!existing) {
      customers.set(key, {
        key,
        name: order.customer.fullName,
        city: order.customer.city,
        maskedPhone: maskPhone(order.customer.phone),
        maskedEmail: maskEmail(order.customer.email),
        orderCount: 1,
        openOrderCount: isOpen ? 1 : 0,
        recordedValue: order.totalEstimate,
        latestOrderAt: order.createdAt,
        latestOrderNumber: order.orderNumber,
        latestStatusLabel: getOrderStatusMeta(order.status).label,
        lane: lane.lane,
        laneLabel: lane.label,
        laneNote: lane.note,
        lanePriority: lane.priority,
        isRepeatCustomer: false,
        searchValues: new Set(searchValues),
      });
      continue;
    }

    existing.orderCount += 1;
    existing.openOrderCount += isOpen ? 1 : 0;
    existing.recordedValue += order.totalEstimate;
    existing.isRepeatCustomer = true;
    searchValues.forEach((value) => existing.searchValues.add(value));

    if (lane.priority < existing.lanePriority && isOpen) {
      existing.lane = lane.lane;
      existing.laneLabel = lane.label;
      existing.laneNote = lane.note;
      existing.lanePriority = lane.priority;
    }
  }

  return [...customers.values()].sort(
    (left, right) =>
      left.lanePriority - right.lanePriority ||
      right.orderCount - left.orderCount ||
      right.latestOrderAt.localeCompare(left.latestOrderAt),
  );
}

export function getOpsCustomerSnapshot(
  orders: StoredOrder[],
  rawQuery: string | undefined,
): OpsCustomerSnapshot {
  const customers = buildCustomerRecords(orders);
  const query = normalizeSearchValue(rawQuery?.slice(0, 100) ?? "");
  const visibleCustomers = query
    ? customers.filter((customer) =>
        [...customer.searchValues].some((value) => value.includes(query)),
      )
    : customers;

  return {
    customers: visibleCustomers.map((customer) => ({
      key: customer.key,
      name: customer.name,
      city: customer.city,
      maskedPhone: customer.maskedPhone,
      maskedEmail: customer.maskedEmail,
      orderCount: customer.orderCount,
      openOrderCount: customer.openOrderCount,
      recordedValue: customer.recordedValue,
      latestOrderAt: customer.latestOrderAt,
      latestOrderNumber: customer.latestOrderNumber,
      latestStatusLabel: customer.latestStatusLabel,
      lane: customer.lane,
      laneLabel: customer.laneLabel,
      laneNote: customer.laneNote,
      isRepeatCustomer: customer.isRepeatCustomer,
    })),
    query,
    totalCustomerCount: customers.length,
    repeatCustomerCount: customers.filter((customer) => customer.isRepeatCustomer).length,
    attentionCustomerCount: customers.filter((customer) => customer.lane !== "stable").length,
    totalRecordedValue: customers.reduce(
      (total, customer) => total + customer.recordedValue,
      0,
    ),
  };
}
