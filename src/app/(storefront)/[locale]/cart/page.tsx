import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartSurface } from "@/components/cart-surface";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, localeConfig } from "@/lib/i18n";
import { absoluteUrl, defaultSocialCard } from "@/lib/site-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};
  const title = candidate === "ar" ? "سلة التسوق" : "Shopping cart";
  const description = candidate === "ar" ? "مراجعة المنتجات المختارة قبل إتمام الطلب" : "Review selected products before checkout";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, url: absoluteUrl(`/${candidate}/cart`), locale: localeConfig[candidate].ogLocale, type: "website", images: defaultSocialCard(title, candidate).openGraph },
    twitter: { card: "summary_large_image", title, description, images: defaultSocialCard(title, candidate).twitter },
  };
}

export default async function LocalizedCartPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const otherLocale = locale === "ar" ? "en" : "ar";
  return <StorefrontShell activeHref="/cart" locale={locale} languageHref={`/${otherLocale}/cart`}><CartSurface /></StorefrontShell>;
}
