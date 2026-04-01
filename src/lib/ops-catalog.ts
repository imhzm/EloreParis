import {
  collectionDirectory,
  getProductBySlug,
  products,
  type CollectionSlug,
} from "@/lib/site-content";
import type { StoredOrder } from "@/lib/orders";
import {
  getSupplierRecord,
  getSupplierRecords as getSharedSupplierRecords,
  getVariantOperationsByProduct,
  type ShippingClass,
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
