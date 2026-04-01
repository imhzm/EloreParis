import type { Metadata } from "next";
import { CartSurface } from "@/components/cart-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "السلة",
  description: "مراجعة المنتجات المختارة قبل الانتقال إلى خطوة مراجعة الطلب.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return (
    <StorefrontShell activeHref="/cart">
      <CartSurface />
    </StorefrontShell>
  );
}
