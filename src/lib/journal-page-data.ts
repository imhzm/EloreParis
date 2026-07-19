import type { Metadata } from "next";
import { localeConfig, type Locale } from "./i18n";
import type { JournalRecord } from "./journal-content";
import { defaultSocialCard, getSiteUrl } from "./site-content";
import type { EditorialAuthorityContent } from "./site-editorial-authority";

function languageAlternates(path: string) {
  const siteUrl = getSiteUrl();
  return { "ar-SA": `${siteUrl}/ar${path}`, "en-SA": `${siteUrl}/en${path}`, "x-default": `${siteUrl}/ar${path}` };
}

export function buildJournalMetadata(locale: Locale, record?: JournalRecord, hubCopy?: EditorialAuthorityContent["journalCopy"][Locale]["hub"]): Metadata {
  const path = record ? `/journal/${record.slug}` : "/journal";
  const title = record?.title.replace("\n", " ") ?? hubCopy?.title.replace("\n", " ") ?? (locale === "ar" ? "مجلة الجمال" : "The beauty journal");
  const description = record?.summary ?? hubCopy?.intro ?? (locale === "ar" ? "أدلة مختصرة لفهم القوام والمكونات والروتين من دون وعود مبالغ فيها." : "Concise guides to texture, ingredients and rituals without overstated promises.");
  const url = `${getSiteUrl()}/${locale}${path}`;
  // A route's openGraph REPLACES the layout's, so naming no image here shipped
  // the journal and every article with no share card at all.
  const card = defaultSocialCard(title, locale);
  return { title, description, alternates: { canonical: url, languages: languageAlternates(path) }, openGraph: { title, description, url, locale: localeConfig[locale].ogLocale, type: "website", images: card.openGraph }, twitter: { card: "summary_large_image", title, description, images: card.twitter } };
}

export function buildJournalSchema(locale: Locale, records: JournalRecord[], record?: JournalRecord, hubCopy?: EditorialAuthorityContent["journalCopy"][Locale]["hub"] ) {
  const siteUrl = getSiteUrl();
  const path = record ? `/journal/${record.slug}` : "/journal";
  const url = `${siteUrl}/${locale}${path}`;
  const pageName = record?.title.replace("\n", " ") ?? hubCopy?.title.replace("\n", " ") ?? (locale === "ar" ? "مجلة الجمال" : "The beauty journal");
  const graph: Record<string, unknown>[] = [
    { "@type": record ? "WebPage" : "CollectionPage", "@id": `${url}#page`, url, name: pageName, description: record?.summary ?? hubCopy?.intro, inLanguage: localeConfig[locale].htmlLang, isPartOf: { "@id": `${siteUrl}/${locale}#website` } },
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "ar" ? "الرئيسية" : "Home", item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: locale === "ar" ? "المجلة" : "Journal", item: `${siteUrl}/${locale}/journal` },
      ...(record ? [{ "@type": "ListItem", position: 3, name: pageName, item: url }] : []),
    ] },
  ];
  if (!record) graph.push({ "@type": "ItemList", "@id": `${url}#edition`, numberOfItems: records.length, itemListElement: records.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title.replace("\n", " "), url: `${siteUrl}/${locale}/journal/${item.slug}` })) });
  return { "@context": "https://schema.org", "@graph": graph };
}
