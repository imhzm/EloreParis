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
  const title = record ? record.title.replace("\n", " ") : locale === "ar" ? "الثقة والوضوح" : "Trust and clarity";
  const description = record?.summary ?? (locale === "ar" ? "معلومات وسياسات واضحة تساعدك على معرفة ما يهم قبل اتخاذ القرار." : "Clear information and policies that help you understand what matters before a decision.");
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
      isPartOf: { "@id": `${siteUrl}/${locale}#website` },
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
