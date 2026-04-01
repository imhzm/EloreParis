import type { Metadata } from "next";
import { CatalogOpsSurface } from "@/components/catalog-ops-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "إدارة الكتالوج التشغيلية",
  description:
    "صفحة داخلية محلية لمراجعة المنتجات والـ variants والموردين والمخزون داخل النموذج التشغيلي الحالي لمتجر Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsCatalogPage() {
  return (
    <StorefrontShell activeHref="/ops/catalog">
      <CatalogOpsSurface />
    </StorefrontShell>
  );
}
