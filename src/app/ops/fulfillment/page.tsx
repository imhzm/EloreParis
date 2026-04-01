import type { Metadata } from "next";
import { OpsFulfillmentSurface } from "@/components/ops-fulfillment-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "إدارة الـ fulfillment التشغيلية | Cozmateks",
  description:
    "صفحة داخلية محلية لمراجعة routing الشحن والدفع والإشعارات التشغيلية للطلبات الحالية داخل Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsFulfillmentPage() {
  return (
    <StorefrontShell activeHref="/ops/fulfillment">
      <OpsFulfillmentSurface />
    </StorefrontShell>
  );
}
