// The QA catalogue fixture: one approved product with the full evidence chain the
// catalog authority requires.
//
// Shared, not duplicated. Two callers need this exact record and they must never
// drift apart:
//   - scripts/catalog-authority-check.mjs proves the authority ACCEPTS it, and that
//     every gate rejects the mutations around it.
//   - scripts/dev-seed-approved-catalog.mjs publishes it so the purchase journey is
//     reachable locally at all.
// A copy in each would let the seeder keep working against a schema the authority
// had already moved past — which is the exact failure the evidence gates exist to stop.
//
// Everything here is branded "QA AUTHORITY ONLY" and every evidenceRef is an
// `evidence://qa/...` sentinel, so this record can never be mistaken for merchandise
// (CLAUDE.md §19: no fake product data on the real path).

const decidedAt = "2026-07-15T10:00:00.000Z";
const product = {
  slug: "qa-authority-product",
  collection: "skincare",
  status: "approved",
  brand: "QA AUTHORITY ONLY",
  nameAr: "منتج تحقق داخلي",
  nameEn: "Internal authority verification product",
  descriptionAr: "سجل مؤقت لاختبار سلطة الكتالوج ولا ينشر خارج قاعدة الاختبار.",
  descriptionEn: "Temporary record used only by the isolated catalog authority test.",
  compliance: {
    sfdaNotificationId: "QA-SFDA-001",
    ecosmaProductReference: "QA-ECOSMA-001",
    notificationStatus: "active",
    safetyStandardVersion: "SFDA.CO/GSO 1943:2024",
    claimsStandardVersion: "SFDA.CO/GSO 2528:2024",
    manufacturerName: "QA Manufacturer",
    manufacturerAddress: "QA manufacturing address",
    manufacturerCountry: "France",
    saudiImporterName: "QA Saudi Importer",
    saudiImporterAddress: "QA importer address",
    saudiImporterLicense: "QA-LICENSE-001",
    productFunctionAr: "ترطيب تجميلي للاختبار الداخلي فقط",
    productFunctionEn: "Cosmetic moisturising test record only",
    fullInci: "Aqua, Glycerin",
    storageAr: "يحفظ في مكان جاف",
    storageEn: "Store in a dry place",
    directionsAr: "يستخدم وفق الملصق",
    directionsEn: "Use according to the label",
    warningsAr: ["للاستخدام الخارجي فقط"],
    warningsEn: ["For external use only"],
    countryOfOrigin: "France",
    expiryMode: "pao",
    shelfLifeMonths: null,
    paoMonths: 12,
    internalLabelArtworkRef: "evidence://qa/internal-label",
    externalLabelArtworkRef: "evidence://qa/external-label",
    publicImageRightsEvidence: "evidence://qa/image-rights",
  },
  returnProfile: {
    returnWindowDays: 7,
    hygieneSealRequired: true,
    openedReturnEligible: false,
    healthResaleExceptionApplies: true,
    exceptionReasonAr: "سجل اختبار لختم النظافة",
    exceptionReasonEn: "Test hygiene-seal record",
    approvedPolicyVersion: "qa-return-v1",
  },
  media: [{
    url: "/elore-assets/ritual-still-life.webp",
    altAr: "صورة تحقق داخلية",
    altEn: "Internal verification image",
    rightsEvidenceRef: "evidence://qa/image-rights",
  }],
  claims: [],
  variants: [
    {
      sku: "QA-AUTH-001",
      barcode: "6287000099993",
      status: "approved",
      labelAr: "الحجم التجريبي",
      labelEn: "Verification size",
      size: "30 ml",
      grossHalalas: 11500,
      compareAtHalalas: null,
      stockOnHand: 3,
      safetyStock: 1,
      codEligible: true,
    },
    {
      sku: "QA-RACE-001",
      barcode: "6287000099986",
      status: "approved",
      labelAr: "اختبار آخر وحدة",
      labelEn: "Last-unit race verification",
      size: "10 ml",
      grossHalalas: 5000,
      compareAtHalalas: null,
      stockOnHand: 1,
      safetyStock: 0,
      codEligible: true,
    },
    {
      sku: "QA-PAY-001",
      barcode: "6287000099979",
      status: "approved",
      labelAr: "اختبار الدفع",
      labelEn: "Payment verification",
      size: "15 ml",
      grossHalalas: 7000,
      compareAtHalalas: null,
      stockOnHand: 1,
      safetyStock: 0,
      codEligible: false,
    },
    {
      sku: "QA-EXP-001",
      barcode: "6287000099962",
      status: "approved",
      labelAr: "اختبار انتهاء الحجز",
      labelEn: "Reservation expiry verification",
      size: "20 ml",
      grossHalalas: 8000,
      compareAtHalalas: null,
      stockOnHand: 1,
      safetyStock: 0,
      codEligible: false,
    },
  ],
};

const approval = (subjectType, subjectId, approvalType) => ({
  subjectType,
  subjectId,
  approvalType,
  status: "approved",
  evidenceRef: `evidence://qa/${subjectType}/${subjectId}/${approvalType}`,
  approvedBy: "qa-catalog-auditor",
  decidedAt,
});

const validPayload = {
  sourceRef: "isolated://catalog-authority-check",
  generatedAt: decidedAt,
  currency: "SAR",
  taxProfile: {
    rateBps: 1500,
    pricesIncludeTax: true,
    evidenceRef: "https://zatca.gov.sa/en/HelpCenter/guidelines/Documents/Guideline-For-Retail-Sector-under-VAT-Provisions.pdf",
    approvedBy: "qa-tax-auditor",
    approvedAt: decidedAt,
  },
  inventoryLocation: { code: "QA-RUH-01", name: "Isolated QA location" },
  shippingMethods: [{
    id: "standard",
    labelAr: "شحن قياسي للاختبار",
    labelEn: "QA standard shipping",
    grossHalalas: 2300,
    enabled: true,
    evidenceRef: "evidence://qa/shipping/standard",
    estimatedDeliveryAr: "مدة اختبار فقط",
    estimatedDeliveryEn: "Verification timeline only",
  }],
  products: [product],
  approvals: [
    approval("catalog", "catalog", "publication"),
    approval("catalog", "catalog", "price"),
    approval("product", product.slug, "data"),
    approval("product", product.slug, "media"),
    approval("product", product.slug, "claims"),
    approval("product", product.slug, "compliance"),
    approval("variant", product.variants[0].sku, "price"),
    approval("variant", product.variants[1].sku, "price"),
    approval("variant", product.variants[2].sku, "price"),
    approval("variant", product.variants[3].sku, "price"),
  ],
};

export { decidedAt, product, approval, validPayload };
