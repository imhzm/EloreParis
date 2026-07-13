"use client";

import { useEffect, useState } from "react";
import { OpsSessionActions } from "@/components/ops-session-actions";
import { TrackedLink } from "@/components/tracked-link";
import {
  canRoleAccessOpsPath,
  getOpsAuthMethodLabel,
  getOpsRoleLabel,
} from "@/lib/ops-access";
import { fetchOpsSessionSummary } from "@/lib/ops-control-client";
import type { OpsSessionSummary } from "@/lib/ops-types";
import styles from "./order-flow.module.css";

type OpsNavProps = {
  activeHref: string;
};

const opsLinks = [
  {
    href: "/ops",
    label: "Dashboard",
    analyticsLabel: "ops_nav_dashboard",
    destinationType: "ops_dashboard",
  },
  {
    href: "/ops/orders",
    label: "Orders",
    analyticsLabel: "ops_nav_orders",
    destinationType: "ops_orders",
  },
  {
    href: "/ops/fulfillment",
    label: "Fulfillment",
    analyticsLabel: "ops_nav_fulfillment",
    destinationType: "ops_fulfillment",
  },
  {
    href: "/ops/catalog",
    label: "Catalog",
    analyticsLabel: "ops_nav_catalog",
    destinationType: "ops_catalog",
  },
  {
    href: "/ops/content",
    label: "Content",
    analyticsLabel: "ops_nav_content",
    destinationType: "ops_content",
  },
  {
    href: "/ops/release",
    label: "Release",
    analyticsLabel: "ops_nav_release",
    destinationType: "ops_release",
  },
  {
    href: "/ops/notifications",
    label: "Notifications",
    analyticsLabel: "ops_nav_notifications",
    destinationType: "ops_notifications",
  },
  {
    href: "/ops/audit",
    label: "Audit",
    analyticsLabel: "ops_nav_audit",
    destinationType: "ops_audit",
  },
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
        setLoadError(
          error instanceof Error
            ? error.message
            : "تعذر تحميل سياق جلسة لوحة التحكم الحالية.",
        );
      });
  }, []);

  const visibleLinks = session
    ? opsLinks.filter((link) => canRoleAccessOpsPath(session.role, link.href))
    : opsLinks;

  return (
    <div className={styles.opsNavWrap}>
      <div className={styles.opsNavCluster}>
        <nav className={styles.opsNav} aria-label="Internal operations navigation">
          {visibleLinks.map((link) => {
            const isActive =
              link.href === "/ops"
                ? activeHref === "/ops"
                : activeHref.startsWith(link.href);

            return (
              <TrackedLink
                key={link.href}
                href={link.href}
                analyticsLabel={link.analyticsLabel}
                analyticsSurface="ops_nav"
                analyticsDestinationType={link.destinationType}
                className={`${styles.opsNavLink} ${isActive ? styles.opsNavLinkActive : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </TrackedLink>
            );
          })}
        </nav>

        {session ? (
          <div className={styles.opsSessionSummary}>
            <strong>{session.name}</strong>
            <span>
              {getOpsRoleLabel(session.role)} ·{" "}
              {session.username ? `@${session.username} · ` : ""}
              {getOpsAuthMethodLabel(session.authMethod)} ·{" "}
              {session.mode === "development_open" ? "Dev open mode" : "Protected"}
            </span>
          </div>
        ) : loadError ? (
          <span className={styles.opsNavMeta}>{loadError}</span>
        ) : (
          <span className={styles.opsNavMeta}>جارٍ تحميل جلسة لوحة التحكم...</span>
        )}
      </div>

      <OpsSessionActions session={session} />
    </div>
  );
}
