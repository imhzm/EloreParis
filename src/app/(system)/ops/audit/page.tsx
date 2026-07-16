import type { Metadata } from "next";
import { OpsAuditSurface } from "@/components/ops-audit-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "سجل المراجعة الداخلي",
  description:
    "سجل داخلي لجلسات التشغيل وتحديثات حالات الطلبات داخل مشروع ÉLORÉ PARIS.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsAuditPage() {
  return (
    <StorefrontShell activeHref="/ops/audit">
      <OpsAuditSurface />
    </StorefrontShell>
  );
}
