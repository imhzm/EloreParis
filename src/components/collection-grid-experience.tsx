"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { ProductCard } from "@/components/product-card";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";
import styles from "./collection-grid-experience.module.css";

type SortKey = "featured" | "price-asc" | "price-desc";

type Hero = { title: string; eyebrow: string; description: string; image: string; imageAlt: string };

type Props = {
  locale: Locale;
  slug: string;
  hero: Hero;
  products: PublicCatalogProduct[];
};

const PAGE_SIZE = 12;

const copy = {
  ar: {
    sortLabel: "ترتيب حسب",
    sort: { featured: "المختار", "price-asc": "السعر: من الأقل", "price-desc": "السعر: من الأعلى" } as Record<SortKey, string>,
    count: (shown: number, total: number) => `عرض ${shown} من ${total} ${total === 1 ? "منتج" : "منتجًا"}`,
    more: "عرض المزيد",
    added: "تمت الإضافة إلى السلة.",
    emptyTitle: "لم تُعتمد منتجات لهذه المجموعة بعد.",
    emptyBody: "نعرض المنتجات فور اعتمادها ببياناتها الموثّقة. تصفّحي بقية المتجر في هذه الأثناء.",
    emptyCta: "العودة إلى المتجر",
    page: (n: number) => `صفحة ${n}`,
  },
  en: {
    sortLabel: "Sort by",
    sort: { featured: "Featured", "price-asc": "Price: low to high", "price-desc": "Price: high to low" } as Record<SortKey, string>,
    count: (shown: number, total: number) => `Showing ${shown} of ${total} ${total === 1 ? "product" : "products"}`,
    more: "Show more",
    added: "Added to your cart.",
    emptyTitle: "No products are approved for this collection yet.",
    emptyBody: "Products appear the moment they are approved with verified data. Explore the rest of the store meanwhile.",
    emptyCta: "Back to the shop",
    page: (n: number) => `Page ${n}`,
  },
} as const;

function minPrice(product: PublicCatalogProduct): number {
  const inStock = product.variants.filter((v) => v.availability === "InStock");
  const pool = inStock.length ? inStock : product.variants;
  return pool.length ? Math.min(...pool.map((v) => v.price)) : Number.POSITIVE_INFINITY;
}

export function CollectionGridExperience({ locale, slug, hero, products }: Props) {
  const text = copy[locale];
  const { addItem, cartCount } = useCart();
  const [sort, setSort] = useState<SortKey>("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [status, setStatus] = useState("");

  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") list.sort((a, b) => minPrice(a) - minPrice(b));
    else if (sort === "price-desc") list.sort((a, b) => minPrice(b) - minPrice(a));
    return list;
  }, [products, sort]);

  const shown = sorted.slice(0, visible);

  const quickAdd = (product: PublicCatalogProduct) => (sku: string) => {
    addItem({ productSlug: product.slug, sku, quantity: 1 });
    setStatus(text.added);
    const path = `/${locale}/shop/${slug}`;
    const variant = product.variants.find((v) => v.sku === sku);
    trackAnalyticsEvent("add_to_cart", {
      source_path: path,
      source_page_type: getPageType(path),
      product_slug: product.slug,
      sku,
      quantity: 1,
      unit_price: variant?.price ?? 0,
      cart_count: cartCount + 1,
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="collection-title">
        <div className={styles.heroMedia}>
          <Image src={hero.image} alt={hero.imageAlt} fill sizes="(max-width: 900px) 100vw, 46vw" priority />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow} lang="en">{hero.eyebrow}</p>
          <h1 id="collection-title">{hero.title}</h1>
          <p className={styles.heroBody}>{hero.description}</p>
        </div>
      </section>

      {products.length === 0 ? (
        <div className={styles.empty}>
          <h2>{text.emptyTitle}</h2>
          <p>{text.emptyBody}</p>
          <TrackedLink href={localizePath(locale, "/shop")} className={styles.emptyCta} analyticsLabel="collection_empty_back" analyticsSurface="collection_grid">{text.emptyCta}</TrackedLink>
        </div>
      ) : (
        <section className={styles.listing} aria-label={hero.title}>
          <div className={styles.toolbar}>
            <p className={styles.resultCount} aria-live="polite">{text.count(shown.length, products.length)}</p>
            <label className={styles.sort}>
              <span>{text.sortLabel}</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setVisible(PAGE_SIZE); }}>
                {(Object.keys(text.sort) as SortKey[]).map((key) => (
                  <option key={key} value={key}>{text.sort[key]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.grid}>
            {shown.map((product, index) => (
              <ProductCard
                key={product.slug}
                product={product}
                locale={locale}
                onQuickAdd={quickAdd(product)}
                priority={index < 4}
              />
            ))}
          </div>

          {visible < sorted.length ? (
            <div className={styles.pagination}>
              <button type="button" className={styles.moreButton} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                {text.more}
              </button>
            </div>
          ) : null}

          <p className={styles.srStatus} role="status" aria-live="polite">{status}</p>
        </section>
      )}
    </div>
  );
}
