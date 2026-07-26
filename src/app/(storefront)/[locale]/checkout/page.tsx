import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutReview } from "@/components/checkout-review";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, localeConfig } from "@/lib/i18n";
import { absoluteUrl, defaultSocialCard } from "@/lib/site-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};
  const title = candidate === "ar" ? "الدفع الآمن" : "Secure checkout";
  const description = candidate === "ar" ? "إتمام الطلب بشكل آمن مع خيارات دفع متعددة" : "Complete your order securely with multiple payment options";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, url: absoluteUrl(`/${candidate}/checkout`), locale: localeConfig[candidate].ogLocale, type: "website", images: defaultSocialCard(title, candidate).openGraph },
    twitter: { card: "summary_large_image", title, description, images: defaultSocialCard(title, candidate).twitter },
  };
}

export default async function LocalizedCheckoutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const otherLocale = locale === "ar" ? "en" : "ar";
  return <StorefrontShell activeHref="/checkout" locale={locale} languageHref={`/${otherLocale}/checkout`}><CheckoutReview /></StorefrontShell>;
}
