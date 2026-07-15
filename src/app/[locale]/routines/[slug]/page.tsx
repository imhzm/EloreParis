import { notFound } from "next/navigation";
import { LocalizedDiscoveryDetail } from "@/components/localized-discovery-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { discoveryRecords, getDiscoveryRecord } from "@/lib/discovery-content";
import { buildDiscoveryMetadata, buildDiscoverySchema } from "@/lib/discovery-page-data";
import { isLocale, locales } from "@/lib/i18n";
type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return locales.flatMap((locale) => discoveryRecords[locale].routine.map(({ slug }) => ({ locale, slug }))); }
export async function generateMetadata({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale)) return {}; const record = getDiscoveryRecord(locale, "routine", slug); return record ? buildDiscoveryMetadata(locale, "routine", record) : {}; }
export default async function Page({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale)) notFound(); const record = getDiscoveryRecord(locale, "routine", slug); if (!record) notFound(); const schema = buildDiscoverySchema(locale, "routine", discoveryRecords[locale].routine, record); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><StorefrontShell activeHref="/routines" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/routines/${slug}`}><LocalizedDiscoveryDetail locale={locale} kind="routine" record={record} /></StorefrontShell></>; }
