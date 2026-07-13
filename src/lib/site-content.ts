import { supportRouteLinks } from "@/lib/support-content";

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

export const siteUrl = getSiteUrl();

export const siteName = "Cozmateks";
export const siteTagline = "اختيارات جمال مدروسة للسوق السعودي";
export const defaultDescription =
  "بيت جمال سعودي يربط بين الاكتشاف الهادئ، الشرح الواضح، وصفحات شراء تساعدك على اتخاذ قرار أجمل وأكثر وعيًا.";

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export const trustPoints = [
  "اختيارات مدروسة بعناية",
  "شحن داخل السعودية",
  "سياسات واضحة قبل الدفع",
  "تتبع سهل للطلب",
];

export const primaryNavigation = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "المتجر" },
  { href: "/concerns", label: "حسب المشكلة" },
  { href: "/routines", label: "الروتينات" },
  { href: "/search", label: "البحث" },
  { href: "/journal", label: "المجلة" },
  { href: "/trust", label: "الثقة" },
];

export const footerPolicyLinks = [
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/trust/verification", label: "بيانات المنشأة" },
  { href: "/trust/privacy", label: "الخصوصية" },
  { href: "/trust/shipping", label: "الشحن والتوصيل" },
  { href: "/trust/returns", label: "الاستبدال والاسترجاع" },
  { href: "/trust/authenticity", label: "الأصالة والجودة" },
];

export const footerSupportLinks = [
  ...supportRouteLinks,
  { href: "/track-order", label: "تتبع الطلب" },
  { href: "/cart", label: "السلة" },
  { href: "/search", label: "البحث داخل المتجر" },
];

export const homeEntryPoints = [
  {
    title: "عناية بالبشرة",
    subtitle: "Skincare",
    href: "/shop/skincare",
    destinationType: "collection",
    description:
      "سيرومات، مرطبات، وواقيات شمس بصياغة تساعد العميلة تختار بسرعة ووعي.",
  },
  {
    title: "المكياج",
    subtitle: "Makeup",
    href: "/shop/makeup",
    destinationType: "collection",
    description:
      "ألوان مختارة ودرجات قابلة للفهم مع توجيه واضح للـ finish والثبات والمناسبة.",
  },
  {
    title: "العناية بالشعر",
    subtitle: "Haircare",
    href: "/shop/haircare",
    destinationType: "collection",
    description:
      "مسارات تركز على الفروة، الترطيب، ومقاومة الهيشان بدل تكديس منتجات متشابهة.",
  },
  {
    title: "العناية بالجسم",
    subtitle: "Bodycare",
    href: "/shop/bodycare",
    destinationType: "collection",
    description:
      "اختيارات يومية للراحة والملمس والرائحة الهادئة مع منطق شراء مناسب للهدايا والاستخدام المستمر.",
  },
  {
    title: "الأدوات",
    subtitle: "Tools",
    href: "/shop/tools",
    destinationType: "collection",
    description:
      "فرش وإكسسوارات وتطبيق عملي يشرح متى تحتاجين الأداة ومتى لا تضيف قيمة حقيقية.",
  },
  {
    title: "حسب المشكلة",
    subtitle: "Concern-led",
    href: "/concerns",
    destinationType: "concern_index",
    description:
      "مسارات شراء للتصبغات، الجفاف، البشرة الحساسة، والهالات بدل التصفح المشتت.",
  },
  {
    title: "الروتينات",
    subtitle: "Routine-led",
    href: "/routines",
    destinationType: "routine_index",
    description:
      "رحلات صباحية ومسائية وموسمية تبني السلة بطريقة أذكى وترفع التحويل بثقة.",
  },
  {
    title: "بيوتي سِتس",
    subtitle: "Beauty Sets",
    href: "/shop/beauty-sets",
    destinationType: "collection",
    description:
      "مجموعات جاهزة للهدايا أو البداية الذكية، مبنية على مناسبة واضحة لا على تجميع عشوائي.",
  },
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

export type ConcernRecord = {
  collection: CollectionSlug;
  slug: string;
  title: string;
  subtitle: string;
  answer: string;
  summary: string;
  keyIngredients: string[];
  routineHref: string;
  routineLabel: string;
  products: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export type RoutineRecord = {
  collection: CollectionSlug;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  audience: string[];
  steps: Array<{
    step: string;
    label: string;
    description: string;
    href?: string;
  }>;
  pairings: Array<{ label: string; href: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

export type IngredientRecord = {
  collection: CollectionSlug;
  slug: string;
  title: string;
  subtitle: string;
  answer: string;
  summary: string;
  role: string;
  fitNotes: string[];
  watchouts: string[];
  relatedConcernHrefs: string[];
  relatedRoutineHrefs: string[];
  productSlugs: string[];
  articleSlugs: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export type JournalArticle = {
  collection: CollectionSlug;
  slug: string;
  issue?: string;
  pillar: string;
  category: string;
  title: string;
  deck: string;
  excerpt: string;
  readingTime: string;
  publishedAt: string;
  updatedAt: string;
  answer: string;
  takeaways: string[];
  relatedConcern?: string;
  relatedRoutine: string;
  relatedProduct?: string;
  relatedIngredient?: string;
  nextStep: {
    href: string;
    label: string;
    destinationType: string;
  };
  featured?: boolean;
  sections: Array<{ heading: string; body: string }>;
  faq: Array<{ question: string; answer: string }>;
};

export const products: ProductRecord[] = [
  {
    collection: "skincare",
    slug: "radiant-dew-serum",
    name: "Radiant Dew Serum",
    subtitle:
      "سيروم صباحي بإحساس خفيف ولمسة مرتبة، مصمم لمسار إشراقة واضح داخل الروتين اليومي.",
    brand: "Cozmateks Atelier",
    category: "سيروم عناية بالبشرة",
    concern: "التصبغات",
    ingredient: "فيتامين C",
    description:
      "هذه صفحة منتج تأسيسية مصممة لتجسيد ما تطلبه الخطة: وضوح fit، استخدام مفهوم، وربط مباشر بين المكوّن والمشكلة والروتين من دون خطاب مبالغ فيه.",
    priceFrom: 149,
    shippingNote: "شحن داخل السعودية خلال 2-4 أيام عمل بعد اعتماد التكاملات التشغيلية.",
    skinTypes: ["البشرة المختلطة", "البشرة الدهنية", "البشرة العادية"],
    texture: "سيروم خفيف سريع الاندماج",
    finish: "إشراقة ناعمة غير طبقية",
    usageTiming: "صباحًا",
    routineStep: "بعد التنظيف وقبل الترطيب",
    badges: ["مختار بعناية", "روتين صباحي", "ملمس خفيف"],
    benefits: [
      "يساعد على بناء مسار إشراقة صباحي أكثر وضوحًا.",
      "يمنح ملمسًا خفيفًا يناسب النهار والأجواء الحارة.",
      "يندمج بسهولة داخل الروتين اليومي من دون إحساس مزعج.",
      "يوفّر نقطة بداية عملية لربط الحماية والترطيب في خطوة أوضح.",
    ],
    usage: [
      "يستخدم على بشرة نظيفة وجافة.",
      "يطبّق قبل المرطب وواقي الشمس.",
      "يناسب الروتين الصباحي عندما يكون الهدف إشراقة يومية واضحة.",
      "يرتبط بشكل أفضل مع مرطب داعم وحماية يومية مريحة.",
    ],
    ingredientsHighlights: [
      "فيتامين C لمسار إشراقة صباحي واضح.",
      "هيالورونيك أسيد لدعم الإحساس المريح أثناء الاستخدام.",
      "نياسيناميد بتركيبة متوازنة تسهّل دمجه داخل الروتين.",
    ],
    inciList:
      "Aqua, Ascorbyl Glucoside, Niacinamide, Sodium Hyaluronate, Glycerin, Panthenol, Phenoxyethanol.",
    warnings: [
      "للاستخدام الخارجي فقط.",
      "تجنب ملامسة العين مباشرة.",
      "يوقف الاستخدام عند ظهور انزعاج غير معتاد.",
    ],
    origin: "صياغة عرضية للتأسيس، مع حقل مخصص لإظهار بلد المنشأ الحقيقي عند ربط بيانات الكتالوج.",
    variants: [
      {
        sku: "RD-30",
        label: "الحجم الأساسي",
        size: "30ml",
        price: 149,
        compareAtPrice: 169,
        availability: "InStock",
      },
      {
        sku: "RD-50",
        label: "الحجم الممتد",
        size: "50ml",
        price: 219,
        compareAtPrice: 249,
        availability: "PreOrder",
      },
    ],
    pairings: [
      {
        label: "روتين صباحي للبشرة الدهنية",
        href: "/routines/morning-routine-oily-skin",
      },
      {
        label: "صفحة التصبغات",
        href: "/concerns/pigmentation",
      },
      {
        label: "مقال الفرق بين النياسيناميد وفيتامين C",
        href: "/journal/niacinamide-vs-vitamin-c-which-fits-your-routine",
      },
    ],
    questions: [
      {
        question: "هل هذا المنتج مناسب للبشرة الدهنية في النهار؟",
        answer:
          "الصفحة التأسيسية تفترض ملاءمته للنهار بملمس خفيف، مع ضرورة ربط هذا الادعاء لاحقًا ببيانات المنتج الفعلية عند إدارة الكتالوج.",
      },
      {
        question: "هل يمكن دمجه داخل روتين بسيط؟",
        answer:
          "نعم، لأنه مصمم هنا كمنتج يوضّح خطوة واحدة واضحة داخل الروتين بدل التكديس غير المفهوم.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "velvet-base-foundation",
    name: "Velvet Base Foundation",
    subtitle:
      "فاونديشن بلمسة مخملية متوازنة، مصمم لإطلالة مرتبة وثبات عملي يناسب الدوام والمناسبات.",
    brand: "Cozmateks Atelier",
    category: "فاونديشن ومكياج قاعدة",
    concern: "ثبات المكياج",
    ingredient: "هيالورونيك أسيد",
    description:
      "هذه صفحة منتج تأسيسية لفئة المكياج تترجم ما طلبته الخطة: وضوح الـ finish والـ coverage والدرجات، مع ربط مباشر بين القاعدة والمناسبة والروتين بدل ترك العميلة في حيرة.",
    priceFrom: 189,
    shippingNote: "شحن داخل السعودية خلال 2-4 أيام عمل بعد اعتماد التكاملات التشغيلية.",
    skinTypes: ["البشرة المختلطة", "البشرة العادية", "البشرة الدهنية"],
    texture: "سائل مرن سهل الدمج",
    finish: "مخملي ناعم بثبات عملي",
    usageTiming: "صباحًا أو قبل المناسبات",
    routineStep: "بعد التهيئة وقبل التثبيت",
    badges: ["تغطية متدرجة", "ثبات عملي", "مناسب للمناسبات"],
    benefits: [
      "يوفّر قاعدة مرتبة تساعد على توحيد المظهر من دون طبقات مزعجة.",
      "يدمج بين التغطية والراحة ليبقى مناسبًا للدوام والمناسبات معًا.",
      "يسهّل شرح القرار عبر finish واضح ودرجات مفهومة داخل الصفحة.",
      "يرتبط منطقيًا ببرايمر وتثبيت خفيف لرفع قيمة السلة بطريقة مفهومة.",
    ],
    usage: [
      "يطبّق بعد التهيئة المناسبة لنوع البشرة.",
      "يُبنى تدريجيًا للوصول إلى التغطية المطلوبة بدل طبقة واحدة ثقيلة.",
      "يُثبّت بلطف في المناطق التي تحتاج مزيدًا من الثبات خلال اليوم.",
      "يناسب الإطلالة اليومية والمناسبات عندما تكون النتيجة المطلوبة مرتبة ومخملية.",
    ],
    ingredientsHighlights: [
      "هيالورونيك أسيد لدعم الإحساس المريح أثناء التطبيق.",
      "صبغات متوازنة لنتيجة أوضح في شرح الدرجات والـ undertone.",
      "مكوّنات ملساء تساعد على اندماج أنيق من دون تكتل سريع.",
    ],
    inciList:
      "Aqua, Cyclopentasiloxane, Glycerin, Sodium Hyaluronate, Dimethicone, Iron Oxides, Phenoxyethanol.",
    warnings: [
      "للاستخدام الخارجي فقط.",
      "يفضّل تجربة الدرجة على مساحة صغيرة قبل الاستخدام الكامل.",
      "يحفظ بعيدًا عن الحرارة المباشرة وإغلاق العبوة بإحكام بعد الاستعمال.",
    ],
    origin:
      "صياغة عرضية للتأسيس، مع حقل مخصص لإظهار بلد المنشأ ومعلومات المستورد الحقيقية عند ربط الكتالوج.",
    variants: [
      {
        sku: "VBF-02",
        label: "Neutral Sand 02",
        size: "30ml",
        price: 189,
        compareAtPrice: 219,
        availability: "InStock",
      },
      {
        sku: "VBF-04",
        label: "Golden Beige 04",
        size: "30ml",
        price: 189,
        compareAtPrice: 219,
        availability: "PreOrder",
      },
    ],
    pairings: [
      {
        label: "روتين قاعدة مخملية للمناسبات",
        href: "/routines/occasion-base-routine",
      },
      {
        label: "صفحة ثبات المكياج",
        href: "/concerns/makeup-longwear",
      },
      {
        label: "دليل اختيار الفاونديشن للمناسبات",
        href: "/journal/how-to-choose-foundation-finish-for-events",
      },
    ],
    questions: [
      {
        question: "هل يناسب هذا الفاونديشن الأجواء الطويلة والمناسبات؟",
        answer:
          "هذه الصفحة التأسيسية تصفه كخيار بثبات عملي ونتيجة مخملية، مع ضرورة ربط الوصف لاحقًا باختبارات المنتج وبياناته النهائية داخل الكتالوج.",
      },
      {
        question: "كيف تقللين الحيرة بين الدرجات؟",
        answer:
          "الهدف هنا أن تظهر الدرجات ضمن منطق واضح للـ shade family والـ undertone بدل قائمة مبهمة لا تساعد على القرار.",
      },
    ],
  },
];

export const concerns: ConcernRecord[] = [
  {
    collection: "skincare",
    slug: "pigmentation",
    title: "التصبغات",
    subtitle: "Concern-led shopping",
    answer:
      "إذا كان هدفك هو بناء روتين أوضح للتصبغات، فابدئي بمسار بسيط يربط بين التنظيف اللطيف، مكوّن إشراقة صباحي مفهوم، ثم حماية يومية ثابتة.",
    summary:
      "صفحة المشكلة هنا ليست مجرد SEO landing page. هي طبقة شرح وفلترة وقرار: تعرّف المشكلة باختصار، تقترح المكوّنات الأكثر منطقية، ثم تنقل العميلة إلى روتين ومنتجات مرتبطة بنفس النية.",
    keyIngredients: ["فيتامين C", "نياسيناميد", "سيراميد"],
    routineHref: "/routines/morning-routine-oily-skin",
    routineLabel: "الانتقال إلى روتين صباحي واضح للبشرة الدهنية",
    products: ["radiant-dew-serum"],
    faqs: [
      {
        question: "هل أحتاج روتينًا طويلًا لعلاج التصبغات؟",
        answer:
          "الهدف في هذه المرحلة ليس الإكثار، بل بناء روتين أوضح وأسهل التزامًا يرتبط بالمكوّن المناسب والحماية اليومية.",
      },
      {
        question: "لماذا تبدأ الصفحة بالمشكلة لا بالمنتج؟",
        answer:
          "لأن نية البحث هنا تبدأ من السؤال والحيرة، لا من معرفة اسم المنتج مسبقًا. لذلك يجب أن تجيب الصفحة أولًا ثم تقود إلى الشراء.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "makeup-longwear",
    title: "ثبات المكياج",
    subtitle: "Makeup concern",
    answer:
      "إذا كان هدفك هو الحفاظ على قاعدة مرتبة لساعات أطول، فابدئي بتهيئة خفيفة، ثم منتج قاعدة واضح النتيجة، ثم تثبيت متوازن يناسب المناسبة والنهار.",
    summary:
      "صفحة المشكلة هنا تشرح قرار المكياج من منظور الاستخدام الفعلي: ماذا تحتاجين قبل المناسبة أو اليوم الطويل، وكيف تختارين finish وتغطية وثباتًا عمليًا من دون مبالغة أو طبقات كثيرة.",
    keyIngredients: ["هيالورونيك أسيد", "صبغات متوازنة", "مكوّنات ملساء"],
    routineHref: "/routines/occasion-base-routine",
    routineLabel: "الانتقال إلى روتين قاعدة مخملية للمناسبات",
    products: ["velvet-base-foundation"],
    faqs: [
      {
        question: "هل الثبات يعني دائمًا مظهرًا ثقيلاً؟",
        answer:
          "لا. الهدف في هذه الصفحة هو شرح كيفية الوصول إلى ثبات عملي مع نتيجة مرتبة ومريحة بدل ربط الثبات بطبقات كثيرة أو مظهر جامد.",
      },
      {
        question: "لماذا تبدأ الصفحة بالمشكلة لا بالدرجة فقط؟",
        answer:
          "لأن سؤال العميلة غالبًا يبدأ من النتيجة المطلوبة وطول الثبات، ثم ينتقل بعد ذلك إلى الدرجة والـ finish والمنتج المناسب.",
      },
    ],
  },
];

export const routines: RoutineRecord[] = [
  {
    collection: "skincare",
    slug: "morning-routine-oily-skin",
    title: "روتين صباحي للبشرة الدهنية",
    subtitle: "Routine-led shopping",
    summary:
      "هذا الروتين مصمم ليبني قرارًا يوميًا متماسكًا: تنظيف لطيف، علاج أوضح، ترطيب متوازن، ثم حماية يومية مريحة داخل الأجواء الحارة.",
    audience: [
      "البشرة الدهنية",
      "البشرة المختلطة",
      "من تريد روتينًا صباحيًا أخف وأوضح",
    ],
    steps: [
      {
        step: "01",
        label: "تنظيف لطيف",
        description:
          "ابدئي بخطوة تنظف البشرة من دون أن تترك إحساسًا بالشد أو تدفعك إلى تعويض زائد لاحقًا.",
      },
      {
        step: "02",
        label: "سيروم إشراقة خفيف",
        description:
          "أدخلي منتجًا واحدًا واضح الدور يساعد على بناء روتين صباحي مفهوم بدل تكديس العلاجات.",
        href: "/products/radiant-dew-serum",
      },
      {
        step: "03",
        label: "ترطيب متوازن",
        description:
          "اختاري مرطبًا يدعم الراحة اليومية من دون طبقة ثقيلة أو إحساس مزعج تحت الحماية والمكياج.",
      },
      {
        step: "04",
        label: "حماية يومية",
        description:
          "اختتمي الروتين بحماية مريحة تناسب الأجواء الحارة، وتنسجم مع القوام الخفيف خلال النهار.",
      },
    ],
    pairings: [
      { label: "صفحة التصبغات", href: "/concerns/pigmentation" },
      { label: "سيروم Radiant Dew", href: "/products/radiant-dew-serum" },
      {
        label: "مقال الواقي الخفيف للبشرة الدهنية",
        href: "/journal/best-light-sunscreen-oily-skin-saudi-weather",
      },
    ],
    faqs: [
      {
        question: "هل يجب تنفيذ كل الخطوات يوميًا؟",
        answer:
          "الهدف من هذه الصفحة هو الترتيب والوضوح. يمكن تبسيط الروتين بحسب الحاجة، ما دام المسار الأساسي واضحًا وقابلًا للالتزام.",
      },
      {
        question: "كيف يخدم هذا الروتين التحويل داخل المتجر؟",
        answer:
          "لأنه يجمع بين القرار التعليمي والمسار التجاري: كل خطوة تشرح لماذا توجد، ثم تربط بمنتج أو فئة أو مقال داعم.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "occasion-base-routine",
    title: "روتين قاعدة مخملية للمناسبات",
    subtitle: "Makeup routine",
    summary:
      "هذا الروتين مصمم لبناء قاعدة مكياج أوضح: تهيئة متوازنة، برايمر عند الحاجة، فاونديشن بلمسة مرتبة، ثم تثبيت يحافظ على الشكل من دون مبالغة.",
    audience: [
      "من تبحث عن ثبات عملي للمناسبات",
      "من تريد نتيجة مرتبة من دون طبقات مزعجة",
      "من تحتاج منطقًا أوضح لاختيار القاعدة والتثبيت",
    ],
    steps: [
      {
        step: "01",
        label: "تهيئة خفيفة",
        description:
          "ابدئي بترطيب متوازن يهيئ البشرة من دون أن يترك سطحًا زلقًا أو طبقة ثقيلة قبل المكياج.",
      },
      {
        step: "02",
        label: "برايمر عند الحاجة",
        description:
          "أضيفي برايمر فقط عندما يخدم النتيجة المطلوبة فعلًا، خاصة في المناطق التي تحتاج نعومة أو ثباتًا إضافيًا.",
      },
      {
        step: "03",
        label: "فاونديشن مخملي",
        description:
          "اختاري قاعدة سهلة الدمج يمكن بناؤها تدريجيًا بحسب المناسبة وشكل التغطية المطلوب.",
        href: "/products/velvet-base-foundation",
      },
      {
        step: "04",
        label: "تثبيت متوازن",
        description:
          "اختتمي الخطوات بتثبيت خفيف على المناطق الأكثر حاجة، حتى تحافظي على المظهر المرتب من دون جفاف أو مبالغة.",
      },
    ],
    pairings: [
      { label: "صفحة ثبات المكياج", href: "/concerns/makeup-longwear" },
      { label: "Velvet Base Foundation", href: "/products/velvet-base-foundation" },
      {
        label: "دليل اختيار الفاونديشن للمناسبات",
        href: "/journal/how-to-choose-foundation-finish-for-events",
      },
    ],
    faqs: [
      {
        question: "هل هذا الروتين مناسب فقط للمناسبات الليلية؟",
        answer:
          "لا. يمكن تبسيطه للنهار أو الدوام متى كانت الحاجة إلى قاعدة مرتبة وثابتة، مع تخفيف عدد الخطوات بحسب الاستخدام الفعلي.",
      },
      {
        question: "كيف يخدم هذا الروتين التحويل داخل المتجر؟",
        answer:
          "لأنه يشرح كيف تبنى القاعدة خطوة بخطوة، ثم يربط كل قرار بصفحة منتج أو صفحة مشكلة أو مقال يخفف الحيرة قبل الشراء.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "humidity-proof-hair-routine",
    title: "روتين تهدئة الهيشان بعد الغسيل",
    subtitle: "Haircare routine",
    summary:
      "هذا الروتين يساعد على ترتيب قرار العناية بالشعر داخل الأجواء الحارة أو الرطبة: تنظيف مريح، راحة للفروة، دعم للأطراف، ثم حماية تقلل الهيشان بعد التجفيف أو التصفيف.",
    audience: [
      "من يزعجها الهيشان بعد الغسيل أو التصفيف",
      "من تريد روتينًا أخف للشعر داخل الرطوبة أو الحر",
      "من تبحث عن فرق واضح بين عناية الفروة وعناية الأطراف",
    ],
    steps: [
      {
        step: "01",
        label: "تنظيف لا يرهق الفروة",
        description:
          "ابدئي بخطوة تنظف الفروة من دون أن تتركها مشدودة أو تدفعك إلى تعويض ثقيل لاحقًا.",
      },
      {
        step: "02",
        label: "دعم للفروة أو الجذور عند الحاجة",
        description:
          "إذا كان الانزعاج يبدأ من الفروة، فاجعلي خطوة الدعم هناك أولًا بدل إغراق الأطراف بمنتجات لا تعالج أصل المشكلة.",
      },
      {
        step: "03",
        label: "ترطيب يهدئ الأطراف",
        description:
          "وزعي طبقة خفيفة أو متوسطة على الأطراف حتى يبقى الشعر مرتبًا بعد الجفاف من دون ملمس دهني سريع.",
      },
      {
        step: "04",
        label: "تهذيب ما بعد التصفيف",
        description:
          "اختتمي بخطوة صغيرة تقلل الهيشان وتحافظ على الشكل عندما يواجه الشعر حرارة اليوم أو الرطوبة.",
      },
    ],
    pairings: [
      { label: "العناية بالشعر", href: "/shop/haircare" },
      { label: "صفحة بانثينول", href: "/ingredients/panthenol" },
      { label: "ابحثي عن هيشان الشعر", href: "/search?q=هيشان%20الشعر" },
    ],
    faqs: [
      {
        question: "هل هذه الصفحة تعني أن كتالوج الشعر مكتمل بالفعل؟",
        answer:
          "لا. الهدف هنا هو بناء منطق واضح للروتين نفسه حتى تصبح إضافة المنتجات لاحقًا امتدادًا طبيعيًا بدل أن تبقى الفئة بلا طريقة شراء مفهومة.",
      },
      {
        question: "لماذا لا تبدأ الصفحة بمنتج واحد مباشر؟",
        answer:
          "لأن سؤال الشعر غالبًا يبدأ من الفروة أو الهيشان أو الأطراف، لا من اسم منتج محدد. لذلك يبقى الروتين أفضل مدخل لتقليل الحيرة أولًا.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "after-shower-body-routine",
    title: "روتين راحة الجسم بعد الاستحمام",
    subtitle: "Bodycare routine",
    summary:
      "هذا الروتين يرتب قرار bodycare حول لحظة واضحة ومكررة: ما بعد الاستحمام. الهدف هو التمييز بين الترطيب، التهدئة، العناية باليدين أو المناطق الجافة، ثم تحويل ذلك إلى عادة سهلة أو هدية عملية.",
    audience: [
      "من تريد روتينًا يوميًا سهل الالتزام",
      "من تفضّل ملمسًا مريحًا غير لزج",
      "من تفكر في bodycare كعادة شخصية أو هدية عملية",
    ],
    steps: [
      {
        step: "01",
        label: "اختيار القوام المناسب لليوم",
        description:
          "ابدئي من ملمس يناسب وقتك وطقسك: سريع الامتصاص للأيام العملية أو أغنى قليلًا عندما تحتاج البشرة راحة أطول.",
      },
      {
        step: "02",
        label: "التركيز على المناطق الأسرع جفافًا",
        description:
          "وجهي الانتباه إلى اليدين والمرفقين والساقين بدل توزيع طبقات كثيرة على كامل الجسم بلا حاجة واضحة.",
      },
      {
        step: "03",
        label: "لمسة تهدئة أو رائحة خفيفة",
        description:
          "أضيفي خطوة مكملة فقط عندما تخدم الإحساس العام: راحة، ترتيب، أو رائحة هادئة تبقى قريبة من الاستخدام اليومي.",
      },
      {
        step: "04",
        label: "تحويل الروتين إلى set عند الحاجة",
        description:
          "إذا كانت النية أقرب إلى هدية أو بداية مرتبة، فانقلي الروتين إلى مجموعة جاهزة بدل اختيار منتجات منفصلة من دون قصة واضحة.",
      },
    ],
    pairings: [
      { label: "العناية بالجسم", href: "/shop/bodycare" },
      { label: "الهدايا والمجموعات", href: "/shop/beauty-sets" },
      { label: "صفحة زبدة الشيا", href: "/ingredients/shea-butter" },
    ],
    faqs: [
      {
        question: "هل هذا الروتين للاستخدام اليومي فقط؟",
        answer:
          "هو يبدأ من الاستخدام اليومي لأنه أوضح نقطة قرار، لكنه يتحول بسهولة إلى منطق gifting أو starter set عندما تصبح المناسبة مختلفة.",
      },
      {
        question: "لماذا يرتبط الروتين هنا بالمجموعات الجاهزة؟",
        answer:
          "لأن bodycare من أكثر الفئات التي تتحول طبيعيًا إلى هدية أو باقة بداية، ومن الأفضل أن يظهر هذا الجسر داخل الروتين نفسه.",
      },
    ],
  },
];

export const featuredProducts = [
  {
    name: "Radiant Dew Serum",
    category: "تفتيح وإشراقة",
    note: "ملمس خفيف يناسب الأجواء الحارة والروتين الصباحي.",
    href: "/products/radiant-dew-serum",
  },
  {
    name: "Velvet Base Foundation",
    category: "مكياج يومي ثابت",
    note: "توجيه واضح للـ coverage والـ undertone وتقليل الحيرة قبل الشراء.",
    href: "/products/velvet-base-foundation",
  },
  {
    name: "Silk Barrier Cream",
    category: "ترميم وتهدئة",
    note: "تركيز على راحة البشرة الحساسة من دون ادعاءات علاجية.",
    href: "/routines/morning-routine-oily-skin",
  },
];

export const ingredients: IngredientRecord[] = [
  {
    collection: "skincare",
    slug: "niacinamide",
    title: "نياسيناميد",
    subtitle: "Ingredient-led balance",
    answer:
      "نياسيناميد يفيد عندما تكون النية مرتبطة بتوازن المظهر وتقليل الارتباك في بناء روتين يومي هادئ وقابل للاستمرار.",
    summary:
      "هذه الصفحة تجعل المكوّن نقطة قرار لا مصطلحًا تسويقيًا. الهدف هو شرح متى يخدم الروتين، وكيف يرتبط بالمشكلة والمنتج والمحتوى.",
    role:
      "لتوازن المظهر وتقليل الارتباك في اختيار المنتجات اليومية.",
    fitNotes: [
      "مناسب عندما تريد الزائرة روتينًا أبسط وأقل تعقيدًا في الاختيار.",
      "يعمل بشكل أفضل عندما يُشرح داخل سياق الروتين وليس كوعد مبالغ فيه.",
      "يناسب الاكتشاف الذي يبدأ من المشكلة أو البحث عن ملمس واضح في الروتين اليومي.",
    ],
    watchouts: [
      "لا يجب تقديم هذا المكوّن كحل علاجي مطلق لكل حالة.",
      "قيمته التجارية تظهر أكثر عند ربطه بمنتج واستخدام وتوقيت استخدام واضحة.",
      "الاعتماد على اسم المكوّن وحده لا يغني عن شرح اللمسة والاندماج في الروتين.",
    ],
    relatedConcernHrefs: ["/concerns/pigmentation"],
    relatedRoutineHrefs: ["/routines/morning-routine-oily-skin"],
    productSlugs: ["radiant-dew-serum"],
    articleSlugs: [
      "niacinamide-vs-vitamin-c-which-fits-your-routine",
      "build-balanced-morning-routine-combination-skin",
    ],
    faqs: [
      {
        question: "متى يصبح نياسيناميد مدخلًا جيدًا للبحث؟",
        answer:
          "عندما تكون النية أقرب إلى بناء روتين متوازن ومفهوم بدل القفز إلى اسم منتج محدد من أول لحظة.",
      },
      {
        question: "هل هذه الصفحة بديل عن صفحة المنتج؟",
        answer:
          "لا. هي طبقة قرار تشرح مكان المكوّن في التجربة، بينما تظل صفحة المنتج المكان الذي يحسم السعر والتوفر والملمس والشراء.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "vitamin-c",
    title: "فيتامين C",
    subtitle: "Ingredient-led radiance",
    answer:
      "فيتامين C يفيد عندما تكون النية مرتبطة بإشراقة صباحية واضحة وبناء روتين أكثر توجيهًا لما تريده الزائرة فعلًا.",
    summary:
      "صفحة ingredient-led للإشراقة الصباحية تربط بين المكوّن والحماية والروتين والمنتج والمقال، بدل ترك البحث معلقًا على اسم المكوّن فقط.",
    role:
      "لمسار إشراقة صباحي واضح، مع ربطه بالروتين والحماية والقوام المناسب للنهار.",
    fitNotes: [
      "مناسب عندما تبدأ الزائرة من نية إشراقة أو مظهر أكثر حيوية في الصباح.",
      "يخدم مسارات البحث التي ترتبط بالأجواء الحارة والاستخدام الخفيف تحت الحماية.",
      "يظهر بشكل أفضل عند الربط بمشكلة مثل التصبغات وروتين مناسب للنهار.",
    ],
    watchouts: [
      "لا يجب تحويله إلى ادعاء علاجي مبالغ فيه.",
      "إقناع الزائرة ينجح عبر شرح القوام والتوقيت والربط بواقي الشمس لا عبر اسم المكوّن وحده.",
      "صفحة المكوّن يجب أن تبقى جسرًا إلى المنتج والروتين وليست نهاية المسار.",
    ],
    relatedConcernHrefs: ["/concerns/pigmentation"],
    relatedRoutineHrefs: ["/routines/morning-routine-oily-skin"],
    productSlugs: ["radiant-dew-serum"],
    articleSlugs: [
      "best-light-sunscreen-oily-skin-saudi-weather",
      "niacinamide-vs-vitamin-c-which-fits-your-routine",
    ],
    faqs: [
      {
        question: "لماذا يُعد فيتامين C مدخلًا قويًا للبحث؟",
        answer:
          "لأن النية المرتبطة بالإشراقة والاستخدام الصباحي كثيرًا ما تبدأ بالمكوّن بدل اسم المنتج.",
      },
      {
        question: "هل ستقودني صفحة المكوّن إلى الحماية والروتين أم إلى المنتج فقط؟",
        answer:
          "الهدف هو ربط الطرفين معًا: منتج واضح وروتين أنسب ومسار تحريري يقلل الحيرة قبل الشراء.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "hyaluronic-acid",
    title: "هيالورونيك أسيد",
    subtitle: "Ingredient-led comfort and texture",
    answer:
      "هيالورونيك أسيد يصبح مفيدًا عندما تكون النية مرتبطة بالراحة والملمس واندماج المنتج داخل الروتين، سواء في العناية أو المكياج.",
    summary:
      "هذه الصفحة تربط بين المكوّن كعنصر راحة واندماج، وبين التطبيق اليومي في العناية والمكياج من دون اختزال القرار في اسم المكوّن فقط.",
    role:
      "للترطيب التدريجي بملمس مريح وسهل الدمج داخل الروتين وتجربة المكياج.",
    fitNotes: [
      "يخدم الزائرة التي تبحث عن راحة الملمس وسهولة الاندماج في التطبيق.",
      "يربط بشكل جيد بين العناية بالبشرة وتجربة القاعدة عندما يكون الهدف مظهرًا مرتبًا ومريحًا.",
      "مناسب لمسارات البحث التي تدور حول الاندرتون واللمسة والثبات العملي.",
    ],
    watchouts: [
      "لا يجب تقديمه كمبرر وحيد لجودة المنتج أو ملاءمته.",
      "قيمته تظهر عندما يترجم إلى قوام وتطبيق وراحة ملموسة.",
      "بعض الزوار يبحثون عن هذا المكوّن داخل المكياج وآخرون داخل العناية، لذلك يجب أن تبقى الروابط عابرة للفئات.",
    ],
    relatedConcernHrefs: ["/concerns/makeup-longwear"],
    relatedRoutineHrefs: [
      "/routines/occasion-base-routine",
      "/routines/morning-routine-oily-skin",
    ],
    productSlugs: ["radiant-dew-serum", "velvet-base-foundation"],
    articleSlugs: [
      "how-to-choose-foundation-finish-for-events",
      "build-balanced-morning-routine-combination-skin",
    ],
    faqs: [
      {
        question: "هل هيالورونيك أسيد مدخل مناسب للبحث داخل المكياج أيضًا؟",
        answer:
          "نعم. بعض الزائرات يربطن بين الراحة واللمسة والقاعدة المناسبة، لذلك يفيد وجود هذه الطبقة الاكتشافية.",
      },
      {
        question: "هل تقودني هذه الصفحة إلى العناية أم المكياج؟",
        answer:
          "إلى الاثنين عندما يكون ذلك منطقيًا. الهدف هنا هو خدمة نية البحث بدل فرض حد فئوي ضيق عليها.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "panthenol",
    title: "بانثينول",
    subtitle: "Ingredient-led calm and softness",
    answer:
      "بانثينول يصبح مفيدًا عندما تكون النية مرتبطة براحة الفروة أو نعومة الأطراف من دون تحويل العناية بالشعر إلى طبقات ثقيلة أو وعود مبالغ فيها.",
    summary:
      "هذه الصفحة تجعل بانثينول مدخلًا واضحًا لقرار haircare: متى يخدم الفروة، متى يهدئ الأطراف، وكيف يبقى دوره جزءًا من روتين مريح لا شعارًا تسويقيًا فقط.",
    role:
      "لدعم الراحة والنعومة داخل روتين شعر يومي أو بعد الغسيل.",
    fitNotes: [
      "يناسب من تبحث عن خطوة مريحة لا تُثقل الشعر بعد الغسيل.",
      "يخدم الربط بين راحة الفروة وتهذيب الأطراف عندما يكون السؤال أوسع من اسم المنتج نفسه.",
      "يعمل أفضل عندما يُشرح في سياق الهيشان والملمس وسهولة التصفيف.",
    ],
    watchouts: [
      "لا يجب تقديمه كحل شامل لكل مشاكل الشعر أو الفروة.",
      "قيمته التجارية لا تظهر باسم المكوّن وحده، بل بطريقة دمجه داخل روتين واضح وخفيف.",
      "صفحة المكوّن يجب أن تبقى جسرًا إلى الروتين والبحث والفئة لا نهاية المسار.",
    ],
    relatedConcernHrefs: [],
    relatedRoutineHrefs: ["/routines/humidity-proof-hair-routine"],
    productSlugs: [],
    articleSlugs: [],
    faqs: [
      {
        question: "متى يكون بانثينول مدخلًا جيدًا للبحث؟",
        answer:
          "عندما يكون السؤال عن الراحة والنعومة بعد الغسيل أو عن خطوة أخف تقلل الهيشان بدل البحث المباشر عن اسم منتج محدد.",
      },
      {
        question: "هل هذه الصفحة بديل عن صفحات المنتجات؟",
        answer:
          "لا. هي طبقة قرار تساعد على فهم دور المكوّن الآن، إلى أن تتوسع طبقة المنتجات المرتبطة بالشعر داخل المشروع.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "shea-butter",
    title: "زبدة الشيا",
    subtitle: "Ingredient-led comfort and gifting",
    answer:
      "زبدة الشيا تصبح مدخلًا جيدًا عندما تكون النية مرتبطة براحة الملمس، الإحساس بعد الاستحمام، أو اختيار bodycare تبدو غنية ومفهومة كجزء من set أو عادة يومية.",
    summary:
      "هذه الصفحة تربط زبدة الشيا براحة الجسم والملمس والتغليف العملي، بحيث تصبح جزءًا من قرار bodycare أو gifting بدل أن تبقى اسم مكوّن يطفو وحده فوق التجربة.",
    role:
      "للملمس الأكثر غنى والراحة الممتدة داخل bodycare أو المجموعات الجاهزة.",
    fitNotes: [
      "تناسب من تبحث عن ملمس أغنى قليلًا ومريحًا بعد الاستحمام.",
      "تخدم نية gifting عندما تكون الفكرة مرتبطة بالراحة والنعومة لا بالعلاج أو المبالغة في الادعاء.",
      "يظهر دورها بوضوح أكبر عندما ترتبط بروتين جسم أو set واضحة الاستخدام.",
    ],
    watchouts: [
      "لا يجب اختزال bodycare كلها في مكوّن واحد أو ملمس واحد.",
      "الغنى في القوام لا يعني أنه يناسب كل وقت أو كل طقس، لذلك يجب أن يبقى السياق واضحًا.",
      "هذه الصفحة لا تغني عن شرح التغليف والشحن عندما تتحول النية إلى هدية.",
    ],
    relatedConcernHrefs: [],
    relatedRoutineHrefs: ["/routines/after-shower-body-routine"],
    productSlugs: [],
    articleSlugs: [],
    faqs: [
      {
        question: "متى يكون البحث عن زبدة الشيا منطقياً داخل المتجر؟",
        answer:
          "عندما تبدأ النية من الراحة والملمس الغني أو من هدية bodycare هادئة، لا من مقارنة تقنية بين أسماء كثيرة لا تضيف وضوحًا فعليًا.",
      },
      {
        question: "هل هذه الصفحة تقودني إلى bodycare أم إلى beauty sets؟",
        answer:
          "إلى الاثنين بحسب النية: bodycare عندما يكون الهدف عادة يومية، وbeauty sets عندما يصبح القرار أقرب إلى هدية أو starter set.",
      },
    ],
  },
];

export const skincareCategory = {
  title: "العناية بالبشرة",
  subtitle: "Skincare Collection",
  description:
    "مختارات عناية بالبشرة مصممة لتسهيل القرار داخل السوق السعودي، مع توجيه أوضح لنوع البشرة، الملمس، التوقيت، والروتين المناسب.",
  introduction:
    "هذه الصفحة تعمل كصفحة تصفح وبيع وSEO في الوقت نفسه: تصفّي الازدحام، تشرح لمن تناسب الفئة، وتربط بين المشكلة والمكوّن والروتين بدل عرض منتجات بلا سياق.",
  filters: [
    "نوع البشرة",
    "المشكلة",
    "المكوّن",
    "البراند",
    "السعر",
    "SPF",
    "Fragrance-free",
    "Bestseller",
  ],
  concerns: ["التصبغات", "الجفاف", "البشرة الحساسة", "البهتان"],
  routines: [
    "روتين صباحي للبشرة الدهنية",
    "روتين مسائي للبشرة الجافة",
    "روتين للمبتدئات",
  ],
  featuredCards: [
    {
      title: "Hydration Edit",
      label: "Daily comfort",
      body: "ترطيب تدريجي بملمس مريح ينسجم مع التكييف والأجواء الحارة من دون ثقل.",
    },
    {
      title: "Barrier Support",
      label: "Sensitive care",
      body: "تركيبات تهدف إلى تهدئة الانزعاج الظاهري وتقليل تعقيد الروتين للبشرة الحساسة.",
    },
    {
      title: "Morning Radiance",
      label: "Routine-led",
      body: "مسار واضح للإشراقة الصباحية يربط بين فيتامين C، الحماية، والقوام المناسب للنهار.",
    },
  ],
  faqs: [
    {
      question: "كيف أبدأ اختيار منتجات العناية بالبشرة داخل هذه الفئة؟",
      answer:
        "ابدئي بالمشكلة الأساسية أولًا، ثم راجعي نوع البشرة والملمس المرغوب، وبعدها اختاري الروتين الذي يناسب وقت الاستخدام صباحًا أو مساءً.",
    },
    {
      question: "هل كل المنتجات مناسبة للأجواء الحارة؟",
      answer:
        "ليست كل التركيبات متشابهة؛ لذلك نوضح على مستوى الصفحة والمنتج القوام المتوقع والملاءمة للنهار والأجواء الحارة بقدر ما تسمح بيانات المنتج.",
    },
  ],
};

export const makeupCategory = {
  title: "المكياج",
  subtitle: "Makeup Collection",
  description:
    "مختارات مكياج مصممة لتسهيل القرار داخل السوق السعودي، مع توجيه أوضح للدرجة، التغطية، النتيجة النهائية، ومنطق الاستخدام اليومي أو المناسبات.",
  introduction:
    "هذه الصفحة تعمل كصفحة تصفح وبيع وSEO للمكياج: ترتب قرار القاعدة واللون والـ finish، وتربط بين الثبات والروتين والمقال والمنتج بدل ترك العميلة وسط مصطلحات غير واضحة.",
  filters: [
    "النتيجة النهائية",
    "درجة التغطية",
    "فئة الدرجات",
    "الاندرتون",
    "المناسبة",
    "البراند",
    "السعر",
    "Bestseller",
  ],
  featuredCards: [
    {
      title: "Velvet Base Edit",
      label: "Event-ready",
      body: "تركيز على القاعدة المرتبة والثبات العملي والـ finish المخملي الذي لا يتحول إلى طبقات مزعجة.",
    },
    {
      title: "Daily Soft Glam",
      label: "Everyday clarity",
      body: "مسار واضح لإطلالة يومية ناعمة يبدأ من القوام المناسب لا من ازدحام المنتجات.",
    },
    {
      title: "Shade Logic",
      label: "Decision support",
      body: "شرح للدرجات والـ undertone والملمس حتى يصبح قرار الشراء أسرع وأقل مخاطرة.",
    },
  ],
  faqs: [
    {
      question: "كيف أبدأ اختيار منتجات المكياج داخل هذه الفئة؟",
      answer:
        "ابدئي بالمناسبة أو النتيجة المطلوبة أولًا، ثم حددي مستوى التغطية والـ finish، وبعدها انتقلي إلى الدرجة المناسبة بدل القفز مباشرة إلى اسم المنتج فقط.",
    },
    {
      question: "هل كل منتجات المكياج هنا موجهة للمناسبات؟",
      answer:
        "لا. الصفحة مبنية لتخدم الاستخدام اليومي والمناسبات معًا، لكن مع شرح أوضح للثبات والملمس والتغطية حتى يكون الاختيار مبنيًا على السياق الفعلي.",
    },
  ],
};

type ShopCollectionDiscoveryLink = {
  title: string;
  label: string;
  href: string;
  description: string;
  destinationType: string;
};

export type ShopCollectionPage = {
  slug: CollectionSlug;
  mode: "filtered" | "editorial";
  title: string;
  subtitle: string;
  href: string;
  description: string;
  introduction: string;
  entryDescription: string;
  searchTerms: string[];
  shoppingSignals: string[];
  focusCards: Array<{ title: string; label: string; body: string }>;
  discoveryLinks: ShopCollectionDiscoveryLink[];
  faqs: Array<{ question: string; answer: string }>;
};

export const editorialCollectionSlugs: CollectionSlug[] = [
  "haircare",
  "bodycare",
  "tools",
  "beauty-sets",
];

export const shopCollections: ShopCollectionPage[] = [
  {
    slug: "skincare",
    mode: "filtered",
    title: skincareCategory.title,
    subtitle: skincareCategory.subtitle,
    href: "/shop/skincare",
    description: skincareCategory.description,
    introduction: skincareCategory.introduction,
    entryDescription:
      "فئة أساسية تربط الفلاتر الحية بالمشكلة والمكوّن والروتين لتقليل التشتت ورفع وضوح القرار.",
    searchTerms: [
      "skincare",
      "العناية بالبشرة",
      "سيروم",
      "مرطب",
      "واقي شمس",
      "فيتامين c",
    ],
    shoppingSignals: [
      "عندما تكون النية مرتبطة بنوع البشرة أو المشكلة قبل اسم المنتج نفسه.",
      "عندما تحتاج الزائرة إلى فلترة عملية تعيد ترتيب النتائج حسب التوقيت والملمس والاحتياج.",
      "عندما يكون القرار أقرب إلى روتين يومي واضح لا إلى منتج منفرد فقط.",
    ],
    focusCards: skincareCategory.featuredCards,
    discoveryLinks: [
      {
        title: "الدخول إلى صفحة الفئة المفلترة",
        label: "Filtered collection",
        href: "/shop/skincare",
        description:
          "ابدئي من صفحة الفئة الأساسية عندما تكون الحاجة إلى تصفية النتائج ومقارنتها بسرعة.",
        destinationType: "collection",
      },
      {
        title: "التصبغات",
        label: "Concern-led",
        href: "/concerns/pigmentation",
        description:
          "انتقلي إلى صفحة المشكلة عندما يكون السؤال أقرب إلى النتيجة أو الاحتياج من اسم المنتج.",
        destinationType: "concern",
      },
      {
        title: "فيتامين C",
        label: "Ingredient-led",
        href: "/ingredients/vitamin-c",
        description:
          "هذا المسار يخدم نية البحث عندما تبدأ من المكوّن وترغبين في فهم الروتين المرتبط به.",
        destinationType: "ingredient",
      },
      {
        title: "دليل الواقي الخفيف",
        label: "Editorial support",
        href: "/journal/best-light-sunscreen-oily-skin-saudi-weather",
        description:
          "المقال التحريري هنا يدعم قرار الشراء بدل أن يبقى محتوى منفصلًا عن التصفح التجاري.",
        destinationType: "article",
      },
    ],
    faqs: skincareCategory.faqs,
  },
  {
    slug: "makeup",
    mode: "filtered",
    title: makeupCategory.title,
    subtitle: makeupCategory.subtitle,
    href: "/shop/makeup",
    description: makeupCategory.description,
    introduction: makeupCategory.introduction,
    entryDescription:
      "فئة مبنية على finish والتغطية والثبات وسياق الاستخدام بدل ترك القرار معلقًا على أسماء منتجات متشابهة.",
    searchTerms: [
      "makeup",
      "المكياج",
      "foundation",
      "كونسيلر",
      "ثبات المكياج",
      "soft glam",
    ],
    shoppingSignals: [
      "عندما تبدأ الحيرة من التغطية أو الثبات أو الـ finish وليس من البراند.",
      "عندما تحتاج الزائرة إلى فهم الدرجات والملمس وسياق الاستخدام اليومي أو المناسبات.",
      "عندما يجب ربط القاعدة بالمقال والروتين والثقة بدل صفحة بيع منفصلة عن باقي الرحلة.",
    ],
    focusCards: makeupCategory.featuredCards,
    discoveryLinks: [
      {
        title: "الدخول إلى صفحة المكياج المفلترة",
        label: "Filtered collection",
        href: "/shop/makeup",
        description:
          "هذا هو السطح الأنسب عندما تكون الحاجة إلى فلترة النتيجة النهائية والتغطية بسرعة.",
        destinationType: "collection",
      },
      {
        title: "ثبات المكياج",
        label: "Concern-led",
        href: "/concerns/makeup-longwear",
        description:
          "صفحة المشكلة تساعد عندما يكون السؤال مرتبطًا بثبات الإطلالة أو ملاءمتها للمناسبة.",
        destinationType: "concern",
      },
      {
        title: "روتين قاعدة للمناسبات",
        label: "Routine-led",
        href: "/routines/occasion-base-routine",
        description:
          "هذا المسار يشرح ترتيب الخطوات قبل التحول إلى المنتج أو السلة.",
        destinationType: "routine",
      },
      {
        title: "اختيار finish الفاونديشن",
        label: "Editorial support",
        href: "/journal/how-to-choose-foundation-finish-for-events",
        description:
          "المقال التحريري يفسر لغة الـ finish والثبات ويختصر وقت التجربة والخطأ.",
        destinationType: "article",
      },
    ],
    faqs: makeupCategory.faqs,
  },
  {
    slug: "haircare",
    mode: "editorial",
    title: "العناية بالشعر",
    subtitle: "Haircare Collection",
    href: "/shop/haircare",
    description:
      "صفحة فئة مهيأة للفهرسة والاكتشاف التجاري تقود الزائرة إلى منطق اختيار أوضح في العناية بالشعر: الفروة، الترطيب، مقاومة الهيشان، والحرارة اليومية داخل الأجواء السعودية.",
    introduction:
      "هذه ليست صفحة منتجات فارغة. هي سطح قرار يشرح متى تبدأين من الفروة، متى يكون الاحتياج مرتبطًا بالأطراف أو الهيشان، وكيف تختارين بين روتين يومي خفيف أو معالجة أعمق قبل توسيع الكتالوج الفعلي.",
    entryDescription:
      "مسار واضح للفروة، الترطيب، مقاومة الهيشان، والعناية اليومية في الأجواء الحارة أو الرطبة.",
    searchTerms: [
      "haircare",
      "العناية بالشعر",
      "شامبو",
      "ماسك شعر",
      "فروة الرأس",
      "هيشان الشعر",
    ],
    shoppingSignals: [
      "ابدئي من هذه الفئة عندما تكون الحاجة مرتبطة بالفروة أو الأطراف أو ملمس الشعر بعد التصفيف.",
      "هذا السطح مناسب للنية التي تبدأ من المشكلة اليومية مثل الهيشان أو الجفاف بدل اسم المنتج وحده.",
      "الهدف هنا هو بناء منطق شراء واضح قبل توسيع الكتالوج وربط المنتجات الفعلية لاحقًا.",
    ],
    focusCards: [
      {
        title: "Scalp-first Logic",
        label: "Root health",
        body: "عندما يبدأ الإزعاج من الفروة، يجب أن تسبقها لغة واضحة حول التوازن والتنظيف والراحة قبل أي وعود مبالغ فيها.",
      },
      {
        title: "Humidity Control",
        label: "Saudi climate",
        body: "اختيار العناية بالشعر داخل الأجواء الحارة أو الرطبة يحتاج شرحًا للهيشان والملمس والثبات بعد التصفيف، لا مجرد أسماء منتجات.",
      },
      {
        title: "Treatment vs Daily Care",
        label: "Routine clarity",
        body: "الصفحة الجيدة تفرّق بين روتين يومي خفيف وماسكات أو معالجات أعمق حتى تبقى السلة منطقية وقابلة للاستخدام.",
      },
    ],
    discoveryLinks: [
      {
        title: "روتين تهدئة الهيشان بعد الغسيل",
        label: "Routine-led",
        href: "/routines/humidity-proof-hair-routine",
        description:
          "هذا هو المدخل الأفضل عندما تكون الحاجة أقرب إلى ترتيب الخطوات اليومية لا إلى اختيار منتج منفرد من البداية.",
        destinationType: "routine",
      },
      {
        title: "بانثينول",
        label: "Ingredient-led",
        href: "/ingredients/panthenol",
        description:
          "مسار مكوّن يشرح دور الراحة والنعومة داخل روتين الشعر قبل اكتمال الكتالوج المرتبط به.",
        destinationType: "ingredient",
      },
      {
        title: "ابدئي من البحث الداخلي",
        label: "Search-led",
        href: "/search?q=العناية%20بالشعر",
        description:
          "البحث الحالي يدعم هذا المسار تمهيدًا لربطه لاحقًا بمنتجات وفلاتر أكثر تفصيلًا.",
        destinationType: "search",
      },
      {
        title: "التعلّم من المجلة",
        label: "Editorial support",
        href: "/journal",
        description:
          "المجلة هي الذراع المناسب الآن لبناء الثقة قبل اكتمال طبقة الكتالوج الخاصة بالشعر.",
        destinationType: "journal_index",
      },
      {
        title: "مركز الثقة",
        label: "Trust layer",
        href: "/trust",
        description:
          "بما أن الفئة ما زالت في مرحلة التوسعة، تبقى الثقة والسياسات جزءًا واضحًا من قرار الشراء.",
        destinationType: "trust",
      },
    ],
    faqs: [
      {
        question: "لماذا أُطلقت هذه الفئة قبل اكتمال كتالوج الشعر نفسه؟",
        answer:
          "لأن roadmap تطلب IA تجارية أوسع من المنتجين الحاليين، ومن الأفضل بناء المسار القابل للفهرسة والربط الداخلي الآن بدل تأجيله حتى تتراكم الفجوة بين الهيكل والمحتوى.",
      },
      {
        question: "هل هذه الصفحة تدّعي وجود منتجات شعر كثيرة الآن؟",
        answer:
          "لا. هذه صفحة تأسيسية صادقة توضّح اتجاه الفئة وكيف سيُبنى الاكتشاف والربط الداخلي عندما يكتمل الكتالوج الفعلي.",
      },
    ],
  },
  {
    slug: "bodycare",
    mode: "editorial",
    title: "العناية بالجسم",
    subtitle: "Bodycare Collection",
    href: "/shop/bodycare",
    description:
      "سطح تجاري وتحضيري لفئة العناية بالجسم يركز على الروتين اليومي، الراحة بعد الاستحمام، ملمس اللوشن أو الزيوت، وفئات الهدايا العملية داخل السوق السعودي.",
    introduction:
      "الهدف من هذه الصفحة هو تحويل bodycare من فئة هامشية إلى مسار شراء واضح: متى تبدأين من الترطيب، متى يحتاج الروتين إلى تقشير أو عناية لليدين، وكيف تُقدَّم الفئة كهديّة أو عادة يومية.",
    entryDescription:
      "عناية يومية للجسم مبنية على الراحة والملمس والرائحة الهادئة والهدايا العملية.",
    searchTerms: [
      "bodycare",
      "العناية بالجسم",
      "لوشن",
      "زبدة جسم",
      "سكراب",
      "هدية عناية",
    ],
    shoppingSignals: [
      "ابدئي من هذه الفئة عندما يكون الهدف مرتبطًا براحة الاستخدام اليومي أو تقديم مجموعة هادئة كهدية.",
      "التمييز هنا بين الترطيب والتقشير والرائحة والتغليف أهم من أسماء المنتجات فقط.",
      "هذه الفئة تخدم أيضًا نوايا الشراء الموسمية مثل السفر والضيافة والمجموعات الجاهزة.",
    ],
    focusCards: [
      {
        title: "Daily Comfort",
        label: "After-shower routine",
        body: "العناية بالجسم هنا مبنية على الاستمرارية: قوام مريح، امتصاص واضح، وإحساس مرتب بعد الاستخدام.",
      },
      {
        title: "Giftable Bodycare",
        label: "Set logic",
        body: "الصفحة الجيدة تشرح كيف تتحول bodycare إلى هدية عملية بتغليف واضح وفكرة استخدام مناسبة.",
      },
      {
        title: "Texture-first Editing",
        label: "Decision support",
        body: "القرار يبدأ من ملمس المنتج على الجلد وسهولة دمجه داخل اليوم، لا من عناوين عامة ومتشابهة.",
      },
    ],
    discoveryLinks: [
      {
        title: "روتين راحة الجسم بعد الاستحمام",
        label: "Routine-led",
        href: "/routines/after-shower-body-routine",
        description:
          "ابدئي من هذا المسار عندما تكون النية مرتبطة بعادة يومية واضحة أو بتحويل bodycare إلى روتين مريح وسهل الالتزام.",
        destinationType: "routine",
      },
      {
        title: "زبدة الشيا",
        label: "Ingredient-led",
        href: "/ingredients/shea-butter",
        description:
          "صفحة ingredient-led تشرح متى يخدم القوام الأغنى القرار ومتى يتحول إلى خيار هدية أو راحة يومية.",
        destinationType: "ingredient",
      },
      {
        title: "بحث bodycare",
        label: "Search-led",
        href: "/search?q=bodycare",
        description:
          "البحث الحالي يفتح الباب لهذا المسار إلى أن تكتمل طبقة المنتجات والفلاتر الخاصة بالجسم.",
        destinationType: "search",
      },
      {
        title: "الهدايا والمجموعات",
        label: "Cross-sell",
        href: "/shop/beauty-sets",
        description:
          "هذا هو الامتداد المنطقي عندما تتحول نية العناية اليومية إلى شراء جاهز أو هدية مرتبة.",
        destinationType: "collection",
      },
      {
        title: "تواصل معنا",
        label: "Support",
        href: "/contact",
        description:
          "تبقى صفحة التواصل مساحة صادقة لأي استفسار مرتبط بالمخزون أو خيارات الشحن أو تفاصيل الهدايا.",
        destinationType: "contact",
      },
    ],
    faqs: [
      {
        question: "هل bodycare هنا موجهة للاستخدام اليومي أم للهدايا؟",
        answer:
          "الصفحة مصممة لتغطي المسارين معًا، لكن منطق الشراء يبدأ من المناسبة الفعلية: استخدام يومي، ضيافة، أو هدية جاهزة.",
      },
      {
        question: "لماذا يوجد ربط مباشر بينها وبين beauty sets؟",
        answer:
          "لأن bodycare من أكثر الفئات التي تتحول طبيعيًا إلى مجموعات جاهزة، ومن الأفضل بناء هذا الربط من الآن داخل IA بدل تركه متأخرًا كترقية شكلية.",
      },
    ],
  },
  {
    slug: "tools",
    mode: "editorial",
    title: "الأدوات والإكسسوارات",
    subtitle: "Tools Collection",
    href: "/shop/tools",
    description:
      "فئة تأسيسية للأدوات والإكسسوارات تشرح متى تضيف الأداة قيمة حقيقية داخل الروتين أو المكياج، وكيف نميّز بين أداة لازمة وأخرى ترفع السعر بلا أثر واضح على التجربة.",
    introduction:
      "هذه الفئة تمنع الأدوات من أن تصبح قسمًا هامشيًا بلا معنى. الهدف هو تقديمها كمكمل منطقي للروتين أو المكياج: فرش، إسفنجات، أدوات حفظ، أو إكسسوارات تساعد على التطبيق اليومي المرتب.",
    entryDescription:
      "أدوات وإكسسوارات تشرح قيمة كل قطعة داخل الروتين بدل عرضها كإضافات عشوائية.",
    searchTerms: [
      "tools",
      "الأدوات",
      "فرش مكياج",
      "اسفنجة",
      "إكسسوارات",
      "beauty tools",
    ],
    shoppingSignals: [
      "هذه الفئة مناسبة عندما تحتاج الزائرة إلى فهم دور الأداة قبل إضافتها إلى السلة.",
      "أفضل IA هنا تربط الأداة بالاستخدام الفعلي: تطبيق، حفظ، تنظيف، أو ترتيب الخطوات.",
      "الفئة تساعد على رفع قيمة السلة بشكل منطقي فقط عندما يكون الاستخدام واضحًا ومفسرًا.",
    ],
    focusCards: [
      {
        title: "Use-case First",
        label: "Utility clarity",
        body: "الأداة الجيدة يجب أن تُقدَّم من خلال ما تضيفه فعليًا في التطبيق أو الترتيب، لا بمجرد كونها accessory جذابة.",
      },
      {
        title: "Routine Companion",
        label: "Cross-sell",
        body: "أفضل طريقة لبيع الأدوات هي ربطها بروتين أو منتج أو نوع استخدام واضح بدل عرضها كمجموعة منفصلة بلا سياق.",
      },
      {
        title: "Care and Longevity",
        label: "Trust signal",
        body: "الفئة الاحترافية تشرح أيضًا كيف تُحفظ الأدوات وتُنظف ومتى تستحق الشراء أو الاستبدال.",
      },
    ],
    discoveryLinks: [
      {
        title: "ابحثي عن فرش مكياج",
        label: "Search-led",
        href: "/search?q=فرش%20مكياج",
        description:
          "هذا المسار الحالي يخدم نية الأدوات حتى قبل اكتمال طبقة المنتجات الخاصة بها.",
        destinationType: "search",
      },
      {
        title: "روتين قاعدة مخملية للمناسبات",
        label: "Routine bridge",
        href: "/routines/occasion-base-routine",
        description:
          "الأدوات تضيف قيمة فعلية عندما ترتبط بخطوات تطبيق واضحة، لذلك يبقى هذا الروتين أقرب جسر عملي داخل الفئة.",
        destinationType: "routine",
      },
      {
        title: "الرجوع إلى المكياج",
        label: "Collection bridge",
        href: "/shop/makeup",
        description:
          "الأدوات هنا امتداد منطقي لفئة المكياج، لذا يبقى الجسر بينها وبين صفحة المكياج أساسيًا في التحويل.",
        destinationType: "collection",
      },
      {
        title: "مركز الثقة",
        label: "Trust layer",
        href: "/trust/authenticity",
        description:
          "صفحات الثقة تدعم قرار شراء الإكسسوارات أيضًا عندما يكون السؤال حول الجودة أو المصدر أو الشحن.",
        destinationType: "trust_policy",
      },
    ],
    faqs: [
      {
        question: "هل الأدوات هنا جزء من الـ MVP فعلًا أم مجرد placeholder؟",
        answer:
          "هي جزء من IA الـ MVP كما تنص الخطة، لكن السطح الحالي يقدمها بشكل تأسيسي صادق إلى أن يكتمل كتالوج الأدوات والمنتجات المرتبطة بها.",
      },
      {
        question: "لماذا لا تُعرض الأدوات فقط كاقتراحات داخل صفحات المنتج؟",
        answer:
          "لأن roadmap تتطلب فئة مستقلة قابلة للفهرسة والبحث والربط الداخلي، لا مجرد cross-sell مخفي داخل PDPs.",
      },
    ],
  },
  {
    slug: "beauty-sets",
    mode: "editorial",
    title: "الهدايا والمجموعات",
    subtitle: "Beauty Sets",
    href: "/shop/beauty-sets",
    description:
      "صفحة هدايا ومجموعات Beauty Sets تبني منطق شراء واضح للمناسبات، البدايات الذكية، والمجموعات الجاهزة بدل تركها كملحق موسمي بلا بنية دائمة.",
    introduction:
      "هذه الصفحة تُعرّف كيف تتحول المجموعة إلى مسار شراء محترم: لمن هي، متى تُشترى، وما الفرق بين set موجهة للتجربة الأولى أو gifting أو routine starter pack.",
    entryDescription:
      "مجموعات جاهزة للهدايا أو البداية الذكية، مبنية على مناسبة واضحة وتغليف مفهوم.",
    searchTerms: [
      "beauty sets",
      "هدايا",
      "مجموعات",
      "gift set",
      "starter kit",
      "bridal gift",
    ],
    shoppingSignals: [
      "هذه الفئة تخدم نية شراء سريعة عندما تكون المناسبة واضحة لكن تفاصيل المنتجات الفردية أقل أهمية.",
      "المجموعات ترفع التحويل عندما يُشرح السيناريو: هدية، بداية روتين، أو مناسبة خاصة.",
      "الهدف ليس تجميع المنتجات معًا فقط، بل تقديم منطق واضح للتنسيق والتغليف والسعر.",
    ],
    focusCards: [
      {
        title: "Gift Logic",
        label: "Occasion-ready",
        body: "المجموعة الناجحة تبدأ من مناسبة واضحة: زيارة، هدية أنيقة، أو تحضير لمناسبة خاصة، لا مجرد جمع منتجات متقاربة.",
      },
      {
        title: "Starter Routine",
        label: "New-to-category",
        body: "بعض الزائرات تحتجن نقطة بداية أبسط من اختيار كل منتج على حدة، وهنا تصبح المجموعة مسار قرار ذكي.",
      },
      {
        title: "Packaging Matters",
        label: "Premium detail",
        body: "في هذا النوع من الصفحات، التغليف، وضوح المكونات، وسياسة الاسترجاع عناصر أساسية داخل القرار وليست تفاصيل هامشية.",
      },
    ],
    discoveryLinks: [
      {
        title: "روتين راحة الجسم بعد الاستحمام",
        label: "Starter flow",
        href: "/routines/after-shower-body-routine",
        description:
          "هذا المسار يشرح كيف تتحول مجموعة bodycare أو starter set إلى قرار استخدام واضح لا مجرد تجميع منتجات متقاربة.",
        destinationType: "routine",
      },
      {
        title: "ابحثي عن مجموعة هدية",
        label: "Search-led",
        href: "/search?q=gift%20set",
        description:
          "البحث الداخلي يلتقط نية gifting حتى قبل اكتمال طبقة المجموعات والمنتجات الموسعة.",
        destinationType: "search",
      },
      {
        title: "العناية بالجسم",
        label: "Collection bridge",
        href: "/shop/bodycare",
        description:
          "العناية بالجسم من أكثر الفئات القابلة للتحول إلى sets جاهزة، لذا يبقى الربط بينهما مقصودًا داخل IA.",
        destinationType: "collection",
      },
      {
        title: "سياسة الشحن والتوصيل",
        label: "Trust layer",
        href: "/trust/shipping",
        description:
          "قرار الهدية يعتمد بشدة على وضوح الشحن والتوصيل والتغليف، لذلك يبقى هذا المسار أساسيًا.",
        destinationType: "trust_policy",
      },
    ],
    faqs: [
      {
        question: "هل يمكن اعتبار beauty sets مجرد surface موسمية فقط؟",
        answer:
          "لا. في هذا المشروع تُعامل كمكوّن ثابت داخل IA لأن نية الهدايا والبدايات الذكية جزء من نموذج التجارة نفسه، لا مجرد حملة موسمية عابرة.",
      },
      {
        question: "لماذا تُربط المجموعات بالشحن والثقة بشكل مباشر؟",
        answer:
          "لأن قرار شراء الهدية لا يعتمد على المنتج فقط، بل على وضوح التوصيل والتغليف وسياسات الاسترجاع، وهذا ما يجعل الربط مع طبقة trust أساسيًا.",
      },
    ],
  },
];

export const journalArticles: JournalArticle[] = [
  {
    collection: "skincare",
    slug: "serum-or-moisturizer-how-to-choose-right-morning-layer",
    pillar: "اختيار المنتج والشراء",
    category: "دليل الشراء",
    title: "سيروم أم مرطب أم الاثنان: كيف تختارين الطبقة الصباحية بذكاء؟",
    deck:
      "هذا النوع من الحيرة لا يُحل باسم المكوّن وحده. القرار الصحيح يبدأ من هدف الصباح: إشراقة؟ راحة؟ قاعدة خفيفة تحت الواقي والمكياج؟",
    excerpt:
      "إذا صار الروتين الصباحي يبدو كثيفًا أو بلا منطق، فالمشكلة ليست في عدد المنتجات فقط، بل في ترتيبها ووظيفة كل طبقة داخل اليوم.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الصباح يحتاج خطوة واحدة خفيفة وواضحة، فابدئي بالسيروم. وإذا كانت البشرة تحتاج راحة إضافية أو ثباتًا أفضل بعده، فأضيفي مرطبًا متوازنًا. الجمع بينهما يكون فقط عندما يخدم الراحة والالتزام، لا عندما يثقل الروتين.",
    takeaways: [
      "ابدئي بهدف الصباح لا باسم المنتج.",
      "السيروم يناسب خطوة دعم خفيفة وواضحة داخل الروتين.",
      "المرطب يُضاف عندما تحتاج البشرة راحة وتثبيتًا أفضل لا لمجرد كثرة الخطوات.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/skincare",
      label: "قارني بين خيارات العناية الصباحية داخل قسم العناية بالبشرة",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ابدئي بوظيفة الطبقة الأولى لا باسمها",
        body: "إذا كان هدف الصباح هو راحة خفيفة قبل الواقي أو المكياج، فالسؤال الأول ليس سيروم أم مرطب، بل ماذا يجب أن تفعل هذه الطبقة فعلًا؟ هل تضيف دعمًا سريعًا؟ هل تمنح البشرة راحة تمنع الشد والجفاف؟ عندما يتضح الهدف يصبح اختيار الطبقة أسهل بكثير.",
      },
      {
        heading: "متى يكفي السيروم وحده؟",
        body: "يكفي السيروم عندما يكون خفيفًا، واضح الدور، ولا يترك البشرة محتاجة إلى تعويض مباشر بعده. هذه الحالة تناسب الروتينات السريعة والطقس الذي يجعل أي طبقة إضافية عبئًا. المهم هنا أن تكون الصفحة التجارية صريحة في وصف الملمس وكيفية دمجه داخل الصباح.",
      },
      {
        heading: "ومتى يصبح المرطب جزءًا ضروريًا من القرار؟",
        body: "يصبح المرطب مهمًا عندما يحتاج الروتين إلى راحة أكثر، أو عندما تشعر البشرة أن الطبقة الأولى وحدها لا تكفي لتثبيت الإحساس المريح حتى نهاية النصف الأول من اليوم. في هذه الحالة لا يكون المرطب خطوة تجميلية فقط، بل وسيلة لتقليل الارتباك ومنع الإفراط في إضافة منتجات أخرى لاحقًا.",
      },
    ],
    faq: [
      {
        question: "هل الجمع بين السيروم والمرطب دائمًا أفضل من استخدام خطوة واحدة؟",
        answer:
          "لا. الأفضل هو ما يجعل الروتين أوضح وأسهل التزامًا. إذا كان السيروم وحده يحقق الراحة والدعم الكافي، فإضافة مرطب قد تكون زيادة غير مفيدة.",
      },
      {
        question: "كيف أعرف أن الطبقة الصباحية أصبحت كثيرة أكثر من اللازم؟",
        answer:
          "إذا صار الروتين بطيئًا، أو ترك ثقلًا تحت الواقي أو المكياج، أو أصبح صعب الالتزام يوميًا، فهذا مؤشر أن الخطوات لم تعد تخدم النتيجة المطلوبة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "best-light-sunscreen-oily-skin-saudi-weather",
    pillar: "أدلة السياق اليومي",
    category: "أدلة العناية",
    title: "أفضل واقي شمس خفيف للبشرة الدهنية في الأجواء الحارة",
    deck:
      "في الأجواء الحارة لا يكفي أن يكون الواقي جيدًا على الورق. المهم أن يندمج بسهولة، يبقى مريحًا، ولا يفسد ما قبله أو ما بعده داخل الروتين.",
    excerpt:
      "الاختيار الذكي يبدأ من القوام والثبات والراحة على البشرة، لا من الادعاءات الكبيرة. هذا الدليل يوضح ما الذي تبحثين عنه قبل الشراء.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    answer:
      "أفضل واقي شمس خفيف للبشرة الدهنية هو الذي يوفّر حماية يومية مع ملمس غير مزعج، ثبات عملي، واندماج سهل تحت المكياج أو وحده خلال اليوم.",
    takeaways: [
      "القوام المريح أهم من الخطاب التسويقي العام.",
      "الخفة لا يجب أن تأتي على حساب راحة البشرة.",
      "المقال الجيد ينتهي بخطوة شراء أو روتين أوضح لا بمعلومة عامة فقط.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/vitamin-c",
    nextStep: {
      href: "/routines/morning-routine-oily-skin",
      label: "راجعي الروتين الصباحي لترتيب الحماية مع الخطوات التي قبلها",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "ما الذي يجعل الواقي مناسبًا للبشرة الدهنية؟",
        body: "الأولوية هنا لسهولة الدمج، سرعة الاستقرار على البشرة، وعدم ترك طبقة مزعجة مع تكرار الاستخدام. القوام المريح أهم من الخطاب التسويقي العام.",
      },
      {
        heading: "كيف نفرّق بين القوام الخفيف والقوام الذي يجفف البشرة؟",
        body: "الخفة لا تعني دائمًا الجفاف. ابحثي عن وصف واضح للملمس النهائي، وما إذا كان المنتج يندمج بسهولة أو يترك أثرًا طبقيًا مزعجًا خلال النهار.",
      },
      {
        heading: "كيف نحول المقال إلى خطوة شراء ذكية؟",
        body: "بعد فهم القوام المناسب، انقلي القرار إلى صفحة الفئة أو المنتج حيث تظهر الفلاتر، والـ finish، والملاءمة للروتين النهاري بوضوح.",
      },
    ],
    faq: [
      {
        question: "هل يجب أن يكون واقي الشمس مطفيًا دائمًا للبشرة الدهنية؟",
        answer:
          "ليس بالضرورة. الأهم هو الراحة والثبات وعدم الإحساس المزعج على البشرة، حتى لو كان اللمعان النهائي ناعمًا لا طبقيًا.",
      },
      {
        question: "هل يمكن استخدام هذا النوع تحت المكياج؟",
        answer:
          "نعم إذا كان القوام يستقر بسهولة ويُذكر بوضوح أنه يندمج جيدًا داخل الروتين الصباحي.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "build-balanced-morning-routine-combination-skin",
    pillar: "الروتينات العملية",
    category: "روتينات",
    title: "كيف تبنين روتينًا صباحيًا متوازنًا للبشرة المختلطة؟",
    deck:
      "الروتين المتوازن لا يحتاج عشر خطوات. يحتاج منطقًا واضحًا: ما الذي يُستخدم أولًا، ولماذا، ومتى تصبح الخطوة التالية ضرورية فعلًا؟",
    excerpt:
      "الروتين الصباحي الذكي لا يكدّس المنتجات. هو ترتيب واضح يوازن بين الراحة، الحماية، والمظهر المرتب خلال اليوم.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    answer:
      "الروتين الصباحي للبشرة المختلطة يبدأ بتنظيف لطيف، ثم طبقة علاج أو دعم خفيفة عند الحاجة، ثم ترطيب متوازن، وأخيرًا حماية يومية مريحة.",
    takeaways: [
      "التوازن يبدأ من قلة الخطوات لا من كثرتها.",
      "الترتيب من الأخف إلى الأغنى يحل جزءًا كبيرًا من الارتباك.",
      "أفضل الروتينات هي التي يسهل تكرارها لا التي تبدو مثالية نظريًا فقط.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/routines/morning-routine-oily-skin",
      label: "انتقلي إلى صفحة الروتين لترتيب الخطوات والربط بالمنتجات",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "ابدئي بالأساس لا بالتكديس",
        body: "إذا كانت البشرة المختلطة تتغير خلال اليوم، فالمطلوب ليس عددًا أكبر من الخطوات، بل اختيارًا أوضح لمنتجات متوازنة وملمس لا يرهق الروتين.",
      },
      {
        heading: "كيف ترتبين المنتجات من دون إرباك؟",
        body: "اعملي من الأخف إلى الأغنى، مع الانتباه لوقت النهار والقدرة الفعلية على الالتزام بالروتين. هذا يجعل التحويل داخل المتجر أقرب إلى بناء routine مدروس لا سلة عشوائية.",
      },
      {
        heading: "متى تصبح الصفحة التجارية جزءًا من المقال؟",
        body: "عندما تربط المقالة بين الحاجة اليومية والمنتجات المناسبة داخل صفحة الفئة، تتحول المجلة إلى ذراع ثقة وبيع بدل محتوى منفصل عن الشراء.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج دائمًا إلى سيروم في الصباح؟",
        answer:
          "ليس دائمًا. يعتمد القرار على هدف الروتين وتحمل البشرة، ويمكن أن يكون الروتين أبسط ما دام يحقق الراحة والحماية.",
      },
      {
        question: "كيف أعرف أن الروتين متوازن فعلًا؟",
        answer:
          "إذا كان واضح الخطوات، سهل الالتزام، ولا يترك إحساسًا بالثقل أو الارتباك أثناء اليوم، فهو أقرب إلى التوازن المطلوب.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "niacinamide-explained-plain-language",
    pillar: "المكوّنات بلا تعقيد",
    category: "مكوّنات",
    title: "النياسيناميد بلغة بسيطة: ماذا يفعل ومتى يصبح منطقيًا؟",
    deck:
      "المشكلة مع هذا المكوّن أنه يُقدَّم كثيرًا كحل شامل. هنا نعيده إلى مكانه الصحيح: مكوّن يساعد على بناء روتين أوضح، لا وعدًا سحريًا لكل شيء.",
    excerpt:
      "إذا كنتِ تبحثين عن روتين أكثر هدوءًا وأقل حيرة، فالنياسيناميد يصبح مفيدًا عندما نفهم دوره اليومي بدل التعامل معه كصيحة.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "النياسيناميد يصبح منطقيًا عندما يكون الهدف تقليل الارتباك في الروتين اليومي وبناء خطوة يمكن تكرارها بسهولة، لا عندما يُعامل كاختصار سحري لكل مشاكل البشرة.",
    takeaways: [
      "هو مكوّن لتنظيم القرار اليومي أكثر من كونه حلًا سحريًا.",
      "يظهر أثره داخل روتين بسيط ومستمر لا داخل تكديس عشوائي.",
      "أفضل طريقة لفهمه هي ربطه بالمشكلة والمنتج وخطوة الاستخدام.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/ingredients/niacinamide",
      label: "راجعي صفحة النياسيناميد لمعرفة مكانه داخل الروتين اليومي",
      destinationType: "ingredient",
    },
    sections: [
      {
        heading: "لماذا يلتبس هذا المكوّن على كثير من الزائرات؟",
        body: "لأن اسمه يتكرر كثيرًا في صفحات المنتجات والمحتوى، فيبدو وكأنه يجب أن يكون موجودًا في كل روتين. لكن الاستخدام الذكي لا يبدأ من شهرة المكوّن، بل من الحاجة الفعلية: هل تريدين خطوة تساعد على تنظيم الروتين وتهدئة الحيرة، أم تبحثين عن نتيجة صباحية محددة مرتبطة بإشراقة أو حماية؟",
      },
      {
        heading: "متى يصبح وجوده منطقيًا داخل الروتين؟",
        body: "يصبح منطقيًا عندما يكون الروتين بحاجة إلى خطوة واضحة يسهل فهمها وتكرارها. هذه اللغة أهم من الوعود الكبيرة، لأنها تمنح المقال والمنتج والروتين نفس الاتجاه بدل أن يعمل كل واحد منها بمعزل عن الآخر.",
      },
      {
        heading: "كيف يتحول شرح المكوّن إلى قرار شراء أفضل؟",
        body: "عندما لا يبقى شرح النياسيناميد نظريًا. المطلوب أن يقود إلى صفحة مكوّن أكثر وضوحًا، ثم إلى روتين أو منتج يعطي مثالًا عمليًا على مكانه داخل الاستخدام اليومي. بهذه الطريقة لا تبقى المقالة معلومة معزولة بل تصبح أداة اكتشاف وتجهيز للشراء.",
      },
    ],
    faq: [
      {
        question: "هل النياسيناميد خطوة مناسبة لكل روتين صباحي؟",
        answer:
          "ليس دائمًا. مناسبته تعتمد على هدف الروتين وقدرته على البقاء بسيطًا وواضحًا. إذا صار مجرد اسم إضافي داخل خطوات كثيرة، فهو لا يخدم القرار فعليًا.",
      },
      {
        question: "ما الفرق بين قراءة مقال عن المكوّن وزيارة صفحة المكوّن نفسها؟",
        answer:
          "المقال يشرح متى يكون منطقيًا ولماذا، بينما صفحة المكوّن تربطه بصفحات المشكلة والروتين والمنتجات داخل المتجر بطريقة أكثر مباشرة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "niacinamide-vs-vitamin-c-which-fits-your-routine",
    pillar: "المكوّنات بلا تعقيد",
    category: "مكوّنات",
    title: "الفرق بين النياسيناميد وفيتامين C: متى تختارين كل مكوّن؟",
    deck:
      "السؤال الأفضل ليس أيهما أشهر، بل أيهما أوضح لهدف الصباح ولمشكلة البشرة ولنوع القرار الذي تريدين الوصول إليه داخل الروتين.",
    excerpt:
      "السؤال ليس أيهما أفضل بشكل مطلق، بل أيهما أنسب لهدف الروتين والملمس الذي تبحثين عنه ووقت الاستخدام داخل اليوم.",
    readingTime: "7 دقائق",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    answer:
      "اختيار النياسيناميد أو فيتامين C يعتمد على الهدف التجاري والتحريري للروتين: هل التركيز على توازن المظهر ووضوح الاستخدام اليومي، أم على إشراقة صباحية محددة المسار؟",
    takeaways: [
      "القرار الحقيقي يبدأ من الهدف لا من المقارنة المجردة.",
      "النياسيناميد يميل إلى الروتينات الهادئة والواضحة.",
      "فيتامين C يخدم مسار الإشراقة الصباحية عندما يكون الشرح واضحًا ومحددًا.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/vitamin-c",
    nextStep: {
      href: "/ingredients/vitamin-c",
      label: "قارني هذا المقال مع صفحة فيتامين C قبل الانتقال إلى المنتج",
      destinationType: "ingredient",
    },
    sections: [
      {
        heading: "متى يكون النياسيناميد خيارًا أوضح؟",
        body: "عندما يكون المطلوب هو روتين يومي بسيط ومتدرج وسهل الدمج مع خطوات أخرى، يصبح النياسيناميد أقرب إلى الاستخدام العملي والواضح.",
      },
      {
        heading: "ومتى يصبح فيتامين C أكثر منطقية؟",
        body: "عندما تريدين مسار إشراقة صباحي واضحًا ومحتوى يشرح الفكرة بسرعة ثم يوجّه إلى منتجات وروتينات مرتبطة بالسياق.",
      },
      {
        heading: "كيف ينعكس هذا على بنية المتجر؟",
        body: "المكوّنات لا يجب أن تعيش كصفحات معزولة؛ الأفضل ربطها بالمشكلة والروتين والمنتجات حتى يتحول المحتوى إلى شبكة اكتشاف وبيع معًا.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج صفحة لكل مكوّن داخل المتجر؟",
        answer:
          "نعم عندما يكون للمكوّن نية بحث حقيقية ويمكن دعمه بمحتوى مفيد وروابط داخلية تقود إلى منتجات وصفحات مشكلة وروتينات.",
      },
      {
        question: "هل المقالات المقارنة مهمة للتحويل؟",
        answer:
          "نعم لأنها تقلل الحيرة، وتساعد العميلة على اتخاذ قرار أسرع، وتمنح الصفحات التحريرية دورًا واضحًا في البيع.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "how-to-choose-foundation-finish-for-events",
    pillar: "اختيار المنتج والشراء",
    category: "أدلة المكياج",
    title: "كيف تختارين فاونديشن مناسبًا للمناسبات من دون طبقات مزعجة؟",
    deck:
      "في المكياج لا يأتي القرار من اسم الدرجة وحده. البداية الصحيحة تكون من النتيجة المطلوبة، وكمية التغطية، وراحة القاعدة بعد ساعات طويلة.",
    excerpt:
      "القرار الصحيح يبدأ من النتيجة المطلوبة وملمس القاعدة على البشرة، لا من اسم المنتج وحده. هذا الدليل يشرح كيف تختارين finish وتغطية يناسبان المناسبة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    answer:
      "فاونديشن المناسبات الأفضل هو الذي يوازن بين التغطية والثبات وراحة الملمس، مع قدرة على البناء التدريجي بدل مظهر ثقيل من البداية.",
    takeaways: [
      "حددي النتيجة أولًا ثم الدرجة.",
      "البناء التدريجي غالبًا أجمل من طبقة ثقيلة واحدة.",
      "المقال الجيد يجب أن ينتهي بروتين أو منتج واضح لا بعبارات عامة عن الثبات فقط.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/makeup",
      label: "راجعي خيارات المكياج وفق النتيجة والملمس داخل قسم المكياج",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ابدئي بالنتيجة المطلوبة لا باسم الدرجة فقط",
        body: "قبل اختيار الدرجة، حددي أولًا هل تريدين نتيجة مخملية، ناعمة، أو أكثر إشراقًا. هذا يختصر جزءًا كبيرًا من الحيرة ويقودك إلى finish أنسب.",
      },
      {
        heading: "كيف توازنين بين التغطية والراحة؟",
        body: "التغطية العالية لا تعني دائمًا نتيجة أفضل. في كثير من الحالات، البناء التدريجي يحقق مظهرًا أكثر أناقة وثباتًا من طبقة كثيفة واحدة.",
      },
      {
        heading: "متى يتحول المقال إلى خطوة شراء ذكية؟",
        body: "عندما يربط المقال بين النتيجة المطلوبة وروتين القاعدة والمنتج المناسب، يصبح جزءًا من رحلة القرار لا مجرد محتوى منفصل عن الشراء.",
      },
    ],
    faq: [
      {
        question: "هل الفاونديشن المخملي مناسب للنهار أيضًا؟",
        answer:
          "نعم إذا كان القوام مرنًا ويمكن التحكم في التغطية. المهم أن يكون الوصف واضحًا في الصفحة وأن تكون الخطوات المحيطة به متوازنة.",
      },
      {
        question: "كيف أقلل خطر اختيار منتج غير مناسب؟",
        answer:
          "ابدئي من النتيجة النهائية، ثم راجعي مستوى التغطية والـ undertone، وبعدها استخدمي صفحة الروتين أو صفحة المشكلة لتصفية القرار قبل الشراء.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "pigmentation-routine-feels-random-what-to-fix-first",
    issue: "Issue 02",
    pillar: "المشكلة والقرار الأول",
    category: "المشكلة أولًا",
    title: "ماذا تفعلين عندما تجعل التصبغات كل روتين يبدو عشوائيًا؟",
    deck:
      "حين تصبح التصبغات عنوانًا واسعًا فوق كل قرار، لا ينفعك شراء خطوة عشوائية جديدة. الأهم هو إعادة ترتيب السؤال: ما الذي يجب أن يثبت أولًا داخل الروتين حتى يصبح الباقي مفهومًا؟",
    excerpt:
      "الارتباك لا يأتي دائمًا من قلة الخيارات، بل من غياب ترتيب واضح بينها. هذا المقال يعيد قرار التصبغات إلى concern مفهومة ثم يربطها بروتين ومكوّن وخطوة شراء أقرب.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا جعلت التصبغات كل روتين يبدو عشوائيًا، فابدئي بتثبيت مسار صباحي بسيط: خطوة دعم واضحة، حماية يومية ثابتة، ومكوّن واحد مفهوم الدور. بعد ذلك فقط يصبح توسيع السلة أو الروتين منطقيًا.",
    takeaways: [
      "المشكلة تبدأ من ارتباك الترتيب لا من غياب منتج إضافي.",
      "كلما كان الروتين أوضح، أصبح تقييم المكوّنات والمنتجات أسهل.",
      "صفحة المشكلة يجب أن تقود إلى خطوة قابلة للتكرار لا إلى حيرة جديدة.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/concerns/pigmentation",
      label: "الانتقال إلى صفحة التصبغات لترتيب القرار داخل الـ concern",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "ابدئي من الشيء الذي يتكرر كل صباح",
        body: "عندما تكون النية هي تخفيف ارتباك التصبغات، فالمطلوب أولًا ليس كثافة أعلى بل خطوة ثابتة يسهل تكرارها. الروتين الذي يتغيّر كل يوم يربك النتيجة أكثر مما يخدمها، بينما الخطوة الثابتة تجعل أثر باقي القرارات قابلاً للملاحظة.",
      },
      {
        heading: "متى تصبح صفحة المشكلة أقوى من صفحة المنتج؟",
        body: "حين لا تكون الحيرة حول اسم المنتج نفسه بل حول مكانه داخل الروتين، تصبح concern route أكثر فائدة. هي التي تعيد صياغة السؤال وتربطه بالمكوّن والروتين، ثم تترك المنتج يأتي بعد ذلك كاختيار أوضح لا كحل سحري.",
      },
      {
        heading: "كيف تمنعين التصبغات من ابتلاع الروتين كله؟",
        body: "اجعلي القرار محدودًا: حماية يومية، مكوّن مفهوم، وروتين يمكن الالتزام به. هذا يمنع التصبغات من تحويل كل surface في المتجر إلى محاولة متوترة للحاق بنتيجة لا تملك نظامًا واضحًا.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج أكثر من مكوّن فعّال منذ البداية؟",
        answer:
          "ليس غالبًا. البداية الأقوى هي التي تثبت خطوة واحدة مفهومة داخل روتين ثابت، ثم توسّعها فقط إذا صارت النتيجة أوضح وليس لأن السوق يعرض خيارات أكثر.",
      },
      {
        question: "متى أزور صفحة المنتج بدل صفحة المشكلة؟",
        answer:
          "بعد أن تفهمي ما الذي يجب أن يحدث داخل الروتين أصلًا. عندها تصبح PDP أو collection امتدادًا للقرار لا مكانًا لصناعته من الصفر.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "practical-morning-routine-glow-sunscreen-fast-layering",
    issue: "Issue 02",
    pillar: "الروتينات العملية",
    category: "روتينات",
    title: "روتين صباحي عملي للإشراقة والواقي والطبقات الخفيفة",
    deck:
      "الروتين الصباحي الجيد لا يثبت كثرة الخطوات، بل يثبت كيف تمرين من الإشراقة إلى الواقي ثم إلى المظهر المرتب من غير أن يصبح الصباح مزدحمًا.",
    excerpt:
      "إذا كنت تريدين إشراقة مقنعة وواقيًا لا يفسد ما قبله، فالمشكلة ليست في اختيار منتج واحد فقط. المشكلة في ترتيب الطبقات وسرعة اندماجها داخل اليوم.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "الروتين الصباحي العملي يبدأ بطبقة دعم خفيفة تخدم الإشراقة، ثم حماية يومية واضحة، ثم أي خطوة إضافية يجب أن تبرر نفسها براحة أو ثبات أو مظهر أنظف، لا بكثرة الخطوات.",
    takeaways: [
      "الإشراقة المفهومة تسبق أي رغبة في تكديس المنتجات.",
      "الواقي جزء من الروتين لا طبقة منفصلة عنه.",
      "الطبقات الخفيفة تكسب عندما يسهل تكرارها كل صباح.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/vitamin-c",
    nextStep: {
      href: "/routines/morning-routine-oily-skin",
      label: "راجعي صفحة الروتين الصباحي لترتيب الخطوات عمليًا",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "ابدئي بخطوة إشراقة لا تستهلك بقية الروتين",
        body: "حين تكون الخطوة الأولى خفيفة وواضحة الوظيفة، يصبح دمج الواقي أو أي finish لاحقة أسهل بكثير. الإشراقة هنا ليست بريقًا شكليًا، بل دعمًا بصريًا لا يرهق الصباح.",
      },
      {
        heading: "كيف يظل الواقي جزءًا مريحًا من الخطة؟",
        body: "عندما تأتي الخطوات قبله بملمس متوازن وسرعة امتصاص معقولة، لا يضطر الواقي إلى إصلاح ما قبله. لذلك يصبح الانتقال من skincare إلى daily makeup أو الخروج المباشر من دون ازدحام.",
      },
      {
        heading: "متى تعرفين أن الروتين صار أثقل من اللازم؟",
        body: "إذا أصبحت كل طبقة تحتاج انتظارًا طويلًا، أو صار دمج الواقي أو المكياج بعدها أصعب، فهذه علامة أن إحدى الخطوات لم تعد تخدم النتيجة نفسها. الروتين العملي يجب أن يبدو كمسار واحد لا كخطوات متنافسة.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج سيروم ومرطب وواقي كل صباح دائمًا؟",
        answer:
          "ليس دائمًا. المهم أن يخدم كل عنصر هدفًا واضحًا داخل الصباح. أحيانًا تكفي طبقة دعم خفيفة مع واقٍ مريح، وأحيانًا تحتاج البشرة راحة إضافية عبر مرطب متوازن.",
      },
      {
        question: "ما أفضل route بعد هذا المقال؟",
        answer:
          "إذا أردت ترتيب الخطوات عمليًا، فصفحة الروتين هي الأقرب. وإذا أردت مقارنة الخيارات داخل الفئة نفسها، فانتقلي بعدها إلى collection skincare.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "heat-dryness-long-days-how-to-keep-makeup-comfortable",
    issue: "Issue 02",
    pillar: "أدلة السياق اليومي",
    category: "السياق السعودي",
    title: "الحر والجفاف وطول اليوم: كيف تحافظين على راحة المكياج دون طبقات مرهقة؟",
    deck:
      "في الأيام الطويلة لا يكفي أن يبدو المكياج ثابتًا في أول ساعة. المطلوب أن يظل مريحًا، مرتبًا، وقابلاً للحياة مع الحرارة والجفاف والتنقل بين الخارج والداخل.",
    excerpt:
      "هذا الدليل يربط راحة القاعدة بالمناخ اليومي الحقيقي، لا بالوعود العامة عن الثبات. الهدف هو تقليل الطبقات المرهقة وبناء نتيجة تظل قابلة للاحتمال حتى نهاية اليوم.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "راحة المكياج في الأيام الحارة والطويلة تأتي من تهيئة متوازنة، قاعدة واضحة النتيجة، وتثبيت لا يضيف ثقلًا بلا داع. كل خطوة يجب أن تقلل الانزعاج لا أن تؤجل ظهوره فقط.",
    takeaways: [
      "الثبات الجيد لا يساوي ملمسًا خانقًا.",
      "المناخ جزء من قرار الـ finish وليس خلفية صامتة.",
      "أفضل قاعدة هي التي تظل محتملة بعد ساعات، لا التي تبدو مثالية أول نصف ساعة فقط.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/makeup",
      label: "راجعي مسارات المكياج بحسب النتيجة والملمس داخل القسم",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "اجعلي الراحة جزءًا من قرار الثبات",
        body: "عندما يأتي قرار المكياج من فكرة الثبات وحدها، تميل الخطوات إلى الإفراط. لكن عندما تصبح الراحة جزءًا من نفس القرار، يبدأ الاختيار من ملمس القاعدة وتحمّلها داخل يوم طويل بدل الاكتفاء بوعد البقاء.",
      },
      {
        heading: "كيف يؤثر المناخ على طبقات القاعدة؟",
        body: "التنقل بين حرارة الخارج وجفاف الأماكن المكيفة قد يجعل الطبقات الثقيلة أكثر إزعاجًا من فائدتها. لذلك يصبح التدرج في التغطية مع تهيئة أخف خيارًا أكثر نضجًا من البدء بطبقة مكتملة وثقيلة.",
      },
      {
        heading: "متى تنتقلين من المقال إلى الروتين أو الفئة؟",
        body: "إذا أصبحت النتيجة التي تريدينها أوضح، فانتقلي إلى collection makeup لمقارنة المسارات. وإذا كان الارتباك ما يزال في ترتيب الخطوات، فصفحة routine base للمناسبات ستكون أقرب لإغلاق القرار.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج دائمًا primer إضافي في الأيام الحارة؟",
        answer:
          "ليس دائمًا. إذا كانت التهيئة الأساسية والقاعدة واضحتي الدور ومريحتي الملمس، فقد يصبح الـ primer إضافة لا تحل مشكلة حقيقية بل تزيد الطبقات.",
      },
      {
        question: "كيف أعرف أن التغطية أصبحت أكثر من اللازم؟",
        answer:
          "حين يبدأ الملمس في الظهور قبل النتيجة. إذا صار الوجه يبدو أثقل أو أقل راحة مع الساعات الطويلة، فهذه إشارة أن البناء التدريجي أنسب من طبقة كاملة من البداية.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "travel-ready-beauty-set-what-to-pack-without-overpacking",
    issue: "Issue 02",
    pillar: "أدلة السياق اليومي",
    category: "مجموعات وهدايا",
    title: "ما الذي تضعينه في beauty set مناسبة للسفر من غير إفراط؟",
    deck:
      "الـ travel set الجيدة لا تُبنى على كثرة القطع، بل على وضوح ما الذي يجب أن يبقى قريبًا منك فعلًا: أساس مريح، أداة تخدم أكثر من استخدام، وخطوات لا تنهار عند التنقل.",
    excerpt:
      "حين تتحول الحقيبة الصغيرة إلى نسخة مصغرة من كل ما في المنزل، تفقد المجموعة معناها. هذا المقال يشرح كيف تبنين beauty set خفيفة وعملية وتظل أنيقة في الاستخدام.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "مجموعة السفر الجيدة هي التي تختصر القرار: ما الذي يخدم صباحًا سريعًا أو لمسة إنعاش لاحقة أو مناسبة مفاجئة، من غير أن تتحول الأدوات والمنتجات إلى عبء تنظيم جديد داخل الحقيبة.",
    takeaways: [
      "ابدئي من الاستخدام المتكرر لا من الرغبة في اصطحاب كل شيء.",
      "الأداة الجيدة في السفر هي التي تؤدي أكثر من وظيفة بوضوح.",
      "المجموعة الذكية يجب أن تبقى خفيفة ذهنيًا قبل أن تكون خفيفة وزنًا.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/tools",
      label: "راجعي سطوح الأدوات لمعرفة ما الذي يضيف قيمة حقيقية داخل المجموعة",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى تصبح المجموعة ذكية بدل أن تصبح زائدة؟",
        body: "حين يكون لكل قطعة سبب واضح داخل السيناريو نفسه: صباح سريع، رحلة قصيرة، أو مناسبة تحتاج ترتيبًا سهلًا. ما عدا ذلك يتحول إلى ازدحام يستهلك الحقيبة ولا يحسن التجربة.",
      },
      {
        heading: "كيف تختارين الأدوات قبل المنتجات أحيانًا؟",
        body: "في بعض حالات السفر تكون الأداة أو الاكسسوار هي ما يمنع الفوضى: فرشاة جيدة، pouch منظّمة، أو قطعة تسهّل إعادة الترتيب. لذلك route الأدوات هنا ليست ملحقًا بل جزء من قرار المجموعة نفسها.",
      },
      {
        heading: "أين يبدأ الشراء بعد هذا المقال؟",
        body: "إذا كان السؤال حول تنظيم المجموعة نفسها فابدئي من beauty-sets. وإذا كان السؤال حول ما يستحق أن يصاحبك فعلًا داخل الحقيبة فصفحة tools ستساعدك على التمييز بين الضروري والزائد.",
      },
    ],
    faq: [
      {
        question: "هل المجموعة الجيدة تعني عددًا أقل دائمًا؟",
        answer:
          "ليست المسألة عددًا أقل فقط، بل عددًا أوضح. قد تكون المجموعة من أربع أو خمس قطع، لكن المهم أن تكون كل قطعة مفهومة الدور ومستخدمة فعليًا داخل الرحلة.",
      },
      {
        question: "ما أفضل خطوة تالية: beauty-sets أم tools؟",
        answer:
          "إذا كنت تحاولين تكوين المجموعة نفسها فابدئي من beauty-sets. وإذا كان ما ينقصك هو الأداة التي تجعل الاستخدام أسهل وأرتب، فاذهبي إلى tools أولًا.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "calm-hair-after-washing-humid-days-without-heavy-layers",
    issue: "Issue 02",
    pillar: "الروتينات العملية",
    category: "العناية بالشعر",
    title: "كيف تهدئين الشعر بعد الغسيل في الأيام الرطبة من غير طبقات ثقيلة؟",
    deck:
      "العناية بالشعر بعد الغسيل لا يجب أن تتحول إلى معركة مع الهيشان أو إلى طبقات متعبة. المطلوب هو روتين مريح يهدئ الفروة والأطراف ويظل قابلاً للتكرار.",
    excerpt:
      "هذا المقال يربط haircare بالسياق اليومي الحقيقي: هيشان، حرارة، وتجفيف سريع. الهدف ليس التكثير، بل اختيار ما يهدئ الشعر من غير أن يثقل ملمسه.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "تهدئة الشعر بعد الغسيل في الأجواء الرطبة تبدأ بروتين واضح: تنظيف مريح، دعم للفروة أو الأطراف عند الحاجة، ثم خطوة حماية تقلل الهيشان بدلاً من تراكم طبقات ثقيلة غير مستقرة.",
    takeaways: [
      "الخطوة الجيدة بعد الغسيل يجب أن تقلل الهيشان لا أن تغطيه فقط.",
      "كل إضافة ثقيلة من غير ضرورة قد تجعل الرطوبة أوضح لا أقل.",
      "haircare route المفهومة تبدأ من روتين يمكن الحفاظ عليه لا من نتائج فورية مبالغ فيها.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/haircare",
      label: "راجعي مسار haircare لفهم أين يبدأ القرار داخل الفئة",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "اجعلي ما بعد الغسيل نقطة قرار لا نقطة فوضى",
        body: "كثير من ارتباك العناية بالشعر يبدأ مباشرة بعد الغسيل: هل نحتاج دعمًا للفروة، أم تهدئة للأطراف، أم حماية من الهيشان؟ عندما يكون السؤال واضحًا، لا يعود الحل هو إضافة كل شيء دفعة واحدة.",
      },
      {
        heading: "كيف تمنعين الطبقات من أن تصبح عبئًا؟",
        body: "ابدئي بالأخف والأوضح وظيفة. إذا كانت خطوة واحدة تمنح الأطراف نعومة أو تقلل تطاير الخصلات، فلا حاجة لبناء طبقات أخرى لمجرد الإحساس بأن الروتين يجب أن يبدو أكبر.",
      },
      {
        heading: "متى تنتقلين من المقال إلى المكوّن أو الروتين؟",
        body: "إذا أردت فهم مكان المكوّن نفسه فصفحة panthenol أقرب. وإذا كانت المشكلة في ترتيب الخطوات بعد الغسيل، فـ humidity-proof routine تعطيك bridge أوضح داخل الفئة.",
      },
    ],
    faq: [
      {
        question: "هل الرطوبة تعني دائمًا أنني أحتاج منتجات أثقل؟",
        answer:
          "ليس بالضرورة. أحيانًا تزيد الطبقات الثقيلة الإحساس بالفوضى بدل تهدئته. الأفضل هو طبقة أو خطوتان واضحتان تخدمان ما بعد الغسيل مباشرة.",
      },
      {
        question: "هل article haircare مفيدة حتى لو لم تكن هناك PDP متخصصة كثيرة؟",
        answer:
          "نعم، لأن دور المقال هنا هو ترتيب القرار وربطه بـ collection والـ routine والمكوّن الصادق المتاح الآن، لا الادعاء بأن product inventory النهائية اكتملت.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "after-shower-body-routine-that-is-easy-to-keep",
    issue: "Issue 02",
    pillar: "الروتينات العملية",
    category: "العناية بالجسم",
    title: "ما الذي يجعل روتين ما بعد الاستحمام سهل الالتزام فعلًا؟",
    deck:
      "روتين الجسم الجيد لا يقاس بكثرة المنتجات، بل بقدرته على البقاء داخل اليوم العادي. إذا لم يكن واضحًا بعد الاستحمام مباشرة، فلن يصبح أسهل لاحقًا.",
    excerpt:
      "هذا المقال يشرح كيف يتحول after-shower bodycare من نية لطيفة إلى عادة حقيقية: اختيار ملمس مريح، فهم المناطق التي تحتاج عناية، وربط الراحة بالاستمرار.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "أسهل روتين للجسم بعد الاستحمام هو الذي يختصر القرار في لحظة واحدة: ما الذي تحتاجه البشرة الآن فعلًا؟ راحة، ترطيب، لمسة أغنى لليدين أو المناطق الجافة، أو مجموعة بسيطة تشجع على الاستمرار.",
    takeaways: [
      "الالتزام يبدأ من لحظة ما بعد الاستحمام نفسها.",
      "الملمس أهم من كثرة الخيارات داخل bodycare.",
      "الهدية أو المجموعة الجيدة يمكن أن تبدأ من routine سهلة لا من عناصر مشتتة.",
    ],
    relatedRoutine: "/routines/after-shower-body-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/bodycare",
      label: "راجعي مسار bodycare لفهم الرعاية اليومية والمجموعات العملية",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "اربطي الروتين بلحظة ثابتة لا بقرار مؤجل",
        body: "كلما تأخر قرار bodycare إلى وقت لاحق، ضعف الالتزام به. لذلك تكون لحظة ما بعد الاستحمام هي المكان الأفضل لبناء عادة بسيطة: تجفيف، خطوة راحة، ثم قرار إن كانت هناك منطقة تحتاج عناية إضافية.",
      },
      {
        heading: "كيف يحدد الملمس استمرارك في الروتين؟",
        body: "إذا كان اللوشن أو الزبدة أو الزيت يترك إحساسًا مرهقًا، فسيتحول الروتين إلى عبء سريعًا. لهذا يجب أن تكون اللغة التجارية صريحة حول الملمس وطريقة الاستخدام، لا مجرد وعود بالترطيب.",
      },
      {
        heading: "متى تنتقلين من المقال إلى المجموعة أو المكوّن؟",
        body: "إذا كان السؤال الآن عن ingredient comfort فصفحة shea butter ستكون أوضح. وإذا كان القرار يتعلق ببناء route bodycare أو مجموعة بسيطة قابلة للتكرار، فcollection bodycare هي الخطوة التالية المنطقية.",
      },
    ],
    faq: [
      {
        question: "هل bodycare اليومية تحتاج خطوات كثيرة؟",
        answer:
          "غالبًا لا. الروتين الأفضل هو الذي يبقى سهلًا وواضحًا بعد الاستحمام، مع إضافة خطوة أغنى فقط حين تكون هناك حاجة حقيقية لذلك.",
      },
      {
        question: "هل bodycare يمكن أن ترتبط بالهدايا أو الـ sets؟",
        answer:
          "نعم، لكن حين تكون المجموعة مبنية على usage واضح ومريح. هذا ما يجعلها هدية عملية أو عادة يومية مقنعة بدل أن تكون تجميعًا شكليًا فقط.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "calm-sensitive-skin-routine-without-too-many-steps",
    issue: "Issue 03",
    pillar: "المشكلة والقرار الأول",
    category: "المشكلة أولًا",
    title: "كيف تبنين روتينًا هادئًا للبشرة الحساسة بدون خطوات كثيرة؟",
    deck:
      "حين تتعب البشرة من التبديل المستمر بين منتجات كثيرة، الحل ليس إضافة طبقة جديدة كل مرة. الحل هو تقليل القرارات وتثبيت مسار واضح يمكن الالتزام به يوميًا.",
    excerpt:
      "هذا المقال يرتب قرار البشرة الحساسة من البداية: ما الذي يهدئ فعلًا؟ ما الذي يمكن تأجيله؟ وكيف تحافظين على روتين مفهوم بدل الدخول في دوامة تجارب يومية.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "روتين البشرة الحساسة الأفضل يبدأ بخطوات قليلة وثابتة: تنظيف لطيف، دعم مريح لا يرهق البشرة، وحماية يومية واضحة. كل خطوة إضافية يجب أن يكون لها سبب مباشر، لا مجرد رغبة في التجربة.",
    takeaways: [
      "تقليل عدد الخطوات غالبًا يزيد استقرار النتيجة.",
      "الثبات اليومي أهم من تبديل المنتجات بسرعة.",
      "أي إضافة جديدة يجب أن تأتي بعد استقرار الروتين الأساسي.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/concerns",
      label: "ابدئي من صفحة المشاكل لاختيار المسار الأقرب لحالة بشرتك",
      destinationType: "concern_index",
    },
    sections: [
      {
        heading: "ابدئي بروتين إنقاذ لا بروتين كامل",
        body: "حين تكون البشرة في حالة تهيج أو حساسية، كثرة الخطوات تربك أكثر مما تفيد. ابدئي بما يحافظ على الراحة ويقلل الاحتكاك اليومي، ثم اتركي أي توسع لمرحلة لاحقة بعد الاستقرار.",
      },
      {
        heading: "كيف تعرفين أن الخطوة الجديدة مبكرة؟",
        body: "إذا كانت البشرة ما زالت غير مستقرة أو الروتين نفسه يتغير كل يوم، فإضافة مكوّن جديد غالبًا ستزيد الارتباك. القاعدة البسيطة: ثبتي ما يعمل أولًا، ثم أضيفي خطوة واحدة فقط عند الحاجة.",
      },
      {
        heading: "متى تنتقلين من القراءة إلى الشراء؟",
        body: "بعد أن يصبح ترتيب الخطوات واضحًا في ذهنك. عندها تتحول صفحة المشكلة أو الروتين إلى جسر قرار عملي، وتصبح صفحة المنتج امتدادًا لهذا القرار لا بداية جديدة من الصفر.",
      },
    ],
    faq: [
      {
        question: "هل الروتين القصير يعني نتيجة أضعف؟",
        answer:
          "ليس بالضرورة. في كثير من حالات البشرة الحساسة، الروتين الأقصر والأوضح يعطي نتيجة أكثر ثباتًا لأنه أسهل في الالتزام وأقل في احتمالات الإرباك.",
      },
      {
        question: "ما أول إشارة أن الروتين الحالي مناسب؟",
        answer:
          "أن تشعري أن البشرة أكثر هدوءًا وأن الخطوات اليومية أصبحت قابلة للتكرار بدون تردد أو تعب، بدل البحث عن تعديل جديد كل يوم.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "vitamin-c-morning-routine-who-benefits-and-when-to-slow-down",
    issue: "Issue 03",
    pillar: "المكونات بلا تعقيد",
    category: "المكونات",
    title: "فيتامين C صباحًا: من يستفيد منه فعليًا ومتى تحتاجين التدرج؟",
    deck:
      "فيتامين C ليس خطوة إلزامية للجميع بنفس الشكل. الفكرة ليست وضعه يوميًا بأي طريقة، بل معرفة متى يخدم الروتين الصباحي ومتى يحتاج إدخالًا أهدأ.",
    excerpt:
      "هذا المقال يحول قرار فيتامين C من سؤال عام إلى قرار عملي: هل يناسب هدفك الحالي؟ هل يدخل مباشرة أم تدريجيًا؟ وما موقعه داخل الروتين الصباحي.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان هدفك في الصباح إشراقة أوضح ومسارًا أكثر انتظامًا، فيتامين C يمكن أن يكون خطوة مفيدة. لكن الأفضل يبدأ بترتيب صحيح داخل الروتين وبإيقاع يناسب تحمل البشرة بدل فرض استخدام يومي سريع.",
    takeaways: [
      "القرار الصحيح يبدأ من هدفك الصباحي لا من ترند المكوّن.",
      "التدرج أفضل من الضغط على البشرة في البداية.",
      "نجاح فيتامين C مرتبط بوضوح مكانه داخل الروتين.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/vitamin-c",
    nextStep: {
      href: "/ingredients/vitamin-c",
      label: "راجعي صفحة فيتامين C لفهم الاستخدام والملاءمة بشكل أوضح",
      destinationType: "ingredient",
    },
    sections: [
      {
        heading: "متى يكون فيتامين C قرارًا مناسبًا؟",
        body: "حين يكون هدف الصباح واضحًا: دعم الإشراقة وتوحيد مظهر البشرة تدريجيًا ضمن روتين ثابت. إذا لم يكن هناك روتين صباحي منتظم أصلًا، فالأولوية هي بناء هذا الروتين أولًا.",
      },
      {
        heading: "متى تحتاجين التدرج بدل الاستخدام اليومي المباشر؟",
        body: "عند البشرة الحساسة أو حين يكون الروتين مزدحمًا أصلًا. إدخال خطوة واحدة بإيقاع أهدأ يساعدك على تقييم الراحة والاستمرار، بدل التوقف الكامل بسبب بداية متسرعة.",
      },
      {
        heading: "كيف تربطين فيتامين C بالمسار التجاري الصحيح؟",
        body: "ابدئي من صفحة المكوّن لفهم السياق، ثم انتقلي إلى الروتين أو المنتج المناسب. بهذه الطريقة يصبح قرار الشراء جزءًا من نظام واضح، لا تجربة منفصلة عن باقي الخطوات.",
      },
    ],
    faq: [
      {
        question: "هل فيتامين C ضروري لكل روتين صباحي؟",
        answer:
          "لا. هو خيار مفيد لفئات كثيرة، لكنه ليس إلزاميًا دائمًا. الأهم هو أن يخدم هدف الروتين فعليًا وأن يكون إدخاله متوازنًا.",
      },
      {
        question: "ما الخطأ الشائع في استخدامه صباحًا؟",
        answer:
          "اعتباره خطوة مستقلة عن باقي الروتين. نجاحه يرتبط بالترتيب الصحيح، والراحة اليومية، ووجود حماية صباحية ثابتة.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "when-beauty-set-is-smarter-than-buying-one-by-one",
    issue: "Issue 03",
    pillar: "اختيار المنتج والشراء",
    category: "مجموعات وهدايا",
    title: "متى تكون مجموعة الجمال أذكى من شراء كل منتج على حدة؟",
    deck:
      "ليست كل مجموعة خيارًا أفضل تلقائيًا. القيمة الحقيقية تظهر عندما تقلل المجموعة وقت القرار، وتجمع خطوات متناسقة، وتمنع تكرار شراء قطع لا تستخدم فعليًا.",
    excerpt:
      "هذا المقال يشرح كيف تقيّمين beauty set بعقلية عملية: هل تختصر القرار؟ هل تخدم سيناريو استخدام واضح؟ أم أنها مجرد تجميع ظاهري؟",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "مجموعة الجمال تكون خيارًا أذكى عندما تبني مسار استخدام واضح وتقلل التشتت بين المنتجات. إذا كانت القطع متكاملة فعلًا وتخدم هدفًا واحدًا، فهي أقوى من شراء عناصر متفرقة بلا ترتيب.",
    takeaways: [
      "قيمة المجموعة في وضوح الاستخدام لا في عدد العناصر.",
      "المجموعة الجيدة تقلل وقت القرار وتزيد الالتزام بالروتين.",
      "الشراء الفردي أفضل فقط عندما تحتاجين تخصيصًا دقيقًا خارج سيناريو المجموعة.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "راجعي مسارات beauty-sets لمقارنة المجموعات حسب الاستخدام",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما الفرق بين المجموعة الذكية والمجموعة المزخرفة؟",
        body: "المجموعة الذكية تبدأ من سيناريو واضح: سفر، هدية، روتين صباحي سريع، أو مناسبة. أما المجموعة المزخرفة فتجمع عناصر كثيرة بدون علاقة عملية بينها، فتزيد الحيرة بدل أن تقللها.",
      },
      {
        heading: "كيف تقيسين القيمة قبل الدفع؟",
        body: "اسألي: هل سأستخدم هذه القطع معًا فعلًا؟ هل الترتيب بينها مفهوم؟ هل توفر عليّ قرارًا إضافيًا؟ إذا كانت الإجابات واضحة، فالمجموعة غالبًا تقدم قيمة حقيقية.",
      },
      {
        heading: "متى يكون الشراء الفردي أفضل؟",
        body: "عندما يكون احتياجك محددًا جدًا أو لديك بالفعل جزء كبير من الروتين. هنا يصبح الشراء الفردي أدق، بينما المجموعة الأفضل تبقى للحالات التي تحتاج بداية مرتبة وسريعة.",
      },
    ],
    faq: [
      {
        question: "هل المجموعة دائمًا أوفر ماليًا؟",
        answer:
          "ليس دائمًا. الأهم من السعر وحده هو أن عناصر المجموعة تُستخدم فعليًا ضمن نفس السيناريو، وإلا تتحول الوفرة إلى هدر غير مباشر.",
      },
      {
        question: "هل يمكن اعتماد مجموعة واحدة كروتين دائم؟",
        answer:
          "أحيانًا نعم، إذا كانت مبنية على استخدام يومي واضح. وفي حالات أخرى تكون المجموعة بداية جيدة ثم تحتاجين تخصيصًا لاحقًا.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "gift-guide-beauty-products-that-still-feel-thoughtful",
    issue: "Issue 03",
    pillar: "أدلة السياق اليومي",
    category: "مجموعات وهدايا",
    title: "دليل هدايا بيوتي: كيف تختارين هدية تبدو مدروسة فعلًا؟",
    deck:
      "هدية الجمال الجيدة لا تعتمد على السعر أو عدد القطع فقط، بل على وضوح المناسبة وسهولة الاستخدام. عندما تكون المجموعة مفهومة، تصل الهدية كرسالة ذوق لا كخيار عشوائي.",
    excerpt:
      "هذا الدليل يساعدك على اختيار هدية بيوتي بقرار واثق: كيف تحددين المناسبة، وكيف توازنين بين الأناقة والعملية، ومتى تكون المجموعة أفضل من المنتج الفردي.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "اختيار هدية بيوتي مدروسة يبدأ من المناسبة ثم من سهولة الاستخدام. إذا كانت المجموعة واضحة الدور وتخدم استخدامًا يوميًا أو مناسبة محددة، فهي أقرب لأن تكون هدية موفقة.",
    takeaways: [
      "ابدئي من المناسبة قبل اختيار الشكل الخارجي.",
      "الهدية العملية الأنيقة أقوى من هدية كثيرة العناصر بلا استخدام واضح.",
      "مسار beauty-sets ينجح عندما يجمع الوضوح والتقديم الجيد معًا.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "اختاري مجموعة هدايا مناسبة حسب المناسبة والاستخدام",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "حددي نية الهدية قبل اختيار المنتج",
        body: "هل هي هدية مناسبة، شكر، أو بداية روتين جديد؟ وضوح النية يختصر القرار سريعًا ويمنع الوقوع في اختيار عام لا يعبر عن المناسبة.",
      },
      {
        heading: "التغليف مهم لكن ليس كافيًا",
        body: "المظهر الأنيق يصنع الانطباع الأول، لكن الاستخدام هو ما يثبت قيمة الهدية. المجموعة الأفضل هي التي تبدو جميلة وتظل مفهومة بعد فتحها.",
      },
      {
        heading: "كيف تربطين الهدية بمسار شراء واضح؟",
        body: "اختاري من surface مخصص للهدايا بدل جمع قطع متفرقة. هذا يضمن اتساق التجربة ويقلل وقت المقارنة ويجعل قرار الشراء أكثر ثقة.",
      },
    ],
    faq: [
      {
        question: "هل الأفضل شراء مجموعة جاهزة أم تجميع يدوي؟",
        answer:
          "إذا كانت المجموعة الجاهزة مبنية على استخدام واضح ومناسبة محددة فهي غالبًا أفضل وأسرع. التجميع اليدوي يناسب الحالات الخاصة جدًا.",
      },
      {
        question: "ما أهم عامل يجعل هدية البيوتي تبدو مدروسة؟",
        answer:
          "أن يشعر المستلم بسهولة البدء والاستخدام من أول يوم، لا أن يحتاج وقتًا طويلًا لفهم كيف يستخدم العناصر معًا.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "simple-evening-reset-when-skin-feels-dry-and-tired",
    issue: "Issue 04",
    pillar: "الروتينات العملية",
    category: "روتينات",
    title: "روتين مسائي بسيط عندما تبدو البشرة جافة ومتعبة",
    deck:
      "الروتين المسائي لا يحتاج عدد خطوات كبير حتى يكون فعالًا. الأهم أن يعيد للبشرة الإحساس بالراحة بعد يوم طويل بدون تحميلها طبقات مربكة.",
    excerpt:
      "هذا المقال يختصر قرار المساء في مسار واضح: تنظيف مريح، دعم ترطيب متوازن، وخطوة يمكن تكرارها يوميًا بدون إرهاق أو تعقيد.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "حين تشعر البشرة بالجفاف والتعب مساءً، أفضل روتين هو الأبسط: تنظيف لطيف، ترطيب واضح الدور، وتثبيت خطوة مسائية يمكن الالتزام بها. النتيجة تأتي من الاستمرار لا من كثرة المنتجات.",
    takeaways: [
      "خطوة مسائية ثابتة أفضل من خطة كبيرة يصعب تكرارها.",
      "الراحة في الملمس جزء أساسي من نجاح الروتين.",
      "التبسيط في المساء يساعد على وضوح قرار الصباح.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/routines",
      label: "راجعي مسارات الروتين لاختيار ترتيب يومي قابل للاستمرار",
      destinationType: "routine_index",
    },
    sections: [
      {
        heading: "ابدئي بما يعيد الراحة قبل أي هدف تجميلي",
        body: "في المساء، أولوية البشرة المتعبة هي الراحة واستعادة التوازن. حين يكون هذا الهدف واضحًا، يصبح اختيار الخطوات أسهل وتقل القرارات المتعارضة داخل الروتين.",
      },
      {
        heading: "لماذا يفشل الروتين المسائي رغم جودة المنتجات؟",
        body: "غالبًا بسبب التعقيد لا بسبب المنتج نفسه. عندما تزيد الخطوات ويتغير الترتيب يوميًا، يصعب قراءة النتيجة. الروتين الأبسط يعطي إشارات أوضح ويحسن الالتزام.",
      },
      {
        heading: "متى تنتقلين من هذا المقال إلى صفحة المنتج؟",
        body: "بعد تثبيت ترتيب الخطوات الأساسية. عندها تصبح صفحة المنتج خطوة تنفيذ وليست محاولة جديدة لإعادة بناء الروتين من البداية.",
      },
    ],
    faq: [
      {
        question: "هل الروتين المسائي يحتاج دائمًا خطوات أكثر من الصباح؟",
        answer:
          "ليس دائمًا. في كثير من الحالات يكفي مسار قصير وواضح إذا كان يلبي حاجة البشرة الفعلية ويستمر يوميًا.",
      },
      {
        question: "ما علامة أن الروتين المسائي مناسب؟",
        answer:
          "أن يصبح تطبيقه سهلًا كل ليلة وأن تشعري بتحسن الراحة دون الحاجة لتعديل جذري كل يوم.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "how-to-choose-makeup-longwear-without-heavy-layering",
    issue: "Issue 04",
    pillar: "المشكلة والقرار الأول",
    category: "المشكلة أولًا",
    title: "كيف تختارين ثبات المكياج بدون طبقات ثقيلة؟",
    deck:
      "الثبات لا يعني دائمًا إضافة منتجات أكثر. القرار الأذكى يبدأ بفهم ما الذي يسبب الانهيار خلال اليوم ثم اختيار خطوات أقل لكنها أوضح.",
    excerpt:
      "هذا الدليل يحول سؤال الثبات من تجربة عشوائية إلى قرار عملي: ترتيب القاعدة، تقليل التراكم، وربط النتيجة بملمس يمكن احتماله لساعات طويلة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان هدفك ثباتًا طويلًا بمظهر مريح، فابدئي بتقليل الطبقات وتثبيت دور كل خطوة. اختيار قاعدة مناسبة وملمس متوازن يعطي ثباتًا أكثر من التكديس العشوائي.",
    takeaways: [
      "الطبقات الكثيرة ليست بديلًا عن ترتيب صحيح.",
      "ثبات المكياج يبدأ من القاعدة لا من خطوة أخيرة فقط.",
      "راحة الملمس طوال اليوم أهم من نتيجة أول ساعة.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/concerns/makeup-longwear",
      label: "انتقلي إلى صفحة ثبات المكياج لاختيار المسار الأنسب",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "ابدئي بسبب المشكلة قبل اختيار المنتج",
        body: "قبل مقارنة المنتجات، حددي أين يفقد المكياج توازنه: في الملمس، في التغطية، أو في تحمل ساعات اليوم الطويلة. هذا يختصر نصف القرار.",
      },
      {
        heading: "كيف تحققين الثبات بدون إحساس ثقيل؟",
        body: "اختاري خطوات أقل لكن متوافقة، وابتعدي عن تكرار نفس الوظيفة في أكثر من طبقة. هذا يمنح مظهرًا أنظف وثباتًا أكثر واقعية.",
      },
      {
        heading: "متى يكون الانتقال إلى PDP هو القرار الصحيح؟",
        body: "بعد أن تتضح النتيجة المطلوبة ودرجة التغطية المناسبة. حينها تصبح صفحة المنتج أداة اختيار دقيقة بدل تجربة مفتوحة.",
      },
    ],
    faq: [
      {
        question: "هل الثبات العالي يعني دائمًا تغطية عالية؟",
        answer:
          "لا. يمكن تحقيق ثبات جيد بتغطية متوسطة إذا كان ترتيب الخطوات واضحًا ومناسبًا لنوع الاستخدام اليومي.",
      },
      {
        question: "ما أول تعديل عند الشعور بثقل القاعدة؟",
        answer:
          "قللي عدد الطبقات التي تؤدي نفس الدور وابدئي ببناء التغطية تدريجيًا بدل وضعها كاملة من البداية.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "hyaluronic-acid-hot-dry-days-what-users-misunderstand-first",
    issue: "Issue 04",
    pillar: "المكونات بلا تعقيد",
    category: "المكونات",
    title: "هيالورونيك أسيد في الأجواء الحارة والجافة: ما أول سوء فهم شائع؟",
    deck:
      "كثير من الالتباس حول الهيالورونيك أسيد يأتي من طريقة إدخاله داخل الروتين وليس من المكوّن نفسه. فهم السياق المحلي يجعل النتيجة أكثر استقرارًا.",
    excerpt:
      "هذا المقال يوضح أكثر نقطة يخطئ فيها المستخدمون مع الهيالورونيك أسيد، وكيف تتحول الخطوة من تجربة متذبذبة إلى جزء واضح من الروتين.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "أكثر سوء فهم شائع هو التعامل مع الهيالورونيك أسيد كحل مستقل. فعاليته تظهر عندما يوضع داخل ترتيب متوازن يدعم راحة البشرة بدل الاعتماد على خطوة منفصلة بلا سياق.",
    takeaways: [
      "المكوّن ينجح ضمن نظام واضح لا كخطوة معزولة.",
      "ترتيب الاستخدام أهم من تكرار الاستخدام.",
      "فهم السياق المناخي المحلي يقلل الارتباك في التقييم.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/ingredients/hyaluronic-acid",
      label: "راجعي صفحة الهيالورونيك أسيد لربط المعلومة بالاستخدام",
      destinationType: "ingredient",
    },
    sections: [
      {
        heading: "أين يبدأ الالتباس عادة؟",
        body: "عندما يُستخدم المكوّن كإضافة عامة بلا هدف واضح. هذا يجعل النتيجة غير مستقرة ويصعب الحكم هل المشكلة في المنتج أم في ترتيب الروتين.",
      },
      {
        heading: "كيف تجعلين الخطوة أوضح داخل اليوم؟",
        body: "حددي وظيفة المكوّن داخل الروتين: دعم راحة البشرة وتحسين الإحساس العام. ثم ثبتي نفس الترتيب لفترة كافية قبل أي تعديل جديد.",
      },
      {
        heading: "متى تنتقلين من المقال إلى الشراء؟",
        body: "حين يصبح دور المكوّن واضحًا في ذهنك وتعرفين أين سيدخل داخل الخطوات اليومية. هنا يكون اختيار المنتج أدق وأقل عشوائية.",
      },
    ],
    faq: [
      {
        question: "هل الهيالورونيك أسيد مناسب لكل الروتينات بنفس الطريقة؟",
        answer:
          "ليس بنفس الطريقة. اختلاف نوع البشرة وترتيب الخطوات والسياق اليومي يغيّر طريقة الاستفادة من المكوّن.",
      },
      {
        question: "ما أفضل طريقة لتقييمه بواقعية؟",
        answer:
          "بتثبيت ترتيب استخدام واضح وعدم تغيير أكثر من عنصر في نفس الوقت، حتى تكون النتيجة قابلة للقياس.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "first-time-beauty-sets-where-to-start-without-overbuying",
    issue: "Issue 04",
    pillar: "اختيار المنتج والشراء",
    category: "مجموعات وهدايا",
    title: "أول مرة تشترين beauty set؟ ابدئي من هنا بدون شراء زائد",
    deck:
      "المشتري لأول مرة يحتاج مسارًا يختصر القرار، لا قائمة طويلة من الخيارات. المجموعة الذكية هي التي تبدأ استخدامك بسرعة وتمنع شراء عناصر خارج الحاجة.",
    excerpt:
      "هذا المقال يحدد نقطة البداية للمشتري الجديد: كيف تختارين المجموعة الأولى، وكيف تتجنبين الزيادة غير المفيدة، ومتى تنتقلين للشراء الفردي.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "عند أول شراء، اختاري مجموعة تخدم سيناريو استخدام واحدًا واضحًا. هذا يقلل التشتت ويمنحك بداية منظمة، ثم يمكنك التخصيص لاحقًا بناءً على تجربة حقيقية.",
    takeaways: [
      "ابدئي بسيناريو استخدام واحد بدل أكثر من هدف في نفس السلة.",
      "المجموعة الأولى يجب أن تختصر القرار لا أن توسّعه.",
      "الشراء الفردي يأتي بعد فهم ما ينقصك فعليًا.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "اختاري أول مجموعة من مسار beauty-sets حسب الاستخدام",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ابدئي بهدف واحد فقط",
        body: "أول مجموعة لا يجب أن تحل كل شيء. اختاري هدفًا واحدًا واضحًا مثل روتين يومي مختصر أو مجموعة مناسبة خفيفة، لتكون التجربة الأولى سهلة ومفهومة.",
      },
      {
        heading: "كيف تمنعين الشراء الزائد من البداية؟",
        body: "اسألي هل كل عنصر في المجموعة سيدخل استخدامك الفعلي هذا الأسبوع. أي عنصر بلا دور واضح يعني أن المجموعة أكبر من حاجتك الحالية.",
      },
      {
        heading: "متى تنتقلين من المجموعة إلى الشراء الفردي؟",
        body: "بعد أول دورة استخدام كاملة. عندها يصبح القرار مبنيًا على تجربة فعلية لا على توقعات، ويكون التخصيص أدق وأقل هدرًا.",
      },
    ],
    faq: [
      {
        question: "هل الأفضل للمبتدئ مجموعة صغيرة أم متوسطة؟",
        answer:
          "الأفضل ما كان أوضح في الاستخدام. غالبًا تبدأ المجموعة الأصغر أو المتوسطة بنتيجة أفضل لأنها أسهل في الالتزام والمتابعة.",
      },
      {
        question: "كيف أعرف أنني جاهزة للتخصيص الفردي؟",
        answer:
          "عندما تتضح لديك العناصر التي تستخدمينها دائمًا والعناصر التي لا تضيف قيمة فعلية، يصبح الانتقال للشراء الفردي خطوة منطقية.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "pigmentation-routine-after-30-days-what-to-keep-what-to-change",
    issue: "Issue 05",
    pillar: "المشكلة والقرار الأول",
    category: "متابعة القرار",
    title: "بعد أول 30 يوم للتصبغات: ماذا تستمرين عليه وماذا تعدلين؟",
    deck:
      "النتيجة الهادئة لا تأتي من تغيير كل شيء كل أسبوع. هذا الدليل يوضح كيف تراجعين روتين التصبغات بعد أول دورة استخدام، وتعدلين فقط ما يستحق التعديل.",
    excerpt:
      "المتابعة بعد 30 يوم تمنع العشوائية: ما الذي يبقى ثابتًا، ما الذي يحتاج تقوية، وما الذي يجب إيقافه حتى لا يتحول الروتين إلى ضغط يومي.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "بعد أول 30 يوم، ثبتي الأساس الذي التزمتِ به فعلًا ثم عدّلي عنصرًا واحدًا فقط في كل مرة. بهذه الطريقة يصبح تقييم التحسن ممكنًا، ويتحول قرار التصبغات من قفزات متوترة إلى مسار واضح.",
    takeaways: [
      "ثبتي الخطوات التي التزمتِ بها قبل إضافة أي عنصر جديد.",
      "عدلي عنصرًا واحدًا في كل دورة تقييم لتفهمي أثره الحقيقي.",
      "المتابعة الزمنية أهم من كثرة المنتجات في أول مرحلة.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/concerns/pigmentation",
      label: "راجعي مسار التصبغات وطبقي خطة التعديل التدريجي",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "ما الذي يجب أن يبقى ثابتًا أولًا؟",
        body: "أي خطوة كنتِ ملتزمة بها يوميًا وكانت مريحة لبشرتك يجب أن تبقى. الاستقرار في البداية أهم من إدخال تغييرات كثيرة لا يمكن قياس أثرها.",
      },
      {
        heading: "كيف تعرفين أن الوقت مناسب للتعديل؟",
        body: "عندما تلاحظين نمطًا متكررًا طوال أسابيع وليس انطباع يومين. التعديل الذكي يأتي من اتجاه واضح، لا من رد فعل سريع على يوم سيئ واحد.",
      },
      {
        heading: "كيف تمنعين العودة للعشوائية؟",
        body: "اكتبي سبب كل تغيير قبل تطبيقه: هل الهدف تهدئة، إشراقة، أم تحمل أفضل؟ إذا لم يكن السبب واضحًا، فالأفضل تأجيل التعديل.",
      },
    ],
    faq: [
      {
        question: "هل يمكن تعديل أكثر من عنصر بعد أول 30 يوم؟",
        answer:
          "يفضل ألا يحدث ذلك في نفس الوقت. تعديل واحد يجعل النتيجة قابلة للفهم، بينما التعديلات المتعددة تربك التقييم.",
      },
      {
        question: "متى أعرف أن الروتين الحالي لم يعد مناسبًا؟",
        answer:
          "عندما يظهر انزعاج متكرر أو غياب تقدم واضح رغم الالتزام المنتظم. هنا يصبح التعديل التدريجي خطوة منطقية.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "makeup-longwear-workdays-vs-occasions-where-choice-changes",
    issue: "Issue 05",
    pillar: "أدلة السياق اليومي",
    category: "أدلة المكياج",
    title: "ثبات المكياج للعمل اليومي أم للمناسبات؟ هنا يتغير الاختيار",
    deck:
      "الخطأ الشائع هو استخدام نفس منطق التغطية والثبات لكل يوم. هذا الدليل يوضح متى يكون الخيار الأخف أنسب للعمل، ومتى تحتاجين بناءً مختلفًا للمناسبة.",
    excerpt:
      "اختيار longwear يتغير حسب السياق: ساعات الدوام، الإضاءة، ومدة المناسبة. نفس المنتج قد ينجح في حالة ويفشل في أخرى إذا تغيّر ترتيب التطبيق.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "للعمل اليومي، الأولوية للراحة والتحمل المتوازن. للمناسبات، الأولوية للثبات تحت الإضاءة والتصوير مع بناء محسوب. اختلاف الهدف هو ما يحدد اختيار القاعدة والخطوات المساندة.",
    takeaways: [
      "دوام يومي: اختاري مظهرًا أخف يمكن تجديده بسهولة.",
      "مناسبة طويلة: طبقات أقل لكن أكثر انضباطًا في الترتيب.",
      "الثبات الحقيقي يأتي من التحضير الجيد لا من كثرة المنتج فقط.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/makeup",
      label: "اختاري مسار المكياج المناسب لسياق يومك",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما الذي يتغير بين الدوام والمناسبة؟",
        body: "الدوام يحتاج مظهرًا مستقرًا ومريحًا مع قابلية تصحيح سريعة. المناسبة تحتاج ثباتًا أطول أمام حرارة وإضاءة مختلفة، لذلك تتغير طريقة البناء أكثر من تغيير المنتج نفسه.",
      },
      {
        heading: "كيف تختارين التغطية بدون ثقل؟",
        body: "ابدئي بتغطية متوسطة في المناطق الأساسية ثم زيدي فقط حيث يلزم. هذا يحافظ على الشكل الطبيعي ويقلل تكتل القاعدة مع مرور الساعات.",
      },
      {
        heading: "أين يحدث الفرق الحقيقي في الثبات؟",
        body: "الفرق عادة في مرحلة التحضير وترتيب الطبقات: توازن الترطيب، كمية المنتج، وطريقة التثبيت. هذه العناصر تصنع ثباتًا أفضل من زيادة الكمية وحدها.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج منتجًا مختلفًا تمامًا لكل سياق؟",
        answer:
          "ليس دائمًا. أحيانًا يكفي تغيير ترتيب الخطوات وكمية التطبيق للوصول لنتيجة أنسب دون تبديل كامل للسلة.",
      },
      {
        question: "كيف أقلل اللمعان في يوم العمل الطويل؟",
        answer:
          "اختاري قاعدة متوازنة، وركزي التثبيت في المناطق التي تفقد ثباتها أولًا بدل تثبيت الوجه كاملًا بطبقة ثقيلة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "niacinamide-and-hyaluronic-acid-together-when-pairing-helps-and-when-it-confuses",
    issue: "Issue 05",
    pillar: "المكونات بلا تعقيد",
    category: "شرح المكونات",
    title: "نياسيناميد + هيالورونيك أسيد: متى يفيد الجمع بينهما ومتى يسبب ارتباكًا؟",
    deck:
      "الجمع بين المكونات ليس هدفًا بحد ذاته. الهدف هو فهم دور كل مكون داخل الخطوات اليومية حتى يخدم الروتين بدل أن يضاعف الحيرة.",
    excerpt:
      "هذا الدليل يوضح متى يكون pairing منطقيًا بين niacinamide وhyaluronic acid، وكيف تتجنبين استخدامًا متداخلًا يربك تقييم النتيجة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "الجمع مفيد عندما يكون لكل مكون دور واضح داخل روتين ثابت: دعم مظهر متوازن مع راحة ترطيب يومية. أما إذا دخلت المكونات بلا ترتيب واضح، يتحول الجمع إلى طبقات كثيرة بلا فائدة قابلة للقياس.",
    takeaways: [
      "وضوح دور كل مكون أهم من مجرد الجمع بينهما.",
      "ثبات الروتين شرط أساسي لتقييم نتيجة pairing.",
      "أي جمع بلا هدف واضح يزيد الارتباك أكثر مما يحلّه.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/ingredients/niacinamide",
      label: "راجعي صفحة النياسيناميد مع مسارات الاستخدام المرتبطة",
      destinationType: "ingredient",
    },
    sections: [
      {
        heading: "متى يكون الجمع قرارًا جيدًا؟",
        body: "عندما يكون الروتين قصيرًا وواضحًا، ويخدم الجمع هدفًا محددًا مثل توازن المظهر مع راحة ترطيب مستمرة خلال اليوم.",
      },
      {
        heading: "متى يبدأ الارتباك؟",
        body: "عندما تُستخدم المكونات بأكثر من طبقة متشابهة أو في ترتيب غير مستقر من يوم لآخر، فتصبح النتيجة غير واضحة ولا يمكن فهم سبب التحسن أو التراجع.",
      },
      {
        heading: "كيف تبنين pairing قابلًا للتقييم؟",
        body: "ثبتي ترتيبًا بسيطًا لعدة أسابيع، وسجلي الملاحظات على التحمل والملمس قبل التفكير في إضافة عناصر جديدة.",
      },
    ],
    faq: [
      {
        question: "هل يمكن استخدام المكونين يوميًا؟",
        answer:
          "يمكن ذلك إذا كان الاستخدام مريحًا للبشرة وترتيب الروتين ثابتًا. المهم هو عدم التوسع في خطوات إضافية بلا سبب واضح.",
      },
      {
        question: "ما أول إشارة أن pairing الحالي غير مناسب؟",
        answer:
          "ظهور انزعاج متكرر أو نتائج غير مستقرة رغم الالتزام بنفس الخطوات، وهنا الأفضل تبسيط الروتين قبل أي إضافة جديدة.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "giftable-beauty-sets-by-budget-practical-guide-without-overbuying",
    issue: "Issue 05",
    pillar: "اختيار المنتج والشراء",
    category: "مجموعات وهدايا",
    title: "Beauty sets للهدايا حسب الميزانية: كيف تختارين خيارًا عمليًا بلا شراء زائد؟",
    deck:
      "عند اختيار هدية، الميزانية وحدها لا تكفي. الأهم هو توافق المجموعة مع مناسبة واضحة واستخدام يمكن الاستفادة منه فعليًا بعد الإهداء.",
    excerpt:
      "هذا الدليل يقسم قرار الهدايا حسب ميزانية واقعية ويمنع اختيار مجموعات كبيرة بلا قيمة استخدام حقيقية للمستلم.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "اختيار beauty set ناجح للهدايا يبدأ من مناسبة واضحة ثم ميزانية مناسبة، مع تفضيل المجموعة التي تحتوي عناصر أساسية قابلة للاستخدام اليومي بدل مجموعات كبيرة مليئة بعناصر هامشية.",
    takeaways: [
      "المناسبة أولًا ثم الميزانية، وليس العكس.",
      "المجموعة العملية أفضل من المجموعة الأكبر حجمًا.",
      "القرار الجيد يقلل الهدر ويرفع احتمال الاستخدام الفعلي.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "اختاري مجموعة هدية وفق مستوى الميزانية والمناسبة",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "كيف تقسّمين القرار حسب الميزانية؟",
        body: "قسّمي الخيارات إلى مستوى بداية، متوسط، وموسع. في كل مستوى، ابحثي عن وضوح الاستخدام اليومي بدل زيادة عدد العناصر بلا حاجة.",
      },
      {
        heading: "ما الذي يجعل المجموعة مناسبة كهدية فعلًا؟",
        body: "أن تكون مفهومة وسهلة الاستخدام من أول مرة، وأن تحمل فائدة مباشرة للمستلم بدل فرض روتين معقد أو عناصر يصعب دمجها.",
      },
      {
        heading: "متى يصبح الشراء زائدًا؟",
        body: "عندما تضاف عناصر لا ترتبط بالمناسبة أو لا تملك دورًا واضحًا داخل الاستخدام المتوقع. هنا الأفضل العودة لمجموعة أبسط وأكثر تركيزًا.",
      },
    ],
    faq: [
      {
        question: "هل المجموعة الأرخص دائمًا أفضل كهدية أولى؟",
        answer:
          "ليست دائمًا الأفضل. الأهم أن تكون متوازنة وقابلة للاستخدام، حتى لو كانت في مستوى متوسط بشرط وضوح القيمة.",
      },
      {
        question: "كيف أتأكد أن الهدية لن تكون مشتتة؟",
        answer:
          "اختاري مجموعة بسيناريو واحد واضح: عناية يومية، مناسبة، أو بداية روتين بسيط. كلما كان السيناريو أوضح كان القرار أدق.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "sensitive-skin-weather-shifts-what-to-keep-stable-first",
    issue: "Issue 06",
    pillar: "المشكلة والقرار الأول",
    category: "حساسية البشرة",
    title: "البشرة الحساسة مع تغيّر الجو: ما الذي يبقى ثابتًا أولًا؟",
    deck:
      "عند تغيّر الجو بين حرارة خارجية وتكييف داخلي قوي، تتوتر البشرة الحساسة بسرعة. هذا الدليل يوضح كيف تثبّتين الأساس قبل أي تعديل إضافي.",
    excerpt:
      "القرار الذكي هنا ليس إضافة منتجات كثيرة، بل تثبيت خطوات محددة تحمي راحة البشرة وتمنع التنقل اليومي بين روتينات متضاربة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ابدئي بخطوات قليلة وثابتة لعدة أسابيع، وامتنعي عن تغيير أكثر من عنصر واحد في كل مرة. هذه الطريقة تقلل التهيج وتجعلك تعرفين ما الذي ينفع فعلًا.",
    takeaways: [
      "الثبات أهم من كثرة التعديلات في أول مرحلة.",
      "أي تغيير سريع ومتعدد يربك تقييم النتيجة.",
      "روتين قصير واضح أفضل من روتين طويل غير مستقر.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/routines/morning-routine-oily-skin",
      label: "ابدئي مسار روتين ثابت للبشرة الحساسة والمتقلبة",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "لماذا التثبيت أولًا؟",
        body: "لأن البشرة الحساسة تتأثر بسرعة بالتغيير المتكرر. تثبيت خطوات قليلة يعطيك خط أساس واضح قبل أي توسيع.",
      },
      {
        heading: "متى تعدلين الروتين؟",
        body: "عند وجود نمط واضح على مدى أيام متتالية، وليس بناءً على رد فعل يوم واحد فقط.",
      },
      {
        heading: "كيف تمنعين الانتكاس؟",
        body: "دوّني سبب كل تعديل، وإذا لم يكن السبب واضحًا فالأفضل تأجيل التغيير حتى لا تعودي للعشوائية.",
      },
    ],
    faq: [
      {
        question: "هل أوقف كل المنتجات وأبدأ من الصفر؟",
        answer:
          "ليس دائمًا. ابدئي بتثبيت ما هو مريح بالفعل ثم قللي المتغيرات بدل إعادة بناء كل شيء دفعة واحدة.",
      },
      {
        question: "كم مدة التقييم قبل التعديل التالي؟",
        answer:
          "مدة قصيرة ثابتة تكفي لرصد نمط واضح، ثم تعديل عنصر واحد فقط ومتابعة الاستجابة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "hydration-layering-between-ac-and-outdoor-heat-without-heaviness",
    issue: "Issue 06",
    pillar: "أدلة السياق اليومي",
    category: "الترطيب اليومي",
    title: "ترطيب بين التكييف والحرارة الخارجية بدون طبقات ثقيلة",
    deck:
      "اختلاف البيئة خلال اليوم يسبب ارتباكًا في الترطيب: جفاف داخل المكاتب ولمعان خارجها. هذا الدليل يوضح توازنًا عمليًا بلا تحميل زائد.",
    excerpt:
      "المطلوب ليس زيادة الطبقات، بل توزيع ذكي للترطيب حسب وقت اليوم حتى يبقى الملمس مريحًا والمظهر متوازنًا.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "اعتمدي طبقات خفيفة قابلة للتعديل بدل طبقات ثقيلة من البداية. بهذه الطريقة تحافظين على الراحة داخل التكييف وعلى ثبات الشكل خارج المنزل.",
    takeaways: [
      "الطبقات الخفيفة أكثر مرونة من المنتجات الثقيلة.",
      "توقيت الترطيب يغيّر النتيجة مثل نوع المنتج.",
      "التوازن اليومي يمنع الانتقال بين جفاف ولمعان مبالغ.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/ingredients/hyaluronic-acid",
      label: "راجعي دور الهيالورونيك أسيد داخل مسار الترطيب اليومي",
      destinationType: "ingredient",
    },
    sections: [
      {
        heading: "لماذا تختلف النتيجة بين الداخل والخارج؟",
        body: "اختلاف الرطوبة والحرارة خلال اليوم يغيّر سلوك البشرة، لذلك نفس التطبيق قد يبدو مناسبًا في وقت ومزعجًا في وقت آخر.",
      },
      {
        heading: "كيف تبنين ترطيبًا مرنًا؟",
        body: "ابدئي بقاعدة خفيفة ثم أضيفي فقط عند الحاجة. هذا يحافظ على راحة الملمس ويقلل احتمالات الثقل.",
      },
      {
        heading: "ما إشارة أن الترطيب الحالي زائد؟",
        body: "إذا بدأ المظهر يبدو طبقيًا أو غير متوازن خلال اليوم، فالأفضل تبسيط الترتيب بدل إضافة مزيد من المنتجات.",
      },
    ],
    faq: [
      {
        question: "هل الترطيب الخفيف يكفي في الأجواء الحارة؟",
        answer:
          "غالبًا نعم إذا كان الترتيب صحيحًا وقابلًا للتعديل حسب وقت اليوم وحالة البشرة.",
      },
      {
        question: "متى أحتاج إعادة توزيع الخطوات؟",
        answer:
          "عندما تلاحظين تفاوتًا متكررًا بين الصباح وباقي اليوم، وهنا الأفضل تعديل الترتيب لا تضخيم الكمية.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "bundle-or-single-products-after-first-purchase-which-is-smarter",
    issue: "Issue 06",
    pillar: "اختيار المنتج والشراء",
    category: "مجموعات وشراء",
    title: "بعد أول شراء: متى المجموعة أذكى ومتى الشراء الفردي أفضل؟",
    deck:
      "بعد التجربة الأولى يبدأ السؤال الحقيقي: هل تستمرين بمسار المجموعة أم تنتقلين لعناصر فردية؟ القرار هنا يجب أن يبنى على الاستخدام لا على الانطباع.",
    excerpt:
      "هذا الدليل يضع قاعدة عملية لاختيار bundle أو single products بعد أول دورة استخدام، بهدف تقليل الهدر وتحسين دقة القرار.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت عناصر المجموعة كلها قيد الاستخدام الفعلي فالمجموعة ما زالت منطقية. أما إذا ظهر أن جزءًا منها غير مستعمل، فالانتقال لشراء فردي أكثر كفاءة.",
    takeaways: [
      "الاستعمال الفعلي هو معيار القرار، لا حجم المجموعة.",
      "الشراء الفردي مفيد عندما تتضح العناصر الضرورية فقط.",
      "المجموعة مناسبة عندما تختصر القرار بدل أن تعقده.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "قارني مسارات المجموعات قبل قرار التوسعة أو التخصيص",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "كيف تعرفين أن المجموعة ما زالت مناسبة؟",
        body: "عندما تكون معظم عناصرها ضمن الاستخدام الأسبوعي الفعلي، وتختصر عليك قرار إعادة الشراء بدل زيادته.",
      },
      {
        heading: "متى يصبح الشراء الفردي أفضل؟",
        body: "عندما يتضح أن عناصر محددة فقط هي التي تقدّم قيمة مستمرة، بينما بقية العناصر تظل هامشية أو غير مستخدمة.",
      },
      {
        heading: "كيف تتفادين تكرار الشراء غير المفيد؟",
        body: "راجعي سلوك الاستخدام بعد كل دورة، وحددي ما يجب استبداله أو تثبيته بدل إعادة نفس السلة تلقائيًا.",
      },
    ],
    faq: [
      {
        question: "هل الانتقال للشراء الفردي يعني فشل المجموعة؟",
        answer:
          "لا. هو تطور طبيعي بعد وضوح الاحتياج، والمهم أن يكون القرار مبنيًا على الاستخدام الحقيقي.",
      },
      {
        question: "متى أعيد تجربة مجموعة جديدة؟",
        answer:
          "عند وجود سيناريو مختلف واضح (مناسبة، سفر، أو تغيير موسمي) وليس لمجرد كثرة الخيارات.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "checkout-confirmation-control-after-payment-option-toggle-without-reopening-decision-loop",
    issue: "Issue 29",
    pillar: "اختيار المنتج والشراء",
    category: "payment-option toggle control",
    title:
      "بدّلتِ طريقة الدفع قرب التأكيد: كيف تضبطين checkout confirmation بدون إعادة فتح decision loop؟",
    deck:
      "تبديل طريقة الدفع في آخر لحظة لا يعني أن قرار الشراء كله عاد إلى نقطة الصفر. هذا الدليل يوضح متى يكون التبديل مجرد خطوة تنفيذية، ومتى يكشف أن الالتزام نفسه لم يكن جاهزًا بعد.",
    excerpt:
      "التحكم في checkout confirmation بعد payment-option toggle يمنع رجوع القرار إلى مقارنة مفتوحة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان تبديل طريقة الدفع سببه تشغيلي فقط، ثبتي المنتج نفسه وأكملي. أعيدي فتح القرار فقط إذا غيّر التبديل مستوى الالتزام أو التوقيت أو الأمان بشكل يمس أصل قرار الشراء، لا لمجرد شعور عابر بالحذر.",
    takeaways: [
      "تبديل وسيلة الدفع ليس سببًا تلقائيًا لإعادة تقييم المنتج.",
      "المراجعة الصحيحة هنا تخص الالتزام والتنفيذ، لا العودة إلى تصفح المقارنات.",
      "كل loop جديدة قرب التأكيد ترفع خطر التسرب أكثر مما تحسن جودة القرار.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/checkout",
      label: "أكملي checkout بعد تثبيت القرار رغم تبديل طريقة الدفع",
      destinationType: "commerce",
    },
    featured: true,
    sections: [
      {
        heading: "متى يكون payment-option toggle آمنًا؟",
        body: "عندما يظل سبب الشراء والمنتج المختار كما هما، ويكون التبديل فقط لتسهيل التنفيذ أو تحسين ملاءمة الدفع.",
      },
      {
        heading: "متى يجب إعادة فتح القرار أصلًا؟",
        body: "إذا كشف التبديل عن اعتراض حقيقي على مستوى الالتزام أو الحماية أو توقيت الخصم، لا إذا كان مجرد تفضيل تشغيلي.",
      },
      {
        heading: "كيف تمنعين reopening للـ decision loop؟",
        body: "ثبتي قاعدة بسيطة: راجعي نقطة واحدة متصلة بطريقة الدفع، ثم أكملي أو أوقفي بوعي دون الرجوع إلى مقارنة منتجات أو عروض جديدة.",
      },
    ],
    faq: [
      {
        question: "هل تغيير وسيلة الدفع يعني أنني لست جاهزة للشراء؟",
        answer:
          "ليس بالضرورة. أحيانًا يكون السبب فقط أسهلية التنفيذ، والمهم هنا ألا يتحول هذا التبديل إلى تشكيك عام في القرار كله.",
      },
      {
        question: "ما العلامة أن القرار نفسه يحتاج مراجعة؟",
        answer:
          "أن يتغير مستوى الالتزام أو الإحساس بالأمان المرتبط بالشراء، لا مجرد الطريقة التي سيتم بها الدفع.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "delivery-commitment-confidence-handoff-from-pdp-context-when-one-hesitation-remains",
    issue: "Issue 29",
    pillar: "أدلة السياق اليومي",
    category: "delivery-commitment handoff",
    title:
      "عند بقاء تردد واحد حول التوصيل: ما handoff الثقة من سياق PDP إلى cart قبل الالتزام؟",
    deck:
      "في كثير من الحالات لا يتبقى سوى اعتراض صغير حول موعد أو التزام التوصيل. المطلوب هنا ليس مقارنة جديدة، بل handoff واضح يربط سبب اختيار المنتج بحدود التنفيذ الواقعية قبل الانتقال إلى cart.",
    excerpt:
      "handoff الثقة حول التوصيل يحسم hesitation واحدًا دون كسر زخم الشراء.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "انقلي القرار من PDP إلى cart فقط إذا كان التردد محصورًا في التوصيل نفسه. أعيدي تذكير المستخدم بسبب الاختيار وما هو الالتزام الواقعي للتوصيل، ثم اجعلي الخطوة التالية إما تنفيذًا مباشرًا أو مراجعة نقطة fit واحدة فقط، لا رحلة مقارنة جديدة.",
    takeaways: [
      "handoff الجيد يربط سبب الشراء بحدود التنفيذ، لا بوعود أوسع.",
      "التردد الواحد حول التوصيل لا يحتاج إعادة فتح كل مسار المقارنة.",
      "cart يجب أن يكون امتدادًا للقرار، لا بداية تردد جديد.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/cart",
      label: "انتقلي إلى cart بعد handoff ثقة واضح حول التوصيل",
      destinationType: "commerce",
    },
    sections: [
      {
        heading: "ما وظيفة handoff هنا؟",
        body: "إبقاء القرار داخل مساره الأصلي مع توضيح ما الذي يمكن توقعه فعليًا من التوصيل قبل التنفيذ.",
      },
      {
        heading: "متى لا يكفي handoff وحده؟",
        body: "عندما لا يكون الاعتراض عن التوصيل فقط، بل عن fit المنتج أو الأولوية الشرائية نفسها.",
      },
      {
        heading: "كيف نحافظ على زخم القرار؟",
        body: "بتحديد خيارين فقط: تنفيذ مباشر أو مراجعة دقيقة لنقطة واحدة، بدل التوسع في مقارنة مفتوحة جديدة.",
      },
    ],
    faq: [
      {
        question: "هل handoff حول التوصيل يعتبر ضغطًا على المستخدم؟",
        answer:
          "لا. هو يوضح الحدود الواقعية ويمنع خلط اعتراض واحد صغير بتراجع كامل عن قرار كان شبه محسوم.",
      },
      {
        question: "هل أرجع إلى PDP أم أذهب إلى cart؟",
        answer:
          "إذا كانت النقطة الوحيدة المتبقية مرتبطة بالتوصيل، فالأفضل الذهاب إلى cart مع handoff واضح. الرجوع إلى PDP يكون فقط عند وجود نقطة fit محددة تحتاج حسمًا.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "haircare-second-window-drift-check-after-stability-confirmation",
    issue: "Issue 29",
    pillar: "الروتينات العملية",
    category: "second-window drift checks",
    title:
      "بعد تأكيد الاستقرار في haircare: كيف تلتقطين second-window drift قبل قرار replace؟",
    deck:
      "نجاح نافذة استقرار واحدة لا يغلق الملف نهائيًا. هذا الدليل يشرح كيف تراقبين drift مبكرًا في النافذة التالية قبل أن يتحول rebound عابر إلى قرار استبدال متسرع.",
    excerpt:
      "second-window drift check يفصل بين تذبذب عابر ومؤشر mismatch حقيقي.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "بعد أول نافذة مستقرة، راقبي نفس الروتين في نافذة مشابهة تالية. إذا ظهر drift خفيف مع بقاء الأداء العام مقبولًا، استمري في keep. أما إذا عاد النمط نفسه مع تراجع واضح ومتكرر، فابدئي مراجعة replacement على أساس pattern متكرر لا انطباع لحظي.",
    takeaways: [
      "نافذة استقرار واحدة مفيدة، لكنها ليست حكمًا نهائيًا.",
      "الدرفت المبكر لا يعني replace تلقائيًا ما لم يتكرر بنفس النمط.",
      "القرار الأفضل يبنى على pattern عبر نافذتين متشابهتين لا على يوم سيئ واحد.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/haircare",
      label: "راجعي second-window drift قبل أي قرار replace في haircare",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "لماذا النافذة الثانية مهمة؟",
        body: "لأنها تكشف هل كان التحسن الأول بداية استقرار حقيقي أم مجرد rebound مؤقت تحت ظروف مريحة.",
      },
      {
        heading: "ما الفرق بين drift بسيط وmismatch حقيقي؟",
        body: "الدرفت البسيط يبقى محدودًا مع قابلية التعافي، بينما الميسماتش الحقيقي يعيد نفس المشكلة الأساسية بوضوح رغم ثبات الخطوات.",
      },
      {
        heading: "كيف تمنعين الاستبدال المتسرع؟",
        body: "بوضع متابعة قصيرة على نفس الخطوات ونفس الظروف قدر الإمكان قبل نقل القرار من keep إلى replace.",
      },
    ],
    faq: [
      {
        question: "هل أي drift بعد الاستقرار يعني أن keep كان خطأ؟",
        answer:
          "لا. المهم هو حجم التراجع وتكراره في نافذة مشابهة، لا مجرد ظهور fluctuation بسيط بعد الاستقرار الأول.",
      },
      {
        question: "متى يصبح replace منطقيًا؟",
        answer:
          "عندما يتكرر النمط السلبي نفسه مع التزام واضح بنفس خطوات الروتين، بحيث يصبح drift نمطًا لا استثناءً.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "repeat-order-volume-controls-when-refill-urgency-is-high-but-usage-variance-remains",
    issue: "Issue 29",
    pillar: "اختيار المنتج والشراء",
    category: "repeat-order volume controls",
    title:
      "الاستعجال مرتفع لكن الاستهلاك متذبذب: ما ضوابط volume controls قبل repeat-order؟",
    deck:
      "عندما يرتفع إحساس refill urgency قبل أن يثبت حجم الاستهلاك، يصبح سؤال الكمية أهم من سؤال الشراء نفسه. هذا الدليل يحدد متى تكررين بنفس الحجم ومتى تخفضين الالتزام.",
    excerpt:
      "volume controls تمنع over-order عندما تكون refill urgency أعلى من وضوح الاستخدام.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان refill urgency حقيقيًا لكن usage variance ما زال واضحًا، ثبتي قرار إعادة الطلب أولًا ثم خففي حجم الالتزام: منتج واحد أو حجم محافظ بدل مضاعفة الكمية. لا ترفعي الحجم إلا بعد ثبات الاستهلاك عبر نافذة قصيرة متكررة.",
    takeaways: [
      "يمكن أن يكون قرار repeat-order صحيحًا بينما يكون قرار الكمية مبالغًا فيه.",
      "الاستعجال وحده لا يبرر رفع حجم الطلب عندما يبقى الاستهلاك متذبذبًا.",
      "التحكم في volume يقلل أخطاء over-order بدون تأخير غير ضروري.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/vitamin-c",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label: "أعيدي الطلب بحجم منضبط إذا كانت urgency أعلى من وضوح الاستهلاك",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما معنى high urgency مع usage variance؟",
        body: "أن الحاجة لإعادة الطلب تبدو قريبة، لكن معدل الاستهلاك لم يستقر بعد بما يكفي لتبرير زيادة الكمية بثقة.",
      },
      {
        heading: "متى نكرر بنفس الحجم؟",
        body: "عندما يكون الاستهلاك عاد تقريبًا إلى نمط متوقع، حتى لو ظل هناك هامش تذبذب صغير لا يغير الصورة العامة.",
      },
      {
        heading: "متى نخفض الالتزام؟",
        body: "إذا بقي التذبذب واضحًا أو كان التغيير في الاستخدام مرتبطًا بسفر أو ضغط مؤقت لم يثبت بعد كروتين جديد.",
      },
    ],
    faq: [
      {
        question: "هل الأفضل تأجيل repeat-order بالكامل؟",
        answer:
          "ليس دائمًا. أحيانًا القرار الصحيح هو إعادة الطلب مع ضبط الحجم، بدل التأجيل الكامل أو المبالغة في الكمية.",
      },
      {
        question: "هل رفع الكمية يوفر أكثر دائمًا؟",
        answer:
          "فقط عندما يكون الاستهلاك ثابتًا بما يكفي. أما مع usage variance الواضح فقد يتحول التوفير الظاهري إلى التزام أكبر من الحاجة الحقيقية.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "checkout-recovery-after-coupon-rejection-without-restarting-offer-loop",
    issue: "Issue 28",
    pillar: "اختيار المنتج والشراء",
    category: "coupon-rejection recovery",
    title:
      "بعد رفض الكوبون في checkout: كيف تستعيدين القرار بدون إعادة فتح loop العروض؟",
    deck:
      "رفض الكوبون في آخر خطوة قد يكسر قرار شراء جاهز. هذا الدليل يوضح كيف تستعيدين المسار بسرعة بدون الرجوع للبحث عن عروض جديدة.",
    excerpt:
      "استعادة checkout بعد coupon rejection تحتاج قاعدة تنفيذ واضحة لا رحلة بحث جديدة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا رُفض الكوبون، ثبتي القرار على قيمة المنتج وخطة الاستخدام، ثم أكملي بخيار الدفع الحالي. لا تعيدي تشغيل بحث العروض إلا إذا كان لديك بديل موثق وفوري لا يفتح مسار تشتت جديد.",
    takeaways: [
      "رفض الكوبون ليس سببًا كافيًا لإلغاء قرار شراء ناضج.",
      "loop العروض قرب التأكيد يرفع احتمالات التسرب.",
      "البديل الوحيد المقبول: عرض فوري ومؤكد دون بحث إضافي.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/checkout",
      label: "أكملي checkout بعد recovery سريع من رفض الكوبون",
      destinationType: "commerce",
    },
    sections: [
      {
        heading: "ما أول خطوة بعد coupon rejection؟",
        body: "أغلقي مسار البحث الخارجي فورًا وراجعي فقط ما إذا كان القرار الشرائي نفسه ما زال ثابتًا.",
      },
      {
        heading: "متى يسمح باستبدال العرض؟",
        body: "عندما يكون البديل معروفًا مسبقًا ومتاحًا مباشرة داخل نفس مسار الإتمام.",
      },
      {
        heading: "كيف تمنعين restart loop؟",
        body: "حددي قاعدة: محاولة واحدة فقط، ثم إكمال أو إيقاف واعٍ دون تصفح عروض متسلسل.",
      },
    ],
    faq: [
      {
        question: "هل ألغِي الطلب إذا لم يعمل الكوبون؟",
        answer:
          "ليس تلقائيًا. القرار يجب أن يعتمد على قيمة المنتج والاستخدام، لا على نتيجة محاولة خصم واحدة.",
      },
      {
        question: "متى يكون الإيقاف منطقيًا؟",
        answer:
          "عندما يتغير أصل القرار نفسه، لا لمجرد فقدان عرض ترويجي غير مؤكد.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "payment-step-confidence-handoff-from-pdp-context-to-cart-execution",
    issue: "Issue 28",
    pillar: "أدلة السياق اليومي",
    category: "payment-step confidence handoff",
    title:
      "من سياق PDP إلى تنفيذ cart: ما handoff الثقة قبل خطوة الدفع؟",
    deck:
      "قبل الدفع مباشرة يحتاج المستخدم جسر ثقة صغير يربط سبب الاختيار في PDP بخطوة التنفيذ في cart بدون الرجوع للمقارنة.",
    excerpt:
      "handoff ثقة قصير قبل الدفع يمنع الانحراف من التنفيذ إلى تردد جديد.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "استخدمي handoff يذكّر بسبب الاختيار الأساسي ويحدد خطوة التنفيذ التالية بوضوح: الدفع الآن أو مراجعة نقطة واحدة داخل PDP. أي توسيع خارج هذين المسارين يعيدك لدائرة تردد غير منتجة.",
    takeaways: [
      "handoff الثقة يربط السبب بالفعل، لا بالمقارنة.",
      "المراجعة المقبولة قبل الدفع يجب أن تكون نقطة واحدة فقط.",
      "الرجوع المفتوح للتصفح يضعف قرارًا كان جاهزًا للتنفيذ.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/cart",
      label: "انتقلي إلى cart عبر handoff ثقة واضح قبل الدفع",
      destinationType: "commerce",
    },
    sections: [
      {
        heading: "ما وظيفة handoff قبل الدفع؟",
        body: "تقليل الحمل الذهني بإعادة تثبيت سبب الشراء وتحديد الإجراء المباشر التالي.",
      },
      {
        heading: "متى نعود إلى PDP؟",
        body: "عند اعتراض واحد محدد قابل للحسم، لا عند شعور عام بالتردد.",
      },
      {
        heading: "كيف نحافظ على زخم التنفيذ؟",
        body: "بتقييد الخيارات في هذه المرحلة إلى تنفيذ أو مراجعة دقيقة واحدة فقط.",
      },
    ],
    faq: [
      {
        question: "هل handoff يعني ضغطًا على المستخدم؟",
        answer:
          "لا. هو يوضّح المسار ويمنع التشتت، مع إبقاء خيار مراجعة محددة متاحًا.",
      },
      {
        question: "هل أحتاج مقارنة جديدة قبل الدفع؟",
        answer:
          "في الغالب لا إذا كان سبب الاختيار محسومًا داخل PDP بالفعل.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "post-keep-decision-haircare-rebound-stability-check-next-humidity-window",
    issue: "Issue 28",
    pillar: "الروتينات العملية",
    category: "post-keep rebound stability checks",
    title:
      "بعد قرار keep في haircare: كيف تتحققين من الثبات في نافذة الرطوبة التالية؟",
    deck:
      "قرار keep بعد rebound يحتاج متابعة دقيقة في النافذة المناخية التالية. هذا الدليل يحدد متى يعتبر القرار ثابتًا ومتى يحتاج تصحيحًا.",
    excerpt:
      "فحص الثبات بعد keep في نافذة رطوبة جديدة يمنع تأكيدًا مبكرًا أو استبدالًا متسرعًا.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "بعد keep، راقبي الأداء في نافذة رطوبة مشابهة مع نفس خطوات الصيانة. إذا بقي التحسن متكررًا فالقرار صحيح. إذا عاد نفس الخلل بدرجة واضحة، انتقلي إلى مراجعة replace وفق بيانات الاستخدام لا الانطباع اللحظي.",
    takeaways: [
      "قرار keep يحتاج إثباتًا لاحقًا لا إعلانًا نهائيًا مباشرًا.",
      "نافذة الرطوبة التالية هي اختبار الحقيقة لثبات المسار.",
      "التحول إلى replace يجب أن يكون قائمًا على نمط متكرر.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label: "راجعي قرار keep بعد نافذة الرطوبة التالية",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما المؤشر أن keep كان صحيحًا؟",
        body: "تكرار نفس مستوى الأداء المقبول في نافذة رطوبة قريبة دون تدخلات استثنائية.",
      },
      {
        heading: "ما المؤشر أن القرار يحتاج تصحيحًا؟",
        body: "عودة الخلل نفسه بصورة مستقرة رغم الالتزام بنفس خطوات maintenance.",
      },
      {
        heading: "كيف تمنعين القرارات المتقلبة؟",
        body: "لا تحكمي من يوم واحد؛ اعتمدي نافذة متابعة قصيرة مرتبطة بنفس الظروف المناخية.",
      },
    ],
    faq: [
      {
        question: "هل rebound بسيط يعني فشل keep؟",
        answer:
          "ليس بالضرورة. الفشل يثبت مع تكرار واضح للخلل عبر النافذة التالية.",
      },
      {
        question: "متى أنتقل إلى replace؟",
        answer:
          "عندما تتكرر نفس المشكلة الأساسية بعد متابعة منضبطة في ظروف مماثلة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "refill-urgency-controls-when-post-travel-rhythm-is-nearly-stable",
    issue: "Issue 28",
    pillar: "اختيار المنتج والشراء",
    category: "refill-urgency controls",
    title:
      "الإيقاع بعد السفر شبه مستقر: ما ضوابط refill urgency قبل إعادة الطلب؟",
    deck:
      "عندما يبدأ الإيقاع في الاستقرار بعد السفر، يظهر استعجال refill قد يكون مبكرًا أو متأخرًا. هذا الدليل يضبط توقيت القرار.",
    excerpt:
      "ضبط refill urgency بعد travel-reset يقلل أخطاء التوقيت في repeat-order.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "لا تعتمدي على إحساس النفاد وحده. اربطي قرار refill بمؤشرين معًا: عودة نمط الاستخدام واستقرار معدل الاستهلاك. إذا كان أحدهما غير ثابت، استخدمي نافذة متابعة قصيرة قبل الالتزام النهائي.",
    takeaways: [
      "إحساس النفاد وحده لا يكفي لضبط refill timing.",
      "القرار الأدق يجمع بين إيقاع الاستخدام ومعدل الاستهلاك.",
      "نافذة المتابعة القصيرة تمنع refill مبكرًا أو متأخرًا.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label: "طبقي ضوابط refill urgency قبل تأكيد repeat-order",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما معنى nearly stable rhythm؟",
        body: "أن الاستخدام عاد في الاتجاه الصحيح لكنه لم يصل بعد إلى انتظام كامل يمكن البناء عليه بثقة.",
      },
      {
        heading: "متى يصبح refill urgency مبررًا؟",
        body: "عندما يثبت معدل الاستهلاك عبر نافذة قصيرة بالتوازي مع عودة الإيقاع الطبيعي.",
      },
      {
        heading: "متى نؤجل القرار؟",
        body: "إذا ظل أحد المؤشرين (الإيقاع أو الاستهلاك) متذبذبًا بشكل واضح.",
      },
    ],
    faq: [
      {
        question: "هل التأجيل القصير يؤثر سلبًا؟",
        answer:
          "غالبًا لا، بل يحسن دقة القرار ويمنع تكرار طلب غير محسوب.",
      },
      {
        question: "هل الحماس بعد العودة يكفي؟",
        answer:
          "لا. الحماس مفيد لكن يجب دعمه بمؤشرات استخدام مستقرة.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "coupon-distraction-check-before-final-checkout-confirmation",
    issue: "Issue 27",
    pillar: "اختيار المنتج والشراء",
    category: "coupon-distraction checks",
    title:
      "قبل تأكيد checkout النهائي: كيف تتجنبين تشتت الكوبون الذي يكسر قرار الشراء؟",
    deck:
      "كثير من قرارات الشراء الناضجة تتعطل بسبب البحث المتأخر عن خصم إضافي. هذا الدليل يضع قاعدة عملية تمنع تشتت الكوبون قرب خطوة التأكيد.",
    excerpt:
      "فحص coupon distraction قبل التأكيد النهائي يقلل الانقطاع ويمنع فقدان قرار شراء مكتمل.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الكوبون غير مؤكد أو غير متاح مباشرة، لا تجعليه سببًا لمغادرة checkout. احسمي أولًا قيمة القرار نفسه، ثم طبقي خصمًا متاحًا فقط إن كان واضحًا وفوريًا دون فتح مسار بحث جديد.",
    takeaways: [
      "البحث المتأخر عن كوبون يرفع احتمال فقدان قرار الشراء.",
      "الخصم غير المؤكد لا يجب أن يوقف checkout الناضج.",
      "قاعدة خصم واحدة واضحة أفضل من سلسلة محاولات مشتتة.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/checkout",
      label: "أكملي التأكيد النهائي وفق قاعدة coupon واحدة واضحة",
      destinationType: "commerce",
    },
    sections: [
      {
        heading: "ما علامة coupon distraction قرب التأكيد؟",
        body: "الانتقال المتكرر خارج checkout للبحث عن عروض غير مؤكدة رغم أن الاختيار نفسه محسوم.",
      },
      {
        heading: "متى أطبق الخصم ومتى أتجاوزه؟",
        body: "طبقيه إذا كان فوريًا ومتاحًا بوضوح. تجاوزيه إذا كان يتطلب بحثًا إضافيًا يفتح loop جديد.",
      },
      {
        heading: "كيف تحمين قرار الشراء من الانقطاع؟",
        body: "افصلي بين جودة القرار وقيمة الخصم: القرار أولًا، والخصم فقط إذا كان تنفيذه مباشرًا.",
      },
    ],
    faq: [
      {
        question: "هل تجاهل الكوبون يعني شراء غير ذكي؟",
        answer:
          "ليس دائمًا. الذكاء هنا هو حماية قرار صحيح من التشتت، لا مطاردة خصم غير مضمون.",
      },
      {
        question: "متى أؤجل التأكيد بسبب خصم؟",
        answer:
          "فقط إذا كان الخصم موثقًا وقريب التفعيل دون فتح رحلة بحث جديدة خارج checkout.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "delivery-window-trust-handoff-from-pdp-to-cart-with-one-hesitation",
    issue: "Issue 27",
    pillar: "أدلة السياق اليومي",
    category: "delivery-window trust handoff",
    title:
      "تردد واحد حول نافذة التوصيل: كيف تنقلين الثقة من PDP إلى cart بدون رجوع للفئات؟",
    deck:
      "عندما يبقى التردد في موعد الوصول فقط، الحل ليس إعادة المقارنة بل handoff ثقة واضح من PDP إلى cart.",
    excerpt:
      "handoff ثقة مرتبط بنافذة التوصيل يقلل الرجوع غير الضروري إلى صفحات الفئات قبل الدفع.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الاعتراض الوحيد حول التوصيل، قدمي نقطة ثقة مرتبطة بالموعد المتوقع داخل PDP ثم انتقلي مباشرة إلى cart. أي اعتراض جديد خارج التوصيل يعني أن القرار يحتاج مراجعة مركزة بدل التوسع في التصفح.",
    takeaways: [
      "نافذة التوصيل تردد تنفيذي وليست مقارنة منتج جديدة.",
      "handoff ثقة واحد واضح يكفي قبل الانتقال إلى السلة.",
      "الرجوع للفئات عند تردد توصيل واحد غالبًا يهدر قرارًا جاهزًا.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/cart",
      label: "انتقلي إلى السلة بعد حسم تردد نافذة التوصيل",
      destinationType: "commerce",
    },
    sections: [
      {
        heading: "متى يكون تردد التوصيل هو التردد الأخير فعلًا؟",
        body: "عندما يظل اختيار المنتج ثابتًا ولا يظهر اعتراض جديد في الملاءمة أو الاستخدام.",
      },
      {
        heading: "ما شكل handoff الثقة المناسب؟",
        body: "رسالة واضحة عن نافذة الوصول المتوقعة مع مسار تنفيذ مباشر إلى cart.",
      },
      {
        heading: "متى لا يكفي handoff التوصيل؟",
        body: "عندما يتحول الاعتراض إلى شك في المنتج أو في سبب الاختيار الأساسي.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج صفحة مقارنة جديدة بسبب التوصيل؟",
        answer:
          "غالبًا لا. إذا التردد محدود بالتوصيل، فالحل يكون في handoff تنفيذي لا في مقارنة واسعة.",
      },
      {
        question: "متى أرجع إلى PDP بدل cart؟",
        answer:
          "عند ظهور اعتراض إضافي خارج نافذة التوصيل يؤثر على القرار نفسه.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "keep-versus-replace-after-two-humidity-rebound-cycles",
    issue: "Issue 27",
    pillar: "الروتينات العملية",
    category: "keep-versus-replace after rebound cycles",
    title:
      "بعد دورتين rebound مع الرطوبة: متى نستمر ومتى نستبدل في haircare؟",
    deck:
      "قرار keep أو replace بعد rebound متكرر يحتاج معيارًا واضحًا. هذا الدليل يحدد حكمًا عمليًا بعد دورتين رطوبة متشابهتين.",
    excerpt:
      "فحص دورتين رطوبة متتاليتين يعطي قرارًا أدق بين الاستمرار والاستبدال في haircare.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا تحسن الأداء بعد الضبط في كل دورة رطوبة وبقي الخلل محدودًا، استمري على maintenance. إذا تكرر نفس الخلل الرئيسي عبر دورتين متتاليتين رغم الضبط الصحيح، يصبح الاستبدال قرارًا منطقيًا.",
    takeaways: [
      "الدورة الواحدة لا تكفي للحكم النهائي.",
      "تكرار الخلل عبر دورتين يرفع ثقة قرار الاستبدال.",
      "الاستمرار مناسب عندما يكون التحسن قابلًا للتكرار مع الضبط.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label: "راجعي قرار keep/replace بعد اختبار دورتين رطوبة",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "لماذا نحتاج دورتين بدل دورة واحدة؟",
        body: "لأن تأثير الرطوبة قد يتذبذب يوميًا، ودورتان تقللان احتمال الحكم المتسرع.",
      },
      {
        heading: "ما المؤشر الأقوى للاستبدال؟",
        body: "تكرار نفس الخلل الرئيسي بنفس النمط رغم التزامك بخطوات الضبط الأساسية.",
      },
      {
        heading: "ما المؤشر الأقوى للاستمرار؟",
        body: "قدرة الروتين على استعادة الأداء بعد كل rebound مع تدخلات maintenance محدودة.",
      },
    ],
    faq: [
      {
        question: "هل كل rebound يعني mismatch؟",
        answer:
          "لا. المهم هو التكرار المستقر للخلل رغم الضبط وليس حدوث rebound مرة واحدة.",
      },
      {
        question: "هل أستبدل مباشرة بعد الدورة الثانية؟",
        answer:
          "إذا كانت الإشارة متكررة وواضحة نعم، وإلا يمكن تمديد نافذة قصيرة إضافية للتأكيد.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "repeat-order-timing-guardrails-during-post-travel-rhythm-reset",
    issue: "Issue 27",
    pillar: "اختيار المنتج والشراء",
    category: "repeat-order timing guardrails",
    title:
      "أثناء استعادة الإيقاع بعد السفر: ما guardrails توقيت repeat-order؟",
    deck:
      "بعد السفر يعود الاستخدام تدريجيًا، ويصبح توقيت repeat-order أكثر حساسية. هذا الدليل يضع guardrails تمنع قرارًا مبكرًا أو متأخرًا.",
    excerpt:
      "توقيت repeat-order بعد السفر يحتاج قواعد إيقاع واضحة، لا اعتمادًا على شعور لحظي بالنفاد أو الحماس.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "خلال rhythm reset بعد السفر، لا تؤكدي repeat-order قبل عودة نمط الاستخدام إلى خطه الطبيعي. إذا ظل التوقيت متذبذبًا، اعتمدي نافذة مراقبة قصيرة مع عتبة واضحة للنفاد قبل الالتزام الكامل.",
    takeaways: [
      "استعادة الإيقاع تسبق تأكيد repeat-order.",
      "عتبة نفاد واضحة تمنع قرارات مبكرة متسرعة.",
      "نافذة مراقبة قصيرة تحسن دقة توقيت إعادة الطلب.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label: "طبقي guardrails التوقيت قبل تأكيد repeat-order",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما أول guardrail بعد السفر؟",
        body: "تأكيد عودة عدد مرات الاستخدام الأسبوعي إلى النمط الطبيعي قبل اتخاذ قرار إعادة الطلب.",
      },
      {
        heading: "متى يصبح التوقيت آمنًا؟",
        body: "عند تقارب إشارة النفاد مع الإيقاع الفعلي للاستخدام وعدم وجود قفزات كبيرة بين الأيام.",
      },
      {
        heading: "متى نؤجل القرار؟",
        body: "عند بقاء نمط الاستخدام مضطربًا أو اختلاف كبير بين النية والتطبيق الفعلي.",
      },
    ],
    faq: [
      {
        question: "هل التأخير هنا يضر الاستمرارية؟",
        answer:
          "إذا كان التأخير قصيرًا ومخططًا فهو يحسن جودة القرار ولا يضر الاستمرارية.",
      },
      {
        question: "هل يمكن الاعتماد على الحماس فقط بعد السفر؟",
        answer:
          "لا. الحماس مفيد لكنه لا يكفي بدون مؤشرات استخدام مستقرة.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "checkout-objection-compression-before-payment-method-switch-loop",
    issue: "Issue 26",
    pillar: "اختيار المنتج والشراء",
    category: "checkout objection compression",
    title:
      "قبل تبديل طريقة الدفع: كيف تضغطين اعتراض checkout الأخير بدون الدخول في loop جديد؟",
    deck:
      "أحيانًا يتأخر الإتمام بسبب شك صغير في خطوة الدفع، ثم يبدأ التنقل بين خيارات كثيرة بلا قرار. هذا الدليل يختصر الاعتراض في اختبار واحد واضح.",
    excerpt:
      "ضغط اعتراض checkout قبل تبديل طريقة الدفع يمنع loop التردد ويحافظ على قرار الشراء الناضج.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "قبل تغيير طريقة الدفع، احسمي ما إذا كانت المشكلة في التنفيذ أم في الثقة بالقرار. إذا القرار ثابت والاعتراض تنفيذي، جرّبي مسار دفع واحدًا واضحًا ثم أكملي. أما إذا الاعتراض يمس الثقة الأساسية، أعيدي التحقق داخل PDP وليس عبر تنقلات checkout متكررة.",
    takeaways: [
      "تبديل طرق الدفع قبل حسم نوع الاعتراض يزيد loop التردد.",
      "الاعتراض التنفيذي يُحل بمسار واحد واضح، لا بمزيد من الخيارات.",
      "التحقق من الثقة يعود إلى PDP لا إلى checkout.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/checkout",
      label: "أكملي checkout بمسار دفع واحد بعد حسم نوع الاعتراض",
      destinationType: "commerce",
    },
    sections: [
      {
        heading: "ما علامة أن الاعتراض تنفيذي فقط؟",
        body: "أن يبقى سبب اختيار المنتج ثابتًا بينما الشك محصور في خطوة إتمام الدفع نفسها.",
      },
      {
        heading: "متى لا نغيّر طريقة الدفع فورًا؟",
        body: "عندما لا يكون نوع الاعتراض واضحًا بعد، لأن التبديل المبكر قد يحجب السبب الحقيقي للتردد.",
      },
      {
        heading: "كيف تمنعين loop checkout؟",
        body: "حددي اختبارًا واحدًا، نفّذيه، ثم قرري: إكمال أو رجوع موجه إلى PDP.",
      },
    ],
    faq: [
      {
        question: "هل تغيير طريقة الدفع حل أسرع دائمًا؟",
        answer:
          "ليس دائمًا. السرعة الحقيقية تأتي من حسم الاعتراض أولًا ثم اختيار المسار المناسب مرة واحدة.",
      },
      {
        question: "متى أعود من checkout إلى PDP؟",
        answer:
          "عند ظهور شك في ملاءمة المنتج أو في سبب الاختيار الأساسي، وليس فقط في آلية الدفع.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "pdp-to-cart-trust-proof-handoff-when-shipping-hesitation-remains",
    issue: "Issue 26",
    pillar: "أدلة السياق اليومي",
    category: "pdp-to-cart trust-proof handoff",
    title:
      "من PDP إلى cart مع تردد شحن/ثقة واحد: ما handoff proof الذي يمنع العودة للتصفح؟",
    deck:
      "عند بقاء اعتراض واحد حول الشحن أو الثقة، يمكن إنقاذ القرار بـ handoff proof قصير بدل العودة إلى تصفح واسع.",
    excerpt:
      "handoff trust-proof واضح يقلل الرجوع إلى الفئات عندما يبقى تردد واحد فقط قبل الدفع.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا بقي تردد واحد متعلق بالشحن أو الموثوقية، قدّمي proof موجزًا مرتبطًا مباشرة بخطوة cart، ثم تحركي للتنفيذ. أي توسع جديد في الاعتراضات يعني أن القرار لم ينضج بعد ويحتاج مراجعة مركزة داخل PDP.",
    takeaways: [
      "proof القصير يكفي عندما يكون التردد واحدًا ومحددًا.",
      "العودة للفئات ليست علاجًا لتردد الثقة الأحادي.",
      "handoff الجيد يربط الدليل بالفعل التالي مباشرة.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/cart",
      label: "استخدمي handoff proof المختصر ثم انتقلي إلى السلة",
      destinationType: "commerce",
    },
    sections: [
      {
        heading: "ما المقصود بـ trust-proof مختصر؟",
        body: "دليل واحد مباشر يجاوب التردد المتبقي بدون فتح محاور جديدة غير لازمة.",
      },
      {
        heading: "متى يفشل handoff proof؟",
        body: "عندما يُستخدم مع اعتراضات متعددة أو مع شك أساسي في ملاءمة المنتج.",
      },
      {
        heading: "كيف تربطين proof بالخطوة التالية؟",
        body: "اجعلي الدليل ملاصقًا لزر الانتقال إلى cart، حتى لا يضيع القرار بين صفحات أخرى.",
      },
    ],
    faq: [
      {
        question: "هل يكفي proof واحد لكل المستخدمين؟",
        answer:
          "يكفي فقط عند وجود اعتراض واحد متبقٍ. غير ذلك يحتاج إطار قرار أوسع.",
      },
      {
        question: "ما المؤشر أن الوقت مبكر على cart؟",
        answer:
          "إذا ظهر أكثر من تردد جديد بعد proof، فالمسار الصحيح هو العودة إلى PDP للمراجعة.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "haircare-maintenance-versus-replacement-after-partial-recovery-and-humidity-rebound",
    issue: "Issue 26",
    pillar: "الروتينات العملية",
    category: "maintenance-versus-replacement after rebound",
    title:
      "تحسن جزئي ثم rebound مع الرطوبة: متى نحافظ على maintenance ومتى نؤكد replacement؟",
    deck:
      "في haircare قد يظهر تحسن أولي ثم تراجع مع موجة رطوبة. هذا الدليل يحدد كيف تفصلين بين rebound عابر وحاجة حقيقية للاستبدال.",
    excerpt:
      "تمييز rebound المؤقت عن mismatch المستمر يمنع استبدالًا متسرعًا بعد تحسن جزئي.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "عند تحسن جزئي ثم rebound، ابدئي بضبط maintenance ضمن نافذة رطوبة مماثلة. إذا استمر الخلل بنفس الصورة رغم الضبط المتكرر، يصبح replacement قرارًا مبررًا. أما rebound غير المتكرر فيبقى ضمن نطاق الضبط لا الاستبدال.",
    takeaways: [
      "partial recovery لا يعني نجاحًا نهائيًا ولا فشلًا نهائيًا.",
      "rebound الرطوبة يحتاج اختبار تكرار قبل قرار replacement.",
      "maintenance المدروس يقلل الاستبدال الوقائي غير الضروري.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label: "راجعي مسار haircare عبر اختبار rebound قبل قرار الاستبدال",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "كيف تميزين rebound العابر؟",
        body: "يظهر في سياق رطوبة محدد ثم يختفي مع ضبط بسيط ومتكرر لنفس الروتين.",
      },
      {
        heading: "متى يتحول rebound إلى mismatch؟",
        body: "عندما يتكرر بنفس النمط عبر نوافذ استخدام متعددة رغم التزامك بخطوات maintenance.",
      },
      {
        heading: "ما خطأ القرار الأكثر شيوعًا؟",
        body: "الانتقال السريع إلى replacement بعد أول rebound بدون اختبار تكرار كافٍ.",
      },
    ],
    faq: [
      {
        question: "هل ننتظر طويلًا قبل replacement؟",
        answer:
          "لا، لكن نحتاج نافذة اختبار عادلة تثبت تكرار الخلل قبل الاستبدال.",
      },
      {
        question: "هل الرطوبة وحدها سبب كافٍ للتبديل؟",
        answer:
          "ليست دائمًا. المهم هل الخلل مستمر رغم الضبط في نفس ظروف الرطوبة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "repeat-order-confidence-after-travel-week-usage-drift",
    issue: "Issue 26",
    pillar: "اختيار المنتج والشراء",
    category: "repeat-order confidence after usage drift",
    title:
      "بعد travel week وتذبذب الاستخدام: كيف تحسمين repeat-order بثقة بدون قرار متسرع؟",
    deck:
      "نية إعادة الطلب قد تبقى عالية بعد السفر، لكن نمط الاستخدام يتغير. هذا الدليل يوضح متى نؤكد repeat-order ومتى نضيف دورة متابعة قصيرة.",
    excerpt:
      "عندما يحدث usage drift بعد السفر، جودة قرار repeat-order تعتمد على إعادة قياس الثبات لا على الحماس فقط.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا عاد الاستخدام إلى إيقاعه الطبيعي وظهرت نفس النتيجة، يمكن تأكيد repeat-order. أما إذا استمر التذبذب بعد travel week، فالأفضل دورة متابعة قصيرة قبل الالتزام الكامل.",
    takeaways: [
      "travel week يغير الإيقاع ويحتاج إعادة قياس للثبات.",
      "high-intent وحده لا يكفي مع usage drift مستمر.",
      "دورة متابعة قصيرة قد تمنع إعادة طلب غير مستقرة.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label: "راجعي repeat-order بعد نافذة متابعة قصيرة عند وجود usage drift",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما أول سؤال بعد travel week؟",
        body: "هل عاد نمط الاستخدام لما قبل السفر أم ما زال متذبذبًا بشكل يؤثر على الحكم؟",
      },
      {
        heading: "متى يكون التأكيد آمنًا؟",
        body: "عندما يتكرر الأداء الجيد مع عودة الإيقاع الطبيعي عبر نافذة متابعة واضحة.",
      },
      {
        heading: "متى نؤجل repeat-order؟",
        body: "عند استمرار التذبذب في الاستخدام أو توقيت النفاد بما يجعل الثقة غير مكتملة.",
      },
    ],
    faq: [
      {
        question: "هل التأجيل بعد السفر يعني فقدان الثقة في المنتج؟",
        answer:
          "لا. غالبًا هو تحسين لجودة القرار حتى تتأكد العلاقة بين الاستخدام والنتيجة.",
      },
      {
        question: "ما مدة نافذة المتابعة المناسبة؟",
        answer:
          "نافذة قصيرة تكفي إذا كانت مؤشرات الاستخدام والنتيجة واضحة وقابلة للقياس.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "checkout-side-objection-compression-after-cart-readiness-verification",
    issue: "Issue 25",
    pillar: "اختيار المنتج والشراء",
    category: "checkout-side objection compression",
    title:
      "بعد التحقق من جاهزية السلة: كيف تضغطين اعتراض الدفع الأخير بدون إعادة المقارنة من الصفر؟",
    deck:
      "المشكلة ليست في المنتج نفسه، بل في اعتراض دفع صغير يظهر في آخر خطوة. هذا الدليل يضع قاعدة واضحة لإغلاق الاعتراض بسرعة ثم متابعة الدفع.",
    excerpt:
      "اعتراض دفع واحد يُحلّ بسؤال محدد داخل PDP ثم انتقال مباشر إلى cart بدل الرجوع لمسار تصفح واسع.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الاعتراض متعلقًا بالتنفيذ داخل الدفع وليس بملاءمة المنتج، فاختصري القرار: تأكدي من نقطة الدفع مرة واحدة ثم تابعي مباشرة إلى cart. أما إذا تحول الاعتراض إلى شك في المنتج نفسه، عودي إلى PDP وليس إلى تصفح فئات مفتوح.",
    takeaways: [
      "اعتراض الدفع الأخير لا يحتاج إعادة رحلة اكتشاف كاملة.",
      "PDP يحسم ملاءمة المنتج، وcart يحسم تنفيذ الشراء.",
      "العودة إلى الفئات بعد قرار ناضج تزيد التردد بدل تقليله.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/cart",
      label: "انتقلي إلى السلة بعد حسم اعتراض الدفع الواحد بدون إعادة التصفح",
      destinationType: "commerce",
    },
    sections: [
      {
        heading: "ما الذي يعتبر اعتراض دفع قابل للإغلاق السريع؟",
        body: "الاعتراض الذي لا يغيّر اختيار المنتج، مثل توقيت الشراء أو وضوح خطوة الدفع، ويمكن تأكيده بإجابة واحدة.",
      },
      {
        heading: "متى تتوقفين عن المسار المباشر إلى cart؟",
        body: "عندما يتحول الاعتراض إلى شك في سبب اختيار المنتج نفسه أو تظهر اعتراضات جديدة غير مرتبطة بخطوة الدفع.",
      },
      {
        heading: "كيف تمنعين تكرار fallback loop؟",
        body: "ثبتي قاعدة: سؤال واحد داخل PDP ثم تنفيذ داخل cart. أي توسع جديد في الأسئلة يعني إعادة تقييم موجهة وليست تصفحًا عشوائيًا.",
      },
    ],
    faq: [
      {
        question: "هل الذهاب المباشر إلى cart دائمًا أفضل؟",
        answer:
          "لا. هو أفضل فقط عندما يكون اختيار المنتج محسومًا ويبقى اعتراض دفع واحد واضح.",
      },
      {
        question: "ما المؤشر أنني رجعت للفئات بدون داعٍ؟",
        answer:
          "إذا عدتِ للمقارنة الواسعة رغم أن اعتراضك الوحيد كان متعلقًا بخطوة الدفع وليس بملاءمة المنتج.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "pdp-to-cart-handoff-prompt-without-category-fallback-loop",
    issue: "Issue 25",
    pillar: "أدلة السياق اليومي",
    category: "pdp-to-cart handoff prompts",
    title:
      "PDP إلى cart بدون fallback loop: ما prompt التسليم الذي يمنع الرجوع لتصفح الفئات؟",
    deck:
      "عند اقتراب القرار من الشراء، أهم خطوة هي تسليم واضح من PDP إلى cart. هذا المقال يقدّم prompt قصير يمنع الرجوع لدائرة التردد.",
    excerpt:
      "handoff prompt واضح يقلل العودة غير الضرورية إلى صفحات الفئات بعد اقتراب قرار الشراء.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "استخدمي handoff prompt يربط سبب الاختيار بنقطة التنفيذ: إذا بقي السبب ثابتًا داخل PDP، فالخطوة التالية هي cart. إن تغيّر السبب أو ظهر اعتراض جديد، أوقفي النقل المباشر وراجعي المسار داخل PDP فقط.",
    takeaways: [
      "handoff الجيد يربط القرار بالفعل وليس بالمقارنة.",
      "الرجوع للفئات يجب أن يكون استثناءً مشروطًا باعتراض جديد.",
      "Prompt واحد واضح يقلل دوران القرار قبل الدفع.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label: "راجعي handoff prompt داخل PDP ثم انتقلي إلى السلة عند ثبات السبب",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما شكل handoff prompt الفعلي؟",
        body: "اسألي: هل سبب اختيار المنتج ما زال نفسه بعد مراجعة نقطة الاعتراض الأخيرة؟ إذا نعم، انتقلي إلى cart فورًا.",
      },
      {
        heading: "كيف تعرفين أن fallback loop بدأ؟",
        body: "عندما تنتقلين من PDP إلى صفحات فئات متعددة بدون اعتراض جديد محدد يمكن اختباره.",
      },
      {
        heading: "ما البديل الآمن عن loop؟",
        body: "العودة إلى PDP نفسه مع سؤال واحد قابل للحسم، بدل فتح رحلة مقارنة جديدة بين خيارات كثيرة.",
      },
    ],
    faq: [
      {
        question: "هل handoff prompt يضغط القرار بشكل مبالغ؟",
        answer:
          "لا إذا استُخدم بعد نضج القرار. هو ينظم خطوة التنفيذ، ولا يلغي حق الرجوع عند ظهور اعتراض جديد فعلي.",
      },
      {
        question: "متى أعود للفئات فعلًا؟",
        answer:
          "فقط إذا ظهرت فجوة ملاءمة حقيقية لا يمكن حسمها داخل PDP الحالي.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "haircare-maintenance-versus-replacement-after-replacement-trial-entry",
    issue: "Issue 25",
    pillar: "الروتينات العملية",
    category: "maintenance-versus-replacement checks",
    title:
      "بعد دخول replacement trial في haircare: متى تثبتين maintenance ومتى تؤكدين الاستبدال؟",
    deck:
      "الدخول في replacement trial لا يعني أن الاستبدال أصبح قرارًا نهائيًا. هذا الدليل يضع فاصلًا واضحًا بين صيانة المسار الحالي وتأكيد الاستبدال.",
    excerpt:
      "قرارات haircare الأدق تأتي من تكرار النمط عبر نافذة استخدام، لا من انطباع يوم واحد بعد trial entry.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "بعد trial entry، ثبتي maintenance إذا تحسنت المؤشرات الأساسية بشكل متكرر عبر نافذة استخدام واضحة. أكدي replacement فقط إذا استمر نفس الخلل بعد التزام ثابت وخطوات تنفيذ صحيحة.",
    takeaways: [
      "trial entry مرحلة اختبار وليست حكمًا نهائيًا.",
      "maintenance يظل الخيار الأقوى عند تحسن متكرر قابل للقياس.",
      "replacement يحتاج نمط خلل ثابتًا لا مجرد انطباع عابر.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label: "راجعي مسار haircare وفق قاعدة maintenance أولًا ثم تأكيد replacement عند تكرار الخلل",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما الذي يثبت نجاح maintenance بعد trial entry؟",
        body: "تكرار تحسن المظهر والثبات خلال أكثر من نافذة استخدام متقاربة مع نفس الروتين.",
      },
      {
        heading: "ما الذي يثبت الحاجة إلى replacement؟",
        body: "عودة نفس المشكلة بوتيرة واضحة رغم الالتزام بالخطوات الأساسية وغياب أخطاء التطبيق.",
      },
      {
        heading: "كيف تتجنبين قرارًا متسرعًا؟",
        body: "افصلي بين ضوضاء اليوم الواحد وبين نمط الأسبوع الكامل، ولا تغيّري المنتج قبل ظهور إشارة ثابتة.",
      },
    ],
    faq: [
      {
        question: "هل نجاح يومين يعني أن replacement لم يعد مطلوبًا؟",
        answer:
          "ليس دائمًا. القرار الأدق يعتمد على نمط مستمر عبر نافذة استخدام كافية.",
      },
      {
        question: "هل أحتاج الرجوع لنقطة البداية بعد trial؟",
        answer:
          "لا. ابدئي من تقييم maintenance الحالي، ثم ارفعي القرار إلى replacement فقط عند وجود دليل متكرر.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "repeat-order-confidence-prompt-with-high-intent-and-partial-usage-consistency",
    issue: "Issue 25",
    pillar: "اختيار المنتج والشراء",
    category: "repeat-order confidence prompts",
    title:
      "High-intent مع usage consistency جزئي: ما prompt الثقة قبل repeat-order؟",
    deck:
      "الرغبة العالية في إعادة الطلب لا تكفي وحدها. هذا المقال يقدّم prompt عمليًا يوازن بين نية الشراء وثبات الاستخدام الفعلي.",
    excerpt:
      "repeat-order الأفضل يعتمد على ثبات نمط الاستخدام، لا على الحماس اللحظي بعد تجربة واحدة قوية.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "قبل repeat-order، اسألي: هل يتكرر الاستخدام بنفس الإيقاع الذي بني عليه التحسن؟ إذا كان الثبات جزئيًا، فالقرار الآمن هو دورة متابعة قصيرة قبل إعادة الطلب الكامل.",
    takeaways: [
      "High-intent مهم، لكنه لا يعوض غياب الاستخدام المنتظم.",
      "Prompt الثقة يقلل إعادة الطلب غير المستقرة.",
      "دورة متابعة قصيرة قد تمنع تذبذب قرار الشراء التالي.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label: "راجعي repeat-order prompt داخل PDP قبل تأكيد إعادة الطلب الكامل",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما السؤال المركزي قبل repeat-order؟",
        body: "هل ثبات النتيجة ناتج عن نمط استخدام متكرر، أم عن فترة قصيرة استثنائية؟",
      },
      {
        heading: "متى يكفي high-intent للتأكيد؟",
        body: "عندما يتوافق مع نمط استخدام ثابت ونتيجة متكررة عبر أكثر من دورة قصيرة.",
      },
      {
        heading: "متى نؤجل القرار؟",
        body: "عند وجود تذبذب واضح في الاستخدام أو في توقيت النفاد بما يجعل الثقة غير مستقرة بعد.",
      },
    ],
    faq: [
      {
        question: "هل تأجيل repeat-order يعني تراجع المنتج؟",
        answer:
          "لا. غالبًا هو خطوة جودة قرار للتأكد من أن إعادة الطلب مبنية على نمط ثابت قابل للاستمرار.",
      },
      {
        question: "ما مدة المتابعة المناسبة قبل القرار؟",
        answer:
          "نافذة قصيرة إضافية تكفي غالبًا إذا كانت مؤشرات الاستخدام والنتيجة قابلة للقياس بوضوح.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "post-article-objection-closure-before-direct-cart-continuation",
    issue: "Issue 24",
    pillar: "اختيار المنتج والشراء",
    category: "post-article objection closure",
    title:
      "بعد المقال مباشرة: كيف تغلقين الاعتراض الأخير قبل الانتقال المباشر إلى cart؟",
    deck:
      "بعض القرارات تتوقف عند آخر اعتراض صغير رغم أن الاختيار شبه محسوم. هذا الدليل يضع طريقة سريعة لإغلاق الاعتراض قبل الانتقال من Journal إلى cart عبر PDP.",
    excerpt:
      "إغلاق اعتراض واحد بوضوح أفضل من إعادة رحلة المقارنة كاملة قبل الدفع.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الاعتراض محددًا في نقطة واحدة، انتقلي إلى PDP للتحقق منها فقط ثم تابعي إلى cart. أما إذا تحول الاعتراض إلى أكثر من سؤال، أوقفي الانتقال المباشر وارجعي إلى صفحة الفئة لتضييق القرار أولًا.",
    takeaways: [
      "المقال يجهز القرار، وPDP يحسم الاعتراض الأخير فقط.",
      "الانتقال المباشر إلى cart مناسب عندما يبقى سؤال واحد محدد.",
      "اتساع الاعتراض يعني أن القرار يحتاج تضييقًا جديدًا قبل الدفع.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "ادخلي PDP لإغلاق الاعتراض الأخير ثم انتقلي مباشرة إلى السلة إذا بقي القرار ضيقًا",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما المقصود بإغلاق الاعتراض بدل إعادة المقارنة؟",
        body: "هو التحقق من نقطة واحدة متبقية دون فتح أسئلة جديدة عن الفئة أو المنتجات البديلة.",
      },
      {
        heading: "متى يكون الانتقال المباشر إلى cart صحيحًا؟",
        body: "عندما يكون نوع المنتج محسومًا وسبب الاختيار واضحًا ويتبقى فقط سؤال تأكيدي أخير.",
      },
      {
        heading: "متى يجب إيقاف المسار المباشر؟",
        body: "عند ظهور اعتراضات جديدة أو غياب وضوح السبب الرئيسي للاختيار داخل PDP.",
      },
    ],
    faq: [
      {
        question: "هل هذا المسار يسرّع التحويل دائمًا؟",
        answer:
          "يسرّعه عندما يكون القرار ناضجًا بالفعل، لكنه غير مناسب للقرار الواسع أو المتردد.",
      },
      {
        question: "ما الخطأ الشائع هنا؟",
        answer:
          "الذهاب إلى cart مع اعتراضات متعددة ثم الرجوع للتصفح من جديد بعد وقت قصير.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "pdp-proof-snippet-or-full-comparison-when-one-hesitation-remains",
    issue: "Issue 24",
    pillar: "أدلة السياق اليومي",
    category: "pdp proof compression",
    title:
      "في PDP: proof snippet سريع أم full comparison عند بقاء تردد واحد؟",
    deck:
      "ليس كل تردد يحتاج مقارنة كاملة. هذا المقال يحدد متى يكفي proof snippet صغير داخل PDP ومتى تحتاجين full comparison قبل الشراء.",
    excerpt:
      "ضغط قرار PDP يبدأ باختيار حجم التحقق المناسب: snippet موجز أو مقارنة كاملة.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "استخدمي proof snippet عندما يكون الاعتراض محددًا ولا يمس أساس الاختيار. أما إذا كان التردد متعلقًا بملاءمة المنتج من الأصل، فـ full comparison يصبح ضروريًا قبل متابعة الشراء.",
    takeaways: [
      "snippet يحل الاعتراض الضيق بسرعة.",
      "full comparison مطلوب عند شك في أساس الملاءمة.",
      "اختيار حجم التحقق الصحيح يمنع دوران القرار داخل PDP.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "اختاري داخل PDP بين proof snippet أو full comparison قبل قرار الإضافة للسلة",
      destinationType: "product",
    },
    sections: [
      {
        heading: "متى يكفي proof snippet؟",
        body: "عندما يكون الاعتراض متعلقًا بنقطة تنفيذية واحدة مثل توقيت اللمسة الأخيرة أو طريقة الاستخدام.",
      },
      {
        heading: "متى تحتاجين full comparison؟",
        body: "إذا كان الشك يمس ملاءمة المنتج نفسها أو يفتح بدائل متعددة داخل الفئة.",
      },
      {
        heading: "كيف تحافظين على سرعة القرار؟",
        body: "حددي نوع التحقق قبل البدء داخل PDP بدل الانتقال العشوائي بين نقاط مقارنة كثيرة.",
      },
    ],
    faq: [
      {
        question: "هل full comparison دائمًا أفضل لأنه أدق؟",
        answer:
          "ليس دائمًا. الدقة الحقيقية هي اختيار مستوى تحقق يناسب حجم الاعتراض الفعلي.",
      },
      {
        question: "ما علامة أن snippet لم يعد كافيًا؟",
        answer:
          "عندما يتحول السؤال من نقطة صغيرة إلى شك شامل في مناسبة المنتج.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "haircare-maintenance-threshold-after-simplification-success-before-replacement",
    issue: "Issue 24",
    pillar: "الروتينات العملية",
    category: "maintenance threshold after simplification",
    title:
      "بعد نجاح simplification: متى نثبت maintenance ومتى نعيد فتح قرار replacement؟",
    deck:
      "نجاح التبسيط لا يعني إنهاء المراجعة دائمًا. هذا الدليل يحدد عتبة maintenance العملية قبل التفكير في replacement جديد داخل مسار haircare.",
    excerpt:
      "عتبة maintenance الواضحة تمنع إعادة فتح قرار replacement بدون سبب حقيقي.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا استمر التحسن مع التبسيط عبر نافذة استخدام مستقرة، ثبتي maintenance ولا تعيدي فتح replacement. أما إذا عاد نفس الاعتراض بنمط ثابت بعد فترة استقرار، فراجعي قرار replacement على أساس بيانات الاستخدام لا الانطباع اللحظي.",
    takeaways: [
      "maintenance قرار نشط وليس تجاهلًا للمشكلة.",
      "إعادة فتح replacement يجب أن تكون مبنية على نمط متكرر.",
      "الاستقرار الممتد أفضل دليل قبل أي تبديل جديد.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label:
        "تابعي مسار haircare على عتبة maintenance أولًا ثم أعيدي تقييم replacement عند تكرار واضح",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما علامة نجاح maintenance بعد simplification؟",
        body: "استمرار الالتزام وتحسن النتائج بدون عودة نمط الاعتراض القديم خلال فترة كافية.",
      },
      {
        heading: "متى نعيد فتح replacement؟",
        body: "عند عودة نفس المشكلة بصورة متكررة رغم ثبات تنفيذ الصيغة المبسطة.",
      },
      {
        heading: "كيف نتجنب التبديل الوقائي؟",
        body: "لا تفتح قرار replacement بسبب يوم سيئ واحد؛ راقبي النمط عبر أكثر من نافذة استخدام.",
      },
    ],
    faq: [
      {
        question: "هل maintenance يعني عدم التحسين مستقبلًا؟",
        answer:
          "لا. يعني تثبيت المسار الناجح حتى يظهر سبب حقيقي وموثّق لإعادة التقييم.",
      },
      {
        question: "كم نافذة استخدام نحتاج قبل إعادة التقييم؟",
        answer:
          "نافذة واحدة لا تكفي غالبًا؛ الأفضل الاعتماد على تكرار النمط في أكثر من سياق قريب.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "reorder-confirmation-prompt-after-first-high-intent-objection-resolution",
    issue: "Issue 24",
    pillar: "اختيار المنتج والشراء",
    category: "reorder confirmation prompts",
    title:
      "بعد حل أول اعتراض high-intent: ما prompt تأكيد reorder قبل الالتزام؟",
    deck:
      "حل الاعتراض الأول لا يعني تلقائيًا أن قرار reorder أصبح محسوماً. هذا المقال يضع prompt تأكيد قصير يساعد على قرار إعادة الطلب بثقة أعلى.",
    excerpt:
      "Prompt التأكيد يمنع reorder المتسرع بعد حل اعتراض واحد فقط.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "بعد حل الاعتراض الأول، استخدمي prompt تأكيد يعتمد على ثبات الإشارة عبر استخدام متكرر: إذا تكرر التحسن بنفس الظروف، فـ reorder مبرر. إذا بقي التحسن متذبذبًا، فالأفضل دورة مراقبة إضافية قبل الالتزام.",
    takeaways: [
      "حل اعتراض واحد خطوة مهمة لكنه ليس حكمًا نهائيًا وحده.",
      "Prompt تأكيد reorder يجب أن يقيس التكرار لا اللحظة.",
      "المراقبة القصيرة الإضافية تقلل قرارات إعادة الطلب غير المستقرة.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label:
        "راجعي PDP عبر prompt تأكيد reorder: ثبات متكرر أم حاجة لدورة مراقبة إضافية",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما شكل prompt التأكيد العملي؟",
        body: "اسألي: هل تكرر نفس التحسن في أكثر من مرة وبنفس الظروف؟ إذا نعم، القرار أقرب للثبات.",
      },
      {
        heading: "متى نؤجل reorder رغم حل الاعتراض؟",
        body: "عندما يكون التحسن مرتبطًا بظرف مؤقت أو لا يتكرر بشكل واضح في استخدام لاحق.",
      },
      {
        heading: "كيف يؤثر ذلك على قرار الشراء التالي؟",
        body: "يمنحك قرارًا مبنيًا على نمط أداء قابل للتكرار بدل رد فعل سريع بعد تجربة واحدة ناجحة.",
      },
    ],
    faq: [
      {
        question: "هل هذا prompt يبطئ الشراء؟",
        answer:
          "قد يضيف خطوة قصيرة، لكنه يرفع جودة القرار ويقلل احتمالات الندم أو التراجع.",
      },
      {
        question: "ما أكثر خطأ بعد حل الاعتراض الأول؟",
        answer:
          "اعتبار الاعتراض المحلول دليلًا كافيًا وحده على استقرار كامل يستحق reorder مباشر.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "keep-versus-introduce-when-routine-stability-is-high-but-one-micro-gap-remains",
    issue: "Issue 23",
    pillar: "اختيار المنتج والشراء",
    category: "keep-versus-introduce rules",
    title:
      "الروتين مستقر لكن فيه micro-gap واحد: تحافظين على المسار أم تدخلين خطوة جديدة؟",
    deck:
      "عندما يكون الروتين يعمل بشكل جيد، أصعب قرار هو التعامل مع فجوة صغيرة بدون كسر الاستقرار. هذا الدليل يحسم متى keep أفضل من introduce خطوة إضافية.",
    excerpt:
      "ليس كل micro-gap يحتاج منتجًا جديدًا. القرار الأدق يبدأ من تأثير الفجوة على الهدف التجاري والنتيجة اليومية.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت الفجوة لا تؤثر على النتيجة الأساسية ولا تزيد تردد الشراء، فـ keep هو الخيار الأقوى. أما إذا كانت الفجوة تتكرر وتؤخر القرار قرب PDP أو reorder، فـ introduce خطوة واحدة محددة يصبح مبررًا.",
    takeaways: [
      "الاستقرار أصل القرار، والإضافة تأتي فقط عند فجوة مؤكدة.",
      "introduce يجب أن يكون خطوة واحدة قابلة للقياس، لا توسيعًا عشوائيًا.",
      "الهدف هو تقليل التردد قبل الشراء لا زيادة تعقيد الروتين.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/shop/skincare",
      label:
        "راجعي مسار skincare بعد حسم micro-gap: keep كامل أو introduce خطوة واحدة فقط",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "كيف تعرفين أن الفجوة micro وليست structural؟",
        body: "عندما تبقى النتيجة الأساسية مستقرة ويكون النقص محدودًا في سيناريو واحد فقط، لا في كامل الروتين.",
      },
      {
        heading: "متى يكون keep هو القرار الأقوى؟",
        body: "إذا كان الأداء جيدًا عبر أكثر من دورة وكان الاعتراض المتبقي لا يوقف الشراء أو الاستمرار.",
      },
      {
        heading: "متى introduce يصبح مبررًا؟",
        body: "عندما تتكرر الفجوة نفسها وتؤثر مباشرة على راحة الاستخدام أو قرار الإكمال قبل الشراء.",
      },
    ],
    faq: [
      {
        question: "هل إدخال خطوة جديدة دائمًا يحسن النتيجة؟",
        answer:
          "لا. أحيانًا يرفع التعقيد دون فائدة، خاصة إذا كانت الفجوة صغيرة وغير مؤثرة على القرار.",
      },
      {
        question: "ما أسرع اختبار قبل introduce؟",
        answer:
          "ثبتي الروتين الحالي أولًا، ثم اختبري خطوة واحدة فقط لمدة قصيرة مع معيار واضح للنجاح.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "touch-up-path-or-full-base-restart-longwear-reassurance-before-checkout",
    issue: "Issue 23",
    pillar: "أدلة السياق اليومي",
    category: "longwear reassurance paths",
    title:
      "قبل checkout: مسار touch-up يكفي أم لازم full base restart لضمان longwear؟",
    deck:
      "جزء كبير من تردد الشراء في makeup يأتي من الخلط بين إعادة ضبط كاملة وبين touch-up ذكي. هذا المقال يحدد مسار التطمين الصحيح قبل قرار الدفع.",
    excerpt:
      "اختيار مسار الطمأنة الصحيح يقلل التردد قبل checkout ويمنع العودة لدائرة مقارنة طويلة.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ابدئي بمسار touch-up إذا كانت القاعدة الأساسية ما زالت متماسكة ويظهر الاعتراض في جزء محدود من اليوم. أما إذا كان الانهيار واسعًا ومبكرًا، فـ full base restart مع مراجعة ترتيب التطبيق يصبح الخيار الأدق قبل الشراء.",
    takeaways: [
      "touch-up مناسب عندما يبقى الأساس ثابتًا ويحتاج تصحيحًا موضعيًا.",
      "full restart قرار تشخيصي عندما يفشل الثبات بشكل مبكر ومتكرر.",
      "مسار التطمين الصحيح يسرّع الانتقال من المقال إلى PDP ثم checkout.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "ادخلي PDP بعد تحديد المسار: touch-up route أو full base restart قبل checkout",
      destinationType: "product",
    },
    sections: [
      {
        heading: "متى يكون touch-up كافيًا؟",
        body: "عندما يبقى الأساس العام متماسكًا ويظهر التراجع في مناطق محددة يمكن تصحيحها دون إعادة بناء كاملة.",
      },
      {
        heading: "متى تحتاجين full base restart؟",
        body: "عند تراجع شامل ومبكر في الثبات مع تكرار نفس المشكلة رغم نفس الظروف اليومية.",
      },
      {
        heading: "كيف يؤثر هذا على قرار checkout؟",
        body: "حسم مسار الطمأنة أولًا يقلل الاعتراض النهائي ويمنع إعادة فتح مقارنة فئات غير ضرورية.",
      },
    ],
    faq: [
      {
        question: "هل full restart يعني أن المنتج غير مناسب دائمًا؟",
        answer:
          "ليس دائمًا. أحيانًا يكون السبب ترتيب التطبيق أو التحضير وليس المنتج نفسه.",
      },
      {
        question: "ما الخطر من اختيار المسار الخطأ؟",
        answer:
          "زيادة التردد والعودة للتصفح الواسع بدل الانتقال المنطقي إلى قرار شراء محسوم.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "stable-week-post-friction-simplification-or-haircare-replacement-decision",
    issue: "Issue 23",
    pillar: "الروتينات العملية",
    category: "post-friction simplification vs replacement",
    title:
      "بعد أسبوع مستقر: هل friction في haircare يحتاج simplification أم replacement؟",
    deck:
      "بعد استقرار أسبوع كامل، يبقى سؤال واحد: هل المشكلة من تعقيد التنفيذ أم من عدم توافق المنتج؟ هذا المقال يقدم قرارًا عمليًا بين simplification وreplacement.",
    excerpt:
      "الاستقرار القصير يكشف السبب الحقيقي: friction تشغيلي أم mismatch في المنتج.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا تحسن الالتزام والنتيجة مع تبسيط الخطوات، فالمشكلة كانت تشغيلية ويكفي simplification. أما إذا استمر نفس النمط السلبي رغم تبسيط واضح وأسبوع مستقر، فقرار replacement يصبح أكثر منطقية.",
    takeaways: [
      "أسبوع مستقر هو أفضل نافذة لفصل التشغيل عن التوافق.",
      "simplification يُختبر أولًا لأنه أقل كلفة وأعلى قابلية للصيانة.",
      "replacement قرار صحيح فقط بعد استبعاد سبب التعقيد التشغيلي.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label:
        "انتقلي إلى haircare collection بعد حسم مسار الأسبوع المستقر: simplification أو replacement",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما مؤشر أن simplification نجح؟",
        body: "ارتفاع الالتزام اليومي مع تحسن واضح في الراحة والثبات بعد تقليل التعقيد في نفس الظروف.",
      },
      {
        heading: "متى نعتبر replacement مبررًا؟",
        body: "عندما يستمر نفس الاعتراض بنفس القوة رغم تنفيذ مبسط وثابت عبر أسبوع كامل.",
      },
      {
        heading: "كيف تمنعين التبديل المبكر؟",
        body: "لا تقارني منتجات جديدة قبل إنهاء اختبار التبسيط في نفس الجدول اليومي.",
      },
    ],
    faq: [
      {
        question: "هل أسبوع واحد كافٍ دائمًا للحكم؟",
        answer:
          "يكفي كإشارة قوية إذا كان التنفيذ ثابتًا والظروف متقاربة، وقد تحتاجين مدة أطول عند تغير السياق.",
      },
      {
        question: "ما أول خطوة قبل replacement؟",
        answer:
          "تبسيط الروتين لنسخة قابلة للالتزام ثم قياس النتيجة بنفس المعايير.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "high-intent-journal-to-pdp-to-cart-progression-with-one-unresolved-objection",
    issue: "Issue 23",
    pillar: "اختيار المنتج والشراء",
    category: "journal-to-pdp-to-cart progression",
    title:
      "High-intent progression: كيف تنتقلين من Journal إلى PDP ثم cart مع اعتراض واحد متبقٍ؟",
    deck:
      "عندما يكون القرار شبه محسوم، المشكلة ليست في الاختيار بل في الخطوة الأخيرة. هذا المقال يحدد progression واضحًا من Journal إلى PDP ثم cart بدون الرجوع لتصفح واسع.",
    excerpt:
      "اعتراض واحد غير محسوم يحتاج مسارًا قصيرًا ودقيقًا، لا إعادة رحلة الشراء من الصفر.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا بقي اعتراض واحد محدد، انتقلي إلى PDP للتحقق النهائي منه فقط، ثم اذهبي مباشرة إلى cart. أما إذا توسع الاعتراض أثناء التحقق، أوقفي progression وارجعي لسطح الفئة بدل إكمال شراء غير ناضج.",
    takeaways: [
      "الانتقال السريع آمن فقط عندما يبقى اعتراض واحد محدد.",
      "PDP هنا محطة تحقق نهائية وليست مساحة مقارنة مفتوحة.",
      "ربط Journal بـ cart يقلل browsing drift ويزيد وضوح القرار.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "نفّذي progression: PDP للتحقق من الاعتراض الأخير ثم إضافة مباشرة إلى السلة",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما تعريف high-intent في هذه المرحلة؟",
        body: "أن يكون نوع المنتج محسومًا وسبب الاختيار واضحًا، مع بقاء سؤال تأكيدي واحد فقط قبل الإجراء.",
      },
      {
        heading: "كيف تديرين الاعتراض الأخير داخل PDP؟",
        body: "ركزي على نقطة الاعتراض فقط بدل إعادة تقييم كل المواصفات، ثم احسمي القرار خلال نفس الزيارة.",
      },
      {
        heading: "متى توقفين progression؟",
        body: "عند ظهور اعتراضات إضافية أو اتساع التردد خارج السؤال الأصلي، لأن القرار يحتاج تضييقًا جديدًا.",
      },
    ],
    faq: [
      {
        question: "هل هذا المسار مناسب لكل الزوار؟",
        answer:
          "لا. مناسب فقط للزوار high-intent الذين قطعوا معظم قرار الاختيار بالفعل.",
      },
      {
        question: "ما البديل إذا لم يُحسم الاعتراض داخل PDP؟",
        answer:
          "العودة إلى صفحة الفئة أو concern ذات الصلة لتضييق القرار بدل المتابعة إلى cart.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "two-stable-cycles-or-just-one-when-reorder-confidence-is-really-earned",
    issue: "Issue 22",
    pillar: "اختيار المنتج والشراء",
    category: "reorder-confidence thresholds",
    title:
      "دورتان ثابتتان أم دورة واحدة فقط؟ متى تكون ثقة reorder مستحقة فعلًا",
    deck:
      "قرار إعادة الطلب قد يبدو واضحًا بعد دورة جيدة، لكن بعض النتائج تحتاج عتبة أعلى قبل الالتزام. هذا المقال يحدد متى تكفي دورة واحدة ومتى يلزم تأكيد عبر دورتين ثابتتين.",
    excerpt:
      "ثقة reorder لا تُبنى على انطباع سريع. العتبة الصحيحة تمنع إعادة طلب غير مستقرة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الأداء ثابتًا في نفس الظروف مع مؤشرات واضحة على الراحة والاستمرارية، قد تكفي دورة واحدة. أما إذا كانت النتيجة حساسة لتقلبات بسيطة، فالأدق انتظار دورة ثانية مستقرة قبل تثبيت قرار reorder.",
    takeaways: [
      "عتبة القرار تختلف حسب ثبات الإشارة لا حسب الحماس بعد دورة جيدة.",
      "الدورة الثانية مهمة عندما تكون الإشارات قريبة من حد التردد.",
      "reorder القوي يبدأ من تكرار النمط، لا من لحظة نجاح منفردة.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label:
        "راجعي PDP بعد حسم عتبة القرار: دورة واحدة ثابتة أم دورتان قبل reorder",
      destinationType: "product",
    },
    sections: [
      {
        heading: "متى تكفي دورة واحدة؟",
        body: "عندما تكون مؤشرات الأداء الأساسية قوية ومتسقة، ويظل الروتين قابلًا للاستمرار دون تدخلات تصحيحية متكررة.",
      },
      {
        heading: "متى تحتاجين دورة ثانية؟",
        body: "إذا كان التحسن موجودًا لكنه متذبذب قرب حد القبول، أو مرتبطًا بشكل كبير بظرف مؤقت في التنفيذ أو البيئة.",
      },
      {
        heading: "كيف تمنعين over-upgrade غير الضروري؟",
        body: "ثبتي عتبة reorder أولًا ثم قرري الترقية فقط عند وجود فجوة مؤكدة، لا كاستجابة استباقية للقلق.",
      },
    ],
    faq: [
      {
        question: "هل الانتظار لدورة ثانية يعني بطء القرار؟",
        answer:
          "ليس بطئًا، بل ضمان أعلى عندما تكون الإشارة غير كافية بعد الدورة الأولى.",
      },
      {
        question: "ما أكثر خطأ شائع في هذه المرحلة؟",
        answer:
          "تحويل نجاح جزئي إلى قرار دائم بسرعة، ثم اكتشاف أن الثبات لم يكن قويًا بما يكفي.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "finish-mismatch-or-durability-limit-how-to-triage-longwear-failure-before-switch",
    issue: "Issue 22",
    pillar: "أدلة السياق اليومي",
    category: "longwear failure triage",
    title:
      "قبل switch في makeup: هل فشل longwear من finish mismatch أم من durability limit؟",
    deck:
      "ليس كل فشل في الثبات يعني أن التركيبة لا تدوم. أحيانًا المشكلة في finish غير مناسب للسيناريو. هذا الدليل يفرّق بين mismatch بصري وحدود دوام حقيقية قبل قرار التبديل.",
    excerpt:
      "ترياج longwear الصحيح يمنع تبديلًا مبكرًا عندما تكون المشكلة finish-fit لا durability نفسها.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان المظهر ينهار بصريًا رغم بقاء الطبقة الأساسية، فالمشكلة غالبًا finish mismatch. أما إذا كانت الطبقة نفسها لا تصمد زمنيًا في نفس الظروف، فهذا يشير إلى durability limit ويبرر المقارنة على مستوى الثبات الحقيقي.",
    takeaways: [
      "finish mismatch يختلف عن limit فعلي في الدوام.",
      "تشخيص نوع الفشل يحدد إن كنت تحتاجين ضبطًا أم switch.",
      "PDP decision يصبح أدق عندما يبدأ من نوع الاعتراض الحقيقي.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "ادخلي PDP بعد حسم ما إذا كان الاعتراض finish-fit أو durability-limit",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما علامة finish mismatch؟",
        body: "تبدو النتيجة غير مريحة بصريًا رغم أن الثبات الهيكلي ما زال مقبولًا في ساعات اليوم.",
      },
      {
        heading: "ما علامة durability limit؟",
        body: "تراجع فعلي في بقاء الطبقة الأساسية عبر الزمن حتى مع تطبيق منضبط وظروف متكررة.",
      },
      {
        heading: "كيف يؤثر الترياج على قرار الشراء؟",
        body: "يمنع خلط اعتراضين مختلفين داخل المقارنة نفسها، وبالتالي يقلل دوران القرار قبل checkout.",
      },
    ],
    faq: [
      {
        question: "هل يمكن أن يجتمعا معًا؟",
        answer:
          "نعم، لكن ابدئي بالاعتراض الأكثر تأثيرًا على قرارك الآن ثم أعيدي تقييم الآخر بعده.",
      },
      {
        question: "متى أحتاج تغيير المنتج فعليًا؟",
        answer:
          "عندما يثبت حد الدوام نفسه كسبب رئيسي بعد استبعاد مشكلات finish والتطبيق.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "weather-stable-but-friction-high-keep-adjusting-routine-or-change-haircare-product",
    issue: "Issue 22",
    pillar: "الروتينات العملية",
    category: "post-weather friction checks",
    title:
      "الطقس استقر لكن الاحتكاك في التنفيذ ما زال عاليًا: تكملة تعديل الروتين أم تغيير منتج haircare؟",
    deck:
      "بعد استقرار الطقس قد تنتهي حجة العوامل الخارجية، لكن يبقى احتكاك التنفيذ اليومي. هذا المقال يحسم هل المشكلة ما زالت روتينية أم تحولت إلى عدم توافق منتج.",
    excerpt:
      "استقرار الجو لا يعني تلقائيًا أن وقت التبديل وصل. فحص friction التشغيلي يحسم القرار.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الاحتكاك ناتجًا عن تعقيد خطوات أو توقيت غير مناسب، فاستمري في تبسيط الروتين. أما إذا ظل الأداء ضعيفًا رغم تبسيط التنفيذ واستقرار الظروف، فهنا يصبح تغيير المنتج احتمالا أقوى.",
    takeaways: [
      "friction العالي قد يكون مشكلة تصميم روتين لا مشكلة منتج.",
      "تبسيط التنفيذ خطوة إلزامية قبل switch.",
      "تأكيد mismatch يأتي بعد استقرار الجو والتنفيذ معًا.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label:
        "انتقلي إلى haircare collection بعد فحص friction: تبسيط الروتين أولًا ثم تقييم mismatch",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما المقصود بـ friction تشغيلي؟",
        body: "أن تكون الخطوات أو توقيتها مرهقًا بشكل يجعل الالتزام صعبًا حتى مع توفر المنتج المناسب.",
      },
      {
        heading: "متى يكون تعديل الروتين كافيًا؟",
        body: "عندما يتحسن الالتزام والنتيجة بمجرد تبسيط الخطوات أو إعادة ترتيبها بعد استقرار الطقس.",
      },
      {
        heading: "متى يميل القرار إلى تغيير المنتج؟",
        body: "عند ثبات الاحتكاك والنتيجة الضعيفة رغم تبسيط التنفيذ وتكرار نفس السيناريو.",
      },
    ],
    faq: [
      {
        question: "هل تقليل الخطوات يضعف النتيجة دائمًا؟",
        answer:
          "ليس دائمًا. أحيانًا تقليل التعقيد يرفع الاستمرارية وبالتالي يحسن النتيجة الفعلية.",
      },
      {
        question: "ما أسرع اختبار قبل switch؟",
        answer:
          "ثبتي نسخة مبسطة من الروتين لعدة أيام بعد استقرار الجو ثم راقبي إذا بقيت نفس الإشارة السلبية.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "journal-to-checkout-bridge-when-you-are-product-leaning-but-still-hesitating",
    issue: "Issue 22",
    pillar: "اختيار المنتج والشراء",
    category: "journal-to-checkout bridge",
    title:
      "Bridge من Journal إلى checkout: ماذا تفعلين عندما تميلين للمنتج لكن التردد ما زال موجودًا؟",
    deck:
      "بعض المستخدمين ينهون المقال وهم product-leaning لكن يتوقفون قبل الدفع. هذا الدليل يحدد جسرًا قصيرًا من القرار إلى الإجراء دون الرجوع لتصفح واسع.",
    excerpt:
      "الهدف ليس دفعًا سريعًا بلا وعي، بل تقليل خطوة التردد الأخيرة عندما يكون القرار قد نضج فعلاً.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان المنتج مرجحًا بوضوح والاعتراض المتبقي واحدًا فقط، انتقلي إلى PDP مباشرة مع تحقق سريع من النقطة المتبقية ثم قرري. أما إذا كان الاعتراض ما زال متعددًا، فالعودة إلى الفئة أفضل من القفز غير المحسوب.",
    takeaways: [
      "checkout bridge يبدأ من قرار ناضج لا من استعجال.",
      "اعتراض واحد متبقٍ يناسب PDP direct مع تحقق سريع.",
      "اعتراضات متعددة تعني أن العودة للفئة ما زالت أدق.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "انتقلي إلى PDP مع تحقق أخير من الاعتراض المتبقي قبل قرار الإضافة للسلة",
      destinationType: "product",
    },
    sections: [
      {
        heading: "متى يكون المنتج product-leaning فعلًا؟",
        body: "عندما تستطيعين وصف سبب الاختيار النهائي بوضوح ويبقى فقط سؤال تأكيدي واحد قبل الإجراء.",
      },
      {
        heading: "ما التحقق السريع قبل الإضافة للسلة؟",
        body: "راجعي النقطة الوحيدة المتبقية المرتبطة باعتراضك الأساسي، بدل إعادة فتح مقارنة كاملة من البداية.",
      },
      {
        heading: "كيف تمنعين الرجوع للتصفح المفتوح؟",
        body: "التزمي بخطوة واحدة بعد المقال: PDP للتحقق النهائي أو category إذا اتسع الاعتراض، دون مسارات جانبية إضافية.",
      },
    ],
    faq: [
      {
        question: "هل الذهاب المباشر لـPDP دائمًا أفضل للتحويل؟",
        answer:
          "فقط عندما يكون القرار مضيقًا بالفعل. خلاف ذلك قد يزيد التردد بدل تقليله.",
      },
      {
        question: "متى أؤجل checkout؟",
        answer:
          "عندما تكتشفين أن الاعتراضات ما زالت متعددة أو غير محددة، لأن القرار لم ينضج بعد.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "post-upgrade-proof-or-full-reorder-when-to-commit-after-a-trial-cycle",
    issue: "Issue 21",
    pillar: "اختيار المنتج والشراء",
    category: "post-upgrade validation",
    title:
      "بعد upgrade تجريبي: متى تعتمدي full reorder ومتى تكملي مراقبة الدورة؟",
    deck:
      "الترقية الجزئية قد تحسن الإحساس بسرعة، لكن قرار الالتزام الكامل يحتاج proof أوضح. هذا الدليل يضع قواعد تحقق بعد upgrade قبل التحول إلى full reorder.",
    excerpt:
      "نجاح upgrade الأولي لا يعني دائمًا أن وقت full reorder قد حان. التحقق الصحيح يمنع قرارات مبكرة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا ظهر التحسن بشكل ثابت عبر دورة كافية وبنفس ظروف الاستخدام، فقرار full reorder يصبح منطقيًا. أما إذا كان التحسن متقطعًا أو حساسًا لتغيّر السياق، فالأفضل الاستمرار في monitored trial قبل الالتزام الكامل.",
    takeaways: [
      "التحسن المؤقت بعد upgrade ليس دليل التزام كامل وحده.",
      "ثبات الإشارة عبر دورة واقعية هو مفتاح full reorder.",
      "monitored trial يحميك من إعادة طلب مبكرة غير مدعومة.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label:
        "راجعي PDP بعد تأكيد ثبات التحسن في دورة كاملة قبل اعتماد full reorder",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما الذي يثبت نجاح upgrade فعلًا؟",
        body: "أن يظهر التحسن بنفس النمط في أكثر من نافذة استخدام، لا كاستجابة لحظية ليوم جيد أو ظروف أخف.",
      },
      {
        heading: "متى يكون full reorder قرارًا آمنًا؟",
        body: "عند ثبات الراحة والنتيجة مع استمرار نفس الروتين دون الحاجة لتعديلات إنقاذية متكررة.",
      },
      {
        heading: "متى تبقين في monitored trial؟",
        body: "إذا كانت الإشارات تتذبذب أو تحتاج شروطًا دقيقة جدًا كي تنجح، فالأفضل تأجيل الالتزام الكامل.",
      },
    ],
    faq: [
      {
        question: "هل دورة واحدة تكفي للحكم؟",
        answer:
          "غالبًا لا. القرار الأقوى يأتي بعد ثبات النتيجة عبر أكثر من نافذة استخدام ضمن نفس السياق.",
      },
      {
        question: "ما خطر التسرع في full reorder؟",
        answer:
          "قد يثبت لاحقًا أن التحسن كان ظرفيًا، فتدخلين دورة إعادة شراء غير مستقرة.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "longwear-breakdown-sweat-sebum-or-application-drift-before-you-switch-base",
    issue: "Issue 21",
    pillar: "أدلة السياق اليومي",
    category: "longwear breakdown diagnostics",
    title:
      "قبل تبديل base: هل انهيار longwear سببه sweat أم sebum أم application drift؟",
    deck:
      "تراجع الثبات خلال اليوم لا يعني دائمًا أن التركيبة فاشلة. هذا المقال يفكك breakdown في longwear إلى ثلاثة أسباب تشغيلية قبل فتح قرار switch.",
    excerpt:
      "تشخيص سبب الانهيار أولًا يقلل تبديل المنتجات غير الضروري ويقود لقرار PDP أدق.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان التراجع مرتبطًا بظروف حرارة أو حركة مرتفعة فهو أقرب لـ sweat effect، وإذا كان تدريجيًا في مناطق دهنية فهو أقرب لـ sebum drift، وإذا ظهر بشكل غير متناسق مبكرًا فهو غالبًا application-order drift. التشخيص الصحيح يسبق قرار التبديل.",
    takeaways: [
      "كل breakdown في longwear يحتاج سببًا محددًا قبل switch.",
      "sweat/sebum/application drift ليست نفس المشكلة.",
      "حل السبب التشغيلي قد يغني عن تبديل القاعدة بالكامل.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/concerns/makeup-longwear",
      label:
        "ابدئي من concern page لتشخيص سبب longwear breakdown قبل مقارنة قواعد جديدة",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "كيف تميّزين sweat effect؟",
        body: "يظهر غالبًا مع ارتفاع الحرارة والحركة، وبنمط أسرع في مناطق التعرض المباشر خلال اليوم الطويل.",
      },
      {
        heading: "كيف تميّزين sebum drift؟",
        body: "تراجع تدريجي في مناطق الدهون المعتادة حتى بدون تغير كبير في الحركة، ويحتاج ضبطًا مختلفًا عن sweat.",
      },
      {
        heading: "ما علامة application-order drift؟",
        body: "اختلال مبكر وغير متساوٍ بين مناطق الوجه غالبًا بسبب ترتيب أو كمية الطبقات قبل التثبيت.",
      },
    ],
    faq: [
      {
        question: "هل كل ضعف longwear يعني منتجًا غير مناسب؟",
        answer:
          "لا. كثير من الحالات تكون تشغيلية ويمكن تحسينها دون تبديل فوري للمنتج.",
      },
      {
        question: "متى يكون switch هو الخطوة الصحيحة؟",
        answer:
          "بعد استبعاد الأسباب التشغيلية وثبات نفس المشكلة في سياق استخدام متكرر.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "after-weather-adjustment-keep-tuning-or-confirm-haircare-product-mismatch",
    issue: "Issue 21",
    pillar: "الروتينات العملية",
    category: "weather-adjusted handoff",
    title:
      "بعد تعديل الروتين حسب الطقس: هل تكملي tuning أم تؤكدي product mismatch في haircare؟",
    deck:
      "بعد موجة طقس متغيرة، كثير من القرارات تبقى معلقة: هل المشكلة تحتاج tuning إضافي أم أن المنتج غير مناسب فعلاً؟ هذا الدليل يحسم handoff بعد weather-adjustment.",
    excerpt:
      "مرحلة ما بعد تعديل الطقس هي نقطة الفصل بين تحسين الروتين وتأكيد عدم توافق المنتج.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا بدأت الإشارات تتحسن مع تعديل التوقيت والكمية، فاستمري في tuning. أما إذا استمرت نفس المشكلة رغم استقرار الجو والتنفيذ، فحينها product mismatch يصبح الاحتمال الأقوى ويستحق انتقالًا مدروسًا.",
    takeaways: [
      "weather-adjustment مرحلة اختبار قبل أي switch.",
      "تحسن جزئي مستمر يعني tuning ما زال مفيدًا.",
      "استمرار نفس الإشارة بعد الاستقرار يدعم حكم mismatch.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label:
        "انتقلي إلى haircare collection فقط بعد حسم keep-tuning مقابل mismatch confirmation",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما علامة أن tuning ما زال كافيًا؟",
        body: "وجود تحسن تدريجي واضح مع تعديلات بسيطة في التوقيت أو الكمية دون ظهور نمط سلبي ثابت.",
      },
      {
        heading: "متى تؤكدين mismatch؟",
        body: "عندما تثبت المشكلة بنفس الشكل بعد استقرار الظروف الجوية والتنفيذ اليومي لفترة كافية.",
      },
      {
        heading: "لماذا هذا الترتيب مهم قبل الشراء؟",
        body: "لأنه يمنع القفز إلى تبديل واسع بناءً على أثر موسمي كان يمكن ضبطه بتعديل تشغيل بسيط.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج تغيير المنتج عند أول أسبوع صعب؟",
        answer:
          "لا. الأسبوع الأول بعد تغير الطقس غالبًا يحتاج ضبط تنفيذ قبل أي قرار تبديل.",
      },
      {
        question: "ما الخطوة الأذكى قبل switch؟",
        answer:
          "ثبتي تنفيذ الروتين بعد التعديل ثم راقبي هل النمط السلبي ما زال يتكرر بنفس القوة.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "high-intent-path-go-direct-pdp-or-revisit-category-after-journal-decision",
    issue: "Issue 21",
    pillar: "اختيار المنتج والشراء",
    category: "journal-to-pdp compression",
    title:
      "لمستخدِم high-intent: هل تذهب مباشرة إلى PDP أم تعود للفئة بعد قرار Journal؟",
    deck:
      "بعد قراءة مقال حاسم، بعض المستخدمين يضيعون بين العودة للفئة أو القفز إلى PDP. هذا الدليل يضغط المسار إلى الخطوة الأقصر حسب مستوى تضييق القرار.",
    excerpt:
      "كلما كان القرار أضيق، كان الذهاب المباشر إلى PDP أكثر كفاءة. وكلما كان أوسع، بقيت الفئة هي خطوة الأمان.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "اذهبي مباشرة إلى PDP إذا كان المقال حسم نوع المنتج وسبب الاختيار بشكل واضح. أما إذا حسم فقط اتجاه الحل دون منتج محدد، فإعادة زيارة الفئة ما زالت الخطوة الأدق قبل الدفع.",
    takeaways: [
      "PDP direct مناسب عندما يكون القرار narrowed بالفعل.",
      "category revisit تحمي من شراء مبكر عند قرار واسع.",
      "ضغط المسار يقلل التردد ولا يلغي دقة القرار.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "انتقلي مباشرة إلى PDP إذا كان قرارك narrowed، أو ارجعي للفئة إذا بقي الاختيار واسعًا",
      destinationType: "product",
    },
    sections: [
      {
        heading: "متى يكون PDP direct هو الخيار الأفضل؟",
        body: "عندما يكون الاعتراض الرئيسي محسومًا والمواصفة المطلوبة واضحة بما يكفي لاتخاذ قرار قريب من checkout.",
      },
      {
        heading: "متى تبقى category revisit ضرورية؟",
        body: "عندما يكون القرار على مستوى الفئة أو المسار العام دون تضييق نهائي للمنتج.",
      },
      {
        heading: "كيف تقللين browsing drift؟",
        body: "اربطِي قرار المقال بخطوة واحدة فقط بعدها، بدل فتح مسارات متعددة تعيدك إلى نقطة التردد.",
      },
    ],
    faq: [
      {
        question: "هل الذهاب المباشر إلى PDP دائمًا أسرع؟",
        answer:
          "أسرع نعم، لكن فقط عندما يكون القرار مضيقًا بما يكفي. غير ذلك قد يخلق ترددًا إضافيًا داخل PDP.",
      },
      {
        question: "كيف أعرف أن القرار narrowed فعلًا؟",
        answer:
          "إذا قدرتِ وصف سبب الاختيار في جملة واحدة مرتبطة بمنتج محدد، فغالبًا المسار المباشر مناسب.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "reorder-or-upgrade-when-repeat-cycles-feel-stable-but-confidence-drops",
    issue: "Issue 20",
    pillar: "اختيار المنتج والشراء",
    category: "reorder-versus-upgrade confidence",
    title:
      "عندما تستقر الدورة لكن تنخفض الثقة: هل تختارين reorder أم upgrade في skincare؟",
    deck:
      "بعض الدورات تبدو مستقرة ظاهريًا، لكن إحساس الثقة يتراجع مع الوقت. هذا المقال يحسم إن كان القرار الصحيح هو إعادة الطلب على نفس المسار أو ترقية خطوة محددة دون فتح تبديل كامل للروتين.",
    excerpt:
      "ثبات النتيجة وحده لا يكفي. القرار الأدق بين reorder وupgrade يعتمد على نوع الانخفاض في الثقة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت النتائج الأساسية ما زالت مستقرة لكن هناك تردد محدود في جانب واحد فقط، فقرار upgrade الجزئي أدق من إعادة بناء المسار. أما إذا ظلت النتيجة متماسكة بلا فجوات واضحة، فـ reorder يحافظ على الثبات ويقلل تعقيد القرار.",
    takeaways: [
      "الفرق بين confidence drop وresult drop يغيّر القرار بالكامل.",
      "upgrade الجزئي يُستخدم عند فجوة واضحة ومحدودة، لا كاستجابة عامة للقلق.",
      "reorder هو الخيار الأذكى عندما يبقى أداء الروتين مستقرًا عبر الدورة.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/shop/skincare",
      label:
        "انتقلي إلى skincare collection بعد تحديد إن كانت الفجوة تحتاج upgrade جزئي أو reorder مباشر",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى يكون reorder هو القرار الأقوى؟",
        body: "عندما تبقى مؤشرات الأداء الأساسية ثابتة ولا يظهر تراجع حقيقي في النتيجة، ويكون التردد ناتجًا عن القلق لا عن خلل تشغيلي واضح.",
      },
      {
        heading: "متى يتحول القرار إلى upgrade؟",
        body: "عند ظهور إشارة متكررة في جانب محدد من التجربة رغم ثبات الأساس، مثل راحة أقل أو استجابة أبطأ في نقطة واحدة فقط.",
      },
      {
        heading: "كيف تتجنبين التبديل المتسرع؟",
        body: "افصلي بين ثبات النتيجة العامة والانزعاج الموضعي، ثم قرري على أساس نوع الفجوة لا على أساس المزاج اللحظي بعد دورة واحدة.",
      },
    ],
    faq: [
      {
        question: "هل أي تردد بعد التكرار يعني أني أحتاج منتجًا جديدًا؟",
        answer:
          "لا. كثير من حالات التردد لا تعني ضعف المنتج، بل تعني حاجة لضبط جزئي أو إعادة تأكيد على نفس المسار.",
      },
      {
        question: "ما أسرع طريقة لحسم القرار؟",
        answer:
          "حددي أولًا: هل المشكلة في نتيجة الروتين ككل أم في نقطة واحدة فقط. هذا السؤال وحده يحدد reorder أو upgrade.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "long-day-longwear-objection-which-proof-matters-before-pdp-commitment",
    issue: "Issue 20",
    pillar: "اختيار المنتج والشراء",
    category: "long-day longwear objections",
    title:
      "قبل الالتزام في Makeup PDP: أي proof يحسم اعتراض long-day longwear؟",
    deck:
      "الاعتراض على longwear غالبًا لا يحتاج معلومات أكثر بقدر ما يحتاج proof أدق. هذا الدليل يحدد أي دليل يجب قراءته أولًا عندما يكون الاستخدام طويل اليوم هو نقطة التردد قبل الشراء.",
    excerpt:
      "ليس كل proof متساويًا عند long-day usage. ترتيب الدليل الصحيح يقلل التردد قبل PDP commitment.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ابدئي بالـ proof الأقرب لاستخدامك الفعلي: مدة اليوم، نوع الحركة، ونقطة التراجع المتوقعة. إذا كان الاعتراض زمنيًا فالأولوية لدليل الثبات عبر الساعات، وإذا كان بصريًا فالأولوية لدليل finish تحت ظروف واقعية.",
    takeaways: [
      "اعتراض longwear يُحسم بدليل زمني واقعي لا بوصف عام.",
      "تفكيك الاعتراض إلى time-proof وfinish-proof يمنع المقارنة العشوائية.",
      "اختيار proof واحد رئيسي أولًا يسرّع قرار PDP.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "ادخلي PDP بعد تحديد ما إذا كان اعتراضك longwear زمنيًا أو finish بصريًا",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما proof الأول عندما يكون اليوم طويلًا؟",
        body: "الدليل الأول يجب أن يختبر الأداء عبر ساعات الاستخدام الفعلية، وليس فقط بداية التطبيق أو لحظة الخروج.",
      },
      {
        heading: "متى يكون finish-proof أهم من time-proof؟",
        body: "عندما يكون الاعتراض مرتبطًا بمظهر الطبقة النهائية أكثر من مدة بقائها، مثل الإحساس أو الملمس أو الشكل تحت الإضاءة.",
      },
      {
        heading: "كيف يمنع هذا النهج التردد قبل checkout؟",
        body: "لأنه يحوّل القرار من تصفح عام إلى اختبار اعتراض محدد، فتتضح صلاحية المنتج بسرعة أكبر.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج تقييم كل تفاصيل الـPDP قبل الشراء؟",
        answer:
          "ليس دائمًا. ابدئي بالدليل المرتبط باعتراضك الرئيسي، ثم تحققي من التفاصيل الثانوية فقط إذا بقي التردد.",
      },
      {
        question: "ما الخطأ الشائع في تقييم longwear؟",
        answer:
          "الاعتماد على proof غير مطابق لسيناريو الاستخدام الحقيقي، مثل مقارنة قصيرة ليوم طويل فعلي.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "routine-drift-or-product-mismatch-assign-responsibility-before-switching-haircare",
    issue: "Issue 20",
    pillar: "الروتينات العملية",
    category: "routine-versus-product responsibility",
    title:
      "قبل تبديل Haircare: هل المسؤولية على routine drift أم product mismatch؟",
    deck:
      "عند تراجع النتيجة في haircare، الخطأ الشائع هو تحميل المنتج المسؤولية فورًا. هذا المقال يفصل بوضوح بين انحراف تنفيذ الروتين وبين عدم توافق المنتج قبل أي قرار switch.",
    excerpt:
      "تحديد جهة المسؤولية أولًا يمنع تبديلًا مكلفًا وغير ضروري في haircare.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت الإشارات السلبية مرتبطة بتغير توقيت أو ترتيب الخطوات، فالمشكلة غالبًا routine drift. أما إذا استمرت نفس الإشارة بعد تثبيت التنفيذ والسياق، فهنا يصبح product mismatch احتمالًا أعلى ويستحق مراجعة.",
    takeaways: [
      "تبديل المنتج قبل تثبيت التنفيذ يضاعف عدم اليقين.",
      "routine drift يظهر غالبًا مع تغيّر الإيقاع أو الظروف اليومية.",
      "product mismatch يُثبت عند بقاء المشكلة رغم استقرار الروتين.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label:
        "انتقلي إلى haircare collection بعد تثبيت إن كانت المشكلة routine drift أم product mismatch",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "كيف ترصدين routine drift بسرعة؟",
        body: "راجعي ترتيب الخطوات وتوقيتها خلال الأسبوع، وابحثي عن انقطاع أو تغيّر متكرر يسبق ظهور المشكلة.",
      },
      {
        heading: "متى يصبح product mismatch هو التفسير الأقوى؟",
        body: "عندما يبقى نفس النمط السلبي بعد إعادة الانضباط للروتين واستقرار ظروف الاستخدام اليومية.",
      },
      {
        heading: "ما أثر الفصل بينهما على قرار الشراء؟",
        body: "يعطيك handoff أدق نحو الفئة المناسبة ويمنع الانتقال من منتج لآخر بدون دليل تشغيلي كاف.",
      },
    ],
    faq: [
      {
        question: "هل يكفي يومان للحكم أن المنتج غير مناسب؟",
        answer:
          "لا. الحكم يحتاج نافذة كافية بعد تثبيت التنفيذ حتى لا نخلط بين الانحراف المؤقت وعدم التوافق الحقيقي.",
      },
      {
        question: "ما أول خطوة قبل فتح قرار switch؟",
        answer:
          "ثبتي ترتيب الروتين وتوقيته أولًا، ثم راقبي هل الإشارة السلبية ما زالت تتكرر بنفس الشكل.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "journal-decision-to-category-or-pdp-choose-next-click-without-open-browsing",
    issue: "Issue 20",
    pillar: "اختيار المنتج والشراء",
    category: "decision-to-action bridge",
    title:
      "من قرار Journal إلى الخطوة التالية: Category أم PDP بدون رجوع لتصفح مفتوح",
    deck:
      "بعد حسم السؤال داخل المقال، يتعطل كثير من الزوار بين العودة للتصفح أو القفز غير المدروس للشراء. هذا الدليل يحدد متى تذهبين إلى category ومتى تنتقلين مباشرة إلى PDP.",
    excerpt:
      "كل قرار تحريري يجب أن ينتهي بخطوة تنفيذ واضحة: category عندما الاختيار واسع، وPDP عندما الخيار narrowed.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان قرارك حسم نوع المسار فقط (مثل set-return أو فئة روتين عامة)، فابدئي من category. أما إذا حُدد المنتج أو المواصفة الأساسية بالفعل، فالانتقال المباشر إلى PDP يقلل دوران القرار ويقرب الشراء.",
    takeaways: [
      "الخطوة التالية تُحدد بنطاق القرار الذي تم حسمه داخل المقال.",
      "category مناسبة للقرارات واسعة النطاق، وPDP للقرارات المضيقة.",
      "إلغاء التصفح المفتوح بعد الحسم يرفع جودة التحويل.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    nextStep: {
      href: "/shop/beauty-sets",
      label:
        "ابدئي من category إذا كان القرار ما زال على مستوى المسار، ثم انتقلي إلى PDP بعد التضييق",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى تكون category هي الاختيار الصحيح؟",
        body: "عندما يكون القرار ما زال حول نوع الحل أو العائلة المناسبة، وليس حول منتج محدد بمواصفات ثابتة.",
      },
      {
        heading: "متى يكون الانتقال إلى PDP أفضل؟",
        body: "عندما تكونين قد حسمتِ نقطة الاعتراض الرئيسية ونطاق المنتج المطلوب، فلا حاجة للعودة إلى استكشاف واسع.",
      },
      {
        heading: "كيف يؤثر ذلك على conversion؟",
        body: "تقليل الخطوات غير الضرورية بعد القرار يخفض التردد ويقصر المسار حتى الدفع.",
      },
    ],
    faq: [
      {
        question: "هل الانتقال إلى PDP مبكرًا ممكن أن يسبب ترددًا؟",
        answer:
          "نعم إذا كان القرار ما زال واسعًا. لذلك يجب التأكد أن المقال ضيّق الاختيار قبل القفز المباشر.",
      },
      {
        question: "هل category تعني دائمًا مسارًا أطول؟",
        answer:
          "ليس بالضرورة. عندما يكون القرار غير مضيق بعد، category تختصر التشتت وتمنع اختيارًا غير مناسب.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "short-cycle-fluctuation-or-real-decline-before-you-switch-skincare",
    issue: "Issue 19",
    pillar: "اختيار المنتج والشراء",
    category: "keep-versus-switch عند تذبذب قصير",
    title:
      "عندما تهبط النتيجة بسرعة في دورة قصيرة: هل هذا تذبذب مؤقت أم تراجع حقيقي قبل تبديل skincare؟",
    deck:
      "بعض التغيرات السريعة تبدو كأن المنتج فقد أثره، لكنها أحيانًا تعكس دورة قصيرة غير مستقرة في الروتين أو السياق. هذا الدليل يفرق بين fluctuation عابر وبين decline يستحق قرار switch فعلي.",
    excerpt:
      "ليس كل هبوط قصير في النتيجة يعني أن وقت التبديل قد حان. الفارق بين fluctuation وdecline هو مفتاح القرار.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان التراجع ظهر في نافذة قصيرة مع تغيرات في الإيقاع أو الظروف، فابدئي باعتباره fluctuation يحتاج تثبيتًا لا تبديلًا. أما إذا تكرر نفس الهبوط بعد استقرار الروتين والسياق، فهنا يصبح switch قرارًا قابلًا للدفاع.",
    takeaways: [
      "الدورة القصيرة لا تكفي وحدها لإعلان فشل المنتج.",
      "ثبات التراجع بعد استقرار التنفيذ هو ما يحول الشك إلى قرار.",
      "قرار keep-versus-switch يحتاج قراءة زمنية لا انطباعًا لحظيًا.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/routines/morning-routine-oily-skin",
      label:
        "اختبري ثبات الروتين أولًا إذا كان التراجع قصير الدورة قبل فتح قرار switch",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "كيف تميّزين fluctuation القصير عن decline الحقيقي؟",
        body: "الـfluctuation يظهر سريعًا مع تغيرات إيقاعية أو ظرفية ثم يتحسن مع التثبيت. أما الـdecline الحقيقي فيستمر حتى بعد عودة الروتين إلى نمط مستقر.",
      },
      {
        heading: "متى يبقى keep المنتج هو القرار الأذكى؟",
        body: "عندما تظل فائدة أساسية من المنتج واضحة رغم التذبذب القصير، ويكون التراجع غير ثابت عبر الأسابيع المتقاربة.",
      },
      {
        heading: "متى يصبح switch مبررًا؟",
        body: "عندما تتكرر نفس الإشارة السلبية بعد تثبيت التوقيت والترتيب والظروف، بحيث لا يعود التراجع قابلًا للتفسير كذبذبة مؤقتة.",
      },
    ],
    faq: [
      {
        question: "هل يكفي أسبوع ضعيف لاتخاذ قرار switch؟",
        answer:
          "لا. أسبوع واحد غالبًا لا يكشف إن كان التغير مؤقتًا أم هيكليًا. القرار يحتاج نافذة أطول مع تنفيذ ثابت.",
      },
      {
        question: "ما الخطأ الأكثر شيوعًا هنا؟",
        answer:
          "الخروج السريع إلى منتج بديل قبل اختبار ثبات الروتين. هذا يضاعف عدم اليقين بدل حلّه.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "single-restock-or-set-return-when-value-signals-conflict-with-routine-simplicity",
    issue: "Issue 19",
    pillar: "اختيار المنتج والشراء",
    category: "single-restock مقابل set-return",
    title:
      "عندما تتعارض إشارات القيمة مع بساطة الروتين: هل تختارين single restock أم العودة إلى set؟",
    deck:
      "العروض قد تدفع نحو set بينما الروتين يحتاج خطوة واحدة فقط، أو العكس. هذا المقال يضع قاعدة قرار واضحة بين single-restock وset-return بناءً على simplicity التشغيلية لا جاذبية السعر وحدها.",
    excerpt:
      "القيمة الفعلية ليست دائمًا في العرض الأكبر؛ أحيانًا تكون في قرار أبسط يحمي استمرارية الروتين.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الروتين مستقرًا ويحتاج تعويض عنصر واحد، فـsingle-restock غالبًا أوفر تشغيليًا حتى لو كان العرض أقل جاذبية. أما إذا كان أكثر من عنصر أساسي مهددًا، فـset-return قد يكون أقوى قيمة فعلية على مستوى الاستمرارية.",
    takeaways: [
      "value signal لا يساوي دائمًا قرارًا صحيحًا للروتين الحالي.",
      "single-restock أفضل عندما تكون الفجوة أحادية وواضحة.",
      "set-return أفضل عندما تكون الفجوة متعددة وتحتاج إعادة توازن.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    nextStep: {
      href: "/shop/beauty-sets",
      label:
        "اختاري set-return فقط إذا كانت الفجوة متعددة العناصر، وإلا فالأدق single-restock",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى تكون simplicity أهم من الإغراء السعري؟",
        body: "عندما يؤدي شراء إضافي إلى تعقيد روتين مستقر بدل دعمه. البساطة هنا تحافظ على الالتزام وتقلل الهدر.",
      },
      {
        heading: "كيف تعرفين أن single-restock كافٍ؟",
        body: "إذا كان عنصر واحد فقط هو عنق الزجاجة والنتيجة لا تتطلب إعادة بناء كاملة، فالتركيز على هذا العنصر يحمي التدفق بدون تشتيت.",
      },
      {
        heading: "ومتى يستحق set-return؟",
        body: "حين تصبح الفجوة موزعة على أكثر من خطوة ويصير شراء المفردات أقل كفاءة أو أقل وضوحًا في إعادة التوازن.",
      },
    ],
    faq: [
      {
        question: "هل العرض الأكبر يعني دائمًا قيمة أعلى؟",
        answer:
          "ليس دائمًا. القيمة الحقيقية تقاس بملاءمة الشراء للفجوة الحالية في الروتين، لا بحجم العرض وحده.",
      },
      {
        question: "كيف أتجنب شراء زائد بسبب العروض؟",
        answer:
          "حددي أولًا إن كانت المشكلة خطوة واحدة أم عدة خطوات. هذا السؤال يمنع التوسع غير الضروري.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "base-finish-or-longwear-which-question-should-hit-the-pdp-first",
    issue: "Issue 19",
    pillar: "اختيار المنتج والشراء",
    category: "base-finish مقابل longwear قبل PDP",
    title:
      "قبل Makeup PDP: هل سؤالك الأول عن base finish أم عن longwear؟",
    deck:
      "الدخول إلى PDP بدون تحديد محور الاعتراض يزيد التردد. هذا الدليل يحسم أي سؤال يجب أن يتصدر: finish المرتبط بالشكل النهائي، أم longwear المرتبط بالثبات عبر اليوم.",
    excerpt:
      "كلما وضحتِ إن كان اعتراضك finish أو longwear، صار تقييم PDP أسرع وأقرب للقرار.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان قلقك الأساسي بصريًا حول النتيجة على البشرة، فابدئي بسؤال finish. وإذا كان القلق زمنيًا حول الثبات خلال ساعات الاستخدام، فابدئي بسؤال longwear. ترتيب السؤال الصحيح يقلل إعادة الدوران في المقارنة.",
    takeaways: [
      "finish سؤال بصري، longwear سؤال زمني.",
      "خلط السؤالين يجعل PDP يبدو غير حاسم حتى لو كان مناسبًا.",
      "سؤال واحد واضح أولًا يسرّع الحسم.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "ادخلي PDP بعد تحديد إن كان الاعتراض الأساسي finish أو longwear",
      destinationType: "product",
    },
    sections: [
      {
        heading: "متى يتقدم سؤال finish؟",
        body: "عندما تكون المعضلة في شكل الطبقة النهائية، الإحساس على البشرة، أو مظهر القاعدة تحت الإضاءة اليومية.",
      },
      {
        heading: "متى يتقدم سؤال longwear؟",
        body: "عندما تكون المشكلة في بقاء النتيجة خلال ساعات العمل أو المناسبة، لا في مظهر البداية بعد التطبيق مباشرة.",
      },
      {
        heading: "كيف يختصر هذا الاختيار رحلة القرار؟",
        body: "لأنه يمنع قراءة PDP بعينين متعارضتين في نفس اللحظة. تحديد محور واحد أولًا يعطي إشارة قرار أدق.",
      },
    ],
    faq: [
      {
        question: "هل يمكن أن يكون عندي الاعتراضان معًا؟",
        answer:
          "نعم، لكن اختاري الأهم تأثيرًا على القرار الآن. بعد حسمه يصبح تقييم النقطة الثانية أبسط.",
      },
      {
        question: "ما أثر هذا على التردد قبل checkout؟",
        answer:
          "يخفض التردد لأنك تتحولين من تصفح عام إلى اختبار واضح لسؤال محدد.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "humidity-shift-or-fit-problem-before-haircare-collection-handoff",
    issue: "Issue 19",
    pillar: "الروتينات العملية",
    category: "humidity-versus-fit قبل handoff",
    title:
      "قبل handoff إلى Haircare Collection: هل المشكلة من الرطوبة أم من fit المنتج؟",
    deck:
      "الرطوبة قد تغيّر سلوك الشعر بسرعة وتخلق انطباعًا أن fit المنتج تراجع. هذا المقال يعطي bridge عمليًا قبل collection handoff حتى لا يتحول التأثير المناخي المؤقت إلى قرار تبديل دائم.",
    excerpt:
      "تمييز humidity-shift عن fit-problem يرفع دقة قرارات haircare قبل الانتقال للشراء.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا جاء التغير مع ارتفاع الرطوبة أو تذبذبها، فاختبري أولًا تعديل الروتين في نفس الإطار المناخي. إذا بقيت المشكلة بعد ثبات الظروف والتنفيذ، فراجعي fit المنتج. هذا الترتيب يضبط handoff ويقلل قرارات التبديل المتسرعة.",
    takeaways: [
      "humidity shift قد يفسر الانزعاج دون إبطال المنتج.",
      "fit problem يتأكد عند استمرار الإشارة بعد الاستقرار.",
      "bridge واضح قبل handoff يختصر الطريق إلى خيار أدق.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label:
        "انتقلي إلى haircare collection بعد حسم humidity-shift مقابل fit-problem",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما مؤشر أن الرطوبة هي العامل الرئيسي؟",
        body: "ظهور المشكلة مع موجات رطوبة محددة ثم تحسنها عند الاستقرار أو تعديل التطبيق بنفس الظروف.",
      },
      {
        heading: "ما مؤشر أن fit المنتج يحتاج مراجعة؟",
        body: "بقاء الإشارة نفسها حتى بعد ضبط الروتين وثبات الجو، بما يعني أن المشكلة لم تعد سياقية فقط.",
      },
      {
        heading: "كيف يحسن هذا bridge قرار الشراء؟",
        body: "يجعل collection handoff مبنيًا على تشخيص عملي بدل رد فعل عاطفي لتذبذب يومي.",
      },
    ],
    faq: [
      {
        question: "هل كل مشكلة مع الرطوبة تعني أن المنتج غير مناسب؟",
        answer:
          "لا. كثير من الحالات تتحسن بتعديل التطبيق أو توقيته قبل الحاجة لتغيير المنتج.",
      },
      {
        question: "متى أعتبر التبديل منطقيًا؟",
        answer:
          "عندما تتكرر المشكلة نفسها بعد استقرار الرطوبة وثبات الروتين، لا أثناء التقلبات العابرة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "season-shift-or-routine-drift-which-explains-mixed-proof-before-switching-skincare",
    issue: "Issue 18",
    pillar: "اختيار المنتج والشراء",
    category: "mixed-proof بين تغيّر الموسم وانحراف الروتين",
    title:
      "عندما تضعف النتيجة في موسم مختلف: هل السبب تغيّر الجو أم انحراف الروتين قبل قرار تبديل skincare؟",
    deck:
      "ضعف النتيجة بعد انتقال موسمي لا يعني تلقائيًا أن المنتج فقد ملاءمته. أحيانًا يتغير الأداء بسبب الطقس أو الرطوبة أو اختلاف نمط اليوم، وأحيانًا يكون السبب انزلاق الروتين نفسه. هذا الدليل يضيّق قراءة mixed-proof قبل فتح قرار تبديل المنتج.",
    excerpt:
      "قبل تبديل منتج skincare مع mixed-proof، افصلي بين أثر الموسم وأثر الروتين حتى لا تبني القرار على قراءة ناقصة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا جاء التراجع مع انتقال واضح في الطقس أو الرطوبة أو عادات اليوم، فابدئي بتثبيت الروتين داخل الظروف الجديدة بدل اتهام المنتج مباشرة. قرار التبديل يصبح منطقيًا فقط بعد أن يعود الروتين إلى ثباته النسبي في الموسم الجديد ثم يتكرر التراجع نفسه بوضوح.",
    takeaways: [
      "الموسم قد يضعف قراءة النتيجة قبل أن يثبت فشل المنتج.",
      "انحراف الروتين في توقيت أو ترتيب الاستخدام يضخم mixed-proof أكثر من المنتج نفسه.",
      "التبديل يكون آخر خطوة بعد تثبيت السياق، لا أول رد فعل.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/routines/morning-routine-oily-skin",
      label:
        "ثبّتي الروتين أولًا داخل ظروف الموسم الحالي قبل فتح قرار تبديل منتج skincare",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "ما العلامة أن تغيّر الموسم هو العامل الأقوى؟",
        body: "أن يرتبط التراجع بفترة انتقال الطقس أو تغيّر بيئة اليوم بشكل مباشر، ثم يظهر تحسن نسبي كلما ثبتت الخطوات وتوقيتها. هذا النمط يشير إلى أثر سياقي أكثر من كونه انهيارًا في ملاءمة المنتج.",
      },
      {
        heading: "ومتى يكون انحراف الروتين هو المشكلة الحقيقية؟",
        body: "عندما يتغير ترتيب الخطوات أو يتذبذب الانتظام أو يتبدل توقيت الاستخدام، ويصبح الحكم على المنتج مبنيًا على تنفيذ غير مستقر. هنا إصلاح الروتين يقدم قراءة أصدق من تبديل المنتج.",
      },
      {
        heading: "متى يصبح التبديل مبررًا فعليًا؟",
        body: "عندما تستقر الظروف الموسمية ويتماسك الروتين من جديد، ومع ذلك يتكرر التراجع نفسه بلا تفسير إضافي. عندها يتحول المنتج إلى نقطة مراجعة حقيقية بدل أن يكون اتهامًا مبكرًا.",
      },
    ],
    faq: [
      {
        question: "هل كل تراجع بعد تغيّر الطقس يعني أن المنتج صار غير مناسب؟",
        answer:
          "لا. كثير من التراجع في فترات التحول الموسمي يكون نتيجة تغيّر السياق أو انتظام الروتين، وليس بالضرورة فقدان المنتج لملاءمته.",
      },
      {
        question: "ما أول خطوة قبل التفكير في منتج بديل؟",
        answer:
          "أعيدي تثبيت الروتين في توقيت واضح داخل الظروف الحالية، ثم راقبي إن كان التراجع يستمر بنفس الشكل قبل فتح قرار التبديل.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "restock-now-or-return-to-a-set-when-low-stock-cues-feel-confusing",
    issue: "Issue 18",
    pillar: "اختيار المنتج والشراء",
    category: "restock مقابل العودة إلى set عند إشارات نفاد غير واضحة",
    title:
      "عندما تكون إشارات النفاد مربكة: هل تعيدين طلب منتج واحد الآن أم تعودين إلى beauty set؟",
    deck:
      "انخفاض الكمية لا يكفي وحده لحسم قرار الشراء التالي. أحيانًا يكون reorder المفرد هو الحل، وأحيانًا تكون العودة إلى set أكثر منطقية لاستمرار الروتين. هذا الدليل يوضح متى تتقدم أولوية restock ومتى تصبح العودة إلى set قرارًا أفضل.",
    excerpt:
      "بين low-stock cue وbundle temptation، القرار الصحيح يأتي من استقرار الروتين لا من الإغراء اللحظي.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت الخطوة الأكثر نفادًا هي وحدها التي تهدد استمرارية الروتين، فالأولوية عادةً لإعادة طلب مفرد. أما إذا كان أكثر من عنصر صار على حافة الانقطاع والروتين يحتاج عودة متوازنة، فقد تكون العودة إلى set أكثر كفاءة. القرار يحسمه شكل الفجوة التشغيلية في الروتين لا حجم العرض وحده.",
    takeaways: [
      "إشارة النفاد تقرأ مع هيكل الروتين، لا كرقم منفصل.",
      "العودة إلى set منطقية عندما يكون الانقطاع متعدد العناصر لا خطوة واحدة.",
      "الخصم لا يعوّض شراء غير متناسب مع احتياج الروتين الحالي.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    nextStep: {
      href: "/shop/beauty-sets",
      label:
        "افتحي beauty-sets فقط إذا كان الروتين يحتاج عودة متوازنة متعددة العناصر لا مجرد restock مفرد",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى يكفي restock مفرد؟",
        body: "عندما تكون نقطة الانقطاع واضحة في منتج واحد بينما باقي الروتين ما زال مستقرًا. هنا شراء مفرد يحافظ على الإيقاع دون إدخال عناصر إضافية غير ضرورية.",
      },
      {
        heading: "ومتى تكون العودة إلى set أكثر واقعية؟",
        body: "عندما تصبح الفجوة موزعة على أكثر من خطوة أساسية، ويصير تجميع البدائل المفردة أقل وضوحًا أو أعلى تكلفة تشغيلية. عندها set مناسب قد يعيد البناء أسرع.",
      },
      {
        heading: "كيف تمنعين bundle temptation من قيادة القرار؟",
        body: "اسألي أولًا: هل هذا العرض يحل فجوة حقيقية في الروتين الآن؟ إذا كانت الإجابة غير واضحة، فالأفضل تأجيل العودة إلى set حتى تتحدد الحاجة الفعلية بوضوح.",
      },
    ],
    faq: [
      {
        question: "هل انخفاض منتج واحد يعني أنني يجب أن أشتري set كامل؟",
        answer:
          "ليس دائمًا. إذا كان الانقطاع محصورًا في خطوة واحدة، فإعادة الطلب المفرد غالبًا أدق وأقل هدرًا.",
      },
      {
        question: "كيف أعرف أن العودة إلى set قرار صحيح؟",
        answer:
          "عندما تكون أكثر من خطوة أساسية مهددة بالانقطاع في نفس الفترة، ويصبح set حلًا متوازنًا لاستمرار الروتين بدل شراء متقطع غير منسق.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "finish-or-coverage-doubt-before-opening-a-makeup-pdp",
    issue: "Issue 18",
    pillar: "اختيار المنتج والشراء",
    category: "توضيح finish مقابل coverage قبل زيارة PDP",
    title:
      "قبل فتح Makeup PDP: هل شكك الحقيقي في الـfinish أم في الـcoverage؟",
    deck:
      "كثير من ترددات PDP ليست حول المنتج نفسه بل حول نوع الشك الذي لم يُحسم بعد: finish أو coverage. هذا الدليل يضيّق السؤال قبل الزيارة حتى لا تتحول صفحة المنتج إلى مساحة ارتباك جديدة بدل خطوة حسم.",
    excerpt:
      "إذا لم تحسمي هل التردد في finish أو coverage، فزيارة PDP تأتي مبكرًا وتزيد التشتت بدل القرار.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "قبل زيارة PDP اسألي: هل اعتراضك أن شكل النتيجة النهائية لا يناسبك، أم أن مستوى التغطية لا يخدم الاستخدام المطلوب؟ حين يتحدد هذا الفرق، يصبح تقييم المنتج أسرع وأدق، وتقل العودة إلى المقارنة العامة بعد كل قراءة.",
    takeaways: [
      "finish doubt يختلف عن coverage doubt في نوع الإجابة المطلوبة من PDP.",
      "تضييق نوع الاعتراض قبل الزيارة يقلل التردد المتكرر.",
      "وضوح السؤال يختصر الطريق بين المقارنة والقرار.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "ادخلي الـPDP بعد تحديد ما إذا كان الاعتراض على finish أو coverage لتقييم المنتج بشكل أدق",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما الفرق العملي بين finish وcoverage في قرار الشراء؟",
        body: "الـfinish يتعلق بشكل النتيجة النهائي على البشرة أثناء اليوم، بينما الـcoverage يتعلق بمدى الإخفاء المطلوب. الخلط بينهما يجعل أي PDP يبدو ناقصًا حتى لو كان مناسبًا.",
      },
      {
        heading: "متى يكون الاعتراض على finish هو الأهم؟",
        body: "عندما تكون التغطية مقبولة أساسًا لكن النتيجة المرئية أو الإحساس على البشرة لا يتماشى مع سيناريو الاستخدام اليومي أو المناسبات.",
      },
      {
        heading: "ومتى يكون coverage هو السؤال الرئيسي؟",
        body: "عندما يكون شكك مرتبطًا بقدرة المنتج على تلبية مستوى الإخفاء المطلوب أكثر من شكل الملمس النهائي. هنا تختصرين القرار إذا سميت هذا الاعتراض بوضوح قبل زيارة PDP.",
      },
    ],
    faq: [
      {
        question: "هل يمكن أن يكون الشك في finish وcoverage معًا؟",
        answer:
          "نعم، لكن ابدئي بالاعتراض الأقرب لتعطيل القرار. حسم نقطة واحدة أولًا يجعل قراءة PDP أكثر فاعلية ويقلل التشويش.",
      },
      {
        question: "ما الذي يجعل PDP مفيدًا فعلًا في هذه المرحلة؟",
        answer:
          "أن تدخليه بسؤال محدد وواضح، لا بنية تصفح عام. كلما كان الاعتراض محددًا، صار تقييم المنتج أسرع وأكثر دقة.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "weather-effect-or-product-fit-haircare-bridge-before-you-switch",
    issue: "Issue 18",
    pillar: "الروتينات العملية",
    category: "جسر weather effect مقابل product fit في haircare",
    title:
      "قبل تغيير منتج haircare: هل المشكلة أثر الطقس أم عدم توافق فعلي مع المنتج؟",
    deck:
      "في haircare، الانتقال بين أجواء مختلفة قد يغيّر شكل النتيجة بسرعة. هذا لا يعني دائمًا أن المنتج أصبح غير مناسب. هذا المقال يبني جسر قرار أوضح بين weather effect وproduct fit قبل فتح مسار تبديل جديد.",
    excerpt:
      "توضيح weather effect مقابل product fit يمنع قرارات تبديل سريعة مبنية على تذبذب موسمي.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا ارتبط التراجع بتبدل الطقس أو الرطوبة أو السفر، فاقرئيه أولًا كأثر سياقي قابل للتعديل داخل الروتين. أما إذا بقي نفس الخلل رغم استقرار الظروف وعودة نمط العناية، فهنا يصبح product fit موضع مراجعة فعلية. ترتيب هذا الجسر يقيك من تبديل مبكر غير ضروري.",
    takeaways: [
      "weather effect قد يفسر التذبذب دون أن يلغي ملاءمة المنتج.",
      "ثبات المشكلة بعد استقرار الظروف يقوي احتمال product mismatch.",
      "الجسر الصحيح قبل التبديل يرفع جودة قرار الشراء التالي.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label:
        "افتحي haircare collection بعد حسم ما إذا كان التذبذب موسميًا أم mismatch حقيقي في fit المنتج",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى يكون أثر الطقس هو التفسير الأقرب؟",
        body: "عندما يظهر التغير مع موجة رطوبة أو جفاف أو تنقلات متكررة، ثم يخف مع عودة ظروف أكثر استقرارًا. هذا النمط غالبًا يشير إلى أثر سياقي لا إلى خلل دائم في المنتج.",
      },
      {
        heading: "متى يتحول السؤال إلى product fit حقيقي؟",
        body: "عندما يبقى نفس الانزعاج قائمًا رغم استقرار الجو ووضوح الروتين. هنا يصبح من المنطقي مراجعة fit المنتج بدل الاكتفاء بتعديل طريقة الاستخدام.",
      },
      {
        heading: "كيف يساعد هذا الجسر قبل زيارة collection؟",
        body: "لأنه يحول الزيارة من رد فعل على تذبذب مؤقت إلى خطوة قرار مبنية على تشخيص أوضح. النتيجة: خيارات أقل، ملاءمة أعلى، وتبديل أكثر دقة.",
      },
    ],
    faq: [
      {
        question: "هل أي أسبوع سيئ في الشعر يعني أن المنتج غير مناسب؟",
        answer:
          "لا. أسبوع متذبذب قد يكون انعكاسًا للطقس أو الروتين لا لملاءمة المنتج. القرار يحتاج قراءة أوسع من أسبوع واحد.",
      },
      {
        question: "ما المؤشر الأقوى على أني أحتاج تغيير المنتج؟",
        answer:
          "استمرار نفس الخلل بعد استقرار الظروف وثبات الروتين. عندها تكون مراجعة المنتج خطوة منطقية وليست رد فعل موسمي.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "keep-the-product-or-reset-the-routine-when-results-slip-without-collapsing",
    issue: "Issue 17",
    pillar: "اختيار المنتج والشراء",
    category: "الحفاظ على المنتج أم إعادة ضبط الروتين",
    title:
      "إذا كان المنتج ما زال يعمل لكن الروتين انحرف: هل تحافظين على المنتج أم تعيدين ضبط الروتين أولًا؟",
    deck:
      "ليس كل تراجع في النتيجة يعني أن المنتج انتهى دوره. أحيانًا يبقى المنتج مناسبًا بينما الذي انكسر هو انتظام الروتين أو ترتيب الخطوات أو توقيت الاستخدام. هذا الدليل يفصل بين قرار keep وقرار reset قبل أن تفتحي بديلًا جديدًا بلا داعٍ.",
    excerpt:
      "حين يبقى جزء من النتيجة حاضرًا لكن الروتين صار أقل ثباتًا، يصبح سؤال keep-versus-reset أهم من سؤال التبديل.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان المنتج ما زال يقدّم أثرًا واضحًا داخل الروتين، فابدئي بإعادة ضبط الروتين لا بإلغاء المنتج. قرار reset يسبق قرار الاستبدال عندما يكون الانحراف في الانتظام أو layering أو توقيت الاستخدام هو الشيء الأوضح، لا غياب أثر المنتج بالكامل.",
    takeaways: [
      "وجود أثر جزئي ثابت يعني أن المنتج لم يخرج بعد من دائرة الاحتمال.",
      "الروتين المنحرف يربك الحكم أكثر مما يثبت فشل المنتج.",
      "حسم keep-versus-reset أولًا يمنعك من فتح بديل جديد قبل الحاجة الحقيقية إليه.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/routines/morning-routine-oily-skin",
      label:
        "راجعي ثبات الروتين أولًا إذا كان المنتج ما زال يعطي جزءًا واضحًا من النتيجة قبل أن تعيدي فتح قرار التبديل",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "متى يكون reset الروتين أولى من تبديل المنتج؟",
        body: "عندما تلاحظين أن التراجع ارتبط بانقطاع أو تغيير في ترتيب الخطوات أو timing اليومي، بينما بقي جزء من النتيجة كما هو. هنا لا يكون السؤال عن بديل جديد، بل عن إعادة الروتين إلى وضع يسمح بالحكم العادل.",
      },
      {
        heading: "ما العلامة أن keep المنتج ما زال منطقيًا؟",
        body: "أن تظلي قادرة على وصف فائدة محددة ما زالت تظهر بوضوح حتى مع بعض التذبذب. إذا بقي هذا الجزء حاضرًا، فالأولوية تكون لضبط السياق حول المنتج بدل استبداله مباشرة.",
      },
      {
        heading: "ومتى يصبح تبديل المنتج مبررًا فعلًا؟",
        body: "عندما يعود الروتين إلى ثباته الطبيعي، ثم يتكرر التراجع نفسه بلا تفسير إضافي. هنا فقط يتحول المنتج نفسه إلى نقطة مراجعة حقيقية بدل أن يبقى المتهم الافتراضي مع كل تذبذب بسيط.",
      },
    ],
    faq: [
      {
        question: "هل keep المنتج يعني تجاهل التراجع في النتيجة؟",
        answer:
          "لا. المقصود هو ترتيب القرار بشكل صحيح: ثبّتي الروتين أولًا إذا كان هو العنصر الأكثر اضطرابًا، ثم احكمي على المنتج في سياق أكثر عدلًا.",
      },
      {
        question: "ما أول خطوة عملية إذا شككت أن الروتين هو المشكلة؟",
        answer:
          "ارجعي إلى أبسط نسخة ثابتة من الروتين الذي كان يعمل، ثم راقبي هل يبقى أثر المنتج حاضرًا بنفس الوضوح قبل أن تفتحي خيار الاستبدال.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "reorder-timing-when-bodycare-cadence-changes-between-weeks-and-seasons",
    issue: "Issue 17",
    pillar: "الروتينات العملية",
    category: "توقيت إعادة الطلب مع تغيّر cadence",
    title:
      "كيف تحكمين توقيت إعادة طلب bodycare عندما يتغير cadence بين الأسابيع والمواسم؟",
    deck:
      "إعادة الطلب لا يجب أن تتبع قرب النفاد وحده. في bodycare يتغير cadence بين أسابيع مزدحمة وأخرى أكثر انتظامًا، وبين طقس يدفعك لاستخدام أوسع وآخر أقل. هذا الدليل يبني توقيت reorder على نمط الاستخدام الفعلي لا على استعجال غير دقيق.",
    excerpt:
      "حين يتغير cadence بين الأسبوع والموسم، يحتاج reorder إلى منطق أوضح من مجرد انخفاض الكمية.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان cadence يتغير بوضوح بين الأسابيع أو المواسم، فاجعلي قرار reorder مبنيًا على استمرار الحاجة لا على شكل العبوة فقط. ما يهم هو هل سيكسر غياب الخطوة روتينًا حيًا هذا الشهر، أم أن الاستخدام نفسه صار متقطعًا بما يجعل إعادة الطلب استجابة مبكرة أكثر من اللازم.",
    takeaways: [
      "تبدل cadence يغيّر معنى depletion cue ولا يلغيها.",
      "إعادة الطلب الذكية تحمي عادة مستمرة، لا مجرد عبوة قاربت النهاية.",
      "الأسابيع المتقلبة والمواسم المختلفة تحتاج منطق توقيت لا رد فعل تلقائي.",
    ],
    relatedRoutine: "/routines/after-shower-body-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/bodycare",
      label:
        "ادخلي bodycare فقط بعد أن تحسمي هل cadence الحالي يبرر reorder يحمي الروتين فعلًا أم لا",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "كيف يربك تغيّر cadence قرار reorder؟",
        body: "لأنك قد تستهلكين المنتج بسرعة في أسابيع أكثر نشاطًا، ثم يهدأ الاستخدام فجأة. إذا تجاهلت هذا التفاوت، سيتحول قرب النفاد إلى إشارة مبالغ فيها لا تعكس الحاجة الحقيقية.",
      },
      {
        heading: "ما العلامة أن الوقت مناسب لإعادة الطلب رغم التذبذب؟",
        body: "أن يبقى الروتين نفسه حيًا ومتكررًا بوضوح، وأن يكون غياب الخطوة قادرًا على كسر الاستمرار خلال فترة قصيرة، لا أن يكون مجرد احتمال عام لأن الكمية صارت أقل.",
      },
      {
        heading: "ومتى يكون الانتظار أو إعادة ترتيب الاستخدام أذكى؟",
        body: "عندما يكون التغير في cadence هو القصة الأساسية، لا فاعلية الخطوة نفسها. هنا يفيدك ضبط الاستخدام أولًا أكثر من فتح reorder مبكر لا يخدم سوى رف ممتلئ.",
      },
    ],
    faq: [
      {
        question: "هل أطلب من جديد كلما لاحظت أن العبوة قربت تنتهي؟",
        answer:
          "ليس دائمًا. في bodycare يجب أن تقرئي قرب النفاد مع cadence الحالي: هل الاستخدام ثابت بما يكفي ليجعل الغياب مشكلة فعلية قريبًا أم لا.",
      },
      {
        question: "ما الفرق بين reorder ذكي وشراء احتياطي زائد؟",
        answer:
          "الـreorder الذكي مرتبط بعادة مستمرة وواضحة، أما الشراء الاحتياطي الزائد فيأتي عندما يكون الاستخدام نفسه متقلبًا أو موسميًا بشكل لا يبرر التكرار الآن.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "is-this-haircare-question-about-weather-recovery-or-true-product-mismatch",
    issue: "Issue 17",
    pillar: "الروتينات العملية",
    category: "توضيح fit في haircare قبل زيارة الفئة",
    title:
      "في haircare: هل السؤال عن تعافي الشعر بعد الطقس أم عن عدم توافق فعلي مع المنتج؟",
    deck:
      "بعض زيارات haircare collection تبدأ وكأنها بحث عن منتج مختلف، بينما السؤال الحقيقي يكون عن أثر الطقس أو الرطوبة أو التغيير المؤقت في شكل الشعر بعد أسبوع مضطرب. هذا الدليل يضيّق fit clarifier قبل أن يتحول التذبذب الموسمي إلى حكم دائم على المنتج.",
    excerpt:
      "قبل فتح haircare collection من جديد، ضيّقي هل المشكلة weather recovery أم product mismatch فعلي.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان التغير في الشعر ظهر مع تبدل الطقس أو الرطوبة أو السفر أو اختلاف الغسل والتجفيف، فالأولوية تكون لقراءة weather recovery لا لاعتبار المنتج غير مناسب فورًا. product mismatch الحقيقي يظهر عندما تبقى المشكلة نفسها رغم عودة الظروف وطريقة الاستخدام إلى الاستقرار النسبي.",
    takeaways: [
      "ليس كل يوم haircare أصعب يعني أن fit المنتج صار خاطئًا.",
      "الطقس والرطوبة يغيّران شكل الأداء قبل أن يلغيا ملاءمة المنتج.",
      "توضيح السؤال أولًا يمنع زيارة collection بدافع تشخيص غير دقيق.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    nextStep: {
      href: "/shop/haircare",
      label:
        "ادخلي haircare collection فقط بعد أن تحسمي هل المشكلة weather recovery أم mismatch يحتاج خيارًا مختلفًا",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما العلامة أن المشكلة مرتبطة بالطقس أو الرطوبة؟",
        body: "أن يظهر الاختلاف مع تغيّر واضح في الجو أو في طريقة التجفيف أو وقت العناية، ثم يخف عندما تعود الظروف المعتادة. هذا النمط يشير إلى weather response أكثر مما يشير إلى fit خاطئ من الأصل.",
      },
      {
        heading: "ومتى يصبح product mismatch هو الاحتمال الأقوى؟",
        body: "عندما تبقى نفس الملاحظة قائمة حتى بعد استقرار الطقس وعودة الروتين لطريقته المعتادة، وعندما لا يعود المنتج قادرًا على دعم النتيجة التي كان يخدمها من قبل بشكل يمكن وصفه بوضوح.",
      },
      {
        heading: "كيف يفيدك هذا clarifier قبل زيارة الفئة؟",
        body: "لأنه يمنعك من استخدام haircare collection كأداة تشخيص واسعة. عندما تعرفين هل المشكلة في recovery أم fit، تصبح الزيارة أقرب إلى قرار مفيد بدل تصفح دفاعي.",
      },
    ],
    faq: [
      {
        question: "هل الرطوبة وحدها تكفي لاتهام المنتج؟",
        answer:
          "لا. الرطوبة أو تغيّر الطقس قد يبدلان شكل الأداء مؤقتًا. اتهام المنتج يصبح منطقيًا فقط إذا بقيت المشكلة نفسها بعد استقرار الظروف وطريقة الاستخدام.",
      },
      {
        question: "ما أول شيء أراجعه قبل تغيير منتج haircare؟",
        answer:
          "راجعي ما إذا كان التغيير مرتبطًا بالجو أو بالروتين اليومي أو بطريقة التجفيف. إذا كان كذلك، فالسؤال ما زال عن recovery لا عن mismatch نهائي.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "after-you-pick-the-collection-which-finish-or-texture-doubt-belongs-to-the-pdp",
    issue: "Issue 17",
    pillar: "اختيار المنتج والشراء",
    category: "اعتراضات finish وtexture وusage قرب الـPDP",
    title:
      "بعد حسم collection: أي شك في finish أو texture أو usage يجب أن يجيب عنه الـPDP قبل الدفع؟",
    deck:
      "بعد أن تحسمي الفئة، لا ينبغي أن تعيدي الرحلة إلى المقارنة العامة. يبقى فقط السؤال الأضيق: هل الـPDP يجيب عن الشك القريب من الدفع حول finish أو texture أو طريقة الاستخدام، أم أن هذا الشك ما زال عامًا أكثر من اللازم؟",
    excerpt:
      "إذا كانت collection محسومة، فيجب أن يتحول الشك إلى PDP-specific objection لا إلى تصفح جديد.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "عندما تكون collection choice محسومة، يصبح دور الـPDP أن يحسم اعتراضًا واحدًا أو اثنين على الأكثر: هل finish قريب من النتيجة التي تريدينها، هل texture مناسبة لطريقة الاستخدام، وهل usage واضح بما يكفي ليمنع التردد الأخير قبل الدفع. إذا بقي الشك عامًا، فأنت لم تغادري مرحلة المقارنة بعد.",
    takeaways: [
      "الشك بعد حسم collection يجب أن يصير أضيق لا أوسع.",
      "الـPDP الجيد يجيب عن finish أو texture أو usage، لا يعيدك إلى سؤال الفئة من البداية.",
      "كلما ضاق الاعتراض، صار الطريق إلى checkout أكثر هدوءًا وصدقًا.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "اذهبي إلى الـPDP عندما يبقى فقط شك محدد عن finish أو texture أو usage قبل اتخاذ القرار",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما الفرق بين شك collection وشك PDP؟",
        body: "شك collection يكون عامًا: أي نوع؟ أي تغطية؟ أي اتجاه مناسب؟ أما شك الـPDP فيكون أضيق: هل هذا المنتج نفسه يحسم finish أو texture أو usage التي ما زالت معلقة قبل الدفع.",
      },
      {
        heading: "متى يكون finish أو texture اعتراضًا حقيقيًا؟",
        body: "عندما تكون المقارنة العامة انتهت بالفعل، ولا يبقى إلا ما إذا كانت الصيغة نفسها ستخدم طريقة الاستخدام والنتيجة المتوقعة. هنا يكون الـPDP هو المكان الصحيح للحسم.",
      },
      {
        heading: "ومتى يجب ألا تذهبي إلى الـPDP بعد؟",
        body: "إذا كان السؤال ما زال يدور حول نوع القاعدة أو مستوى التغطية أو فئة المنتج بشكل واسع. هذا يعني أن handoff إلى الـPDP جاء مبكرًا قبل اكتمال collection decision.",
      },
    ],
    faq: [
      {
        question: "هل كل شك بعد article يعني أنني جاهزة للـPDP؟",
        answer:
          "لا. الجاهزية للـPDP تعني أن الشك صار product-specific: عن هذا finish أو هذا texture أو هذا الاستخدام، لا عن الفئة الواسعة نفسها.",
      },
      {
        question: "ما أول شيء يجب أن يجيب عنه الـPDP هنا؟",
        answer:
          "الإجابة الأولى يجب أن تكون على الاعتراض الأقرب إلى الدفع: هل الصيغة نفسها مناسبة لما تبحثين عنه داخل الاستخدام الفعلي، لا هل الفئة مناسبة بشكل عام.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "when-mixed-second-cycle-proof-points-back-to-the-routine",
    issue: "Issue 16",
    pillar: "اختيار المنتج والشراء",
    category: "مقارنة المنتج بالروتين عند proof مختلط",
    title:
      "عندما يكون second-cycle proof مختلطًا: كيف تعرفين هل عليك تعديل الروتين أولًا أم مراجعة المنتج نفسه؟",
    deck:
      "ليست كل دورة ثانية مختلطة إشارة إلى أن المنتج صار غير مناسب. أحيانًا يكون جزء من النتيجة ما زال حاضرًا، بينما اختل السياق أو الترتيب أو توقع الحكم نفسه. هذا الدليل يبني مقارنة أوضح بين ما يرجع إلى المنتج وما يرجع إلى الروتين قبل أي قرار تبديل.",
    excerpt:
      "الـproof المختلط لا يحتاج حكمًا أسرع، بل مقارنة أدق بين دور المنتج وثبات الروتين حوله.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان بعض الأثر ما زال حاضرًا وبعضه تراجع، فلا تبدئي من فكرة أن المنتج فشل. ابدئي من سؤالين: هل ظل دوره داخل الروتين كما هو؟ وهل بقي الروتين نفسه ثابتًا بما يكفي للحكم؟ عندما تجيبين عنهما، يصبح القرار بين التعديل أو الاستبدال أوضح بكثير.",
    takeaways: [
      "وجود proof مختلط يعني أن المقارنة ما زالت مفتوحة، لا أن الحكم حُسم ضد المنتج.",
      "ما تراجع في النتيجة يجب أن يُقرأ مع ما بقي ثابتًا داخل الروتين.",
      "أحيانًا تكون الخطوة التالية الصحيحة هي مراجعة الروتين لا فتح بديل جديد فورًا.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/routines/morning-routine-oily-skin",
      label:
        "راجعي الروتين أولًا إذا كان proof الدورة الثانية مختلطًا قبل أن تعيدي فتح قرار استبدال المنتج",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "ما أول علامة على أن المشكلة قد تكون في الروتين لا في المنتج؟",
        body: "أن يبقى جزء من النتيجة موجودًا بينما يختفي جزء آخر مرتبط بالانتظام أو الترتيب أو توقيت الاستخدام. هذا لا يشبه فشلًا كاملًا بقدر ما يشبه قراءة ناقصة لدور المنتج داخل السياق اليومي.",
      },
      {
        heading: "متى يتحول proof المختلط إلى إشارة فعلية على مراجعة المنتج؟",
        body: "عندما يبقى الروتين ثابتًا، وتظل الظروف متقاربة، ومع ذلك يتكرر نفس التراجع الموصوف بوضوح. هنا فقط يصبح المنتج نفسه داخل دائرة المراجعة الحقيقية بدل أن يبقى المتهم الافتراضي.",
      },
      {
        heading: "كيف تمنعين المقارنة من الانزلاق إلى حكم عاطفي؟",
        body: "اكتبي ما بقي ناجحًا، وما تراجع، وما الذي تغير حول الاستخدام. هذه المقارنة البسيطة تجعل قرار التعديل أو التبديل أقرب إلى evidence عملي لا إلى انطباع سريع بعد دورة أقل حماسًا.",
      },
    ],
    faq: [
      {
        question: "هل وجود جزء ناجح وجزء متراجع يعني أن المنتج نصف مناسب فقط؟",
        answer:
          "ليس بالضرورة. قد يعني فقط أن الروتين لم يعد يمنح المنتج نفس الظروف ليؤدي الدور نفسه بوضوح.",
      },
      {
        question: "متى أذهب إلى صفحة المنتج بدل الروتين؟",
        answer:
          "عندما يصبح التراجع نفسه متكررًا مع ثبات الروتين، عندها تكون مراجعة المنتج أكثر منطقية من تعديل الخطوات المحيطة به.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "repeat-order-guardrails-when-depletion-cues-are-not-consistent",
    issue: "Issue 16",
    pillar: "الروتينات العملية",
    category: "حواجز إعادة الطلب عند cues غير ثابتة",
    title:
      "إذا كانت depletion cues غير ثابتة: ما guardrails إعادة الطلب التي تمنع شراء bodycare متكررًا بلا حاجة واضحة؟",
    deck:
      "بعض repeat orders تأتي لأن العلبة قربت من النهاية، لا لأن الروتين نفسه يحتاجها فعلا. هذا الدليل يوضح كيف تبنين guardrails أبسط: متى تكون إعادة الطلب حماية لعادة ثابتة، ومتى تكون مجرد استجابة لإشارات ناقصة أو متقطعة.",
    excerpt:
      "عندما تكون depletion cues ضعيفة أو متقلبة، تحتاج إعادة الطلب إلى guardrails أوضح لا إلى استعجال أكثر.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت إشارات النفاد غير منتظمة، فلا يكفي قرب انتهاء العبوة لتبرير repeat order. الأفضل أن تسألي: هل غياب الخطوة سيكسر فعلا روتينًا ثابتًا هذا الأسبوع؟ وهل الاستخدام متكرر بما يكفي ليجعل إعادة الطلب قرار استمرارية لا قرار عادة تلقائية؟",
    takeaways: [
      "ضعف depletion cue يعني أن القرار يحتاج guardrail إضافية قبل الدفع.",
      "قرب النفاد ليس أهم من ثبات الاستخدام.",
      "إعادة الطلب الجيدة تحمي عادة واضحة، لا مجرد رف فارغ قريبًا.",
    ],
    relatedRoutine: "/routines/after-shower-body-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/bodycare",
      label:
        "ادخلي bodycare فقط بعد تحديد ما إذا كانت إعادة الطلب ستحمي روتينًا ثابتًا أم تستجيب لإشارة نفاد غير كافية",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما أول guardrail يجب وضعها؟",
        body: "أن تربطي القرار بسلوك الاستخدام الفعلي خلال الأسبوع، لا بكمية المنتج المتبقية وحدها. إذا كان الاستخدام متقطعًا أصلًا، فالإشارة لا تزال أضعف من أن تبرر تكرار الشراء مباشرة.",
      },
      {
        heading: "متى تكون depletion cue غير كافية؟",
        body: "عندما تختلف من أسبوع لآخر، أو عندما لا تستطيعين وصف أثر غياب الخطوة بوضوح. هنا يصبح القرار أقرب إلى الاحتياط العام منه إلى حماية routine فعلي.",
      },
      {
        heading: "كيف تمنعين repeat order من التحول إلى افتراض دائم؟",
        body: "اسألي في كل مرة: هل أكرر ما ثبتت حاجتي إليه، أم أعيد شراء شيء لأنني اعتدت رؤيته في الروتين فقط؟ هذا السؤال وحده يوقف كثيرًا من التكرار غير المفيد.",
      },
    ],
    faq: [
      {
        question: "هل الأفضل الانتظار حتى تنفد العبوة تمامًا؟",
        answer:
          "ليس دائمًا. المهم هو ما إذا كان غيابها سيقطع روتينًا متكررًا فعلًا، لا مجرد الوصول إلى اللحظة الأخيرة.",
      },
      {
        question: "ما علامة أن إعادة الطلب ليست ضرورية الآن؟",
        answer:
          "أن يكون الاستخدام نفسه غير ثابت، أو أن أثر غياب الخطوة غير واضح بما يكفي لتبرير تكرار الشراء فورًا.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "is-your-hyaluronic-acid-search-about-layering-timing-or-category-fit",
    issue: "Issue 16",
    pillar: "المكوّنات بلا تعقيد",
    category: "توضيح layering وtiming قبل زيارة category",
    title:
      "بحثك عن hyaluronic acid: هل هو سؤال عن layering أم timing أم fit داخل الفئة قبل أن تدخلي skincare collection؟",
    deck:
      "أحيانًا يبدو البحث ingredient-led، لكنه في الحقيقة يسأل عن توقيت الخطوة أو ملاءمتها داخل الروتين أكثر من سؤاله عن الفئة نفسها. هذا الدليل يضيّق intent قبل زيارة collection حتى لا تتحول صفحة الفئة إلى بديل عن السؤال الأصلي.",
    excerpt:
      "قبل دخول skincare collection، ضيقي هل سؤال hyaluronic acid عندك عن التوقيت أو الترتيب أو fit داخل الروتين.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان سؤالك عن hyaluronic acid ما زال يدور حول متى أستخدمه، أو كيف أرتبه، أو ما إذا كان يناسب روتينك الحالي، فأنت لم تصلي بعد إلى سؤال category. عندها يكون clarifying the timing and fit أهم من فتح collection واسعة لن تعطيك الإجابة الدقيقة التي تبحثين عنها.",
    takeaways: [
      "ليس كل بحث عن hyaluronic acid يعني أن وقت زيارة الفئة قد حان.",
      "أسئلة layering وtiming أضيق من أسئلة category fit.",
      "كلما ضيّقت السؤال أولًا، صارت زيارة collection أقرب إلى قرار مفيد لا إلى تصفح زائد.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/skincare",
      label:
        "اذهبي إلى skincare collection فقط بعد أن تحسمي هل السؤال عن hyaluronic acid صار سؤال فئة لا سؤال توقيت أو ترتيب",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى يكون السؤال عن التوقيت لا عن الفئة؟",
        body: "عندما تدور الحيرة حول متى تدخل الخطوة في اليوم، أو مع أي خطوة تأتي قبلها أو بعدها. هنا لا يزال السؤال عمليًا داخل routine logic أكثر من كونه shopping logic.",
      },
      {
        heading: "ومتى يصبح fit داخل الفئة هو السؤال الحقيقي؟",
        body: "عندما تعرفين دور hyaluronic acid داخل الروتين لكنك تحتاجين فقط إلى تضييق الخيارات التي تخدم هذا الدور. هنا تبدأ category visit في أن تكون خطوة منطقية فعلًا.",
      },
      {
        heading: "كيف يمنع هذا clarifier زيارة collection مبكرًا؟",
        body: "لأنه يعيد ترتيب السؤال حسب حجمه الحقيقي. إذا كان السؤال لا يزال عن timing أو layering، فالتصفح الواسع لن يعوض غياب إجابة دقيقة في نقطة واحدة صغيرة لكنها حاسمة.",
      },
    ],
    faq: [
      {
        question: "هل البحث عن المكوّن يعني أنني جاهزة للتسوق؟",
        answer:
          "ليس دائمًا. قد يعني فقط أنك ما زلت تحتاجين فهم مكان الخطوة داخل الروتين قبل المقارنة بين فئات أو منتجات.",
      },
      {
        question: "ما العلامة أن collection أصبحت الخطوة الصحيحة؟",
        answer:
          "أن يكون دور المكوّن واضحًا، ويبقى فقط سؤال أي خيار داخل الفئة يخدم هذا الدور بشكل أفضل.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "when-the-collection-is-settled-what-should-the-pdp-answer-before-checkout",
    issue: "Issue 16",
    pillar: "اختيار المنتج والشراء",
    category: "handoff إلى PDP قبل checkout",
    title:
      "إذا كانت collection choice محسومة: ما السؤال الأخير الذي يجب أن يجيب عنه الـPDP قبل أن يصير القرار ready for checkout؟",
    deck:
      "بعد أن تُحسم الفئة، لا يجب أن تعيدك المقالة إلى تصفح جديد. هذا الدليل يوضح كيف ينتقل القرار من collection settled إلى PDP question: ما الاعتراض أو الغموض الأخير الذي يجب أن يحله المنتج نفسه قبل الدفع؟",
    excerpt:
      "عندما تحسمين الفئة، يصبح دور الـPDP أن يجيب عن السؤال الأخير لا أن يعيد فتح الرحلة من البداية.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت الفئة محسومة بالفعل، فالخطوة التالية ليست مزيدًا من التصفح بل تحديد السؤال الأخير الذي يخص المنتج نفسه: finish، fit، أو مدى استجابة المنتج للاعتراض الأقرب إلى الدفع. عندما يصبح هذا السؤال واضحًا، يتحول الـPDP من صفحة قراءة إلى صفحة قرار.",
    takeaways: [
      "بعد حسم collection، يجب أن يضيق السؤال إلى product-specific objection واحد أو اثنين.",
      "الـPDP الجيد لا يوسع الرحلة، بل يغلق آخر نقطة غموض قبل checkout.",
      "إذا بقي الاعتراض عامًا، فأنت لم تنته بعد من مرحلة collection فعلا.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "اذهبي إلى الـPDP عندما تكون الفئة محسومة ويبقى فقط السؤال الأخير عن fit أو finish أو objection قريب من الدفع",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما نوع السؤال الذي يجب أن يحله الـPDP؟",
        body: "سؤال ضيق ومباشر: هل هذا finish مناسب؟ هل هذا المنتج يحل الاعتراض الذي بقي بعد المقارنة؟ هل الصيغة نفسها أقرب إلى ما أحتاجه داخل الاستخدام الفعلي؟",
      },
      {
        heading: "متى لا يكون الـPDP هو الوجهة الصحيحة بعد؟",
        body: "عندما يبقى القرار نفسه عامًا بين أكثر من نوع أو finish أو مستوى تغطية. هنا تكون collection لم تُحسم بالكامل بعد، والعودة إلى المقارنة ما زالت منطقية.",
      },
      {
        heading: "كيف يجعل الـJournal هذا handoff أقصر؟",
        body: "بأن يحدد ما إذا كنت خرجت من المقالة بسؤال category أو بسؤال product. كلما احترم handoff هذا الفرق، صار الطريق إلى checkout أوضح وأهدأ.",
      },
    ],
    faq: [
      {
        question: "هل الذهاب إلى الـPDP يعني أن القرار جاهز تمامًا؟",
        answer:
          "ليس بالكامل، لكنه يعني أن الغموض المتبقي صار يخص المنتج نفسه لا الفئة العامة التي تنتمين إليها.",
      },
      {
        question: "ما العلامة أنني ما زلت داخل collection decision؟",
        answer:
          "أن يبقى سؤالك عن النوع أو مستوى التغطية أو finish بشكل عام، لا عن منتج واحد محدد داخل هذه الفئة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "compare-second-cycle-signals-before-switching-a-skincare-product",
    issue: "Issue 15",
    pillar: "اختيار المنتج والشراء",
    category: "مقارنة الدورة الثانية قبل التبديل",
    title:
      "قبل أن تبدلي منتج skincare ما زال يعمل جزئيًا: كيف تقارنين بين الدورة الأولى والثانية بطريقة تمنع قرارًا متسرعًا؟",
    deck:
      "المقارنة بين الدورتين لا يجب أن تبدأ من انطباع عام أو من ملل طبيعي بعد التكرار. هذا الدليل يبني second-cycle comparison logic أوضح: ما الذي يجب أن يبقى ثابتًا، وما الذي يُعد تراجعًا حقيقيًا، ومتى يصبح التبديل قرارًا منطقيًا فعلًا.",
    excerpt:
      "قرار التبديل بعد دورة ثانية يحتاج مقارنة ثابتة وواضحة، لا شعورًا عامًا بأن الحماس صار أقل.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان المنتج ما زال يعمل جزئيًا، فقارني بين الدورة الأولى والثانية على نفس الأساس: انتظام الاستخدام، الدور الحقيقي داخل الروتين، وما الذي تراجع فعلًا. بهذه الطريقة تفرقين بين تعب التكرار أو تغير الظروف، وبين إشارة حقيقية تقول إن المنتج لم يعد يخدمك بنفس القيمة.",
    takeaways: [
      "المقارنة الصحيحة بين الدورتين تبدأ من نفس المعايير لا من مزاج مختلف.",
      "التراجع الحقيقي يجب أن يكون قابلًا للوصف، لا مجرد إحساس عام بأن الأثر أضعف.",
      "قبل فتح بديل جديد، حددي أولًا هل ما تغير هو المنتج أم السياق المحيط به.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label:
        "راجعي صفحة المنتج فقط بعد مقارنة الدورتين على نفس الأساس ومعرفة هل الخلل في المنتج أم في الروتين حوله",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما الذي يجب أن يبقى ثابتًا عند المقارنة؟",
        body: "الانتظام، ترتيب الخطوات، وتوقعاتك من المنتج. إذا قارنت بين دورة أولى كانت فيها كل الظروف مضبوطة ودورة ثانية متقطعة، فأنت تقارنين بين سياقين مختلفين لا بين أداءين متشابهين.",
      },
      {
        heading: "متى يكون التراجع حقيقيًا لا مجرد انطباع؟",
        body: "عندما تقدرين على وصف ما اختفى بالضبط: هل قلّ الارتياح، أم صار ظهور النتيجة أبطأ، أم لم يعد المنتج يسند نفس الخطوة في الروتين؟ الوصف الواضح أهم من عبارة عامة مثل: لم يعد يعجبني كما كان.",
      },
      {
        heading: "متى يصبح التبديل منطقيًا فعلًا؟",
        body: "عندما يبقى الروتين ثابتًا ويظهر التراجع نفسه بصورة متكررة يمكن ملاحظتها، عندها فقط يصبح فتح بديل جديد أو تقليص الاعتماد على المنتج قرارًا منطقيًا بدل أن يكون رد فعل سريعًا.",
      },
    ],
    faq: [
      {
        question: "هل اختلاف إحساسي في الدورة الثانية علامة كافية على التبديل؟",
        answer:
          "ليس دائمًا. أحيانًا يكون السبب أن المقارنة نفسها غير عادلة لأن الانتظام أو السياق أو توقعات النتيجة تغيرت بين الدورتين.",
      },
      {
        question: "ما أول شيء أراجعه قبل أن أغيّر المنتج؟",
        answer:
          "راجعي ما إذا كان دوره داخل الروتين ما زال كما هو، وهل كنت تستخدمينه بنفس الوتيرة والترتيب، ثم احكمي على النتيجة بعد ذلك.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "depletion-versus-upgrade-before-you-repeat-a-bodycare-order",
    issue: "Issue 15",
    pillar: "الروتينات العملية",
    category: "النفاد مقابل الترقية قبل إعادة الطلب",
    title:
      "قبل إعادة طلب bodycare: متى يكون القرار إعادة تزويد فقط، ومتى يكون النفاد إشارة إلى ترقية مدروسة لا إلى شراء تلقائي؟",
    deck:
      "ليس كل نفاد يعني أنك تحتاجين الشيء نفسه مرة أخرى، وليس كل رغبة في الترقية علامة على نضج الروتين. هذا الدليل يوضح كيف تفصلين بين depletion cue يحمي عادة ثابتة، وبين upgrade cue يريد توسيعًا مدروسًا قبل repeat order جديد.",
    excerpt:
      "أفضل repeat order هو الذي يحمي روتينًا ثبتت قيمته، لا الذي يخلط بين النفاد والرغبة في التوسيع.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان غياب الخطوة سيكسر روتينًا ثابتًا، فأنت أمام قرار إعادة تزويد. أما إذا كان السؤال الحقيقي هو: هل أضيف خطوة أو أوسع الفئة؟ فهذه ليست إعادة طلب خالصة، بل قرار ترقية يحتاج حكمًا منفصلًا حتى لا يتحول النفاد إلى توسع غير ضروري.",
    takeaways: [
      "النفاد وحده لا يساوي الترقية.",
      "إعادة الطلب الذكية تحمي ما ثبتت قيمته داخل الروتين.",
      "عندما يتغير السؤال من الاستمرار إلى التوسيع، فأنت لم تعودي في نفس القرار.",
    ],
    relatedRoutine: "/routines/after-shower-body-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/bodycare",
      label:
        "ادخلي bodycare عندما يتضح هل المطلوب حماية خطوة ثابتة أم تقييم ترقية جديدة قبل إعادة الطلب",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما علامة إعادة التزويد الواضحة؟",
        body: "أن يكون غياب المنتج سيقطع عادة متكررة ومفيدة تعرفين أثرها داخل الأسبوع العادي. هنا يكون القرار استمرارية، لا استكشافًا.",
      },
      {
        heading: "ومتى يكون النفاد مجرد ذريعة للترقية؟",
        body: "عندما تكون الخطوة نفسها غير مستقرة بعد، أو عندما يظهر التفكير في إضافة منتجات جديدة فقط لأن العبوة اقتربت من النهاية. هنا الأفضل فصل قرار التوسع عن قرار الحماية.",
      },
      {
        heading: "كيف تمنعين repeat order من التحول إلى سلة أوسع بلا داع؟",
        body: "اسألي: هل أحتاج أن أحافظ على نفس النتيجة، أم أني أحاول تحسين شيء مختلف تمامًا؟ إذا كان الهدف الثاني حاضرًا، فهذه ترقية تحتاج تقييمًا منفصلًا قبل الدفع.",
      },
    ],
    faq: [
      {
        question: "هل كل خطوة في bodycare تستحق نفس سرعة إعادة الطلب؟",
        answer:
          "لا. الأولوية تكون للخطوة التي يعرف الروتين غيابها مباشرة، أما الخطوات الجانبية أو المتقطعة فلا تحتاج نفس الاستعجال.",
      },
      {
        question: "متى أؤجل الترقية رغم أن العبوة توشك على النفاد؟",
        answer:
          "عندما لا يكون الروتين نفسه قد استقر بعد، أو عندما تكون فكرة التوسيع ناتجة من الرغبة في التجربة لا من حاجة واضحة داخل الاستخدام اليومي.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "is-your-niacinamide-search-really-about-pigmentation-or-routine-stability",
    issue: "Issue 15",
    pillar: "المكوّنات بلا تعقيد",
    category: "تضييق بحث ingredient وconcern عالي النية",
    title:
      "بحثك عن niacinamide: هل هو فعلًا عن التصبغات أم عن ثبات الروتين نفسه؟ تضييق نية البحث قبل القرار",
    deck:
      "بعض زيارات البحث تبدو ingredient-led، لكنها في الحقيقة concern-led أو routine-led. هذا الدليل يوضح كيف تميزين بين سؤال عن التصبغات، وسؤال عن استقرار الروتين، حتى لا تدخلي صفحة صحيحة في توقيت خاطئ.",
    excerpt:
      "تضييق intent بين ingredient وconcern يمنع قرارًا مبكرًا مبنيًا على عنوان البحث بدل المشكلة الفعلية.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان بحثك عن niacinamide لا يزال يبحث عن معنى المشكلة نفسها، فأنت أقرب إلى concern page مثل التصبغات. أما إذا صار دور المكوّن واضحًا داخل روتينك وتحتاجين فقط إلى اختيار مكانه أو منتجه المناسب، فحينها تصبح صفحات ingredient أو product هي الوجهة الأدق.",
    takeaways: [
      "ليس كل بحث باسم مكوّن يعني أن القرار صار ingredient-first بالفعل.",
      "أحيانًا يكون سؤال التصبغات هو الأصل، وniacinamide مجرد طريقة لفهم الحل.",
      "كلما ضاق السؤال، اقتربت الصفحة التالية الصحيحة من product بدل concern.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/concerns/pigmentation",
      label:
        "ابدئي من concern التصبغات إذا كان السؤال ما زال عن المشكلة نفسها قبل الانتقال إلى المكوّن أو المنتج",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "متى يكون البحث عن niacinamide غطاءً لسؤال آخر؟",
        body: "عندما تكونين في الحقيقة لا تزالين تسألين: ما الذي أعالجه أولًا؟ وما نوع التغير الذي أريده؟ هنا يكون اسم المكوّن مجرد مدخل للبحث، لا القرار نفسه.",
      },
      {
        heading: "متى تكون صفحة concern أوضح من صفحة ingredient؟",
        body: "عندما تحتاجين ترتيب المشكلة، لا ترتيب المكوّنات. صفحة concern تساعدك على تعريف السؤال قبل أن تقرري هل niacinamide هو الأنسب أم مجرد خيار من عدة خيارات.",
      },
      {
        heading: "ومتى تصبح صفحة المكوّن أو المنتج هي الوجهة الصحيحة؟",
        body: "عندما يكون دور niacinamide صار واضحًا داخل الروتين، وعندما يتحول السؤال من: ما المشكلة؟ إلى: كيف أوظف هذا الدور بمنتج مناسب أو بخطوة مناسبة؟",
      },
    ],
    faq: [
      {
        question: "هل الذهاب إلى concern يعني أن بحثي عن المكوّن كان خاطئًا؟",
        answer:
          "لا. هذا يعني فقط أن القرار ما زال يحتاج تعريف المشكلة أولًا، ثم يعود إلى المكوّن في مرحلة أدق.",
      },
      {
        question: "ما العلامة التي تقول إنني جاهزة لصفحة المنتج؟",
        answer:
          "أن تقدري على وصف الدور الذي تريدينه من niacinamide داخل الروتين بجملة واضحة، بدل الاكتفاء بمعرفة اسمه أو فوائده العامة.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "after-a-journal-answer-when-do-you-open-the-collection-and-when-the-pdp",
    issue: "Issue 15",
    pillar: "اختيار المنتج والشراء",
    category: "الجسر من المقالة إلى مسار شراء جاهز",
    title:
      "بعد أن تعطيك المقالة الإجابة: متى تذهبين إلى collection، ومتى يكون الـPDP نفسه هو الخطوة الأقرب للشراء؟",
    deck:
      "ليس كل Journal bridge يجب أن يعيدك إلى التصفح الواسع. هذا الدليل يوضح متى تبقى collection هي الخطوة الصحيحة لتضييق المقارنة، ومتى يصبح الـPDP هو المسار الأقصر إلى قرار checkout-ready بدون فتح أسئلة جديدة.",
    excerpt:
      "الجسر الجيد بعد المقالة يجب أن يناسب ضيق القرار، لا أن يعيد التصفح من البداية مرة أخرى.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت المقالة ما زالت تترك أكثر من خيار منطقي مفتوحًا، فالcollection هي الخطوة التالية. أما إذا كانت الإجابة ضيقت القرار إلى وظيفة واضحة وشكل منتج شبه محسوم، فالـPDP يصبح أقرب مسار شراء لأن مزيدًا من التصفح لن يضيف وضوحًا حقيقيًا.",
    takeaways: [
      "الcollection مناسبة عندما يبقى أكثر من خيار حي داخل القرار.",
      "الـPDP يصبح صحيحًا عندما تكون الوظيفة والشكل المتوقعان شبه محسومين.",
      "الـJournal الجيد لا يطيل الرحلة، بل يختصرها إلى الصفحة الأنسب للحظة الحالية.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/products/velvet-base-foundation",
      label:
        "اذهبي إلى الـPDP فقط عندما تكون المقالة قد ضيقت القرار بما يكفي ولم يعد التصفح الواسع يضيف إجابة جديدة",
      destinationType: "product",
    },
    sections: [
      {
        heading: "متى تبقى collection هي الخطوة الصحيحة؟",
        body: "عندما تنهي المقالة وأنت تعرفين نوع القرار لكنك ما زلت تحتاجين مقارنة أكثر من خيار داخل نفس الفئة. هنا تكون collection أذكى لأنها تضيق الاختيار من دون قفزة مبكرة إلى منتج واحد.",
      },
      {
        heading: "ومتى يكون الـPDP أقرب إلى قرار checkout-ready؟",
        body: "عندما تكون المقالة قد أجابت عن الاعتراض الأساسي وحددتِ بالفعل نوع النتيجة والملمس والشكل الذي تبحثين عنه. هنا يصبح الـPDP خطوة تنفيذ لا خطوة استكشاف.",
      },
      {
        heading: "كيف يمنع هذا الجسر إعادة التصفح من الصفر؟",
        body: "لأن الصفحة التالية لا تُختار بقربها فقط، بل بدرجة ضيق القرار. كلما احترم الجسر هذه الدرجة، صار المسار أقصر وأهدأ وأقرب إلى الشراء الواضح.",
      },
    ],
    faq: [
      {
        question: "هل الذهاب مباشرة إلى الـPDP يعني أنني تجاوزت المقارنة؟",
        answer:
          "فقط إذا كانت المقالة قد أغلقت الاعتراض الأساسي فعلًا. إن بقي أكثر من خيار متقارب في ذهنك، فالعودة إلى collection تكون أنسب.",
      },
      {
        question: "ما العلامة أن collection ما زالت أفضل؟",
        answer:
          "أنك ما زلت تحتاجين مقارنة بين أكثر من finish أو شكل استخدام أو مستوى تغطية داخل نفس الفئة قبل ربط القرار بمنتج واحد.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "when-a-second-cycle-feels-weaker-before-you-blame-the-product",
    issue: "Issue 14",
    pillar: "اختيار المنتج والشراء",
    category: "اعتراض ما بعد الدورة الثانية",
    title:
      "عندما تبدو الدورة الثانية أضعف: كيف تعالجين الاعتراض قبل أن تلومي المنتج نفسه أو تغلقي الـPDP؟",
    deck:
      "ليس كل تراجع بعد إعادة الشراء دليلًا على أن المنتج فقد قيمته. هذا الدليل يوضح كيف تفصلين بين اعتراض ناتج من تغيّر الروتين المحيط، وبين اعتراض حقيقي على المنتج نفسه قبل اتخاذ قرار سلبي سريع.",
    excerpt:
      "الاعتراض الأقوى بعد إعادة الشراء لا يحتاج حكمًا أسرع، بل فحصًا أوضح لما تغيّر حول المنتج قبل اتهامه مباشرة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا شعرت أن الدورة الثانية أقل إقناعًا، فابدئي بمراجعة ما حول المنتج: وتيرة الاستخدام، ترتيب الروتين، وتوقعاتك نفسها. كثير من الاعتراضات تكون PDP-adjacent فعلًا، لكنها لا تعني أن المنتج هو المشكلة الأولى.",
    takeaways: [
      "التجربة الأضعف في الدورة الثانية لا تعني تلقائيًا أن المنتج فشل.",
      "ما تغير حول المنتج قد يكون أهم من المنتج نفسه.",
      "الرجوع إلى PDP يجب أن يأتي بعد فحص الاعتراض لا قبله.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label: "راجعي صفحة المنتج فقط بعد تحديد ما إذا كان الاعتراض في المنتج أم في الروتين المحيط به",
      destinationType: "product",
    },
    sections: [
      {
        heading: "ما أول شيء يجب فحصه؟",
        body: "هل ما زال الاستخدام يحدث بنفس الوتيرة وبنفس الترتيب؟ كثير من أحكام \"المنتج لم يعد يعمل\" تأتي بعد تغيّر بسيط في الروتين نفسه لا في المنتج.",
      },
      {
        heading: "متى يكون الاعتراض فعلًا على المنتج؟",
        body: "عندما يبقى الروتين ثابتًا وتبقى الظروف نفسها تقريبًا، ثم يتكرر التراجع بطريقة يمكن وصفها بوضوح. هنا فقط يصبح PDP وقرار الاستمرار أو التوقف أكثر منطقية.",
      },
      {
        heading: "كيف تمنعين إغلاق القرار بسرعة؟",
        body: "لا تنتقلي مباشرة من تجربة أقل إقناعًا إلى رفض كامل. حددي أولًا ما الذي تغيّر، وما الذي بقي ثابتًا، ثم اقرئي الاعتراض بهذه الصورة قبل ربطه بالمنتج وحده.",
      },
    ],
    faq: [
      {
        question: "هل اختلاف الدورة الثانية علامة سيئة دائمًا؟",
        answer:
          "لا. أحيانًا يكون فقط نتيجة تغير في الروتين أو في طريقة التقييم، لا في قيمة المنتج الأساسية نفسها.",
      },
      {
        question: "متى أعود فعلًا إلى الـPDP؟",
        answer:
          "بعد تضييق الاعتراض: هل المشكلة في المنتج نفسه أم في السياق المحيط به؟ عندها فقط تصبح قراءة الـPDP مفيدة.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "restock-timing-before-a-bodycare-routine-breaks-from-depletion",
    issue: "Issue 14",
    pillar: "الروتينات العملية",
    category: "توقيت إعادة التزويد",
    title:
      "قبل أن ينكسر روتين bodycare بسبب النفاد: ما إشارات restock الصحيحة ومتى يجب أن تتحركي؟",
    deck:
      "كثير من قرارات restock تأتي متأخرة بعد أن يتعطل الروتين نفسه. هذا الدليل يبني depletion cues أوضح: متى يعني النفاد أن الوقت مناسب لإعادة الشراء، ومتى يكون التوسع أو التأجيل هو القرار الأذكى؟",
    excerpt:
      "إشارات restock الجيدة تمنع كسر الروتين قبل أن تمنع نفاد العبوة فقط.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "أفضل توقيت لإعادة التزويد ليس عند اللحظة الأخيرة، ولا مبكرًا بلا داعٍ، بل عندما يصبح واضحًا أن غياب الخطوة سيكسر روتينًا متكررًا ثبتت قيمته. هنا يتحول depletion cue إلى قرار عملي لا إلى استعجال.",
    takeaways: [
      "النفاد مهم فقط إذا كان سيكسر عادة ثابتة.",
      "restock الذكي يمنع انقطاع المسار قبل أن يمنع الفراغ نفسه.",
      "كل خطوة لم تثبت قيمتها بعد لا تحتاج نفس سرعة إعادة التزويد.",
    ],
    relatedRoutine: "/routines/after-shower-body-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/bodycare",
      label: "راجعي bodycare عند ظهور إشارات restock مرتبطة بروتين ثابت لا بمجرد قرب النفاد",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما الإشارة الأقوى على أن الوقت مناسب؟",
        body: "أن تعرفي بوضوح ما الذي سيتعطل في الأيام العادية إذا غابت هذه الخطوة. إذا كانت الإجابة واضحة، فهذه إشارة أقوى من مجرد انخفاض مستوى العبوة.",
      },
      {
        heading: "متى يكون restock مبكرًا؟",
        body: "عندما لا تكون الخطوة نفسها قد دخلت بعد في عادة مستقرة، أو عندما يكون استخدامها متقطعًا وغير ثابت من أسبوع لآخر.",
      },
      {
        heading: "كيف تفرقين بين restock والتوسع؟",
        body: "إذا كان المطلوب هو حماية ما يعمل بالفعل، فهذا restock. أما إذا كان المطلوب إضافة شيء جديد لأن العبوة أوشكت على الانتهاء فقط، فالغالب أن القرار توسع لا إعادة تزويد.",
      },
    ],
    faq: [
      {
        question: "هل قرب النفاد وحده كافٍ لإعادة الشراء؟",
        answer:
          "ليس دائمًا. الأهم هو هل غياب هذه الخطوة سيكسر روتينًا متكررًا وواضح القيمة أم لا.",
      },
      {
        question: "كيف أعرف أنني أؤجل أكثر من اللازم؟",
        answer:
          "إذا كان الروتين نفسه يبدأ في التقطع لأنك تنتظرين اللحظة الأخيرة دائمًا، فهذه إشارة أن cue إعادة التزويد جاء متأخرًا.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "does-makeup-longwear-always-mean-a-heavier-base",
    issue: "Issue 14",
    pillar: "المشكلة والقرار الأول",
    category: "تصحيح myth عالي النية",
    title:
      "هل makeup longwear يعني دائمًا base أثقل؟ تصحيح myth شائع في بحث عالي النية قبل القرار",
    deck:
      "واحدة من أكثر فرضيات البحث العالي النية إرباكًا هي أن longwear لا يتحقق إلا بطبقة أثقل. هذا الدليل يفصل بين الثبات المدروس وبين الثقل الزائد، حتى لا تتحول نية البحث إلى قرار خاطئ من البداية.",
    excerpt:
      "تصحيح myth واحد في لحظة بحث عالية النية قد يمنع قرارًا خاطئًا كاملًا قبل دخول category أو المنتج.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "الثبات لا يساوي دائمًا ثقلًا أكبر. في كثير من الحالات يكون longwear نتيجة ترتيب أوضح، واختيار أذكى، وتوقع أدق، لا نتيجة قاعدة أكثر كثافة أو عدد طبقات أعلى.",
    takeaways: [
      "الثبات ليس مرادفًا للثقل.",
      "myth الشائع قد يدفع إلى category أو PDP غير مناسبين من البداية.",
      "تضييق البحث قبل الشراء يقلل الندم أكثر من أي مقارنة سريعة.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/concerns/makeup-longwear",
      label: "ادخلي concern الثبات بعد تصحيح myth الثقل بدل افتراض أن longwear يعني قاعدة أثقل",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "لماذا يعيش هذا الـmyth طويلًا؟",
        body: "لأنه يعطي إجابة سهلة على سؤال معقد: إذا أردتِ ثباتًا أكثر، أضيفي أكثر. لكن هذا التبسيط يحجب أسئلة أهم عن الترتيب، والملمس، ونقطة الاعتراض نفسها.",
      },
      {
        heading: "متى يكون الثقل فعليًا جزءًا من المشكلة؟",
        body: "عندما يتحول البحث عن الثبات إلى إضافة مستمرة بدون فحص هل المشكلة في القاعدة أصلًا أم في خطوة قبلها أو بعدها. هنا يصبح الـmyth عائقًا لا حلاً.",
      },
      {
        heading: "كيف يتحول التصحيح إلى قرار أوضح؟",
        body: "حين تفهمين أن longwear يمكن أن يأتي من fit أدق ومسار أوضح، لا من زيادة عامة في الكثافة. عندها تصبح زيارة concern أو product أدق بكثير.",
      },
    ],
    faq: [
      {
        question: "هل يمكن أن يكون المكياج ثابتًا بدون أن يصبح أثقل؟",
        answer:
          "نعم. كثير من قرارات الثبات ترتبط بالاختيار والترتيب أكثر من ارتباطها بإضافة ثقل أو طبقات أكبر.",
      },
      {
        question: "لماذا هذا myth خطير في البحث العالي النية؟",
        answer:
          "لأنه يدفع إلى قرار شرائي مبكر مبني على افتراض خاطئ، فيضيع الوقت داخل surfaces لا تعالج المشكلة الحقيقية.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "after-a-niacinamide-answer-should-you-open-the-category-or-the-product",
    issue: "Issue 14",
    pillar: "المكوّنات بلا تعقيد",
    category: "الجسر من الإجابة إلى القرار التجاري",
    title:
      "بعد أن تفهمي niacinamide: متى يجب أن تفتحي category، ومتى يكون المنتج نفسه هو الخطوة التالية؟",
    deck:
      "ليست كل إجابة ingredient-led يجب أن تقود إلى نفس الوجهة. هذا الدليل يوضح متى يكون category decision هو الخطوة الأصح، ومتى يكون المنتج نفسه هو الوجهة المنطقية بعد فهم niacinamide داخل الروتين.",
    excerpt:
      "الجسر الأقوى بعد الإجابة ليس دائمًا إلى نفس النوع من الصفحات؛ أحيانًا تحتاجين category، وأحيانًا تحتاجين product مباشرة.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان سؤالك ما يزال عن الفئة المناسبة أو شكل الحل، فابدئي من category. أما إذا صار دور niacinamide واضحًا داخل روتينك وتعرفين ما الذي تبحثين عنه، فالمنتج نفسه قد يكون الخطوة التالية الأكثر دقة.",
    takeaways: [
      "ليس كل فهم لمكوّن يقود إلى product مباشرة.",
      "category مفيد عندما تكون صيغة القرار أوسع من منتج واحد.",
      "product يصبح الوجهة الصحيحة عندما يكون الدور المطلوب محددًا بوضوح.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/shop/skincare",
      label: "ابدئي من category إذا كان السؤال ما يزال واسعًا، ثم اذهبي إلى المنتج عندما يصبح الدور أوضح",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى تكون الـcategory هي الخطوة الأصح؟",
        body: "عندما لا يكون قرارك قد ضاق بعد إلى خيار محدد، وعندما يكون السؤال ما يزال عن شكل الحل أو الفئة المناسبة أكثر من كونه عن منتج بعينه.",
      },
      {
        heading: "ومتى يصبح المنتج نفسه هو الوجهة الصحيحة؟",
        body: "عندما تعرفين ما الدور الذي تريدينه من niacinamide تحديدًا داخل الروتين، وما الذي سيجعلك تميزين المنتج المناسب من غيره.",
      },
      {
        heading: "كيف يمنع هذا الجسر قرارًا أبطأ أو أكثر ارتباكًا؟",
        body: "لأنه يختصر التشتت بين صفحات لا تخدم المرحلة نفسها. الوجهة الصحيحة بعد المقالة يجب أن تعكس ضيق السؤال لا مجرد وجود رابط قريب.",
      },
    ],
    faq: [
      {
        question: "هل الذهاب إلى category يعني أنني لست جاهزة للمنتج؟",
        answer:
          "ليس بالضرورة، لكنه يعني فقط أن القرار ما يزال أوسع من منتج واحد وأن تضييقه أولًا سيحسن الشراء.",
      },
      {
        question: "ما العلامة التي تقول إن المنتج هو الوجهة الأفضل؟",
        answer:
          "أن تقدري على وصف الدور المطلوب من المكوّن داخل روتينك في جملة واضحة، لا فقط أن تعرفي اسمه أو فوائده العامة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "post-conversion-proof-what-confirms-a-skincare-product-earned-a-second-cycle",
    issue: "Issue 13",
    pillar: "اختيار المنتج والشراء",
    category: "إثبات ما بعد الشراء",
    title:
      "بعد أول إعادة شراء ناجحة: ما الذي يثبت أن منتج skincare استحق فعلًا دورة ثانية وليس فقط انطباعًا جيدًا؟",
    deck:
      "نجاح أول دورة لا يكفي وحده لإثبات أن المنتج صار جزءًا ثابتًا من قرارك. هذا الدليل يوضح كيف تفرقين بين رضا مؤقت وبين post-conversion proof حقيقي يجعل إعادة الشراء الثانية منطقية ومقنعة.",
    excerpt:
      "إثبات ما بعد الشراء لا يبدأ من الحماس بعد أول نتيجة، بل من معرفة ما الذي تكرر بنجاح وجعل المنتج يستحق دورة ثانية.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "المنتج يستحق دورة ثانية عندما يمكنك وصف القيمة التي كررها داخل الروتين بوضوح: ما الذي حسّنه، ومتى ظهر، وكيف استمر. إذا كان الرضا عامًا فقط، فهذه إشارة لمراجعة الاستخدام قبل اتخاذ قرار تكرار جديد.",
    takeaways: [
      "إعادة الشراء الثانية تحتاج proof أوضح من الأولى.",
      "القيمة المتكررة أهم من الانطباع الأول الجيد.",
      "كل قرار post-conversion قوي يبدأ من وصف ما نجح لا من الرغبة في تكرار السلة نفسها.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/products/radiant-dew-serum",
      label: "راجعي المنتج فقط إذا كان دوره في الروتين صار موصوفًا بوضوح بعد دورة استخدام كاملة",
      destinationType: "product",
    },
    sections: [
      {
        heading: "متى يكون الانطباع الجيد غير كافٍ؟",
        body: "عندما يكون الشعور العام إيجابيًا لكنك لا تعرفين أي نتيجة بالضبط جعلت المنتج يبدو ناجحًا، أو عندما لا تستطيعين تحديد أين كان فارقًا داخل الروتين.",
      },
      {
        heading: "ما proof الذي يبرر دورة ثانية؟",
        body: "أن يتكرر الأثر داخل الاستخدام العادي: راحة أوضح، انتظام أسهل، أو نتيجة يمكن ملاحظتها من غير الحاجة إلى تفسير طويل في كل مرة. هنا فقط تصبح إعادة الشراء مبنية على evidence عملي.",
      },
      {
        heading: "ومتى يجب أن ترجعي خطوة للخلف؟",
        body: "إذا كان الرضا مرتبطًا بسياق مؤقت أو بفترة جيدة عابرة، لا بسلوك استخدام متكرر. عندها المراجعة أهم من التكرار التلقائي.",
      },
    ],
    faq: [
      {
        question: "هل النتيجة الجيدة مرة واحدة تكفي لإعادة الشراء؟",
        answer:
          "ليس دائمًا. الأفضل أن يكون النجاح متكررًا وقابلًا للوصف داخل الروتين الحقيقي قبل قرار دورة ثانية.",
      },
      {
        question: "هل أبدأ من PDP أم من الروتين؟",
        answer:
          "ابدئي من الروتين: ما الذي نجح فعلًا؟ بعد ذلك فقط يصبح الرجوع إلى PDP أقرب إلى قرار صحيح.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "replenishment-versus-bundle-return-on-repeat-visits",
    issue: "Issue 13",
    pillar: "اختيار المنتج والشراء",
    category: "إعادة الشراء أم العودة للمجموعة",
    title:
      "في الزيارة المتكررة: متى يكون replenishment الفردي أذكى، ومتى تستحق العودة إلى bundle أو beauty set؟",
    deck:
      "الزيارة الثانية أو الثالثة لا يجب أن تنتهي دائمًا بنفس نوع القرار. هذا الدليل يوضح متى تكون إعادة شراء عنصر واحد أكثر دقة، ومتى تكون العودة إلى bundle أو beauty set منطقية لأنها تخدم المسار كله لا عنصرًا واحدًا فقط.",
    excerpt:
      "الثقة في الزيارة المتكررة لا تأتي من تكرار نفس الشكل الشرائي، بل من معرفة متى يضيق القرار ومتى يتسع بأمان.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت القيمة الواضحة محصورة في عنصر واحد، فـ replenishment الفردي غالبًا أذكى. أما إذا كان الاستخدام الفعلي ما يزال يعتمد على ترتيب مجموعة أو bundle يخدم أكثر من خطوة، فالعَودة للمجموعة تصبح أكثر منطقية.",
    takeaways: [
      "الزيارة المتكررة لا تحتاج دائمًا إلى نفس شكل الشراء الأول.",
      "العنصر الفردي يكسب الأولوية عندما تكون قيمته أوضح من بقية المجموعة.",
      "العودة إلى bundle تكون صحيحة فقط عندما يخدم أكثر من نقطة ثابتة في الاستخدام.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "قارني بين العودة للمجموعة والشراء الفردي فقط بعد تحديد أين توجد القيمة المتكررة",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى يضيق القرار إلى replenishment فقط؟",
        body: "عندما يتضح أن عنصرًا واحدًا هو الذي حمل معظم القيمة داخل الاستخدام المتكرر، بينما بقية العناصر صارت هامشية أو أقل حضورًا في الروتين.",
      },
      {
        heading: "ومتى تبقى المجموعة منطقية؟",
        body: "إذا كان الاستخدام الفعلي ما يزال يعتمد على أكثر من خطوة مترابطة، وكانت المجموعة تختصر القرار وتمنع العودة إلى حيرة جديدة كل مرة.",
      },
      {
        heading: "كيف تمنعين الزيارة المتكررة من التحول إلى توسع غير ضروري؟",
        body: "راجعي ما الذي تكرر استخدامه فعلًا، وما الذي بقي فقط كخيار جميل لكنه غير أساسي. هذا يحدد هل القرار يجب أن يضيق أم يتسع.",
      },
    ],
    faq: [
      {
        question: "هل العودة إلى bundle تعني ثقة أعلى دائمًا؟",
        answer:
          "لا. الثقة الأعلى هي في القرار الأنسب للاستخدام الحقيقي، سواء كان فرديًا أو عبر مجموعة كاملة.",
      },
      {
        question: "ما أول علامة تقول إنني أحتاج شراءً فرديًا فقط؟",
        answer:
          "أن تقدري على تسمية العنصر الذي حمل القيمة بوضوح، وأن يصبح غياب بقية العناصر غير مؤثر فعليًا في الروتين.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "when-a-hyaluronic-acid-search-is-really-about-layering-comfort",
    issue: "Issue 13",
    pillar: "المكوّنات بلا تعقيد",
    category: "نية البحث الضيقة",
    title:
      "عندما يبدو السؤال عن hyaluronic acid: هل أنتِ تبحثين فعلًا عن المكوّن، أم عن layering مريح بدون خطوات أكثر؟",
    deck:
      "كثير من searches التي تبدو ingredient-led تكون في الحقيقة أسئلة أضيق عن الراحة والملمس وعدد الخطوات. هذا الدليل يضيق intent نفسه: هل تحتاجين فهم hyaluronic acid، أم تحتاجين فقط روتينًا أخف وأكثر راحة؟",
    excerpt:
      "تضييق نية البحث مهم لأن السؤال ليس دائمًا عن ingredient بحد ذاته، بل أحيانًا عن إحساس الاستخدام الذي تبحثين عنه.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان سؤالك عن hyaluronic acid يظهر فقط عندما يصبح الروتين ثقيلًا أو غير مريح، فالغالب أنك لا تبحثين عن ingredient جديد بقدر ما تبحثين عن layering أوضح. هنا يجب تضييق intent قبل توسيع القرار.",
    takeaways: [
      "ليست كل searches عن ingredient بحثًا عن ingredient فعلًا.",
      "الراحة والملمس أحيانًا هما السؤال الحقيقي خلف الاسم التقني.",
      "تضييق intent أولًا يمنع إضافة خطوات لا تخدم السبب الأصلي للسؤال.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/ingredients/hyaluronic-acid",
      label: "راجعي hyaluronic acid فقط إذا كان السؤال عن دوره نفسه لا عن ثقل layering أو راحته",
      destinationType: "ingredient",
    },
    sections: [
      {
        heading: "كيف تعرفين أن السؤال ليس عن ingredient نفسه؟",
        body: "إذا كان يظهر غالبًا عندما يصبح الروتين مزدحمًا أو عندما تفكرين في حذف خطوة لا في إضافة أخرى. هنا تكون نية البحث أقرب إلى comfort problem منها إلى ingredient research.",
      },
      {
        heading: "متى يكون ingredient page هو الوجهة الصحيحة؟",
        body: "عندما يكون السؤال فعلًا عن الدور المتوقع من hyaluronic acid داخل الروتين، لا عن كيفية جعل الروتين أخف أو أقل تزاحمًا في الأساس.",
      },
      {
        heading: "ومتى ترجعين إلى routine بدل ingredient؟",
        body: "إذا كان المطلوب هو ترتيب الخطوات أو تخفيفها. هنا تكون routine logic أقرب إلى الحل من التوسع في ingredient exploration.",
      },
    ],
    faq: [
      {
        question: "هل ثقل الروتين يعني أنني أحتاج ingredient مختلفًا؟",
        answer:
          "ليس بالضرورة. أحيانًا يعني فقط أن ترتيب الخطوات نفسه يحتاج مراجعة قبل البحث عن مكوّن إضافي.",
      },
      {
        question: "ما أفضل بداية إذا كان السؤال غير واضح؟",
        answer:
          "ابدئي من تحديد: هل المشكلة في feel الروتين أم في دور المكوّن؟ هذا وحده يغير الوجهة الصحيحة.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "from-a-journal-answer-to-a-routine-choice-before-checkout",
    issue: "Issue 13",
    pillar: "الروتينات العملية",
    category: "الجسر بين الإجابة والشراء",
    title:
      "من إجابة في الـJournal إلى routine choice قبل checkout: كيف تنتقلين بدون قفزة تربك القرار؟",
    deck:
      "أحيانًا تعطي المقالة إجابة مفيدة، لكن الخطوة التالية تبقى غامضة: هل أذهب إلى routine؟ إلى concern؟ إلى collection؟ هذا الدليل يبني bridge أوضح بين القراءة وبين الخطوة العملية الأقرب قبل checkout.",
    excerpt:
      "الانتقال الصحيح بعد المقالة لا يكون دائمًا إلى المنتج مباشرة، بل أحيانًا إلى routine choice يثبت القرار أولًا.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا خرجتِ من المقالة بفهم أوضح لكنك ما زلت غير متأكدة من ترتيب الاستخدام، فالخطوة التالية يجب أن تكون routine choice لا checkout مباشر. bridge الجيد يحول الفهم إلى ترتيب، ثم يحول الترتيب إلى قرار شراء أوضح.",
    takeaways: [
      "ليست كل إجابة تحريرية تقود مباشرة إلى checkout.",
      "أحيانًا يكون routine choice هو أقصر طريق إلى conversion آمن.",
      "الجسر الأقوى هو الذي يقلل القفزة بين الفهم والتنفيذ.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/routines/occasion-base-routine",
      label: "انتقلي أولًا إلى routine يثبت ترتيب القرار قبل أي خطوة checkout أقرب",
      destinationType: "routine",
    },
    sections: [
      {
        heading: "أين يحدث الارتباك بعد المقالة الجيدة؟",
        body: "حين تكون الإجابة واضحة نظريًا لكن التطبيق التالي غير محدد: هل تحتاجين بناء routine أم مجرد دخول collection؟ هنا تكون القفزة أكبر من اللازم.",
      },
      {
        heading: "متى يكون الـ routine هو الخطوة التالية الصحيحة؟",
        body: "عندما يكون السؤال التالي في ذهنك: بأي ترتيب أستخدم هذا؟ أو أين يدخل هذا القرار داخل يومي؟ هنا routine choice يختصر الحيرة قبل أي خطوة شراء.",
      },
      {
        heading: "ومتى يصبح الانتقال إلى collection أو PDP منطقيًا؟",
        body: "بعد أن يصبح الترتيب نفسه واضحًا. عندها فقط تكون surfaces التجارية امتدادًا منطقيًا لا قفزة غير مبررة.",
      },
    ],
    faq: [
      {
        question: "هل الرجوع إلى routine يعني أنني لست جاهزة للشراء؟",
        answer:
          "لا. قد يعني فقط أنك تحتاجين خطوة تنظيمية قصيرة تجعل الشراء أكثر دقة وأقل ترددًا.",
      },
      {
        question: "ما العلامة التي تقول إن المقالة لم تكمل مهمتها بعد؟",
        answer:
          "إذا خرجتِ منها بفهم نظري جيد لكن بلا فكرة واضحة عن الوجهة التالية داخل الموقع أو الروتين.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "commercial-proof-before-upgrading-good-enough-skincare-routine",
    issue: "Issue 12",
    pillar: "اختيار المنتج والشراء",
    category: "الدليل التجاري قبل الترقية",
    title:
      "قبل ترقية روتين skincare \"الجيد بما يكفي\": ما الدليل التجاري الذي يثبت أن الإضافة الجديدة تستحق الدخول؟",
    deck:
      "الروتين المقبول لا يحتاج دائمًا إلى ترقية سريعة. هذا الدليل يوضح ما الذي يجب أن يتأكد أولًا قبل إضافة خطوة أو منتج جديد: هل هناك فجوة متكررة فعلًا، وهل يمكن وصفها، وهل ستغير الإضافة القرار أم فقط توسّع السلة؟",
    excerpt:
      "الترقية الأذكى تبدأ من proof واضح على الفجوة الحقيقية، لا من شعور عام بأن الروتين يمكن أن يصبح أفضل.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الروتين الحالي يؤدي المطلوب الأساسي، فلا تدخلي خطوة جديدة إلا عندما تكون الفجوة نفسها متكررة وقابلة للوصف، وعندما تعرفين كيف ستخدم الإضافة هذه الفجوة تحديدًا. proof التجاري الجيد يسبق الشراء، ولا يأتي بعده.",
    takeaways: [
      "الفجوة المتكررة أهم من الرغبة العامة في التحسين.",
      "الترقية تستحق فقط عندما يكون دورها داخل الروتين واضحًا.",
      "كل إضافة غير مرتبطة بفجوة محددة تظل أقرب إلى توسعة سلة من قرار مدروس.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/shop/skincare",
      label: "راجعي skincare بعد تحديد الفجوة التي تحتاج دعمًا بدل ترقية عامة غير محسومة",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى لا تكون الترقية ضرورية؟",
        body: "عندما يكون الروتين الحالي مستقرًا ويعطي الإشارة الأساسية التي تحتاجينها، لكنك فقط تتوقعين أن كل إضافة جديدة ستسرّع النتيجة. هنا تكون المراجعة أهم من التوسع.",
      },
      {
        heading: "ما الدليل الذي يبرر خطوة جديدة؟",
        body: "أن تكون المشكلة أو الفجوة نفسها واضحة ومتكررة: راحة أقل، دعم غير كافٍ، أو نقطة لا يستوعبها الروتين الحالي. عندما تتحدد الفجوة، يصبح القرار التجاري أقرب إلى المنطق لا إلى التجريب.",
      },
      {
        heading: "كيف تمنعين الترقية من التحول إلى شراء زائد؟",
        body: "اسألي ما الوظيفة الدقيقة للإضافة الجديدة، ومتى ستدخل، وما الذي سيتغير بوجودها. إذا لم يكن ذلك واضحًا، فالغالب أن الوقت لم يحن بعد.",
      },
    ],
    faq: [
      {
        question: "هل الروتين الجيد بما يكفي يعني أنني أتوقف عن التطوير؟",
        answer:
          "لا. لكنه يعني أن أي تطوير لاحق يجب أن يكون مبنيًا على فجوة أوضح، لا على توتر من أن الروتين الحالي ليس مثاليًا.",
      },
      {
        question: "هل أبدأ من collection أم من تقييم الروتين؟",
        answer:
          "ابدئي من تقييم الروتين أولًا. بعدها فقط تصبح زيارة collection قصيرة ومبنية على قرار حقيقي.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "from-pigmentation-question-to-product-confidence-without-overpromising",
    issue: "Issue 12",
    pillar: "المشكلة والقرار الأول",
    category: "ثقة المنتج بدون مبالغة",
    title:
      "من سؤال التصبغات إلى ثقة المنتج: كيف تنتقلين من concern واضح إلى قرار شراء بدون وعود مبالغ فيها؟",
    deck:
      "الانتقال من concern مثل pigmentation إلى منتج فعلي يتعطل غالبًا بسبب قفزة غير مبررة بين المشكلة والشراء. هذا الدليل يشرح كيف تبنين product confidence تدريجيًا: من صياغة السؤال، إلى فهم الدور المتوقع، إلى قرار آمن لا يحمّل المنتج أكثر مما يستطيع.",
    excerpt:
      "ثقة المنتج لا تعني تصديق وعود أكبر، بل تعني فهمًا أدق لما يمكن أن يقدمه داخل concern واضح مثل التصبغات.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ابدئي من تعريف concern نفسه: هل الهدف تهدئة الارتباك، تحسين الانتظام، أم دعم مسار واضح بدأ بالفعل؟ عندما يتحدد هذا، يمكن للمنتج أن يدخل كجزء من قرار مفهوم بدل أن يتحول إلى وعد كامل بحل المشكلة وحده.",
    takeaways: [
      "كلما كان concern أوضح، كان دور المنتج أكثر واقعية.",
      "المنتج القوي لا يحمل وحده كل الحمل التفسيري للمشكلة.",
      "القرار الآمن يبدأ من توقع دقيق، لا من تضخيم النتيجة قبل الاستخدام.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/concerns/pigmentation",
      label: "ابدئي من concern التصبغات ثم انتقلي للمنتج بدور أوضح وتوقع أدق",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "أين يضيع القرار عادة؟",
        body: "عندما يتحول سؤال concern إلى بحث سريع عن \"أفضل منتج\" قبل تحديد ما المطلوب فعليًا من المنتج: هل المطلوب دعم انتظام، أم تقليل ارتباك، أم إضافة خطوة ذات وظيفة أوضح؟",
      },
      {
        heading: "كيف تبنين الثقة بدون overclaiming؟",
        body: "حددي ما الذي يمكن أن يقدمه المنتج داخل المسار، لا ما الذي يجب أن يحققه وحده. بهذه الطريقة يصبح الشراء أقرب إلى دعم منضبط لا إلى قفزة كبيرة في التوقعات.",
      },
      {
        heading: "ومتى تحتاجين الرجوع للـ concern بدل المنتج؟",
        body: "إذا كان السؤال نفسه ما يزال واسعًا أو غير ثابت من يوم لآخر. هنا يكون توضيح concern أهم من الانتقال المبكر إلى PDP أو collection.",
      },
    ],
    faq: [
      {
        question: "هل ثقة المنتج تعني أن النتيجة مضمونة؟",
        answer:
          "لا. تعني فقط أن دور المنتج داخل السؤال أوضح، وأن التوقع منضبط بما يكفي لاتخاذ قرار شراء أكثر أمانًا.",
      },
      {
        question: "ما الخطأ الشائع مع concerns مثل التصبغات؟",
        answer:
          "القفز من سؤال واسع إلى منتج واحد وكأنه يحمل كل الحل. الأفضل بناء القرار خطوة بخطوة من concern إلى routine ثم إلى product role.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "what-should-be-clear-before-you-open-beauty-sets-again",
    issue: "Issue 12",
    pillar: "أدلة السياق اليومي",
    category: "الجسر التحريري قبل الشراء",
    title:
      "قبل أن تفتحي beauty sets مرة أخرى: ما الذي يجب أن يكون واضحًا أولًا حتى لا تتحول الزيارة إلى hesitation جديد؟",
    deck:
      "ليست كل زيارة إلى beauty sets خطوة شراء ناضجة. أحيانًا تكون المقالة الجيدة هي التي تكشف أن ما ينقص ليس المزيد من الخيارات، بل clarity: هل الزيارة لبدء روتين، لإهداء، أم لتقليل الحيرة قبل checkout؟",
    excerpt:
      "الجسر التحريري الجيد لا يدفعك مباشرة إلى السلة، بل يوضح ما الذي يجب فهمه أولًا حتى تصبح الزيارة أقرب إلى conversion surface حقيقية.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "قبل فتح beauty sets، يجب أن تعرفي هل تريدين تقليل الحيرة، بناء بداية منظمة، أو اختيار شيء مناسب لسيناريو محدد. عندما تصبح نية الزيارة أوضح، تتحول collection من مساحة تردد إلى خطوة شراء قابلة للقياس.",
    takeaways: [
      "الوضوح يسبق المقارنة داخل المسارات التوسعية.",
      "المقال الجيد يختصر الحيرة قبل أن يوسع الاختيارات.",
      "الزيارة الأقرب إلى conversion تبدأ من سؤال محدد لا من تصفح مفتوح.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "ادخلي beauty sets بعد تحديد نية الزيارة بوضوح بدل تحويلها إلى تصفح مفتوح جديد",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى تكون المقالة جسرًا فعليًا إلى الشراء؟",
        body: "عندما تجعل الزيارة نفسها أوضح: هل أنت في مرحلة بداية، أم مقارنة، أم هدية، أم اختصار قرار؟ إذا أجابت المقالة عن هذا، فهي تقربك من الشراء أكثر من أي قائمة طويلة.",
      },
      {
        heading: "ما الذي يزيد hesitation بدل تقليله؟",
        body: "أن تبقى الزيارة بلا سيناريو محدد. هنا تصبح كل مجموعة محتملة، لكن لا شيء يبدو مقنعًا بما يكفي للانتقال إلى checkout أو حتى إلى قرار أولي واضح.",
      },
      {
        heading: "كيف تعرفين أن الوقت مناسب للانتقال من القراءة إلى collection؟",
        body: "عندما يصبح لديك next step واضح: بداية مرتبة، خيار هدية، أو اختصار مسار شراء متكرر. إذا غاب هذا، فالقراءة لم تنهِ مهمتها بعد.",
      },
    ],
    faq: [
      {
        question: "هل كل زيارة لـ beauty sets يجب أن تقود إلى checkout؟",
        answer:
          "لا. أحيانًا تكون النتيجة الصحيحة هي تضييق القرار أو تأجيله حتى تتضح نية الشراء بشكل أفضل.",
      },
      {
        question: "ما أفضل علامة على جاهزية الزيارة؟",
        answer:
          "أن تقدري على وصف سبب الزيارة في جملة واحدة قبل فتح collection. إذا لم تستطيعي، فالحيرة لم تُحل بعد.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "when-an-extra-haircare-step-earns-its-place-through-repeat-use",
    issue: "Issue 12",
    pillar: "الروتينات العملية",
    category: "منطق التوسع المتكرر",
    title:
      "متى تستحق خطوة haircare إضافية أن تدخل الروتين؟ عندما يثبت لها مكان واضح في repeat use لا في الحماس فقط",
    deck:
      "إضافة خطوة haircare جديدة تبدو سهلة، لكن قيمتها الحقيقية لا تظهر إلا إذا كان لها مكان يتكرر بوضوح داخل الروتين. هذا الدليل يشرح متى تكون الإضافة دعمًا حقيقيًا، ومتى تكون فقط توسعًا أسرع من الاستخدام.",
    excerpt:
      "الخطوة الإضافية تستحق مكانها عندما تثبت في الاستخدام المتكرر، لا عندما تبدو مغرية فقط داخل collection.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا لم يكن واضحًا متى ستدخل الخطوة الجديدة وكيف ستتكرر في الروتين الحالي، فهي لم تكسب مكانها بعد. repeat use هو اختبار القيمة، لا مجرد لحظة شراء ناجحة.",
    takeaways: [
      "القيمة الحقيقية لأي إضافة تظهر في تكرارها لا في انطباعها الأول.",
      "collection الأوسع لا تبرر خطوة جديدة إذا كان مكانها العملي غامضًا.",
      "التوسع الأكثر أمانًا هو الذي يدخل في روتين ثابت بدل أن ينافسه.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/haircare",
      label: "راجعي haircare فقط عندما تعرفين أين ستدخل الخطوة الجديدة وكيف ستتكرر",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما أول سؤال قبل إضافة خطوة جديدة؟",
        body: "متى ستُستخدم هذه الخطوة بالضبط، وفي أي ظرف، وهل ستدخل في الأيام العادية أم ستظل مرتبطة فقط بلحظات مثالية أو نادرة؟",
      },
      {
        heading: "كيف تعرفين أن الإضافة تخدم الروتين بدل أن تربكه؟",
        body: "إذا كانت تكمل خطوة ثابتة موجودة أصلًا وتدخل دون أن تزيد التردد أو تعقد الترتيب. أما إذا احتاجت تفسيرًا طويلًا في كل مرة، فهي لم تثبت بعد.",
      },
      {
        heading: "متى يكون التوسع مبكرًا؟",
        body: "عندما يكون الثبات نفسه ما يزال ضعيفًا، أو عندما لا تعرفين هل المشكلة في الروتين الحالي أم في الرغبة العامة في تحسينه. هنا يكون تثبيت الأساس أذكى من إضافة جديدة.",
      },
    ],
    faq: [
      {
        question: "هل كل إضافة جديدة تعتبر تطورًا؟",
        answer:
          "لا. أحيانًا يكون التطور الحقيقي هو جعل الروتين الحالي أكثر قابلية للتكرار قبل التفكير في أي توسعة.",
      },
      {
        question: "كيف أعرف أن الخطوة الجديدة كسبت مكانها؟",
        answer:
          "عندما يتكرر استخدامها دون مجهود ذهني كبير، ويصبح غيابها ملحوظًا داخل الروتين لا فقط على مستوى الانطباع الأول.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "proof-before-switching-a-skincare-routine-that-almost-works",
    issue: "Issue 11",
    pillar: "اختيار المنتج والشراء",
    category: "ترتيب الإثبات قبل التغيير",
    title:
      "قبل تغيير روتين skincare يعمل جزئيًا: ما الدليل الذي يثبت ما يجب إبقاؤه وما يجب تغييره؟",
    deck:
      "حين يكون الروتين مقبولًا لكنه غير محسوم، يكون أكبر خطأ هو تغيير كل شيء مرة واحدة. هذا الدليل يرتب proof أبسط: ما الخطوة التي تحمل النتيجة فعلًا، وما الذي يمكن مراجعته بدون هدم المسار كله.",
    excerpt:
      "ثقة الشراء والتعديل لا تأتي من كثرة التبديل، بل من معرفة أين توجد الإشارة الأقوى داخل الروتين الذي يعمل جزئيًا.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الروتين يعطي نتيجة جزئية يمكن وصفها، فابدئي بتثبيت العنصر أو الخطوة التي تبدو مسؤولة عن هذا التحسن قبل التفكير في تغيير كل ما حولها. proof الجيد لا يبدأ من منتج جديد، بل من فهم ما الذي كان يعمل بالفعل.",
    takeaways: [
      "عندما يعمل الروتين جزئيًا، فإن ترتيب الإثبات أهم من سرعة الاستبدال.",
      "القرار الأقوى يبدأ بتثبيت الخطوة التي صنعت الفرق قبل توسيع التغيير.",
      "زيارة collection أو PDP تصبح أوضح عندما تعرفين ما الذي تبحثين عن دعمه تحديدًا.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/shop/skincare",
      label: "راجعي مسارات skincare بعد تحديد ما الذي يحتاج دعمًا بدل تغيير الروتين كله",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما أول دليل يجب أن تبحثي عنه؟",
        body: "هل التحسن يظهر في ملمس البشرة، في الهدوء، أم في سهولة استمرار الروتين نفسه؟ عندما تحددين نوع التحسن، يصبح من السهل معرفة أي خطوة تستحق أن تبقى ثابتة وأي خطوة يمكن مراجعتها.",
      },
      {
        heading: "متى يكون تغيير منتج واحد كافيًا؟",
        body: "عندما تكون بنية الروتين نفسها منطقية، لكن عنصرًا واحدًا لا يدخل بسلاسة أو لا يعطي الدعم المتوقع. هنا يكون التعديل المحدود أكثر ذكاءً من إعادة بناء كل المسار من البداية.",
      },
      {
        heading: "ومتى يصبح التغيير الأوسع منطقيًا؟",
        body: "إذا كان الروتين لا يعطي إشارة واضحة أصلًا، أو إذا كان التحسن يظهر مرة ويختفي مرات. في هذه الحالة، أنت لا تحتاجين فقط منتجًا مختلفًا، بل ترتيبًا أوضح لطريقة الاستخدام نفسها.",
      },
    ],
    faq: [
      {
        question: "هل النجاح الجزئي يعني أن الروتين مناسب بالكامل؟",
        answer:
          "ليس دائمًا. لكنه يعني غالبًا أن هناك جزءًا صحيحًا يستحق التثبيت قبل اتخاذ قرارات أوسع وأكثر تكلفة.",
      },
      {
        question: "هل أزور collection أم أعود للروتين أولًا؟",
        answer:
          "ابدئي من السؤال داخل الروتين: ما الذي يحتاج دعمًا؟ بعد ذلك تصبح زيارة collection أقصر وأقرب إلى قرار صحيح.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "resolve-the-objection-before-restarting-base-makeup",
    issue: "Issue 11",
    pillar: "المشكلة والقرار الأول",
    category: "حل الاعتراض قبل إعادة البداية",
    title:
      "قبل أن تعيدي base makeup من الصفر: كيف تحلين الاعتراض الفعلي بدل إعادة كل الخطوات؟",
    deck:
      "كثير من اعتراضات المكياج لا تحتاج restart كامل، بل تحتاج تعريفًا أدق للمشكلة: هل الاعتراض في اللمعان، في الأطراف، في الراحة، أم في التوقع نفسه؟ هذا الدليل يحول الاعتراض إلى قرار يمكن التعامل معه.",
    excerpt:
      "حل الاعتراض الحقيقي يقلل إعادة البداية غير الضرورية، ويجعل قرار المكياج أقرب إلى proof عملي لا إلى خوف متكرر.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا عرفتِ أين يبدأ الاعتراض فعلًا، يمكنك دعم القاعدة أو تعديل جزء صغير منها بدل إعادة كل base makeup. القرار الأقوى لا يسأل هل المكياج مثالي، بل هل المشكلة محددة وقابلة للتدخل المحدود.",
    takeaways: [
      "الاعتراض غير المحدد يدفع إلى قرارات مبالغ فيها.",
      "المكياج الأقوى لا يعني صفر تصحيح، بل يعني معرفة موضع التصحيح وحدوده.",
      "كلما صار الاعتراض أوضح، صار route القرار أقصر وأقل توترًا.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/makeup",
      label: "ادخلي makeup بعد تحديد الاعتراض الفعلي بدل افتراض أن كل القاعدة تحتاج إعادة",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما الاعتراض الذي يفسد القرار غالبًا؟",
        body: "أن يتحول أي تراجع بسيط إلى شعور بأن base makeup كله غير صالح. هذا يوسع المشكلة أكثر من حجمها الحقيقي، ويجعل القرار أثقل من اللازم.",
      },
      {
        heading: "كيف تحولين الاعتراض إلى نقطة فحص؟",
        body: "راقبي هل الاعتراض يتكرر في الموضع نفسه وفي التوقيت نفسه. إذا كانت الإجابة نعم، فأنت أمام نقطة تدخل واضحة. أما إذا كان الشعور عامًا وغير محدد، فالمشكلة في التوقع أو في طريقة التقييم نفسها.",
      },
      {
        heading: "متى تعيدين البداية فعلًا؟",
        body: "عندما تصبح القاعدة نفسها غير مريحة أو غير قابلة للبناء من البداية، لا عندما تحتاج فقط إلى دعم خفيف أو تعديل محدود قبل المساء.",
      },
    ],
    faq: [
      {
        question: "هل كل اعتراض يعني أن المنتج غير مناسب؟",
        answer:
          "لا. أحيانًا الاعتراض مرتبط بطريقة الاستخدام أو بالسياق اليومي أكثر من ارتباطه بفشل كامل في المنتج.",
      },
      {
        question: "كيف أعرف أنني أبالغ في إعادة الخطوات؟",
        answer:
          "إذا كنت تعيدين القاعدة كاملة مع أن المشكلة تتكرر في نقطة واحدة فقط، فالغالب أنك توسعين التدخل أكثر من اللازم.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "enter-beauty-sets-with-a-clear-next-step-not-open-ended-browsing",
    issue: "Issue 11",
    pillar: "أدلة السياق اليومي",
    category: "الانتقال الواضح للمسار التوسعي",
    title:
      "قبل دخول beauty sets مرة أخرى: ما الخطوة التالية الواضحة التي تبحثين عنها بدل التصفح المفتوح؟",
    deck:
      "الزيارة غير المحددة لـ beauty sets تجعل كل الخيارات تبدو متشابهة أو مبالغًا فيها. هذا الدليل يحول الزيارة إلى next step واضح: تجربة أولى، إعادة بناء مسار، هدية، أو دعم روتين قائم.",
    excerpt:
      "المسارات التوسعية تنجح عندما تكون الزيارة مرتبطة بسيناريو واضح، لا عندما تكون مجرد تصفح بحثًا عن أي شيء يبدو مناسبًا.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "قبل فتح beauty sets، حددي هل تريدين اختصار قرار، بناء بداية أسهل، أو دعم روتين موجود. عندما تكون الخطوة التالية واضحة، يصبح collection نفسه أداة قرار بدل أن يتحول إلى مساحة تردد.",
    takeaways: [
      "المسار التوسعي يحتاج next step واضحًا قبل أي مقارنة.",
      "الزيارة المحددة تقلل التصفح العشوائي وتزيد جودة القرار.",
      "ربط المجموعة بسيناريو استخدام أقوى من ربطها بعنوان عام فقط.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "ادخلي beauty sets بسيناريو واضح وخطوة تالية محددة بدل تصفح مفتوح",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما الذي يجعل الزيارة غير مثمرة؟",
        body: "أن تدخلي collection وأنت لا تعرفين هل تحتاجين بداية أسهل، دعمًا لمسار قائم، أم هدية. هنا تصبح المقارنة واسعة بلا داعٍ ويضيع السبب الأساسي للزيارة.",
      },
      {
        heading: "كيف تحولين الزيارة إلى خطوة تالية؟",
        body: "اكتبي لنفسك السؤال بصيغة تنفيذية: هل أريد تقليل الحيرة؟ هل أريد جمع العناصر التي أثبتت فائدتها؟ هل أريد هدية بسيناريو واضح؟ هذه الصياغة تختصر الطريق مباشرة.",
      },
      {
        heading: "متى تكون المجموعة أوضح من الشراء الفردي؟",
        body: "عندما يكون الهدف هو تسهيل القرار أو بدء مسار له ترتيب معروف. أما إذا كان الاحتياج محصورًا في عنصر واحد ثابت القيمة، فالمجموعة ليست دائمًا الخطوة الأفضل.",
      },
    ],
    faq: [
      {
        question: "هل كل زيارة لـ beauty sets يجب أن تنتهي بمجموعة؟",
        answer:
          "لا. أحيانًا تكون الزيارة مفيدة فقط لتأكيد أن الاحتياج الحقيقي أضيق من ذلك وأن الشراء الفردي هو المسار الأنسب.",
      },
      {
        question: "ما أفضل سؤال أبدأ به قبل التصفح؟",
        answer:
          "ما الخطوة التالية التي أريدها من هذه الزيارة تحديدًا؟ كلما كان السؤال أوضح، كان القرار أقرب وأقل ترددًا.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "repeat-use-logic-before-adding-more-to-bodycare",
    issue: "Issue 11",
    pillar: "الروتينات العملية",
    category: "منطق التكرار قبل التوسع",
    title:
      "قبل إضافة خطوات جديدة إلى bodycare: كيف تبنين منطق تكرار استخدام يدعم الشراء بدون مبالغة؟",
    deck:
      "التوسع في bodycare قبل ثبات الاستخدام يجعل الشراء التالي أثقل لا أذكى. هذا الدليل يوضح كيف تبنين repeat-use logic يجعل التكرار مفيدًا وقابلًا للاستمرار قبل التفكير في أي إضافة جديدة.",
    excerpt:
      "الشراء الأذكى في bodycare يبدأ من عادة تتكرر بسهولة، لا من سلة تكبر أسرع من قدرة الاستخدام.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كنت تريدين شراءً لاحقًا أكثر ثقة، فابدئي أولًا بتثبيت نسخة bodycare التي تعود بسهولة في الأيام العادية. repeat-use logic القوي يحدد متى تكون الإضافة دعمًا حقيقيًا، ومتى تكون فقط توسعًا مبكرًا.",
    takeaways: [
      "العادة المستقرة تسبق أي توسع ذكي في السلة.",
      "الشراء التالي يجب أن يخدم استخدامًا متكررًا لا نية مؤقتة.",
      "كل إضافة لا تدخل في المسار العادي بسرعة تظل أضعف من خطوة ثابتة قابلة للتكرار.",
    ],
    relatedRoutine: "/routines/after-shower-body-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/bodycare",
      label: "ابني bodycare يمكن تكراره أولًا ثم وسعيه فقط عندما يثبت في الاستخدام",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "لماذا يسبق التكرار التوسع؟",
        body: "لأن bodycare إذا لم يدخل في الأيام العادية، فلن تحل المشكلة إضافة جديدة. العادة هي التي تمنح الشراء التالي معنى، لا العكس.",
      },
      {
        heading: "ما الإشارة التي تقول إن الوقت مناسب للإضافة؟",
        body: "أن يصبح المسار الحالي ثابتًا بما يكفي لتعرفي أين توجد القيمة الأساسية، وأين توجد فجوة حقيقية تستحق دعمًا إضافيًا.",
      },
      {
        heading: "متى يكون التوسع مبكرًا؟",
        body: "عندما تكون الرغبة في الشراء أسرع من استقرار الاستخدام نفسه. هنا يصبح القرار استجابة للحماس لا لاحتياج يتكرر بوضوح.",
      },
    ],
    faq: [
      {
        question: "هل تقليل الخطوات يضعف bodycare؟",
        answer:
          "لا. أحيانًا يكون هذا هو السبب الحقيقي في استمرار الروتين بدل تحوله إلى نية جيدة لا تتكرر.",
      },
      {
        question: "كيف أعرف أن الشراء التالي سيخدم العادة فعلًا؟",
        answer:
          "إذا كان واضحًا أين سيدخل في المسار الحالي ومتى سيُستخدم. إذا لم يكن هذا واضحًا، فالأفضل تثبيت الموجود أولًا.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "repeat-purchase-confidence-after-a-successful-set-or-routine",
    issue: "Issue 10",
    pillar: "اختيار المنتج والشراء",
    category: "ثقة إعادة الشراء",
    title: "بعد نجاح مجموعة أو روتين واضح: كيف تعيدين الشراء بثقة بدون تردد زائد؟",
    deck:
      "نجاح أول دورة لا يجعل قرار الشراء التالي تلقائيًا دائمًا. هذا الدليل يوضح متى تكون إعادة الشراء استمرارًا منطقيًا، ومتى تحتاج وقفة قصيرة لمراجعة ما الذي نجح فعلًا قبل تكرار السلة نفسها.",
    excerpt:
      "ثقة إعادة الشراء لا تعني الشراء الأعمى، بل فهم العنصر أو المجموعة التي أثبتت قيمتها داخل استخدام حقيقي يمكن تكراره.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان النجاح مرتبطًا بمسار واضح يمكن وصفه وتكراره، فإعادة الشراء منطقية. أما إذا كان الرضا عامًا لكن الاستخدام نفسه متذبذب أو غير واضح، فالأفضل مراجعة ما الذي صنع النتيجة قبل إعادة القرار بالكامل.",
    takeaways: [
      "إعادة الشراء القوية تبنى على وضوح ما نجح فعلًا لا على الانطباع العام فقط.",
      "الثقة ترتفع عندما يكون الاستخدام الحقيقي قابلًا للتكرار لا مجرد تجربة موفقة مرة واحدة.",
      "المراجعة القصيرة قبل إعادة الشراء تحمي من تكرار سلة لا تخدم نفس النتيجة.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "راجعي خيارات المجموعات المناسبة عندما تريدين إعادة شراء مبنية على استخدام ناجح",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى تكون إعادة الشراء استمرارًا صحيحًا؟",
        body: "عندما تعرفين أي جزء من المجموعة أو الروتين كان مسؤولًا عن النتيجة، وكيف دخل في إيقاعك اليومي أو الأسبوعي. هنا يصبح القرار مبنيًا على نمط استخدام لا على حماس لحظي.",
      },
      {
        heading: "ومتى تحتاجين مراجعة قصيرة قبل التكرار؟",
        body: "إذا كان النجاح غير محدد المصدر أو كان الالتزام نفسه متقطعًا. التوقف القصير هنا لا يبطئك، بل يمنع شراء نسخة جديدة من قرار غير محسوم.",
      },
      {
        heading: "كيف تتحولين من رضا عام إلى ثقة عملية؟",
        body: "اكتبي لنفسك ما الذي عمل، ومتى، وبأي وتيرة. كلما صار السبب أوضح، صار قرار إعادة الشراء أخف وأكثر دقة.",
      },
    ],
    faq: [
      {
        question: "هل نجاح المجموعة مرة واحدة يكفي لإعادة شرائها؟",
        answer:
          "ليس دائمًا. الأفضل أن يكون النجاح مرتبطًا باستخدام واضح ومتكرر، لا بنتيجة جيدة يصعب تفسيرها أو إعادة بنائها.",
      },
      {
        question: "متى أرجع لمنتج واحد بدل المجموعة كاملة؟",
        answer:
          "عندما يتضح أن عنصرًا محددًا هو الذي يحمل القيمة الأساسية، بينما بقية المجموعة لم تعد جزءًا ثابتًا من الاستخدام الفعلي.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "makeup-proof-and-objection-handling-for-day-to-evening-transitions",
    issue: "Issue 10",
    pillar: "المشكلة والقرار الأول",
    category: "إثبات الثبات",
    title: "ثقة المكياج من النهار إلى المساء: كيف تتعاملين مع الاعتراضات قبل أن تفسد القرار؟",
    deck:
      "اعتراضات الثبات لا تبدأ عند التطبيق، بل عند التردد نفسه: هل سيصمد؟ هل سأحتاج إعادة كبيرة؟ هل المظهر سيتعب قبل المساء؟ هذا الدليل يعيد القرار إلى proof عملي بدل شك متكرر.",
    excerpt:
      "الهدف ليس وعدًا مثاليًا بالثبات، بل منطقًا أوضح للتعامل مع الانتقال من يوم عادي إلى مساء أطول بدون تضخيم المخاطر.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ثقة الانتقال من النهار إلى المساء تأتي من فهم حدود القاعدة نفسها: ما الذي تحمله جيدًا، ومتى تحتاجين دعمًا خفيفًا، ومتى يصبح الاعتراض إشارة إلى مسار مختلف لا إلى خوف عام من النتيجة.",
    takeaways: [
      "الاعتراضات تقل عندما تتحول إلى أسئلة عملية قابلة للإجابة.",
      "الثبات لا يعني غياب أي تصحيح، بل وضوح ما يمكن أن يحتاج تدخلًا بسيطًا.",
      "قرار المساء الأفضل يعتمد على proof الاستخدام لا على القلق من أسوأ سيناريو.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/concerns/makeup-longwear",
      label: "راجعي صفحة ثبات المكياج لبناء قرار أوضح قبل الانتقال من النهار إلى المساء",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "ما أكثر اعتراض يربك قرار المساء؟",
        body: "الخوف من أن أي تراجع بسيط يعني فشل النتيجة كلها. هذا يجعل القرار متوترًا من البداية، بينما الحقيقة أن كثيرًا من الانتقالات تحتاج فقط توقعًا أفضل لا تغييرًا كاملًا.",
      },
      {
        heading: "كيف تحولين الاعتراض إلى proof؟",
        body: "اسألي: ما الذي يحدث عادة بعد ساعات؟ هل المشكلة في اللمعان، الأطراف، أو الراحة؟ عندما يتحدد الاعتراض، يصبح الحل أدق من رفض المسار كله.",
      },
      {
        heading: "متى تحتاجين تغيير المسار لا فقط دعمه؟",
        body: "إذا كان الاعتراض يتكرر في نفس النقطة وبنفس الشكل رغم تعديل بسيط، فهذه إشارة إلى أن القاعدة الأصلية لا تناسب الانتقال المطلوب كما ينبغي.",
      },
    ],
    faq: [
      {
        question: "هل كل انتقال من النهار إلى المساء يحتاج إعادة كاملة؟",
        answer:
          "لا. كثير من الحالات تحتاج فقط دعمًا محدودًا إذا كانت القاعدة الأساسية ما زالت محافظة على شكلها وراحتها.",
      },
      {
        question: "كيف أعرف أن المخاوف مبالغ فيها؟",
        answer:
          "إذا كانت قائمة على افتراضات عامة لا على تجربة متكررة. راقبي ما يحدث فعلًا في استخدامك بدل توقع مشكلة قبل ظهورها.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "haircare-fit-notes-that-reduce-hesitation-before-collection-visits",
    issue: "Issue 10",
    pillar: "اختيار المنتج والشراء",
    category: "ملاحظات الملاءمة",
    title: "ملاحظات ملاءمة الشعر التي تقلل التردد قبل زيارة قسم haircare",
    deck:
      "التردد قبل دخول collection haircare غالبًا لا يأتي من نقص الخيارات، بل من غياب fit notes واضحة. هذا الدليل يوضح كيف تحولين الحيرة إلى أسئلة أقصر تقود لاختيار أنظف.",
    excerpt:
      "كلما صار تعريف احتياج الشعر أوضح، صارت زيارة collection أقل عشوائية وأكثر ارتباطًا بما يمكن أن يخدمك فعلًا.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "بدل البحث عن حل عام للشعر كله، حددي أولًا نوع الإحساس أو السلوك الذي تريدين تحسينه الآن. fit notes الجيدة لا تعطيك منتجًا سحريًا، لكنها تقلل التردد وتوجهك إلى مسار أقرب للاستخدام الحقيقي.",
    takeaways: [
      "التردد يقل عندما يتحول الاختيار إلى fit notes واضحة بدل أوصاف عامة.",
      "collection الواسعة تصبح أسهل عندما تعرفين ما الذي تريدين تحسينه الآن تحديدًا.",
      "الاختيار الأقرب للاستخدام الحقيقي أفضل من شراء قائم على الانبهار أو المقارنة العشوائية.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/haircare",
      label: "ادخلي إلى haircare بملاحظات ملاءمة أوضح بدل تصفح متردد",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "لماذا تتعب زيارة haircare أحيانًا؟",
        body: "لأن الاختيار يبدأ من كل شيء دفعة واحدة: الملمس، الشكل، الجو، والتجارب السابقة. عندما تتداخل هذه العوامل، يصبح القرار أثقل من الحاجة نفسها.",
      },
      {
        heading: "ما أهم fit notes قبل الدخول؟",
        body: "حددي: ما السلوك الأكثر إزعاجًا الآن؟ ما الذي تريدين تقليله أو دعمه؟ وهل تبحثين عن راحة يومية أم نتيجة لمناسبة أو ظرف محدد؟",
      },
      {
        heading: "كيف تمنعين collection من التحول إلى تصفح عشوائي؟",
        body: "ادخلي بهدف قصير وواضح، لا بهدف مشاهدة كل الخيارات. هذا وحده يجعل المقارنة أنظف والقرار أسرع وأكثر قابلية للتكرار.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج معرفة تقنية كبيرة قبل شراء haircare؟",
        answer:
          "لا. تحتاجين فقط ملاحظات ملاءمة واضحة تساعدك على تضييق الاحتمالات، لا على فهم كل التفاصيل النظرية قبل البدء.",
      },
      {
        question: "متى أؤجل الشراء بدل المتابعة؟",
        answer:
          "إذا كان الاحتياج نفسه غير واضح أو متغيرًا جدًا من يوم لآخر. في هذه الحالة، وضوح الملاحظة أولًا أهم من سرعة القرار.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "bodycare-continuity-that-strengthens-repeat-behavior-without-overbuying",
    issue: "Issue 10",
    pillar: "الروتينات العملية",
    category: "تكرار الاستخدام",
    title: "استمرارية bodycare التي تقوّي تكرار الاستخدام بدون شراء زائد",
    deck:
      "repeat behavior في bodycare لا يقوى بكثرة القطع بل بوضوح المسار الذي يعود بسهولة. هذا الدليل يربط بين الاستمرارية والشراء الآمن بدون مبالغة في التوسع قبل ثبات العادة.",
    excerpt:
      "قبل التفكير في المزيد، اسألي: هل النسخة الحالية من bodycare تُستخدم فعلًا؟ إذا كانت الإجابة غير واضحة، فتعميق العادة أهم من تكبير السلة.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا أردتِ repeat behavior أقوى، فابني أولًا bodycare يمكن أن يعود بسهولة في الأيام العادية، لا فقط في اللحظات المثالية. عندها يصبح الشراء التالي دعمًا للعادة لا عبئًا جديدًا عليها.",
    takeaways: [
      "تكرار الاستخدام يأتي من سهولة العودة لا من كثرة المنتجات.",
      "الشراء الزائد قبل ثبات العادة يضعف bodycare بدل أن يقويه.",
      "المسار القصير الواضح هو أفضل قاعدة لقرارات شراء لاحقة.",
    ],
    relatedRoutine: "/routines/after-shower-body-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/bodycare",
      label: "ابني bodycare يمكن تكراره بسهولة قبل التفكير في توسيع الشراء",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "لماذا يضعف repeat behavior رغم النية الجيدة؟",
        body: "لأن المسار يكون أكبر من طاقة الأيام العادية. إذا احتاج bodycare إلى ظروف مثالية كي يعمل، فسيتوقف سريعًا مهما كانت النية قوية.",
      },
      {
        heading: "ما العلاقة بين الاستمرارية والشراء؟",
        body: "كلما كان المسار الحالي واضحًا وقابلًا للتكرار، صار القرار الشرائي التالي أكثر أمانًا. أما التوسع المبكر فيحول السلة إلى ضغط إضافي بدل دعم فعلي.",
      },
      {
        heading: "كيف تعرفين أن الوقت مناسب لشراء جديد؟",
        body: "عندما يكون الاستخدام الحالي ثابتًا بما يكفي لتعرفي أين القيمة الحقيقية وأين يمكن إضافة دعم منطقي بدون تشتيت العادة الأساسية.",
      },
    ],
    faq: [
      {
        question: "هل تقليل الشراء يعني أن الروتين ضعيف؟",
        answer:
          "لا. أحيانًا يكون هذا أقوى قرار لأن الهدف في هذه المرحلة هو تثبيت العادة نفسها قبل توسيعها.",
      },
      {
        question: "متى يصبح التوسع آمنًا؟",
        answer:
          "بعد أن يثبت bodycare الحالي في الاستخدام الفعلي لعدة مرات متتالية، ويصبح واضحًا ما الذي يحتاج دعمًا إضافيًا فعلًا.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "occasion-touch-up-versus-full-redo-before-evening-plans",
    issue: "Issue 09",
    pillar: "أدلة السياق اليومي",
    category: "تجهيز المساء",
    title: "قبل خطط المساء: متى تكفي لمسة سريعة ومتى تحتاجين إعادة ترتيب كاملة؟",
    deck:
      "الانتقال من يوم طويل إلى مساء فيه مناسبة أو خروج لا يعني دائمًا البدء من الصفر. هذا الدليل يوضح كيف تفرّقين بين touch-up ذكي يحافظ على النتيجة، وبين full redo يكون أوفر وقتًا وشكلًا.",
    excerpt:
      "القرار الصحيح لا يتعلق بالرغبة في الكمال، بل بحالة القاعدة نفسها: هل ما زالت قابلة للبناء، أم أن الإصلاح الجزئي سيستهلك وقتًا أكثر من إعادة مرتبة؟",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كانت القاعدة ما زالت مستقرة لكن تحتاج فقط استعادة انتعاش أو تحديد مناطق محددة، فـ touch-up غالبًا يكفي. أما إذا فقدت الطبقات تماسكها وأصبح التصحيح متعدد النقاط، فإعادة مرتبة تكون أوضح وأسرع من محاولة إنقاذ متعبة.",
    takeaways: [
      "اللمسة السريعة تنجح عندما تكون البنية الأساسية ما زالت ثابتة.",
      "كثرة التصحيحات علامة على أن redo كامل قد يكون أوفر.",
      "الهدف هو قرار عملي قبل المساء، لا مطاردة شكل مثالي تحت ضغط الوقت.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/makeup",
      label: "استعرضي خيارات مكياج مناسبة للمسات السريعة أو إعادة الترتيب قبل المساء",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى يكون touch-up هو القرار الأذكى؟",
        body: "عندما تبقى التغطية الأساسية متماسكة، ويكون الاحتياج الحقيقي في اللمعان أو الأطراف أو حيوية المظهر. هنا اللمسة السريعة تحفظ الوقت وتحمي القاعدة من التكديس غير الضروري.",
      },
      {
        heading: "ومتى يكون full redo أوضح؟",
        body: "إذا صار التصحيح نفسه موزعًا على نقاط كثيرة: تكتل، فقدان ثبات، وتفاوت واضح في المظهر. عندها يصبح البناء من جديد أكثر نظافة من سلسلة ترقيعات صغيرة.",
      },
      {
        heading: "كيف تتخذين القرار خلال دقائق؟",
        body: "انظري إلى الحالة العامة لا إلى تفصيلة واحدة. إذا كانت أغلب القاعدة ما زالت صالحة، صححي. وإذا كانت أغلبها تطلب تدخلًا، أعيدي الترتيب من البداية بمسار أخف.",
      },
    ],
    faq: [
      {
        question: "هل إعادة الترتيب دائمًا تضر ثبات المكياج؟",
        answer:
          "ليس دائمًا. إذا تمت على أساس قرار واضح ومسار أخف، قد تكون أنظف من تراكم طبقات تصحيح لا تنتهي.",
      },
      {
        question: "كيف أتجنب أن يتحول touch-up إلى طبقات كثيرة؟",
        answer:
          "ابدئي بالمناطق التي تؤثر فعلًا على الانطباع العام، وراجعي النتيجة بعد كل خطوة صغيرة بدل التصحيح الشامل دفعة واحدة.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "gift-set-fit-by-scenario-not-by-generic-label",
    issue: "Issue 09",
    pillar: "اختيار المنتج والشراء",
    category: "ملاءمة الهدية",
    title: "اختيار مجموعة كهدية حسب السيناريو لا حسب الوصف العام فقط",
    deck:
      "وصف مجموعة بأنها giftable لا يكفي لاتخاذ قرار جيد. هذا الدليل يعيد الاختيار إلى السياق: هل الهدية لبداية استخدام، لمناسبة، أم لاحتياج عملي متكرر؟ ومن هنا يتحدد الأنسب فعلًا.",
    excerpt:
      "المجموعة المناسبة ليست الأكثر عمومية، بل الأكثر ملاءمة للسيناريو الذي ستُفتح فيه وتُستخدم من أجله. هذا الفرق هو ما يجعل الهدية مفيدة لا مجرد شكل مرتب.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ابدئي من مناسبة الهدية وطريقة استخدامها المتوقعة، لا من اسم المجموعة وحده. إذا كان السيناريو واضحًا، يصبح اختيار المجموعة أسهل وأدق من البحث عن خيار يبدو مناسبًا لكل شيء ولا يخدم شيئًا بوضوح.",
    takeaways: [
      "السيناريو أهم من الوصف التسويقي العام عند اختيار الهدية.",
      "المجموعة الأفضل هي التي تختصر قرار الاستخدام بعد الاستلام.",
      "الملاءمة العملية تجعل الهدية أذكى من مجرد تنسيق جميل.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "قارئني مجموعات الجمال حسب سيناريو الاستخدام لا حسب الوصف العام فقط",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما أول سؤال قبل اختيار أي gift set؟",
        body: "اسألي: هل هذه الهدية ستُستخدم كبداية تجربة، كاستعداد لمناسبة، أم كدعم روتيني متكرر؟ الإجابة تغيّر نوع المجموعة المناسبة أكثر من أي تصنيف عام.",
      },
      {
        heading: "لماذا يفشل الاختيار العام جدًا؟",
        body: "لأنه يحاول أن يناسب الجميع، فيفقد وضوح الاستخدام. كلما كان السيناريو أوضح، صار احتمال أن تكون المجموعة مفيدة بعد الشراء أعلى.",
      },
      {
        heading: "كيف تجعلين الهدية أقرب للاستخدام الفعلي؟",
        body: "اختاري مجموعة تختصر على المتلقي قرار البداية أو التكرار. الهدية العملية لا تحتاج شرحًا طويلًا حتى تدخل الروتين.",
      },
    ],
    faq: [
      {
        question: "هل الأفضل اختيار مجموعة آمنة وعامة دائمًا؟",
        answer:
          "ليس دائمًا. الأمان المبالغ فيه قد ينتج هدية بلا شخصية استخدام واضحة. الأفضل هو سيناريو منطقي وواضح يمكن أن يخدم فعلاً.",
      },
      {
        question: "متى تكون المجموعة أنسب من شراء قطعة واحدة كهدية؟",
        answer:
          "عندما يكون المطلوب تقديم تجربة متكاملة أو بداية أسهل، لا مجرد تعويض منتج منفرد داخل روتين معروف مسبقًا.",
      },
    ],
  },
  {
    collection: "haircare",
    slug: "haircare-continuity-after-travel-or-weather-disruption",
    issue: "Issue 09",
    pillar: "الروتينات العملية",
    category: "استمرارية العناية بالشعر",
    title: "استمرارية العناية بالشعر بعد السفر أو تغيّر الطقس بدون إعادة تعقيد الروتين",
    deck:
      "الشعر من أول المسارات التي تتفكك مع السفر أو تبدل الجو السريع، لأن العودة إليه تبدو كأنها تحتاج خطة كاملة. هذا الدليل يبني عودة أخف تحافظ على الاستمرارية بدل تضخيم الخطوات.",
    excerpt:
      "الاستمرارية في haircare لا تعني إعادة كل التفاصيل مباشرة، بل تثبيت المسار الذي يحافظ على الراحة والشكل ثم توسيعه عند الحاجة فقط.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "بعد السفر أو تغير الجو، ارجعي أولًا إلى الخطوات التي تعيد التحكم والراحة بدل محاولة تعويض كل ما فات. عندما يعود الشعر إلى سلوك يمكن توقعه، يصبح من السهل إضافة أي خطوة مساندة لاحقًا بلا فوضى.",
    takeaways: [
      "العودة الذكية للشعر تبدأ بالتحكم الأساسي لا بالتفاصيل الكثيرة.",
      "التغير المناخي والسفر يطلبان تبسيطًا مؤقتًا لا روتينًا جديدًا بالكامل.",
      "استقرار الإحساس بالشعر أهم من كثرة المنتجات بعد الانقطاع.",
    ],
    relatedRoutine: "/routines/humidity-proof-hair-routine",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/haircare",
      label: "راجعي مسار العناية بالشعر المناسب بعد الاضطراب أو تغيّر الطقس",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "لماذا يعود الشعر أصعب بعد الانقطاع؟",
        body: "لأن محاولة استرجاع كل شيء مرة واحدة تجعل القرار نفسه ثقيلًا. كلما زادت الخطوات في يوم العودة، زاد احتمال التراجع عنها سريعًا.",
      },
      {
        heading: "ما أول ما يجب تثبيته؟",
        body: "ثبتي ما يعيد الملمس القابل للتعامل والشكل الأكثر راحة، ثم اتركي الخطوات الإضافية لوقت يتضح فيه احتياجها فعلًا.",
      },
      {
        heading: "متى توسعين الروتين مرة أخرى؟",
        body: "بعد استعادة الإيقاع الطبيعي لعدة أيام. إذا عاد الشعر قابلًا للتوقع، يمكن وقتها إضافة الدعم المناسب بدل البناء من قلق مؤقت.",
      },
    ],
    faq: [
      {
        question: "هل أغير كامل روتين الشعر بعد السفر؟",
        answer:
          "ليس غالبًا. الأفضل هو العودة إلى الأساس الذي يعيد التحكم أولًا، ثم التعديل التدريجي فقط إذا كان هناك سبب واضح.",
      },
      {
        question: "كيف أعرف أن الشعر يحتاج تبسيطًا لا منتجات أكثر؟",
        answer:
          "إذا كان التشتت في القرار أكبر من المشكلة نفسها، فهذه علامة على أن التبسيط المؤقت سيكون أنفع من إضافة طبقات جديدة.",
      },
    ],
  },
  {
    collection: "bodycare",
    slug: "bodycare-recovery-when-routine-becomes-too-intermittent",
    issue: "Issue 09",
    pillar: "الروتينات العملية",
    category: "استعادة روتين الجسم",
    title: "استعادة روتين الجسم عندما يصبح متقطعًا أكثر من اللازم",
    deck:
      "أكثر ما يضعف bodycare ليس نقص الرغبة بل انقطاع الإيقاع. هذا الدليل يحول العودة من قرار كبير مؤجل إلى مسار بسيط يمكن تكراره حتى لو كانت الأيام غير منتظمة.",
    excerpt:
      "عندما يصبح روتين الجسم متقطعًا، لا تحتاجين خطة مثالية بل نقطة عودة ثابتة. منها يعود الشعور بالسهولة، ثم تعود الاستمرارية.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "أعيدي الروتين إلى لحظة ثابتة سهلة التكرار بدل ربطه بيوم مثالي. كلما صار bodycare أقرب إلى عادة قصيرة وواضحة، صار الرجوع إليه أسرع حتى مع انقطاع متكرر.",
    takeaways: [
      "الانتظام في bodycare يبنى على نقطة عودة واضحة لا على طاقة يومية مثالية.",
      "الروتين القصير القابل للتكرار أنفع من خطة طويلة لا تعود.",
      "الاستمرارية أهم من كثافة التطبيق عندما يكون الإيقاع متقطعًا.",
    ],
    relatedRoutine: "/routines/after-shower-body-routine",
    relatedIngredient: "/ingredients/shea-butter",
    nextStep: {
      href: "/shop/bodycare",
      label: "اختاري مسار bodycare سهل العودة إليه بعد فترات الانقطاع",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "لماذا يتفكك روتين الجسم بسهولة؟",
        body: "لأنه غالبًا يُربط بوقت مثالي أو مزاج محدد. وعندما يختفي هذا السياق، يتأجل الروتين كله بدل أن يتقلص إلى نسخة أبسط.",
      },
      {
        heading: "ما أفضل نقطة عودة؟",
        body: "لحظة متكررة وواضحة مثل ما بعد الاستحمام أو نهاية يوم محدد، بحيث لا يحتاج القرار في كل مرة إلى تفاوض جديد مع الوقت.",
      },
      {
        heading: "كيف تمنعين العودة إلى الانقطاع؟",
        body: "لا توسعي الروتين بسرعة بعد أول يوم نجاح. ثبتي النسخة القصيرة أولًا حتى تصبح مألوفة، ثم أضيفي ما يدعمها فقط إذا ظل قابلًا للتكرار.",
      },
    ],
    faq: [
      {
        question: "هل الروتين المختصر للجسم يكفي فعلًا؟",
        answer:
          "نعم إذا كان يعيد الاستمرارية. الفائدة هنا في أن يعود المسار للحياة، لا في أن يصبح مثاليًا من أول يوم.",
      },
      {
        question: "متى أضيف خطوات أكثر؟",
        answer:
          "بعد أن تثبت نقطة العودة الأساسية لعدة مرات متتالية. إذا كانت النسخة القصيرة ما زالت تتعطل، فالتوسع المبكر سيعيد الانقطاع غالبًا.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "hydration-balance-reset-between-ac-and-outdoor-heat",
    issue: "Issue 08",
    pillar: "أدلة السياق اليومي",
    category: "توازن الترطيب اليومي",
    title: "إعادة ضبط الترطيب بين التكييف والحرارة الخارجية بدون طبقات ثقيلة",
    deck:
      "الانتقال المستمر بين المكيف والجو الحار يربك الإحساس الحقيقي باحتياج البشرة: أحيانًا تبدو مشدودة، وأحيانًا لامعة، ومع ذلك يكون السبب واحدًا وهو غياب التوازن. هذا الدليل يشرح كيف تعيدين ضبط الترطيب بدل زيادة الطبقات بلا فائدة.",
    excerpt:
      "المطلوب ليس روتينًا جديدًا كل يوم، بل قراءة أبسط للسياق: ما الذي يحتاج تثبيتًا، وما الذي يحتاج تخفيفًا، ومتى يكفي تعديل صغير بدل إضافة خطوة كاملة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ابدئي من الحد الأدنى المريح ثم عدّلي فقط نقطة التوازن: إذا زاد الشد فادعمي الترطيب، وإذا زاد اللمعان فخففي الطبقات لا الترطيب كله. الفكرة هي استعادة راحة البشرة بين الداخل والخارج بدل التعامل مع كل انتقال كأنه مشكلة جديدة.",
    takeaways: [
      "التكييف والحرارة لا يحتاجان روتينين منفصلين بل تعديلًا ذكيًا داخل نفس المسار.",
      "زيادة الطبقات ليست دائمًا الحل عندما يتغير إحساس البشرة خلال اليوم.",
      "التوازن أهم من مطاردة كل عرض لحظي بمنتج إضافي.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/routines",
      label: "راجعي روتينات صباحية قابلة للتعديل حسب تغيّر اليوم",
      destinationType: "routine_index",
    },
    sections: [
      {
        heading: "لماذا يبدو الترطيب زائدًا في الداخل وناقصًا في الخارج؟",
        body: "لأن الإحساس السريع لا يفرّق دائمًا بين فقدان الراحة وبين تراكم الطبقات. في التكييف قد يظهر الشد أسرع، ومع الخروج قد يظهر اللمعان أسرع، فيبدو كأن البشرة تطلب شيئين متعاكسين بينما هي تحتاج فقط ضبطًا أدق.",
      },
      {
        heading: "ما أول تعديل منطقي بدل تغيير الروتين كله؟",
        body: "ثبتي التنظيف والخطوة الأساسية، ثم راقبي فقط طبقة الدعم: هل تحتاج تخفيفًا، أم تحتاج كمية أوضح على مناطق محددة؟ هذا يحافظ على الاستقرار ويمنع دوامة التجارب اليومية.",
      },
      {
        heading: "متى يصبح التخفيف أذكى من الإضافة؟",
        body: "عندما تكون الراحة مقبولة لكن الملمس صار أثقل من اللازم. هنا لا تحتاجين خطوة جديدة، بل تقليل الحمل على البشرة حتى تعود النتيجة متوازنة خلال التنقل بين البيئات المختلفة.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج منتجين مختلفين لكل وقت من اليوم؟",
        answer:
          "ليس غالبًا. في كثير من الحالات يكفي نفس المسار مع تعديل الدرجة أو الكمية بدل تحويل اليوم إلى روتينين منفصلين.",
      },
      {
        question: "كيف أعرف أن المشكلة من الطبقات لا من نقص الترطيب؟",
        answer:
          "إذا اختفت الراحة مع ثقل أو لمعان أسرع من المعتاد، فراجعي الحمل على البشرة أولًا. أما إذا كان الإحساس شدًّا واضحًا ومستمرًا فادعمي الترطيب تدريجيًا.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "concern-recovery-after-over-layering-what-to-pause-first",
    issue: "Issue 08",
    pillar: "المشكلة والقرار الأول",
    category: "إرهاق الطبقات",
    title: "بعد الإفراط في الطبقات: ما الذي يتوقف أولًا وما الذي يبقى ثابتًا؟",
    deck:
      "عندما يتحوّل الروتين إلى محاولة لحل كل شيء مرة واحدة، يصبح التراجع نفسه مربكًا. هذا الدليل يرتّب قرار الإيقاف: ما الذي يجب تثبيته، وما الذي يمكن تأجيله، وكيف تستعيدين الوضوح بدون إعادة بناء كاملة.",
    excerpt:
      "التعافي من over-layering لا يبدأ بإلغاء كل شيء، بل بفصل الثابت عن الاختياري حتى تعود البشرة إلى إيقاع يمكن فهمه ومراجعته.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "أوقفي أولًا الخطوات التي أضيفت فقط بدافع القلق أو السرعة، واحتفظي بالمسار الأساسي الذي تعرفين أنه مريح ويمكن تكراره. بهذه الطريقة تعود الإشارات أوضح، ويصبح قرار الإضافة لاحقًا مبنيًا على استجابة حقيقية لا على ارتباك متراكم.",
    takeaways: [
      "الإيقاف الذكي يبدأ بالاختياري لا بالأساس.",
      "كلما صار الروتين أبسط عادت قراءة استجابة البشرة أوضح.",
      "التعافي يحتاج ثباتًا قصيرًا قبل أي توسع جديد.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/concerns/pigmentation",
      label: "ارجعي لمسار التصبغات الواضح بدل تكديس خطوات متنافسة",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "كيف تعرفين أنك دخلتِ في over-layering فعلًا؟",
        body: "عندما يصبح الروتين أطول لكن الإشارات أقل وضوحًا: راحة أقل، شكوك أكثر، وتردد دائم في معرفة أي خطوة ساعدت وأيها زادت التشويش.",
      },
      {
        heading: "ما الذي يجب أن يبقى ثابتًا؟",
        body: "احتفظي بالخطوات التي أثبتت الراحة والقدرة على التكرار. الهدف هنا ليس الكمال، بل إنشاء أرضية واضحة يمكن البناء عليها لاحقًا إذا احتجتِ فعلًا.",
      },
      {
        heading: "ومتى تعيدين خطوة متوقفة؟",
        body: "بعد عودة الاستقرار لبضعة أيام وظهور سبب واضح للإضافة. إذا لم يكن هناك سبب محدد، فغالبًا ليست هناك حاجة حقيقية لإرجاعها الآن.",
      },
    ],
    faq: [
      {
        question: "هل أوقف كل الإضافات مرة واحدة؟",
        answer:
          "ليس بالضرورة. ابدئي بالخطوات الأقل وضوحًا في فائدتها أو الأكثر ارتباطًا بالارتباك الحالي، مع إبقاء الأساس الذي يمنح راحة وثباتًا.",
      },
      {
        question: "هل التبسيط يعني أن الروتين السابق كان خطأ؟",
        answer:
          "لا. أحيانًا يكون التبسيط هو القرار الأنسب لمرحلة معينة، خصوصًا عندما تصبح كثرة الخطوات أسرع من قدرة البشرة أو الوقت على استيعابها.",
      },
    ],
  },
  {
    collection: "beauty-sets",
    slug: "replenishment-timing-single-rebuy-vs-returning-to-a-set",
    issue: "Issue 08",
    pillar: "اختيار المنتج والشراء",
    category: "توقيت إعادة الشراء",
    title: "متى تعيدين شراء منتج واحد ومتى يكون الرجوع إلى مجموعة هو القرار الأذكى؟",
    deck:
      "قرار إعادة الشراء لا يتعلق بالنفاد فقط. أحيانًا يكفي منتج واحد يحافظ على المسار، وأحيانًا تكون العودة إلى مجموعة كاملة هي الأسهل للاستمرار. هذا الدليل يضع منطقًا عمليًا لتوقيت القرار بدل الشراء التلقائي.",
    excerpt:
      "اسألي أولًا: هل النقص في عنصر واحد داخل روتين مستقر، أم أن النظام كله بدأ يتفكك؟ الإجابة هي التي تحدد rebuy مفرد أو set كاملة.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "إذا كان الروتين ما زال واضحًا ويحتاج فقط لتعويض عنصر محدد، فإعادة شراء منتج واحد غالبًا تكفي. أما إذا بدأت أكثر من خطوة تتعطل أو عاد التردد في الاختيار، فقد تكون المجموعة أذكى لأنها تعيد النظام نفسه لا المنتج فقط.",
    takeaways: [
      "الشراء المفرد يناسب الروتين المستقر لا المتفكك.",
      "المجموعة تصبح أذكى عندما يكون المطلوب استعادة المسار لا سدّ نقص واحد.",
      "توقيت إعادة الشراء يجب أن يرتبط بالاستخدام الحقيقي لا بالخوف من النفاد فقط.",
    ],
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/beauty-sets",
      label: "راجعي المجموعات الجاهزة عندما تحتاجين استعادة المسار كاملًا",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "متى يكون rebuy المفرد كافيًا؟",
        body: "عندما تكون باقي الخطوات مستقرة، وتعرفين بوضوح كيف تستخدمين هذا المنتج داخل روتينك الحالي. هنا لا داعي لإعادة شراء نظام كامل فقط لأن عنصرًا واحدًا قارب على النفاد.",
      },
      {
        heading: "ومتى تكون المجموعة أوفر ذهنيًا من الشراء الفردي؟",
        body: "عندما يعود التردد في الترتيب، أو تبدأين بتأجيل الروتين لأن أكثر من نقطة تحتاج قرارًا جديدًا. المجموعة هنا تختصر الحيرة وتعيد الهيكل لا الكمية فقط.",
      },
      {
        heading: "كيف تتجنبين الشراء بدافع القلق؟",
        body: "راقبي الاستهلاك الفعلي والتكرار الحقيقي. إذا كان المنتج يُستخدم على وتيرة ثابتة وواضحة، فقرار إعادة الشراء أسهل. أما إذا كان الاستهلاك متذبذبًا، فراجعي النظام أولًا قبل ملء السلة.",
      },
    ],
    faq: [
      {
        question: "هل المجموعة دائمًا أوفر من إعادة شراء منتج واحد؟",
        answer:
          "ليس دائمًا. القيمة تأتي من مدى حاجتك إلى استعادة نظام كامل، لا من عدد القطع وحده. أحيانًا يكون المنتج المفرد هو القرار الأكثر عقلانية.",
      },
      {
        question: "متى أشتري قبل النفاد الكامل؟",
        answer:
          "عندما يكون المنتج جزءًا ثابتًا من روتين واضح ولا تريدين انقطاعه. أما إذا كانت العادة نفسها غير مستقرة، فراجعي المسار أولًا قبل التسريع بالشراء.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "fast-morning-recovery-after-a-disrupted-evening-routine",
    issue: "Issue 08",
    pillar: "الروتينات العملية",
    category: "استعادة الصباح",
    title: "استعادة سريعة للصباح بعد مساء مضطرب بدون مبالغة في التعويض",
    deck:
      "عندما يخرج المساء عن خطته، يميل الصباح إلى رد فعل مبالغ فيه: خطوات أكثر، قرارات أسرع، ونتيجة أقل راحة. هذا الدليل يبني صباحًا تعويضيًا قصيرًا يعيد التوازن بدل تضخيم الإرهاق.",
    excerpt:
      "الصباح التالي لا يحتاج عقابًا ولا خطة إنقاذ طويلة. ما يحتاجه هو مسار قصير يعيد الراحة ويمنع قرارات عشوائية تزيد الضغط على البشرة أو على الوقت.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "اختصري الصباح التالي إلى ما يعيد الراحة والثبات فقط: تنظيف مناسب، دعم واضح، ثم العودة لأخف نسخة قابلة للتكرار من الروتين. بهذه الطريقة تستعيدين اليوم بدل أن تبدئيه بمزيد من التعويض المرهق.",
    takeaways: [
      "الصباح التعويضي الناجح قصير وواضح لا طويل ومتوتر.",
      "المبالغة في التعويض بعد مساء مضطرب تزيد الارتباك.",
      "العودة لأخف نسخة ثابتة أسرع من محاولة استرجاع كل شيء مرة واحدة.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/routines",
      label: "اختاري روتينًا صباحيًا مختصرًا يحافظ على الراحة بعد الليالي المضغوطة",
      destinationType: "routine_index",
    },
    sections: [
      {
        heading: "ما الخطأ الشائع في صباح اليوم التالي؟",
        body: "التعامل مع المساء المضطرب كأنه يجب أن يُعوض بالكامل قبل الخروج. هذا يرفع الحمل على البشرة والوقت معًا ويجعل الالتزام أصعب بدل أسهل.",
      },
      {
        heading: "كيف تختصرين القرار في ثلاث نقاط فقط؟",
        body: "اسألي: ما الذي يعيد الراحة؟ ما الذي يجب ألا ينقطع؟ وما الذي يمكن تأجيله؟ هذا الترتيب يمنع التوسع غير الضروري ويعيد الوضوح بسرعة.",
      },
      {
        heading: "متى تعودين للروتين المعتاد؟",
        body: "بعد أن يعود الإيقاع الطبيعي لليوم، لا بمجرد الشعور بالذنب من الليلة السابقة. الهدف هو الاستمرار، لا إثبات الانضباط في صباح واحد.",
      },
    ],
    faq: [
      {
        question: "هل ألغي المكياج في اليوم التالي دائمًا؟",
        answer:
          "ليس بالضرورة. في أغلب الحالات يكفي مسار صباحي أخف وأكثر وعيًا، ثم اختيار تطبيق بسيط بدل قرارات حادة تلغي اليوم كله.",
      },
      {
        question: "هل الصباح المختصر أقل فاعلية؟",
        answer:
          "ليس إذا كان يعيد الراحة والثبات. الفاعلية هنا تُقاس بقدرتك على استعادة المسار بسرعة، لا بعدد الخطوات التي أضفتِها.",
      },
    ],
  },
  {
    collection: "makeup",
    slug: "sunscreen-reapplication-over-makeup-without-patchiness",
    issue: "Issue 07",
    pillar: "أدلة السياق اليومي",
    category: "تجديد الحماية",
    title: "تجديد واقي الشمس فوق المكياج بدون تكتّل في منتصف اليوم",
    deck:
      "أكثر نقطة تتعطل بعد الظهر هي الحماية نفسها: إما تكتل على القاعدة أو لمعان زائد. هذا الدليل يضع طريقة عملية لتجديد الحماية بدون كسر شكل المكياج.",
    excerpt:
      "الهدف ليس طبقة مثالية ثانية، بل تجديد ذكي للحماية يحافظ على مظهر القاعدة ويمنع القرارات العشوائية بين المسح الكامل أو تجاهل التجديد.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "قسّمي التجديد إلى طبقات خفيفة على مناطق التعرض الأعلى بدل إعادة التطبيق دفعة واحدة. بهذه الطريقة تحافظين على ثبات القاعدة وتبقى الحماية عملية خلال اليوم.",
    takeaways: [
      "التجديد الموضعي أولًا يقلل التكتل.",
      "الكمية الكبيرة مرة واحدة تضعف شكل القاعدة.",
      "التوقيت أهم من إعادة بناء المكياج بالكامل.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/hyaluronic-acid",
    nextStep: {
      href: "/shop/makeup",
      label: "راجعي خيارات مكياج تتحمل التجديد خلال اليوم",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "لماذا يفشل التجديد غالبًا؟",
        body: "لأن التطبيق الثاني يتم كأنه بداية يوم جديد، بينما الواقع أن هناك طبقة قائمة تحتاج تعاملًا أخف وأكثر دقة.",
      },
      {
        heading: "كيف تجددين بدون فقدان الثبات؟",
        body: "ابدئي بالمناطق الأعلى تعرضًا للشمس ثم أعيدي تقييم اللمعة والتغطية قبل إضافة أي كمية جديدة على كامل الوجه.",
      },
      {
        heading: "متى تحتاجين تصحيحًا بدل تجديد كامل؟",
        body: "عند وجود تكتل أو لمعان موضعي، التصحيح المحدود أسرع وأكثر نظافة من إعادة التطبيق الكاملة.",
      },
    ],
    faq: [
      {
        question: "هل يلزم إزالة المكياج قبل التجديد؟",
        answer:
          "ليس دائمًا. في أغلب الأيام يكفي التجديد الخفيف والمدروس على المناطق المكشوفة دون إعادة كاملة للقاعدة.",
      },
      {
        question: "كيف أتجنب المظهر الطبقي بعد التجديد؟",
        answer:
          "اعتمدي كمية أقل وتوزيعًا تدريجيًا، وابتعدي عن الضغط العالي أو الفرك الذي يزعزع الطبقة الأساسية.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "routine-recovery-after-travel-and-busy-weeks",
    issue: "Issue 07",
    pillar: "الروتينات العملية",
    category: "استعادة الانتظام",
    title: "استعادة الروتين بعد السفر أو ضغط الأسابيع المزدحمة",
    deck:
      "الانقطاع لا يعني فشل الروتين. المهم هو طريقة العودة: هل تعودين بكل الخطوات مرة واحدة أم بمسار تدريجي قابل للاستمرار؟",
    excerpt:
      "هذا الدليل يبني خطة رجوع قصيرة وواقعية تمنع دورة الحماس ثم الانقطاع، وتعيد النتيجة التراكمية بسرعة.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ارجعي أولًا إلى الحد الأدنى الثابت لعدة أيام، ثم أعيدي إضافة الخطوات الإضافية تدريجيًا. هكذا تستعيدين الانتظام بدون إرهاق أو ارتداد.",
    takeaways: [
      "العودة التدريجية أكثر ثباتًا من الرجوع الكامل المفاجئ.",
      "الحد الأدنى اليومي يمنع الانقطاع المتكرر.",
      "الاستمرارية القصيرة أفضل من الكمال المؤقت.",
    ],
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/routines",
      label: "اختاري روتينًا مختصرًا للعودة الذكية بعد الانقطاع",
      destinationType: "routine_index",
    },
    sections: [
      {
        heading: "لماذا تفشل العودة السريعة؟",
        body: "لأنها تفترض طاقة يومية مثالية. عند أول ضغط يعود الانقطاع لأن الخطة نفسها غير مرنة.",
      },
      {
        heading: "ما خطة 72 ساعة الأولى؟",
        body: "ثلاثة أيام على الحد الأدنى الثابت فقط، ثم مراجعة الاستجابة قبل إضافة أي خطوة جديدة.",
      },
      {
        heading: "كيف تعرفين أن العودة نجحت؟",
        body: "عندما يصبح التطبيق متكررًا بدون جهد ذهني كبير، ويختفي التذبذب بين أيام مثالية وأيام انقطاع.",
      },
    ],
    faq: [
      {
        question: "هل أحتاج تعويض كل الأيام التي انقطعت فيها؟",
        answer:
          "لا. التعويض المبالغ فيه يربك المسار. الأفضل هو استعادة الثبات أولًا ثم البناء التدريجي.",
      },
      {
        question: "متى أعيد الخطوات الإضافية؟",
        answer:
          "بعد ثبات الحد الأدنى عدة أيام متتالية، مع إضافة خطوة واحدة في كل مرة.",
      },
    ],
  },
  {
    collection: "tools",
    slug: "brush-and-sponge-hygiene-cadence-without-overcomplication",
    issue: "Issue 07",
    pillar: "الروتينات العملية",
    category: "نظافة الأدوات",
    title: "جدول نظافة الفرش والإسفنج بدون تعقيد",
    deck:
      "كثير من مشاكل ثبات القاعدة وراحة البشرة تأتي من أدوات غير مستقرة النظافة. هذا الدليل يقدم cadence بسيطًا يمكن الالتزام به.",
    excerpt:
      "الهدف ليس روتين تنظيف مثالي يومي، بل نظام نظافة واقعي يمنع تراكم الأثر على البشرة والمكياج.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "ثبتي دورة تنظيف خفيفة متكررة بدل جلسات تنظيف متباعدة وثقيلة. الانتظام القصير يحافظ على الأداء ويقلل التهيج المحتمل.",
    takeaways: [
      "التنظيف الخفيف المنتظم أفضل من التنظيف الثقيل المتباعد.",
      "الأدوات النظيفة تحسن توزيع القاعدة وثباتها.",
      "الجدول البسيط هو الأكثر قابلية للاستمرار.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/shop/tools",
      label: "استعرضي أدوات تساعد على تطبيق أنظف وأكثر ثباتًا",
      destinationType: "collection",
    },
    sections: [
      {
        heading: "ما الجدول العملي الأدنى؟",
        body: "تنظيف سريع متكرر للأدوات الأكثر استخدامًا مع تنظيف أعمق دوري للأدوات الأقل استخدامًا.",
      },
      {
        heading: "كيف يؤثر ذلك على النتيجة؟",
        body: "كلما كانت الأداة أنظف، كان توزيع المنتج أكثر توازنًا وقلّت الحاجة للتصحيح المتكرر خلال اليوم.",
      },
      {
        heading: "كيف تمنعين عودة الفوضى؟",
        body: "اربطِي التنظيف بعادة ثابتة في نهاية استخدامات الأسبوع بدل تركه لوقت فراغ غير مضمون.",
      },
    ],
    faq: [
      {
        question: "هل يلزم تنظيف كل الأدوات بنفس التكرار؟",
        answer:
          "لا. الأدوات الأعلى استخدامًا تحتاج تكرارًا أعلى، بينما الأدوات النادرة يمكن إدراجها في دورة أبطأ.",
      },
      {
        question: "لماذا يزيد التكتل أحيانًا رغم نفس المنتج؟",
        answer:
          "غالبًا بسبب حالة الأداة نفسها. بقايا الاستخدامات السابقة تغير التوزيع حتى مع نفس التركيبة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "evening-reset-after-late-makeup-removal-next-day-comfort",
    issue: "Issue 07",
    pillar: "المشكلة والقرار الأول",
    category: "تنظيف مسائي",
    title: "إعادة ضبط المساء بعد إزالة مكياج متأخرة حتى لا يتعب اليوم التالي",
    deck:
      "عندما يتأخر التنظيف المسائي، يتأثر اليوم التالي مباشرة: ملمس غير متوازن وخيارات مكياج أصعب. هذا الدليل يشرح reset قصيرًا يحمي راحة اليوم التالي.",
    excerpt:
      "بدل جلد الذات أو العودة لخطة طويلة، نفذي مسار إنقاذ قصير يعيد التوازن بسرعة ويمنع تراكم الإرهاق على البشرة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "بعد الإزالة المتأخرة، اجعلي الهدف هو الاستعادة لا الكمال: تنظيف لطيف، دعم ترطيب واضح، ثم العودة للحد الأدنى صباحًا بدون تضخيم.",
    takeaways: [
      "مسار الإنقاذ القصير يحمي اليوم التالي.",
      "الإفراط بعد التأخير يضاعف الإجهاد بدل إصلاحه.",
      "العودة للحد الأدنى صباحًا تقلل الارتباك.",
    ],
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
    relatedIngredient: "/ingredients/panthenol",
    nextStep: {
      href: "/concerns/makeup-longwear",
      label: "راجعي مسار ثبات المكياج بدون إرهاق بشرة متكرر",
      destinationType: "concern",
    },
    sections: [
      {
        heading: "ما الخطأ الشائع بعد التأخير؟",
        body: "محاولة تعويض كل شيء في ليلة واحدة بخطوات كثيرة. هذا يرفع احتمال الانزعاج بدل إعادة التوازن.",
      },
      {
        heading: "كيف تنفذين reset سريعًا؟",
        body: "اختصري الهدف إلى الراحة والاستقرار: تنظيف مناسب ثم ترطيب مريح، مع تأجيل أي توسيع اختياري لاحقًا.",
      },
      {
        heading: "ما علاقة ذلك بثبات اليوم التالي؟",
        body: "كلما كان الأساس المسائي أهدأ، كان تطبيق الصباح أسهل والمظهر أكثر اتساقًا بدون تصحيحات مستمرة.",
      },
    ],
    faq: [
      {
        question: "هل ألغِي مكياج اليوم التالي بعد ليلة متعبة؟",
        answer:
          "ليس بالضرورة. غالبًا يكفي صباح مبسط وحد أدنى واضح بدل قرارات حادة بالإلغاء الكامل.",
      },
      {
        question: "متى أعود للروتين الكامل؟",
        answer:
          "بعد استعادة الراحة في يوم أو يومين، ثم إضافة الخطوات تدريجيًا وفق الاستجابة.",
      },
    ],
  },
  {
    collection: "skincare",
    slug: "post-purchase-routine-retention-how-to-stay-consistent-after-week-two",
    issue: "Issue 06",
    pillar: "الروتينات العملية",
    category: "استمرارية الروتين",
    title: "بعد الأسبوع الثاني من الشراء: كيف تحافظين على استمرارية الروتين؟",
    deck:
      "كثير من الروتينات تتوقف بعد الحماس الأول. هذا الدليل يشرح كيف تحافظين على الاستمرارية بعد الأسبوع الثاني بدون تعقيد إضافي.",
    excerpt:
      "الاستمرارية ليست انضباطًا قاسيًا، بل تصميم خطوات قابلة للتكرار في الأيام المزدحمة حتى تبقى النتائج مستقرة.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-03",
    updatedAt: "2026-04-03",
    answer:
      "قسّمي الروتين إلى حد أدنى ثابت وخطوة مرنة إضافية. بهذه الطريقة لا ينقطع المسار عند ضغط الوقت، وتبقى النتيجة تراكمية بدل متقطعة.",
    takeaways: [
      "حد أدنى ثابت يومي يمنع انقطاع الروتين.",
      "المرونة في الخطوات أفضل من التوقف الكامل.",
      "الاستمرارية أهم من الكمال في التطبيق.",
    ],
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
    relatedIngredient: "/ingredients/niacinamide",
    nextStep: {
      href: "/routines",
      label: "اختاري روتينًا قابلًا للاستمرار حسب يومك الحقيقي",
      destinationType: "routine_index",
    },
    sections: [
      {
        heading: "لماذا يتوقف الروتين بعد الأسبوعين الأولين؟",
        body: "لأن الخطة غالبًا تُبنى على أيام مثالية لا تشبه الواقع اليومي. لذلك تظهر فجوة بين النية والتنفيذ.",
      },
      {
        heading: "كيف تبنين خطة استمرارية؟",
        body: "حددي خطوات الحد الأدنى أولًا، ثم اجعلي الإضافات اختيارية حسب الوقت والطاقة بدل جعل كل خطوة إلزامية كل يوم.",
      },
      {
        heading: "كيف تقيسين النجاح بوضوح؟",
        body: "النجاح هنا هو الانتظام القابل للتكرار، لا المثالية اليومية. كل أسبوع مستقر أفضل من أسبوع مثالي يليه انقطاع.",
      },
    ],
    faq: [
      {
        question: "هل الروتين القصير أقل فعالية؟",
        answer:
          "ليس بالضرورة. الروتين القابل للاستمرار غالبًا يعطي نتيجة أفضل من روتين طويل لا يستمر.",
      },
      {
        question: "متى أضيف خطوات جديدة؟",
        answer:
          "بعد ثبات الحد الأدنى لفترة كافية، وعندها أضيفي خطوة واحدة فقط مع متابعة واضحة.",
      },
    ],
  },
];

export type TrustPolicyRecord = {
  slug: string;
  title: string;
  footerLabel: string;
  body: string;
  summary: string;
  points: string[];
  sections: Array<{ heading: string; body: string }>;
  faq: Array<{ question: string; answer: string }>;
};

export const trustPolicies: TrustPolicyRecord[] = [
  {
    slug: "verification",
    title: "بيانات المنشأة والتوثيق",
    footerLabel: "بيانات المنشأة",
    body: "هذه المساحة مخصصة لإظهار السجل التجاري، الرقم الضريبي، وبيانات التوثيق الرسمية فور اعتماد بيانات النشاط الفعلية. لا يتم وضع أرقام شكلية أو افتراضية داخل الواجهة.",
    summary:
      "صفحة مستقلة تشرح كيف ستظهر بيانات السجل التجاري، الرقم الضريبي، ووسائل التوثيق داخل المتجر فور اعتمادها، مع منع أي أرقام أو شعارات اعتماد غير مثبتة.",
    points: [
      "السجل التجاري يظهر بوضوح في الواجهة والفوتر",
      "بيانات النشاط والتوثيق ترتبط بصفحات السياسات",
      "ربط معلومات المنشأة بالشراء والتواصل والدفع",
    ],
    sections: [
      {
        heading: "ما الذي يظهر عند الإطلاق الفعلي؟",
        body: "عند اعتماد بيانات المنشأة الفعلية، تُعرض هوية النشاط القانونية، وسائل التواصل الرسمية، وروابط السياسات المرتبطة بها بشكل متسق بين الفوتر وصفحات الثقة ونقاط الشراء. الهدف هنا هو أن ترى الزائرة نفس الحقيقة التشغيلية أينما وصلت داخل الموقع.",
      },
      {
        heading: "ما الذي لا يُنشر قبل التحقق؟",
        body: "لا تُدرج أرقام سجل، أرقام ضريبية، أو شارات اعتماد على أنها نهائية قبل مراجعتها واعتمادها من النشاط نفسه. هذا يمنع تضارب المعلومات ويحافظ على مصداقية المتجر بدل استخدام بيانات شكلية بهدف إكمال التصميم فقط.",
      },
    ],
    faq: [
      {
        question: "هل يمكن نشر صفحة التوثيق قبل اكتمال بيانات النشاط؟",
        answer:
          "نعم، ولكن بصياغة صريحة توضح أن البيانات التشغيلية ستُستكمل بعد الاعتماد. لا يجوز ملء الصفحة بأرقام افتراضية أو عبارات توحي باعتماد غير موجود.",
      },
      {
        question: "أين يجب أن تنعكس بيانات المنشأة داخل التجربة؟",
        answer:
          "في الفوتر، صفحات السياسات، وسائل التواصل، وخطوات الشراء والدفع. اتساق هذه البيانات أهم من مجرد وجود صفحة منفصلة تحملها.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "الخصوصية واستخدام البيانات",
    footerLabel: "الخصوصية",
    body: "هذه سياسة خصوصية مؤقتة مخصصة لبيئة تجريبية، وهدفها إظهار مكان النص القانوني المستقبلي وطريقة عرضه داخل الموقع إلى حين اعتماد النسخة النهائية.",
    summary:
      "توضح هذه الصفحة بشكل مؤقت كيف سيظهر شرح الخصوصية داخل الموقع، مع التأكيد أن الصياغة الحالية مخصصة للمراجعة فقط وليست مرجعًا قانونيًا نهائيًا.",
    points: [
      "النص الحالي لأغراض العرض والمراجعة فقط",
      "سيتم استبداله بالسياسة المعتمدة قبل الإطلاق العام",
      "لا تُستخدم هذه الصياغة كمرجع قانوني نهائي في هذه المرحلة",
    ],
    sections: [
      {
        heading: "ما الغرض من هذه الصفحة الآن؟",
        body: "الغرض الحالي هو اختبار شكل سياسة الخصوصية ضمن النسخة التجريبية، والتأكد من وضوح العناوين، الفقرات، ومسار الوصول إلى الصفحة من الفوتر والصفحات المرجعية الأخرى. لا يعني هذا أن البنود الحالية نهائية أو مكتملة قانونيًا.",
      },
      {
        heading: "ما الذي سيُضاف لاحقًا؟",
        body: "عند اعتماد النسخة النهائية ستتضمن الصفحة تفاصيل المعالجة، أسس الاستخدام، وسائل التواصل المعتمدة، وأي حقوق أو إجراءات لازمة وفق السياسة القانونية المعتمدة. أما الصياغة الحالية فهي Placeholder منظم إلى حين استكمال ذلك.",
      },
    ],
    faq: [
      {
        question: "هل هذه الصفحة نهائية من الناحية القانونية؟",
        answer:
          "لا. هذه صفحة مؤقتة موجودة لإكمال النسخة التجريبية ومراجعة الهيكل البصري فقط. قبل الإطلاق العام يجب استبدالها بسياسة خصوصية معتمدة ومراجعة بالكامل.",
      },
      {
        question: "ماذا يجب مراجعته في هذه الصفحة الآن؟",
        answer:
          "في هذه المرحلة يُراجع وضوح العرض، ترتيب الأقسام، وسهولة الوصول إلى الصفحة من الفوتر والروابط المرجعية. أما دقة البنود القانونية نفسها فسيتم اعتمادها لاحقًا.",
      },
    ],
  },
  {
    slug: "shipping",
    title: "الشحن والتوصيل",
    footerLabel: "الشحن والتوصيل",
    body: "هذه سياسة شحن مؤقتة لنسخة تجريبية، وهدفها توضيح مكان المعلومات التشغيلية وكيفية عرضها داخل الواجهة إلى حين اعتماد مزود الشحن الفعلي وبيانات الخدمة النهائية.",
    summary:
      "توضح هذه الصفحة بشكل مبدئي كيف ستظهر معلومات الشحن والتوصيل لاحقًا، مع التأكيد أن الصياغة الحالية لأغراض العرض فقط وليست التزامًا تشغيليًا نهائيًا.",
    points: [
      "المحتوى الحالي مخصص للمراجعة ضمن بيئة تجريبية",
      "أي أزمنة أو رسوم تظهر لاحقًا ستعتمد فقط بعد تفعيل المزود الفعلي",
      "لا ينبغي اعتبار هذه الصياغة التزامًا نهائيًا قبل الإطلاق العام",
    ],
    sections: [
      {
        heading: "ما الذي تعرضه هذه الصفحة حاليًا؟",
        body: "تعرض الصفحة نموذجًا مؤقتًا لطريقة كتابة سياسة الشحن، ومكان ظهور المعلومات الأساسية مثل زمن التوصيل، التغطية، والرسوم. الغرض الآن هو اختبار الصفحة بصريًا ووظيفيًا، لا تثبيت بيانات شحن نهائية.",
      },
      {
        heading: "ما الذي سيُضاف لاحقًا؟",
        body: "عند اكتمال التجهيز التشغيلي ستُحدث هذه الصفحة لتشمل أزمنة التسليم الفعلية، المناطق المشمولة، الرسوم، الاستثناءات، وآلية التتبع وفق المزود الحقيقي. حتى ذلك الحين تبقى الصياغة الحالية Placeholder احترافيًا فقط.",
      },
    ],
    faq: [
      {
        question: "هل هذه الصفحة تمثل سياسة الشحن النهائية؟",
        answer:
          "لا. هذه صفحة مؤقتة وُضعت لتجهيز الهيكل العام للموقع في بيئة التجربة. سيتم استبدالها بسياسة شحن فعلية عند اعتماد المزود والبيانات التشغيلية النهائية.",
      },
      {
        question: "ما الذي يجب اختباره في هذه الصفحة الآن؟",
        answer:
          "يُراجع حاليًا وضوح النص، شكل الأقسام، وسهولة الوصول إلى الصفحة من الفوتر أو الصفحات المرجعية. أما دقة مدد الشحن والرسوم والاستثناءات فستُراجع لاحقًا عند تشغيل الخدمة الفعلية.",
      },
    ],
  },
  {
    slug: "returns",
    title: "الاستبدال والاسترجاع",
    footerLabel: "الاستبدال والاسترجاع",
    body: "هذه صفحة مؤقتة لسياسة الاستبدال والاسترجاع، والغرض منها تجهيز الواجهة بصريًا وتوضيح مكان البنود النهائية إلى حين اعتماد السياسة التشغيلية والقانونية الفعلية.",
    summary:
      "توضح هذه الصفحة بشكل مؤقت كيف ستظهر سياسة الاستبدال والاسترجاع داخل الموقع، مع التأكيد أن النص الحالي للمراجعة فقط وليس نسخة نهائية معتمدة.",
    points: [
      "المحتوى الحالي Placeholder مهني ضمن النسخة التجريبية",
      "ستُضاف الشروط والاستثناءات المعتمدة لاحقًا بعد اكتمال المراجعة",
      "لا يُتعامل مع هذه الصياغة كمرجع نهائي قبل الإطلاق العام",
    ],
    sections: [
      {
        heading: "ما وظيفة هذه الصفحة في المرحلة الحالية؟",
        body: "وظيفة الصفحة الآن هي إظهار مكان سياسة الاستبدال والاسترجاع داخل بنية الموقع، واختبار طريقة عرض الأقسام والعناوين والروابط المرجعية. أما الشروط الفعلية والالتزامات النهائية فستُستكمل لاحقًا بعد الاعتماد.",
      },
      {
        heading: "ما الذي سيُحدَّث لاحقًا؟",
        body: "عند اعتماد السياسة النهائية ستتضمن الصفحة شروط القبول أو الرفض، الاستثناءات، الخطوات المطلوبة، والمدد الفعلية للمعالجة أو الاسترداد حسب التشغيل الحقيقي. النص الحالي فقط تمهيد منظم لهذه البنية.",
      },
    ],
    faq: [
      {
        question: "هل هذه الصفحة معتمدة الآن؟",
        answer:
          "لا. الصفحة الحالية مؤقتة وموجودة لدعم النسخة التجريبية فقط. قبل الإطلاق العام يجب استبدالها بنص نهائي معتمد يطابق السياسة التشغيلية الفعلية.",
      },
      {
        question: "ما الذي يُراجع فيها خلال الاختبار؟",
        answer:
          "في هذه المرحلة تتم مراجعة الوضوح البصري، تسلسل الأقسام، ووصول الصفحة من الفوتر أو الروابط المرجعية. أما البنود التفصيلية الخاصة بالاسترجاع والاسترداد فستُعتمد لاحقًا.",
      },
    ],
  },
  {
    slug: "authenticity",
    title: "الأصالة والجودة",
    footerLabel: "الأصالة والجودة",
    body: "لأن الثقة عنصر حاسم في الكوزمتكس، تُعرض هنا آلية التحقق من الأصالة، ومراجعة الموردين، وكيفية عرض معلومات بلد المنشأ والمستورد متى كانت مطلوبة.",
    summary:
      "هذه الصفحة توضح كيف تُبنى الثقة في الأصالة والجودة: مصدر الاختيار، مراجعة الموردين، وضبط الادعاءات والمعلومات التي تظهر على صفحات المنتجات دون مبالغة أو claims غير مدعومة.",
    points: [
      "توضيح أصل المنتجات وموردها المعتمد",
      "عدم استخدام claims علاجية أو شبه طبية",
      "عرض تحذيرات الاستخدام ومعلومات الملصق عندما تنطبق",
    ],
    sections: [
      {
        heading: "مصدر الاختيار والمورد المعتمد",
        body: "عندما يَعِد المتجر بالأصالة، يجب أن يربط هذا الوعد بسلسلة توريد واضحة ومراجعة داخلية للموردين، لا بمجرد عبارة منتجات أصلية 100%. الصفحة هنا تُعرّف هذا المنهج وتوضح أن بلد المنشأ أو بيانات المستورد تُعرض متى كانت مطلوبة ومتحققة.",
      },
      {
        heading: "الادعاءات والتحذيرات على صفحات المنتجات",
        body: "صفحات التجميل لا ينبغي أن تنزلق إلى claims علاجية أو شبه طبية بلا سند. لهذا تُعامل صفحة الأصالة والجودة كمرجع تحريري أيضًا: ما الذي يمكن قوله، وكيف تُعرض التحذيرات، ومتى يجب الاكتفاء بوصف الاستخدام والملمس والملاءمة بدل المبالغة.",
      },
    ],
    faq: [
      {
        question: "هل صفحة الأصالة بديل عن معلومات المنتج نفسها؟",
        answer:
          "لا. هي صفحة مرجعية تبني الثقة، لكن معلومات الملصق، التحذيرات، وبلد المنشأ يجب أن تظهر أيضًا في السياقات التي تتخذ فيها العميلة قرار الشراء.",
      },
      {
        question: "لماذا يجب تجنب الادعاءات الطبية في هذا النوع من الصفحات؟",
        answer:
          "لأنها قد تخلق وعودًا لا يدعمها المنتج أو المحتوى الفعلي، وتحوّل صفحة الثقة إلى مصدر مخاطرة قانونية وتسويقية بدل أن تكون عنصر طمأنة.",
      },
    ],
  },
];

function extractSlugFromHref(href?: string) {
  return href ? href.split("/").filter(Boolean).at(-1) : undefined;
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getConcernBySlug(slug: string) {
  return concerns.find((concern) => concern.slug === slug);
}

export function getRoutineBySlug(slug: string) {
  return routines.find((routine) => routine.slug === slug);
}

export function getIngredientBySlug(slug: string) {
  return ingredients.find((ingredient) => ingredient.slug === slug);
}

export function getIngredientByName(name: string) {
  const normalizedName = name.toLowerCase().trim();
  return ingredients.find(
    (ingredient) => ingredient.title.toLowerCase() === normalizedName,
  );
}

export function getJournalArticleBySlug(slug: string) {
  return journalArticles.find((article) => article.slug === slug);
}

export function getProductsBySlugs(slugs: string[]) {
  return slugs
    .map((slug) => getProductBySlug(slug))
    .filter((product): product is ProductRecord => Boolean(product));
}

export function getProductByHref(href?: string) {
  const slug = extractSlugFromHref(href);
  return slug ? getProductBySlug(slug) : undefined;
}

export function getShopCollectionBySlug(slug: string) {
  return shopCollections.find((collection) => collection.slug === slug);
}

export function getConcernByHref(href?: string) {
  const slug = extractSlugFromHref(href);
  return slug ? getConcernBySlug(slug) : undefined;
}

export function getRoutineByHref(href?: string) {
  const slug = extractSlugFromHref(href);
  return slug ? getRoutineBySlug(slug) : undefined;
}

export function getIngredientByHref(href?: string) {
  const slug = extractSlugFromHref(href);
  return slug ? getIngredientBySlug(slug) : undefined;
}

export function getTrustPolicyBySlug(slug: string) {
  return trustPolicies.find((policy) => policy.slug === slug);
}
