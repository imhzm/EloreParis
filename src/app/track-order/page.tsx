import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackOrderSurface } from "@/components/track-order-surface";

type TrackOrderPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export const metadata: Metadata = {
  title: "تتبع الطلب",
  description:
    "تتبع مرجع الطلب داخل النسخة التأسيسية الحالية عبر رقم الطلب وآخر 4 أرقام من الجوال.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TrackOrderPage({
  searchParams,
}: TrackOrderPageProps) {
  const { order } = await searchParams;

  return (
    <StorefrontShell activeHref="/track-order">
      <TrackOrderSurface initialOrderNumber={order ?? ""} />
    </StorefrontShell>
  );
}
