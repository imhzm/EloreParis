import { notFound } from "next/navigation";
import { LocalizedDiscoveryDetail } from "@/components/localized-discovery-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { discoveryRecords, getDiscoveryRecord } from "@/lib/discovery-content";
import { buildDiscoveryMetadata, buildDiscoverySchema } from "@/lib/discovery-page-data";
import { isLocale, locales } from "@/lib/i18n";
type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return locales.flatMap((locale) => discoveryRecords[locale].ingredient.map(({ slug }) => ({ locale, slug }))); }
export async function generateMetadata({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale)) return {}; const record = getDiscoveryRecord(locale, "ingredient", slug); return record ? buildDiscoveryMetadata(locale, "ingredient", record) : {}; }
export default async function Page({ params }: Props) { const { locale, slug } = await params; if (!isLocale(locale)) notFound(); const record = getDiscoveryRecord(locale, "ingredient", slug); if (!record) notFound(); const schema = buildDiscoverySchema(locale, "ingredient", discoveryRecords[locale].ingredient, record); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><StorefrontShell activeHref="/ingredients" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/ingredients/${slug}`}><LocalizedDiscoveryDetail locale={locale} kind="ingredient" record={record} /></StorefrontShell></>; }
