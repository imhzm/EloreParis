import { notFound } from "next/navigation";
import { LocalizedDiscoveryHub } from "@/components/localized-discovery-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { buildDiscoveryMetadata, buildDiscoverySchema } from "@/lib/discovery-page-data";
import { isLocale } from "@/lib/i18n";
import { serializeJsonLd } from "@/lib/site-content";
import { getEffectiveDiscoveryContent } from "@/lib/site-content-authority";

type Props = { params: Promise<{ locale: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) return {}; const authority = getEffectiveDiscoveryContent(locale, "concern"); return buildDiscoveryMetadata(locale, "concern", undefined, authority); }
export default async function Page({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); const authority = getEffectiveDiscoveryContent(locale, "concern"); const schema = buildDiscoverySchema(locale, "concern", authority.records, undefined, authority); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} /><StorefrontShell activeHref="/concerns" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/concerns`}><LocalizedDiscoveryHub locale={locale} kind="concern" items={authority.records} hubCopy={authority.hubCopy} visual={authority.visual} /></StorefrontShell></>; }
