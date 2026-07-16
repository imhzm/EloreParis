import type { Metadata } from "next";
import { OpsNotificationsSurface } from "@/components/ops-notifications-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "إدارة الإشعارات التشغيلية",
  description:
    "سطح داخلي محلي لمراجعة طابور الإشعارات المرتبطة بالطلبات داخل مشروع ÉLORÉ PARIS.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsNotificationsPage() {
  return (
    <StorefrontShell activeHref="/ops/notifications">
      <OpsNotificationsSurface />
    </StorefrontShell>
  );
}
