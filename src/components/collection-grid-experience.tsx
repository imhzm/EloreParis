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

type Editorial = {
  principles: ReadonlyArray<readonly [string, string]>;
  routes: ReadonlyArray<readonly [string, string, string]>;
  principlesEyebrow: string;
  principlesTitle: string;
  routesEyebrow: string;
  routesTitle: string;
  routesBody: string;
  gateEyebrow: string;
  gateTitle: string;
  gateBody: string;
  conceptNotice: string;
  backToShop: string;
  trust: string;
};

type Props = {
  locale: Locale;
  slug: string;
  hero: Hero;
  editorial: Editorial;
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

export function CollectionGridExperience({ locale, slug, hero, editorial, products }: Props) {
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
    <div className={styles.page} data-collection-grid data-collection-slug={slug}>
      <section className={styles.hero} data-collection-hero aria-labelledby="collection-title">
        <div className={styles.heroMedia}>
          <Image src={hero.image} alt={hero.imageAlt} fill sizes="(max-width: 900px) 100vw, 46vw" priority />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow} lang="en">{hero.eyebrow}</p>
          <h1 id="collection-title">{hero.title}</h1>
          <p className={styles.heroBody}>{hero.description}</p>
          <small className={styles.heroNote}>{editorial.conceptNotice}</small>
        </div>
      </section>

      {products.length === 0 ? (
        <section className={styles.empty} data-catalog-state="gated" aria-labelledby="collection-gate-title">
          <div className={styles.emptyCopy}>
            <p className={styles.eyebrow} lang="en">{editorial.gateEyebrow}</p>
            <h2 id="collection-gate-title">{editorial.gateTitle}</h2>
            <p>{editorial.gateBody}</p>
            <strong>{text.emptyTitle}</strong>
            <p>{text.emptyBody}</p>
            <div className={styles.emptyActions}>
              <TrackedLink href={localizePath(locale, "/shop")} className={styles.emptyCta} analyticsLabel="collection_empty_back" analyticsSurface="collection_grid">{editorial.backToShop}</TrackedLink>
              <TrackedLink href={localizePath(locale, "/trust")} className={styles.secondaryCta} analyticsLabel="collection_empty_trust" analyticsSurface="collection_grid">{editorial.trust}</TrackedLink>
            </div>
          </div>
          <div className={styles.principles}>
            <header>
              <p className={styles.eyebrow} lang="en">{editorial.principlesEyebrow}</p>
              <h2>{editorial.principlesTitle}</h2>
            </header>
            {editorial.principles.map(([title, body], index) => (
              <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.listing} data-catalog-state="available" aria-label={hero.title}>
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
            {shown.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                locale={locale}
                onQuickAdd={quickAdd(product)}
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

      <section className={styles.discovery} data-collection-routes aria-labelledby="collection-routes-title">
        <header>
          <p className={styles.eyebrow} lang="en">{editorial.routesEyebrow}</p>
          <h2 id="collection-routes-title">{editorial.routesTitle}</h2>
          <p>{editorial.routesBody}</p>
        </header>
        <nav className={styles.routeGrid} aria-label={editorial.routesTitle}>
          {editorial.routes.map(([title, body, route], index) => (
            <TrackedLink key={title} href={localizePath(locale, route)} analyticsLabel={`${slug}_route_${index}`} analyticsSurface="collection_grid">
              <span>0{index + 1}</span><strong>{title}</strong><small>{body}</small>
            </TrackedLink>
          ))}
        </nav>
      </section>
    </div>
  );
}
