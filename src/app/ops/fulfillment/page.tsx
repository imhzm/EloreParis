import type { Metadata } from "next";
import { OpsFulfillmentSurface } from "@/components/ops-fulfillment-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "إدارة الـ fulfillment التشغيلية | ÉLORÉ PARIS",
  description:
    "صفحة داخلية محلية لمراجعة مسارات الشحن والدفع والإشعارات التشغيلية للطلبات الحالية داخل ÉLORÉ PARIS.",
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
