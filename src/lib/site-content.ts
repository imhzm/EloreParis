import { supportRouteLinks } from "@/lib/support-content";

const localSiteUrl = "http://localhost:3056";

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
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : undefined;

  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.RENDER_EXTERNAL_URL,
    vercelProductionUrl,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
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

export const siteUrl = resolveSiteUrl();

export const siteName = "Cozmateks";
export const siteTagline = "بيت الجمال السعودي المختار بعناية";
export const defaultDescription =
  "متجر تجميل سعودي فاخر يجمع بين الاكتشاف الذكي، المحتوى العربي الأنيق، وصفحات بيع جاهزة للتوسع عبر SEO وAEO وGEO.";

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export const trustPoints = [
  "شحن داخل السعودية",
  "مختارات أصلية بعناية",
  "سياسات واضحة",
  "تجربة جوال راقية",
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
  category: string;
  title: string;
  excerpt: string;
  readingTime: string;
  publishedAt: string;
  updatedAt: string;
  answer: string;
  relatedConcern: string;
  relatedRoutine: string;
  relatedProduct: string;
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
    slug: "best-light-sunscreen-oily-skin-saudi-weather",
    category: "أدلة العناية",
    title: "أفضل واقي شمس خفيف للبشرة الدهنية في الأجواء الحارة",
    excerpt:
      "الاختيار الذكي يبدأ من القوام والثبات والراحة على البشرة، لا من الادعاءات الكبيرة. هذا الدليل يوضح ما الذي تبحثين عنه قبل الشراء.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    answer:
      "أفضل واقي شمس خفيف للبشرة الدهنية هو الذي يوفّر حماية يومية مع ملمس غير مزعج، ثبات عملي، واندماج سهل تحت المكياج أو وحده خلال اليوم.",
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
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
    category: "روتينات",
    title: "كيف تبنين روتينًا صباحيًا متوازنًا للبشرة المختلطة؟",
    excerpt:
      "الروتين الصباحي الذكي لا يكدّس المنتجات. هو ترتيب واضح يوازن بين الراحة، الحماية، والمظهر المرتب خلال اليوم.",
    readingTime: "5 دقائق",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    answer:
      "الروتين الصباحي للبشرة المختلطة يبدأ بتنظيف لطيف، ثم طبقة علاج أو دعم خفيفة عند الحاجة، ثم ترطيب متوازن، وأخيرًا حماية يومية مريحة.",
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
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
    slug: "niacinamide-vs-vitamin-c-which-fits-your-routine",
    category: "مكوّنات",
    title: "الفرق بين النياسيناميد وفيتامين C: متى تختارين كل مكوّن؟",
    excerpt:
      "السؤال ليس أيهما أفضل بشكل مطلق، بل أيهما أنسب لهدف الروتين والملمس الذي تبحثين عنه ووقت الاستخدام داخل اليوم.",
    readingTime: "7 دقائق",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    answer:
      "اختيار النياسيناميد أو فيتامين C يعتمد على الهدف التجاري والتحريري للروتين: هل التركيز على توازن المظهر ووضوح الاستخدام اليومي، أم على إشراقة صباحية محددة المسار؟",
    relatedConcern: "/concerns/pigmentation",
    relatedRoutine: "/routines/morning-routine-oily-skin",
    relatedProduct: "/products/radiant-dew-serum",
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
    category: "أدلة المكياج",
    title: "كيف تختارين فاونديشن مناسبًا للمناسبات من دون طبقات مزعجة؟",
    excerpt:
      "القرار الصحيح يبدأ من النتيجة المطلوبة وملمس القاعدة على البشرة، لا من اسم المنتج وحده. هذا الدليل يشرح كيف تختارين finish وتغطية يناسبان المناسبة.",
    readingTime: "6 دقائق",
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    answer:
      "فاونديشن المناسبات الأفضل هو الذي يوازن بين التغطية والثبات وراحة الملمس، مع قدرة على البناء التدريجي بدل مظهر ثقيل من البداية.",
    relatedConcern: "/concerns/makeup-longwear",
    relatedRoutine: "/routines/occasion-base-routine",
    relatedProduct: "/products/velvet-base-foundation",
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
    body: "أي جمع لبيانات الحسابات أو التفضيلات أو اختبارات البشرة يجب أن يسبقه شرح واضح للغرض من المعالجة، مع مسار ظاهر للوصول إلى سياسة الخصوصية.",
    summary:
      "هذه الصفحة تشرح ما الذي يمكن جمعه من بيانات، ولماذا، ومتى يظهر طلب الموافقة أو الإشعار، مع لغة بسيطة لا تخفي الغرض من النماذج أو الاشتراكات.",
    points: [
      "سياسة خصوصية متاحة قبل جمع البيانات",
      "توضيح الغرض من النماذج والاشتراك والبروفايل",
      "منع الصياغات الغامضة أو جمع بيانات بلا مبرر واضح",
    ],
    sections: [
      {
        heading: "نطاق البيانات التي قد يجمعها الموقع",
        body: "الحد الأدنى المقبول هو البيانات اللازمة للتواصل، تنفيذ الطلب، أو تحسين التفضيلات داخل التجربة عندما يكون ذلك مبررًا بوضوح. لا ينبغي توسيع النطاق لمجرد توفر النموذج أو الرغبة في جمع أكبر قدر ممكن من المعلومات.",
      },
      {
        heading: "كيف تُعرض الموافقات والتحكم؟",
        body: "يجب أن ترى الزائرة سبب جمع البيانات قبل الإرسال، وأن يكون الوصول إلى سياسة الخصوصية ظاهرًا في النماذج والاشتراكات ذات الصلة. كما يجب تجنب الصياغات العامة من نوع استخدام بياناتك لتحسين التجربة دون شرح معنى ذلك عمليًا.",
      },
    ],
    faq: [
      {
        question: "هل تحتاج كل نقطة جمع بيانات إلى شرح مستقل؟",
        answer:
          "عندما يختلف الغرض، نعم. نموذج التواصل، الاشتراك في الرسائل، وإنشاء الحساب ليست نفس الحالة، ولذلك يجب أن يظهر الغرض المناسب في كل سياق.",
      },
      {
        question: "ما الخطأ في الصياغة العامة جدًا داخل سياسات الخصوصية؟",
        answer:
          "الصياغة العامة تقلل الثقة وتفتح مساحة لسوء الفهم. الصفحة الجيدة تشرح الغرض بلغة محددة وواضحة ومتسقة مع ما يحدث فعليًا في المنتج.",
      },
    ],
  },
  {
    slug: "shipping",
    title: "الشحن والتوصيل",
    footerLabel: "الشحن والتوصيل",
    body: "الشحن في هذا المشروع جزء من الثقة، لذلك يجب أن يظهر بوضوح: زمن التسليم المتوقع، التغطية داخل السعودية، الدفع عند الاستلام، وأي حدود على المنتجات أو المناطق.",
    summary:
      "صفحة الشحن هنا تحدد كيف يظهر الوعد التشغيلي قبل الدفع: مناطق التغطية، نوافذ التسليم، ومتى تتغير التوقعات وفق نوع المنتج أو المدينة أو مزود الخدمة.",
    points: [
      "زمن توصيل واضح وقابل للتحديث",
      "سياسات الشحن تظهر قبل الدفع لا بعده",
      "مواءمة المحتوى مع Merchant Center لاحقًا",
    ],
    sections: [
      {
        heading: "التغطية وأزمنة التسليم",
        body: "الصفحة الجيدة لا تكتفي بعبارة شحن سريع، بل تشرح نطاق التغطية داخل السعودية، وكيف تختلف المدة المتوقعة بحسب المدينة أو نوع الطلب، وما إذا كانت هناك حالات تؤخر التسليم مثل المواسم أو الطلبات المسبقة.",
      },
      {
        heading: "متى يُعرض الوعد التشغيلي للعميلة؟",
        body: "أفضل موضع لسياسة الشحن ليس بعد الدفع فقط، بل قبل اتخاذ القرار: في صفحة المنتج، داخل الخطوات الشرائية، وفي صفحة السياسة نفسها. بهذه الطريقة تصبح المعلومة أداة قرار وليست نصًا دفاعيًا يظهر متأخرًا.",
      },
    ],
    faq: [
      {
        question: "هل تكفي عبارة 2-4 أيام عمل في جميع الصفحات؟",
        answer:
          "تصلح كبداية مؤقتة فقط إذا كانت واقعية وقابلة للتحديث. عند الإطلاق الفعلي يجب ربطها بنطاق الخدمة الحقيقي وأي استثناءات تشغيلية مهمة.",
      },
      {
        question: "ما الذي يرفع الثقة أكثر في صفحة الشحن؟",
        answer:
          "الوضوح، لا المبالغة. تحديد متى يصل الطلب عادة، متى قد يتأخر، وكيف ستعرف العميلة بحالة الشحنة، أهم من العبارات التسويقية العامة.",
      },
    ],
  },
  {
    slug: "returns",
    title: "الاستبدال والاسترجاع",
    footerLabel: "الاستبدال والاسترجاع",
    body: "صفحة الاسترجاع ليست نصًا قانونيًا فقط، بل طبقة طمأنة تجارية. يجب أن تشرح الشروط، الاستثناءات، وآلية الاسترداد بلغة واضحة وقصيرة.",
    summary:
      "توضح هذه الصفحة متى يمكن قبول الطلبات المرتجعة أو المستبدلة، وما الاستثناءات المتوقعة للمنتجات الحساسة، وكيف يظهر مسار الاسترداد بلغة مفهومة وغير مبهمة.",
    points: [
      "لغة مفهومة وغير مبهمة",
      "شرح الاستثناءات للمنتجات الحساسة بوضوح",
      "تمهيد لربط MerchantReturnPolicy في البيانات المنظمة",
    ],
    sections: [
      {
        heading: "شروط قبول الطلب والاستثناءات",
        body: "في قطاع التجميل، يجب أن تكون الاستثناءات واضحة منذ البداية، خاصة مع المنتجات المفتوحة أو الحساسة أو المرتبطة بالنظافة الشخصية. الصفحة الجيدة لا تخفي هذا تحت صياغة قانونية طويلة، بل تعرضه بلغة قصيرة وسهلة المراجعة.",
      },
      {
        heading: "كيف يظهر مسار الطلب والاسترداد؟",
        body: "تحتاج العميلة أن تعرف من أين تبدأ، وما الذي ستقدمه، وكم يستغرق الرد أو الاسترداد عند قبول الطلب. أي وعود مالية أو زمنية لا تُذكر إلا إذا كانت مدعومة بتشغيل فعلي يمكن الالتزام به.",
      },
    ],
    faq: [
      {
        question: "هل يجب أن تكون صفحة الاسترجاع مختصرة جدًا؟",
        answer:
          "يجب أن تكون واضحة أولًا. الاختصار جيد عندما لا يضحي بالفهم، لكن حذف الشروط أو الاستثناءات المهمة يضر الثقة بدل أن يحسنها.",
      },
      {
        question: "متى تصبح هذه الصفحة جاهزة للربط في البيانات المنظمة؟",
        answer:
          "عندما تكون شروط الإرجاع الفعلية معتمدة ويمكن تمثيلها بوضوح في المحتوى المرئي، عندها يصبح ربط MerchantReturnPolicy خطوة منطقية وآمنة.",
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

function extractSlugFromHref(href: string) {
  return href.split("/").filter(Boolean).at(-1);
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

export function getProductByHref(href: string) {
  const slug = extractSlugFromHref(href);
  return slug ? getProductBySlug(slug) : undefined;
}

export function getShopCollectionBySlug(slug: string) {
  return shopCollections.find((collection) => collection.slug === slug);
}

export function getConcernByHref(href: string) {
  const slug = extractSlugFromHref(href);
  return slug ? getConcernBySlug(slug) : undefined;
}

export function getRoutineByHref(href: string) {
  const slug = extractSlugFromHref(href);
  return slug ? getRoutineBySlug(slug) : undefined;
}

export function getIngredientByHref(href: string) {
  const slug = extractSlugFromHref(href);
  return slug ? getIngredientBySlug(slug) : undefined;
}

export function getTrustPolicyBySlug(slug: string) {
  return trustPolicies.find((policy) => policy.slug === slug);
}
