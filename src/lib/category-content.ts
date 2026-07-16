import type { Locale } from "@/lib/i18n";

export const categorySlugs = [
  "perfumes",
  "skincare",
  "makeup",
  "haircare",
  "bodycare",
  "tools",
  "beauty-sets",
] as const;

export type CategorySlug = (typeof categorySlugs)[number];

export function isCategorySlug(value: string): value is CategorySlug {
  return categorySlugs.includes(value as CategorySlug);
}

type CategoryCopy = {
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  principles: Array<[string, string]>;
  routes: Array<[string, string, string]>;
};

const assets = {
  // PLACEHOLDER: shared with the transition scene until a dedicated perfume
  // still-life concept asset is commissioned. It is on-palette and on-theme,
  // but it is not a perfume scene — replace it before any perfume launch.
  perfumes: "/elore-assets/transition-burgundy-satin-concept-1672w.avif",
  skincare: "/elore-assets/texture-skincare-serum-concept-1536w.avif",
  makeup: "/elore-assets/texture-makeup-pigment-concept-1536w.avif",
  haircare: "/elore-assets/haircare-ribbon-editorial-concept-1122x1402.avif",
  bodycare: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif",
  tools: "/elore-assets/tools-brass-flatlay-concept-1254x1254.avif",
  sets: "/elore-assets/gifting-folds-concept-1536x1024.avif",
} as const;

export const categorySharedCopy = {
  ar: {
    heroCta: "اكتشفي طريقة الاختيار",
    principlesEyebrow: "THE CONSIDERED EDIT",
    principlesTitle: "اختيار أقل ضجيجًا.\nوأكثر وضوحًا.",
    routesEyebrow: "CHOOSE YOUR ROUTE",
    routesTitle: "ابدئي من السؤال،\nلا من الرف.",
    routesBody: "اختاري الطريق الأقرب لسؤالك، ثم انتقلي إلى الروتين أو المكوّن أو الدليل الذي يساعدك على فهم القرار.",
    gateEyebrow: "THE COLLECTION EDIT",
    gateTitle: "اختيارات أقل.\nوتفاصيل أوضح.",
    gateBody: "ستظهر المنتجات هنا عندما تكتمل صورها وبياناتها وأسعارها الموثقة، من دون أسماء أو وعود مؤقتة.",
    backToShop: "العودة إلى المتجر",
    trust: "الثقة والسياسات",
    conceptNotice: "صورة تحريرية مفاهيمية · لا تعرض منتجًا للبيع.",
    sceneLabels: ["افتتاحية الفئة", "مبادئ الاختيار", "مسارات الاكتشاف", "حالة الكتالوج"],
    metadataSuffix: "ÉLORÉ PARIS السعودية",
    breadcrumbHome: "الرئيسية",
    breadcrumbShop: "المتجر",
  },
  en: {
    heroCta: "Discover how to choose",
    principlesEyebrow: "THE CONSIDERED EDIT",
    principlesTitle: "Less noise.\nMore clarity.",
    routesEyebrow: "CHOOSE YOUR ROUTE",
    routesTitle: "Begin with the question,\nnot the shelf.",
    routesBody: "Choose the route closest to your question, then move into the ritual, ingredient or guide that makes the decision easier to understand.",
    gateEyebrow: "THE COLLECTION EDIT",
    gateTitle: "Fewer choices.\nClearer detail.",
    gateBody: "Products appear here when their imagery, verified data and pricing are complete, without temporary names or promises.",
    backToShop: "Back to shop",
    trust: "Trust and policies",
    conceptNotice: "Conceptual editorial image · no product offered for sale.",
    sceneLabels: ["Category opening", "Choice principles", "Discovery routes", "Catalogue status"],
    metadataSuffix: "ÉLORÉ PARIS Saudi Arabia",
    breadcrumbHome: "Home",
    breadcrumbShop: "Shop",
  },
} as const satisfies Record<Locale, unknown>;

export const categoryCopy: Record<Locale, Record<CategorySlug, CategoryCopy>> = {
  ar: {
    perfumes: {
      title: "العطور", eyebrow: "PERFUMES · A SIGNATURE, NOT A TREND", image: assets.perfumes, imageAlt: "مشهد تحريري مفاهيمي لحرير برغندي وإضاءة دافئة",
      description: "العطر أقرب إلى التوقيع منه إلى المنتج. نبدأ من المناسبة والأثر ووقت اليوم، لا من الاسم.",
      principles: [["ابدئي من المناسبة", "عطر النهار الطويل وعطر الأمسية لا يحملان القرار نفسه."], ["الأثر والثبات", "نصف الأثر بوضوح، من دون وعود بساعات محددة."], ["المناخ يغيّر العطر", "الحرارة والرطوبة في السعودية جزء من الاختيار، لا تفصيل جانبي."]],
      routes: [["حسب الطقس", "رتّبي العطر داخل يومك ومناسبتك.", "/routines"], ["عالم الهدايا", "العطر اختيار يُهدى ويُتذكر.", "/shop/beauty-sets"], ["دليل الجمال", "افهمي لغة العطر قبل الاختيار.", "/journal"]],
    },
    skincare: {
      title: "العناية بالبشرة", eyebrow: "SKINCARE · THE QUIET RITUAL", image: assets.skincare, imageAlt: "دراسة مفاهيمية لقوام العناية بالبشرة",
      description: "روتين أوضح يبدأ من احتياج البشرة والقوام ووقت الاستخدام، لا من كثرة الخطوات.",
      principles: [["احتياج البشرة", "ابدئي بما تشعر به بشرتك فعلًا قبل اختيار المكوّن."], ["القوام المناسب", "جل خفيف أو كريم أغنى؛ الإحساس جزء من القرار."], ["روتين قابل للاستمرار", "خطوات أقل، لكل منها وظيفة مفهومة داخل يومك."]],
      routes: [["حسب الاحتياج", "التصبغات، الجفاف أو الراحة اليومية.", "/concerns"], ["حسب الروتين", "رتّبي التنظيف والترطيب والحماية.", "/routines"], ["افهمي المكوّن", "ابدئي من المعرفة قبل القرار.", "/ingredients"]],
    },
    makeup: {
      title: "المكياج", eyebrow: "MAKEUP · COLOUR, CONSIDERED", image: assets.makeup, imageAlt: "دراسة مفاهيمية لألوان وقوام المكياج",
      description: "لون وقوام وتغطية تكمل حضورك، مع درجة أوضح وسياق استخدام مفهوم.",
      principles: [["الدرجة أولًا", "ننتظر سواتشات حقيقية على بشرة عربية وخليجية."], ["القوام والـ finish", "اختاري الإحساس والنتيجة قبل اسم المنتج."], ["المناسبة", "اليوم الطويل والمناسبة لا يحتاجان القرار نفسه."]],
      routes: [["حسب الإطلالة", "ابدئي من النتيجة النهائية التي تريدينها.", "/concerns"], ["روتين القاعدة", "رتّبي التحضير والتطبيق خطوة بخطوة.", "/routines"], ["دليل الجمال", "تعلمي لغة الدرجات والقوام بهدوء.", "/journal"]],
    },
    haircare: {
      title: "العناية بالشعر", eyebrow: "HAIRCARE · ROOT TO RITUAL", image: assets.haircare, imageAlt: "تكوين تحريري مفاهيمي يستلهم حركة الشعر والحرير",
      description: "من الفروة إلى الأطراف، روتين يراعي الملمس والحرارة والرطوبة في يومك.",
      principles: [["الفروة أولًا", "افهمي التوازن والتنظيف والراحة قبل توسيع الروتين."], ["الرطوبة والهيشان", "اختيار يناسب الطقس والملمس بعد التصفيف."], ["يومي أم عميق", "فرّقي بين العناية الخفيفة والمعالجة الأعمق."]],
      routes: [["روتين الشعر", "ابدئي بترتيب الخطوات بعد الغسيل.", "/routines"], ["حسب المكوّن", "افهمي ما يخدم النعومة والراحة.", "/ingredients"], ["البحث", "انتقلي إلى بحث مباشر وواضح.", "/search?q=العناية%20بالشعر"]],
    },
    bodycare: {
      title: "العناية بالجسم", eyebrow: "BODYCARE · DAILY COMFORT", image: assets.bodycare, imageAlt: "مشهد تحريري مفاهيمي لطقس العناية بالجسم بعد الاستحمام",
      description: "عناية يومية مبنية على الراحة والملمس وسهولة الاستمرار بعد الاستحمام.",
      principles: [["راحة يومية", "قوام واضح وامتصاص يناسب إيقاع اليوم."], ["الملمس قبل الوعد", "اختاري لوشنًا أو قوامًا أغنى حسب الإحساس المطلوب."], ["هدية ذات معنى", "التنسيق والتغليف يخدمان مناسبة حقيقية."]],
      routes: [["روتين بعد الاستحمام", "ابني عادة بسيطة يمكن الحفاظ عليها.", "/routines"], ["حسب المكوّن", "افهمي القوام الغني والخفيف.", "/ingredients"], ["عالم الهدايا", "انتقلي إلى مجموعات مدروسة.", "/shop/beauty-sets"]],
    },
    tools: {
      title: "الأدوات", eyebrow: "TOOLS · PURPOSE IN EVERY DETAIL", image: assets.tools, imageAlt: "تكوين تحريري مفاهيمي لأدوات جمال من النحاس والحجر",
      description: "كل أداة يجب أن تضيف وظيفة واضحة للتطبيق أو النظافة أو ترتيب الروتين.",
      principles: [["الاستخدام أولًا", "القيمة تبدأ مما تضيفه الأداة فعليًا."], ["رفيقة الروتين", "اربطِي الأداة بخطوة مفهومة لا بإضافة عشوائية."], ["العناية والاستبدال", "التنظيف والعمر المتوقع جزء من قرار الشراء."]],
      routes: [["روتين التطبيق", "اعرفي أين تدخل الأداة داخل الخطوات.", "/routines"], ["العودة للمكياج", "شاهدي الأداة ضمن سياق الإطلالة.", "/shop/makeup"], ["البحث المباشر", "ابحثي حسب الوظيفة أو النوع.", "/search?q=أدوات%20الجمال"]],
    },
    "beauty-sets": {
      title: "الهدايا والمجموعات", eyebrow: "GIFTING · BEAUTY, COMPOSED", image: assets.sets, imageAlt: "تكوين تحريري مفاهيمي لطقس تقديم هدية فاخرة",
      description: "مجموعة تصبح هدية عندما تكون المناسبة والاختيارات والتفاصيل مفهومة.",
      principles: [["المناسبة", "ابدئي بمن ستصل إليه الهدية ولماذا."], ["تنسيق مدروس", "كل عنصر يخدم فكرة واضحة داخل المجموعة."], ["تجربة التقديم", "التغليف والرسالة جزء من اللحظة، لا إضافة أخيرة."]],
      routes: [["حسب الروتين", "اختاري مجموعة تبدأ من خطوات منطقية.", "/routines"], ["العناية بالجسم", "هدية يومية هادئة وعملية.", "/shop/bodycare"], ["دليل الهدايا", "اقرئي قبل أن تختاري.", "/journal"]],
    },
  },
  en: {
    perfumes: {
      title: "Perfumes", eyebrow: "PERFUMES · A SIGNATURE, NOT A TREND", image: assets.perfumes, imageAlt: "Conceptual editorial scene of burgundy silk in warm light",
      description: "A perfume is closer to a signature than a product. Begin with the occasion, the trace it leaves and the hour of the day — not the name.",
      principles: [["Begin with the occasion", "A long day and an evening do not carry the same decision."], ["Trace and presence", "We describe how a scent behaves, without promising a number of hours."], ["Climate changes a scent", "Saudi heat and humidity belong in the choice, not in a footnote."]],
      routes: [["By ritual", "Place a scent inside your day and your occasion.", "/routines"], ["The art of gifting", "A scent is chosen to be given, and remembered.", "/shop/beauty-sets"], ["The journal", "Learn the language of scent before choosing.", "/journal"]],
    },
    skincare: {
      title: "Skincare", eyebrow: "SKINCARE · THE QUIET RITUAL", image: assets.skincare, imageAlt: "Concept study of skincare texture",
      description: "A clearer ritual begins with skin need, texture and moment of use — never the number of steps.",
      principles: [["Skin need", "Begin with how your skin genuinely feels before choosing an ingredient."], ["The right texture", "A light gel or richer cream; feel is part of the decision."], ["A ritual that lasts", "Fewer steps, each with a legible role in your day."]],
      routes: [["By concern", "Pigmentation, dryness or daily comfort.", "/concerns"], ["By ritual", "Arrange cleansing, hydration and protection.", "/routines"], ["Understand ingredients", "Begin with knowledge before the decision.", "/ingredients"]],
    },
    makeup: {
      title: "Makeup", eyebrow: "MAKEUP · COLOUR, CONSIDERED", image: assets.makeup, imageAlt: "Concept study of makeup colour and texture",
      description: "Colour, texture and coverage that complement your presence, with clearer shade and context.",
      principles: [["Shade first", "We wait for true swatches across Arab and Gulf skin tones."], ["Texture and finish", "Choose the feel and result before the product name."], ["The occasion", "A long day and a special evening need different decisions."]],
      routes: [["By look", "Begin with the result you want to create.", "/concerns"], ["The base ritual", "Arrange preparation and application step by step.", "/routines"], ["Beauty journal", "Learn the language of shade and texture quietly.", "/journal"]],
    },
    haircare: {
      title: "Haircare", eyebrow: "HAIRCARE · ROOT TO RITUAL", image: assets.haircare, imageAlt: "Conceptual editorial composition inspired by hair movement and silk",
      description: "From scalp to ends, a ritual shaped around texture, heat and humidity in your day.",
      principles: [["Scalp first", "Understand balance, cleansing and comfort before expanding the ritual."], ["Humidity and frizz", "Choose for the climate and the feel after styling."], ["Daily or intensive", "Separate light daily care from a deeper treatment."]],
      routes: [["Hair ritual", "Begin with the order of steps after washing.", "/routines"], ["By ingredient", "Understand what supports softness and comfort.", "/ingredients"], ["Search", "Move to a direct, focused search.", "/search?q=haircare"]],
    },
    bodycare: {
      title: "Bodycare", eyebrow: "BODYCARE · DAILY COMFORT", image: assets.bodycare, imageAlt: "Conceptual editorial scene for an after-shower body ritual",
      description: "Daily care shaped around comfort, texture and an after-shower ritual you can keep.",
      principles: [["Daily comfort", "Clear texture and absorption that suit the rhythm of your day."], ["Texture before promise", "Choose a lotion or richer feel for the moment you need."], ["A meaningful gift", "Composition and presentation should serve a real occasion."]],
      routes: [["After-shower ritual", "Build a simple habit you can maintain.", "/routines"], ["By ingredient", "Understand lighter and richer textures.", "/ingredients"], ["Gifting", "Move to a considered set.", "/shop/beauty-sets"]],
    },
    tools: {
      title: "Tools", eyebrow: "TOOLS · PURPOSE IN EVERY DETAIL", image: assets.tools, imageAlt: "Conceptual editorial flat lay of brass and stone beauty tools",
      description: "Every tool should add a clear purpose to application, hygiene or the order of a ritual.",
      principles: [["Use first", "Value begins with what the tool genuinely adds."], ["A ritual companion", "Connect the tool to a legible step, never a random add-on."], ["Care and replacement", "Cleaning and useful life belong in the decision."]],
      routes: [["Application ritual", "See where the tool belongs in the steps.", "/routines"], ["Back to makeup", "Understand the tool in the context of a look.", "/shop/makeup"], ["Direct search", "Search by function or type.", "/search?q=beauty%20tools"]],
    },
    "beauty-sets": {
      title: "Gifts and sets", eyebrow: "GIFTING · BEAUTY, COMPOSED", image: assets.sets, imageAlt: "Conceptual editorial composition for a luxury gifting ritual",
      description: "A set becomes a gift when its occasion, choices and smallest details are understood.",
      principles: [["The occasion", "Begin with who will receive it and why."], ["Considered composition", "Every element should serve one clear idea."], ["The giving ritual", "Presentation and message belong to the moment, not the end."]],
      routes: [["By ritual", "Choose a set built around logical steps.", "/routines"], ["Bodycare", "A quiet, practical everyday gift.", "/shop/bodycare"], ["Gift journal", "Read before you choose.", "/journal"]],
    },
  },
};
