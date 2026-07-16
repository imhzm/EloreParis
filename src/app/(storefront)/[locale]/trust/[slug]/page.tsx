import { notFound } from "next/navigation";
import { LocalizedTrustSupportDetail } from "@/components/localized-trust-support-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, locales } from "@/lib/i18n";
import { buildTrustSupportMetadata, buildTrustSupportSchema } from "@/lib/trust-support-page-data";
import { getTrustRecord, trustSlugs } from "@/lib/trust-support-content";

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return locales.flatMap((locale) => trustSlugs.map((slug) => ({ locale, slug }))); }
export async function generateMetadata({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale)) return {}; const record = getTrustRecord(locale, slug); return record ? buildTrustSupportMetadata(locale, `/trust/${slug}`, record) : {}; }
export default async function Page({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale)) notFound(); const record = getTrustRecord(locale, slug); if (!record) notFound(); const schema = buildTrustSupportSchema(locale, `/trust/${slug}`, record); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><StorefrontShell activeHref="/trust" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/trust/${slug}`}><LocalizedTrustSupportDetail locale={locale} record={record} parentHref="/trust" /></StorefrontShell></>; }
