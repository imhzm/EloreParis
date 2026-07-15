import { notFound } from "next/navigation";
import { LocalizedDiscoveryHub } from "@/components/localized-discovery-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { discoveryRecords } from "@/lib/discovery-content";
import { buildDiscoveryMetadata, buildDiscoverySchema } from "@/lib/discovery-page-data";
import { isLocale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; return isLocale(locale) ? buildDiscoveryMetadata(locale, "concern") : {}; }
export default async function Page({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); const items = discoveryRecords[locale].concern; const schema = buildDiscoverySchema(locale, "concern", items); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><StorefrontShell activeHref="/concerns" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/concerns`}><LocalizedDiscoveryHub locale={locale} kind="concern" items={items} /></StorefrontShell></>; }
