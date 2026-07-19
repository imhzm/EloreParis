import { getOpsCustomerSnapshot } from "@/lib/ops-customer-insights";
import {
  getOrderStatusMeta,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/orders";

export type OpsAnalyticsPeriod = "7" | "30" | "90";

export type OpsAnalyticsPoint = {
  key: string;
  label: string;
  orderCount: number;
  recordedValue: number;
};

export type OpsAnalyticsBreakdown = {
  key: string;
  label: string;
  orderCount: number;
  recordedValue: number;
  share: number;
};

export type OpsAnalyticsComparison = {
  currentValue: number;
  previousValue: number;
  changePercent: number | null;
  direction: "up" | "down" | "flat";
};

type OpsAnalyticsProductEntry = {
  key: string;
  label: string;
  units: number;
  recordedValue: number;
};

export type OpsAnalyticsSnapshot = {
  period: OpsAnalyticsPeriod;
  rangeDays: number;
  orderCount: number;
  recordedValue: number;
  confirmedPaymentValue: number;
  averageOrderValue: number;
  cancellationRate: number;
  repeatCustomerCount: number;
  valueChangePercent: number | null;
  comparison: {
    recordedValue: OpsAnalyticsComparison;
    orderCount: OpsAnalyticsComparison;
    averageOrderValue: OpsAnalyticsComparison;
    cancellationRate: OpsAnalyticsComparison;
  };
  points: OpsAnalyticsPoint[];
  confirmedPoints: OpsAnalyticsPoint[];
  maxPointValue: number;
  statuses: OpsAnalyticsBreakdown[];
  cities: OpsAnalyticsBreakdown[];
  products: OpsAnalyticsProductEntry[];
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const periodDays: Record<OpsAnalyticsPeriod, number> = {
  "7": 7,
  "30": 30,
  "90": 90,
};

const orderStatuses: OrderStatus[] = [
  "received",
  "payment_pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "payment_expired",
  "cancelled",
];

const labelFormatter = new Intl.DateTimeFormat("ar-SA", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function normalizeOpsAnalyticsPeriod(
  value: string | undefined,
): OpsAnalyticsPeriod {
  return value === "7" || value === "90" ? value : "30";
}

function getRiyadhDayIndex(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
}

function formatDayIndex(dayIndex: number) {
  return labelFormatter.format(new Date(dayIndex * DAY_IN_MS));
}

function getValueChange(currentValue: number, previousValue: number) {
  if (previousValue <= 0) return currentValue > 0 ? null : 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

function getBreakdown(
  orders: StoredOrder[],
  selectKey: (order: StoredOrder) => string,
  getLabel: (key: string) => string,
) {
  const groups = new Map<string, { orderCount: number; recordedValue: number }>();

  for (const order of orders) {
    const key = selectKey(order) || "unknown";
    const existing = groups.get(key) ?? { orderCount: 0, recordedValue: 0 };
    existing.orderCount += 1;
    existing.recordedValue += order.totalEstimate;
    groups.set(key, existing);
  }

  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      label: getLabel(key),
      orderCount: group.orderCount,
      recordedValue: group.recordedValue,
      share: orders.length > 0 ? (group.orderCount / orders.length) * 100 : 0,
    }))
    .sort(
      (left, right) =>
        right.orderCount - left.orderCount ||
        right.recordedValue - left.recordedValue,
    );
}

function getTrendPoints(
  orders: StoredOrder[],
  startDayIndex: number,
  rangeDays: number,
) {
  const bucketSize = rangeDays === 7 ? 1 : rangeDays === 30 ? 2 : 7;
  const bucketCount = Math.ceil(rangeDays / bucketSize);
  const points: OpsAnalyticsPoint[] = Array.from(
    { length: bucketCount },
    (_, index) => {
      const bucketStart = startDayIndex + index * bucketSize;
      const bucketEnd = Math.min(
        bucketStart + bucketSize - 1,
        startDayIndex + rangeDays - 1,
      );
      return {
        key: `${bucketStart}-${bucketEnd}`,
        label:
          bucketStart === bucketEnd
            ? formatDayIndex(bucketStart)
            : `${formatDayIndex(bucketStart)} – ${formatDayIndex(bucketEnd)}`,
        orderCount: 0,
        recordedValue: 0,
      };
    },
  );

  for (const order of orders) {
    const dayIndex = getRiyadhDayIndex(order.createdAt);
    if (dayIndex === null) continue;
    const bucketIndex = Math.floor((dayIndex - startDayIndex) / bucketSize);
    const point = points[bucketIndex];
    if (!point) continue;
    point.orderCount += 1;
    point.recordedValue += order.totalEstimate;
  }

  return points;
}

export function getOpsAnalyticsSnapshot(
  orders: StoredOrder[],
  period: OpsAnalyticsPeriod,
  now = new Date(),
): OpsAnalyticsSnapshot {
  const rangeDays = periodDays[period];
  const todayDayIndex = getRiyadhDayIndex(now) ?? 0;
  const startDayIndex = todayDayIndex - rangeDays + 1;
  const previousStartDayIndex = startDayIndex - rangeDays;
  const ordersWithDay = orders.map((order) => ({
    order,
    dayIndex: getRiyadhDayIndex(order.createdAt),
  }));
  const currentOrders = ordersWithDay
    .filter(
      ({ dayIndex }) =>
        dayIndex !== null && dayIndex >= startDayIndex && dayIndex <= todayDayIndex,
    )
    .map(({ order }) => order);
  const previousOrders = ordersWithDay
    .filter(
      ({ dayIndex }) =>
        dayIndex !== null &&
        dayIndex >= previousStartDayIndex &&
        dayIndex < startDayIndex,
    )
    .map(({ order }) => order);
  const recordedValue = currentOrders.reduce(
    (total, order) => total + order.totalEstimate,
    0,
  );
  const points = getTrendPoints(currentOrders, startDayIndex, rangeDays);
  const products = new Map<
    string,
    { label: string; units: number; recordedValue: number }
  >();

  for (const order of currentOrders) {
    for (const line of order.lines) {
      const existing = products.get(line.sku) ?? {
        label: line.productName,
        units: 0,
        recordedValue: 0,
      };
      existing.units += line.quantity;
      existing.recordedValue += line.lineTotal;
      products.set(line.sku, existing);
    }
  }

  const cancelledOrders = currentOrders.filter(
    (order) => order.status === "cancelled" || order.status === "payment_expired",
  );
  const cancelledPreviousOrders = previousOrders.filter(
    (order) => order.status === "cancelled" || order.status === "payment_expired",
  );

  const currentOrderCount = currentOrders.length;
  const currentAov = currentOrderCount > 0 ? recordedValue / currentOrderCount : 0;
  const currentCancellationRate =
    currentOrderCount > 0 ? (cancelledOrders.length / currentOrderCount) * 100 : 0;

  const previousOrderCount = previousOrders.length;
  const previousRecordedValueComputed = previousOrders.reduce(
    (total, order) => total + order.totalEstimate,
    0,
  );
  const previousAov =
    previousOrderCount > 0 ? previousRecordedValueComputed / previousOrderCount : 0;
  const previousCancellationRate =
    previousOrderCount > 0
      ? (cancelledPreviousOrders.length / previousOrderCount) * 100
      : 0;

  function buildComparison(
    current: number,
    previous: number,
  ): OpsAnalyticsComparison {
    const changePercent =
      previous <= 0 ? (current > 0 ? null : 0) : ((current - previous) / previous) * 100;
    return {
      currentValue: current,
      previousValue: previous,
      changePercent,
      direction:
        changePercent === null
          ? "flat"
          : changePercent > 0
            ? "up"
            : changePercent < 0
              ? "down"
              : "flat",
    };
  }

  const confirmedPoints = getTrendPoints(
    currentOrders.filter(
      (order) => order.providerBindings.payment.state === "confirmed",
    ),
    startDayIndex,
    rangeDays,
  );

  return {
    period,
    rangeDays,
    orderCount: currentOrderCount,
    recordedValue,
    confirmedPaymentValue: currentOrders
      .filter((order) => order.providerBindings.payment.state === "confirmed")
      .reduce((total, order) => total + order.totalEstimate, 0),
    averageOrderValue: currentAov,
    cancellationRate: currentCancellationRate,
    repeatCustomerCount: getOpsCustomerSnapshot(currentOrders, undefined)
      .repeatCustomerCount,
    valueChangePercent: getValueChange(recordedValue, previousRecordedValueComputed),
    comparison: {
      recordedValue: buildComparison(recordedValue, previousRecordedValueComputed),
      orderCount: buildComparison(currentOrderCount, previousOrderCount),
      averageOrderValue: buildComparison(currentAov, previousAov),
      cancellationRate: buildComparison(currentCancellationRate, previousCancellationRate),
    },
    points,
    confirmedPoints,
    maxPointValue: Math.max(
      0,
      ...points.map((point) => point.recordedValue),
      ...confirmedPoints.map((point) => point.recordedValue),
    ),
    statuses: getBreakdown(
      currentOrders,
      (order) => order.status,
      (status) => getOrderStatusMeta(status as OrderStatus).label,
    ).sort(
      (left, right) =>
        orderStatuses.indexOf(left.key as OrderStatus) -
        orderStatuses.indexOf(right.key as OrderStatus),
    ),
    cities: getBreakdown(
      currentOrders,
      (order) => order.customer.city.trim(),
      (city) => (city === "unknown" ? "غير محدد" : city),
    ).slice(0, 6),
    products: [...products.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort(
        (left, right) =>
          right.units - left.units || right.recordedValue - left.recordedValue,
      )
      .slice(0, 6),
  };
}
