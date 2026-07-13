import type { Metadata } from "next";
import { CinematicCategoryExperience } from "@/components/cinematic-category-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { getCollectionFilterState, hasActiveCollectionFilters, type CollectionFilterSearchParams } from "@/lib/collection-filters";
import { absoluteUrl, products, skincareCategory } from "@/lib/site-content";
import { publicRichPreviewRobots } from "@/lib/seo";

type PageProps = { searchParams: Promise<CollectionFilterSearchParams> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const collectionProducts = products.filter((product) => product.collection === "skincare");
  const state = getCollectionFilterState("/shop/skincare", collectionProducts, params);
  const summary = state.activeFilters.map((filter) => filter.value).join(" | ");
  return {
    title: summary ? `${skincareCategory.title} | ${summary}` : skincareCategory.title,
    description: skincareCategory.description,
    alternates: { canonical: "/shop/skincare" },
    robots: hasActiveCollectionFilters(params) ? { index: false, follow: true } : publicRichPreviewRobots,
  };
}

export default async function SkincarePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const collectionProducts = products.filter((product) => product.collection === "skincare");
  const filterState = getCollectionFilterState("/shop/skincare", collectionProducts, params);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: skincareCategory.title, url: absoluteUrl("/shop/skincare"), description: skincareCategory.description, inLanguage: "ar-SA" },
      { "@type": "ItemList", itemListElement: filterState.filteredProducts.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.name, url: absoluteUrl(`/products/${product.slug}`) })) },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><StorefrontShell activeHref="/shop/skincare"><CinematicCategoryExperience variant="skincare" title={skincareCategory.title} subtitle={skincareCategory.subtitle} description={skincareCategory.description} filterState={filterState} /></StorefrontShell></>;
}
