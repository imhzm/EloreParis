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
  "ops_release_evidence_publish",
  "ops_release_package_publish",
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
    case "ops_notification_status_update":
      return "Notification status updated";
    case "ops_release_evidence_publish":
      return "Release evidence published";
    case "ops_release_package_publish":
      return "Release package published";
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

  const metrics = useMemo(
    () => ({
      total: auditEntries.length,
      statusUpdates: auditEntries.filter(
        (entry) => entry.action === "ops_order_status_update",
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
          <h1>A durable review stream for protected ops sessions and sensitive internal actions.</h1>
          <p className={styles.summary}>
            This surface does not claim a final SIEM or compliance archive. It keeps a clear,
            searchable trace for ops logins, throttling, order changes, notification changes,
            release-evidence publication, and release-package publication inside the current
            runtime.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Total entries</p>
            <strong>{isLoading ? "..." : metrics.total}</strong>
            <span>
              {isLoading
                ? "Loading audit coverage."
                : `${metrics.loginEvents} session events, ${metrics.statusUpdates} order updates, ${metrics.notificationUpdates} notification updates, ${metrics.releaseEvidencePublishes} evidence publishes, and ${metrics.releasePackagePublishes} release-package publishes.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Scope</p>
            <h2>Protected runtime trace</h2>
            <p>
              The current layer focuses on traceability inside this application runtime. It is
              useful for launch rehearsal and protected operations, but it is not a substitute for
              an external immutable audit platform.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Audit stream</p>
          <h2>Current activity</h2>

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

          <div className={styles.ordersGrid}>
            {isLoading ? (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Audit</p>
                <h1>Loading the audit stream</h1>
                <p>Reading recent protected actions from the shared authority store.</p>
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
                <p className={styles.eyebrow}>No entries</p>
                <h1>No audit entries match the current filter</h1>
                <p>Run more protected ops actions or clear the filter to inspect the full stream.</p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Related ops paths</p>
          <h2>Audit-adjacent surfaces</h2>
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
