import type { PublicCatalogProduct } from "@/lib/public-catalog-types";

export type RitualSelection = {
  questionId: string;
  answerId: string;
  label: string;
  collections: readonly PublicCatalogProduct["collection"][];
  keywords: readonly string[];
};

export type RitualRecommendation = {
  product: PublicCatalogProduct;
  score: number;
  reasons: string[];
};

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function approvedSearchText(product: PublicCatalogProduct) {
  return normalize([
    product.collection,
    product.name,
    product.subtitle,
    product.brand,
    product.finish,
    product.directions ?? "",
    ...product.approvedClaims,
    ...product.merchandising.tags,
    ...product.merchandising.concerns,
    ...product.merchandising.routines,
    ...product.merchandising.benefits,
    product.merchandising.fragrance?.family ?? "",
    product.merchandising.fragrance?.concentration ?? "",
    ...(product.merchandising.fragrance?.topNotes ?? []),
    ...(product.merchandising.fragrance?.heartNotes ?? []),
    ...(product.merchandising.fragrance?.baseNotes ?? []),
  ].join(" "));
}

/**
 * Rank only the public catalogue projection. The function deliberately knows
 * nothing about draft authority records and never synthesises product claims.
 * Equal scores are resolved by slug so the same answers always return the same
 * order on every device.
 */
export function recommendRitualProducts(
  products: readonly PublicCatalogProduct[],
  selections: readonly RitualSelection[],
  locale: "ar" | "en",
  limit = 3,
): RitualRecommendation[] {
  const text = locale === "ar"
    ? {
        choice: "يتوافق مع اختيارك",
        finish: "القوام المنشور",
        available: "متاح وفق حالة المخزون المنشورة",
      }
    : {
        choice: "Aligned with your choice",
        finish: "Published finish",
        available: "Available in the published inventory",
      };

  return products
    .map((product) => {
      const searchText = approvedSearchText(product);
      let affinityScore = 0;
      const reasons: string[] = [];

      for (const selection of selections) {
        const collectionMatch = selection.collections.includes(product.collection);
        const keywordMatches = selection.keywords.reduce(
          (count, keyword) => count + (searchText.includes(normalize(keyword)) ? 1 : 0),
          0,
        );

        if (collectionMatch) {
          affinityScore += selection.questionId === "focus" ? 20 : 3;
        }
        affinityScore += Math.min(keywordMatches, 3) * 2;

        if ((collectionMatch || keywordMatches > 0) && reasons.length < 2) {
          reasons.push(`${text.choice}: ${selection.label}`);
        }
      }

      if (affinityScore === 0) return null;

      const hasInStockVariant = product.variants.some(
        (variant) => variant.availability === "InStock",
      );
      const inventoryScore = hasInStockVariant ? 2 : 0;

      if (product.finish.trim()) {
        reasons.push(`${text.finish}: ${product.finish}`);
      }
      if (hasInStockVariant) {
        reasons.push(text.available);
      }

      return {
        product,
        score: affinityScore + inventoryScore,
        reasons: [...new Set(reasons)].slice(0, 3),
      } satisfies RitualRecommendation;
    })
    .filter((item): item is RitualRecommendation => item !== null)
    .sort((left, right) => right.score - left.score || left.product.slug.localeCompare(right.product.slug))
    .slice(0, Math.max(0, limit));
}
