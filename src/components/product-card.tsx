"use client";

import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
import type { Locale } from "@/lib/i18n";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";
import styles from "./product-card.module.css";

type ProductCardProps = {
  product: PublicCatalogProduct;
  locale: Locale;
  /** Quick-add is only offered when the product has exactly one purchasable
   *  variant. Multi-variant products link to the PDP to choose (CLAUDE.md §7.4). */
  onQuickAdd?: (sku: string) => void;
  priority?: boolean;
};

function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
}

const copy = {
  ar: { add: "أضيفي إلى السلة", choose: "اختاري النسخة", soldOut: "غير متاح حاليًا", from: "من" },
  en: { add: "Add to bag", choose: "Choose a version", soldOut: "Currently unavailable", from: "from" },
} as const;

export function ProductCard({ product, locale, onQuickAdd, priority }: ProductCardProps) {
  const text = copy[locale];
  const href = `/${locale}/product/${product.slug}`;
  const image = product.media[0];

  const inStock = product.variants.filter((v) => v.availability === "InStock");
  const purchasable = inStock.length > 0 ? inStock : product.variants;
  const prices = purchasable.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const hasRange = prices.length > 1 && Math.min(...prices) !== Math.max(...prices);
  const compareAt = purchasable.find((v) => v.compareAtPrice && v.compareAtPrice > v.price)?.compareAtPrice ?? null;

  const singleVariant = inStock.length === 1 ? inStock[0] : null;
  const soldOut = inStock.length === 0;

  return (
    <article className={styles.card}>
      {/* Decorative — the stretched name link below makes the whole card clickable. */}
      <div className={styles.media} aria-hidden="true">
        {image ? (
          <Image src={image.url} alt="" fill sizes="(max-width: 600px) 50vw, (max-width: 1023px) 33vw, 22vw" priority={priority} />
        ) : null}
      </div>

      <div className={styles.body}>
        <p className={styles.brand}>{product.brand}</p>
        <h3 className={styles.name}>
          <TrackedLink
            href={href}
            analyticsEvent="select_item"
            analyticsLabel={`product_card_name_${product.slug}`}
            analyticsSurface="collection_grid"
            analyticsDestinationType="product"
            analyticsProperties={{ product_slug: product.slug, item_list: "collection_grid" }}
          >
            {product.name}
          </TrackedLink>
        </h3>
        <p className={styles.subtitle}>{product.subtitle}</p>

        <div className={styles.priceRow}>
          {minPrice !== null ? (
            <span className={styles.price}>
              {hasRange ? <span className={styles.from}>{text.from} </span> : null}
              {formatPrice(minPrice, locale)}
            </span>
          ) : null}
          {compareAt ? <s className={styles.compareAt}>{formatPrice(compareAt, locale)}</s> : null}
        </div>

        {soldOut ? (
          <span className={styles.soldOut}>{text.soldOut}</span>
        ) : singleVariant && onQuickAdd ? (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => onQuickAdd(singleVariant.sku)}
          >
            <span>{text.add}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 8h10l-1 11H8L7 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          <TrackedLink
            href={href}
            className={styles.chooseLink}
            analyticsEvent="select_item"
            analyticsLabel={`product_card_choose_${product.slug}`}
            analyticsSurface="collection_grid"
            analyticsDestinationType="product"
            analyticsProperties={{ product_slug: product.slug, item_list: "collection_grid" }}
          >
            {text.choose}
          </TrackedLink>
        )}
      </div>
    </article>
  );
}
