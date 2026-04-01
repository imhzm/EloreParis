import {
  collectionDirectory,
  concerns,
  ingredients,
  journalArticles,
  makeupCategory,
  products,
  routines,
  skincareCategory,
  type CollectionSlug,
} from "@/lib/site-content";

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
  collection: CollectionSlug;
  eyebrow: string;
  metadata: string;
};

type SearchRecord = SearchResult & {
  priority: number;
  searchText: string;
};

export const popularSearchQueries = [
  { label: "فاونديشن مخملي", query: "فاونديشن مخملي", slug: "foundation_velvet" },
  { label: "فيتامين C", query: "فيتامين C", slug: "vitamin_c" },
  { label: "البشرة الدهنية", query: "البشرة الدهنية", slug: "oily_skin" },
  { label: "ثبات المكياج", query: "ثبات المكياج", slug: "makeup_longwear" },
  { label: "روتين صباحي", query: "روتين صباحي", slug: "morning_routine" },
];

const synonymGroups = [
  ["skincare", "العناية بالبشرة", "عناية بالبشرة", "بشرة", "بشره"],
  ["makeup", "مكياج", "ميك اب"],
  ["foundation", "فاونديشن", "كريم اساس", "base", "base makeup"],
  ["concealer", "كونسيلر"],
  ["routine", "روتين", "routine-led"],
  ["pigmentation", "تصبغات", "بقع", "اسمرار"],
  ["oily skin", "البشرة الدهنية", "دهنية", "دهنيه", "oily"],
  ["vitamin c", "فيتامين c", "فيتامين سي", "vitamin c"],
  ["niacinamide", "نياسيناميد"],
  ["hyaluronic acid", "هيالورونيك", "هيالورونيك اسيد", "hyaluronic"],
  ["finish", "نتيجة نهائية", "مخملي", "velvet", "finish"],
  ["longwear", "ثبات", "ثبات المكياج", "longwear", "long wear"],
];

const emptyGroups: Record<SearchResultKind, SearchResult[]> = {
  collection: [],
  product: [],
  concern: [],
  ingredient: [],
  routine: [],
  article: [],
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
  const expandedTerms = new Set([normalizedQuery, ...splitSearchTokens(query)]);

  for (const group of synonymGroups) {
    const normalizedGroup = group.map((term) => normalizeSearchText(term));
    const queryMatchesGroup = normalizedGroup.some(
      (term) =>
        term.includes(normalizedQuery) ||
        normalizedQuery.includes(term) ||
        splitSearchTokens(query).some(
          (token) => term.includes(token) || token.includes(term),
        ),
    );

    if (queryMatchesGroup) {
      normalizedGroup.forEach((term) => expandedTerms.add(term));
    }
  }

  return Array.from(expandedTerms).filter(Boolean);
}

function createSearchRecords(): SearchRecord[] {
  const collectionRecords: SearchRecord[] = [
    {
      kind: "collection",
      slug: "skincare",
      href: collectionDirectory.skincare.href,
      title: skincareCategory.title,
      description: skincareCategory.description,
      collection: "skincare",
      eyebrow: skincareCategory.subtitle,
      metadata: "فئة رئيسية",
      priority: 3,
      searchText: [
        skincareCategory.title,
        skincareCategory.subtitle,
        skincareCategory.description,
        skincareCategory.introduction,
        ...skincareCategory.filters,
        ...skincareCategory.concerns,
        ...skincareCategory.routines,
      ].join(" "),
    },
    {
      kind: "collection",
      slug: "makeup",
      href: collectionDirectory.makeup.href,
      title: makeupCategory.title,
      description: makeupCategory.description,
      collection: "makeup",
      eyebrow: makeupCategory.subtitle,
      metadata: "فئة رئيسية",
      priority: 3,
      searchText: [
        makeupCategory.title,
        makeupCategory.subtitle,
        makeupCategory.description,
        makeupCategory.introduction,
        ...makeupCategory.filters,
      ].join(" "),
    },
  ];

  const productRecords = products.map<SearchRecord>((product) => ({
    kind: "product",
    slug: product.slug,
    href: `/products/${product.slug}`,
    title: product.name,
    description: product.description,
    collection: product.collection,
    eyebrow: product.category,
    metadata: collectionDirectory[product.collection].title,
    priority: 5,
    searchText: [
      product.name,
      product.subtitle,
      product.brand,
      product.category,
      product.concern,
      product.ingredient,
      product.description,
      product.texture,
      product.finish,
      product.usageTiming,
      product.routineStep,
      ...product.skinTypes,
      ...product.badges,
      ...product.benefits,
      ...product.ingredientsHighlights,
    ].join(" "),
  }));

  const concernRecords = concerns.map<SearchRecord>((concern) => ({
    kind: "concern",
    slug: concern.slug,
    href: `/concerns/${concern.slug}`,
    title: concern.title,
    description: concern.answer,
    collection: concern.collection,
    eyebrow: concern.subtitle,
    metadata: collectionDirectory[concern.collection].title,
    priority: 4,
    searchText: [
      concern.title,
      concern.subtitle,
      concern.answer,
      concern.summary,
      concern.routineLabel,
      ...concern.keyIngredients,
      ...concern.faqs.flatMap((faq) => [faq.question, faq.answer]),
    ].join(" "),
  }));

  const ingredientRecords = ingredients.map<SearchRecord>((ingredient) => ({
    kind: "ingredient",
    slug: ingredient.slug,
    href: `/ingredients/${ingredient.slug}`,
    title: ingredient.title,
    description: ingredient.answer,
    collection: ingredient.collection,
    eyebrow: ingredient.subtitle,
    metadata: collectionDirectory[ingredient.collection].title,
    priority: 4,
    searchText: [
      ingredient.title,
      ingredient.subtitle,
      ingredient.answer,
      ingredient.summary,
      ingredient.role,
      ...ingredient.fitNotes,
      ...ingredient.watchouts,
      ...ingredient.faqs.flatMap((faq) => [faq.question, faq.answer]),
    ].join(" "),
  }));

  const routineRecords = routines.map<SearchRecord>((routine) => ({
    kind: "routine",
    slug: routine.slug,
    href: `/routines/${routine.slug}`,
    title: routine.title,
    description: routine.summary,
    collection: routine.collection,
    eyebrow: routine.subtitle,
    metadata: collectionDirectory[routine.collection].title,
    priority: 4,
    searchText: [
      routine.title,
      routine.subtitle,
      routine.summary,
      ...routine.audience,
      ...routine.steps.flatMap((step) => [step.label, step.description]),
      ...routine.pairings.map((pairing) => pairing.label),
      ...routine.faqs.flatMap((faq) => [faq.question, faq.answer]),
    ].join(" "),
  }));

  const articleRecords = journalArticles.map<SearchRecord>((article) => ({
    kind: "article",
    slug: article.slug,
    href: `/journal/${article.slug}`,
    title: article.title,
    description: article.excerpt,
    collection: article.collection,
    eyebrow: article.category,
    metadata: `${article.readingTime} • ${collectionDirectory[article.collection].title}`,
    priority: 2,
    searchText: [
      article.title,
      article.category,
      article.excerpt,
      article.answer,
      ...article.sections.flatMap((section) => [section.heading, section.body]),
      ...article.faq.flatMap((faq) => [faq.question, faq.answer]),
    ].join(" "),
  }));

  return [
    ...collectionRecords,
    ...productRecords,
    ...concernRecords,
    ...ingredientRecords,
    ...routineRecords,
    ...articleRecords,
  ];
}

function getRecordScore(record: SearchRecord, query: string, expandedTerms: string[]) {
  const haystack = normalizeSearchText(record.searchText);
  const title = normalizeSearchText(record.title);
  const queryTokens = splitSearchTokens(query);

  let score = 0;

  if (title.includes(query)) {
    score += 8;
  }

  if (haystack.includes(query)) {
    score += 5;
  }

  if (queryTokens.length > 1 && queryTokens.every((token) => haystack.includes(token))) {
    score += 3;
  }

  for (const term of expandedTerms) {
    if (!term || term === query) {
      continue;
    }

    if (title.includes(term)) {
      score += 3;
      continue;
    }

    if (haystack.includes(term)) {
      score += 1;
    }
  }

  return score + record.priority;
}

export function searchSiteContent(rawQuery: string) {
  const query = rawQuery.trim();
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return {
      query,
      normalizedQuery,
      total: 0,
      groups: emptyGroups,
    };
  }

  const expandedTerms = expandSearchTerms(query);
  const rankedResults = createSearchRecords()
    .map((record) => ({
      record,
      score: getRecordScore(record, normalizedQuery, expandedTerms),
    }))
    .filter((item) => item.score > item.record.priority)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.record.title.localeCompare(right.record.title, "ar");
    })
    .map((item) => item.record);

  const groups = rankedResults.reduce<Record<SearchResultKind, SearchResult[]>>(
    (accumulator, result) => {
      accumulator[result.kind].push(result);
      return accumulator;
    },
    {
      collection: [],
      product: [],
      concern: [],
      ingredient: [],
      routine: [],
      article: [],
    },
  );

  return {
    query,
    normalizedQuery,
    total: rankedResults.length,
    groups,
  };
}
