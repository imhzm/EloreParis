"use client";

import { useEffect, useState } from "react";
import { OpsSessionActions } from "@/components/ops-session-actions";
import { TrackedLink } from "@/components/tracked-link";
import { canRoleAccessOpsPath, getOpsAuthMethodLabel, getOpsRoleLabel } from "@/lib/ops-access";
import { fetchOpsSessionSummary } from "@/lib/ops-control-client";
import type { OpsSessionSummary } from "@/lib/ops-types";
import styles from "./order-flow.module.css";

type OpsNavProps = { activeHref: string };

const opsLinks = [
  { href: "/ops", label: "نظرة عامة", shortLabel: "الرئيسية", analyticsLabel: "ops_nav_dashboard", destinationType: "ops_dashboard" },
  { href: "/ops/orders", label: "الطلبات", shortLabel: "الطلبات", analyticsLabel: "ops_nav_orders", destinationType: "ops_orders" },
  { href: "/ops/fulfillment", label: "التنفيذ والشحن", shortLabel: "التنفيذ", analyticsLabel: "ops_nav_fulfillment", destinationType: "ops_fulfillment" },
  { href: "/ops/catalog", label: "الكتالوج والمخزون", shortLabel: "الكتالوج", analyticsLabel: "ops_nav_catalog", destinationType: "ops_catalog" },
  { href: "/ops/content", label: "المحتوى", shortLabel: "المحتوى", analyticsLabel: "ops_nav_content", destinationType: "ops_content" },
  { href: "/ops/notifications", label: "الإشعارات", shortLabel: "الإشعارات", analyticsLabel: "ops_nav_notifications", destinationType: "ops_notifications" },
  { href: "/ops/audit", label: "سجل النشاط", shortLabel: "السجل", analyticsLabel: "ops_nav_audit", destinationType: "ops_audit" },
  { href: "/ops/release", label: "جاهزية الإطلاق", shortLabel: "الإطلاق", analyticsLabel: "ops_nav_release", destinationType: "ops_release" },
];

export function OpsNav({ activeHref }: OpsNavProps) {
  const [session, setSession] = useState<OpsSessionSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void fetchOpsSessionSummary()
      .then(({ session: nextSession }) => {
        setSession(nextSession);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        setSession(null);
        setLoadError(error instanceof Error ? error.message : "تعذر تحميل جلسة لوحة التحكم الحالية.");
      });
  }, []);

  const visibleLinks = session
    ? opsLinks.filter((link) => canRoleAccessOpsPath(session.role, link.href))
    : opsLinks;

  return (
    <header className={styles.opsNavWrap}>
      <div className={styles.opsNavCluster}>
        <div className={styles.opsBrand}>
          <span className={styles.opsBrandMark}>C</span>
          <div><strong>ÉLORÉ PARIS</strong><small>مركز العمليات</small></div>
        </div>

        <nav className={styles.opsNav} aria-label="التنقل داخل لوحة التحكم">
          {visibleLinks.map((link) => {
            const isActive = link.href === "/ops" ? activeHref === "/ops" : activeHref.startsWith(link.href);
            return (
              <TrackedLink
                key={link.href}
                href={link.href}
                analyticsLabel={link.analyticsLabel}
                analyticsSurface="ops_nav"
                analyticsDestinationType={link.destinationType}
                className={`${styles.opsNavLink} ${isActive ? styles.opsNavLinkActive : ""}`}
                aria-current={isActive ? "page" : undefined}
                title={link.label}
              >
                {link.shortLabel}
              </TrackedLink>
            );
          })}
        </nav>
      </div>

      <div className={styles.opsNavActions}>
        {session ? (
          <div className={styles.opsSessionSummary}>
            <strong>{session.name}</strong>
            <span>{getOpsRoleLabel(session.role)} · {getOpsAuthMethodLabel(session.authMethod)} · {session.mode === "development_open" ? "وضع التطوير" : "محمي"}</span>
          </div>
        ) : loadError ? (
          <span className={styles.opsNavMeta}>{loadError}</span>
        ) : (
          <span className={styles.opsNavMeta}>جارٍ تحميل الجلسة...</span>
        )}
        <OpsSessionActions session={session} />
      </div>
    </header>
  );
}
