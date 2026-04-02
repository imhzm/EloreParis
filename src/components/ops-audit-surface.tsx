"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import { fetchOpsAuditEntries } from "@/lib/ops-control-client";
import type { OpsAuditAction, OpsAuditEntry } from "@/lib/ops-types";
import styles from "./order-flow.module.css";

type AuditFilter = OpsAuditAction | "all";

const auditFilters: AuditFilter[] = [
  "all",
  "ops_login_success",
  "ops_login_failure",
  "ops_login_rate_limited",
  "ops_logout",
  "ops_order_status_update",
  "ops_notification_status_update",
];

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

function getAuditActionLabel(action: OpsAuditAction) {
  switch (action) {
    case "ops_login_success":
      return "نجاح تسجيل الدخول";
    case "ops_login_failure":
      return "فشل تسجيل الدخول";
    case "ops_login_rate_limited":
      return "تقييد دخول التشغيل";
    case "ops_logout":
      return "إنهاء الجلسة";
    case "ops_order_status_update":
      return "تحديث حالة طلب";
    case "ops_notification_status_update":
      return "تحديث حالة إشعار";
  }
}

export function OpsAuditSurface() {
  const [auditEntries, setAuditEntries] = useState<OpsAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AuditFilter>("all");

  useEffect(() => {
    void fetchOpsAuditEntries()
      .then(({ auditEntries: nextEntries }) => {
        setAuditEntries(nextEntries);
        setError(null);
      })
      .catch((loadError: unknown) => {
        setAuditEntries([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل سجل المراجعة الحالي.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredEntries = useMemo(
    () =>
      auditEntries.filter((entry) =>
        filter === "all" ? true : entry.action === filter,
      ),
    [auditEntries, filter],
  );

  const metrics = useMemo(
    () => ({
      total: auditEntries.length,
      statusUpdates: auditEntries.filter(
        (entry) => entry.action === "ops_order_status_update",
      ).length,
      notificationUpdates: auditEntries.filter(
        (entry) => entry.action === "ops_notification_status_update",
      ).length,
      loginEvents: auditEntries.filter(
        (entry) =>
          entry.action === "ops_login_success" ||
          entry.action === "ops_login_failure" ||
          entry.action === "ops_login_rate_limited",
      ).length,
    }),
    [auditEntries],
  );

  return (
    <div className={styles.page}>
      <OpsNav activeHref="/ops/audit" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Internal audit</p>
          <h1>سجل مراجعة صريح لجلسات التشغيل والإجراءات الحساسة داخل `/ops`.</h1>
          <p className={styles.summary}>
            هذه الصفحة لا تدّعي SIEM أو backoffice نهائي، لكنها تثبت trace واضح
            لجلسات الدخول والخروج وتحديثات حالات الطلبات قبل الانتقال إلى RBAC
            ومخزن سجلات تشغيلي فعلي.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Total entries</p>
            <strong>{isLoading ? "..." : metrics.total}</strong>
            <span>
              {isLoading
                ? "جارٍ تحميل سجل المراجعة."
                : `${metrics.loginEvents} أحداث جلسات و${metrics.statusUpdates} تحديثات طلب و${metrics.notificationUpdates} تحديثات إشعار مسجلة.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Scope</p>
            <h2>ops sessions + order transitions</h2>
            <p>
              الطبقة الحالية تركز على traceability التشغيلي داخل التطبيق نفسه،
              وليست على compliance archive خارجي أو immutable logs بعد.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Audit stream</p>
          <h2>السجل الحالي</h2>

          <div className={styles.filterChipRow}>
            {auditFilters.map((candidate) => {
              const isActive = filter === candidate;
              const label =
                candidate === "all"
                  ? "كل الأحداث"
                  : getAuditActionLabel(candidate);

              return (
                <button
                  key={candidate}
                  type="button"
                  className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ""}`}
                  onClick={() => setFilter(candidate)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <div className={styles.ordersGrid}>
            {isLoading ? (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Audit</p>
                <h1>جارٍ تحميل سجل المراجعة</h1>
                <p>يتم الآن استعادة أحدث الأحداث من authority المخصصة للمراجعة.</p>
              </article>
            ) : filteredEntries.length ? (
              filteredEntries.map((entry) => (
                <article key={entry.id} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{getAuditActionLabel(entry.action)}</h3>
                      <p className={styles.lineMeta}>{formatTimestamp(entry.createdAt)}</p>
                    </div>
                    <div className={styles.linePrice}>{entry.entityId}</div>
                  </div>

                  <div className={styles.badgeRow}>
                    <span>{entry.actor.name}</span>
                    <span>{entry.actor.role}</span>
                    <span>{entry.entityType}</span>
                  </div>

                  <p>{entry.summary}</p>

                  <div className={styles.referenceCard}>
                    {Object.entries(entry.metadata).map(([key, value]) => (
                      <div key={key} className={styles.referenceRow}>
                        <span>{key}</span>
                        <strong className={styles.referenceValue}>{String(value)}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>No audit entries</p>
                <h1>لا توجد أحداث تطابق الفلتر الحالي</h1>
                <p>سيتوسع هذا السجل مع المزيد من جلسات ops وتحديثات الطلبات.</p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Related ops paths</p>
          <h2>المسارات المرتبطة بالسجل</h2>
          <div className={styles.linkList}>
            <TrackedLink
              href="/ops/orders"
              analyticsLabel="ops_audit_to_orders"
              analyticsSurface="ops_audit_links"
              analyticsDestinationType="ops_orders"
            >
              <span>طابور الطلبات</span>
              <span>Order state flow</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/fulfillment"
              analyticsLabel="ops_audit_to_fulfillment"
              analyticsSurface="ops_audit_links"
              analyticsDestinationType="ops_fulfillment"
            >
              <span>لوحة fulfillment</span>
              <span>Routing + notifications</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/notifications"
              analyticsLabel="ops_audit_to_notifications"
              analyticsSurface="ops_audit_links"
              analyticsDestinationType="ops_notifications"
            >
              <span>طابور الإشعارات</span>
              <span>Delivery trace</span>
            </TrackedLink>
            <TrackedLink
              href="/ops"
              analyticsLabel="ops_audit_to_dashboard"
              analyticsSurface="ops_audit_links"
              analyticsDestinationType="ops_dashboard"
            >
              <span>العودة إلى dashboard</span>
              <span>KPIs + watchpoints</span>
            </TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
