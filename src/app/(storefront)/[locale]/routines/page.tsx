import { notFound } from "next/navigation";
import { LocalizedDiscoveryHub } from "@/components/localized-discovery-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { buildDiscoveryMetadata, buildDiscoverySchema } from "@/lib/discovery-page-data";
import { isLocale } from "@/lib/i18n";
import { serializeJsonLd } from "@/lib/site-content";
import { getEffectiveDiscoveryContent } from "@/lib/site-content-authority";
type Props = { params: Promise<{ locale: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) return {}; const authority = getEffectiveDiscoveryContent(locale, "routine"); return buildDiscoveryMetadata(locale, "routine", undefined, authority); }
export default async function Page({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); const authority = getEffectiveDiscoveryContent(locale, "routine"); const schema = buildDiscoverySchema(locale, "routine", authority.records, undefined, authority); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} /><StorefrontShell activeHref="/routines" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/routines`}><LocalizedDiscoveryHub locale={locale} kind="routine" items={authority.records} hubCopy={authority.hubCopy} visual={authority.visual} /></StorefrontShell></>; }
