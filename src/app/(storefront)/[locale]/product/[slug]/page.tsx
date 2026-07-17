import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinematicProductExperience } from "@/components/cinematic-product-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { categoryCopy, categorySharedCopy, isCategorySlug } from "@/lib/category-content";
import { isLocale, localeConfig } from "@/lib/i18n";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";
import { getPublicRichPreviewRobots } from "@/lib/seo";
import { absoluteUrl, siteName } from "@/lib/site-content";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

function getProduct(locale: "ar" | "en", slug: string) {
  return getPublicCatalogSnapshot(locale).products.find(
    (product) => product.slug === slug,
  );
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: candidate, slug } = await params;
  if (!isLocale(candidate)) return {};
  const product = getProduct(candidate, slug);
  if (!product) return {};
  const canonical = `/${candidate}/product/${product.slug}`;
  return {
    title: product.name,
    description: product.subtitle,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `/ar/product/${product.slug}`,
        "en-SA": `/en/product/${product.slug}`,
        "x-default": `/ar/product/${product.slug}`,
      },
    },
    robots: getPublicRichPreviewRobots(),
    openGraph: {
      title: `${product.name} | ${siteName}`,
      description: product.subtitle,
      url: absoluteUrl(canonical),
      siteName,
      locale: localeConfig[candidate].ogLocale,
      alternateLocale: [localeConfig[candidate === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      images: product.media.map((media) => ({ url: absoluteUrl(media.url), alt: media.alt })),
    },
  };
}

export default async function LocalizedProductPage({ params }: PageProps) {
  const { locale: candidate, slug } = await params;
  if (!isLocale(candidate)) notFound();
  const product = getProduct(candidate, slug);
  if (!product) notFound();
  const path = `/${candidate}/product/${product.slug}`;

  // Home › Collection › Product — the reference wayfinding. The collection hop
  // links to its /shop/<slug> page when that page exists, otherwise to /shop.
  const shared = categorySharedCopy[candidate];
  const collectionSlug = product.collection;
  const collectionLabel = isCategorySlug(collectionSlug)
    ? categoryCopy[candidate][collectionSlug].title
    : shared.breadcrumbShop;
  const collectionHref = isCategorySlug(collectionSlug)
    ? `/${candidate}/shop/${collectionSlug}`
    : `/${candidate}/shop`;
  const breadcrumbItems = [
    { label: shared.breadcrumbHome, href: `/${candidate}` },
    { label: collectionLabel, href: collectionHref },
    { label: product.name },
  ];
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.subtitle,
    image: product.media.map((media) => absoluteUrl(media.url)),
    brand: { "@type": "Brand", name: product.brand },
    category: product.collection,
    url: absoluteUrl(path),
    inLanguage: localeConfig[candidate].htmlLang,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      sku: variant.sku,
      priceCurrency: "SAR",
      price: (variant.grossHalalas / 100).toFixed(2),
      availability: `https://schema.org/${variant.availability}`,
      url: absoluteUrl(path),
      itemCondition: "https://schema.org/NewCondition",
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbData) }} />
      <StorefrontShell
        activeHref={`/shop/${product.collection}`}
        locale={candidate}
        languageHref={`/${candidate === "ar" ? "en" : "ar"}/product/${product.slug}`}
      >
        <CinematicProductExperience product={product} locale={candidate} breadcrumb={breadcrumbItems} />
      </StorefrontShell>
    </>
  );
}
