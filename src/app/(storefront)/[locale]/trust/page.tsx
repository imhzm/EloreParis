import { notFound } from "next/navigation";
import { LocalizedTrustHub } from "@/components/localized-trust-support-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";
import { serializeJsonLd } from "@/lib/site-content";
import { buildTrustSupportMetadata, buildTrustSupportSchema } from "@/lib/trust-support-page-data";
import { trustContent, trustSlugs } from "@/lib/trust-support-content";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; return isLocale(locale) ? buildTrustSupportMetadata(locale, "/trust") : {}; }
export default async function Page({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); const schema = buildTrustSupportSchema(locale, "/trust", undefined, trustSlugs.map((slug) => ({ title: trustContent[locale][slug].title.replace("\n", " "), path: `/trust/${slug}` }))); return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} /><StorefrontShell activeHref="/trust" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/trust`}><LocalizedTrustHub locale={locale} /></StorefrontShell></>; }
