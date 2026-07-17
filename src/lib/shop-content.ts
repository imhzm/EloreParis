import type { Locale } from "@/lib/i18n";

const images = {
  // PLACEHOLDER: shared with the transition scene until a dedicated perfume
  // still-life concept asset exists. Replace before any perfume launch.
  perfumes: "/elore-assets/transition-burgundy-satin-concept-1672w.avif",
  skincare: "/elore-assets/texture-skincare-serum-concept-1536w.avif",
  makeup: "/elore-assets/texture-makeup-pigment-concept-1536w.avif",
  haircare: "/elore-assets/haircare-ribbon-editorial-concept-1122x1402.avif",
  bodycare: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif",
  tools: "/elore-assets/tools-brass-flatlay-concept-1254x1254.avif",
  editorial: "/elore-assets/editorial-skin-light-concept-1122w.avif",
  silk: "/elore-assets/hero-silk-champagne-concept-1672w.avif",
  gifting: "/elore-assets/gifting-folds-concept-1536x1024.avif",
} as const;

export const shopCopy = {
  ar: {
    metadata: {
      title: "المتجر",
      description: "اكتشفي عالم ÉLORÉ PARIS عبر أقسام العناية والمكياج والهدايا في تجربة هادئة وواضحة.",
      pageName: "متجر ÉLORÉ PARIS",
      pageDescription: "بوابة تسوق تجمع فئات العناية والجمال في مسارات واضحة.",
      home: "الرئيسية",
      shop: "المتجر",
    },
    hero: { aria: "بوابة المتجر", eyebrow: "THE BEAUTY ATLAS", title: "اختاري طريقك.\nلا مجرد منتج.", body: "فئة، احتياج، روتين أو مكوّن. كل طريق يقرّبك من قرار أوضح.", cta: "ابدئي الرحلة" },
    // No number in the headline. It said "ستة" over seven cards the moment
    // perfumes was added — copy that counts the thing beside it will always
    // drift behind it, and Arabic number agreement means the fix is not a digit
    // swap either. The line keeps its cadence and stops making a claim the data
    // has to keep true.
    categories: { aria: "تصنيفات المتجر", eyebrow: "SHOP BY CATEGORY", title: "كل باب مدخل.\nواختيار مدروس." },
    edit: { aria: "دراسات تحريرية للمجموعة", eyebrow: "THE EDIT IN PROGRESS", title: "المجموعة قيد التنسيق.\nوالاختيار يبدأ بالفهم.", cta: "استكشفي دليل الجمال ←", cardCta: "عرض القسم" },
    routesIntro: { aria: "طرق الاختيار", eyebrow: "CHOOSE WITH INTENT", title: "حين لا تكفي\nالفئة وحدها.", body: "ابدئي من السؤال الأقرب لك." },
    finale: { aria: "نهاية تجربة المتجر", eyebrow: "BEAUTY, CONSIDERED", title: "اختيارك يبدأ\nمن الوضوح.", body: "نعرض المنتجات والأسعار فقط بعد اعتماد بياناتها وصورها ومعلوماتها التشغيلية.", primary: "دليل الجمال", secondary: "الثقة والسياسات" },
    collections: [
      ["العطور", "PERFUMES", "/shop/perfumes", images.perfumes, "shop_hub_collection_perfumes"],
      ["العناية بالبشرة", "SKINCARE", "/shop/skincare", images.skincare, "shop_hub_collection_skincare"],
      ["المكياج", "MAKEUP", "/shop/makeup", images.makeup, "shop_hub_collection_makeup"],
      ["العناية بالشعر", "HAIRCARE", "/shop/haircare", images.haircare, "shop_hub_collection_haircare"],
      ["العناية بالجسم", "BODYCARE", "/shop/bodycare", images.bodycare, "shop_hub_collection_bodycare"],
      ["الأدوات", "TOOLS", "/shop/tools", images.tools, "shop_hub_collection_tools"],
      ["مجموعات الجمال", "BEAUTY SETS", "/shop/beauty-sets", images.gifting, "shop_hub_collection_beauty_sets"],
    ],
    studies: [
      ["طقس الترطيب", "CONCEPT STUDY", images.skincare, "/routines"],
      ["ضوء البشرة", "EDITORIAL STUDY", images.editorial, "/journal"],
      ["لون بوعي", "TEXTURE STUDY", images.makeup, "/concerns"],
      ["طقس الهدية", "GIFTING STUDY", images.gifting, "/journal"],
    ],
    routes: [
      ["01", "حسب الاحتياج", "ابدئي بالنتيجة التي تبحثين عنها.", "/concerns", "shop_hub_to_concerns"],
      ["02", "حسب الروتين", "رتّبي الخطوات قبل اختيار المنتجات.", "/routines", "shop_hub_to_routines"],
      ["03", "حسب المكوّن", "افهمي التركيبة وما يناسب احتياجك.", "/ingredients", "shop_hub_to_ingredients"],
      ["04", "بحث مباشر", "عندما تعرفين الاسم أو الفئة.", "/search", "shop_hub_to_search"],
    ],
    imageAlt: (title: string) => `صورة مفاهيمية لقسم ${title}`,
  },
  en: {
    metadata: {
      title: "Shop",
      description: "Explore the ÉLORÉ PARIS world through skincare, makeup and gifting in a quieter, clearer experience.",
      pageName: "ÉLORÉ PARIS shop",
      pageDescription: "A considered gateway to beauty and care categories.",
      home: "Home",
      shop: "Shop",
    },
    hero: { aria: "Shop gateway", eyebrow: "THE BEAUTY ATLAS", title: "Choose your path.\nNot just a product.", body: "Category, concern, ritual or ingredient. Every route brings you closer to a clearer choice.", cta: "Begin the journey" },
    // See the Arabic note: the count was wrong the moment a seventh door
    // opened, so the line no longer carries one.
    categories: { aria: "Shop categories", eyebrow: "SHOP BY CATEGORY", title: "Every door an entrance.\nOne considered choice." },
    edit: { aria: "Editorial collection studies", eyebrow: "THE EDIT IN PROGRESS", title: "The collection is being composed.\nChoice begins with understanding.", cta: "Explore the beauty journal →", cardCta: "View section" },
    routesIntro: { aria: "Ways to choose", eyebrow: "CHOOSE WITH INTENT", title: "When category\nis not enough.", body: "Begin with the question closest to you." },
    finale: { aria: "End of the shop experience", eyebrow: "BEAUTY, CONSIDERED", title: "Your choice begins\nwith clarity.", body: "Products and prices appear only after their imagery, data and operational information are approved.", primary: "Beauty journal", secondary: "Trust and policies" },
    collections: [
      ["Perfumes", "PERFUMES", "/shop/perfumes", images.perfumes, "shop_hub_collection_perfumes"],
      ["Skincare", "SKINCARE", "/shop/skincare", images.skincare, "shop_hub_collection_skincare"],
      ["Makeup", "MAKEUP", "/shop/makeup", images.makeup, "shop_hub_collection_makeup"],
      ["Haircare", "HAIRCARE", "/shop/haircare", images.haircare, "shop_hub_collection_haircare"],
      ["Bodycare", "BODYCARE", "/shop/bodycare", images.bodycare, "shop_hub_collection_bodycare"],
      ["Tools", "TOOLS", "/shop/tools", images.tools, "shop_hub_collection_tools"],
      ["Beauty sets", "BEAUTY SETS", "/shop/beauty-sets", images.gifting, "shop_hub_collection_beauty_sets"],
    ],
    studies: [
      ["Hydration ritual", "CONCEPT STUDY", images.skincare, "/routines"],
      ["Light on skin", "EDITORIAL STUDY", images.editorial, "/journal"],
      ["Colour, considered", "TEXTURE STUDY", images.makeup, "/concerns"],
      ["The gifting ritual", "GIFTING STUDY", images.gifting, "/journal"],
    ],
    routes: [
      ["01", "By concern", "Begin with the result you are looking for.", "/concerns", "shop_hub_to_concerns"],
      ["02", "By ritual", "Arrange the steps before choosing products.", "/routines", "shop_hub_to_routines"],
      ["03", "By ingredient", "Understand the formula and what suits you.", "/ingredients", "shop_hub_to_ingredients"],
      ["04", "Direct search", "When you know the name or category.", "/search", "shop_hub_to_search"],
    ],
    imageAlt: (title: string) => `Concept image for ${title}`,
  },
} satisfies Record<Locale, unknown>;
