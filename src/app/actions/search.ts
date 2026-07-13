"use server";

import { searchSiteContent } from "@/lib/search";

export async function predictSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return { total: 0, topResults: [] };
  }

  const results = searchSiteContent(query);

  // Flatten and grab top results for predictive dropdown
  const allResults = [
    ...results.groups.collection,
    ...results.groups.product,
    ...results.groups.concern,
    ...results.groups.ingredient,
    ...results.groups.routine,
    ...results.groups.article,
  ];

  return {
    total: results.total,
    topResults: allResults.slice(0, 5),
  };
}
