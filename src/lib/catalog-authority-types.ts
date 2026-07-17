import { safePublicMediaUrl } from "@/lib/public-media-url";

export const catalogCollections = [
  "skincare",
  "makeup",
  "haircare",
  "bodycare",
  "tools",
  "beauty-sets",
] as const;

export type CatalogCollection = (typeof catalogCollections)[number];
export type CatalogRecordStatus = "draft" | "approved" | "retired";
export type CatalogApprovalType =
  | "data"
  | "media"
  | "claims"
  | "compliance"
  | "price"
  | "publication";

export type CatalogImportPayload = {
  sourceRef: string;
  generatedAt: string;
  currency: "SAR";
  taxProfile: {
    rateBps: number;
    pricesIncludeTax: true;
    evidenceRef: string;
    approvedBy: string;
    approvedAt: string;
  };
  inventoryLocation: {
    code: string;
    name: string;
  };
  shippingMethods: Array<{
    id: "standard" | "express";
    labelAr: string;
    labelEn: string;
    grossHalalas: number;
    enabled: boolean;
    evidenceRef: string;
    estimatedDeliveryAr: string;
    estimatedDeliveryEn: string;
  }>;
  products: CatalogImportProduct[];
  approvals: CatalogImportApproval[];
};

export type CatalogImportProduct = {
  slug: string;
  collection: CatalogCollection;
  status: CatalogRecordStatus;
  brand: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  compliance: {
    sfdaNotificationId: string | null;
    ecosmaProductReference: string | null;
    notificationStatus: "pending" | "active" | "suspended";
    safetyStandardVersion: string | null;
    claimsStandardVersion: string | null;
    manufacturerName: string | null;
    manufacturerAddress: string | null;
    manufacturerCountry: string | null;
    saudiImporterName: string | null;
    saudiImporterAddress: string | null;
    saudiImporterLicense: string | null;
    productFunctionAr: string | null;
    productFunctionEn: string | null;
    fullInci: string | null;
    storageAr: string | null;
    storageEn: string | null;
    directionsAr: string | null;
    directionsEn: string | null;
    warningsAr: string[];
    warningsEn: string[];
    countryOfOrigin: string | null;
    expiryMode: "expiry" | "pao" | null;
    shelfLifeMonths: number | null;
    paoMonths: number | null;
    internalLabelArtworkRef: string | null;
    externalLabelArtworkRef: string | null;
    publicImageRightsEvidence: string | null;
  };
  returnProfile: {
    returnWindowDays: number;
    hygieneSealRequired: boolean;
    openedReturnEligible: boolean;
    healthResaleExceptionApplies: boolean;
    exceptionReasonAr: string | null;
    exceptionReasonEn: string | null;
    approvedPolicyVersion: string | null;
  };
  media: Array<{
    url: string;
    altAr: string;
    altEn: string;
    rightsEvidenceRef: string;
  }>;
  claims: Array<{
    locale: "ar" | "en";
    exactText: string;
    evidenceRefs: string[];
    status: "approved" | "rejected";
  }>;
  variants: CatalogImportVariant[];
};

export type CatalogImportVariant = {
  sku: string;
  barcode: string;
  status: CatalogRecordStatus;
  labelAr: string;
  labelEn: string;
  size: string;
  grossHalalas: number;
  compareAtHalalas: number | null;
  stockOnHand: number;
  safetyStock: number;
  codEligible: boolean;
};

export type CatalogImportApproval = {
  subjectType: "catalog" | "product" | "variant";
  subjectId: string;
  approvalType: CatalogApprovalType;
  status: "approved" | "rejected";
  evidenceRef: string;
  approvedBy: string;
  decidedAt: string;
};

export type CatalogImportValidationResult =
  | { ok: true; value: CatalogImportPayload }
  | { ok: false; issues: string[] };

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const codePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, maximum = 2_000) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maximum ? normalized : null;
}

function nullableString(value: unknown, maximum = 2_000) {
  if (value === null) return null;
  return stringValue(value, maximum);
}

function isoDate(value: unknown) {
  const normalized = stringValue(value, 64);
  return normalized && !Number.isNaN(Date.parse(normalized))
    ? new Date(normalized).toISOString()
    : null;
}

function integerValue(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : null;
}

function stringArray(value: unknown, maximumItems = 50) {
  if (!Array.isArray(value) || value.length > maximumItems) return null;
  const items = value.map((item) => stringValue(item, 1_000));
  return items.every((item): item is string => item !== null) ? items : null;
}

function parseVariant(
  value: unknown,
  path: string,
  issues: string[],
): CatalogImportVariant | null {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object.`);
    return null;
  }

  const sku = stringValue(value.sku, 160);
  const barcode = stringValue(value.barcode, 64);
  const status = value.status;
  const labelAr = stringValue(value.labelAr, 240);
  const labelEn = stringValue(value.labelEn, 240);
  const size = stringValue(value.size, 80);
  const grossHalalas = integerValue(value.grossHalalas, 0, 100_000_000);
  const compareAtHalalas =
    value.compareAtHalalas === null
      ? null
      : integerValue(value.compareAtHalalas, 0, 100_000_000);
  const stockOnHand = integerValue(value.stockOnHand, 0, 10_000_000);
  const safetyStock = integerValue(value.safetyStock, 0, 10_000_000);

  if (
    !sku || !codePattern.test(sku) || !barcode || !/^\d{8,14}$/.test(barcode) ||
    !["draft", "approved", "retired"].includes(String(status)) ||
    !labelAr || !labelEn || !size || grossHalalas === null ||
    compareAtHalalas === null && value.compareAtHalalas !== null ||
    compareAtHalalas !== null && compareAtHalalas < grossHalalas ||
    stockOnHand === null || safetyStock === null ||
    typeof value.codEligible !== "boolean"
  ) {
    issues.push(`${path} contains invalid SKU, barcode, status, money, stock, or localized labels.`);
    return null;
  }

  return {
    sku,
    barcode,
    status: status as CatalogRecordStatus,
    labelAr,
    labelEn,
    size,
    grossHalalas,
    compareAtHalalas,
    stockOnHand,
    safetyStock,
    codEligible: value.codEligible,
  };
}

function parseProduct(
  value: unknown,
  index: number,
  issues: string[],
): CatalogImportProduct | null {
  const path = `products[${index}]`;
  if (!isRecord(value) || !isRecord(value.compliance) || !isRecord(value.returnProfile)) {
    issues.push(`${path} must include product, compliance, and return-profile objects.`);
    return null;
  }

  const slug = stringValue(value.slug, 160);
  const collection = value.collection;
  const status = value.status;
  const brand = stringValue(value.brand, 160);
  const nameAr = stringValue(value.nameAr, 240);
  const nameEn = stringValue(value.nameEn, 240);
  const descriptionAr = stringValue(value.descriptionAr, 4_000);
  const descriptionEn = stringValue(value.descriptionEn, 4_000);
  const compliance = value.compliance;
  const returnProfile = value.returnProfile;
  const warningsAr = stringArray(compliance.warningsAr);
  const warningsEn = stringArray(compliance.warningsEn);
  const shelfLifeMonths = compliance.shelfLifeMonths === null
    ? null
    : integerValue(compliance.shelfLifeMonths, 1, 240);
  const paoMonths = compliance.paoMonths === null
    ? null
    : integerValue(compliance.paoMonths, 1, 120);
  const returnWindowDays = integerValue(returnProfile.returnWindowDays, 0, 365);

  if (
    !slug || !slugPattern.test(slug) ||
    !catalogCollections.includes(collection as CatalogCollection) ||
    !["draft", "approved", "retired"].includes(String(status)) ||
    !brand || !nameAr || !nameEn || !descriptionAr || !descriptionEn ||
    !["pending", "active", "suspended"].includes(String(compliance.notificationStatus)) ||
    !["expiry", "pao", null].includes(compliance.expiryMode as "expiry" | "pao" | null) ||
    warningsAr === null || warningsEn === null ||
    shelfLifeMonths === null && compliance.shelfLifeMonths !== null ||
    paoMonths === null && compliance.paoMonths !== null ||
    returnWindowDays === null ||
    typeof returnProfile.hygieneSealRequired !== "boolean" ||
    typeof returnProfile.openedReturnEligible !== "boolean" ||
    typeof returnProfile.healthResaleExceptionApplies !== "boolean"
  ) {
    issues.push(`${path} contains invalid localized, compliance, expiry, or return data.`);
    return null;
  }

  const variants = Array.isArray(value.variants)
    ? value.variants.map((variant, variantIndex) =>
        parseVariant(variant, `${path}.variants[${variantIndex}]`, issues))
    : [];
  if (!Array.isArray(value.variants) || variants.length === 0 || variants.some((item) => !item)) {
    issues.push(`${path} must include at least one valid variant.`);
    return null;
  }

  const media = Array.isArray(value.media)
    ? value.media.map((item, mediaIndex) => {
        if (!isRecord(item)) {
          issues.push(`${path}.media[${mediaIndex}] must be an object.`);
          return null;
        }
        const url = stringValue(item.url, 2_000);
        const altAr = stringValue(item.altAr, 500);
        const altEn = stringValue(item.altEn, 500);
        const rightsEvidenceRef = stringValue(item.rightsEvidenceRef, 1_000);
        if (!url || !altAr || !altEn || !rightsEvidenceRef) {
          issues.push(`${path}.media[${mediaIndex}] is incomplete.`);
          return null;
        }
        // Refuse here what the public projection would drop silently.
        // getPublicCatalogSnapshot runs every media URL through this same rule
        // and discards the ones that fail, then discards any product left with
        // no media. The authority used to accept any 2,000-character string, so
        // an ordinary CDN URL passed import, passed readiness, published — and
        // the product then vanished from the storefront with nothing said. A
        // gate that reports ready for a catalogue that cannot render is worse
        // than no gate.
        if (!safePublicMediaUrl(url)) {
          issues.push(
            `${path}.media[${mediaIndex}] url must be a site-relative path under /public ` +
              `(for example /elore-assets/bottle.avif). "${url}" cannot be served, so this ` +
              `product would publish and then not appear.`,
          );
          return null;
        }
        return { url, altAr, altEn, rightsEvidenceRef };
      })
    : [];

  const claims = Array.isArray(value.claims)
    ? value.claims.map((item, claimIndex) => {
        if (!isRecord(item)) {
          issues.push(`${path}.claims[${claimIndex}] must be an object.`);
          return null;
        }
        const exactText = stringValue(item.exactText, 1_000);
        const evidenceRefs = stringArray(item.evidenceRefs, 20);
        if (!exactText || !evidenceRefs || !["ar", "en"].includes(String(item.locale)) || !["approved", "rejected"].includes(String(item.status))) {
          issues.push(`${path}.claims[${claimIndex}] is invalid.`);
          return null;
        }
        return {
          locale: item.locale as "ar" | "en",
          exactText,
          evidenceRefs,
          status: item.status as "approved" | "rejected",
        };
      })
    : [];

  if (media.some((item) => !item) || claims.some((item) => !item)) return null;

  return {
    slug,
    collection: collection as CatalogCollection,
    status: status as CatalogRecordStatus,
    brand,
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    compliance: {
      sfdaNotificationId: nullableString(compliance.sfdaNotificationId, 240),
      ecosmaProductReference: nullableString(compliance.ecosmaProductReference, 240),
      notificationStatus: compliance.notificationStatus as "pending" | "active" | "suspended",
      safetyStandardVersion: nullableString(compliance.safetyStandardVersion, 240),
      claimsStandardVersion: nullableString(compliance.claimsStandardVersion, 240),
      manufacturerName: nullableString(compliance.manufacturerName, 240),
      manufacturerAddress: nullableString(compliance.manufacturerAddress, 500),
      manufacturerCountry: nullableString(compliance.manufacturerCountry, 160),
      saudiImporterName: nullableString(compliance.saudiImporterName, 240),
      saudiImporterAddress: nullableString(compliance.saudiImporterAddress, 500),
      saudiImporterLicense: nullableString(compliance.saudiImporterLicense, 240),
      productFunctionAr: nullableString(compliance.productFunctionAr, 1_000),
      productFunctionEn: nullableString(compliance.productFunctionEn, 1_000),
      fullInci: nullableString(compliance.fullInci, 8_000),
      storageAr: nullableString(compliance.storageAr, 1_000),
      storageEn: nullableString(compliance.storageEn, 1_000),
      directionsAr: nullableString(compliance.directionsAr, 2_000),
      directionsEn: nullableString(compliance.directionsEn, 2_000),
      warningsAr,
      warningsEn,
      countryOfOrigin: nullableString(compliance.countryOfOrigin, 160),
      expiryMode: compliance.expiryMode as "expiry" | "pao" | null,
      shelfLifeMonths,
      paoMonths,
      internalLabelArtworkRef: nullableString(compliance.internalLabelArtworkRef, 1_000),
      externalLabelArtworkRef: nullableString(compliance.externalLabelArtworkRef, 1_000),
      publicImageRightsEvidence: nullableString(compliance.publicImageRightsEvidence, 1_000),
    },
    returnProfile: {
      returnWindowDays,
      hygieneSealRequired: returnProfile.hygieneSealRequired,
      openedReturnEligible: returnProfile.openedReturnEligible,
      healthResaleExceptionApplies: returnProfile.healthResaleExceptionApplies,
      exceptionReasonAr: nullableString(returnProfile.exceptionReasonAr, 1_000),
      exceptionReasonEn: nullableString(returnProfile.exceptionReasonEn, 1_000),
      approvedPolicyVersion: nullableString(returnProfile.approvedPolicyVersion, 240),
    },
    media: media.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    claims: claims.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    variants: variants.filter((item): item is CatalogImportVariant => Boolean(item)),
  };
}

function parseApproval(value: unknown, index: number, issues: string[]) {
  if (!isRecord(value)) {
    issues.push(`approvals[${index}] must be an object.`);
    return null;
  }
  const subjectId = stringValue(value.subjectId, 240);
  const evidenceRef = stringValue(value.evidenceRef, 1_000);
  const approvedBy = stringValue(value.approvedBy, 240);
  const decidedAt = isoDate(value.decidedAt);
  if (
    !["catalog", "product", "variant"].includes(String(value.subjectType)) ||
    !["data", "media", "claims", "compliance", "price", "publication"].includes(String(value.approvalType)) ||
    !["approved", "rejected"].includes(String(value.status)) ||
    !subjectId || !evidenceRef || !approvedBy || !decidedAt
  ) {
    issues.push(`approvals[${index}] is invalid.`);
    return null;
  }
  return {
    subjectType: value.subjectType,
    subjectId,
    approvalType: value.approvalType,
    status: value.status,
    evidenceRef,
    approvedBy,
    decidedAt,
  } as CatalogImportApproval;
}

function parseShippingMethod(value: unknown, index: number, issues: string[]) {
  if (!isRecord(value)) {
    issues.push(`shippingMethods[${index}] must be an object.`);
    return null;
  }
  const labelAr = stringValue(value.labelAr, 240);
  const labelEn = stringValue(value.labelEn, 240);
  const grossHalalas = integerValue(value.grossHalalas, 0, 10_000_000);
  const evidenceRef = stringValue(value.evidenceRef, 1_000);
  const estimatedDeliveryAr = stringValue(value.estimatedDeliveryAr, 500);
  const estimatedDeliveryEn = stringValue(value.estimatedDeliveryEn, 500);
  if (
    !["standard", "express"].includes(String(value.id)) ||
    !labelAr || !labelEn || grossHalalas === null ||
    typeof value.enabled !== "boolean" || !evidenceRef ||
    !estimatedDeliveryAr || !estimatedDeliveryEn
  ) {
    issues.push(`shippingMethods[${index}] is invalid.`);
    return null;
  }
  return {
    id: value.id as "standard" | "express",
    labelAr,
    labelEn,
    grossHalalas,
    enabled: value.enabled,
    evidenceRef,
    estimatedDeliveryAr,
    estimatedDeliveryEn,
  };
}

export function parseCatalogImportPayload(value: unknown): CatalogImportValidationResult {
  const issues: string[] = [];
  if (!isRecord(value) || !isRecord(value.taxProfile) || !isRecord(value.inventoryLocation)) {
    return { ok: false, issues: ["Catalog import must include taxProfile and inventoryLocation objects."] };
  }

  const sourceRef = stringValue(value.sourceRef, 1_000);
  const generatedAt = isoDate(value.generatedAt);
  const taxProfile = value.taxProfile;
  const inventoryLocation = value.inventoryLocation;
  const rateBps = integerValue(taxProfile.rateBps, 0, 10_000);
  const approvedAt = isoDate(taxProfile.approvedAt);
  const taxEvidenceRef = stringValue(taxProfile.evidenceRef, 1_000);
  const taxApprovedBy = stringValue(taxProfile.approvedBy, 240);
  const locationCode = stringValue(inventoryLocation.code, 80);
  const locationName = stringValue(inventoryLocation.name, 240);

  if (!sourceRef || !generatedAt || value.currency !== "SAR") issues.push("Catalog source, timestamp, or SAR currency is invalid.");
  if (rateBps === null || taxProfile.pricesIncludeTax !== true || !taxEvidenceRef || !taxApprovedBy || !approvedAt) {
    issues.push("Tax profile must be approved, evidence-backed, and VAT-inclusive.");
  }
  if (!locationCode || !codePattern.test(locationCode) || !locationName) issues.push("Inventory location is invalid.");

  const products = Array.isArray(value.products)
    ? value.products.map((product, index) => parseProduct(product, index, issues))
    : [];
  const approvals = Array.isArray(value.approvals)
    ? value.approvals.map((approval, index) => parseApproval(approval, index, issues))
    : [];
  const shippingMethods = Array.isArray(value.shippingMethods)
    ? value.shippingMethods.map((method, index) =>
        parseShippingMethod(method, index, issues))
    : [];

  if (!Array.isArray(value.products) || products.length === 0) issues.push("Catalog import must include at least one product.");
  if (!Array.isArray(value.approvals)) issues.push("Catalog approvals must be an array.");
  if (!Array.isArray(value.shippingMethods) || shippingMethods.length === 0) {
    issues.push("Catalog import must include at least one approved shipping method.");
  }

  const validProducts = products.filter((item): item is CatalogImportProduct => Boolean(item));
  const validApprovals = approvals.filter((item): item is CatalogImportApproval => Boolean(item));
  const validShippingMethods = shippingMethods.filter(
    (item): item is NonNullable<typeof item> => Boolean(item),
  );
  if (new Set(validShippingMethods.map((method) => method.id)).size !== validShippingMethods.length) {
    issues.push("Shipping method ids must be unique.");
  }
  const slugs = new Set<string>();
  const skus = new Set<string>();
  const barcodes = new Set<string>();
  for (const product of validProducts) {
    if (slugs.has(product.slug.toLowerCase())) issues.push(`Duplicate product slug: ${product.slug}.`);
    slugs.add(product.slug.toLowerCase());
    for (const variant of product.variants) {
      if (skus.has(variant.sku.toLowerCase())) issues.push(`Duplicate SKU: ${variant.sku}.`);
      if (barcodes.has(variant.barcode)) issues.push(`Duplicate barcode: ${variant.barcode}.`);
      skus.add(variant.sku.toLowerCase());
      barcodes.add(variant.barcode);
    }
  }

  if (issues.length || !sourceRef || !generatedAt || rateBps === null || !approvedAt || !taxEvidenceRef || !taxApprovedBy || !locationCode || !locationName) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      sourceRef,
      generatedAt,
      currency: "SAR",
      taxProfile: {
        rateBps,
        pricesIncludeTax: true,
        evidenceRef: taxEvidenceRef,
        approvedBy: taxApprovedBy,
        approvedAt,
      },
      inventoryLocation: { code: locationCode, name: locationName },
      shippingMethods: validShippingMethods,
      products: validProducts,
      approvals: validApprovals,
    },
  };
}
