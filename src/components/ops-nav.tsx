"use client";

import { useEffect, useRef, useState } from "react";
import { OpsSessionActions } from "@/components/ops-session-actions";
import { TrackedLink } from "@/components/tracked-link";
import {
  isOpsLinkActive,
  OpsNavIcon,
  opsGroups,
} from "@/components/ops-navigation";
import {
  canRoleAccessOpsPath,
  getOpsAuthMethodLabel,
  getOpsRoleLabel,
} from "@/lib/ops-access";
import { fetchOpsCounts, fetchOpsSessionSummary } from "@/lib/ops-control-client";
import type { OpsSessionSummary } from "@/lib/ops-types";
import styles from "./ops-shell.module.css";

type OpsCounts = {
  pendingOrders: number;
  activeFulfillment: number;
  queuedNotifications: number;
  totalOrders: number;
  auditEvents: number;
  blockedNotifications: number;
};

type OpsNavProps = { activeHref: string };

function NavCountBadge({ href, counts }: { href: string; counts: OpsCounts }) {
  const count =
    href === "/ops/orders" ? counts.pendingOrders + counts.activeFulfillment :
    href === "/ops/notifications" ? counts.queuedNotifications :
    href === "/ops/audit" ? counts.auditEvents :
    href === "/ops/fulfillment" ? counts.activeFulfillment :
    null;

  if (count === null || count <= 0) return null;
  return <span className={styles.navBadge}>{count > 99 ? "99+" : count}</span>;
}

export function OpsNav({ activeHref }: OpsNavProps) {
  const [session, setSession] = useState<OpsSessionSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [counts, setCounts] = useState<OpsCounts | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  useEffect(() => {
    void fetchOpsSessionSummary()
      .then(({ session: nextSession }) => {
        setSession(nextSession);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        setSession(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "تعذّر تحميل جلسة لوحة التحكم الحالية.",
        );
      });
  }, []);

  useEffect(() => {
    function loadCounts() {
      void fetchOpsCounts()
        .then(setCounts)
        .catch(() => {});
    }
    loadCounts();
    const interval = setInterval(loadCounts, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDrawerOpen]);

  const visibleGroups = opsGroups
    .map((group) => ({
      ...group,
      links: session
        ? group.links.filter((link) =>
            canRoleAccessOpsPath(session.role, link.href),
          )
        : group.links,
    }))
    .filter((group) => group.links.length > 0);

  const activeLink = opsGroups
    .flatMap((group) => group.links)
    .find((link) => isOpsLinkActive(link.href, activeHref));

  return (
    <div className={styles.chrome}>
      <aside
        id="ops-sidebar"
        className={`${styles.sidebar} ${isDrawerOpen ? styles.sidebarOpen : ""}`}
        aria-label="التنقل داخل لوحة التحكم"
      >
        <div className={styles.brandRow}>
          <span className={styles.brandMark} aria-hidden="true">É</span>
          <div className={styles.brandCopy}>
            <strong>ÉLORÉ PARIS</strong>
            <span>مركز العمليات</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={closeDrawer}
            aria-label="إغلاق قائمة لوحة التحكم"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav} aria-label="أقسام لوحة التحكم">
          {visibleGroups.map((group) => (
            <div className={styles.navGroup} key={group.label}>
              <p>{group.label}</p>
              {group.links.map((link) => {
                const isActive = isOpsLinkActive(link.href, activeHref);
                return (
                  <TrackedLink
                    key={link.href}
                    href={link.href}
                    analyticsLabel={link.analyticsLabel}
                    analyticsSurface="ops_nav"
                    analyticsDestinationType={link.destinationType}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <span className={styles.navIcon}>
                      <OpsNavIcon name={link.icon} />
                    </span>
                    <span>{link.label}</span>
                    {counts ? <NavCountBadge href={link.href} counts={counts} /> : null}
                  </TrackedLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.securityDot} aria-hidden="true" />
          <div>
            <strong>{session?.mode === "development_open" ? "بيئة تطوير" : "وصول محمي"}</strong>
            <span>جلسات موقّعة وصلاحيات حسب الدور</span>
          </div>
        </div>
      </aside>

      <header className={styles.topbar}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          onClick={() => setIsDrawerOpen(true)}
          aria-expanded={isDrawerOpen}
          aria-controls="ops-sidebar"
          aria-label="فتح قائمة لوحة التحكم"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        </button>

        <div className={styles.pageHeading}>
          <span>BACKOFFICE</span>
          <strong>{activeLink?.label ?? "لوحة التحكم"}</strong>
        </div>

        <div className={styles.topbarActions}>
          {session ? (
            <div className={styles.sessionSummary}>
              <span className={styles.avatar} aria-hidden="true">
                {session.name.trim().charAt(0).toUpperCase() || "É"}
              </span>
              <div>
                <strong>{session.name}</strong>
                <span>
                  {getOpsRoleLabel(session.role)} · {getOpsAuthMethodLabel(session.authMethod)}
                </span>
              </div>
            </div>
          ) : loadError ? (
            <span className={styles.sessionError} role="status">{loadError}</span>
          ) : (
            <span className={styles.sessionLoading} role="status">
              جارٍ تحميل الجلسة...
            </span>
          )}
          <OpsSessionActions session={session} showMeta={false} />
        </div>
      </header>

      <button
        type="button"
        className={`${styles.overlay} ${isDrawerOpen ? styles.overlayVisible : ""}`}
        onClick={closeDrawer}
        aria-label="إغلاق قائمة لوحة التحكم"
        tabIndex={isDrawerOpen ? 0 : -1}
      />
    </div>
  );
}
