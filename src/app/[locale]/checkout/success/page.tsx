import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderConfirmation } from "@/components/order-confirmation";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function safeOrderReference(value: string | string[] | undefined) {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  return /^CZM-[A-F0-9]{24}$/.test(candidate) ? candidate : "";
}

export default async function LocalizedCheckoutSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { order: rawOrder } = await searchParams;
  const order = safeOrderReference(rawOrder);
  const otherLocale = locale === "ar" ? "en" : "ar";
  const languageHref = `/${otherLocale}/checkout/success${order ? `?order=${encodeURIComponent(order)}` : ""}`;
  return <StorefrontShell activeHref="/checkout" locale={locale} languageHref={languageHref}><OrderConfirmation locale={locale} orderNumber={order} /></StorefrontShell>;
}
