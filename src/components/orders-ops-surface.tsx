"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import {
  getOrderFulfillmentPlan,
  getOrderProviderHandoff,
} from "@/lib/fulfillment";
import {
  advanceOpsOrderFromAuthority,
  fetchOpsOrdersFromAuthority,
  updateOpsOrderProviderBinding,
} from "@/lib/order-authority-client";
import {
  getNextOrderStatus,
  getOrderStatusMeta,
  getOrderTimeline,
  type OrderProviderBindingAction,
  getPaymentMethodById,
  getPhoneLastFour,
  getShippingMethodById,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/orders";
import styles from "./order-flow.module.css";

type OrderStatusFilter = OrderStatus | "all";

const statusFilters: OrderStatusFilter[] = [
  "all",
  "received",
  "payment_pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "payment_expired",
  "cancelled",
];

function formatOrderDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function getOwnerLane(order: StoredOrder, authorityPlan: ReturnType<typeof getOrderFulfillmentPlan>) {
  if (authorityPlan.requiresManualReview) {
    return {
      label: "Fulfillment review desk",
      note:
        authorityPlan.manualReviewReasons[0] ??
        "هذا الطلب يحتاج قرارًا تشغيليًا يدويًا قبل تثبيت مسار الشحن أو الدفع.",
    };
  }

  if (authorityPlan.paymentLinkRequired && order.status === "payment_pending") {
    return {
      label: "Payment follow-up",
      note: "المطلوب الآن إغلاق الدفع أو إعادة إرسال handoff الدفع قبل دفع الطلب إلى مراحل التجهيز.",
    };
  }

  if (authorityPlan.splitShipment) {
    return {
      label: "Supplier coordination",
      note: "الطلب موزع على أكثر من supplier lane ويحتاج تنسيق شحن واضح قبل الإغلاق.",
    };
  }

  if (order.status === "confirmed" || order.status === "processing") {
    return {
      label: "Warehouse ops",
      note: "المطلوب الآن تثبيت dispatch window والتنفيذ داخل lane التجهيز الحالية.",
    };
  }

  return {
    label: "Customer confirmation",
    note: "الطلب جاهز للانتقال المنضبط إلى الخطوة التالية دون إعادة فتح القرار التجاري.",
  };
}

function getProviderActionLabel(action: OrderProviderBindingAction) {
  switch (action) {
    case "payment_link_sent":
      return "تسجيل إرسال رابط الدفع";
    case "payment_confirmed":
      return "تأكيد الدفع";
    case "shipping_booked":
      return "تسجيل حجز الشحنة";
    case "shipping_in_transit":
      return "تسجيل خروجها للتوصيل";
  }
}

export function OrdersOpsSurface() {
  const pathname = usePathname() ?? "/ops/orders";
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [activeProviderActionKey, setActiveProviderActionKey] = useState<string | null>(null);

  useEffect(() => {
    void fetchOpsOrdersFromAuthority()
      .then((nextOrders) => {
        setOrders(nextOrders);
        setError(null);
      })
      .catch((loadError: unknown) => {
        setOrders([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر قراءة الطلبات من authority الداخلية.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const authorityOrders = useMemo(
    () =>
      orders.map((order) => {
        const authorityPlan = getOrderFulfillmentPlan(order);
        const providerHandoff = getOrderProviderHandoff(order);

        return {
          order,
          authorityPlan,
          providerHandoff,
          ownerLane: getOwnerLane(order, authorityPlan),
        };
      }),
    [orders],
  );

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalEstimate, 0);
    const pendingFollowup = orders.filter(
      (order) =>
        order.status === "received" || order.status === "payment_pending",
    ).length;
    const activeFulfillment = orders.filter(
      (order) =>
        order.status === "confirmed" ||
        order.status === "processing" ||
        order.status === "out_for_delivery",
    ).length;
    const manualReviewCount = authorityOrders.filter(
      ({ authorityPlan }) => authorityPlan.requiresManualReview,
    ).length;
    const splitShipmentCount = authorityOrders.filter(
      ({ authorityPlan }) => authorityPlan.splitShipment,
    ).length;
    const paymentFollowupCount = authorityOrders.filter(
      ({ authorityPlan, order }) =>
        authorityPlan.paymentLinkRequired && order.status === "payment_pending",
    ).length;
    const providerReadyCount = authorityOrders.filter(
      ({ providerHandoff }) => providerHandoff.providerState === "ready",
    ).length;

    return {
      totalOrders,
      totalRevenue,
      pendingFollowup,
      activeFulfillment,
      manualReviewCount,
      splitShipmentCount,
      paymentFollowupCount,
      providerReadyCount,
      averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    };
  }, [authorityOrders, orders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return authorityOrders.filter(({ order, authorityPlan, providerHandoff, ownerLane }) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

        const haystack = [
          order.orderNumber,
          order.customer.fullName,
          order.customer.city,
          order.customer.district,
          getPhoneLastFour(order.customer.phone),
          order.shippingMethodId,
          order.paymentMethodId,
          authorityPlan.recommendedCarrier,
          authorityPlan.supplierMode,
          providerHandoff.paymentLaneLabel,
          providerHandoff.shippingLaneLabel,
          providerHandoff.nextOwnerLabel,
          ownerLane.label,
          ...order.lines.map((line) => line.productName),
          ...authorityPlan.linePlans.map((line) => `${line.supplierName} ${line.routeLabel}`),
        ]
          .join(" ")
          .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [authorityOrders, query, statusFilter]);

  const statusCounts = useMemo(
    () =>
      statusFilters.reduce<Record<OrderStatusFilter, number>>(
        (accumulator, filter) => {
          accumulator[filter] =
            filter === "all"
              ? orders.length
              : orders.filter((order) => order.status === filter).length;
          return accumulator;
        },
        {
          all: 0,
          received: 0,
          payment_pending: 0,
          confirmed: 0,
          processing: 0,
          out_for_delivery: 0,
          payment_expired: 0,
          cancelled: 0,
        },
      ),
    [orders],
  );

  const handleAdvanceStatus = (order: StoredOrder) => {
    void advanceOpsOrderFromAuthority(order.orderNumber)
      .then(({ order: updatedOrder, previousStatus, nextStatus }) => {
        setOrders((currentOrders) =>
          currentOrders.map((candidate) =>
            candidate.orderNumber === updatedOrder.orderNumber
              ? updatedOrder
              : candidate,
          ),
        );
        setError(null);
        setLastUpdate(
          `تم نقل ${updatedOrder.orderNumber} من ${getOrderStatusMeta(previousStatus).label} إلى ${getOrderStatusMeta(nextStatus).label}.`,
        );

        trackAnalyticsEvent("ops_order_status_update", {
          source_path: pathname,
          source_page_type: getPageType(pathname),
          order_reference: updatedOrder.orderNumber,
          previous_status: previousStatus,
          next_status: nextStatus,
          payment_method: updatedOrder.paymentMethodId,
        });
      })
      .catch((updateError: unknown) => {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "تعذر تحديث حالة الطلب داخل authority الحالية.",
        );
      });
  };

  const handleProviderAction = (
    order: StoredOrder,
    action: OrderProviderBindingAction,
  ) => {
    const actionKey = `${order.orderNumber}:${action}`;
    setActiveProviderActionKey(actionKey);

    void updateOpsOrderProviderBinding(order.orderNumber, action)
      .then(({ order: updatedOrder }) => {
        setOrders((currentOrders) =>
          currentOrders.map((candidate) =>
            candidate.orderNumber === updatedOrder.orderNumber
              ? updatedOrder
              : candidate,
          ),
        );
        setError(null);
        setLastUpdate(
          `${updatedOrder.orderNumber}: ${getProviderActionLabel(action)}.`,
        );
      })
      .catch((updateError: unknown) => {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "تعذر تحديث provider handoff لهذا الطلب داخل authority الحالية.",
        );
      })
      .finally(() => {
        setActiveProviderActionKey((currentKey) =>
          currentKey === actionKey ? null : currentKey,
        );
      });
  };

  return (
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsOrders}`}>
      <OpsNav activeHref="/ops/orders" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>إدارة الطلبات</p>
          <h1>راجعي كل طلب، ثم حرّكيه بثقة.</h1>
          <p className={styles.summary}>
            ابحثي بالمرجع أو العميل، راجعي الدفع والشحن، ثم نفّذي الخطوة التالية
            من سجل مركزي يحافظ على حالة الطلب ومسار المتابعة.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>إجمالي الطلبات</p>
            <strong>{isLoading ? "..." : metrics.totalOrders}</strong>
            <span>
              {isLoading
                ? "جاري استعادة queue الداخلية."
                : `إجمالي تقديري ${metrics.totalRevenue} ر.س ومتوسط ${metrics.averageOrderValue} ر.س للطلب.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>نطاق التشغيل</p>
            <h2>سطح داخلي محمي للمراجعة والتنفيذ</h2>
            <p>
              كل إجراء مرتبط بحالة الطلب الحالية. تكاملات الدفع والشحن النهائية
              تبقى ضمن حدود الجاهزية التشغيلية الموضحة داخل كل طلب.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Pending follow-up</p>
          <strong>{metrics.pendingFollowup}</strong>
          <span>طلبات تحتاج متابعة دفع أو تأكيد أولي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Active fulfillment</p>
          <strong>{metrics.activeFulfillment}</strong>
          <span>طلبات دخلت مرحلة التجهيز أو خرجت للتوصيل.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Current filter</p>
          <strong>
            {statusFilter === "all"
              ? "كل الحالات"
              : getOrderStatusMeta(statusFilter).label}
          </strong>
          <span>{filteredOrders.length} طلبًا يطابق البحث الحالي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Manual review</p>
          <strong>{metrics.manualReviewCount}</strong>
          <span>طلبات تحتاج owner handoff تشغيلي قبل اعتماد الشحن أو الدفع.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Split shipment</p>
          <strong>{metrics.splitShipmentCount}</strong>
          <span>طلبات موزعة على أكثر من supplier lane وتحتاج تنسيقًا أوضح.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Payment follow-up</p>
          <strong>{metrics.paymentFollowupCount}</strong>
          <span>طلبات ما زالت تحتاج handoff دفع واضح قبل التقدم في الـ queue.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Provider-ready</p>
          <strong>{metrics.providerReadyCount}</strong>
          <span>طلبات يمكن دفعها مباشرة إلى مسار الشحن الحالي بدون handoff إضافي.</span>
        </article>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Queue</p>
          <h2>قائمة الطلبات التشغيلية</h2>
          <p>
            فلتر الحالة والبحث هنا يسمحان بمراجعة الطلبات الداخلية حسب المرجع أو
            المدينة أو آخر 4 أرقام من الجوال أو اسم المنتج.
          </p>

          <div className={styles.filterBar}>
            <label className={styles.searchField}>
              <span className={styles.fieldLabel}>بحث سريع</span>
              <input
                className={styles.textInput}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="مرجع الطلب أو المدينة أو آخر 4 أرقام"
              />
            </label>

            <div className={styles.filterChipRow}>
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter;
                const label =
                  filter === "all" ? "كل الحالات" : getOrderStatusMeta(filter).label;

                return (
                  <button
                    key={filter}
                    type="button"
                    className={`${styles.filterChip} ${
                      isActive ? styles.filterChipActive : ""
                    }`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    <span>{label}</span>
                    <strong>{statusCounts[filter]}</strong>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <div className={styles.inlineError}>{error}</div> : null}
          {lastUpdate ? <div className={styles.inlineNotice}>{lastUpdate}</div> : null}

          <div className={styles.ordersGrid}>
            {isLoading ? (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Orders</p>
                <h1>جاري تحميل طبقة الطلبات المركزية</h1>
                <p>يتم الآن استعادة الطلبات من authority الداخلية الحالية.</p>
              </article>
            ) : filteredOrders.length ? (
              filteredOrders.map(({ order, authorityPlan, providerHandoff, ownerLane }) => {
                const shippingMethod = getShippingMethodById(order.shippingMethodId);
                const paymentMethod = getPaymentMethodById(order.paymentMethodId);
                const nextStatus = getNextOrderStatus(order);
                const currentStatus = getOrderStatusMeta(order.status);

                return (
                  <article key={order.orderNumber} className={styles.lineItem}>
                    <div className={styles.lineHead}>
                      <div>
                        <h3>{order.orderNumber}</h3>
                        <p className={styles.lineMeta}>
                          {order.customer.fullName} | {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                      <div className={styles.linePrice}>{order.totalEstimate} ر.س</div>
                    </div>

                    <div className={styles.badgeRow}>
                      <span>{currentStatus.label}</span>
                      <span>{`${order.customer.city} / ${order.customer.district}`}</span>
                      <span>{`آخر 4 أرقام: ${getPhoneLastFour(order.customer.phone)}`}</span>
                    </div>

                    <div className={styles.referenceCard}>
                      <div className={styles.referenceRow}>
                        <span>الشحن</span>
                        <strong className={styles.referenceValue}>
                          {shippingMethod?.label ?? order.shippingMethodId}
                        </strong>
                      </div>
                      <div className={styles.referenceRow}>
                        <span>الدفع</span>
                        <strong className={styles.referenceValue}>
                          {paymentMethod?.label ?? order.paymentMethodId}
                        </strong>
                      </div>
                      <div className={styles.referenceRow}>
                        <span>Carrier</span>
                        <strong className={styles.referenceValue}>
                          {authorityPlan.recommendedCarrier}
                        </strong>
                      </div>
                      <div className={styles.referenceRow}>
                        <span>Dispatch window</span>
                        <strong className={styles.referenceValue}>
                          {authorityPlan.estimatedDispatchWindow}
                        </strong>
                      </div>
                    </div>

                    <div className={styles.badgeRow}>
                      {order.lines.map((line) => (
                        <span key={line.key}>{line.productName}</span>
                      ))}
                    </div>

                    <div className={styles.catalogPanelGrid}>
                      <div className={styles.referenceCard}>
                        <strong>Authority handoff</strong>
                        <div className={styles.summaryList}>
                          <div className={styles.referenceRow}>
                            <span>Delivery zone</span>
                            <strong className={styles.referenceValue}>
                              {authorityPlan.deliveryZoneLabel}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Supplier mode</span>
                            <strong className={styles.referenceValue}>
                              {authorityPlan.supplierMode}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Owner lane</span>
                            <strong className={styles.referenceValue}>
                              {ownerLane.label}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Payment authority</span>
                            <strong className={styles.referenceValue}>
                              {authorityPlan.paymentLinkRequired ? "Payment-link route" : "COD-safe route"}
                            </strong>
                          </div>
                        </div>
                        <span className={styles.helperText}>{ownerLane.note}</span>
                      </div>

                      <div className={styles.referenceCard}>
                        <strong>Provider handoff</strong>
                        <div className={styles.summaryList}>
                          <div className={styles.referenceRow}>
                            <span>Payment lane</span>
                            <strong className={styles.referenceValue}>
                              {providerHandoff.paymentLaneLabel}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Shipping lane</span>
                            <strong className={styles.referenceValue}>
                              {providerHandoff.shippingLaneLabel}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Provider state</span>
                            <strong className={styles.referenceValue}>
                              {providerHandoff.providerReadinessLabel}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Payment reference</span>
                            <strong className={styles.referenceValue}>
                              {order.providerBindings.payment.referenceId ?? "pending"}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Shipping reference</span>
                            <strong className={styles.referenceValue}>
                              {order.providerBindings.shipping.bookingReference ?? "pending"}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Tracking</span>
                            <strong className={styles.referenceValue}>
                              {order.providerBindings.shipping.trackingNumber ?? "pending"}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Next owner</span>
                            <strong className={styles.referenceValue}>
                              {providerHandoff.nextOwnerLabel}
                            </strong>
                          </div>
                        </div>
                        <span className={styles.helperText}>{providerHandoff.nextAction}</span>
                      </div>

                      <div className={styles.referenceCard}>
                        <strong>Current blockers</strong>
                        <div className={styles.summaryList}>
                          {providerHandoff.blockers.length ? (
                            providerHandoff.blockers.map((reason) => (
                              <div key={reason} className={styles.infoBullet}>
                                {reason}
                              </div>
                            ))
                          ) : (
                            <div className={styles.infoBullet}>
                              لا توجد blockers تشغيلية إضافية على هذا الطلب داخل authority الحالية.
                            </div>
                          )}
                        </div>
                        <div className={styles.badgeRow}>
                          {authorityPlan.linePlans.map((line) => (
                            <span key={line.key}>
                              {line.supplierName} | {line.routeLabel}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={styles.timelineCompact}>
                      {getOrderTimeline(order).map((step) => (
                        <span
                          key={step.key}
                          className={`${styles.timelineCompactItem} ${
                            step.state === "current"
                              ? styles.timelineCompactCurrent
                              : step.state === "complete"
                                ? styles.timelineCompactComplete
                                : ""
                          }`}
                        >
                          {step.label}
                        </span>
                      ))}
                    </div>

                    <div className={styles.cardActions}>
                      {order.paymentMethodId === "payment_link" &&
                      order.providerBindings.payment.state === "pending" ? (
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={
                            activeProviderActionKey ===
                            `${order.orderNumber}:payment_link_sent`
                          }
                          onClick={() =>
                            handleProviderAction(order, "payment_link_sent")
                          }
                        >
                          {activeProviderActionKey ===
                          `${order.orderNumber}:payment_link_sent`
                            ? "جارٍ تسجيل handoff الدفع..."
                            : "تسجيل إرسال رابط الدفع"}
                        </button>
                      ) : null}

                      {order.paymentMethodId === "payment_link" &&
                      order.providerBindings.payment.state === "link_sent" ? (
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={
                            activeProviderActionKey ===
                            `${order.orderNumber}:payment_confirmed`
                          }
                          onClick={() =>
                            handleProviderAction(order, "payment_confirmed")
                          }
                        >
                          {activeProviderActionKey ===
                          `${order.orderNumber}:payment_confirmed`
                            ? "جارٍ تسجيل callback الدفع..."
                            : "تأكيد الدفع"}
                        </button>
                      ) : null}

                      {order.providerBindings.shipping.state === "pending" &&
                      (order.status === "confirmed" || order.status === "processing") ? (
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={
                            activeProviderActionKey ===
                            `${order.orderNumber}:shipping_booked`
                          }
                          onClick={() =>
                            handleProviderAction(order, "shipping_booked")
                          }
                        >
                          {activeProviderActionKey ===
                          `${order.orderNumber}:shipping_booked`
                            ? "جارٍ تسجيل booking..."
                            : "تسجيل حجز الشحنة"}
                        </button>
                      ) : null}

                      {order.providerBindings.shipping.state === "booked" ? (
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={
                            activeProviderActionKey ===
                            `${order.orderNumber}:shipping_in_transit`
                          }
                          onClick={() =>
                            handleProviderAction(order, "shipping_in_transit")
                          }
                        >
                          {activeProviderActionKey ===
                          `${order.orderNumber}:shipping_in_transit`
                            ? "جارٍ تسجيل callback الشحن..."
                            : "تسجيل خروجها للتوصيل"}
                        </button>
                      ) : null}

                      {nextStatus ? (
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => handleAdvanceStatus(order)}
                        >
                          {`نقل إلى ${getOrderStatusMeta(nextStatus).label}`}
                        </button>
                      ) : (
                        <span className={styles.inlineNotice}>
                          هذا الطلب في آخر حالة متاحة داخل النموذج الحالي.
                        </span>
                      )}

                      <TrackedLink
                        href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
                        className={styles.secondaryLink}
                        analyticsLabel={`ops_track_${order.orderNumber.toLowerCase()}`}
                        analyticsSurface="ops_orders_card"
                        analyticsDestinationType="order_tracking"
                      >
                        فتح صفحة التتبع
                      </TrackedLink>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>No matches</p>
                <h1>لا توجد طلبات تطابق الفلتر الحالي</h1>
                <p>
                  {orders.length
                    ? "غيّر حالة الفلتر أو نص البحث لإظهار الطلبات المتاحة."
                    : "لم يتم إنشاء أي طلب داخل authority الحالية بعد."}
                </p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Ops notes</p>
          <h2>ما الذي تغلقه هذه الطبقة؟</h2>
            <div className={styles.linkList}>
              <div className={styles.infoBullet}>
                تجعل order flow الحالي قابلاً للمراجعة من authority واحدة مع owner lane
                واضح لكل طلب بدل التشتت بين status فقط.
              </div>
              <div className={styles.infoBullet}>
                تربط queue الطلبات بقرارات الشحن والدفع والموردين قبل بناء ownership
                حقيقي للدفع والشحن والإشعارات.
              </div>
              <div className={styles.infoBullet}>
                توضح الفجوة المتبقية: auth حقيقية، database، supplier sync، وOMS
                بدل إخفائها خلف status progression فقط.
              </div>
            </div>

          <div className={styles.actionColumn}>
            <TrackedLink
              href="/checkout"
              className={styles.secondaryLink}
              analyticsLabel="ops_to_checkout"
              analyticsSurface="ops_orders_sidebar"
              analyticsDestinationType="checkout"
            >
              مراجعة checkout الحالي
            </TrackedLink>
            <TrackedLink
              href="/ops/fulfillment"
              className={styles.secondaryLink}
              analyticsLabel="ops_to_fulfillment"
              analyticsSurface="ops_orders_sidebar"
              analyticsDestinationType="ops_fulfillment"
            >
              مراجعة fulfillment الحالي
            </TrackedLink>
            <TrackedLink
              href="/track-order"
              className={styles.secondaryLink}
              analyticsLabel="ops_to_tracking"
              analyticsSurface="ops_orders_sidebar"
              analyticsDestinationType="order_tracking"
            >
              مراجعة التتبع العام
            </TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
