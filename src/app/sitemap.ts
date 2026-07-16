import type { MetadataRoute } from "next";
import { categorySlugs } from "@/lib/category-content";
import { discoveryPaths, discoveryRecords, type DiscoveryKind } from "@/lib/discovery-content";
import { isSearchIndexingEnabled } from "@/lib/search-visibility";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";
import { getSiteUrl } from "@/lib/site-content";
import { supportSlugs, trustSlugs } from "@/lib/trust-support-content";
import { journalSlugs } from "@/lib/journal-routing";

export const dynamic = "force-dynamic";

// Bump deliberately when public copy is revised. Kept in one place so the value
// cannot drift between surfaces, and never derived from `Date.now()` — a
// sitemap that claims every page changed on every request is not a signal.
const CONTENT_REVISION_DATE = "2026-07-16";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSearchIndexingEnabled()) {
    return [];
  }

  const siteUrl = getSiteUrl();

  const localizedCorePages = ["/ar", "/en", "/ar/shop", "/en/shop"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: CONTENT_REVISION_DATE,
    changeFrequency: "weekly" as const,
    priority: path === "/ar" || path === "/en" ? 1 : 0.86,
    alternates: {
      languages: path.endsWith("/shop")
        ? { "ar-SA": `${siteUrl}/ar/shop`, "en-SA": `${siteUrl}/en/shop`, "x-default": `${siteUrl}/ar/shop` }
        : { "ar-SA": `${siteUrl}/ar`, "en-SA": `${siteUrl}/en`, "x-default": `${siteUrl}/ar` },
    },
  }));

  const collectionPages = categorySlugs.flatMap((slug) => ["ar", "en"].map((locale) => ({
    url: `${siteUrl}/${locale}/shop/${slug}`,
    lastModified: CONTENT_REVISION_DATE,
    changeFrequency: "weekly" as const,
    priority: 0.82,
    alternates: {
      languages: {
        "ar-SA": `${siteUrl}/ar/shop/${slug}`,
        "en-SA": `${siteUrl}/en/shop/${slug}`,
        "x-default": `${siteUrl}/ar/shop/${slug}`,
      },
    },
  })));

  const discoveryPages = (Object.keys(discoveryPaths) as DiscoveryKind[]).flatMap((kind) => {
    const pathSegment = discoveryPaths[kind];
    return (["ar", "en"] as const).flatMap((locale) => {
      const paths = [
        `/${locale}/${pathSegment}`,
        ...discoveryRecords[locale][kind].map((record) => `/${locale}/${pathSegment}/${record.slug}`),
      ];
      return paths.map((path) => {
        const alternateSuffix = path.replace(`/${locale}`, "");
        return {
          url: `${siteUrl}${path}`,
          lastModified: CONTENT_REVISION_DATE,
          changeFrequency: "monthly" as const,
          priority: path === `/${locale}/${pathSegment}` ? 0.8 : 0.74,
          alternates: {
            languages: {
              "ar-SA": `${siteUrl}/ar${alternateSuffix}`,
              "en-SA": `${siteUrl}/en${alternateSuffix}`,
              "x-default": `${siteUrl}/ar${alternateSuffix}`,
            },
          },
        };
      });
    });
  });

  const productSlugs = new Set(
    (["ar", "en"] as const).flatMap((locale) =>
      getPublicCatalogSnapshot(locale).products.map((product) => product.slug),
    ),
  );
  const productPages = [...productSlugs].flatMap((slug) =>
    (["ar", "en"] as const).map((locale) => ({
      url: `${siteUrl}/${locale}/product/${slug}`,
      lastModified: CONTENT_REVISION_DATE,
      changeFrequency: "weekly" as const,
      priority: 0.84,
      alternates: {
        languages: {
          "ar-SA": `${siteUrl}/ar/product/${slug}`,
          "en-SA": `${siteUrl}/en/product/${slug}`,
          "x-default": `${siteUrl}/ar/product/${slug}`,
        },
      },
    })),
  );

  const trustSupportPages = (["ar", "en"] as const).flatMap((locale) => {
    const paths = [
      "/trust",
      ...trustSlugs.map((slug) => `/trust/${slug}`),
      ...supportSlugs.map((slug) => `/${slug}`),
    ];
    return paths.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: CONTENT_REVISION_DATE,
      changeFrequency: "monthly" as const,
      priority: path === "/trust" ? 0.76 : 0.66,
      alternates: { languages: { "ar-SA": `${siteUrl}/ar${path}`, "en-SA": `${siteUrl}/en${path}`, "x-default": `${siteUrl}/ar${path}` } },
    }));
  });

  const journalPages = (["ar", "en"] as const).flatMap((locale) =>
    ["/journal", ...journalSlugs.map((slug) => `/journal/${slug}`)].map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: CONTENT_REVISION_DATE,
      changeFrequency: "monthly" as const,
      priority: path === "/journal" ? 0.78 : 0.7,
      alternates: { languages: { "ar-SA": `${siteUrl}/ar${path}`, "en-SA": `${siteUrl}/en${path}`, "x-default": `${siteUrl}/ar${path}` } },
    })),
  );

  return [
    ...localizedCorePages,
    ...collectionPages,
    ...discoveryPages,
    ...productPages,
    ...trustSupportPages,
    ...journalPages,
  ];
}
