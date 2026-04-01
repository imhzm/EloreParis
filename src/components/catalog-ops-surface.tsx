"use client";

import { useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import {
  getCatalogAdminProducts,
  getSupplierExceptionQueue,
  getSupplierRecords,
  type SupplierId,
} from "@/lib/ops-catalog";
import { collectionDirectory } from "@/lib/site-content";
import styles from "./order-flow.module.css";

type CollectionFilter = "all" | keyof typeof collectionDirectory;
type SupplierFilter = "all" | SupplierId;

function formatPercentage(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

export function CatalogOpsSurface() {
  const [query, setQuery] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState<SupplierFilter>("all");
  const catalogProducts = useMemo(() => getCatalogAdminProducts(), []);
  const supplierRecords = useMemo(() => getSupplierRecords(), []);
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
        ...product.variants.map((variant) => `${variant.sku} ${variant.supplierSku}`),
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
    <div className={styles.page}>
      <OpsNav activeHref="/ops/catalog" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Catalog operations</p>
          <h1>كتالوج تشغيلي يجمع بيانات البيع والـ SEO والموردين في سطح واحد.</h1>
          <p className={styles.summary}>
            هذه الصفحة تترجم roadmap الخاصة بإدارة المنتجات والـ variants والموردين
            إلى surface عملية: supplier SKU، barcode، threshold، COD eligibility،
            shipping class، وحقول SEO الأساسية.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Catalog coverage</p>
            <strong>{catalogProducts.length}</strong>
            <span>{totalVariants} variants تشغيلية عبر المنتجات الحالية.</span>
          </div>
          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Scope</p>
            <h2>طبقة تشغيل داخلية فوق storefront الحالية</h2>
            <p>
              لا يتم هنا اختلاق CMS أو ERP. هذه فقط data layer محلية تمهّد لحدود
              admin والـ supplier ops قبل اختيار backend الفعلي.
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
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Catalog records</p>
          <h2>سجلات المنتجات الحالية</h2>
          <p>
            يمكن هنا تصفية الكتالوج حسب الفئة أو المورد والبحث عبر slug أو SKU أو
            اسم المنتج لإظهار readiness التشغيلية لكل منتج وvariant.
          </p>

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
              filteredProducts.map((product) => (
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
                      <strong>SEO + content</strong>
                      <div className={styles.summaryList}>
                        <div className={styles.referenceRow}>
                          <span>Canonical</span>
                          <strong className={styles.referenceValue}>{product.canonicalPath}</strong>
                        </div>
                        <div className={styles.referenceRow}>
                          <span>Meta title</span>
                          <strong className={styles.referenceValue}>{product.metaTitle}</strong>
                        </div>
                        <div className={styles.referenceRow}>
                          <span>OG image</span>
                          <strong className={styles.referenceValue}>{product.ogImagePath}</strong>
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
                  </div>
                </article>
              ))
            ) : (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Catalog filters</p>
                <h1>لا توجد سجلات تطابق الفلتر الحالي</h1>
                <p>
                  غيّر الفئة أو المورد أو نص البحث حتى تظهر سجلات الكتالوج
                  المتاحة في النسخة الحالية.
                </p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Supplier map</p>
            <h2>الموردون الحاليون</h2>
            <div className={styles.summaryList}>
              {supplierRecords.map((supplier) => (
                <div key={supplier.id} className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>{supplier.name}</span>
                    <strong className={styles.referenceValue}>{supplier.fulfillmentModel}</strong>
                  </div>
                  <p>{supplier.note}</p>
                  <span className={styles.helperText}>
                    Lead time: {supplier.leadTime} | Margin target:{" "}
                    {formatPercentage(supplier.defaultMarginTarget)}
                  </span>
                </div>
              ))}
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
        </aside>
      </section>
    </div>
  );
}
