import { notFound } from "next/navigation";
import { LocalizedDiscoveryHub } from "@/components/localized-discovery-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { discoveryRecords } from "@/lib/discovery-content";
import { buildDiscoveryMetadata, buildDiscoverySchema } from "@/lib/discovery-page-data";
import { isLocale } from "@/lib/i18n";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; return isLocale(locale) ? buildDiscoveryMetadata(locale, "ingredient") : {}; }
export default async function Page({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); const items = discoveryRecords[locale].ingredient; const schema = buildDiscoverySchema(locale, "ingredient", items); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><StorefrontShell activeHref="/ingredients" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/ingredients`}><LocalizedDiscoveryHub locale={locale} kind="ingredient" items={items} /></StorefrontShell></>; }
