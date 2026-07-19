import { categoryCopy, categorySlugs, type CategorySlug } from "@/lib/category-content";
import {
  discoveryPaths,
  discoveryRecords,
  type DiscoveryKind,
} from "@/lib/discovery-content";
import { localizePath, type Locale } from "@/lib/i18n";
import { journalContent } from "@/lib/journal-content";
import { journalSlugs } from "@/lib/journal-routing";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";

export type SearchResultKind =
  | "collection"
  | "product"
  | "concern"
  | "ingredient"
  | "routine"
  | "article";

export type SearchResult = {
  kind: SearchResultKind;
  slug: string;
  href: string;
  title: string;
  description: string;
  collection: CategorySlug;
  eyebrow: string;
  metadata: string;
};

type SearchRecord = SearchResult & {
  priority: number;
  searchText: string;
};

type PopularSearch = { label: string; query: string; slug: string };

export const popularSearchQueriesByLocale: Record<Locale, PopularSearch[]> = {
  ar: [
    { label: "روتين صباحي", query: "روتين صباحي", slug: "morning_routine" },
    { label: "ثبات المكياج", query: "ثبات المكياج", slug: "makeup_longwear" },
    { label: "نياسيناميد", query: "نياسيناميد", slug: "niacinamide" },
    { label: "العناية بالشعر", query: "العناية بالشعر", slug: "haircare" },
    { label: "قوام العناية بالجسم", query: "قوام الجسم", slug: "body_texture" },
    { label: "قراءة المكونات", query: "المكونات", slug: "ingredient_reading" },
  ],
  en: [
    { label: "Morning ritual", query: "morning ritual", slug: "morning_routine" },
    { label: "Makeup longevity", query: "makeup longevity", slug: "makeup_longwear" },
    { label: "Niacinamide", query: "niacinamide", slug: "niacinamide" },
    { label: "Hair care", query: "hair care", slug: "haircare" },
    { label: "Body-care texture", query: "body texture", slug: "body_texture" },
    { label: "Reading ingredients", query: "ingredients", slug: "ingredient_reading" },
  ],
};

// Kept for the legacy Arabic route while /search redirects to /ar/search.
export const popularSearchQueries = popularSearchQueriesByLocale.ar;

const synonymGroups = [
  ["skincare", "skin care", "العناية بالبشرة", "عناية بالبشرة", "بشرة", "بشره"],
  ["makeup", "make up", "مكياج", "ميك اب"],
  ["haircare", "hair care", "العناية بالشعر", "عناية بالشعر", "شعر", "هير كير"],
  ["bodycare", "body care", "body texture", "العناية بالجسم", "قوام الجسم", "جسم"],
  ["tools", "beauty tools", "الأدوات", "فرش", "ادوات"],
  ["beauty sets", "gift set", "gifting", "مجموعات", "هدايا"],
  ["routine", "ritual", "روتين", "طقس"],
  ["pigmentation", "uneven tone", "تصبغات", "بقع", "تفاوت اللون"],
  ["makeup longevity", "longwear", "long wear", "ثبات", "ثبات المكياج"],
  ["vitamin c", "فيتامين c", "فيتامين سي"],
  ["niacinamide", "نياسيناميد"],
  ["hyaluronic acid", "hyaluronic", "هيالورونيك", "هيالورونيك اسيد"],
  ["panthenol", "بانثينول"],
  ["shea butter", "زبدة الشيا"],
  ["ingredient", "ingredients", "مكون", "مكوّن", "المكونات"],
];

const discoveryCollectionBySlug: Record<string, CategorySlug> = {
  pigmentation: "skincare",
  "makeup-longwear": "makeup",
  "morning-routine-oily-skin": "skincare",
  "occasion-base-routine": "makeup",
  "humidity-proof-hair-routine": "haircare",
  "after-shower-body-routine": "bodycare",
  niacinamide: "skincare",
  "vitamin-c": "skincare",
  "hyaluronic-acid": "skincare",
  panthenol: "haircare",
  "shea-butter": "bodycare",
};

const journalCollectionBySlug: Record<string, CategorySlug> = {
  "morning-ritual-for-hot-weather": "skincare",
  "uneven-tone-without-overcomplication": "skincare",
  "makeup-longevity-without-heavy-layers": "makeup",
  "post-wash-hair-rhythm-in-humidity": "haircare",
  "after-shower-bodycare-by-texture": "bodycare",
  "read-an-ingredient-before-you-choose": "skincare",
};

function normalizeArabic(text: string) {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");
}

export function normalizeSearchText(value: string) {
  return normalizeArabic(value)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSearchTokens(value: string) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function expandSearchTerms(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = splitSearchTokens(query).filter((token) => token.length >= 2);
  const expandedTerms = new Set([normalizedQuery, ...queryTokens]);

  for (const group of synonymGroups) {
    const normalizedGroup = group.map(normalizeSearchText);
    const matches = normalizedGroup.some(
      (term) =>
        term.includes(normalizedQuery) ||
        normalizedQuery.includes(term) ||
        queryTokens.some((token) => term.includes(token) || token.includes(term)),
    );
    if (matches) normalizedGroup.forEach((term) => expandedTerms.add(term));
  }

  return Array.from(expandedTerms).filter(Boolean);
}

function createCategoryRecords(locale: Locale): SearchRecord[] {
  return categorySlugs.map((slug) => {
    const record = categoryCopy[locale][slug];
    return {
      kind: "collection",
      slug,
      href: localizePath(locale, `/shop/${slug}`),
      title: record.title,
      description: record.description,
      collection: slug,
      eyebrow: record.eyebrow,
      metadata: locale === "ar" ? "فئة جمال" : "Beauty category",
      priority: 4,
      searchText: [
        record.title,
        record.eyebrow,
        record.description,
        ...record.principles.flat(),
        ...record.routes.flatMap(([title, description]) => [title, description]),
      ].join(" "),
    };
  });
}

function createDiscoveryRecords(locale: Locale): SearchRecord[] {
  return (["concern", "routine", "ingredient"] as const).flatMap((kind) =>
    discoveryRecords[locale][kind].map((record) => ({
      kind,
      slug: record.slug,
      href: localizePath(locale, `/${discoveryPaths[kind]}/${record.slug}`),
      title: record.title,
      description: record.summary,
      collection: discoveryCollectionBySlug[record.slug] ?? "skincare",
      eyebrow: record.subtitle,
      metadata: getKindLabel(locale, kind),
      priority: 5,
      searchText: [
        record.title,
        record.subtitle,
        record.summary,
        ...record.signals,
        ...record.chapters.flat(),
        ...record.watchouts,
        ...record.faqs.flat(),
      ].join(" "),
    })),
  );
}

function createJournalRecords(locale: Locale): SearchRecord[] {
  return journalSlugs.map((slug) => {
    const record = journalContent[locale][slug];
    return {
      kind: "article",
      slug,
      href: localizePath(locale, `/journal/${slug}`),
      title: record.title.replace("\n", " "),
      description: record.summary,
      collection: journalCollectionBySlug[slug] ?? "skincare",
      eyebrow: record.eyebrow,
      metadata: record.readingLabel,
      priority: 3,
      searchText: [
        record.title,
        record.category,
        record.eyebrow,
        record.summary,
        record.answer,
        ...record.sections.flatMap(({ title, body }) => [title, body]),
        ...record.takeaways,
        ...record.faqs.flat(),
      ].join(" "),
    };
  });
}

function formatProductPrice(product: PublicCatalogProduct, locale: Locale) {
  const prices = product.variants.map((variant) => variant.price);
  const minimumPrice = Math.min(...prices);
  const hasPriceRange = prices.some((price) => price !== minimumPrice);
  const formattedPrice = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(minimumPrice);

  return hasPriceRange
    ? `${locale === "ar" ? "من" : "From"} ${formattedPrice}`
    : formattedPrice;
}

function createProductRecords(
  locale: Locale,
  approvedProducts: readonly PublicCatalogProduct[],
): SearchRecord[] {
  return approvedProducts
    .filter((product) => product.media.length > 0 && product.variants.length > 0)
    .map((product) => ({
      kind: "product" as const,
      slug: product.slug,
      href: localizePath(locale, `/product/${product.slug}`),
      title: product.name,
      description: product.subtitle,
      collection: product.collection,
      eyebrow: product.brand,
      metadata: formatProductPrice(product, locale),
      priority: 8,
      searchText: [
        product.name,
        product.subtitle,
        product.brand,
        product.finish,
        product.ingredientsInci ?? "",
        product.directions ?? "",
        ...product.approvedClaims,
        ...product.variants.flatMap((variant) => [variant.sku, variant.label, variant.size]),
      ].join(" "),
    }));
}

function getKindLabel(locale: Locale, kind: DiscoveryKind) {
  const labels: Record<Locale, Record<DiscoveryKind, string>> = {
    ar: { concern: "حسب الاحتياج", routine: "روتين", ingredient: "مكوّن" },
    en: { concern: "By concern", routine: "Ritual", ingredient: "Ingredient" },
  };
  return labels[locale][kind];
}

function createSearchRecords(
  locale: Locale,
  approvedProducts: readonly PublicCatalogProduct[],
) {
  return [
    ...createProductRecords(locale, approvedProducts),
    ...createCategoryRecords(locale),
    ...createDiscoveryRecords(locale),
    ...createJournalRecords(locale),
  ];
}

function getRecordScore(record: SearchRecord, query: string, expandedTerms: string[]) {
  const haystack = normalizeSearchText(record.searchText);
  const title = normalizeSearchText(record.title);
  const queryTokens = splitSearchTokens(query);
  let score = 0;

  if (title.includes(query)) score += 8;
  if (haystack.includes(query)) score += 5;
  if (queryTokens.length > 1 && queryTokens.every((token) => haystack.includes(token))) score += 3;

  for (const term of expandedTerms) {
    if (!term || term === query) continue;
    if (title.includes(term)) score += 3;
    else if (haystack.includes(term)) score += 1;
  }

  return score + record.priority;
}

function createEmptyGroups(): Record<SearchResultKind, SearchResult[]> {
  return { collection: [], product: [], concern: [], ingredient: [], routine: [], article: [] };
}

export function searchSiteContent(
  rawQuery: string,
  locale: Locale = "ar",
  approvedProducts: readonly PublicCatalogProduct[] = [],
) {
  const query = rawQuery.trim().slice(0, 120);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return { query, normalizedQuery, total: 0, ordered: [] as SearchResult[], groups: createEmptyGroups() };

  const expandedTerms = expandSearchTerms(query);
  const rankedResults = createSearchRecords(locale, approvedProducts)
    .map((record) => ({ record, score: getRecordScore(record, normalizedQuery, expandedTerms) }))
    .filter(({ record, score }) => score > record.priority)
    .sort((left, right) =>
      right.score !== left.score
        ? right.score - left.score
        : left.record.title.localeCompare(right.record.title, locale),
    )
    .map(({ record }) => record);

  const groups = rankedResults.reduce<Record<SearchResultKind, SearchResult[]>>(
    (accumulator, result) => {
      accumulator[result.kind].push(result);
      return accumulator;
    },
    createEmptyGroups(),
  );

  return { query, normalizedQuery, total: rankedResults.length, ordered: rankedResults, groups };
}
