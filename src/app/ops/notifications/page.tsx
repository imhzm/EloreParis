import type { Metadata } from "next";
import { OpsNotificationsSurface } from "@/components/ops-notifications-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "إدارة الإشعارات التشغيلية | Cozmateks",
  description:
    "سطح داخلي محلي لمراجعة queue الإشعارات المرتبطة بالطلبات داخل مشروع Cozmateks.",
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
