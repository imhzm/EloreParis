import type { Metadata } from "next";
import { OrdersOpsSurface } from "@/components/orders-ops-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "لوحة الطلبات التشغيلية",
  description:
    "لوحة داخلية محلية لمراجعة الطلبات وتحريك حالتها ضمن النموذج التشغيلي الحالي لمتجر Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsOrdersPage() {
  return (
    <StorefrontShell activeHref="/ops/orders">
      <OrdersOpsSurface />
    </StorefrontShell>
  );
}
