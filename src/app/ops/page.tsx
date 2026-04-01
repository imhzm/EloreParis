import type { Metadata } from "next";
import { OpsDashboardSurface } from "@/components/ops-dashboard-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "لوحة التشغيل الداخلية",
  description:
    "لوحة داخلية محلية تعرض أهم KPIهات الطلبات وأولويات الكتالوج لمتجر Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsDashboardPage() {
  return (
    <StorefrontShell activeHref="/ops">
      <OpsDashboardSurface />
    </StorefrontShell>
  );
}
