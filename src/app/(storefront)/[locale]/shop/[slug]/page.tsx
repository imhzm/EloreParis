import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedCategoryStage } from "@/components/localized-category-stage";
import { StorefrontShell } from "@/components/storefront-shell";
import { categoryCopy, categorySharedCopy, categorySlugs, isCategorySlug } from "@/lib/category-content";
import { isLocale, localeConfig, locales } from "@/lib/i18n";
import { getPublicRichPreviewRobots } from "@/lib/seo";
import { absoluteUrl, siteName } from "@/lib/site-content";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

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
        <LocalizedCategoryStage locale={candidate} slug={slug} />
      </StorefrontShell>
    </>
  );
}
