// DEMO / STAGING catalogue fixture — original sample products so the shop grid and
// product page can be previewed populated. NOT real merchandise:
//   - Every record is ÉLORÉ's OWN placeholder, written here (nothing is copied from
//     any other store — no third-party images, names, prices or descriptions).
//   - Every evidenceRef is an `evidence://demo/...` sentinel, and the compliance
//     identifiers are `DEMO-...`, so these can never be mistaken for approved, real,
//     sellable stock (CLAUDE.md §19: no fake product data on the real path).
//   - Copy is descriptive/sensory only — no efficacy or results claims.
//
// Use with scripts/dev-seed-demo-catalog.mjs against a scratch DB to SEE the store
// populated for a demo. Replace with your real approved catalogue before any real
// customer can order.

const decidedAt = "2026-07-17T10:00:00.000Z";

let barcodeCounter = 200000;
const nextBarcode = () => `62870${String(barcodeCounter++).padStart(8, "0")}`;

function compliance(functionAr, functionEn, inci) {
  return {
    sfdaNotificationId: "DEMO-SFDA-000",
    ecosmaProductReference: "DEMO-ECOSMA-000",
    notificationStatus: "active",
    safetyStandardVersion: "SFDA.CO/GSO 1943:2024",
    claimsStandardVersion: "SFDA.CO/GSO 2528:2024",
    manufacturerName: "DEMO Manufacturer",
    manufacturerAddress: "DEMO manufacturing address",
    manufacturerCountry: "France",
    saudiImporterName: "DEMO Saudi Importer",
    saudiImporterAddress: "DEMO importer address",
    saudiImporterLicense: "DEMO-LICENSE-000",
    productFunctionAr: functionAr,
    productFunctionEn: functionEn,
    fullInci: inci,
    storageAr: "يحفظ في مكان جاف بعيدًا عن الحرارة والشمس المباشرة.",
    storageEn: "Store in a dry place away from heat and direct sunlight.",
    directionsAr: "يستخدم وفق الملصق كجزء من روتينك اليومي.",
    directionsEn: "Use as directed on the label, as part of your daily ritual.",
    warningsAr: ["للاستخدام الخارجي فقط.", "يوقف الاستخدام عند ظهور تهيّج."],
    warningsEn: ["For external use only.", "Discontinue use if irritation appears."],
    countryOfOrigin: "France",
    expiryMode: "pao",
    shelfLifeMonths: null,
    paoMonths: 12,
    internalLabelArtworkRef: "evidence://demo/internal-label",
    externalLabelArtworkRef: "evidence://demo/external-label",
    publicImageRightsEvidence: "evidence://demo/image-rights",
  };
}

const returnProfile = {
  returnWindowDays: 14,
  hygieneSealRequired: true,
  openedReturnEligible: false,
  healthResaleExceptionApplies: true,
  exceptionReasonAr: "منتج تجميلي مختوم لأسباب صحية.",
  exceptionReasonEn: "Sealed cosmetic product for hygiene reasons.",
  approvedPolicyVersion: "demo-return-v1",
};

function variant(sku, labelAr, labelEn, size, grossHalalas, compareAtHalalas = null, stockOnHand = 8) {
  return {
    sku,
    barcode: nextBarcode(),
    status: "approved",
    labelAr,
    labelEn,
    size,
    grossHalalas,
    compareAtHalalas,
    stockOnHand,
    safetyStock: 1,
    codEligible: true,
  };
}

function makeProduct(spec) {
  return {
    slug: spec.slug,
    collection: spec.collection,
    status: "approved",
    brand: "ÉLORÉ PARIS",
    nameAr: spec.nameAr,
    nameEn: spec.nameEn,
    descriptionAr: spec.descriptionAr,
    descriptionEn: spec.descriptionEn,
    compliance: compliance(spec.functionAr, spec.functionEn, spec.inci),
    returnProfile,
    media: [{
      url: spec.image,
      altAr: spec.altAr,
      altEn: spec.altEn,
      rightsEvidenceRef: "evidence://demo/image-rights",
    }],
    claims: [],
    variants: spec.variants,
  };
}

// ---- the sample products ----------------------------------------------------

const specs = [
  {
    slug: "demo-hydration-serum", collection: "skincare",
    nameAr: "سيروم الترطيب المكثّف", nameEn: "Deep hydration serum",
    descriptionAr: "قوام خفيف يمتصّ بسرعة ويترك البشرة بملمس ناعم ومريح.", descriptionEn: "A lightweight, fast-absorbing texture that leaves skin soft and comfortable.",
    functionAr: "سيروم ترطيب للوجه", functionEn: "Facial hydrating serum", inci: "Aqua, Glycerin, Sodium Hyaluronate",
    image: "/elore-assets/texture-skincare-serum-concept-1536w.avif", altAr: "قوام سيروم العناية بالبشرة", altEn: "Skincare serum texture",
    variants: [
      variant("DEMO-SERUM-30", "الحجم اليومي", "Everyday size", "30 ml", 24000),
      variant("DEMO-SERUM-50", "الحجم الكبير", "Larger size", "50 ml", 34000),
    ],
  },
  {
    slug: "demo-night-cream", collection: "skincare",
    nameAr: "كريم الليل المغذّي", nameEn: "Nourishing night cream",
    descriptionAr: "كريم غنيّ القوام لروتين المساء، يترك إحساسًا بالراحة حتى الصباح.", descriptionEn: "A rich evening cream that leaves a comfortable finish through the night.",
    functionAr: "كريم ليلي للوجه", functionEn: "Facial night cream", inci: "Aqua, Glycerin, Butyrospermum Parkii Butter",
    image: "/elore-assets/editorial-skin-light-concept-1122w.avif", altAr: "دراسة ضوء للعناية بالبشرة", altEn: "Skincare light study",
    variants: [variant("DEMO-NIGHT-50", "الحجم القياسي", "Standard size", "50 ml", 32000)],
  },
  {
    slug: "demo-satin-foundation", collection: "makeup",
    nameAr: "أساس ساتان مضيء", nameEn: "Satin luminous foundation",
    descriptionAr: "تغطية متوسطة بلمسة ساتان تكمل ملامحك دون أن تخفيها.", descriptionEn: "Medium, satin coverage that completes your features without masking them.",
    functionAr: "كريم أساس للوجه", functionEn: "Facial foundation", inci: "Aqua, Dimethicone, Glycerin, Mica",
    image: "/elore-assets/texture-makeup-pigment-concept-1536w.avif", altAr: "دراسة قوام وألوان المكياج", altEn: "Makeup pigment texture",
    variants: [
      variant("DEMO-FND-N02", "درجة ٠٢ محايد", "Shade 02 Neutral", "30 ml", 21000),
      variant("DEMO-FND-W03", "درجة ٠٣ دافئ", "Shade 03 Warm", "30 ml", 21000),
    ],
  },
  {
    slug: "demo-velvet-lip", collection: "makeup",
    nameAr: "أحمر شفاه مخملي", nameEn: "Velvet lip colour",
    descriptionAr: "لون كثيف بلمسة مخملية مريحة على الشفاه.", descriptionEn: "A pigment-rich colour with a comfortable velvet finish.",
    functionAr: "أحمر شفاه", functionEn: "Lip colour", inci: "Ricinus Communis Seed Oil, Mica, Cera Alba",
    image: "/elore-assets/texture-makeup-pigment-concept-1536w.avif", altAr: "دراسة قوام المكياج", altEn: "Makeup texture",
    variants: [variant("DEMO-LIP-ROSE", "درجة الورد المطفأ", "Muted rose", "3.5 g", 14000)],
  },
  {
    slug: "demo-ritual-hair-oil", collection: "haircare",
    nameAr: "زيت الطقوس للشعر", nameEn: "Ritual hair oil",
    descriptionAr: "زيت خفيف يمنح الشعر لمعانًا ناعمًا وإحساسًا مرتّبًا.", descriptionEn: "A light oil that leaves hair with a soft shine and a tidy feel.",
    functionAr: "زيت للشعر", functionEn: "Hair oil", inci: "Argania Spinosa Kernel Oil, Tocopherol, Parfum",
    image: "/elore-assets/haircare-ribbon-editorial-concept-1122x1402.avif", altAr: "دراسة تحريرية للعناية بالشعر", altEn: "Haircare editorial study",
    variants: [
      variant("DEMO-HAIR-50", "الحجم اليومي", "Everyday size", "50 ml", 19000, 24000),
      variant("DEMO-HAIR-100", "الحجم الكبير", "Larger size", "100 ml", 29000, 34000),
    ],
  },
  {
    slug: "demo-silk-body-lotion", collection: "bodycare",
    nameAr: "لوشن الجسم الحريري", nameEn: "Silk body lotion",
    descriptionAr: "قوام حريري يمتصّ بسرعة ويترك البشرة ناعمة وغير لزجة.", descriptionEn: "A silky texture that absorbs quickly and leaves skin soft, never sticky.",
    functionAr: "لوشن للجسم", functionEn: "Body lotion", inci: "Aqua, Glycerin, Prunus Amygdalus Dulcis Oil",
    image: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif", altAr: "دراسة طقس العناية بالجسم على الحجر", altEn: "Bodycare stone ritual study",
    variants: [variant("DEMO-BODY-200", "الحجم القياسي", "Standard size", "200 ml", 16000, 19000)],
  },
  {
    slug: "demo-refined-body-wash", collection: "bodycare",
    nameAr: "غسول الجسم الفاخر", nameEn: "Refined body wash",
    descriptionAr: "رغوة ناعمة برائحة دافئة هادئة لطقس استحمام مريح.", descriptionEn: "A gentle lather with a soft, warm scent for a comfortable shower ritual.",
    functionAr: "غسول للجسم", functionEn: "Body wash", inci: "Aqua, Coco-Glucoside, Glycerin, Parfum",
    image: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif", altAr: "دراسة العناية بالجسم", altEn: "Bodycare study",
    variants: [variant("DEMO-WASH-250", "الحجم القياسي", "Standard size", "250 ml", 13000)],
  },
  {
    slug: "demo-essential-ritual-set", collection: "beauty-sets",
    nameAr: "مجموعة الطقوس الأساسية", nameEn: "Essential ritual set",
    descriptionAr: "مجموعة مختارة تجمع خطوات العناية الأساسية في تغليف هدية أنيق.", descriptionEn: "A curated set gathering the essential care steps in an elegant gift wrap.",
    functionAr: "مجموعة عناية", functionEn: "Care gift set", inci: "See individual product INCI on each item.",
    image: "/elore-assets/gifting-ribbon-ritual-concept-1536w.avif", altAr: "طقس تغليف الهدايا بالشريط", altEn: "Gifting ribbon ritual",
    variants: [variant("DEMO-SET-01", "المجموعة الكاملة", "Complete set", "طقم", 45000, 52000)],
  },
  {
    slug: "demo-glow-brush", collection: "tools",
    nameAr: "فرشاة التوهّج", nameEn: "Glow brush",
    descriptionAr: "فرشاة ناعمة الملمس لتوزيع متساوٍ ولمسة نهائية مصقولة.", descriptionEn: "A soft-touch brush for even application and a polished finish.",
    functionAr: "أداة تجميل", functionEn: "Beauty tool", inci: "Synthetic fibre bristles, brass ferrule, wood handle.",
    image: "/elore-assets/tools-brass-flatlay-concept-1254x1254.avif", altAr: "دراسة أدوات نحاسية مسطّحة", altEn: "Brass tools flatlay study",
    variants: [variant("DEMO-BRUSH-01", "قطعة واحدة", "Single piece", "قطعة", 9000)],
  },
];

const products = specs.map(makeProduct);

const approval = (subjectType, subjectId, approvalType) => ({
  subjectType,
  subjectId,
  approvalType,
  status: "approved",
  evidenceRef: `evidence://demo/${subjectType}/${subjectId}/${approvalType}`,
  approvedBy: "demo-catalog-auditor",
  decidedAt,
});

const demoPayload = {
  sourceRef: "isolated://demo-catalog",
  generatedAt: decidedAt,
  currency: "SAR",
  taxProfile: {
    rateBps: 1500,
    pricesIncludeTax: true,
    evidenceRef: "https://zatca.gov.sa/en/HelpCenter/guidelines/Documents/Guideline-For-Retail-Sector-under-VAT-Provisions.pdf",
    approvedBy: "demo-tax-auditor",
    approvedAt: decidedAt,
  },
  inventoryLocation: { code: "DEMO-RUH-01", name: "Demo Riyadh location" },
  shippingMethods: [{
    id: "standard",
    labelAr: "شحن قياسي",
    labelEn: "Standard shipping",
    grossHalalas: 2300,
    enabled: true,
    evidenceRef: "evidence://demo/shipping/standard",
    estimatedDeliveryAr: "٢–٥ أيام عمل (عيّنة)",
    estimatedDeliveryEn: "2–5 business days (demo)",
  }],
  products,
  approvals: [
    approval("catalog", "catalog", "publication"),
    approval("catalog", "catalog", "price"),
    ...products.flatMap((product) => [
      approval("product", product.slug, "data"),
      approval("product", product.slug, "media"),
      approval("product", product.slug, "claims"),
      approval("product", product.slug, "compliance"),
      ...product.variants.map((v) => approval("variant", v.sku, "price")),
    ]),
  ],
};

export { decidedAt, products, approval, demoPayload };
