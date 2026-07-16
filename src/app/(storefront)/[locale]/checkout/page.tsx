import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutReview } from "@/components/checkout-review";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "الدفع الآمن" : "Secure checkout",
    robots: { index: false, follow: false },
  };
}

export default async function LocalizedCheckoutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const otherLocale = locale === "ar" ? "en" : "ar";
  return <StorefrontShell activeHref="/checkout" locale={locale} languageHref={`/${otherLocale}/checkout`}><CheckoutReview /></StorefrontShell>;
}
