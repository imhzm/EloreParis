import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartSurface } from "@/components/cart-surface";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "سلة التسوق" : "Shopping cart",
    robots: { index: false, follow: false },
  };
}

export default async function LocalizedCartPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const otherLocale = locale === "ar" ? "en" : "ar";
  return <StorefrontShell activeHref="/cart" locale={locale} languageHref={`/${otherLocale}/cart`}><CartSurface /></StorefrontShell>;
}
