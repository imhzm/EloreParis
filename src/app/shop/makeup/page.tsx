import type { Metadata } from "next";
import { CinematicCategoryExperience } from "@/components/cinematic-category-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { getCollectionFilterState, hasActiveCollectionFilters, type CollectionFilterSearchParams } from "@/lib/collection-filters";
import { absoluteUrl, makeupCategory, products } from "@/lib/site-content";
import { publicRichPreviewRobots } from "@/lib/seo";

type PageProps = { searchParams: Promise<CollectionFilterSearchParams> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const collectionProducts = products.filter((product) => product.collection === "makeup");
  const state = getCollectionFilterState("/shop/makeup", collectionProducts, params);
  const summary = state.activeFilters.map((filter) => filter.value).join(" | ");
  const title = summary ? `${makeupCategory.title} | ${summary}` : makeupCategory.title;
  const imageUrl = absoluteUrl("/brand-assets/product-05.jpg");

  return {
    title,
    description: makeupCategory.description,
    alternates: { canonical: "/shop/makeup" },
    robots: hasActiveCollectionFilters(params) ? { index: false, follow: true } : publicRichPreviewRobots,
    openGraph: {
      title,
      description: makeupCategory.description,
      url: absoluteUrl("/shop/makeup"),
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: makeupCategory.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: makeupCategory.description,
      images: [imageUrl],
    },
  };
}

export default async function MakeupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const collectionProducts = products.filter((product) => product.collection === "makeup");
  const filterState = getCollectionFilterState("/shop/makeup", collectionProducts, params);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: makeupCategory.title, url: absoluteUrl("/shop/makeup"), description: makeupCategory.description, inLanguage: "ar-SA" },
      { "@type": "ItemList", itemListElement: filterState.filteredProducts.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.name, url: absoluteUrl(`/products/${product.slug}`) })) },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><StorefrontShell activeHref="/shop/makeup"><CinematicCategoryExperience variant="makeup" title={makeupCategory.title} subtitle={makeupCategory.subtitle} description={makeupCategory.description} filterState={filterState} /></StorefrontShell></>;
}
