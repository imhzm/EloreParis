"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import { fetchOpsAuditEntries } from "@/lib/ops-control-client";
import { useClientPagination, PaginationControls } from "@/components/ops-pagination-controls";
import { DownloadCsvButton } from "@/components/ops-download-csv";
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
  "ops_order_provider_update",
  "ops_notification_status_update",
  "ops_release_evidence_publish",
  "ops_release_package_publish",
  "ops_release_handoff_publish",
  "ops_release_decision_publish",
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
      return "Ops login success";
    case "ops_login_failure":
      return "Ops login failure";
    case "ops_login_rate_limited":
      return "Ops login throttled";
    case "ops_logout":
      return "Ops logout";
    case "ops_order_status_update":
      return "Order status updated";
    case "ops_order_provider_update":
      return "Order provider updated";
    case "ops_notification_status_update":
      return "Notification status updated";
    case "ops_release_evidence_publish":
      return "Release evidence published";
    case "ops_release_package_publish":
      return "Release package published";
    case "ops_release_handoff_publish":
      return "Release handoff published";
    case "ops_release_decision_publish":
      return "Release decision published";
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
            : "Unable to load the internal audit stream.",
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

  const { pagination, paginatedItems, goToPage, changePageSize } =
    useClientPagination(filteredEntries);

  const metrics = useMemo(
    () => ({
      total: auditEntries.length,
      statusUpdates: auditEntries.filter(
        (entry) => entry.action === "ops_order_status_update",
      ).length,
      providerUpdates: auditEntries.filter(
        (entry) => entry.action === "ops_order_provider_update",
      ).length,
      notificationUpdates: auditEntries.filter(
        (entry) => entry.action === "ops_notification_status_update",
      ).length,
      releaseEvidencePublishes: auditEntries.filter(
        (entry) => entry.action === "ops_release_evidence_publish",
      ).length,
      releasePackagePublishes: auditEntries.filter(
        (entry) => entry.action === "ops_release_package_publish",
      ).length,
      releaseHandoffPublishes: auditEntries.filter(
        (entry) => entry.action === "ops_release_handoff_publish",
      ).length,
      releaseDecisionPublishes: auditEntries.filter(
        (entry) => entry.action === "ops_release_decision_publish",
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
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsAudit}`}>
      <OpsNav activeHref="/ops/audit" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>سجل المراجعة</p>
          <h1>اعرفي من غيّر ماذا، ومتى حدث ذلك.</h1>
          <p className={styles.summary}>
            سجل قابل للمراجعة لجلسات الدخول وتغييرات الطلبات والإشعارات وقرارات
            الإطلاق، مع فلترة واضحة تساعد على تتبع الإجراءات الحساسة داخل النظام.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>إجمالي الأحداث</p>
            <strong>{isLoading ? "..." : metrics.total}</strong>
            <span>
              {isLoading
                ? "جارٍ تحميل تغطية السجل."
                : `${metrics.loginEvents} session events, ${metrics.statusUpdates} order updates, ${metrics.providerUpdates} provider updates, ${metrics.notificationUpdates} notification updates, ${metrics.releaseEvidencePublishes} evidence publishes, ${metrics.releasePackagePublishes} release-package publishes, ${metrics.releaseHandoffPublishes} release-handoff publishes, and ${metrics.releaseDecisionPublishes} release-decision publishes.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>نطاق السجل</p>
            <h2>تتبّع محمي داخل بيئة التشغيل</h2>
            <p>
              يوفر هذا السجل رؤية داخل التطبيق للعمليات المحمية، لكنه لا يحل محل
              منصة تدقيق خارجية غير قابلة للتعديل عند الإطلاق النهائي.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Audit stream</p>
          <h2>النشاط الحالي</h2>

          <div className={styles.filterChipRow}>
            {auditFilters.map((candidate) => {
              const isActive = filter === candidate;
              const label =
                candidate === "all"
                  ? "All events"
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

          <div className={styles.filterChipRow}>
            <PaginationControls
              pagination={pagination}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
            />
            <DownloadCsvButton
              filename="elore-audit.csv"
              rows={filteredEntries.map((entry) => ({
                الإجراء: getAuditActionLabel(entry.action) ?? entry.action,
                المعرف: entry.id,
                الكيان: entry.entityType,
                معرف_الكيان: entry.entityId,
                المستخدم: entry.actor.name,
                الدور: entry.actor.role,
                التاريخ: formatTimestamp(entry.createdAt),
                createdAt: entry.createdAt,
              }))}
              label="CSV"
            />
          </div>

          <div className={styles.ordersGrid}>
            {isLoading ? (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Audit</p>
                <h1>جارٍ تحميل سجل المراجعة</h1>
                <p>Reading recent protected actions from the shared authority store.</p>
              </article>
            ) : paginatedItems.length ? (
              paginatedItems.map((entry) => (
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
                <p className={styles.eyebrow}>لا توجد نتائج</p>
                <h1>لا توجد أحداث تطابق الفلتر الحالي</h1>
                <p>أزيلي الفلتر لمراجعة السجل الكامل، أو نفّذي إجراءات تشغيلية محمية لإضافة أحداث جديدة.</p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>مسارات مرتبطة</p>
          <h2>المسارات المرتبطة بالمراجعة</h2>
          <div className={styles.linkList}>
            <TrackedLink
              href="/ops/orders"
              analyticsLabel="ops_audit_to_orders"
              analyticsSurface="ops_audit_links"
              analyticsDestinationType="ops_orders"
            >
              <span>Order queue</span>
              <span>Order-state transitions</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/fulfillment"
              analyticsLabel="ops_audit_to_fulfillment"
              analyticsSurface="ops_audit_links"
              analyticsDestinationType="ops_fulfillment"
            >
              <span>Fulfillment board</span>
              <span>Routing and notification decisions</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/notifications"
              analyticsLabel="ops_audit_to_notifications"
              analyticsSurface="ops_audit_links"
              analyticsDestinationType="ops_notifications"
            >
              <span>Notification queue</span>
              <span>Delivery-state handling</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/release"
              analyticsLabel="ops_audit_to_release"
              analyticsSurface="ops_audit_links"
              analyticsDestinationType="ops_release"
            >
              <span>Release readiness</span>
              <span>Blockers, evidence, and release packages</span>
            </TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
