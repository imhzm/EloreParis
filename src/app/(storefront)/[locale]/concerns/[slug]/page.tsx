import { notFound } from "next/navigation";
import { LocalizedDiscoveryDetail } from "@/components/localized-discovery-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { discoveryRecords, getDiscoveryRecord } from "@/lib/discovery-content";
import { buildDiscoveryMetadata, buildDiscoverySchema } from "@/lib/discovery-page-data";
import { isLocale, locales } from "@/lib/i18n";
import { serializeJsonLd } from "@/lib/site-content";
import { getEffectiveDiscoveryContent } from "@/lib/site-content-authority";
type Props = { params: Promise<{ locale: string; slug: string }> };
export const dynamic = "force-dynamic";
export function generateStaticParams() { return locales.flatMap((locale) => discoveryRecords[locale].concern.map(({ slug }) => ({ locale, slug }))); }
export async function generateMetadata({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale) || !getDiscoveryRecord(locale, "concern", slug)) return {}; const authority = getEffectiveDiscoveryContent(locale, "concern"); const record = authority.records.find((item) => item.slug === slug); return record ? buildDiscoveryMetadata(locale, "concern", record, authority) : {}; }
export default async function Page({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale) || !getDiscoveryRecord(locale, "concern", slug)) notFound(); const authority = getEffectiveDiscoveryContent(locale, "concern"); const record = authority.records.find((item) => item.slug === slug); if (!record) notFound(); const schema = buildDiscoverySchema(locale, "concern", authority.records, record, authority); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} /><StorefrontShell activeHref="/concerns" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/concerns/${slug}`}><LocalizedDiscoveryDetail locale={locale} kind="concern" record={record} detailCopy={authority.detailCopy} hubCopy={authority.hubCopy} visual={authority.visual} /></StorefrontShell></>; }
