import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { OpsNav } from "@/components/ops-nav";
import styles from "@/components/ops-analytics.module.css";
import { StorefrontShell } from "@/components/storefront-shell";
import { DownloadCsvButton } from "@/components/ops-download-csv";
import {
  getOpsAnalyticsSnapshot,
  normalizeOpsAnalyticsPeriod,
  type OpsAnalyticsComparison,
} from "@/lib/ops-analytics";
import { readAuthorityOrders } from "@/lib/order-authority";

export const metadata: Metadata = {
  title: "التحليلات التشغيلية",
  description:
    "تحليلات محمية للطلبات والمدفوعات المؤكدة داخل ÉLORÉ PARIS.",
  robots: { index: false, follow: false },
};

type OpsAnalyticsPageProps = {
  searchParams: Promise<{ period?: string | string[] }>;
};

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 2,
});

function formatPercent(value: number) {
  return `${value.toLocaleString("ar-SA", { maximumFractionDigits: 1 })}٪`;
}

function ComparisonBadge({ comparison }: { comparison: OpsAnalyticsComparison }) {
  if (comparison.changePercent === null) {
    return <span className={styles.comparisonFlat}>—</span>;
  }
  const isUp = comparison.direction === "up";
  const isDown = comparison.direction === "down";
  const cls = isUp ? styles.comparisonUp : isDown ? styles.comparisonDown : styles.comparisonFlat;
  const arrow = isUp ? "▲" : isDown ? "▼" : "—";
  return (
    <span className={cls}>
      {arrow} {isUp ? "+" : ""}{formatPercent(comparison.changePercent)}
    </span>
  );
}

export default async function OpsAnalyticsPage({
  searchParams,
}: OpsAnalyticsPageProps) {
  const parameters = await searchParams;
  const rawPeriod = Array.isArray(parameters.period)
    ? parameters.period[0]
    : parameters.period;
  const period = normalizeOpsAnalyticsPeriod(rawPeriod);
  const snapshot = getOpsAnalyticsSnapshot(
    await readAuthorityOrders(),
    period,
  );

  const metricEntries: Array<{
    label: string;
    value: string;
    comparison: OpsAnalyticsComparison | null;
    note: string;
  }> = [
    {
      label: "قيمة الطلبات المسجلة",
      value: currencyFormatter.format(snapshot.recordedValue),
      comparison: snapshot.comparison.recordedValue,
      note: "",
    },
    {
      label: "مدفوعات مؤكدة",
      value: currencyFormatter.format(snapshot.confirmedPaymentValue),
      comparison: null,
      note: "وفق حالة مزود الدفع فقط",
    },
    {
      label: "عدد الطلبات",
      value: snapshot.orderCount.toLocaleString("ar-SA"),
      comparison: snapshot.comparison.orderCount,
      note: `خلال آخر ${snapshot.rangeDays.toLocaleString("ar-SA")} يومًا`,
    },
    {
      label: "متوسط قيمة الطلب",
      value: currencyFormatter.format(snapshot.averageOrderValue),
      comparison: snapshot.comparison.averageOrderValue,
      note: "مجموع القيمة / عدد الطلبات",
    },
    {
      label: "معدل الإلغاء",
      value: formatPercent(snapshot.cancellationRate),
      comparison: snapshot.comparison.cancellationRate,
      note: "من طلبات الفترة المختارة",
    },
    {
      label: "عملاء متكررون بالفترة",
      value: snapshot.repeatCustomerCount.toLocaleString("ar-SA"),
      comparison: null,
      note: "عميل يملك أكثر من طلب في نفس الفترة",
    },
  ];

  return (
    <StorefrontShell activeHref="/ops/analytics">
      <OpsNav activeHref="/ops/analytics" />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span>OPERATIONS ANALYTICS</span>
            <h1>التحليلات</h1>
            <p>
              مؤشرات قابلة للتدقيق من Order Authority، مع إبقاء الطلبات
              المسجلة منفصلة عن المدفوعات المؤكدة.
            </p>
          </div>
          <div className={styles.heroActions}>
            <form action="/ops/analytics" method="get" className={styles.periodForm}>
              <label htmlFor="analytics-period">الفترة</label>
              <select id="analytics-period" name="period" defaultValue={period}>
                <option value="7">آخر 7 أيام</option>
                <option value="30">آخر 30 يومًا</option>
                <option value="90">آخر 90 يومًا</option>
              </select>
              <button type="submit">تحديث</button>
            </form>
            <DownloadCsvButton
              filename={`elore-analytics-${period}-day.csv`}
              rows={[
                { metric: "قيمة الطلبات المسجلة", value: snapshot.recordedValue },
                { metric: "مدفوعات مؤكدة", value: snapshot.confirmedPaymentValue },
                { metric: "عدد الطلبات", value: snapshot.orderCount },
                { metric: "متوسط قيمة الطلب", value: snapshot.averageOrderValue },
                { metric: "معدل الإلغاء", value: `${snapshot.cancellationRate}%` },
                { metric: "عملاء متكررون بالفترة", value: snapshot.repeatCustomerCount },
                ...snapshot.statuses.map((s) => ({ metric: `حالة: ${s.label}`, orders: s.orderCount, value: s.recordedValue })),
                ...snapshot.cities.map((c) => ({ metric: `مدينة: ${c.label}`, orders: c.orderCount, value: c.recordedValue })),
                ...snapshot.products.map((p) => ({ metric: `منتج: ${p.label}`, units: p.units, value: p.recordedValue })),
                ...snapshot.points.map((p) => ({ metric: `اليوم: ${p.label}`, value: p.recordedValue })),
              ]}
              label="تصدير CSV"
            />
          </div>
        </header>

        <section className={styles.metrics} aria-label="المؤشرات الرئيسية">
          {metricEntries.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.comparison ? <ComparisonBadge comparison={metric.comparison} /> : null}
              {metric.note ? <p>{metric.note}</p> : null}
            </article>
          ))}
        </section>

        <section className={styles.trendCard}>
          <div className={styles.cardHeading}>
            <div>
              <span>TREND</span>
              <h2>حركة القيم عبر الفترة</h2>
            </div>
            <p>الأعمدة الغامقة تعرض قيمة الطلبات المسجلة، والذهبية تعرض المدفوعات المؤكدة.</p>
          </div>
          {snapshot.orderCount > 0 ? (
            <div className={styles.chart} role="img" aria-label="رسم قيمة الطلبات والمدفوعات المؤكدة عبر الفترة">
              {snapshot.points.map((point, index) => {
                const recordedHeight = snapshot.maxPointValue
                  ? Math.max(4, (point.recordedValue / snapshot.maxPointValue) * 100)
                  : 0;
                const confirmedPoint = snapshot.confirmedPoints[index];
                const confirmedHeight = confirmedPoint && snapshot.maxPointValue
                  ? Math.max(2, (confirmedPoint.recordedValue / snapshot.maxPointValue) * 100)
                  : 0;
                return (
                  <div className={styles.chartPoint} key={point.key}>
                    <span>{currencyFormatter.format(point.recordedValue)}</span>
                    <div className={styles.barTrackDual}>
                      <i className={styles.barPrimary} style={{ "--bar-height": `${recordedHeight}%` } as CSSProperties} />
                      {confirmedHeight > 0 ? (
                        <i className={styles.barSecondary} style={{ "--bar-height": `${confirmedHeight}%` } as CSSProperties} />
                      ) : null}
                    </div>
                    <small>{point.label}</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>لا توجد طلبات داخل الفترة المختارة.</div>
          )}
        </section>

        <section className={styles.comparisonCard}>
          <div className={styles.cardHeading}>
            <div>
              <span>COMPARISON</span>
              <h2>مقارنة بالفترة السابقة</h2>
            </div>
            <p>يقارن الفترة الحالية بالفترة المماثلة التي سبقتها.</p>
          </div>
          <div className={styles.comparisonGrid}>
            {Object.entries(snapshot.comparison).map(([key, comp]) => (
              <div key={key} className={styles.comparisonRow}>
                <span className={styles.comparisonLabel}>
                  {key === "recordedValue" ? "قيمة الطلبات" :
                   key === "orderCount" ? "عدد الطلبات" :
                   key === "averageOrderValue" ? "متوسط القيمة" :
                   key === "cancellationRate" ? "معدل الإلغاء" : key}
                </span>
                <div className={styles.comparisonValues}>
                  <span>
                    <small>الحالية</small>
                    <strong>{key === "cancellationRate" ? formatPercent(comp.currentValue) : currencyFormatter.format(comp.currentValue)}</strong>
                  </span>
                  <span>
                    <small>السابقة</small>
                    <strong>{key === "cancellationRate" ? formatPercent(comp.previousValue) : currencyFormatter.format(comp.previousValue)}</strong>
                  </span>
                  <ComparisonBadge comparison={comp} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.insightsGrid}>
          <article className={styles.listCard}>
            <div className={styles.cardHeading}>
              <div><span>STATUS</span><h2>حالات الطلبات</h2></div>
            </div>
            <ul>
              {snapshot.statuses.map((status) => (
                <li key={status.key}>
                  <div><strong>{status.label}</strong><span>{currencyFormatter.format(status.recordedValue)}</span></div>
                  <div className={styles.progress}><i style={{ inlineSize: `${status.share}%` }} /></div>
                  <b>{status.orderCount.toLocaleString("ar-SA")}</b>
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.listCard}>
            <div className={styles.cardHeading}>
              <div><span>MARKETS</span><h2>أعلى المدن</h2></div>
            </div>
            <ol>
              {snapshot.cities.map((city) => (
                <li key={city.key}>
                  <strong>{city.label}</strong>
                  <span>{city.orderCount.toLocaleString("ar-SA")} طلب</span>
                  <b>{currencyFormatter.format(city.recordedValue)}</b>
                </li>
              ))}
            </ol>
          </article>

          <article className={styles.listCard}>
            <div className={styles.cardHeading}>
              <div><span>PRODUCTS</span><h2>المنتجات الأكثر طلبًا</h2></div>
            </div>
            <ol>
              {snapshot.products.map((product) => (
                <li key={product.key}>
                  <strong>{product.label}</strong>
                  <span>{product.units.toLocaleString("ar-SA")} وحدة</span>
                  <b>{currencyFormatter.format(product.recordedValue)}</b>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <aside className={styles.truthNote}>
          <strong>قاعدة قراءة الأرقام</strong>
          <p>
            قيمة الطلبات المسجلة تشمل كل الطلبات المنشأة في الفترة، بينما
            «مدفوعات مؤكدة» لا تشمل إلا الطلبات التي تحمل تأكيدًا صريحًا من
            Payment Binding. لا تُعرض أي قيمة على أنها إيراد محصل دون هذا الدليل.
          </p>
        </aside>
      </div>
    </StorefrontShell>
  );
}
