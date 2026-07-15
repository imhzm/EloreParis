import type { Locale } from "@/lib/i18n";

export const categorySlugs = [
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
  skincare: "/elore-assets/texture-skincare-serum-concept-1536w.avif",
  makeup: "/elore-assets/texture-makeup-pigment-concept-1536w.avif",
  haircare: "/elore-assets/editorial-skin-light-concept-1122w.avif",
  bodycare: "/elore-assets/hero-silk-champagne-concept-1672w.avif",
  tools: "/elore-assets/transition-burgundy-satin-concept-1672w.avif",
  sets: "/elore-assets/gifting-ribbon-ritual-concept-1536w.avif",
} as const;

export const categorySharedCopy = {
  ar: {
    heroCta: "اكتشفي طريقة الاختيار",
    principlesEyebrow: "THE CONSIDERED EDIT",
    principlesTitle: "اختيار أقل ضجيجًا.\nوأكثر وضوحًا.",
    routesEyebrow: "CHOOSE YOUR ROUTE",
    routesTitle: "ابدئي من السؤال،\nلا من الرف.",
    routesBody: "هذه الصفحة تشرح منطق الفئة الآن، وتستقبل المنتجات فقط بعد اعتماد صورها وبياناتها وأسعارها.",
    gateEyebrow: "CATALOG IN PREPARATION",
    gateTitle: "الكتالوج الحقيقي\nقيد الاعتماد.",
    gateBody: "لن نعرض أسماء منتجات أو أسعارًا أو مخزونًا قبل اكتمال بيانات SKU والصور والسياسات التشغيلية.",
    backToShop: "العودة إلى المتجر",
    trust: "الثقة والسياسات",
    conceptNotice: "صورة مفاهيمية معتمدة للنموذج الأولي، وليست تصوير منتج.",
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
    routesBody: "This page explains the category logic now, and accepts products only after imagery, data and pricing are approved.",
    gateEyebrow: "CATALOG IN PREPARATION",
    gateTitle: "The real catalogue\nis under approval.",
    gateBody: "We will not publish product names, prices or stock before SKU data, imagery and operating policies are complete.",
    backToShop: "Back to shop",
    trust: "Trust and policies",
    conceptNotice: "Approved concept image for prototype use; not product photography.",
    sceneLabels: ["Category opening", "Choice principles", "Discovery routes", "Catalogue status"],
    metadataSuffix: "ÉLORÉ PARIS Saudi Arabia",
    breadcrumbHome: "Home",
    breadcrumbShop: "Shop",
  },
} as const satisfies Record<Locale, unknown>;

export const categoryCopy: Record<Locale, Record<CategorySlug, CategoryCopy>> = {
  ar: {
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
      title: "العناية بالشعر", eyebrow: "HAIRCARE · ROOT TO RITUAL", image: assets.haircare, imageAlt: "صورة تحريرية مفاهيمية للعناية بالشعر",
      description: "من الفروة إلى الأطراف، روتين يراعي الملمس والحرارة والرطوبة في يومك.",
      principles: [["الفروة أولًا", "افهمي التوازن والتنظيف والراحة قبل توسيع الروتين."], ["الرطوبة والهيشان", "اختيار يناسب الطقس والملمس بعد التصفيف."], ["يومي أم عميق", "فرّقي بين العناية الخفيفة والمعالجة الأعمق."]],
      routes: [["روتين الشعر", "ابدئي بترتيب الخطوات بعد الغسيل.", "/routines"], ["حسب المكوّن", "افهمي ما يخدم النعومة والراحة.", "/ingredients"], ["البحث", "انتقلي إلى بحث مباشر وواضح.", "/search?q=العناية%20بالشعر"]],
    },
    bodycare: {
      title: "العناية بالجسم", eyebrow: "BODYCARE · DAILY COMFORT", image: assets.bodycare, imageAlt: "دراسة مفاهيمية لملمس العناية بالجسم",
      description: "عناية يومية مبنية على الراحة والملمس وسهولة الاستمرار بعد الاستحمام.",
      principles: [["راحة يومية", "قوام واضح وامتصاص يناسب إيقاع اليوم."], ["الملمس قبل الوعد", "اختاري لوشنًا أو قوامًا أغنى حسب الإحساس المطلوب."], ["هدية ذات معنى", "التنسيق والتغليف يخدمان مناسبة حقيقية."]],
      routes: [["روتين بعد الاستحمام", "ابني عادة بسيطة يمكن الحفاظ عليها.", "/routines"], ["حسب المكوّن", "افهمي القوام الغني والخفيف.", "/ingredients"], ["عالم الهدايا", "انتقلي إلى مجموعات مدروسة.", "/shop/beauty-sets"]],
    },
    tools: {
      title: "الأدوات", eyebrow: "TOOLS · PURPOSE IN EVERY DETAIL", image: assets.tools, imageAlt: "صورة مفاهيمية لأدوات الجمال",
      description: "كل أداة يجب أن تضيف وظيفة واضحة للتطبيق أو النظافة أو ترتيب الروتين.",
      principles: [["الاستخدام أولًا", "القيمة تبدأ مما تضيفه الأداة فعليًا."], ["رفيقة الروتين", "اربطِي الأداة بخطوة مفهومة لا بإضافة عشوائية."], ["العناية والاستبدال", "التنظيف والعمر المتوقع جزء من قرار الشراء."]],
      routes: [["روتين التطبيق", "اعرفي أين تدخل الأداة داخل الخطوات.", "/routines"], ["العودة للمكياج", "شاهدي الأداة ضمن سياق الإطلالة.", "/shop/makeup"], ["البحث المباشر", "ابحثي حسب الوظيفة أو النوع.", "/search?q=أدوات%20الجمال"]],
    },
    "beauty-sets": {
      title: "الهدايا والمجموعات", eyebrow: "GIFTING · BEAUTY, COMPOSED", image: assets.sets, imageAlt: "دراسة مفاهيمية لتغليف هدية ÉLORÉ",
      description: "مجموعة تصبح هدية عندما تكون المناسبة والاختيارات والتفاصيل مفهومة.",
      principles: [["المناسبة", "ابدئي بمن ستصل إليه الهدية ولماذا."], ["تنسيق مدروس", "كل عنصر يخدم فكرة واضحة داخل المجموعة."], ["تجربة التقديم", "التغليف والرسالة جزء من اللحظة، لا إضافة أخيرة."]],
      routes: [["حسب الروتين", "اختاري مجموعة تبدأ من خطوات منطقية.", "/routines"], ["العناية بالجسم", "هدية يومية هادئة وعملية.", "/shop/bodycare"], ["دليل الهدايا", "اقرئي قبل أن تختاري.", "/journal"]],
    },
  },
  en: {
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
      title: "Haircare", eyebrow: "HAIRCARE · ROOT TO RITUAL", image: assets.haircare, imageAlt: "Editorial haircare concept image",
      description: "From scalp to ends, a ritual shaped around texture, heat and humidity in your day.",
      principles: [["Scalp first", "Understand balance, cleansing and comfort before expanding the ritual."], ["Humidity and frizz", "Choose for the climate and the feel after styling."], ["Daily or intensive", "Separate light daily care from a deeper treatment."]],
      routes: [["Hair ritual", "Begin with the order of steps after washing.", "/routines"], ["By ingredient", "Understand what supports softness and comfort.", "/ingredients"], ["Search", "Move to a direct, focused search.", "/search?q=haircare"]],
    },
    bodycare: {
      title: "Bodycare", eyebrow: "BODYCARE · DAILY COMFORT", image: assets.bodycare, imageAlt: "Bodycare texture concept study",
      description: "Daily care shaped around comfort, texture and an after-shower ritual you can keep.",
      principles: [["Daily comfort", "Clear texture and absorption that suit the rhythm of your day."], ["Texture before promise", "Choose a lotion or richer feel for the moment you need."], ["A meaningful gift", "Composition and presentation should serve a real occasion."]],
      routes: [["After-shower ritual", "Build a simple habit you can maintain.", "/routines"], ["By ingredient", "Understand lighter and richer textures.", "/ingredients"], ["Gifting", "Move to a considered set.", "/shop/beauty-sets"]],
    },
    tools: {
      title: "Tools", eyebrow: "TOOLS · PURPOSE IN EVERY DETAIL", image: assets.tools, imageAlt: "Beauty tools concept image",
      description: "Every tool should add a clear purpose to application, hygiene or the order of a ritual.",
      principles: [["Use first", "Value begins with what the tool genuinely adds."], ["A ritual companion", "Connect the tool to a legible step, never a random add-on."], ["Care and replacement", "Cleaning and useful life belong in the decision."]],
      routes: [["Application ritual", "See where the tool belongs in the steps.", "/routines"], ["Back to makeup", "Understand the tool in the context of a look.", "/shop/makeup"], ["Direct search", "Search by function or type.", "/search?q=beauty%20tools"]],
    },
    "beauty-sets": {
      title: "Gifts and sets", eyebrow: "GIFTING · BEAUTY, COMPOSED", image: assets.sets, imageAlt: "ÉLORÉ gifting concept study",
      description: "A set becomes a gift when its occasion, choices and smallest details are understood.",
      principles: [["The occasion", "Begin with who will receive it and why."], ["Considered composition", "Every element should serve one clear idea."], ["The giving ritual", "Presentation and message belong to the moment, not the end."]],
      routes: [["By ritual", "Choose a set built around logical steps.", "/routines"], ["Bodycare", "A quiet, practical everyday gift.", "/shop/bodycare"], ["Gift journal", "Read before you choose.", "/journal"]],
    },
  },
};
