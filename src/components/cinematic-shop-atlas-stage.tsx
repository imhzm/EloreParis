"use client";

import Image from "next/image";
import { MultilineTitle } from "@/components/scene-primitives";
import { TrackedLink } from "@/components/tracked-link";
import { localizePath, type Locale } from "@/lib/i18n";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";
import { shopCopy } from "@/lib/shop-content";
import type { ShopAuthorityLocale } from "@/lib/site-editorial-authority";
import styles from "./cinematic-shop-atlas-stage.module.css";

type Props = { locale: Locale; products: PublicCatalogProduct[]; content?: ShopAuthorityLocale };

function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getMinimumPrice(product: PublicCatalogProduct) {
  const prices = product.variants
    .map((variant) => variant.price)
    .filter((price) => Number.isFinite(price));

  return prices.length > 0 ? Math.min(...prices) : null;
}

export function CinematicShopAtlasStage({ locale, products, content }: Props) {
  const sourceCopy = shopCopy[locale];
  const copy = content ? {
    ...content,
    catalog: { ...content.catalog, count: sourceCopy.catalog.count },
    imageAlt: sourceCopy.imageAlt,
  } : sourceCopy;
  const hasPublishedProducts = products.length > 0;

  return (
    <div className={styles.shop} data-shop-hub>
      <section className={styles.hero} aria-label={copy.hero.aria}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{copy.hero.eyebrow}</p>
          <h1>
            <MultilineTitle value={copy.hero.title} />
          </h1>
          <p className={styles.lede}>{copy.hero.body}</p>
          <div className={styles.heroActions}>
            <TrackedLink
              href="#collections"
              className={styles.primaryAction}
              analyticsLabel="shop_hub_browse_categories"
              analyticsSurface="shop_hub"
            >
              {copy.hero.primary}
            </TrackedLink>
            <TrackedLink
              href={localizePath(locale, "/search")}
              className={styles.secondaryAction}
              analyticsLabel="shop_hub_search"
              analyticsSurface="shop_hub"
            >
              {copy.hero.secondary}
            </TrackedLink>
          </div>
        </div>

        <figure className={styles.heroMedia}>
          <Image
            src={copy.hero.image}
            alt={copy.hero.imageAlt}
            fill
            priority
            sizes="(max-width: 900px) 92vw, 49vw"
          />
          <figcaption>{copy.hero.conceptNotice}</figcaption>
        </figure>
      </section>

      <section className={styles.categories} id="collections" aria-label={copy.categories.aria}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>{copy.categories.eyebrow}</p>
          <h2>
            <MultilineTitle value={copy.categories.title} />
          </h2>
          <p>{copy.categories.body}</p>
        </div>

        <div className={styles.categoryRail}>
          {copy.collections.map(([title, label, href, image, analyticsLabel]) => (
            <TrackedLink
              key={href}
              href={localizePath(locale, href)}
              className={styles.categoryCard}
              analyticsLabel={analyticsLabel}
              analyticsSurface="shop_hub"
              analyticsDestinationType="collection"
            >
              <span className={styles.categoryImage}>
                <Image src={image} alt={copy.imageAlt(title)} fill sizes="(max-width: 700px) 72vw, 18vw" />
              </span>
              <span className={styles.categoryMeta} lang="en">
                {label}
              </span>
              <h3>{title}</h3>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className={styles.catalog} id="catalog" aria-label={copy.catalog.aria}>
        <div className={styles.catalogHeading}>
          <div>
            <p className={styles.eyebrow}>{copy.catalog.eyebrow}</p>
            <h2>{hasPublishedProducts ? copy.catalog.availableTitle : copy.catalog.emptyTitle}</h2>
          </div>
          <p>{hasPublishedProducts ? copy.catalog.availableBody : copy.catalog.emptyBody}</p>
        </div>

        {hasPublishedProducts ? (
          <>
            <p className={styles.catalogCount}>{copy.catalog.count(products.length)}</p>
            <div className={styles.productGrid}>
              {products.map((product) => {
                const media = product.media[0];
                const minimumPrice = getMinimumPrice(product);

                return (
                  <article key={product.slug} className={styles.productCard}>
                    <TrackedLink
                      href={`/${locale}/product/${product.slug}`}
                      className={styles.productMedia}
                      aria-label={`${copy.catalog.productCta}: ${product.name}`}
                      analyticsLabel={`shop_product_${product.slug}`}
                      analyticsSurface="shop_hub"
                      analyticsDestinationType="product"
                      analyticsEvent="select_item"
                      analyticsProperties={{ product_slug: product.slug, item_list: "shop_hub" }}
                    >
                      {media ? (
                        <Image
                          src={media.url}
                          alt={media.alt || product.name}
                          fill
                          sizes="(max-width: 620px) 92vw, (max-width: 1000px) 45vw, 23vw"
                        />
                      ) : (
                        <span className={styles.productMediaFallback} aria-hidden="true" />
                      )}
                    </TrackedLink>
                    <div className={styles.productDetails}>
                      {product.brand ? <p>{product.brand}</p> : null}
                      <h3>{product.name}</h3>
                      {minimumPrice !== null ? <span>{formatPrice(minimumPrice, locale)}</span> : null}
                      <TrackedLink
                        href={`/${locale}/product/${product.slug}`}
                        analyticsLabel={`shop_product_details_${product.slug}`}
                        analyticsSurface="shop_hub"
                        analyticsDestinationType="product"
                        analyticsEvent="select_item"
                        analyticsProperties={{ product_slug: product.slug, item_list: "shop_hub" }}
                      >
                        {copy.catalog.productCta}
                      </TrackedLink>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.catalogEmpty}>
            <span aria-hidden="true" />
            <div>
              <TrackedLink
                href={localizePath(locale, "/journal")}
                className={styles.primaryAction}
                analyticsLabel="shop_empty_journal"
                analyticsSurface="shop_hub"
              >
                {copy.catalog.emptyPrimary}
              </TrackedLink>
              <TrackedLink
                href={localizePath(locale, "/trust")}
                className={styles.secondaryAction}
                analyticsLabel="shop_empty_trust"
                analyticsSurface="shop_hub"
              >
                {copy.catalog.emptySecondary}
              </TrackedLink>
            </div>
          </div>
        )}
      </section>

      <section className={styles.editorial} aria-label={copy.editorial.aria}>
        <figure className={styles.editorialMedia}>
          <Image
            src={copy.editorial.image}
            alt={copy.editorial.imageAlt}
            fill
            sizes="(max-width: 900px) 92vw, 43vw"
          />
          <figcaption>{copy.editorial.conceptNotice}</figcaption>
        </figure>

        <div className={styles.editorialContent}>
          <p className={styles.eyebrow}>{copy.editorial.eyebrow}</p>
          <h2>
            <MultilineTitle value={copy.editorial.title} />
          </h2>
          <p className={styles.editorialBody}>{copy.editorial.body}</p>
          <div className={styles.routeGrid}>
            {copy.routes.map(([number, title, body, href, analyticsLabel]) => (
              <TrackedLink
                key={href}
                href={localizePath(locale, href)}
                className={styles.routeCard}
                analyticsLabel={analyticsLabel}
                analyticsSurface="shop_hub"
              >
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </TrackedLink>
            ))}
          </div>
          <TrackedLink
            href={localizePath(locale, "/journal")}
            className={styles.editorialAction}
            analyticsLabel="shop_editorial_journal"
            analyticsSurface="shop_hub"
          >
            {copy.editorial.cta}
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}
