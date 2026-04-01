import type { Metadata } from "next";
import { CheckoutReview } from "@/components/checkout-review";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "إتمام الطلب",
  description:
    "خطوة تثبيت الطلب بمرجع واضح ضمن النسخة التأسيسية الحالية لمتجر Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <StorefrontShell activeHref="/checkout">
      <CheckoutReview />
    </StorefrontShell>
  );
}
