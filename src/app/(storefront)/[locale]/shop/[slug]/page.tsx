import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionGridExperience } from "@/components/collection-grid-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { categoryCopy, categorySharedCopy, categorySlugs, isCategorySlug } from "@/lib/category-content";
import { isLocale, localeConfig, locales } from "@/lib/i18n";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";
import { getPublicRichPreviewRobots } from "@/lib/seo";
import { absoluteUrl, siteName } from "@/lib/site-content";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

// The collection grid reads the live approved catalogue, so it must render at
// request time, not be baked at build (when the catalogue gate is shut and the
// grid would prerender its empty state). generateStaticParams still whitelists
// the seven category slugs for the layout's dynamicParams:false.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.flatMap((locale) => categorySlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: candidate, slug } = await params;
  if (!isLocale(candidate) || !isCategorySlug(slug)) return {};

  const copy = categoryCopy[candidate][slug];
  const shared = categorySharedCopy[candidate];
  const canonical = `/${candidate}/shop/${slug}`;
  const socialImage = absoluteUrl(copy.image);
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `/ar/shop/${slug}`,
        "en-SA": `/en/shop/${slug}`,
        "x-default": `/ar/shop/${slug}`,
      },
    },
    robots: getPublicRichPreviewRobots(),
    openGraph: {
      title: `${copy.title} | ${shared.metadataSuffix}`,
      description: copy.description,
      url: absoluteUrl(canonical),
      siteName,
      locale: localeConfig[candidate].ogLocale,
      alternateLocale: [localeConfig[candidate === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: copy.imageAlt }],
    },
    twitter: { card: "summary_large_image", title: `${copy.title} | ${siteName}`, description: copy.description, images: [socialImage] },
  };
}

export default async function LocalizedCategoryPage({ params }: PageProps) {
  const { locale: candidate, slug } = await params;
  if (!isLocale(candidate) || !isCategorySlug(slug)) notFound();

  const copy = categoryCopy[candidate][slug];
  const shared = categorySharedCopy[candidate];
  const path = `/${candidate}/shop/${slug}`;
  // The reference collection page is a product grid. Pull the approved catalogue
  // and keep the items whose collection matches this category. Perfumes is an
  // editorial-only category (no CatalogCollection), so it resolves to an empty
  // grid — the component renders an honest awaiting-catalogue state.
  const products = getPublicCatalogSnapshot(candidate).products.filter(
    (product) => product.collection === slug,
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absoluteUrl(`${path}#webpage`),
        name: copy.title,
        description: copy.description,
        url: absoluteUrl(path),
        inLanguage: localeConfig[candidate].htmlLang,
        isPartOf: { "@id": absoluteUrl(`/${candidate}#website`) },
        breadcrumb: { "@id": absoluteUrl(`${path}#breadcrumb`) },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absoluteUrl(`${path}#breadcrumb`),
        itemListElement: [
          { "@type": "ListItem", position: 1, name: shared.breadcrumbHome, item: absoluteUrl(`/${candidate}`) },
          { "@type": "ListItem", position: 2, name: shared.breadcrumbShop, item: absoluteUrl(`/${candidate}/shop`) },
          { "@type": "ListItem", position: 3, name: copy.title, item: absoluteUrl(path) },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <StorefrontShell activeHref={`/shop/${slug}`} locale={candidate} languageHref={`/${candidate === "ar" ? "en" : "ar"}/shop/${slug}`}>
        <CollectionGridExperience
          locale={candidate}
          slug={slug}
          hero={{ title: copy.title, eyebrow: copy.eyebrow, description: copy.description, image: copy.image, imageAlt: copy.imageAlt }}
          products={products}
        />
      </StorefrontShell>
    </>
  );
}
