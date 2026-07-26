import type { CatalogCollection } from "@/lib/catalog-authority-types";

export type PublicCatalogLocale = "ar" | "en";

export type PublicCatalogVariant = {
  sku: string;
  label: string;
  size: string;
  grossHalalas: number;
  compareAtHalalas: number | null;
  price: number;
  compareAtPrice: number | null;
  availability: "InStock" | "PreOrder" | "OutOfStock";
};

export type PublicCatalogProduct = {
  collection: CatalogCollection;
  slug: string;
  name: string;
  subtitle: string;
  brand: string;
  finish: string;
  shippingNote: string;
  ingredientsInci: string | null;
  directions: string | null;
  storage: string | null;
  warnings: string[];
  countryOfOrigin: string | null;
  expiry: {
    mode: "expiry" | "pao";
    months: number;
  } | null;
  approvedClaims: string[];
  merchandising: {
    tags: string[];
    concerns: string[];
    routines: string[];
    benefits: string[];
    packaging: string | null;
    giftEligible: boolean;
    relatedSlugs: string[];
    fragrance: {
      family: string;
      concentration: string;
      topNotes: string[];
      heartNotes: string[];
      baseNotes: string[];
    } | null;
  };
  returns: {
    windowDays: number;
    hygieneSealRequired: boolean;
    openedReturnEligible: boolean;
    exceptionReason: string | null;
    policyVersion: string;
  };
  media: Array<{ url: string; alt: string }>;
  pairings: Array<{ label: string; href: string }>;
  questions: Array<{ question: string; answer: string }>;
  variants: PublicCatalogVariant[];
};

export type PublicCatalogSnapshot = {
  available: boolean;
  locale: PublicCatalogLocale;
  products: PublicCatalogProduct[];
};

export type PublicCartResolution = PublicCatalogSnapshot & {
  unavailableKeys: string[];
};
