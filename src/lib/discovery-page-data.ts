import type { Metadata } from "next";
import { discoveryDetailCopy, discoveryHubCopy, discoveryPaths, type DiscoveryKind, type DiscoveryRecord } from "@/lib/discovery-content";
import { localeConfig, type Locale } from "@/lib/i18n";
import { getPublicRichPreviewRobots } from "@/lib/seo";
import { absoluteUrl, siteName } from "@/lib/site-content";
import type { EditorialAuthorityContent } from "@/lib/site-editorial-authority";

type DiscoveryAuthorityView = {
  hubCopy: EditorialAuthorityContent["discoveryHubCopy"][Locale];
  detailCopy: EditorialAuthorityContent["discoveryDetailCopy"][Locale];
  labels: EditorialAuthorityContent["discoveryDetailCopy"]["labels"][Locale];
  visual: string;
  siteName: string;
};

const socialImages: Record<DiscoveryKind, { src: string; width: number; height: number }> = {
  concern: { src: "/elore-assets/editorial-skin-light-concept-1122w.avif", width: 1122, height: 1402 },
  routine: { src: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif", width: 1672, height: 941 },
  ingredient: { src: "/elore-assets/ingredient-botanical-lab-concept-1536x1024.avif", width: 1536, height: 1024 },
};

export function buildDiscoveryMetadata(locale: Locale, kind: DiscoveryKind, record?: DiscoveryRecord, authority?: DiscoveryAuthorityView): Metadata {
  const pathSegment = discoveryPaths[kind];
  const pathSuffix = record ? `/${record.slug}` : "";
  const canonical = `/${locale}/${pathSegment}${pathSuffix}`;
  const controlledSiteName = authority?.siteName ?? siteName;
  const hubCopy = authority?.hubCopy ?? discoveryHubCopy[locale];
  const title = record?.title ?? hubCopy[kind].title.replace("\n", " ");
  const description = record?.summary ?? hubCopy[kind].intro;
  const image = socialImages[kind];
  const imageUrl = authority?.visual ?? image.src;
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
    robots: getPublicRichPreviewRobots(),
    openGraph: {
      title: `${title} | ${controlledSiteName}`,
      description,
      url: absoluteUrl(canonical),
      siteName: controlledSiteName,
      locale: localeConfig[locale].ogLocale,
      alternateLocale: [localeConfig[locale === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      images: authority
        ? [{ url: absoluteUrl(imageUrl), alt: `${controlledSiteName} — ${title}` }]
        : [{ url: absoluteUrl(imageUrl), width: image.width, height: image.height, alt: `${controlledSiteName} — ${title}` }],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${controlledSiteName}`, description, images: [absoluteUrl(imageUrl)] },
  };
}

export function buildDiscoverySchema(locale: Locale, kind: DiscoveryKind, records: DiscoveryRecord[], record?: DiscoveryRecord, authority?: DiscoveryAuthorityView) {
  const pathSegment = discoveryPaths[kind];
  const basePath = `/${locale}/${pathSegment}`;
  const detailCopy = authority?.detailCopy ?? discoveryDetailCopy[locale];
  const hubCopy = authority?.hubCopy ?? discoveryHubCopy[locale];
  const label = authority?.labels[kind] ?? discoveryDetailCopy.labels[locale][kind];
  const path = record ? `${basePath}/${record.slug}` : basePath;
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": record ? "WebPage" : "CollectionPage",
      "@id": absoluteUrl(`${path}#webpage`),
      name: record?.title ?? hubCopy[kind].title.replace("\n", " "),
      description: record?.summary ?? hubCopy[kind].intro,
      url: absoluteUrl(path),
      inLanguage: localeConfig[locale].htmlLang,
      isPartOf: { "@id": absoluteUrl(`/${locale}#website`) },
      breadcrumb: { "@id": absoluteUrl(`${path}#breadcrumb`) },
    },
    {
      "@type": "BreadcrumbList",
      "@id": absoluteUrl(`${path}#breadcrumb`),
      itemListElement: [
        { "@type": "ListItem", position: 1, name: detailCopy.breadcrumbHome, item: absoluteUrl(`/${locale}`) },
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
