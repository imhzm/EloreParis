import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinematicShopAtlasStage } from "@/components/cinematic-shop-atlas-stage";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, localeConfig } from "@/lib/i18n";
import { getPublicRichPreviewRobots } from "@/lib/seo";
import { absoluteUrl, serializeJsonLd, siteName } from "@/lib/site-content";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";
import { getEffectiveShopContent, getEffectiveSiteContent } from "@/lib/site-content-authority";

// This page reads the approved catalogue out of the authority database, which
// is runtime state: an operator publishing an import must be reflected without
// a rebuild. Prerendering it would freeze whatever the catalogue held at build
// time — an empty shelf — and no publication would ever appear.
//
// The rest of the storefront is authored content and stays prerendered; this is
// the deliberate exception, alongside the catalogue-backed product route.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};

  const content = getEffectiveSiteContent();
  const copy = content.editorial.shop[candidate].metadata;
  const controlledSiteName = content.identity.siteName || siteName;
  const canonical = `/${candidate}/shop`;
  const socialImage = absoluteUrl("/api/social-card");
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": "/ar/shop",
        "en-SA": "/en/shop",
        "x-default": "/ar/shop",
      },
    },
    robots: getPublicRichPreviewRobots(),
    openGraph: {
      title: `${copy.title} | ${controlledSiteName}`,
      description: copy.description,
      url: absoluteUrl(canonical),
      siteName: controlledSiteName,
      locale: localeConfig[candidate].ogLocale,
      alternateLocale: [localeConfig[candidate === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${controlledSiteName} — ${copy.title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | ${controlledSiteName}`,
      description: copy.description,
      images: [socialImage],
    },
  };
}

export default async function LocalizedShopPage({ params }: PageProps) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();

  const shopContent = getEffectiveShopContent(candidate);
  const copy = shopContent.metadata;
  const publicCatalog = getPublicCatalogSnapshot(candidate);
  const publishedProducts = publicCatalog.products;
  const path = `/${candidate}/shop`;
  const homePath = `/${candidate}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absoluteUrl(`${path}#webpage`),
        name: copy.pageName,
        description: copy.pageDescription,
        url: absoluteUrl(path),
        inLanguage: localeConfig[candidate].htmlLang,
        isPartOf: { "@id": absoluteUrl(`${homePath}#website`) },
        breadcrumb: { "@id": absoluteUrl(`${path}#breadcrumb`) },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absoluteUrl(`${path}#breadcrumb`),
        itemListElement: [
          { "@type": "ListItem", position: 1, name: copy.home, item: absoluteUrl(homePath) },
          { "@type": "ListItem", position: 2, name: copy.shop, item: absoluteUrl(path) },
        ],
      },
      ...(publishedProducts.length > 0
        ? [
            {
              "@type": "ItemList",
              "@id": absoluteUrl(`${path}#products`),
              numberOfItems: publishedProducts.length,
              itemListElement: publishedProducts.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: product.name,
                url: absoluteUrl(`/${candidate}/product/${product.slug}`),
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <StorefrontShell activeHref="/shop" locale={candidate} languageHref={`/${candidate === "ar" ? "en" : "ar"}/shop`}>
        <CinematicShopAtlasStage locale={candidate} products={publishedProducts} content={shopContent} />
      </StorefrontShell>
    </>
  );
}
