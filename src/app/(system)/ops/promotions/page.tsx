import type { Metadata } from "next";
import { OpsPromotionsSurface } from "@/components/ops-promotions-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "العروض والكوبونات | ÉLORÉ Ops",
  description: "إدارة محكومة للعروض والكوبونات والحملات وقواعد التسعير.",
  robots: { index: false, follow: false },
};

export default function OpsPromotionsPage() {
  return (
    <StorefrontShell activeHref="/ops/promotions">
      <OpsPromotionsSurface />
    </StorefrontShell>
  );
}
