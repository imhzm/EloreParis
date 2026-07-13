import {
  collectionDirectory,
  getProductBySlug,
  products,
  type CollectionSlug,
} from "@/lib/site-content";
import { getOrderFulfillmentPlan } from "@/lib/fulfillment";
import {
  getStoredOrderLineCatalogTruth,
  type StoredOrder,
} from "@/lib/orders";
import {
  getSupplierRecord,
  getSupplierRecords as getSharedSupplierRecords,
  getVariantOperationsByProduct,
  type ShippingClass,
  type SupplierAuthorityRoute,
  type SupplierId,
  type SupplierRecord,
  type VariantOperationsRecord,
} from "@/lib/variant-operations";

export type CatalogAdminVariant = VariantOperationsRecord & {
  availability: "InStock" | "PreOrder";
  retailPrice: number;
  compareAtPrice?: number;
  estimatedMargin: number;
};

export type CatalogAdminProduct = {
  productSlug: string;
  arabicName: string;
  englishName: string;
  shortDescription: string;
  fullDescription: string;
  brand: string;
  collection: CollectionSlug;
  productType: string;
  concern: string;
  ingredient: string;
  skinTypes: string[];
  finish: string;
  coverage?: string;
  shadeFamily?: string;
  undertone?: string;
  texture: string;
  usageStep: string;
  timing: string;
  canonicalPath: string;
  metaTitle: string;
  metaDescription: string;
  ogImagePath: string;
  relatedProductSlugs: string[];
  routinePairingHrefs: string[];
  variants: CatalogAdminVariant[];
};

export type SupplierSyncLog = {
  id: string;
  supplierId: SupplierId;
  createdAt: string;
  status: "ok" | "warning" | "error";
  area: "stock" | "price" | "mapping";
  note: string;
};

export type SupplierException = {
  id: string;
  severity: "warning" | "critical";
  supplierId: SupplierId;
  sku: string;
  productSlug: string;
  title: string;
  note: string;
};

export type CatalogAuthorityLane =
  | "Catalog review desk"
  | "Supplier follow-up"
  | "Warehouse replenishment"
  | "Merchandising hold"
  | "Catalog stable";

export type CatalogAuthorityRecord = {
  productSlug: string;
  productName: string;
  authorityLane: CatalogAuthorityLane;
  authorityNote: string;
  liveOrderCount: number;
  pendingDemandUnits: number;
  manualReviewOrders: number;
  lowStockVariantCount: number;
  codRestrictedVariantCount: number;
  supplierWarningCount: number;
  affectedOrderNumbers: string[];
  supplierStatus: "watch" | "stable";
};

export type CatalogAuthoritySnapshot = {
  productsWithDemand: number;
  pendingDemandUnits: number;
  reviewRequiredProducts: number;
  supplierFollowupProducts: number;
  ownerLanes: Array<{ label: CatalogAuthorityLane; count: number }>;
  records: Record<string, CatalogAuthorityRecord>;
};

export type SupplierAuthorityLane =
  | "Supplier coordination"
  | "Replenishment escalation"
  | "Catalog truth watch"
  | "Supplier stable";

export type SupplierAuthorityRecord = {
  supplierId: SupplierId;
  supplierName: string;
  authorityLane: SupplierAuthorityLane;
  authorityNote: string;
  supplierStatus: "watch" | "stable";
  fulfillmentModel: SupplierRecord["fulfillmentModel"];
  truthSourceLabel: string;
  continuityOwnerLabel: string;
  continuityRoute: SupplierAuthorityRoute;
  continuityRule: string;
  watchItemCount: number;
  activeProductCount: number;
  activeVariantCount: number;
  lowStockVariantCount: number;
  codRestrictedVariantCount: number;
  liveOrderCount: number;
  pendingDemandUnits: number;
  affectedProductSlugs: string[];
  affectedOrderNumbers: string[];
};

export type SupplierAuthoritySnapshot = {
  suppliersWithDemand: number;
  suppliersOnWatch: number;
  suppliersNeedingReplenishment: number;
  coordinationSuppliers: number;
  ownerLanes: Array<{ label: SupplierAuthorityLane; count: number }>;
  records: Record<SupplierId, SupplierAuthorityRecord>;
};

const catalogOverrides: Record<
  string,
  Omit<CatalogAdminProduct, "collection" | "variants">
> = {
  "radiant-dew-serum": {
    productSlug: "radiant-dew-serum",
    arabicName: "سيروم Radiant Dew",
    englishName: "Radiant Dew Serum",
    shortDescription:
      "سيروم صباحي خفيف يربط الإشراقة بالحماية اليومية داخل الروتين.",
    fullDescription:
      "صفحة تشغيلية للكتالوج تجمع بين بيانات البيع والـ SEO والتوريد لسيروم الإشراقة الصباحي، مع حقول واضحة لربط المورد والتكلفة والمخزون.",
    brand: "Cozmateks Atelier",
    productType: "Brightening Serum",
    concern: "التصبغات",
    ingredient: "فيتامين C",
    skinTypes: ["البشرة المختلطة", "البشرة الدهنية", "البشرة العادية"],
    finish: "إشراقة ناعمة غير طبقية",
    texture: "سيروم خفيف سريع الاندماج",
    usageStep: "بعد التنظيف وقبل الترطيب",
    timing: "AM",
    canonicalPath: "/products/radiant-dew-serum",
    metaTitle: "Radiant Dew Serum | سيروم إشراقة صباحي خفيف",
    metaDescription:
      "سيروم صباحي خفيف لمسار إشراقة واضح مع ملمس مريح يناسب النهار والأجواء الحارة.",
    ogImagePath: "/og-product.svg",
    relatedProductSlugs: [],
    routinePairingHrefs: ["/routines/morning-routine-oily-skin"],
  },
  "velvet-base-foundation": {
    productSlug: "velvet-base-foundation",
    arabicName: "فاونديشن Velvet Base",
    englishName: "Velvet Base Foundation",
    shortDescription:
      "فاونديشن مخملي متوازن بثبات عملي للمناسبات والدوام.",
    fullDescription:
      "طبقة إدارة كتالوج توضح بيانات الفاونديشن الأساسية والدرجات والمخزون وربط المورد والـ SEO لهذه الفئة الحساسة.",
    brand: "Cozmateks Atelier",
    productType: "Foundation",
    concern: "ثبات المكياج",
    ingredient: "هيالورونيك أسيد",
    skinTypes: ["البشرة المختلطة", "البشرة العادية", "البشرة الجافة"],
    finish: "مخملي ناعم بثبات عملي",
    coverage: "Medium Buildable",
    shadeFamily: "Sand / Beige",
    undertone: "Neutral / Warm",
    texture: "قاعدة كريمية قابلة للبناء",
    usageStep: "بعد التهيئة وقبل التثبيت",
    timing: "AM / Occasion",
    canonicalPath: "/products/velvet-base-foundation",
    metaTitle: "Velvet Base Foundation | فاونديشن مخملي للمناسبات والدوام",
    metaDescription:
      "فاونديشن مخملي بتغطية قابلة للبناء وثبات عملي يربط finish المناسبة بالمناسبة بوضوح.",
    ogImagePath: "/og-product.svg",
    relatedProductSlugs: ["radiant-dew-serum"],
    routinePairingHrefs: ["/routines/occasion-base-routine"],
  },
};

const supplierSyncLogs: SupplierSyncLog[] = [
  {
    id: "sync-001",
    supplierId: "atelier-core",
    createdAt: "2026-04-02T07:45:00.000Z",
    status: "ok",
    area: "stock",
    note: "تمت مطابقة مخزون RD-30 وVBF-02 مع المستودع المحلي بدون فروقات.",
  },
  {
    id: "sync-002",
    supplierId: "desert-distribution",
    createdAt: "2026-04-02T08:10:00.000Z",
    status: "warning",
    area: "mapping",
    note: "الدرجة VBF-04 ما زالت تعمل كمخزون احتياطي ويجب تأكيد lead time قبل تشغيل COD.",
  },
  {
    id: "sync-003",
    supplierId: "desert-distribution",
    createdAt: "2026-04-02T09:00:00.000Z",
    status: "warning",
    area: "price",
    note: "الحجم الممتد RD-50 يحتاج مراجعة الهامش بعد آخر تحديث تكلفة المورد.",
  },
];

export function getSupplierRecords() {
  return getSharedSupplierRecords();
}

export function getCatalogAdminProducts(): CatalogAdminProduct[] {
  return products
    .map((product): CatalogAdminProduct | null => {
      const overrides = catalogOverrides[product.slug];
      const variantOperations = getVariantOperationsByProduct(product.slug);

      if (!overrides || variantOperations.length === 0) {
        return null;
      }

      const variants = variantOperations
        .map((variantAdmin): CatalogAdminVariant | null => {
          const storefrontVariant = product.variants.find(
            (variant) => variant.sku === variantAdmin.sku,
          );

          if (!storefrontVariant) {
            return null;
          }

          const retailPrice = storefrontVariant.price;

          return {
            ...variantAdmin,
            stockOnHand:
              storefrontVariant.availability === "PreOrder"
                ? variantAdmin.stockOnHand
                : Math.max(variantAdmin.stockOnHand, 0),
            availability: storefrontVariant.availability,
            retailPrice,
            compareAtPrice: storefrontVariant.compareAtPrice,
            estimatedMargin:
              retailPrice > 0
                ? (retailPrice - variantAdmin.cost) / retailPrice
                : 0,
          };
        })
        .filter((variant): variant is CatalogAdminVariant => Boolean(variant));

      return {
        ...overrides,
        collection: product.collection,
        variants,
      };
    })
    .filter((product): product is CatalogAdminProduct => Boolean(product));
}

export function getCatalogAdminProductBySlug(slug: string) {
  return getCatalogAdminProducts().find((product) => product.productSlug === slug);
}

export function getLowStockVariants(catalogProducts = getCatalogAdminProducts()) {
  return catalogProducts.flatMap((product) =>
    product.variants
      .filter((variant) => variant.stockOnHand <= variant.lowStockThreshold)
      .map((variant) => ({
        productSlug: product.productSlug,
        productName: product.arabicName,
        collection: product.collection,
        sku: variant.sku,
        supplierId: variant.supplierId,
        stockOnHand: variant.stockOnHand,
        lowStockThreshold: variant.lowStockThreshold,
        shippingClass: variant.shippingClass,
      })),
  );
}

export function getSupplierExceptionQueue(
  catalogProducts = getCatalogAdminProducts(),
) {
  const exceptions: SupplierException[] = [];

  for (const product of catalogProducts) {
    for (const variant of product.variants) {
      const storefrontProduct = getProductBySlug(product.productSlug);
      const storefrontVariant = storefrontProduct?.variants.find(
        (candidate) => candidate.sku === variant.sku,
      );

      if (!storefrontVariant) {
        continue;
      }

      if (variant.stockOnHand <= variant.lowStockThreshold) {
        exceptions.push({
          id: `${variant.sku}-stock`,
          severity:
            variant.stockOnHand <= Math.max(1, variant.lowStockThreshold - 2)
              ? "critical"
              : "warning",
          supplierId: variant.supplierId,
          sku: variant.sku,
          productSlug: product.productSlug,
          title: "مخزون منخفض",
          note: `${product.arabicName} (${variant.sku}) عند ${variant.stockOnHand} قطع فقط مقابل threshold ${variant.lowStockThreshold}.`,
        });
      }

      const supplier = getSupplierRecord(variant.supplierId);

      if (variant.estimatedMargin < supplier.defaultMarginTarget) {
        exceptions.push({
          id: `${variant.sku}-margin`,
          severity: "warning",
          supplierId: variant.supplierId,
          sku: variant.sku,
          productSlug: product.productSlug,
          title: "هامش أقل من الهدف",
          note: `الهامش الحالي التقريبي ${(variant.estimatedMargin * 100).toFixed(0)}% أقل من هدف المورد ${(supplier.defaultMarginTarget * 100).toFixed(0)}%.`,
        });
      }
    }
  }

  return exceptions;
}

export function getSupplierSyncLogs() {
  return supplierSyncLogs;
}

function getCatalogAuthorityLane(input: {
  manualReviewOrders: number;
  lowStockVariantCount: number;
  pendingDemandUnits: number;
  supplierWarningCount: number;
  dropshipVariantCount: number;
  codRestrictedVariantCount: number;
  liveOrderCount: number;
}): Pick<CatalogAuthorityRecord, "authorityLane" | "authorityNote" | "supplierStatus"> {
  if (
    input.manualReviewOrders > 0 ||
    (input.lowStockVariantCount > 0 && input.pendingDemandUnits > 0)
  ) {
    return {
      authorityLane: "Catalog review desk",
      authorityNote:
        "هناك طلبات حية مرتبطة بمخزون منخفض أو review تشغيلي، لذلك قرار الكتالوج يجب أن يمر أولًا على desk المراجعة.",
      supplierStatus: input.supplierWarningCount > 0 ? "watch" : "stable",
    };
  }

  if (input.supplierWarningCount > 0 || input.dropshipVariantCount > 0) {
    return {
      authorityLane: "Supplier follow-up",
      authorityNote:
        "المنتج يعتمد على supplier watch أو dropship lane، لذلك المتابعة الصحيحة الآن هي تأكيد المورد لا إعادة فتح storefront copy.",
      supplierStatus: "watch",
    };
  }

  if (input.lowStockVariantCount > 0) {
    return {
      authorityLane: "Warehouse replenishment",
      authorityNote:
        "المخزون يقترب من threshold التشغيلي، لذلك الأولوية هي replenishment داخلي قبل توسعة demand.",
      supplierStatus: "stable",
    };
  }

  if (input.codRestrictedVariantCount > 0 && input.liveOrderCount > 0) {
    return {
      authorityLane: "Merchandising hold",
      authorityNote:
        "هناك طلبات حية مرتبطة بمتغيرات غير مناسبة لـ COD، لذلك يلزم ضبط handoff التجاري قبل توسيع العرض.",
      supplierStatus: "stable",
    };
  }

  return {
    authorityLane: "Catalog stable",
    authorityNote:
      "سجل الكتالوج الحالي مستقر ولا يفرض handoff تشغيلي إضافي خارج المتابعة الروتينية.",
    supplierStatus: "stable",
  };
}

export function getCatalogAuthoritySnapshot(
  orders: StoredOrder[],
  catalogProducts = getCatalogAdminProducts(),
): CatalogAuthoritySnapshot {
  const exceptionMap = new Map<string, SupplierException[]>();
  const supplierWatchCounts = new Map<SupplierId, number>();
  const demandMap = new Map<
    string,
    {
      liveOrderNumbers: Set<string>;
      manualReviewOrders: Set<string>;
      pendingDemandUnits: number;
    }
  >();

  for (const exception of getSupplierExceptionQueue(catalogProducts)) {
    const existing = exceptionMap.get(exception.productSlug) ?? [];
    existing.push(exception);
    exceptionMap.set(exception.productSlug, existing);
  }

  for (const log of getSupplierSyncLogs()) {
    if (log.status === "warning" || log.status === "error") {
      supplierWatchCounts.set(
        log.supplierId,
        (supplierWatchCounts.get(log.supplierId) ?? 0) + 1,
      );
    }
  }

  for (const order of orders) {
    const plan = getOrderFulfillmentPlan(order);
    const pendingDemand =
      order.status === "received" || order.status === "payment_pending";

    for (const line of order.lines) {
      const existing = demandMap.get(line.productSlug) ?? {
        liveOrderNumbers: new Set<string>(),
        manualReviewOrders: new Set<string>(),
        pendingDemandUnits: 0,
      };

      existing.liveOrderNumbers.add(order.orderNumber);

      if (plan.requiresManualReview) {
        existing.manualReviewOrders.add(order.orderNumber);
      }

      if (pendingDemand) {
        existing.pendingDemandUnits += line.quantity;
      }

      demandMap.set(line.productSlug, existing);
    }
  }

  const records = Object.fromEntries(
    catalogProducts.map((product) => {
      const demand = demandMap.get(product.productSlug);
      const productExceptions = exceptionMap.get(product.productSlug) ?? [];
      const lowStockVariantCount = product.variants.filter(
        (variant) => variant.stockOnHand <= variant.lowStockThreshold,
      ).length;
      const codRestrictedVariantCount = product.variants.filter(
        (variant) => !variant.codEligible,
      ).length;
      const dropshipVariantCount = product.variants.filter((variant) => {
        const supplier = getSupplierRecord(variant.supplierId);
        return (
          supplier.fulfillmentModel === "dropship" ||
          variant.availability === "PreOrder"
        );
      }).length;
      const supplierWarningCount = Array.from(
        new Set(product.variants.map((variant) => variant.supplierId)),
      ).reduce(
        (sum, supplierId) => sum + (supplierWatchCounts.get(supplierId) ?? 0),
        0,
      );
      const liveOrderCount = demand?.liveOrderNumbers.size ?? 0;
      const manualReviewOrders = demand?.manualReviewOrders.size ?? 0;
      const pendingDemandUnits = demand?.pendingDemandUnits ?? 0;
      const authority = getCatalogAuthorityLane({
        manualReviewOrders,
        lowStockVariantCount,
        pendingDemandUnits,
        supplierWarningCount:
          supplierWarningCount +
          productExceptions.filter((exception) => exception.severity !== "critical").length,
        dropshipVariantCount,
        codRestrictedVariantCount,
        liveOrderCount,
      });

      return [
        product.productSlug,
        {
          productSlug: product.productSlug,
          productName: product.arabicName,
          authorityLane: authority.authorityLane,
          authorityNote: authority.authorityNote,
          liveOrderCount,
          pendingDemandUnits,
          manualReviewOrders,
          lowStockVariantCount,
          codRestrictedVariantCount,
          supplierWarningCount:
            supplierWarningCount + productExceptions.length,
          affectedOrderNumbers: Array.from(demand?.liveOrderNumbers ?? []).slice(0, 3),
          supplierStatus: authority.supplierStatus,
        } satisfies CatalogAuthorityRecord,
      ];
    }),
  ) as Record<string, CatalogAuthorityRecord>;

  const ownerLaneCounter = new Map<CatalogAuthorityLane, number>();

  for (const record of Object.values(records)) {
    ownerLaneCounter.set(
      record.authorityLane,
      (ownerLaneCounter.get(record.authorityLane) ?? 0) + 1,
    );
  }

  return {
    productsWithDemand: Object.values(records).filter(
      (record) => record.liveOrderCount > 0,
    ).length,
    pendingDemandUnits: Object.values(records).reduce(
      (sum, record) => sum + record.pendingDemandUnits,
      0,
    ),
    reviewRequiredProducts: Object.values(records).filter(
      (record) => record.authorityLane === "Catalog review desk",
    ).length,
    supplierFollowupProducts: Object.values(records).filter(
      (record) => record.authorityLane === "Supplier follow-up",
    ).length,
    ownerLanes: Array.from(ownerLaneCounter.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count),
    records,
  };
}

function getSupplierAuthorityLane(input: {
  supplier: SupplierRecord;
  watchItemCount: number;
  lowStockVariantCount: number;
  pendingDemandUnits: number;
  liveOrderCount: number;
  activeProductCount: number;
}): Pick<
  SupplierAuthorityRecord,
  "authorityLane" | "authorityNote" | "supplierStatus"
> {
  if (
    (input.watchItemCount > 0 && input.liveOrderCount > 0) ||
    (input.supplier.fulfillmentModel === "dropship" &&
      input.pendingDemandUnits > 0)
  ) {
    return {
      authorityLane: "Supplier coordination",
      authorityNote:
        "الحقيقة التشغيلية هنا لا تكتمل من stock فقط؛ يجب أن يمر القرار عبر supplier confirmation وربط fulfillment قبل تثبيت الوعود التجارية.",
      supplierStatus: "watch",
    };
  }

  if (input.lowStockVariantCount > 0 && input.pendingDemandUnits > 0) {
    return {
      authorityLane: "Replenishment escalation",
      authorityNote:
        "هناك طلبات أو وحدات معلقة على مورد يقترب من threshold التشغيلي، لذلك أولوية هذا lane هي تأكيد replenishment لا توسيع العرض.",
      supplierStatus: "watch",
    };
  }

  if (input.watchItemCount > 0) {
    return {
      authorityLane: "Catalog truth watch",
      authorityNote:
        "المورد ما زال يحمل watch items داخل sync أو exception queue، لذا truth الحالية يجب أن تُقرأ بحذر حتى يثبت supplier lane من جديد.",
      supplierStatus: "watch",
    };
  }

  return {
    authorityLane: "Supplier stable",
    authorityNote:
      input.activeProductCount > 0
        ? "مسار المورد الحالي متماسك مع الحقيقة التشغيلية المنشورة داخل الكتالوج ولا يحتاج handoff إضافيًا خارج المتابعة الروتينية."
        : "لا توجد سجلات catalog نشطة تربط هذا المورد بالحقيقة التشغيلية الحالية.",
    supplierStatus: "stable",
  };
}

export function getSupplierAuthoritySnapshot(
  orders: StoredOrder[],
  catalogProducts = getCatalogAdminProducts(),
): SupplierAuthoritySnapshot {
  const supplierProductSlugs = new Map<SupplierId, Set<string>>();
  const supplierVariantCount = new Map<SupplierId, number>();
  const lowStockVariantCount = new Map<SupplierId, number>();
  const codRestrictedVariantCount = new Map<SupplierId, number>();
  const watchItemCount = new Map<SupplierId, number>();
  const liveOrderNumbers = new Map<SupplierId, Set<string>>();
  const pendingDemandUnits = new Map<SupplierId, number>();

  for (const product of catalogProducts) {
    for (const variant of product.variants) {
      const existingProducts =
        supplierProductSlugs.get(variant.supplierId) ?? new Set<string>();
      existingProducts.add(product.productSlug);
      supplierProductSlugs.set(variant.supplierId, existingProducts);
      supplierVariantCount.set(
        variant.supplierId,
        (supplierVariantCount.get(variant.supplierId) ?? 0) + 1,
      );

      if (variant.stockOnHand <= variant.lowStockThreshold) {
        lowStockVariantCount.set(
          variant.supplierId,
          (lowStockVariantCount.get(variant.supplierId) ?? 0) + 1,
        );
      }

      if (!variant.codEligible) {
        codRestrictedVariantCount.set(
          variant.supplierId,
          (codRestrictedVariantCount.get(variant.supplierId) ?? 0) + 1,
        );
      }
    }
  }

  for (const log of getSupplierSyncLogs()) {
    if (log.status === "warning" || log.status === "error") {
      watchItemCount.set(
        log.supplierId,
        (watchItemCount.get(log.supplierId) ?? 0) + 1,
      );
    }
  }

  for (const exception of getSupplierExceptionQueue(catalogProducts)) {
    watchItemCount.set(
      exception.supplierId,
      (watchItemCount.get(exception.supplierId) ?? 0) + 1,
    );
  }

  for (const order of orders) {
    const orderPendingDemand =
      order.status === "received" || order.status === "payment_pending";

    for (const line of order.lines) {
      const catalogTruth = getStoredOrderLineCatalogTruth(line);
      const supplierId = catalogTruth.supplierId;

      if (!supplierId) {
        continue;
      }

      const supplierOrders = liveOrderNumbers.get(supplierId) ?? new Set<string>();
      supplierOrders.add(order.orderNumber);
      liveOrderNumbers.set(supplierId, supplierOrders);

      const existingProducts = supplierProductSlugs.get(supplierId) ?? new Set<string>();
      existingProducts.add(line.productSlug);
      supplierProductSlugs.set(supplierId, existingProducts);

      if (orderPendingDemand) {
        pendingDemandUnits.set(
          supplierId,
          (pendingDemandUnits.get(supplierId) ?? 0) + line.quantity,
        );
      }
    }
  }

  const ownerLaneCounter = new Map<SupplierAuthorityLane, number>();
  const records = Object.fromEntries(
    getSupplierRecords().map((supplier) => {
      const affectedProductSlugs = Array.from(
        supplierProductSlugs.get(supplier.id) ?? [],
      );
      const affectedOrderNumbers = Array.from(
        liveOrderNumbers.get(supplier.id) ?? [],
      );
      const activeProductCount = affectedProductSlugs.length;
      const activeVariantCount = supplierVariantCount.get(supplier.id) ?? 0;
      const nextPendingDemandUnits = pendingDemandUnits.get(supplier.id) ?? 0;
      const nextWatchItemCount = watchItemCount.get(supplier.id) ?? 0;
      const nextLowStockVariantCount = lowStockVariantCount.get(supplier.id) ?? 0;
      const authority = getSupplierAuthorityLane({
        supplier,
        watchItemCount: nextWatchItemCount,
        lowStockVariantCount: nextLowStockVariantCount,
        pendingDemandUnits: nextPendingDemandUnits,
        liveOrderCount: affectedOrderNumbers.length,
        activeProductCount,
      });

      ownerLaneCounter.set(
        authority.authorityLane,
        (ownerLaneCounter.get(authority.authorityLane) ?? 0) + 1,
      );

      return [
        supplier.id,
        {
          supplierId: supplier.id,
          supplierName: supplier.name,
          authorityLane: authority.authorityLane,
          authorityNote: authority.authorityNote,
          supplierStatus: authority.supplierStatus,
          fulfillmentModel: supplier.fulfillmentModel,
          truthSourceLabel: supplier.truthSourceLabel,
          continuityOwnerLabel: supplier.defaultAuthorityOwnerLabel,
          continuityRoute: supplier.defaultAuthorityRoute,
          continuityRule: supplier.continuityRule,
          watchItemCount: nextWatchItemCount,
          activeProductCount,
          activeVariantCount,
          lowStockVariantCount: nextLowStockVariantCount,
          codRestrictedVariantCount:
            codRestrictedVariantCount.get(supplier.id) ?? 0,
          liveOrderCount: affectedOrderNumbers.length,
          pendingDemandUnits: nextPendingDemandUnits,
          affectedProductSlugs: affectedProductSlugs.slice(0, 4),
          affectedOrderNumbers: affectedOrderNumbers.slice(0, 4),
        } satisfies SupplierAuthorityRecord,
      ];
    }),
  ) as Record<SupplierId, SupplierAuthorityRecord>;

  return {
    suppliersWithDemand: Object.values(records).filter(
      (record) => record.liveOrderCount > 0,
    ).length,
    suppliersOnWatch: Object.values(records).filter(
      (record) => record.supplierStatus === "watch",
    ).length,
    suppliersNeedingReplenishment: Object.values(records).filter(
      (record) => record.authorityLane === "Replenishment escalation",
    ).length,
    coordinationSuppliers: Object.values(records).filter(
      (record) => record.authorityLane === "Supplier coordination",
    ).length,
    ownerLanes: Array.from(ownerLaneCounter.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count),
    records,
  };
}

function isOrderInMonth(order: StoredOrder, referenceDate: Date) {
  const createdAt = new Date(order.createdAt);

  return (
    createdAt.getFullYear() === referenceDate.getFullYear() &&
    createdAt.getMonth() === referenceDate.getMonth()
  );
}

function isOrderToday(order: StoredOrder, referenceDate: Date) {
  const createdAt = new Date(order.createdAt);

  return (
    createdAt.getFullYear() === referenceDate.getFullYear() &&
    createdAt.getMonth() === referenceDate.getMonth() &&
    createdAt.getDate() === referenceDate.getDate()
  );
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function getOpsDashboardSnapshot(
  orders: StoredOrder[],
  referenceDate = new Date(),
) {
  const todayOrders = orders.filter((order) => isOrderToday(order, referenceDate));
  const monthOrders = orders.filter((order) => isOrderInMonth(order, referenceDate));
  const pendingOrders = orders.filter(
    (order) => order.status === "received" || order.status === "payment_pending",
  );

  const productCounter = new Map<
    string,
    { quantity: number; revenue: number; collection: CollectionSlug; name: string }
  >();
  const cityCounter = new Map<string, number>();
  const collectionCounter = new Map<CollectionSlug, number>();
  const customerCounter = new Map<
    string,
    { name: string; orderCount: number; ltv: number }
  >();

  for (const order of orders) {
    cityCounter.set(order.customer.city, (cityCounter.get(order.customer.city) ?? 0) + 1);

    const customerKey =
      normalizePhone(order.customer.phone) ||
      order.customer.email ||
      order.orderNumber;
    const existingCustomer = customerCounter.get(customerKey);

    if (existingCustomer) {
      existingCustomer.orderCount += 1;
      existingCustomer.ltv += order.totalEstimate;
    } else {
      customerCounter.set(customerKey, {
        name: order.customer.fullName,
        orderCount: 1,
        ltv: order.totalEstimate,
      });
    }

    for (const line of order.lines) {
      const product = getProductBySlug(line.productSlug);
      const collection = product?.collection ?? "skincare";
      const existingProduct = productCounter.get(line.productSlug);

      if (existingProduct) {
        existingProduct.quantity += line.quantity;
        existingProduct.revenue += line.lineTotal;
      } else {
        productCounter.set(line.productSlug, {
          quantity: line.quantity,
          revenue: line.lineTotal,
          collection,
          name: line.productName,
        });
      }

      collectionCounter.set(
        collection,
        (collectionCounter.get(collection) ?? 0) + line.quantity,
      );
    }
  }

  const catalogProducts = getCatalogAdminProducts();
  const lowStock = getLowStockVariants(catalogProducts);
  const supplierExceptions = getSupplierExceptionQueue(catalogProducts);

  const topProducts = Array.from(productCounter.entries())
    .map(([slug, data]) => ({
      slug,
      ...data,
      collectionTitle: collectionDirectory[data.collection].title,
    }))
    .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
    .slice(0, 4);

  const topCities = Array.from(cityCounter.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 4);

  const topCollections = Array.from(collectionCounter.entries())
    .map(([collection, count]) => ({
      collection,
      count,
      title: collectionDirectory[collection].title,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 4);

  const repeatCustomers = Array.from(customerCounter.values())
    .filter((customer) => customer.orderCount > 1)
    .sort((left, right) => right.orderCount - left.orderCount || right.ltv - left.ltv)
    .slice(0, 4);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalEstimate, 0);

  return {
    todaySales: todayOrders.reduce((sum, order) => sum + order.totalEstimate, 0),
    monthSales: monthOrders.reduce((sum, order) => sum + order.totalEstimate, 0),
    orderCount: orders.length,
    averageOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
    pendingOrders: pendingOrders.length,
    lowStockCount: lowStock.length,
    repeatCustomerCount: repeatCustomers.length,
    topProducts,
    topCities,
    topCollections,
    repeatCustomers,
    lowStock,
    supplierExceptions,
    catalogCoverage: {
      stockedProducts: catalogProducts.length,
      variants: catalogProducts.reduce(
        (sum, product) => sum + product.variants.length,
        0,
      ),
      readyCollections: Object.values(collectionDirectory).filter(
        (collection) => collection.mode === "filtered",
      ).length,
      editorialCollections: Object.values(collectionDirectory).filter(
        (collection) => collection.mode === "editorial",
      ).length,
    },
  };
}

export type { ShippingClass, SupplierId, SupplierRecord };
