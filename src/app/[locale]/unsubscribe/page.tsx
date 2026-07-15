import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LifecycleUnsubscribeConfirmation } from "@/components/lifecycle-unsubscribe-confirmation";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const metadataCopy = {
  ar: {
    title: "إدارة تفضيلات التواصل",
    description: "تأكيد آمن لإلغاء الاشتراك في رسائل إيلوري باريس.",
  },
  en: {
    title: "Manage communication preferences",
    description: "Securely confirm an ÉLORÉ PARIS unsubscribe request.",
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    ...metadataCopy[locale],
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function UnsubscribePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <StorefrontShell
      activeHref="/unsubscribe"
      locale={locale}
      languageHref={`/${locale === "ar" ? "en" : "ar"}/unsubscribe`}
    >
      <LifecycleUnsubscribeConfirmation locale={locale} />
    </StorefrontShell>
  );
}
