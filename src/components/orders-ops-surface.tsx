"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import {
  advanceOpsOrderFromAuthority,
  fetchOpsOrdersFromAuthority,
} from "@/lib/order-authority-client";
import {
  getNextOrderStatus,
  getOrderStatusMeta,
  getOrderTimeline,
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

export function OrdersOpsSurface() {
  const pathname = usePathname() ?? "/ops/orders";
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

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

    return {
      totalOrders,
      totalRevenue,
      pendingFollowup,
      activeFulfillment,
      averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return orders.filter((order) => {
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
        ...order.lines.map((line) => line.productName),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [orders, query, statusFilter]);

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

  return (
    <div className={styles.page}>
      <OpsNav activeHref="/ops/orders" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Internal order ops</p>
          <h1>لوحة تشغيلية مركزية لمراجعة الطلبات وتحريك حالتها.</h1>
          <p className={styles.summary}>
            هذه الصفحة لم تعد تقرأ من متصفح منفصل. الطلبات هنا تأتي من authority
            داخلية واحدة، حتى يصبح status flow قابلاً للمراجعة والتوسعة قبل ربط
            OMS أو backend orders نهائية.
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
            <p className={styles.eyebrow}>Operational scope</p>
            <h2>authority داخلية + gate + noindex</h2>
            <p>
              هذه الصفحة داخلية ومحمية، لكنها ليست OMS production بعد. الهدف هنا
              تثبيت queue حقيقية ومسار حالات واضح قبل الدفع والشحن والإشعارات
              النهائية.
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
              filteredOrders.map((order) => {
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
                    </div>

                    <div className={styles.badgeRow}>
                      {order.lines.map((line) => (
                        <span key={line.key}>{line.productName}</span>
                      ))}
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
              تجعل order flow الحالي قابلاً للمراجعة من authority واحدة بدل
              التشتت بين متصفحات متعددة.
            </div>
            <div className={styles.infoBullet}>
              تختبر تسلسل الحالات قبل بناء ownership حقيقي للدفع والشحن
              والإشعارات.
            </div>
            <div className={styles.infoBullet}>
              توضح الفجوة المتبقية: auth حقيقية، database، supplier sync، وOMS.
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
