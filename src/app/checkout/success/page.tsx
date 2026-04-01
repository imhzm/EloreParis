import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/order-confirmation";
import { StorefrontShell } from "@/components/storefront-shell";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export const metadata: Metadata = {
  title: "تأكيد الطلب",
  description:
    "مرجع طلب محلي جاهز للتتبع ضمن النسخة التأسيسية الحالية من متجر Cozmateks.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order } = await searchParams;

  return (
    <StorefrontShell activeHref="/checkout">
      <OrderConfirmation orderNumber={order ?? ""} />
    </StorefrontShell>
  );
}
