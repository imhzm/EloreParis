import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackOrderSurface } from "@/components/track-order-surface";
import { isLocale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string | string[] }>;
};

const metadataCopy = {
  ar: {
    title: "تتبّع الطلب",
    description: "تابعي حالة طلبك بأمان باستخدام مرجع الطلب وآخر أربعة أرقام من رقم الجوال.",
  },
  en: {
    title: "Track your order",
    description: "Follow your order securely using its reference and the last four digits of your mobile number.",
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const canonical = `/${locale}/track-order`;
  return {
    ...metadataCopy[locale],
    alternates: {
      canonical,
      languages: {
        "ar-SA": "/ar/track-order",
        "en-SA": "/en/track-order",
        "x-default": "/ar/track-order",
      },
    },
    robots: { index: false, follow: false },
  };
}

export default async function LocalizedTrackOrderPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const order = (await searchParams).order;
  const initialOrderNumber = Array.isArray(order) ? order[0] ?? "" : order ?? "";

  return (
    <StorefrontShell
      activeHref="/track-order"
      locale={locale}
      languageHref={`/${locale === "ar" ? "en" : "ar"}/track-order${initialOrderNumber ? `?order=${encodeURIComponent(initialOrderNumber)}` : ""}`}
    >
      <TrackOrderSurface initialOrderNumber={initialOrderNumber} locale={locale} />
    </StorefrontShell>
  );
}
