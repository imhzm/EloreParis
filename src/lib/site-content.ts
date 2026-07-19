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
export const siteTagline = "جمالٌ يُروى كتجربة";
export const defaultDescription =
  "تجربة جمال فاخرة وهادئة للسوق السعودي، تجمع الإحساس الباريسي مع معلومات أوضح عن القوام والدرجة والروتين قبل الاختيار.";

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

const jsonLdHtmlEscapes: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/** Serialize structured data without allowing its content to close the script element. */
export function serializeJsonLd(value: unknown) {
  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    throw new TypeError("JSON-LD value must be JSON-serializable.");
  }

  return serialized.replace(
    /[<>&\u2028\u2029]/g,
    (character) => jsonLdHtmlEscapes[character],
  );
}

/**
 * The share card every route falls back to.
 *
 * Next does not merge `openGraph` — a route that returns one REPLACES the
 * layout's outright, images and all. So a builder that set title/description/url
 * and nothing else silently dropped the site's card, and the route shared as a
 * bare link. Measured: 8 of 16 routes had no og:image at all — search, about,
 * contact, faq, terms, trust, trust/shipping, journal. The pages that worked
 * (discovery) only worked because they happened to name an image of their own.
 *
 * The stable `/api/social-card` route renders this at request time, so it is always the
 * current wordmark and tagline rather than a file to keep in step.
 */
export function defaultSocialCard(title: string, locale: "ar" | "en") {
  const url = absoluteUrl(`/api/social-card?locale=${locale}`);
  return {
    openGraph: [{ url, width: 1200, height: 630, alt: `${siteName} — ${title}` }],
    twitter: [url],
  };
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
  | "perfumes"
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
  perfumes: {
    title: "العطور",
    href: "/shop/perfumes",
    subtitle: "Perfume Collection",
    mode: "editorial",
  },
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
