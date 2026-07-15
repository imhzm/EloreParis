import type { Metadata } from "next";
import { localeConfig, type Locale } from "./i18n";
import { getSiteUrl } from "./site-content";
import type { TrustSupportRecord } from "./trust-support-content";

function alternates(locale: Locale, path: string) {
  const siteUrl = getSiteUrl();
  return {
    canonical: `${siteUrl}/${locale}${path}`,
    languages: {
      "ar-SA": `${siteUrl}/ar${path}`,
      "en-SA": `${siteUrl}/en${path}`,
      "x-default": `${siteUrl}/ar${path}`,
    },
  };
}

export function buildTrustSupportMetadata(locale: Locale, path: string, record?: TrustSupportRecord): Metadata {
  const title = record ? `${record.title.replace("\n", " ")} | ÉLORÉ PARIS` : locale === "ar" ? "الثقة والوضوح | ÉLORÉ PARIS" : "Trust and clarity | ÉLORÉ PARIS";
  const description = record?.summary ?? (locale === "ar" ? "معلومات واضحة وسياسات مؤقتة بانتظار الاعتماد قبل الإطلاق التجاري." : "Clear information and provisional policies awaiting approval before commercial launch.");
  const url = `${getSiteUrl()}/${locale}${path}`;

  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: { title, description, url, locale: localeConfig[locale].ogLocale, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function buildTrustSupportSchema(locale: Locale, path: string, record?: TrustSupportRecord, itemPaths?: Array<{ title: string; path: string }>) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${locale}${path}`;
  const nodes: Record<string, unknown>[] = [
    {
      "@type": record?.slug === "about" ? "AboutPage" : record?.slug === "contact" ? "ContactPage" : itemPaths ? "CollectionPage" : "WebPage",
      "@id": `${url}#page`,
      url,
      name: record?.title.replace("\n", " ") ?? (locale === "ar" ? "الثقة والوضوح" : "Trust and clarity"),
      description: record?.summary,
      inLanguage: localeConfig[locale].htmlLang,
      isPartOf: { "@id": `${siteUrl}/#website` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: locale === "ar" ? "الرئيسية" : "Home", item: `${siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: record?.title.replace("\n", " ") ?? (locale === "ar" ? "الثقة" : "Trust"), item: url },
      ],
    },
  ];

  if (itemPaths) {
    nodes.push({
      "@type": "ItemList",
      "@id": `${url}#directory`,
      itemListElement: itemPaths.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: `${siteUrl}/${locale}${item.path}` })),
    });
  }

  return { "@context": "https://schema.org", "@graph": nodes };
}
