"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import {
  getCatalogAdminProducts,
  getCatalogAuthoritySnapshot,
  getSupplierAuthoritySnapshot,
  getSupplierExceptionQueue,
  getSupplierRecords,
  getSupplierSyncLogs,
  type SupplierId,
} from "@/lib/ops-catalog";
import { fetchOpsOrdersFromAuthority } from "@/lib/order-authority-client";
import { type StoredOrder } from "@/lib/orders";
import { collectionDirectory } from "@/lib/site-content";
import styles from "./order-flow.module.css";

type CollectionFilter = "all" | keyof typeof collectionDirectory;
type SupplierFilter = "all" | SupplierId;

function formatPercentage(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

function getOpsRouteLabel(route: string) {
  switch (route) {
    case "/ops/catalog":
      return "Catalog desk";
    case "/ops/orders":
      return "Orders queue";
    case "/ops/fulfillment":
      return "Fulfillment desk";
    default:
      return route;
  }
}

function getOpsDestinationType(route: string) {
  switch (route) {
    case "/ops/catalog":
      return "ops_catalog";
    case "/ops/orders":
      return "ops_orders";
    case "/ops/fulfillment":
      return "ops_fulfillment";
    default:
      return "ops_catalog";
  }
}

export function CatalogOpsSurface() {
  const [query, setQuery] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter>("all");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const catalogProducts = useMemo(() => getCatalogAdminProducts(), []);
  const supplierRecords = useMemo(() => getSupplierRecords(), []);
  const supplierSyncLogs = useMemo(() => getSupplierSyncLogs(), []);
  const supplierRecordMap = useMemo(
    () =>
      Object.fromEntries(
        supplierRecords.map((supplier) => [supplier.id, supplier]),
      ) as Record<SupplierId, (typeof supplierRecords)[number]>,
    [supplierRecords],
  );
  const supplierExceptions = useMemo(
    () => getSupplierExceptionQueue(catalogProducts),
    [catalogProducts],
  );
  const catalogAuthority = useMemo(
    () => getCatalogAuthoritySnapshot(orders, catalogProducts),
    [catalogProducts, orders],
  );
  const supplierAuthority = useMemo(
    () => getSupplierAuthoritySnapshot(orders, catalogProducts),
    [catalogProducts, orders],
  );
  const supplierSyncState = useMemo(
    () =>
      Object.fromEntries(
        supplierRecords.map((supplier) => {
          const relatedLogs = supplierSyncLogs.filter(
            (log) => log.supplierId === supplier.id,
          );
          const activeWatch = relatedLogs.filter(
            (log) => log.status === "warning" || log.status === "error",
          );

          return [
            supplier.id,
            {
              statusLabel: activeWatch.length ? "Watch" : "Stable",
              watchCount: activeWatch.length,
              latestArea: relatedLogs[relatedLogs.length - 1]?.area ?? "stock",
            },
          ];
        }),
      ) as Record<
        SupplierId,
        { statusLabel: string; watchCount: number; latestArea: string }
      >,
    [supplierRecords, supplierSyncLogs],
  );

  useEffect(() => {
    void fetchOpsOrdersFromAuthority()
      .then((nextOrders) => {
        setOrders(nextOrders);
        setError(null);
      })
      .catch((loadError: unknown) => {
        setOrders([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل طلبات authority لربطها بسطح الكتالوج التشغيلي.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalogProducts.filter((product) => {
      if (collectionFilter !== "all" && product.collection !== collectionFilter) {
        return false;
      }

      if (
        supplierFilter !== "all" &&
        !product.variants.some((variant) => variant.supplierId === supplierFilter)
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        product.arabicName,
        product.englishName,
        product.productSlug,
        product.brand,
        product.productType,
        product.concern,
        product.ingredient,
        ...product.variants.map(
          (variant) => `${variant.sku} ${variant.supplierSku} ${variant.barcode}`,
        ),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [catalogProducts, collectionFilter, query, supplierFilter]);

  const totalVariants = catalogProducts.reduce(
    (sum, product) => sum + product.variants.length,
    0,
  );

  return (
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsCatalog}`}>
      <OpsNav activeHref="/ops/catalog" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>إدارة الكتالوج</p>
          <h1>منتجات ومخزون وموردون، بقرار واحد واضح.</h1>
          <p className={styles.summary}>
            راجعي حالة كل منتج ونسخه المتاحة، راقبي ضغط الطلب والمخزون، وتتبعي
            ملاحظات المورد قبل أن تتحول إلى مشكلة في التنفيذ.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>تغطية الكتالوج</p>
            <strong>{catalogProducts.length}</strong>
            <span>{totalVariants} variants تشغيلية عبر المنتجات الحالية.</span>
          </div>
          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>نطاق التشغيل</p>
            <h2>مرجع داخلي للمنتج والمورد والمخزون</h2>
            <p>
              تعرض هذه الصفحة البيانات المتاحة حاليًا وتربطها بالطلبات النشطة.
              التكاملات الخارجية النهائية تبقى موضحة ضمن حالة كل مورد.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>المنتجات النشطة</p>
          <strong>{catalogProducts.length}</strong>
          <span>منتجات storefront التي تملك admin records تشغيلية الآن.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>عدد الـ variants</p>
          <strong>{totalVariants}</strong>
          <span>يشمل المقاسات والأحجام والدرجات القابلة للإدارة.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>استثناءات الموردين</p>
          <strong>{supplierExceptions.length}</strong>
          <span>Low stock أو margin gaps التي تحتاج متابعة تشغيلية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Live demand</p>
          <strong>{isLoading ? "..." : catalogAuthority.productsWithDemand}</strong>
          <span>منتجات ترتبط بطلبات حية داخل authority الحالية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Catalog review</p>
          <strong>{isLoading ? "..." : catalogAuthority.reviewRequiredProducts}</strong>
          <span>سجلات تحتاج catalog review desk قبل الاعتماد التشغيلي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Supplier follow-up</p>
          <strong>{isLoading ? "..." : catalogAuthority.supplierFollowupProducts}</strong>
          <span>منتجات مرتبطة بـ supplier watch أو dropship lane وتحتاج handoff واضحًا.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Supplier watch</p>
          <strong>{isLoading ? "..." : supplierAuthority.suppliersOnWatch}</strong>
          <span>موردون تحتاج truth الخاصة بهم إلى watch أو coordination قبل تثبيت القرار التجاري.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Suppliers with demand</p>
          <strong>{isLoading ? "..." : supplierAuthority.suppliersWithDemand}</strong>
          <span>موردون لديهم live orders مرتبطة مباشرة بالحقيقة الحالية للكتالوج.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Pending units</p>
          <strong>{isLoading ? "..." : catalogAuthority.pendingDemandUnits}</strong>
          <span>وحدات ما زالت تحت received/payment_pending وترتبط بقرار الكتالوج الآن.</span>
        </article>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Catalog records</p>
          <h2>سجلات المنتجات الحالية</h2>
          <p>
            يمكن هنا تصفية الكتالوج حسب الفئة أو المورد والبحث عبر slug أو SKU أو
            اسم المنتج لإظهار readiness التشغيلية لكل منتج وvariant.
          </p>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <div className={styles.filterBar}>
            <label className={styles.searchField}>
              <span className={styles.fieldLabel}>بحث سريع</span>
              <input
                className={styles.textInput}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="اسم المنتج أو slug أو SKU"
              />
            </label>

            <div className={styles.filterChipRow}>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  collectionFilter === "all" ? styles.filterChipActive : ""
                }`}
                onClick={() => setCollectionFilter("all")}
              >
                <span>كل الفئات</span>
              </button>
              {Object.entries(collectionDirectory).map(([slug, collection]) => (
                <button
                  key={slug}
                  type="button"
                  className={`${styles.filterChip} ${
                    collectionFilter === slug ? styles.filterChipActive : ""
                  }`}
                  onClick={() => setCollectionFilter(slug as CollectionFilter)}
                >
                  <span>{collection.title}</span>
                </button>
              ))}
            </div>

            <div className={styles.filterChipRow}>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  supplierFilter === "all" ? styles.filterChipActive : ""
                }`}
                onClick={() => setSupplierFilter("all")}
              >
                <span>كل الموردين</span>
              </button>
              {supplierRecords.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  className={`${styles.filterChip} ${
                    supplierFilter === supplier.id ? styles.filterChipActive : ""
                  }`}
                  onClick={() => setSupplierFilter(supplier.id)}
                >
                  <span>{supplier.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.ordersGrid}>
            {filteredProducts.length ? (
              filteredProducts.map((product) => {
                const authorityRecord =
                  catalogAuthority.records[product.productSlug];
                const productSupplierAuthority = Array.from(
                  new Set(product.variants.map((variant) => variant.supplierId)),
                ).map((supplierId) => supplierAuthority.records[supplierId]);

                return (
                  <article key={product.productSlug} className={styles.lineItem}>
                    <div className={styles.lineHead}>
                      <div>
                        <h3>{product.arabicName}</h3>
                        <p className={styles.lineMeta}>
                          {product.englishName} | {collectionDirectory[product.collection].title}
                        </p>
                      </div>
                      <div className={styles.linePrice}>{product.productSlug}</div>
                    </div>

                    <div className={styles.badgeRow}>
                      <span>{product.productType}</span>
                      <span>{product.concern}</span>
                      <span>{product.ingredient}</span>
                      <span>{product.timing}</span>
                    </div>

                    <div className={styles.catalogPanelGrid}>
                      <div className={styles.referenceCard}>
                        <strong>Catalog truth contract</strong>
                        <div className={styles.summaryList}>
                          <div className={styles.referenceRow}>
                            <span>Authority lane</span>
                            <strong className={styles.referenceValue}>
                              {authorityRecord?.authorityLane ?? "Catalog stable"}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Supplier status</span>
                            <strong className={styles.referenceValue}>
                              {authorityRecord?.supplierStatus === "watch"
                                ? "Watch"
                                : "Stable"}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Manual-review orders</span>
                            <strong className={styles.referenceValue}>
                              {authorityRecord?.manualReviewOrders ?? 0}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>COD-restricted variants</span>
                            <strong className={styles.referenceValue}>
                              {authorityRecord?.codRestrictedVariantCount ?? 0}
                            </strong>
                          </div>
                        </div>
                        <span className={styles.helperText}>
                          {authorityRecord?.authorityNote ??
                            "سجل الكتالوج الحالي مستقر ولا يفرض handoff إضافي الآن."}
                        </span>
                      </div>

                      <div className={styles.referenceCard}>
                        <strong>Demand linkage</strong>
                        <div className={styles.summaryList}>
                          <div className={styles.referenceRow}>
                            <span>Live orders</span>
                            <strong className={styles.referenceValue}>
                              {authorityRecord?.liveOrderCount ?? 0}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Pending units</span>
                            <strong className={styles.referenceValue}>
                              {authorityRecord?.pendingDemandUnits ?? 0}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Low-stock variants</span>
                            <strong className={styles.referenceValue}>
                              {authorityRecord?.lowStockVariantCount ?? 0}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Supplier watch items</span>
                            <strong className={styles.referenceValue}>
                              {authorityRecord?.supplierWarningCount ?? 0}
                            </strong>
                          </div>
                        </div>
                        <span className={styles.helperText}>
                          {authorityRecord?.affectedOrderNumbers.length
                            ? `Orders: ${authorityRecord.affectedOrderNumbers.join(" | ")}`
                            : "لا توجد أوامر حية مرتبطة بهذا السجل الآن."}
                        </span>
                      </div>

                      <div className={styles.referenceCard}>
                        <strong>Supplier continuity</strong>
                        <div className={styles.summaryList}>
                          {productSupplierAuthority.map((record) => (
                            <div key={record.supplierId} className={styles.referenceCard}>
                              <div className={styles.referenceRow}>
                                <span>{record.supplierName}</span>
                                <strong className={styles.referenceValue}>
                                  {record.authorityLane}
                                </strong>
                              </div>
                              <span className={styles.helperText}>
                                Truth source: {record.truthSourceLabel}
                              </span>
                              <span className={styles.helperText}>
                                Next owner: {record.continuityOwnerLabel} | Live orders:{" "}
                                {record.liveOrderCount} | Pending units:{" "}
                                {record.pendingDemandUnits}
                              </span>
                            </div>
                          ))}
                        </div>
                        <span className={styles.helperText}>
                          إذا تغيّر supplier lane لهذا المنتج، فالحقيقة التشغيلية يجب أن
                          تتغير هنا أولًا قبل أي claim جديد داخل storefront أو COD.
                        </span>
                      </div>

                      <div className={styles.referenceCard}>
                        <strong>SEO + content</strong>
                        <div className={styles.summaryList}>
                          <div className={styles.referenceRow}>
                            <span>Canonical</span>
                            <strong className={styles.referenceValue}>
                              {product.canonicalPath}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>Meta title</span>
                            <strong className={styles.referenceValue}>
                              {product.metaTitle}
                            </strong>
                          </div>
                          <div className={styles.referenceRow}>
                            <span>OG image</span>
                            <strong className={styles.referenceValue}>
                              {product.ogImagePath}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className={styles.referenceCard}>
                        <strong>Variants</strong>
                        <div className={styles.summaryList}>
                          {product.variants.map((variant) => {
                            const supplier = supplierRecordMap[variant.supplierId];

                            return (
                              <div key={variant.sku} className={styles.referenceCard}>
                                <div className={styles.referenceRow}>
                                  <span>{variant.sku}</span>
                                  <strong className={styles.referenceValue}>
                                    {variant.stockOnHand} قطعة
                                  </strong>
                                </div>
                                <div className={styles.badgeRow}>
                                  <span>{variant.supplierSku}</span>
                                  <span>{supplier?.name ?? variant.supplierId}</span>
                                  <span>{variant.shippingClass}</span>
                                  <span>{variant.availability}</span>
                                  <span>{variant.codEligible ? "COD yes" : "COD no"}</span>
                                </div>
                                <span className={styles.helperText}>
                                  Barcode: {variant.barcode} | Low stock threshold:{" "}
                                  {variant.lowStockThreshold}
                                </span>
                                {variant.swatchLabel ? (
                                  <span className={styles.helperText}>
                                    Swatch: {variant.swatchLabel} | Shade order:{" "}
                                    {variant.shadeSortOrder ?? "-"}
                                  </span>
                                ) : null}
                                <span className={styles.helperText}>
                                  Retail: {variant.retailPrice} ر.س
                                  {variant.compareAtPrice
                                    ? ` | Compare at ${variant.compareAtPrice} ر.س`
                                    : ""}
                                </span>
                                <span className={styles.helperText}>
                                  Cost: {variant.cost} ر.س | Margin{" "}
                                  {formatPercentage(variant.estimatedMargin)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <TrackedLink
                        href={`/products/${product.productSlug}`}
                        className={styles.secondaryLink}
                        analyticsLabel={`ops_catalog_product_${product.productSlug}`}
                        analyticsSurface="ops_catalog_product"
                        analyticsDestinationType="product"
                      >
                        فتح صفحة المنتج
                      </TrackedLink>
                      <TrackedLink
                        href="/ops/orders"
                        className={styles.secondaryLink}
                        analyticsLabel={`ops_catalog_orders_${product.productSlug}`}
                        analyticsSurface="ops_catalog_product"
                        analyticsDestinationType="ops_orders"
                      >
                        متابعة الطلبات المرتبطة
                      </TrackedLink>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Catalog filters</p>
                <h1>لا توجد سجلات تطابق الفلتر الحالي</h1>
                <p>
                  غيّر الفئة أو المورد أو نص البحث حتى تظهر سجلات الكتالوج المتاحة
                  في النسخة الحالية.
                </p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Catalog authority lanes</p>
            <h2>من يملك قرار الكتالوج الآن؟</h2>
            <div className={styles.summaryList}>
              {catalogAuthority.ownerLanes.length ? (
                catalogAuthority.ownerLanes.map((lane) => (
                  <div key={lane.label} className={styles.referenceRow}>
                    <span>{lane.label}</span>
                    <strong className={styles.referenceValue}>{lane.count}</strong>
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>
                  ستظهر owner lanes هنا بعد ربط الطلبات الحية بسطح الكتالوج.
                </div>
              )}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Supplier authority</p>
            <h2>استمرارية صلاحية الموردين</h2>
            <div className={styles.summaryList}>
              {supplierAuthority.ownerLanes.length ? (
                supplierAuthority.ownerLanes.map((lane) => (
                  <div key={lane.label} className={styles.referenceRow}>
                    <span>{lane.label}</span>
                    <strong className={styles.referenceValue}>{lane.count}</strong>
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>
                  ستظهر supplier lanes هنا بعد اشتقاق authority continuity من
                  الكتالوج والطلبات الحية.
                </div>
              )}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Supplier map</p>
            <h2>الموردون الحاليون</h2>
            <div className={styles.summaryList}>
              {supplierRecords.map((supplier) => {
                const authorityRecord = supplierAuthority.records[supplier.id];

                return (
                  <div key={supplier.id} className={styles.referenceCard}>
                    <div className={styles.referenceRow}>
                      <span>{supplier.name}</span>
                      <strong className={styles.referenceValue}>
                        {authorityRecord.authorityLane}
                      </strong>
                    </div>
                    <p>{supplier.note}</p>
                    <span className={styles.helperText}>
                      Truth source: {supplier.truthSourceLabel}
                    </span>
                    <span className={styles.helperText}>
                      Lead time: {supplier.leadTime} | Margin target:{" "}
                      {formatPercentage(supplier.defaultMarginTarget)}
                    </span>
                    <span className={styles.helperText}>
                      Sync: {supplierSyncState[supplier.id].statusLabel} | Watch items:{" "}
                      {authorityRecord.watchItemCount} | Last area:{" "}
                      {supplierSyncState[supplier.id].latestArea}
                    </span>
                    <span className={styles.helperText}>
                      Products: {authorityRecord.activeProductCount} | Variants:{" "}
                      {authorityRecord.activeVariantCount} | Live orders:{" "}
                      {authorityRecord.liveOrderCount}
                    </span>
                    <span className={styles.helperText}>
                      Pending units: {authorityRecord.pendingDemandUnits} | Low-stock
                      variants: {authorityRecord.lowStockVariantCount}
                    </span>
                    <span className={styles.helperText}>
                      Next owner: {authorityRecord.continuityOwnerLabel} via{" "}
                      {getOpsRouteLabel(authorityRecord.continuityRoute)}
                    </span>
                    <span className={styles.helperText}>
                      {authorityRecord.continuityRule}
                    </span>
                    {authorityRecord.affectedProductSlugs.length ? (
                      <span className={styles.helperText}>
                        Products: {authorityRecord.affectedProductSlugs.join(" | ")}
                      </span>
                    ) : null}
                    {authorityRecord.affectedOrderNumbers.length ? (
                      <span className={styles.helperText}>
                        Orders: {authorityRecord.affectedOrderNumbers.join(" | ")}
                      </span>
                    ) : null}
                    <div className={styles.cardActions}>
                      <TrackedLink
                        href={authorityRecord.continuityRoute}
                        className={styles.secondaryLink}
                        analyticsLabel={`ops_catalog_supplier_${supplier.id}`}
                        analyticsSurface="ops_catalog_supplier"
                        analyticsDestinationType={getOpsDestinationType(
                          authorityRecord.continuityRoute,
                        )}
                      >
                        متابعة مسار الصلاحية
                      </TrackedLink>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Exception queue</p>
            <h2>الملاحظات التشغيلية</h2>
            <div className={styles.summaryList}>
              {supplierExceptions.length ? (
                supplierExceptions.map((exception) => (
                  <div key={exception.id} className={styles.infoBullet}>
                    <strong>{exception.title}</strong>
                    <br />
                    {exception.note}
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>لا توجد استثناءات بارزة الآن.</div>
              )}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Sync watch</p>
            <h2>مراقبة sync الحالية</h2>
            <div className={styles.summaryList}>
              {supplierSyncLogs.map((log) => (
                <div key={log.id} className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>{log.supplierId}</span>
                    <strong className={styles.referenceValue}>{log.status}</strong>
                  </div>
                  <p>{log.note}</p>
                  <span className={styles.helperText}>{log.area}</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
