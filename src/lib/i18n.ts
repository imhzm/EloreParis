import { journalSlugs } from "./journal-routing";

export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

const localizedShopCollectionPaths = new Set([
  "/shop/perfumes",
  "/shop/skincare",
  "/shop/makeup",
  "/shop/haircare",
  "/shop/bodycare",
  "/shop/tools",
  "/shop/beauty-sets",
]);

const localizedDiscoveryPaths = new Set([
  "/concerns",
  "/concerns/pigmentation",
  "/concerns/makeup-longwear",
  "/routines",
  "/routines/morning-routine-oily-skin",
  "/routines/occasion-base-routine",
  "/routines/humidity-proof-hair-routine",
  "/routines/after-shower-body-routine",
  "/ingredients",
  "/ingredients/niacinamide",
  "/ingredients/vitamin-c",
  "/ingredients/hyaluronic-acid",
  "/ingredients/panthenol",
  "/ingredients/shea-butter",
]);

const localizedTrustSupportPaths = new Set([
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/trust",
  "/trust/verification",
  "/trust/privacy",
  "/trust/shipping",
  "/trust/returns",
  "/trust/authenticity",
]);

const localizedCommercePaths = new Set([
  "/account/orders",
  "/cart",
  "/checkout",
  "/checkout/success",
  "/track-order",
]);

export function isLocalizedShopCollectionPath(pathname: string) {
  return localizedShopCollectionPaths.has(pathname);
}

export function isLocalizedDiscoveryPath(pathname: string) {
  return localizedDiscoveryPaths.has(pathname);
}

export function isLocalizedTrustSupportPath(pathname: string) {
  return localizedTrustSupportPaths.has(pathname);
}

export function isLocalizedCommercePath(pathname: string) {
  return localizedCommercePaths.has(pathname);
}

export function isLocalizedJournalPath(pathname: string) {
  if (pathname === "/journal") return true;
  const slug = pathname.startsWith("/journal/") ? pathname.slice("/journal/".length) : "";
  return journalSlugs.includes(slug as (typeof journalSlugs)[number]);
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const localeConfig: Record<
  Locale,
  { htmlLang: string; dir: "rtl" | "ltr"; ogLocale: string }
> = {
  ar: { htmlLang: "ar-SA", dir: "rtl", ogLocale: "ar_SA" },
  en: { htmlLang: "en-SA", dir: "ltr", ogLocale: "en_SA" },
};

function isLocalizablePath(pathname: string) {
  // Expand this allowlist only after each complete route has moved. Descendant
  // category pages remain on their legacy URLs until their content is localized.
  return (
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/search" ||
    isLocalizedShopCollectionPath(pathname) ||
    isLocalizedDiscoveryPath(pathname) ||
    isLocalizedTrustSupportPath(pathname) ||
    isLocalizedJournalPath(pathname) ||
    isLocalizedCommercePath(pathname)
  );
}

/**
 * Which navigation entry, if any, should carry aria-current on this path.
 *
 * Exactly one may. A plain `startsWith` marks every ancestor too — on
 * /shop/perfumes both "/shop" and "/shop/perfumes" would claim the current
 * page — so the deepest matching entry wins and its ancestors stay quiet. The
 * trailing slash in the prefix test stops "/shop" from matching "/shopping".
 */
export function resolveActiveNavHref(
  nav: readonly (readonly [string, string])[],
  activeHref: string,
) {
  return nav.reduce<string | null>((best, [itemHref]) => {
    const matches =
      itemHref === "/"
        ? activeHref === "/"
        : activeHref === itemHref || activeHref.startsWith(`${itemHref}/`);
    if (!matches) return best;
    return best === null || itemHref.length > best.length ? itemHref : best;
  }, null);
}

export function localizePath(locale: Locale, href: string) {
  // Absolute URLs, protocol-relative hrefs, and non-path values are never ours
  // to rewrite. Everything else is matched on its pathname alone so that hrefs
  // carrying a query or hash (`/search?q=…`) still resolve to their locale.
  if (!href.startsWith("/") || href.startsWith("//")) return href;

  const suffixIndex = href.search(/[?#]/);
  const pathname = suffixIndex === -1 ? href : href.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : href.slice(suffixIndex);

  if (!isLocalizablePath(pathname)) return href;

  return `/${locale}${pathname === "/" ? "" : pathname}${suffix}`;
}

export const homeCopy = {
  ar: {
    hero: {
      eyebrow: "PARISIAN RITUAL · SAUDI RELEVANCE",
      // The brand's own line, not ours. All nine concept boards head the hero with
      // "جمالٌ يُروى كتجربة." and the identity sheet's footer lockup reads
      // "جمال يُصاغ بنية. ويُروى كتجربة." — the same verb. The site had been
      // shipping "جمال باختيار مدروس.", which appears in none of the owner's
      // material. Transcribing the owner's copy is not the invention §19 forbids;
      // writing our own would be. CLAUDE.md §10 gives an earlier draft
      // ("جمالٌ يروي تجربة.") that the sheet and the boards both supersede.
      title: "جمالٌ يُروى كتجربة.",
      body: "نحوّل لحظاتك اليومية إلى طقوس فاخرة من الجمال والحنين. اكتشفي فنّ العناية، كما تليق بك.",
      primary: "اكتشفي المجموعة",
      secondary: "ابني روتينك",
      assetStatus: "مشهد تحريري مفاهيمي · لا يعرض منتجًا للبيع.",
    },
    productTruth: {
      eyebrow: "PRODUCT TRUTH",
      title: "تفاصيل تساعدك على الاختيار بثقة.",
      body: "نرتّب القوام وطريقة الاستخدام والمعلومات الأساسية في صورة أسهل للقراءة، حتى لا تحتاجي إلى التخمين قبل القرار.",
      gate: "تظهر المنتجات هنا عندما تكتمل صور العبوة والملصق والبيانات الموثقة لكل اختيار.",
      stageAria: "تصور تحريري لمكان عرض المنتج",
      markAlt: "علامة ÉLORÉ PARIS",
      pending: "CONCEPTUAL DISPLAY · NO SKU SHOWN",
    },
    texture: {
      eyebrow: "TEXTURE THEATRE",
      title: "اختاري بالقوام، لا بالضجيج.",
      body: "جل خفيف، كريم غني، أو لمسة مخملية. نعرض الإحساس بوضوح لتعرفي ما ينسجم معك قبل الشراء.",
      assetStatus: "دراسة تحريرية مفاهيمية للقوام · لا تعرض منتجًا للبيع.",
    },
    intentionsTitle: "ابدئي من نيتك.",
    intentions: [
      ["العناية بالبشرة", "روتين أبسط، مبني حول ما تحتاجه بشرتك فعلًا.", "/shop/skincare", "/elore-assets/editorial-skin-light-concept-1122w.avif"],
      ["المكياج", "لون وقوام يكملان حضورك، لا يخفيانه.", "/shop/makeup", "/elore-assets/texture-makeup-pigment-concept-1536w.avif"],
      ["الأطقم والهدايا", "اختيارات مدروسة، جاهزة لتُهدى وتُتذكر.", "/shop/beauty-sets", "/elore-assets/gifting-ribbon-ritual-concept-1536w.avif"],
    ],
    routine: {
      title: "روتينك لا يحتاج إلى رف كامل.",
      body: "ابدئي بالأساس. ثم أضيفي ما يخدم هدفًا واضحًا، خطوة واحدة في كل مرة.",
      cta: "ابدئي من الأساس",
      steps: [
        ["01", "تنظيف", "بداية هادئة تحافظ على توازن البشرة."],
        ["02", "ترطيب", "قوام يناسب إحساس بشرتك ووقت استخدامك."],
        ["03", "حماية", "الخطوة اليومية التي تكمّل أساس الروتين."],
      ],
    },
    shades: {
      title: "الدرجة تُفهم في سياقها.",
      body: "عند وصول الدرجات الفعلية، ستظهر بسواتشات موثقة وإضاءة متسقة وعلى أكثر من لون بشرة، مع تنبيه واضح لاختلاف الشاشات.",
      status: "VERIFIED SWATCHES · WHEN AVAILABLE",
    },
    story: {
      title: "أناقة هادئة، صُممت ليومك.",
      body: "نبني تجربة جمال عربية راقية تجمع الاختيار المدروس مع تفاصيل تناسب المناخ وإيقاع الحياة والمناسبات في السعودية.",
      cta: "اقرئي قصتنا",
    },
    proofTitle: "ثقة تبدأ مما يمكن إثباته.",
    proof: [
      ["01", "صور أوضح", "نعرض القوام والدرجة من دون مؤثرات تغيّر الحقيقة."],
      ["02", "معلومة عملية", "طريقة استخدام مختصرة ومفهومة قبل اتخاذ القرار."],
      ["03", "اختيار أقل ضجيجًا", "تصنيف مدروس بدل رف رقمي مزدحم بلا توجيه."],
      ["04", "ادعاءات منضبطة", "لا أرقام أو نتائج أو وعود بلا مصدر يمكن مراجعته."],
    ],
    gifting: {
      title: "هدية جميلة في كل تفصيلة.",
      body: "اختيارات مدروسة للمناسبة والميزانية، مع تفاصيل تقديم هادئة تجعل لحظة الهدية جزءًا من التجربة.",
      cta: "اكتشفي عالم الهدايا",
    },
    edit: {
      title: "رسائل جمال تستحق وقتك.",
      body: "أدلة درجات، روتينات قصيرة، وملاحظات تساعدك على الاختيار من دون ضجيج.",
      cta: "اقرئي مجلة الجمال",
    },
  },
  en: {
    hero: {
      eyebrow: "PARISIAN RITUAL · SAUDI RELEVANCE",
      // The identity sheet's English line, carried on the brand rail and the
      // footer lockup. Not a translation of the Arabic — the sheet sets them as a
      // pair, and English is the secondary voice here.
      title: "Beauty, composed with intention.",
      body: "We turn your daily moments into rituals worth keeping. Discover the craft of care, made to suit you.",
      primary: "Explore the collection",
      secondary: "Build your ritual",
      assetStatus: "Conceptual editorial scene · no product offered for sale.",
    },
    productTruth: {
      eyebrow: "PRODUCT TRUTH",
      title: "Details that support a confident choice.",
      body: "We organise texture, directions and essential information into a clearer view, so the decision never begins with guesswork.",
      gate: "Products appear here when packaging, label imagery and verified data are complete for each choice.",
      stageAria: "Editorial concept for the future product display",
      markAlt: "ÉLORÉ PARIS mark",
      pending: "CONCEPTUAL DISPLAY · NO SKU SHOWN",
    },
    texture: {
      eyebrow: "TEXTURE THEATRE",
      title: "Choose by texture, not noise.",
      body: "A weightless gel, a rich cream or a velvet finish. We make the feel legible before it becomes part of your ritual.",
      assetStatus: "Conceptual texture study · no product offered for sale.",
    },
    intentionsTitle: "Begin with intention.",
    intentions: [
      ["Skincare", "A simpler ritual shaped around what your skin genuinely needs.", "/shop/skincare", "/elore-assets/editorial-skin-light-concept-1122w.avif"],
      ["Makeup", "Colour and texture that complement your presence, never conceal it.", "/shop/makeup", "/elore-assets/texture-makeup-pigment-concept-1536w.avif"],
      ["Sets and gifting", "Considered choices, ready to give and remember.", "/shop/beauty-sets", "/elore-assets/gifting-ribbon-ritual-concept-1536w.avif"],
    ],
    routine: {
      title: "Your ritual does not need a full shelf.",
      body: "Begin with the essentials. Add only what serves a clear purpose, one considered step at a time.",
      cta: "Start with the essentials",
      steps: [
        ["01", "Cleanse", "A gentle beginning that respects the skin's balance."],
        ["02", "Hydrate", "A texture suited to your skin and the moment of use."],
        ["03", "Protect", "The daily step that completes the foundation of your ritual."],
      ],
    },
    shades: {
      title: "Shade needs context.",
      body: "When actual shades arrive, they will be shown through verified swatches, consistent lighting and more than one skin tone, with a clear screen-variation note.",
      status: "VERIFIED SWATCHES · WHEN AVAILABLE",
    },
    story: {
      title: "Quiet elegance, shaped for your day.",
      body: "We are building a refined Arabic beauty experience around considered choices, Saudi climate, everyday rhythm and the moments worth dressing for.",
      cta: "Read our story",
    },
    proofTitle: "Trust begins with what can be proven.",
    proof: [
      ["01", "Clearer imagery", "Texture and shade shown without effects that change their truth."],
      ["02", "Practical information", "Concise, useful directions before you make a decision."],
      ["03", "A quieter edit", "Considered curation instead of an overcrowded digital shelf."],
      ["04", "Disciplined claims", "No figures, results or promises without a reviewable source."],
    ],
    gifting: {
      title: "A beautiful gift, down to every detail.",
      body: "Considered choices for the occasion and budget, finished with thoughtful details that make the giving part of the experience.",
      cta: "Discover the art of gifting",
    },
    edit: {
      title: "Beauty notes worthy of your time.",
      body: "Shade guides, concise rituals and thoughtful notes that help you choose without the noise.",
      cta: "Read the beauty journal",
    },
  },
} as const;

export const shellCopy = {
  ar: {
    skip: "تخطي إلى المحتوى", market: "تجربة عربية للسوق السعودي", tagline: "جمالٌ يُروى كتجربة", trackOrder: "تتبّع طلبك ←",
    navLabel: "التنقل الرئيسي", searchLabel: "البحث داخل المتجر", account: "حسابي", cart: "السلة", cartCountLabel: "عناصر في السلة",
    menuOpen: "فتح القائمة", menuClose: "إغلاق القائمة", footerBody: "بيت جمال رقمي فاخر يجمع الحس الباريسي مع وضوح يناسب روتينك في السعودية.",
    footerStatus: "نعرض معلومات المنتجات والسياسات من مصادر موثقة وبوضوح قبل اتخاذ القرار.", aboutLabel: "اعرفي قصتنا", policyTitle: "الثقة والسياسات", supportTitle: "خدمة الطلب",
    footerTagline: "جمال يُصاغ بنية. ويُروى كتجربة.", languageLabel: "English", languageHref: "/en",
    // The reference concept leads its navigation with the categories. Perfumes
    // joins them here. Search is not a nav entry: the header already carries a
    // search control beside it, and two routes to the same page is the kind of
    // clutter this brand is meant to be the opposite of.
    nav: [["/", "الرئيسية"], ["/shop", "المتجر"], ["/shop/perfumes", "العطور"], ["/concerns", "حسب المشكلة"], ["/routines", "الروتينات"], ["/journal", "المجلة"], ["/trust", "الثقة"]],
    policies: [["/terms", "الشروط والأحكام"], ["/trust/verification", "بيانات المنشأة"], ["/trust/privacy", "الخصوصية"], ["/trust/shipping", "الشحن والتوصيل"], ["/trust/returns", "الاستبدال والاسترجاع"]],
    support: [["/contact", "تواصلي معنا"], ["/faq", "الأسئلة الشائعة"], ["/track-order", "تتبع الطلب"], ["/cart", "السلة"], ["/search", "البحث داخل المتجر"]],
    // §7.7 Trust / Service strip. These are deliberately status statements,
    // not commercial promises: shipping, samples, packaging and returns remain
    // owner/provider approval gates in the current authority files.
    serviceStripTitle: "وضوح قبل الشراء",
    serviceStrip: [
      ["delivery", "تفاصيل الشحن", "تُنشر بعد اعتماد مزوّد الخدمة"],
      ["samples", "العيّنات والهدايا", "لا نعد بها قبل اعتمادها"],
      ["packaging", "تجربة التغليف", "تصميم مفاهيمي حتى الاعتماد"],
      ["ingredients", "بيانات المنتجات", "تظهر من مصادر موثقة فقط"],
      ["returns", "سياسة الإرجاع", "تُنشر قبل تفعيل البيع"],
    ],
    shopTitle: "المتجر",
    shopLinks: [["/shop/perfumes", "العطور"], ["/shop/skincare", "العناية بالبشرة"], ["/shop/makeup", "المكياج"], ["/shop/beauty-sets", "الهدايا والمجموعات"], ["/shop", "كل المنتجات"]],
  },
  en: {
    skip: "Skip to content", market: "A Saudi beauty experience", tagline: "Beauty, composed with intention", trackOrder: "Track your order →",
    navLabel: "Primary navigation", searchLabel: "Search the store", account: "Account", cart: "Cart", cartCountLabel: "items in cart",
    menuOpen: "Open menu", menuClose: "Close menu", footerBody: "A premium digital beauty house pairing Parisian sensibility with clarity made for life in Saudi Arabia.",
    footerStatus: "Product and policy information is presented from verified sources, with clarity before every decision.", aboutLabel: "Discover our story", policyTitle: "Trust and policies", supportTitle: "Order support",
    footerTagline: "Beauty. Composed with intention.", languageLabel: "العربية", languageHref: "/ar",
    nav: [["/", "Home"], ["/shop", "Shop"], ["/shop/perfumes", "Perfumes"], ["/concerns", "By concern"], ["/routines", "Rituals"], ["/journal", "Journal"], ["/trust", "Trust"]],
    policies: [["/terms", "Terms and conditions"], ["/trust/verification", "Business information"], ["/trust/privacy", "Privacy"], ["/trust/shipping", "Shipping and delivery"], ["/trust/returns", "Returns and refunds"]],
    support: [["/contact", "Contact us"], ["/faq", "Frequently asked questions"], ["/track-order", "Track order"], ["/cart", "Cart"], ["/search", "Search the store"]],
    serviceStripTitle: "Clarity before purchase",
    serviceStrip: [
      ["delivery", "Shipping details", "published after carrier approval"],
      ["samples", "Samples and gifts", "never promised before approval"],
      ["packaging", "Packaging experience", "conceptual until approved"],
      ["ingredients", "Product information", "shown only from verified sources"],
      ["returns", "Returns policy", "published before sales are enabled"],
    ],
    shopTitle: "Shop",
    shopLinks: [["/shop/perfumes", "Perfumes"], ["/shop/skincare", "Skincare"], ["/shop/makeup", "Makeup"], ["/shop/beauty-sets", "Gifts & sets"], ["/shop", "All products"]],
  },
} as const;
