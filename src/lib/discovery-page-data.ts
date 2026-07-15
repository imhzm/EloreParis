import type { Metadata } from "next";
import { discoveryDetailCopy, discoveryHubCopy, discoveryPaths, type DiscoveryKind, type DiscoveryRecord } from "@/lib/discovery-content";
import { localeConfig, type Locale } from "@/lib/i18n";
import { publicRichPreviewRobots } from "@/lib/seo";
import { absoluteUrl, siteName } from "@/lib/site-content";

const socialImages: Record<DiscoveryKind, { src: string; width: number; height: number }> = {
  concern: { src: "/elore-assets/editorial-skin-light-concept-1122w.avif", width: 1122, height: 1402 },
  routine: { src: "/elore-assets/hero-silk-champagne-concept-1672w.avif", width: 1672, height: 941 },
  ingredient: { src: "/elore-assets/texture-skincare-serum-concept-1536w.avif", width: 1536, height: 1024 },
};

export function buildDiscoveryMetadata(locale: Locale, kind: DiscoveryKind, record?: DiscoveryRecord): Metadata {
  const pathSegment = discoveryPaths[kind];
  const pathSuffix = record ? `/${record.slug}` : "";
  const canonical = `/${locale}/${pathSegment}${pathSuffix}`;
  const title = record?.title ?? discoveryHubCopy[locale][kind].title.replace("\n", " ");
  const description = record?.summary ?? discoveryHubCopy[locale][kind].intro;
  const image = socialImages[kind];
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `/ar/${pathSegment}${pathSuffix}`,
        "en-SA": `/en/${pathSegment}${pathSuffix}`,
        "x-default": `/ar/${pathSegment}${pathSuffix}`,
      },
    },
    robots: publicRichPreviewRobots,
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: absoluteUrl(canonical),
      siteName,
      locale: localeConfig[locale].ogLocale,
      alternateLocale: [localeConfig[locale === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      images: [{ url: absoluteUrl(image.src), width: image.width, height: image.height, alt: `${siteName} — ${title}` }],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${siteName}`, description, images: [absoluteUrl(image.src)] },
  };
}

export function buildDiscoverySchema(locale: Locale, kind: DiscoveryKind, records: DiscoveryRecord[], record?: DiscoveryRecord) {
  const pathSegment = discoveryPaths[kind];
  const basePath = `/${locale}/${pathSegment}`;
  const label = discoveryDetailCopy.labels[locale][kind];
  const path = record ? `${basePath}/${record.slug}` : basePath;
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": record ? "WebPage" : "CollectionPage",
      "@id": absoluteUrl(`${path}#webpage`),
      name: record?.title ?? discoveryHubCopy[locale][kind].title.replace("\n", " "),
      description: record?.summary ?? discoveryHubCopy[locale][kind].intro,
      url: absoluteUrl(path),
      inLanguage: localeConfig[locale].htmlLang,
      isPartOf: { "@id": absoluteUrl(`/${locale}#website`) },
      breadcrumb: { "@id": absoluteUrl(`${path}#breadcrumb`) },
    },
    {
      "@type": "BreadcrumbList",
      "@id": absoluteUrl(`${path}#breadcrumb`),
      itemListElement: [
        { "@type": "ListItem", position: 1, name: discoveryDetailCopy[locale].breadcrumbHome, item: absoluteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: label, item: absoluteUrl(basePath) },
        ...(record ? [{ "@type": "ListItem", position: 3, name: record.title, item: absoluteUrl(path) }] : []),
      ],
    },
  ];
  if (!record) {
    graph.push({
      "@type": "ItemList",
      itemListElement: records.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: absoluteUrl(`${basePath}/${item.slug}`) })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
