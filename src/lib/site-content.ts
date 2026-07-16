// Site identity primitives and the commerce read-model types.
//
// This module used to also carry an ~8,500-line legacy discovery/editorial
// corpus (concerns, routines, ingredients, shop collections, 120 journal
// articles, trust policies). Every public surface now sources its copy from the
// locale-aware content modules instead — category-content, discovery-content,
// journal-content, trust-support-content, shop-content — and the catalogue is
// sourced from the approved catalog authority. The legacy corpus was retired
// with the non-localized route tree it was the only remaining consumer of.

const localSiteUrl = "http://localhost:3056";

function readEnv(name: string) {
  return process.env[name];
}

function normalizeSiteUrl(candidate?: string | null) {
  if (!candidate) {
    return null;
  }

  const trimmed = candidate.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

function resolveSiteUrl() {
  const vercelProductionUrl =
    readEnv("VERCEL_ENV") === "production"
      ? readEnv("VERCEL_PROJECT_PRODUCTION_URL")
      : undefined;

  const candidates = [
    readEnv("NEXT_PUBLIC_SITE_URL"),
    readEnv("RENDER_EXTERNAL_URL"),
    vercelProductionUrl,
    readEnv("VERCEL_BRANCH_URL"),
    readEnv("VERCEL_URL"),
    localSiteUrl,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeSiteUrl(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return localSiteUrl;
}

export function getSiteUrl() {
  return resolveSiteUrl();
}

export const siteName = "ÉLORÉ PARIS";
export const siteTagline = "جمال باختيار مدروس";
export const defaultDescription =
  "تجربة جمال فاخرة وهادئة للسوق السعودي، تجمع الإحساس الباريسي مع معلومات أوضح عن القوام والدرجة والروتين قبل الاختيار.";

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export const footerPolicyLinks = [
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/trust/verification", label: "بيانات المنشأة" },
  { href: "/trust/privacy", label: "الخصوصية" },
  { href: "/trust/shipping", label: "الشحن والتوصيل" },
  { href: "/trust/returns", label: "الاستبدال والاسترجاع" },
  { href: "/trust/authenticity", label: "الأصالة والجودة" },
];

export type CollectionSlug =
  | "skincare"
  | "makeup"
  | "haircare"
  | "bodycare"
  | "tools"
  | "beauty-sets";

type CollectionDirectoryEntry = {
  title: string;
  href: string;
  subtitle: string;
  mode: "filtered" | "editorial";
};

export const collectionDirectory: Record<
  CollectionSlug,
  CollectionDirectoryEntry
> = {
  skincare: {
    title: "العناية بالبشرة",
    href: "/shop/skincare",
    subtitle: "Skincare Collection",
    mode: "filtered",
  },
  makeup: {
    title: "المكياج",
    href: "/shop/makeup",
    subtitle: "Makeup Collection",
    mode: "filtered",
  },
  haircare: {
    title: "العناية بالشعر",
    href: "/shop/haircare",
    subtitle: "Haircare Collection",
    mode: "editorial",
  },
  bodycare: {
    title: "العناية بالجسم",
    href: "/shop/bodycare",
    subtitle: "Bodycare Collection",
    mode: "editorial",
  },
  tools: {
    title: "الأدوات والإكسسوارات",
    href: "/shop/tools",
    subtitle: "Tools Collection",
    mode: "editorial",
  },
  "beauty-sets": {
    title: "الهدايا والمجموعات",
    href: "/shop/beauty-sets",
    subtitle: "Beauty Sets",
    mode: "editorial",
  },
};

export type ProductVariant = {
  sku: string;
  label: string;
  size: string;
  price: number;
  compareAtPrice?: number;
  availability: "InStock" | "PreOrder";
};

export type ProductRecord = {
  collection: CollectionSlug;
  slug: string;
  name: string;
  subtitle: string;
  brand: string;
  category: string;
  concern: string;
  ingredient: string;
  description: string;
  priceFrom: number;
  shippingNote: string;
  skinTypes: string[];
  texture: string;
  finish: string;
  usageTiming: string;
  routineStep: string;
  badges: string[];
  benefits: string[];
  usage: string[];
  ingredientsHighlights: string[];
  inciList: string;
  warnings: string[];
  origin: string;
  variants: ProductVariant[];
  pairings: Array<{ label: string; href: string }>;
  questions: Array<{ question: string; answer: string }>;
};

// Intentionally empty. No product is published from source. The only route to a
// live catalogue is an approved, evidence-gated import through the catalog
// authority, projected read-only by `public-catalog.ts`.
export const products: ProductRecord[] = [];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
