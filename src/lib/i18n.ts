import { journalSlugs } from "./journal-routing";

export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

const localizedShopCollectionPaths = new Set([
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

export function localizePath(locale: Locale, href: string) {
  // Expand this allowlist only after each complete route has moved. Descendant
  // category pages remain on their legacy URLs until their content is localized.
  if (href === "/" || href === "/shop" || href === "/search" || isLocalizedShopCollectionPath(href) || isLocalizedDiscoveryPath(href) || isLocalizedTrustSupportPath(href) || isLocalizedJournalPath(href) || isLocalizedCommercePath(href)) {
    return `/${locale}${href === "/" ? "" : href}`;
  }

  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href.startsWith("/api/") ||
    href.startsWith("/ops") ||
    href.startsWith("/account/access")
  ) {
    return href;
  }

  return href;
}

export const homeCopy = {
  ar: {
    hero: {
      eyebrow: "PARISIAN RITUAL · SAUDI RELEVANCE",
      title: "جمال باختيار مدروس.",
      body: "تجربة جمال هادئة تجمع الإحساس الباريسي مع وضوح يناسب روتينك اليومي. اكتشفي القوام والدرجة والتفاصيل قبل أن تختاري.",
      primary: "اكتشفي المجموعة",
      secondary: "ابني روتينك",
      assetStatus: "صورة مفاهيمية معتمدة للنموذج الأولي وليست صورة منتج.",
    },
    productTruth: {
      eyebrow: "PRODUCT TRUTH",
      title: "المنتج أمامك كما هو.",
      body: "قوام واضح، درجة حقيقية، وطريقة استخدام مفهومة. لأن الاختيار الأفضل يبدأ بمعلومة وصورة يمكنك الوثوق بهما.",
      gate: "تُضاف منتجات ÉLORÉ PARIS هنا فقط بعد اعتماد صور العبوة والملصق والبيانات التشغيلية لكل SKU.",
      stageAria: "مكان مخصص لصورة المنتج المعتمدة",
      markAlt: "علامة ÉLORÉ PARIS",
      pending: "REAL PRODUCT PHOTOGRAPHY · PENDING",
    },
    texture: {
      eyebrow: "TEXTURE THEATRE",
      title: "اختاري بالقوام، لا بالضجيج.",
      body: "جل خفيف، كريم غني، أو لمسة مخملية. نعرض الإحساس بوضوح لتعرفي ما ينسجم معك قبل الشراء.",
      assetStatus: "تصوير مفاهيمي للقوام؛ يستبدل بقوام المنتج الفعلي قبل الإطلاق التجاري.",
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
      title: "الدرجة تُرى على بشرة حقيقية.",
      body: "نعمل على تصوير السواتشات بلا فلاتر لونية وعلى درجات بشرة عربية وخليجية. لن ننشر أسماء الدرجات أو نتائجها قبل اكتمال التصوير والبيانات.",
      status: "TRUE SWATCH LIBRARY · IN PRODUCTION",
    },
    story: {
      title: "من باريس إلى تفاصيل يومك.",
      body: "تستلهم ÉLORÉ PARIS دقتها من طقوس الجمال الباريسية، وتعيد صياغتها لتناسب إيقاع الحياة واحتياجات الجمال في السعودية. فخامة هادئة، ومعلومات أوضح، واختيار أقرب إليك.",
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
      body: "اختيارات مدروسة للمناسبة والميزانية، مع تجربة تغليف تُعرض هنا بعد اعتمادها وتصويرها فعليًا.",
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
      title: "Beauty, considered.",
      body: "A quieter beauty experience, pairing Parisian sensibility with the clarity your daily ritual deserves. Discover texture, shade and detail before you choose.",
      primary: "Explore the collection",
      secondary: "Build your ritual",
      assetStatus: "Approved concept image for prototype use; not product photography.",
    },
    productTruth: {
      eyebrow: "PRODUCT TRUTH",
      title: "See the product as it is.",
      body: "Clear texture, faithful shade and practical directions. A better choice starts with information and imagery you can trust.",
      gate: "ÉLORÉ PARIS products appear here only after packaging, label and operational data are approved for every SKU.",
      stageAria: "Reserved for approved product photography",
      markAlt: "ÉLORÉ PARIS mark",
      pending: "REAL PRODUCT PHOTOGRAPHY · PENDING",
    },
    texture: {
      eyebrow: "TEXTURE THEATRE",
      title: "Choose by texture, not noise.",
      body: "A weightless gel, a rich cream or a velvet finish. We make the feel legible before it becomes part of your ritual.",
      assetStatus: "Concept texture study; replaced with the real product texture before commercial launch.",
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
      title: "Shade belongs on real skin.",
      body: "Our swatch library is being photographed without colour-altering filters across Arab and Gulf skin tones. Shade names and results remain unpublished until imagery and data are complete.",
      status: "TRUE SWATCH LIBRARY · IN PRODUCTION",
    },
    story: {
      title: "From Paris to the detail of your day.",
      body: "ÉLORÉ PARIS draws precision from Parisian beauty rituals and reframes it for the rhythm and beauty needs of Saudi life. Quiet luxury, clearer information and choices that feel closer to you.",
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
      body: "Considered choices for the occasion and budget, with a gifting ritual shown only after it has been approved and photographed.",
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
    skip: "تخطي إلى المحتوى", market: "تجربة عربية للسوق السعودي", tagline: "جمال باختيار مدروس", trackOrder: "تتبّع طلبك ←",
    navLabel: "التنقل الرئيسي", searchLabel: "البحث داخل المتجر", cart: "السلة", cartCountLabel: "عناصر في السلة",
    menuOpen: "فتح القائمة", menuClose: "إغلاق القائمة", footerBody: "بيت جمال رقمي فاخر يجمع الحس الباريسي مع وضوح يناسب روتينك في السعودية.",
    footerStatus: "بيانات المنتجات والتجارة والسياسات النهائية قيد الاعتماد قبل الإطلاق العام.", policyTitle: "الثقة والسياسات", supportTitle: "خدمة الطلب",
    footerTagline: "جمال باختيار مدروس.", languageLabel: "English", languageHref: "/en",
    nav: [["/", "الرئيسية"], ["/shop", "المتجر"], ["/concerns", "حسب المشكلة"], ["/routines", "الروتينات"], ["/search", "البحث"], ["/journal", "المجلة"], ["/trust", "الثقة"]],
    policies: [["/terms", "الشروط والأحكام"], ["/trust/verification", "بيانات المنشأة"], ["/trust/privacy", "الخصوصية"], ["/trust/shipping", "الشحن والتوصيل"], ["/trust/returns", "الاستبدال والاسترجاع"]],
    support: [["/contact", "تواصلي معنا"], ["/faq", "الأسئلة الشائعة"], ["/track-order", "تتبع الطلب"], ["/cart", "السلة"], ["/search", "البحث داخل المتجر"]],
  },
  en: {
    skip: "Skip to content", market: "A Saudi beauty experience", tagline: "Beauty, considered", trackOrder: "Track your order →",
    navLabel: "Primary navigation", searchLabel: "Search the store", cart: "Cart", cartCountLabel: "items in cart",
    menuOpen: "Open menu", menuClose: "Close menu", footerBody: "A premium digital beauty house pairing Parisian sensibility with clarity made for life in Saudi Arabia.",
    footerStatus: "Final product, commerce and policy information remains under approval before public launch.", policyTitle: "Trust and policies", supportTitle: "Order support",
    footerTagline: "Beauty, considered.", languageLabel: "العربية", languageHref: "/ar",
    nav: [["/", "Home"], ["/shop", "Shop"], ["/concerns", "By concern"], ["/routines", "Rituals"], ["/search", "Search"], ["/journal", "Journal"], ["/trust", "Trust"]],
    policies: [["/terms", "Terms and conditions"], ["/trust/verification", "Business information"], ["/trust/privacy", "Privacy"], ["/trust/shipping", "Shipping and delivery"], ["/trust/returns", "Returns and refunds"]],
    support: [["/contact", "Contact us"], ["/faq", "Frequently asked questions"], ["/track-order", "Track order"], ["/cart", "Cart"], ["/search", "Search the store"]],
  },
} as const;
