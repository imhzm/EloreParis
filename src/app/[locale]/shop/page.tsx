import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinematicShopAtlasStage } from "@/components/cinematic-shop-atlas-stage";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, localeConfig } from "@/lib/i18n";
import { publicRichPreviewRobots } from "@/lib/seo";
import { absoluteUrl, siteName } from "@/lib/site-content";
import { shopCopy } from "@/lib/shop-content";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};

  const copy = shopCopy[candidate].metadata;
  const canonical = `/${candidate}/shop`;
  const socialImage = absoluteUrl("/opengraph-image");
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
    robots: publicRichPreviewRobots,
    openGraph: {
      title: `${copy.title} | ${siteName}`,
      description: copy.description,
      url: absoluteUrl(canonical),
      siteName,
      locale: localeConfig[candidate].ogLocale,
      alternateLocale: [localeConfig[candidate === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${siteName} — ${copy.title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | ${siteName}`,
      description: copy.description,
      images: [socialImage],
    },
  };
}

export default async function LocalizedShopPage({ params }: PageProps) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();

  const copy = shopCopy[candidate].metadata;
  const publicCatalog = getPublicCatalogSnapshot(candidate);
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
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <StorefrontShell activeHref="/shop" locale={candidate} languageHref={`/${candidate === "ar" ? "en" : "ar"}/shop`}>
        <CinematicShopAtlasStage locale={candidate} products={publicCatalog.products} />
      </StorefrontShell>
    </>
  );
}
