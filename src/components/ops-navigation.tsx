import type { ReactNode } from "react";

export type OpsNavIconName =
  | "dashboard"
  | "orders"
  | "customers"
  | "analytics"
  | "settings"
  | "fulfillment"
  | "catalog"
  | "promotions"
  | "content"
  | "notifications"
  | "audit"
  | "release";

export type OpsLink = {
  href: string;
  label: string;
  analyticsLabel: string;
  destinationType: string;
  icon: OpsNavIconName;
};

export const opsGroups: Array<{ label: string; links: OpsLink[] }> = [
  {
    label: "لوحة المعلومات",
    links: [
      {
        href: "/ops",
        label: "نظرة عامة",
        analyticsLabel: "ops_nav_dashboard",
        destinationType: "ops_dashboard",
        icon: "dashboard",
      },
    ],
  },
  {
    label: "التجارة والعمليات",
    links: [
      {
        href: "/ops/orders",
        label: "الطلبات",
        analyticsLabel: "ops_nav_orders",
        destinationType: "ops_orders",
        icon: "orders",
      },
      {
        href: "/ops/customers",
        label: "العملاء",
        analyticsLabel: "ops_nav_customers",
        destinationType: "ops_customers",
        icon: "customers",
      },
      {
        href: "/ops/analytics",
        label: "التحليلات",
        analyticsLabel: "ops_nav_analytics",
        destinationType: "ops_analytics",
        icon: "analytics",
      },
      {
        href: "/ops/fulfillment",
        label: "التنفيذ والشحن",
        analyticsLabel: "ops_nav_fulfillment",
        destinationType: "ops_fulfillment",
        icon: "fulfillment",
      },
      {
        href: "/ops/catalog",
        label: "الكتالوج والمخزون",
        analyticsLabel: "ops_nav_catalog",
        destinationType: "ops_catalog",
        icon: "catalog",
      },
      {
        href: "/ops/promotions",
        label: "العروض والكوبونات",
        analyticsLabel: "ops_nav_promotions",
        destinationType: "ops_promotions",
        icon: "promotions",
      },
    ],
  },
  {
    label: "المحتوى والتواصل",
    links: [
      {
        href: "/ops/content",
        label: "المحتوى",
        analyticsLabel: "ops_nav_content",
        destinationType: "ops_content",
        icon: "content",
      },
      {
        href: "/ops/notifications",
        label: "الإشعارات",
        analyticsLabel: "ops_nav_notifications",
        destinationType: "ops_notifications",
        icon: "notifications",
      },
    ],
  },
  {
    label: "الحوكمة",
    links: [
      {
        href: "/ops/audit",
        label: "سجل النشاط",
        analyticsLabel: "ops_nav_audit",
        destinationType: "ops_audit",
        icon: "audit",
      },
      {
        href: "/ops/release",
        label: "جاهزية الإطلاق",
        analyticsLabel: "ops_nav_release",
        destinationType: "ops_release",
        icon: "release",
      },
      {
        href: "/ops/settings",
        label: "الإعدادات",
        analyticsLabel: "ops_nav_settings",
        destinationType: "ops_settings",
        icon: "settings",
      },
    ],
  },
];

export function OpsNavIcon({ name }: { name: OpsNavIconName }) {
  const paths: Record<OpsNavIconName, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    orders: (
      <>
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    customers: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 20c.6-4 2.8-6 6.5-6s5.9 2 6.5 6" />
        <path d="M18 6.8a2.5 2.5 0 0 1 0 4.8M19.5 14.5c1.6.8 2.4 2.2 2.5 4" />
      </>
    ),
    analytics: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        <path d="m4 7 6-4 6 7 5-5" />
      </>
    ),
    fulfillment: (
      <>
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    catalog: (
      <>
        <path d="M4 5.5 12 3l8 2.5v13L12 21l-8-2.5v-13Z" />
        <path d="m4 5.5 8 2.7 8-2.7M12 8.2V21" />
      </>
    ),
    promotions: (
      <>
        <path d="M4 7.5 11.5 3H20v8.5L12.5 19 4 10.5v-3Z" />
        <circle cx="15.5" cy="7.5" r="1.5" />
        <path d="m8.5 9.5 6 6M14.5 9.5l-6 6" />
      </>
    ),
    content: (
      <>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M15 3v5h4M9 12h7M9 16h7" />
      </>
    ),
    notifications: (
      <>
        <path d="M6 16.5h12l-1.4-2.2V10a4.6 4.6 0 0 0-9.2 0v4.3L6 16.5Z" />
        <path d="M10 19a2.3 2.3 0 0 0 4 0" />
      </>
    ),
    audit: (
      <>
        <path d="M8 4h8v3H8zM6 6h12v15H6z" />
        <path d="m9 13 2 2 4-5" />
      </>
    ),
    release: (
      <>
        <path d="M12 3c3.5 1.2 6 4.1 6 8.2 0 4.5-3 7.6-6 9.8-3-2.2-6-5.3-6-9.8C6 7.1 8.5 4.2 12 3Z" />
        <path d="m9.5 12 1.7 1.7 3.5-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7-.7-2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7 2-.7Z" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function isOpsLinkActive(linkHref: string, activeHref: string) {
  return linkHref === "/ops"
    ? activeHref === "/ops"
    : activeHref.startsWith(linkHref);
}
