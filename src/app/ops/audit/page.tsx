import type { Metadata } from "next";
import { OpsAuditSurface } from "@/components/ops-audit-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "سجل المراجعة الداخلي",
  description:
    "سجل داخلي لجلسات ops وتحديثات حالات الطلبات داخل مشروع Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsAuditPage() {
  return (
    <StorefrontShell activeHref="/ops">
      <OpsAuditSurface />
    </StorefrontShell>
  );
}
