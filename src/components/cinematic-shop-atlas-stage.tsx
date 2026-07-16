"use client";

import Image from "next/image";
import { type CSSProperties, type FocusEvent } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { useScrollSceneProgress } from "@/hooks/use-scroll-scene-progress";
import { localizePath, type Locale } from "@/lib/i18n";
import { shopCopy } from "@/lib/shop-content";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";
import styles from "./cinematic-shop-atlas-stage.module.css";
import { MultilineTitle } from "@/components/scene-primitives";

type Props = { locale: Locale; products: PublicCatalogProduct[] };

function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}

function keepFocusedLinkVisible(event: FocusEvent<HTMLAnchorElement>) {
  const target = event.currentTarget;
  requestAnimationFrame(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    target.scrollIntoView({ block: "center", inline: "nearest" });
    root.style.scrollBehavior = previousScrollBehavior;
  });
}

export function CinematicShopAtlasStage({ locale, products }: Props) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-shop-scene]" });
  const copy = shopCopy[locale];
  const publicProducts = products.slice(0, 4);

  return (
    <div ref={rootRef} className={styles.shop}>
      <section className={`${styles.scene} ${styles.atlasScene}`} data-shop-scene aria-label={copy.hero.aria}>
        <div className={styles.frame}>
          <div className={styles.atlas} aria-hidden="true">
            <span>01</span><span>02</span><span>03</span><b lang="en">ÉLORÉ<br />PARIS</b>
          </div>
          <div className={styles.heroCopy}>
            <p>{copy.hero.eyebrow}</p>
            <h1><MultilineTitle value={copy.hero.title} /></h1>
            <span>{copy.hero.body}</span>
            <TrackedLink href="#collections" className={styles.primaryAction} onFocus={keepFocusedLinkVisible} analyticsLabel="shop_atlas_collections" analyticsSurface="shop_cinematic">{copy.hero.cta}</TrackedLink>
          </div>
          <div className={styles.sceneCounter} aria-hidden="true">01 — 05</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.collectionScene}`} data-shop-scene id="collections" aria-label={copy.categories.aria}>
        <div className={styles.frame}>
          <div className={styles.heading}><p>{copy.categories.eyebrow}</p><h2><MultilineTitle value={copy.categories.title} /></h2></div>
          <div className={styles.collectionTrack}>
            {copy.collections.map(([title, label, href, image, analyticsLabel], index) => (
              <TrackedLink key={href} href={localizePath(locale, href)} className={styles.collectionCard} onFocus={keepFocusedLinkVisible} style={{ "--index": index } as CSSProperties} analyticsLabel={analyticsLabel} analyticsSurface="shop_cinematic" analyticsDestinationType="collection">
                <Image src={image} alt="" fill sizes="(max-width: 700px) 100vw, 19vw" />
                <span>0{index + 1}</span><small>{label}</small><h3>{title}</h3>
              </TrackedLink>
            ))}
          </div>
          <div className={styles.sceneCounter} aria-hidden="true">02 — 05</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.productsScene}`} data-shop-scene aria-label={copy.edit.aria}>
        <div className={styles.frame}>
          <div className={styles.productCopy}><p>{copy.edit.eyebrow}</p><h2><MultilineTitle value={copy.edit.title} /></h2><TrackedLink href={localizePath(locale, "/journal")} onFocus={keepFocusedLinkVisible} analyticsLabel="shop_products_journal" analyticsSurface="shop_cinematic">{copy.edit.cta}</TrackedLink></div>
          <div className={styles.productStack}>
            {publicProducts.length > 0
              ? publicProducts.map((product, index) => (
                  <article key={product.slug} className={styles.productCard} style={{ "--index": index } as CSSProperties}>
                    <div><Image src={product.media[0].url} alt={product.media[0].alt} fill sizes="(max-width: 700px) 68vw, 26vw" /></div>
                    <small>{product.brand}</small><h3>{product.name}</h3>
                    <span>{formatPrice(Math.min(...product.variants.map((variant) => variant.price)), locale)}</span>
                    <TrackedLink href={`/${locale}/product/${product.slug}`} onFocus={keepFocusedLinkVisible} aria-label={`${copy.edit.cardCta}: ${product.name}`} analyticsLabel={`shop_product_${product.slug}`} analyticsSurface="shop_cinematic" analyticsDestinationType="product">{copy.edit.cardCta}</TrackedLink>
                  </article>
                ))
              : copy.studies.map(([name, label, image, href], index) => (
                  <article key={name} className={styles.productCard} style={{ "--index": index } as CSSProperties}>
                    <div><Image src={image} alt={name} fill sizes="(max-width: 700px) 68vw, 26vw" /></div>
                    <small>{label}</small><h3>{name}</h3>
                    <TrackedLink href={localizePath(locale, href)} onFocus={keepFocusedLinkVisible} aria-label={`${copy.edit.cardCta}: ${name}`} analyticsLabel={`shop_study_${index}`} analyticsSurface="shop_cinematic">{copy.edit.cardCta}</TrackedLink>
                  </article>
                ))}
          </div>
          <div className={styles.sceneCounter} aria-hidden="true">03 — 05</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.routesScene}`} data-shop-scene aria-label={copy.routesIntro.aria}>
        <div className={styles.frame}>
          <div className={styles.routeCenter}><p>{copy.routesIntro.eyebrow}</p><h2><MultilineTitle value={copy.routesIntro.title} /></h2><span>{copy.routesIntro.body}</span></div>
          <div className={styles.routeGrid}>
            {copy.routes.map(([number, title, body, href, analyticsLabel], index) => (
              <TrackedLink key={href} href={localizePath(locale, href)} className={styles.routeCard} onFocus={keepFocusedLinkVisible} style={{ "--index": index } as CSSProperties} analyticsLabel={analyticsLabel} analyticsSurface="shop_cinematic">
                <b>{number}</b><h3>{title}</h3><span>{body}</span>
              </TrackedLink>
            ))}
          </div>
          <div className={styles.sceneCounter} aria-hidden="true">04 — 05</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.finalScene}`} data-shop-scene aria-label={copy.finale.aria}>
        <div className={styles.frame}>
          <div className={styles.finalRule} aria-hidden="true" />
          <div className={styles.finalProducts} aria-hidden="true">
            {(publicProducts.length > 0
              ? publicProducts.slice(0, 3).map((product) => product.media[0].url)
              : copy.studies.slice(0, 3).map(([, , image]) => image)
            ).map((image, index) => <div key={image} style={{ "--index": index } as CSSProperties}><Image src={image} alt="" fill sizes="240px" /></div>)}
          </div>
          <div className={styles.finalCopy}>
            <p>{copy.finale.eyebrow}</p><h2><MultilineTitle value={copy.finale.title} /></h2><span>{copy.finale.body}</span>
            <div><TrackedLink href={localizePath(locale, "/journal")} className={styles.primaryAction} onFocus={keepFocusedLinkVisible} analyticsLabel="shop_final_journal" analyticsSurface="shop_cinematic">{copy.finale.primary}</TrackedLink><TrackedLink href={localizePath(locale, "/trust")} className={styles.secondaryAction} onFocus={keepFocusedLinkVisible} analyticsLabel="shop_hub_to_trust" analyticsSurface="shop_cinematic">{copy.finale.secondary}</TrackedLink></div>
          </div>
          <div className={styles.sceneCounter} aria-hidden="true">05 — 05</div>
        </div>
      </section>
    </div>
  );
}
