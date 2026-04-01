import type { MetadataRoute } from "next";
import {
  concerns,
  ingredients,
  journalArticles,
  products,
  routines,
  siteUrl,
  trustPolicies,
} from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/about",
    "/contact",
    "/concerns",
    "/faq",
    "/ingredients",
    "/routines",
    "/shop/skincare",
    "/shop/makeup",
    "/journal",
    "/terms",
    "/trust",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: "2026-04-01",
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
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
    ...articlePages,
    ...concernPages,
    ...ingredientPages,
    ...routinePages,
    ...productPages,
    ...trustPolicyPages,
  ];
}
