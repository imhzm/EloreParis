"use client";

import { useEffect, useMemo, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { OpsNav } from "@/components/ops-nav";
import { getContentGovernanceSummary } from "@/lib/content-governance";
import {
  getOpsDashboardSnapshot,
  getSupplierSyncLogs,
} from "@/lib/ops-catalog";
import { fetchOpsOrdersFromAuthority } from "@/lib/order-authority-client";
import { type StoredOrder } from "@/lib/orders";
import styles from "./order-flow.module.css";

function formatCurrency(value: number) {
  return `${value} ر.س`;
}

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function OpsDashboardSurface() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
            : "تعذر تحميل الطلبات لبناء dashboard التشغيلية.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const snapshot = useMemo(() => getOpsDashboardSnapshot(orders), [orders]);
  const contentSummary = getContentGovernanceSummary();
  const syncLogs = getSupplierSyncLogs();

  return (
    <div className={styles.page}>
      <OpsNav activeHref="/ops" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Internal ops dashboard</p>
          <h1>غرفة قيادة تشغيلية تمهّد الـ admin الحقيقي بدل تركه قرارًا مؤجلًا.</h1>
          <p className={styles.summary}>
            هذه الصفحة تحول طبقة الطلبات الحالية إلى dashboard قابلة للاستخدام:
            مبيعات، طلبات معلقة، مدن أعلى طلبًا، low stock، واستثناءات الموردين،
            حتى يكون قرار الـ backend وownership التشغيلي مبنيًا على surface
            واضحة.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Current scope</p>
            <strong>{isLoading ? "..." : snapshot.orderCount}</strong>
            <span>
              {isLoading
                ? "جاري تحميل الطلبات والبيانات التشغيلية."
                : `طلبات من authority داخلية عبر ${snapshot.catalogCoverage.stockedProducts} منتجات نشطة و${snapshot.catalogCoverage.variants} variants تشغيلية.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Boundary note</p>
            <h2>Dashboard داخلية + noindex + gate</h2>
            <p>
              هذه طبقة تشغيلية rehearsal وليست backoffice production. الهدف هنا
              تثبيت الشكل والمنطق والـ KPIs قبل ربط auth/accounts وbackend orders
              والموردين الفعليين.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>مبيعات اليوم</p>
          <strong>{formatCurrency(snapshot.todaySales)}</strong>
          <span>إجمالي الطلبات المسجلة اليوم داخل authority الحالية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>مبيعات الشهر</p>
          <strong>{formatCurrency(snapshot.monthSales)}</strong>
          <span>المجموع الشهري الحالي من الطلبات المتاحة.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>متوسط السلة</p>
          <strong>{formatCurrency(snapshot.averageOrderValue)}</strong>
          <span>AOV محسوب من authority الحالية فقط.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>الطلبات المعلقة</p>
          <strong>{snapshot.pendingOrders}</strong>
          <span>طلبات ما زالت تحتاج متابعة دفع أو تأكيد أولي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>المنتجات منخفضة المخزون</p>
          <strong>{snapshot.lowStockCount}</strong>
          <span>variants عند أو دون حد low stock الحالي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Repeat customers</p>
          <strong>{snapshot.repeatCustomerCount}</strong>
          <span>عملاء تكرر منهم الشراء داخل البيانات الحالية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Content freeze</p>
          <strong>{contentSummary.launchBlocked}</strong>
          <span>
            Public content groups are now owner-mapped, but still blocked from final
            launch polish until real samples and approved business inputs arrive.
          </span>
        </article>
      </section>

      <section className={styles.layout}>
        <div className={styles.summaryList}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Top products</p>
            <h2>الأعلى بيعًا</h2>
            <div className={styles.ordersGrid}>
              {snapshot.topProducts.length ? (
                snapshot.topProducts.map((product) => (
                  <article key={product.slug} className={styles.lineItem}>
                    <div className={styles.lineHead}>
                      <div>
                        <h3>{product.name}</h3>
                        <p className={styles.lineMeta}>{product.collectionTitle}</p>
                      </div>
                      <div className={styles.linePrice}>{product.quantity} قطعة</div>
                    </div>
                    <div className={styles.badgeRow}>
                      <span>Revenue: {formatCurrency(product.revenue)}</span>
                      <span>Slug: {product.slug}</span>
                    </div>
                  </article>
                ))
              ) : (
                <article className={styles.emptyCard}>
                  <p className={styles.eyebrow}>Sales</p>
                  <h1>لا توجد طلبات كافية بعد</h1>
                  <p>ستظهر المنتجات الأعلى بيعًا هنا بمجرد تراكم الطلبات داخل authority الحالية.</p>
                </article>
              )}
            </div>
          </article>

          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Demand map</p>
            <h2>أعلى المدن وأفضل الفئات</h2>
            <div className={styles.catalogPanelGrid}>
              <div className={styles.referenceCard}>
                <strong>Top cities</strong>
                <div className={styles.summaryList}>
                  {snapshot.topCities.length ? (
                    snapshot.topCities.map((city) => (
                      <div key={city.city} className={styles.referenceRow}>
                        <span>{city.city}</span>
                        <strong className={styles.referenceValue}>{city.count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className={styles.helperText}>ستظهر خريطة المدن هنا بعد أولى الطلبات الفعلية.</p>
                  )}
                </div>
              </div>

              <div className={styles.referenceCard}>
                <strong>Top collections</strong>
                <div className={styles.summaryList}>
                  {snapshot.topCollections.length ? (
                    snapshot.topCollections.map((collection) => (
                      <div key={collection.collection} className={styles.referenceRow}>
                        <span>{collection.title}</span>
                        <strong className={styles.referenceValue}>{collection.count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className={styles.helperText}>أفضل الفئات ستظهر عندما تتراكم بيانات الطلبات.</p>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Low stock</p>
            <h2>الاستثناءات العاجلة</h2>
            <div className={styles.summaryList}>
              {snapshot.lowStock.length ? (
                snapshot.lowStock.map((variant) => (
                  <div key={`${variant.productSlug}-${variant.sku}`} className={styles.infoBullet}>
                    <strong>{variant.productName}</strong>
                    <br />
                    {variant.sku} | المخزون {variant.stockOnHand} / الحد {variant.lowStockThreshold}
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>لا توجد variants منخفضة المخزون حاليًا.</div>
              )}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Supplier queue</p>
            <h2>ملاحظات الموردين والـ sync</h2>
            <div className={styles.summaryList}>
              {snapshot.supplierExceptions.length ? (
                snapshot.supplierExceptions.slice(0, 4).map((exception) => (
                  <div key={exception.id} className={styles.infoBullet}>
                    <strong>{exception.title}</strong>
                    <br />
                    {exception.note}
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>لا توجد استثناءات supplier بارزة حاليًا.</div>
              )}
            </div>
            <div className={styles.summaryList}>
              {syncLogs.map((log) => (
                <div key={log.id} className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>{log.area}</span>
                    <strong className={styles.referenceValue}>{log.status}</strong>
                  </div>
                  <p>{log.note}</p>
                  <span className={styles.helperText}>{formatTimestamp(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Ops surfaces</p>
            <h2>الخطوات التالية داخل التشغيل</h2>
            {error ? <div className={styles.inlineError}>{error}</div> : null}
            <div className={styles.linkList}>
              <TrackedLink
                href="/ops/orders"
                analyticsLabel="ops_dashboard_to_orders"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_orders"
              >
                <span>إدارة الطلبات</span>
                <span>Queue + status flow</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/catalog"
                analyticsLabel="ops_dashboard_to_catalog"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_catalog"
              >
                <span>إدارة الكتالوج</span>
                <span>Stock + SEO + supplier map</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/content"
                analyticsLabel="ops_dashboard_to_content"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_content"
              >
                <span>Content governance</span>
                <span>Owners + sample freeze</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/release"
                analyticsLabel="ops_dashboard_to_release"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_release"
              >
                <span>Release readiness</span>
                <span>Live blockers + launch gates</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/fulfillment"
                analyticsLabel="ops_dashboard_to_fulfillment"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_fulfillment"
              >
                <span>إدارة fulfillment</span>
                <span>Routing + notifications</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/notifications"
                analyticsLabel="ops_dashboard_to_notifications"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_notifications"
              >
                <span>إدارة الإشعارات</span>
                <span>Queue + delivery trace</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/audit"
                analyticsLabel="ops_dashboard_to_audit"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_audit"
              >
                <span>سجل المراجعة</span>
                <span>Sessions + status changes</span>
              </TrackedLink>
              <TrackedLink
                href="/track-order"
                analyticsLabel="ops_dashboard_to_tracking"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="order_tracking"
              >
                <span>تتبع الطلب العام</span>
                <span>Customer-facing</span>
              </TrackedLink>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
