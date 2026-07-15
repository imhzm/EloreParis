import type { Metadata } from "next";
import { localeConfig, type Locale } from "./i18n";
import type { JournalRecord } from "./journal-content";
import { getSiteUrl } from "./site-content";

function languageAlternates(path: string) {
  const siteUrl = getSiteUrl();
  return { "ar-SA": `${siteUrl}/ar${path}`, "en-SA": `${siteUrl}/en${path}`, "x-default": `${siteUrl}/ar${path}` };
}

export function buildJournalMetadata(locale: Locale, record?: JournalRecord): Metadata {
  const path = record ? `/journal/${record.slug}` : "/journal";
  const title = record?.title.replace("\n", " ") ?? (locale === "ar" ? "مجلة الجمال" : "The beauty journal");
  const description = record?.summary ?? (locale === "ar" ? "أدلة مختصرة لفهم القوام والمكونات والروتين من دون وعود مبالغ فيها." : "Concise guides to texture, ingredients and rituals without overstated promises.");
  const url = `${getSiteUrl()}/${locale}${path}`;
  return { title, description, alternates: { canonical: url, languages: languageAlternates(path) }, openGraph: { title, description, url, locale: localeConfig[locale].ogLocale, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

export function buildJournalSchema(locale: Locale, records: JournalRecord[], record?: JournalRecord) {
  const siteUrl = getSiteUrl();
  const path = record ? `/journal/${record.slug}` : "/journal";
  const url = `${siteUrl}/${locale}${path}`;
  const pageName = record?.title.replace("\n", " ") ?? (locale === "ar" ? "مجلة الجمال" : "The beauty journal");
  const graph: Record<string, unknown>[] = [
    { "@type": record ? "WebPage" : "CollectionPage", "@id": `${url}#page`, url, name: pageName, description: record?.summary, inLanguage: localeConfig[locale].htmlLang, isPartOf: { "@id": `${siteUrl}/#website` } },
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "ar" ? "الرئيسية" : "Home", item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: locale === "ar" ? "المجلة" : "Journal", item: `${siteUrl}/${locale}/journal` },
      ...(record ? [{ "@type": "ListItem", position: 3, name: pageName, item: url }] : []),
    ] },
  ];
  if (!record) graph.push({ "@type": "ItemList", "@id": `${url}#edition`, numberOfItems: records.length, itemListElement: records.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title.replace("\n", " "), url: `${siteUrl}/${locale}/journal/${item.slug}` })) });
  return { "@context": "https://schema.org", "@graph": graph };
}
