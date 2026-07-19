"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import { getOrderFulfillmentPlan } from "@/lib/fulfillment";
import { fetchOpsOrdersFromAuthority } from "@/lib/order-authority-client";
import { useClientPagination, PaginationControls } from "@/components/ops-pagination-controls";
import { type StoredOrder } from "@/lib/orders";
import styles from "./order-flow.module.css";

type FulfillmentFilter =
  | "all"
  | "manual_review"
  | "cod_blocked"
  | "split_shipment"
  | "express_ready";

const fulfillmentFilters: FulfillmentFilter[] = [
  "all",
  "manual_review",
  "cod_blocked",
  "split_shipment",
  "express_ready",
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

function getFilterLabel(filter: FulfillmentFilter) {
  switch (filter) {
    case "manual_review":
      return "مراجعة يدوية";
    case "cod_blocked":
      return "COD غير متاح";
    case "split_shipment":
      return "شحن منقسم";
    case "express_ready":
      return "جاهز للسريع";
    default:
      return "كل الطلبات";
  }
}

function getOwnerLane(
  order: StoredOrder,
  plan: ReturnType<typeof getOrderFulfillmentPlan>,
) {
  if (plan.requiresManualReview) {
    return {
      label: "Fulfillment review desk",
      note:
        plan.manualReviewReasons[0] ??
        "هذا الطلب يحتاج قرارًا يدويًا قبل تثبيت مسار الشحن أو الدفع.",
    };
  }

  if (plan.paymentLinkRequired && order.status === "payment_pending") {
    return {
      label: "Payment follow-up",
      note: "المطلوب الآن إغلاق handoff الدفع أو إعادة إرساله قبل دفع الطلب إلى التجهيز.",
    };
  }

  if (plan.splitShipment) {
    return {
      label: "Supplier coordination",
      note: "الطلب موزع على أكثر من supplier lane ويحتاج تنسيقًا واضحًا قبل الإغلاق.",
    };
  }

  if (order.status === "confirmed" || order.status === "processing") {
    return {
      label: "Warehouse ops",
      note: "المطلوب الآن تثبيت dispatch window وتنفيذ lane الحالية بدون إعادة فتح القرار.",
    };
  }

  if (order.status === "out_for_delivery") {
    return {
      label: "Delivery trace",
      note: "الطلب خرج للتوصيل، لذلك الأولوية الآن هي تتبع الناقل والتحديثات النهائية.",
    };
  }

  return {
    label: "Customer confirmation",
    note: "الطلب جاهز للانتقال المنضبط إلى الخطوة التالية دون blockers تشغيلية واضحة.",
  };
}

export function OpsFulfillmentSurface() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FulfillmentFilter>("all");
  const [error, setError] = useState<string | null>(null);

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
            : "تعذر تحميل بيانات الطلبات لبناء لوحة fulfillment.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const fulfillmentOrders = useMemo(
    () =>
      orders.map((order) => {
        const plan = getOrderFulfillmentPlan(order);

        return {
          order,
          plan,
          ownerLane: getOwnerLane(order, plan),
        };
      }),
    [orders],
  );

  const metrics = useMemo(() => {
    const manualReviewCount = fulfillmentOrders.filter(
      (item) => item.plan.requiresManualReview,
    ).length;
    const codBlockedCount = fulfillmentOrders.filter(
      (item) => !item.plan.codEligible,
    ).length;
    const splitShipmentCount = fulfillmentOrders.filter(
      (item) => item.plan.splitShipment,
    ).length;
    const expressReadyCount = fulfillmentOrders.filter(
      (item) => item.plan.expressEligible,
    ).length;
    const activeNotifications = fulfillmentOrders.reduce(
      (sum, item) =>
        sum +
        item.plan.notifications.filter((notification) => notification.status === "active")
          .length,
      0,
    );
    const paymentFollowupCount = fulfillmentOrders.filter(
      (item) =>
        item.plan.paymentLinkRequired && item.order.status === "payment_pending",
    ).length;

    return {
      manualReviewCount,
      codBlockedCount,
      splitShipmentCount,
      expressReadyCount,
      activeNotifications,
      paymentFollowupCount,
    };
  }, [fulfillmentOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return fulfillmentOrders.filter(({ order, plan, ownerLane }) => {
      if (filter === "manual_review" && !plan.requiresManualReview) {
        return false;
      }

      if (filter === "cod_blocked" && plan.codEligible) {
        return false;
      }

      if (filter === "split_shipment" && !plan.splitShipment) {
        return false;
      }

      if (filter === "express_ready" && !plan.expressEligible) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        order.orderNumber,
        order.customer.fullName,
        order.customer.city,
        plan.recommendedCarrier,
        plan.supplierMode,
        ownerLane.label,
        ...plan.linePlans.map((line) => line.productName),
        ...plan.linePlans.map((line) => `${line.sku} ${line.supplierName} ${line.routeLabel}`),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filter, fulfillmentOrders, query]);

  const { pagination, paginatedItems, goToPage, changePageSize } =
    useClientPagination(filteredOrders);

  const filterCounts = useMemo(
    () =>
      fulfillmentFilters.reduce<Record<FulfillmentFilter, number>>(
        (accumulator, currentFilter) => {
          accumulator[currentFilter] = fulfillmentOrders.filter(({ plan }) => {
            if (currentFilter === "manual_review") {
              return plan.requiresManualReview;
            }

            if (currentFilter === "cod_blocked") {
              return !plan.codEligible;
            }

            if (currentFilter === "split_shipment") {
              return plan.splitShipment;
            }

            if (currentFilter === "express_ready") {
              return plan.expressEligible;
            }

            return true;
          }).length;

          return accumulator;
        },
        {
          all: 0,
          manual_review: 0,
          cod_blocked: 0,
          split_shipment: 0,
          express_ready: 0,
        },
      ),
    [fulfillmentOrders],
  );

  return (
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsFulfillment}`}>
      <OpsNav activeHref="/ops/fulfillment" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>التجهيز والشحن</p>
          <h1>اعرفي أين يقف كل طلب، ومن يملك الخطوة التالية.</h1>
          <p className={styles.summary}>
            راجعي أهلية الدفع عند الاستلام، الشحنات المنقسمة، الناقل المقترح،
            والحالات التي تحتاج مراجعة يدوية قبل بدء التنفيذ.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>طلبات التنفيذ</p>
            <strong>{isLoading ? "..." : fulfillmentOrders.length}</strong>
            <span>
              قراءة موحدة لمسار الدفع والتجهيز والشحن لكل طلب نشط.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>نطاق التشغيل</p>
            <h2>قرارات تنفيذ واضحة من البيانات الحالية</h2>
            <p>
              يعرض هذا السطح المسار المقترح وحدود التكامل الحالية، مع إبقاء الحالات
              التي تحتاج قرارًا بشريًا ظاهرة قبل أي تنفيذ.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Manual review</p>
          <strong>{metrics.manualReviewCount}</strong>
          <span>طلبات تحتاج قرارًا يدويًا قبل الاعتماد التشغيلي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>COD blocked</p>
          <strong>{metrics.codBlockedCount}</strong>
          <span>طلبات لا يناسبها الدفع عند الاستلام حسب القواعد الحالية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Split shipment</p>
          <strong>{metrics.splitShipmentCount}</strong>
          <span>طلبات تحتاج تنسيقًا بين أكثر من مورد أو مسار شحن.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Express ready</p>
          <strong>{metrics.expressReadyCount}</strong>
          <span>طلبات مؤهلة لمسار أسرع ضمن المدينة ونوع العناصر.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Active notifications</p>
          <strong>{metrics.activeNotifications}</strong>
          <span>تحديثات تشغيلية أصبحت جاهزة للإرسال أو المتابعة الآن.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Payment follow-up</p>
          <strong>{metrics.paymentFollowupCount}</strong>
          <span>طلبات ما زالت تحتاج إغلاق handoff الدفع قبل الانتقال للتجهيز.</span>
        </article>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Routing queue</p>
          <h2>الطلبات بحسب قرار fulfillment</h2>
          <p>
            استخدمي البحث والفلاتر لعزل الطلبات التي تحتاج manual review أو تلك
            التي أصبحت جاهزة لمسار سريع.
          </p>

          <div className={styles.filterBar}>
            <label className={styles.searchField}>
              <span className={styles.fieldLabel}>بحث سريع</span>
              <input
                className={styles.textInput}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="مرجع الطلب أو المدينة أو SKU"
              />
            </label>

            <div className={styles.filterChipRow}>
              {fulfillmentFilters.map((currentFilter) => {
                const isActive = filter === currentFilter;

                return (
                  <button
                    key={currentFilter}
                    type="button"
                    className={`${styles.filterChip} ${
                      isActive ? styles.filterChipActive : ""
                    }`}
                    onClick={() => setFilter(currentFilter)}
                  >
                    <span>{getFilterLabel(currentFilter)}</span>
                    <strong>{filterCounts[currentFilter]}</strong>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <PaginationControls
            pagination={pagination}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          />

          <div className={styles.ordersGrid}>
            {isLoading ? (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Fulfillment</p>
                <h1>جاري تحميل قرارات التشغيل الحالية</h1>
                <p>يتم الآن استعادة الطلبات من authority الحالية وتحويلها إلى queue قابلة للمراجعة.</p>
              </article>
            ) : paginatedItems.length ? (
              paginatedItems.map(({ order, plan, ownerLane }) => (
                <article key={order.orderNumber} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{order.orderNumber}</h3>
                      <p className={styles.lineMeta}>
                        {order.customer.fullName} | {order.customer.city} | {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <div className={styles.linePrice}>{order.totalEstimate} ر.س</div>
                  </div>

                  <div className={styles.badgeRow}>
                    <span>{plan.deliveryZoneLabel}</span>
                    <span>{plan.recommendedCarrier}</span>
                    <span>{plan.splitShipment ? "Split shipment" : "Single route"}</span>
                    <span>{plan.codEligible ? "COD yes" : "COD no"}</span>
                  </div>

                  {plan.requiresManualReview ? (
                    <div className={styles.inlineError}>
                      {plan.manualReviewReasons.join(" ")}
                    </div>
                  ) : (
                    <div className={styles.inlineNotice}>
                      لا توجد مراجعة يدوية إضافية مطلوبة لهذا الطلب داخل النموذج الحالي.
                    </div>
                  )}

                  <div className={styles.catalogPanelGrid}>
                    <div className={styles.referenceCard}>
                      <strong>Authority handoff</strong>
                      <div className={styles.summaryList}>
                        <div className={styles.referenceRow}>
                          <span>Delivery zone</span>
                          <strong className={styles.referenceValue}>{plan.deliveryZoneLabel}</strong>
                        </div>
                        <div className={styles.referenceRow}>
                          <span>Supplier mode</span>
                          <strong className={styles.referenceValue}>{plan.supplierMode}</strong>
                        </div>
                        <div className={styles.referenceRow}>
                          <span>Owner lane</span>
                          <strong className={styles.referenceValue}>{ownerLane.label}</strong>
                        </div>
                        <div className={styles.referenceRow}>
                          <span>Payment authority</span>
                          <strong className={styles.referenceValue}>
                            {plan.paymentLinkRequired ? "Payment-link route" : "COD-safe route"}
                          </strong>
                        </div>
                      </div>
                      <span className={styles.helperText}>{ownerLane.note}</span>
                    </div>

                    <div className={styles.referenceCard}>
                      <strong>Dispatch contract</strong>
                      <div className={styles.summaryList}>
                        <div className={styles.referenceRow}>
                          <span>Carrier</span>
                          <strong className={styles.referenceValue}>{plan.recommendedCarrier}</strong>
                        </div>
                        <div className={styles.referenceRow}>
                          <span>Window</span>
                          <strong className={styles.referenceValue}>{plan.estimatedDispatchWindow}</strong>
                        </div>
                        <div className={styles.referenceRow}>
                          <span>Split shipment</span>
                          <strong className={styles.referenceValue}>
                            {plan.splitShipment ? "Required" : "No"}
                          </strong>
                        </div>
                        <div className={styles.referenceRow}>
                          <span>Express mode</span>
                          <strong className={styles.referenceValue}>
                            {plan.expressEligible ? "Eligible" : "Standard"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className={styles.referenceCard}>
                      <strong>Line routing</strong>
                      <div className={styles.summaryList}>
                        {plan.linePlans.map((line) => (
                          <div key={line.key} className={styles.referenceCard}>
                            <div className={styles.referenceRow}>
                              <span>{line.productName}</span>
                              <strong className={styles.referenceValue}>{line.sku}</strong>
                            </div>
                            <div className={styles.badgeRow}>
                              <span>{line.supplierName}</span>
                              <span>{line.routeLabel}</span>
                              <span>{line.availability}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.referenceCard}>
                      <strong>Notification plan</strong>
                      <div className={styles.summaryList}>
                        {plan.notifications.map((notification) => (
                          <div key={notification.key} className={styles.referenceCard}>
                            <div className={styles.referenceRow}>
                              <span>{notification.label}</span>
                              <strong className={styles.referenceValue}>{notification.status}</strong>
                            </div>
                            <p>{notification.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <TrackedLink
                      href="/ops/orders"
                      className={styles.secondaryLink}
                      analyticsLabel="ops_fulfillment_to_orders"
                      analyticsSurface="ops_fulfillment_card"
                      analyticsDestinationType="ops_orders"
                    >
                      فتح لوحة الطلبات
                    </TrackedLink>
                    <TrackedLink
                      href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
                      className={styles.secondaryLink}
                      analyticsLabel={`ops_fulfillment_track_${order.orderNumber.toLowerCase()}`}
                      analyticsSurface="ops_fulfillment_card"
                      analyticsDestinationType="order_tracking"
                    >
                      فتح التتبع العام
                    </TrackedLink>
                  </div>
                </article>
              ))
            ) : (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>No matches</p>
                <h1>لا توجد طلبات تطابق الفلتر الحالي</h1>
                <p>
                  غيّري الفلتر أو نص البحث، أو ابدئي أول checkout حتى تظهر queue
                  fulfillment الكاملة.
                </p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Ops links</p>
          <h2>الأسطح المتصلة</h2>

          <div className={styles.linkList}>
            <div className={styles.infoBullet}>
              surface الـ fulfillment لم تعد carrier/status فقط؛ أصبحت تعرض owner lane
              وpayment authority وdispatch contract لكل طلب.
            </div>
            <TrackedLink
              href="/ops"
              analyticsLabel="ops_fulfillment_to_dashboard"
              analyticsSurface="ops_fulfillment_sidebar"
              analyticsDestinationType="ops_dashboard"
            >
              <span>العودة إلى dashboard</span>
              <span>KPI + sync overview</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/orders"
              analyticsLabel="ops_fulfillment_to_orders_sidebar"
              analyticsSurface="ops_fulfillment_sidebar"
              analyticsDestinationType="ops_orders"
            >
              <span>إدارة الطلبات</span>
              <span>Status progression</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/notifications"
              analyticsLabel="ops_fulfillment_to_notifications"
              analyticsSurface="ops_fulfillment_sidebar"
              analyticsDestinationType="ops_notifications"
            >
              <span>طابور الإشعارات</span>
              <span>Queue + delivery state</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/catalog"
              analyticsLabel="ops_fulfillment_to_catalog"
              analyticsSurface="ops_fulfillment_sidebar"
              analyticsDestinationType="ops_catalog"
            >
              <span>إدارة الكتالوج</span>
              <span>Supplier + stock + margin</span>
            </TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
