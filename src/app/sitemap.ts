import type { MetadataRoute } from "next";
import { isSearchIndexingEnabled } from "@/lib/search-visibility";
import {
  concerns,
  ingredients,
  journalArticles,
  products,
  routines,
  shopCollections,
  siteUrl,
  trustPolicies,
} from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSearchIndexingEnabled()) {
    return [];
  }

  const staticPages = [
    "",
    "/about",
    "/contact",
    "/concerns",
    "/faq",
    "/ingredients",
    "/routines",
    "/shop",
    "/journal",
    "/terms",
    "/trust",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: "2026-04-01",
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const collectionPages = shopCollections.map((collection) => ({
    url: `${siteUrl}${collection.href}`,
    lastModified: "2026-04-01",
    changeFrequency: "weekly" as const,
    priority: collection.mode === "filtered" ? 0.84 : 0.74,
  }));

  const articlePages = journalArticles.map((article) => ({
    url: `${siteUrl}/journal/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));

  const concernPages = concerns.map((concern) => ({
    url: `${siteUrl}/concerns/${concern.slug}`,
    lastModified: "2026-04-01",
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  const routinePages = routines.map((routine) => ({
    url: `${siteUrl}/routines/${routine.slug}`,
    lastModified: "2026-04-01",
    changeFrequency: "weekly" as const,
    priority: 0.78,
  }));

  const ingredientPages = ingredients.map((ingredient) => ({
    url: `${siteUrl}/ingredients/${ingredient.slug}`,
    lastModified: "2026-04-01",
    changeFrequency: "weekly" as const,
    priority: 0.76,
  }));

  const productPages = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    lastModified: "2026-04-01",
    changeFrequency: "weekly" as const,
    priority: 0.84,
  }));

  const trustPolicyPages = trustPolicies.map((policy) => ({
    url: `${siteUrl}/trust/${policy.slug}`,
    lastModified: "2026-04-01",
    changeFrequency: "monthly" as const,
    priority: 0.68,
  }));

  return [
    ...staticPages,
    ...collectionPages,
    ...articlePages,
    ...concernPages,
    ...ingredientPages,
    ...routinePages,
    ...productPages,
    ...trustPolicyPages,
  ];
}
