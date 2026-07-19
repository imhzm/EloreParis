"use server";

import { searchSiteContent } from "@/lib/search";
import type { Locale } from "@/lib/i18n";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";

export async function predictSearch(query: string, locale: Locale = "ar") {
  if (!query || query.trim().length < 2) {
    return { total: 0, topResults: [] };
  }

  const publicCatalog = getPublicCatalogSnapshot(locale);
  const results = searchSiteContent(query, locale, publicCatalog.products);

  return {
    total: results.total,
    topResults: results.ordered.slice(0, 5),
  };
}
