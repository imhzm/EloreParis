export type SupplierId = "atelier-core" | "desert-distribution";

export type SupplierAuthorityRoute =
  | "/ops/catalog"
  | "/ops/orders"
  | "/ops/fulfillment";

export type SupplierRecord = {
  id: SupplierId;
  name: string;
  fulfillmentModel: "direct" | "dropship" | "hybrid";
  leadTime: string;
  defaultMarginTarget: number;
  note: string;
  truthSourceLabel: string;
  defaultAuthorityOwnerLabel: string;
  defaultAuthorityRoute: SupplierAuthorityRoute;
  continuityRule: string;
};

export type ShippingClass = "serum-light" | "foundation-standard";

export type VariantOperationsRecord = {
  productSlug: string;
  sku: string;
  supplierSku: string;
  barcode: string;
  stockOnHand: number;
  lowStockThreshold: number;
  cost: number;
  supplierId: SupplierId;
  shippingClass: ShippingClass;
  codEligible: boolean;
  hidden: boolean;
  shadeSortOrder?: number;
  swatchLabel?: string;
};

const supplierDirectory: Record<SupplierId, SupplierRecord> = {
  "atelier-core": {
    id: "atelier-core",
    name: "Atelier Core Distribution",
    fulfillmentModel: "hybrid",
    leadTime: "1-2 أيام عمل",
    defaultMarginTarget: 0.44,
    note:
      "المورد الأساسي للمنتجات المتاحة محليًا، ويغطي جزءًا من المخزون المباشر مع مرونة في إعادة التزويد.",
    truthSourceLabel: "Local stock truth + supplier replenishment confirmation",
    defaultAuthorityOwnerLabel: "Catalog + warehouse desk",
    defaultAuthorityRoute: "/ops/catalog",
    continuityRule:
      "When live demand meets low stock, confirm replenishment before expanding storefront promises or COD coverage.",
  },
  "desert-distribution": {
    id: "desert-distribution",
    name: "Desert Distribution Network",
    fulfillmentModel: "dropship",
    leadTime: "3-5 أيام عمل",
    defaultMarginTarget: 0.38,
    note:
      "مسار احتياطي لبعض الطلبات الممتدة والدرجات الأقل دورانًا، مع حساسية أعلى تجاه المخزون ووقت التجهيز.",
    truthSourceLabel: "Supplier-confirmed availability + booking continuity",
    defaultAuthorityOwnerLabel: "Supplier coordination desk",
    defaultAuthorityRoute: "/ops/fulfillment",
    continuityRule:
      "Keep dropship and preorder variants tied to supplier confirmation before reopening COD, lead-time claims, or strong stock assumptions.",
  },
};

const variantOperationsDirectory: Record<string, VariantOperationsRecord[]> = {
  "radiant-dew-serum": [
    {
      productSlug: "radiant-dew-serum",
      sku: "RD-30",
      supplierSku: "AT-RDS-30",
      barcode: "6287000010011",
      stockOnHand: 14,
      lowStockThreshold: 8,
      cost: 69,
      supplierId: "atelier-core",
      shippingClass: "serum-light",
      codEligible: true,
      hidden: false,
    },
    {
      productSlug: "radiant-dew-serum",
      sku: "RD-50",
      supplierSku: "DD-RDS-50",
      barcode: "6287000010012",
      stockOnHand: 3,
      lowStockThreshold: 5,
      cost: 104,
      supplierId: "desert-distribution",
      shippingClass: "serum-light",
      codEligible: false,
      hidden: false,
    },
  ],
  "velvet-base-foundation": [
    {
      productSlug: "velvet-base-foundation",
      sku: "VBF-02",
      supplierSku: "AT-VBF-02",
      barcode: "6287000010091",
      stockOnHand: 9,
      lowStockThreshold: 6,
      cost: 92,
      supplierId: "atelier-core",
      shippingClass: "foundation-standard",
      codEligible: true,
      hidden: false,
      shadeSortOrder: 2,
      swatchLabel: "Neutral Sand 02",
    },
    {
      productSlug: "velvet-base-foundation",
      sku: "VBF-04",
      supplierSku: "DD-VBF-04",
      barcode: "6287000010094",
      stockOnHand: 2,
      lowStockThreshold: 4,
      cost: 96,
      supplierId: "desert-distribution",
      shippingClass: "foundation-standard",
      codEligible: false,
      hidden: false,
      shadeSortOrder: 4,
      swatchLabel: "Golden Beige 04",
    },
  ],
};

export function getSupplierRecord(supplierId: SupplierId) {
  return supplierDirectory[supplierId];
}

export function getSupplierRecords() {
  return Object.values(supplierDirectory);
}

export function getVariantOperationsByProduct(productSlug: string) {
  return variantOperationsDirectory[productSlug] ?? [];
}

export function getVariantOperations(productSlug: string, sku: string) {
  return (
    variantOperationsDirectory[productSlug]?.find((variant) => variant.sku === sku) ??
    null
  );
}
