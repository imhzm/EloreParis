import { notFound } from "next/navigation";
import { LocalizedSearchExperience } from "@/components/localized-search-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale } from "@/lib/i18n";
import { searchSiteContent } from "@/lib/search";
import { buildSearchMetadata, buildSearchSchema } from "@/lib/search-page-data";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> };

function getQuery(value?: string | string[]) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim().slice(0, 120);
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildSearchMetadata(locale);
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = getQuery((await searchParams).q);
  const results = searchSiteContent(query, locale);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSearchSchema(locale)) }} /><StorefrontShell activeHref="/search" locale={locale} languageHref={`/${locale === "ar" ? "en" : "ar"}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`}><LocalizedSearchExperience locale={locale} query={query} total={results.total} groups={results.groups} /></StorefrontShell></>;
}
