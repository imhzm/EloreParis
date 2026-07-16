import type { Locale } from "@/lib/i18n";

/**
 * Content for the bento commerce grid on the home page.
 *
 * Kept out of the component on purpose: the grid is a card system with typed
 * variants, and the copy is authored per locale rather than translated. The
 * Arabic is the original.
 */

export type BentoTheme = "ivory" | "wine" | "sand";

export type BentoCategoryCard = {
  kind: "category";
  id: string;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
};

export type BentoIntroCard = {
  kind: "intro";
  id: string;
  eyebrow: string;
  title: string;
  cta: string;
  href: string;
};

export type BentoEditorialCard = {
  kind: "editorial";
  id: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  theme: BentoTheme;
};

export type BentoMediaCard = {
  kind: "media";
  id: string;
  image: string;
  imageAlt: string;
};

export type BentoQuoteCard = {
  kind: "quote";
  id: string;
  quote: string;
  attribution: string;
};

export type BentoCard =
  | BentoCategoryCard
  | BentoIntroCard
  | BentoEditorialCard
  | BentoMediaCard
  | BentoQuoteCard;

const images = {
  // PLACEHOLDER until a dedicated perfume still-life concept asset exists.
  perfumes: "/elore-assets/transition-burgundy-satin-concept-1672w.avif",
  skincare: "/elore-assets/texture-skincare-serum-concept-1536w.avif",
  makeup: "/elore-assets/texture-makeup-pigment-concept-1536w.avif",
  bodycare: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif",
  gifting: "/elore-assets/gifting-folds-concept-1536x1024.avif",
  ritual: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif",
  journal: "/elore-assets/editorial-skin-light-concept-1122w.avif",
} as const;

export const bentoCopy = {
  ar: {
    sectionLabel: "مسارات الاكتشاف",
    conceptNotice: "صور تحريرية مفاهيمية · لا تعرض منتجًا للبيع.",
    openLabel: "اكتشفي",
    cards: [
      {
        kind: "intro",
        id: "intro",
        eyebrow: "عطور",
        title: "اختاري\nبصمتك\nاليومية.",
        cta: "اكتشفي العطور",
        href: "/shop/perfumes",
      },
      { kind: "category", id: "perfumes", title: "العطور", href: "/shop/perfumes", image: images.perfumes, imageAlt: "مشهد تحريري مفاهيمي لحرير برغندي وإضاءة دافئة" },
      { kind: "category", id: "skincare", title: "العناية بالبشرة", href: "/shop/skincare", image: images.skincare, imageAlt: "دراسة مفاهيمية لقوام العناية بالبشرة" },
      { kind: "category", id: "makeup", title: "المكياج", href: "/shop/makeup", image: images.makeup, imageAlt: "دراسة مفاهيمية لألوان وقوام المكياج" },
      { kind: "category", id: "bodycare", title: "العناية بالجسم", href: "/shop/bodycare", image: images.bodycare, imageAlt: "مشهد تحريري مفاهيمي لطقس العناية بالجسم" },
      { kind: "category", id: "gifts", title: "الهدايا", href: "/shop/beauty-sets", image: images.gifting, imageAlt: "تكوين تحريري مفاهيمي لتغليف هدية" },
      {
        kind: "editorial",
        id: "rituals",
        title: "طقوس الجمال",
        body: "ليست خطوات. إنها لحظات تُمنح لنفسك.",
        cta: "اكتشفي الطقوس",
        href: "/routines",
        theme: "wine",
      },
      { kind: "media", id: "ritual-media", image: images.ritual, imageAlt: "مشهد تحريري مفاهيمي لطقس مسائي" },
      {
        kind: "editorial",
        id: "journal",
        title: "مجلة الجمال",
        body: "دليلك الهادئ لاختيار ما يناسبك، من دون ضجيج.",
        cta: "ابدئي القراءة",
        href: "/journal",
        theme: "ivory",
      },
      { kind: "media", id: "journal-media", image: images.journal, imageAlt: "دراسة تحريرية مفاهيمية للضوء والقوام" },
      {
        kind: "editorial",
        id: "gifting",
        title: "لأن كل هدية تحكي قصة.",
        body: "اختيارات مدروسة للمناسبة، بتفاصيل تقديم هادئة.",
        cta: "اكتشفي الهدايا",
        href: "/shop/beauty-sets",
        theme: "sand",
      },
      {
        kind: "quote",
        id: "quote",
        quote: "الجمال الحقيقي لا يلفت النظر،\nبل يترك أثرًا.",
        attribution: "ÉLORÉ PARIS",
      },
    ],
  },
  en: {
    sectionLabel: "Routes into the house",
    conceptNotice: "Conceptual editorial imagery · no product offered for sale.",
    openLabel: "Discover",
    cards: [
      {
        kind: "intro",
        id: "intro",
        eyebrow: "Perfume",
        title: "Choose\nyour daily\nsignature.",
        cta: "Discover perfume",
        href: "/shop/perfumes",
      },
      { kind: "category", id: "perfumes", title: "Perfumes", href: "/shop/perfumes", image: images.perfumes, imageAlt: "Conceptual editorial scene of burgundy silk in warm light" },
      { kind: "category", id: "skincare", title: "Skincare", href: "/shop/skincare", image: images.skincare, imageAlt: "Concept study of skincare texture" },
      { kind: "category", id: "makeup", title: "Makeup", href: "/shop/makeup", image: images.makeup, imageAlt: "Concept study of makeup colour and texture" },
      { kind: "category", id: "bodycare", title: "Bodycare", href: "/shop/bodycare", image: images.bodycare, imageAlt: "Conceptual editorial scene of a bodycare ritual" },
      { kind: "category", id: "gifts", title: "Gifting", href: "/shop/beauty-sets", image: images.gifting, imageAlt: "Conceptual editorial composition of gift wrapping" },
      {
        kind: "editorial",
        id: "rituals",
        title: "Beauty rituals",
        body: "Not a list of steps. Moments you give yourself.",
        cta: "Discover the rituals",
        href: "/routines",
        theme: "wine",
      },
      { kind: "media", id: "ritual-media", image: images.ritual, imageAlt: "Conceptual editorial scene of an evening ritual" },
      {
        kind: "editorial",
        id: "journal",
        title: "The beauty journal",
        body: "A quiet guide to choosing what suits you, without the noise.",
        cta: "Start reading",
        href: "/journal",
        theme: "ivory",
      },
      { kind: "media", id: "journal-media", image: images.journal, imageAlt: "Conceptual editorial study of light and texture" },
      {
        kind: "editorial",
        id: "gifting",
        title: "Every gift tells a story.",
        body: "Considered choices for the occasion, finished with quiet detail.",
        cta: "Discover gifting",
        href: "/shop/beauty-sets",
        theme: "sand",
      },
      {
        kind: "quote",
        id: "quote",
        quote: "True beauty does not demand attention.\nIt leaves a trace.",
        attribution: "ÉLORÉ PARIS",
      },
    ],
  },
} as const satisfies Record<
  Locale,
  {
    sectionLabel: string;
    conceptNotice: string;
    openLabel: string;
    cards: readonly BentoCard[];
  }
>;
