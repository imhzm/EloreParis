"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnalyticsViewEvent } from "@/components/analytics-view-event";
import { BackInStock } from "@/components/back-in-stock";
import { useCart } from "@/components/cart-provider";
import { CinematicBreadcrumb, type CrumbItem } from "@/components/cinematic-breadcrumb";
import { ProductCard } from "@/components/product-card";
import { TrackedLink } from "@/components/tracked-link";
import { WishlistButton } from "@/components/wishlist-button";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";
import styles from "./cinematic-product-experience.module.css";

type Props = {
  product: PublicCatalogProduct;
  relatedProducts?: PublicCatalogProduct[];
  locale: Locale;
  breadcrumb?: CrumbItem[];
};

const copy = {
  ar: {
    breadcrumb: "مسار التنقل",
    productTruth: "PRODUCT TRUTH",
    choose: "اختاري الحجم أو النسخة",
    add: "أضيفي إلى السلة",
    cart: "استعراض السلة",
    available: "متاح",
    unavailable: "غير متاح حاليًا",
    collection: "العودة إلى المجموعة",
    quantity: "الكمية",
    decrease: "تقليل الكمية",
    increase: "زيادة الكمية",
    added: "تمت الإضافة إلى السلة.",
    function: "وظيفة المنتج",
    origin: "بلد المنشأ",
    expiry: "مدة الاستخدام",
    returns: "نافذة الاسترجاع",
    months: "شهر",
    days: "يوم",
    afterOpening: "بعد الفتح",
    details: "تفاصيل موثّقة تساعدك على الاختيار",
    formula: "المكونات المعتمدة",
    formulaBody: "قائمة INCI كما وصلت من سجل المنتج المعتمد، بلا تفسير أو وعود مضافة.",
    directions: "طريقة الاستخدام والحفظ",
    storage: "الحفظ",
    warnings: "التحذيرات",
    claims: "الادعاءات المعتمدة",
    noClaims: "لا توجد ادعاءات تسويقية منشورة خارج النص المعتمد.",
    questions: "أسئلة المنتج",
    benefits: "مزايا موثقة",
    fragrance: "بصمة العطر",
    fragranceFamily: "العائلة العطرية",
    concentration: "التركيز",
    topNotes: "المقدمة",
    heartNotes: "القلب",
    baseNotes: "القاعدة",
    packaging: "التغليف",
    giftEligible: "مناسب للإهداء",
    related: "يكمل طقسك",
    relatedBody: "اختيارات مرتبطة في السجل المعتمد لتجربة أكثر اكتمالًا.",
    imageUnavailable: "صورة المنتج غير متاحة في السجل المعتمد.",
    total: "إجمالي الاختيار",
  },
  en: {
    breadcrumb: "Breadcrumb",
    productTruth: "PRODUCT TRUTH",
    choose: "Choose a size or version",
    add: "Add to cart",
    cart: "Review cart",
    available: "Available",
    unavailable: "Currently unavailable",
    collection: "Back to collection",
    quantity: "Quantity",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    added: "Added to your cart.",
    function: "Product function",
    origin: "Country of origin",
    expiry: "Use period",
    returns: "Return window",
    months: "months",
    days: "days",
    afterOpening: "after opening",
    details: "Verified detail for a clearer decision",
    formula: "Approved ingredients",
    formulaBody: "The INCI list exactly as supplied by the approved product record, without added interpretation or promises.",
    directions: "Directions and storage",
    storage: "Storage",
    warnings: "Warnings",
    claims: "Approved claims",
    noClaims: "No public marketing claims are shown beyond approved product text.",
    questions: "Product questions",
    benefits: "Verified benefits",
    fragrance: "Fragrance profile",
    fragranceFamily: "Fragrance family",
    concentration: "Concentration",
    topNotes: "Top notes",
    heartNotes: "Heart notes",
    baseNotes: "Base notes",
    packaging: "Packaging",
    giftEligible: "Gift eligible",
    related: "Complete your ritual",
    relatedBody: "Approved related selections for a more complete experience.",
    imageUnavailable: "No product image is available in the approved record.",
    total: "Selection total",
  },
} as const;

function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function CinematicProductExperience({
  product,
  relatedProducts = [],
  locale,
  breadcrumb,
}: Props) {
  const pathname = usePathname() ?? `/${locale}/product/${product.slug}`;
  const { addItem, cartCount } = useCart();
  const text = copy[locale];
  const [selectedSku, setSelectedSku] = useState(
    product.variants.find((variant) => variant.availability === "InStock")?.sku
      ?? product.variants[0]?.sku
      ?? "",
  );
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const selectedVariant = product.variants.find((variant) => variant.sku === selectedSku)
    ?? product.variants[0];
  const selectedMedia = product.media[selectedMediaIndex] ?? product.media[0];
  const isAvailable = selectedVariant?.availability === "InStock";
  const collectionHref = `/${locale}/shop/${product.collection}`;
  const expiryLabel = product.expiry
    ? `${product.expiry.months} ${text.months}${product.expiry.mode === "pao" ? ` · ${text.afterOpening}` : ""}`
    : "—";
  const productFacts = [
    [text.function, product.finish],
    [text.origin, product.countryOfOrigin ?? "—"],
    [text.expiry, expiryLabel],
    [text.returns, `${product.returns.windowDays} ${text.days}`],
  ];
  const fragrance = product.merchandising.fragrance;
  const hasMerchandising = Boolean(
    product.merchandising.benefits.length ||
    product.merchandising.packaging ||
    fragrance,
  );

  const addToCart = () => {
    if (!selectedVariant || !isAvailable) return;
    addItem({ productSlug: product.slug, sku: selectedVariant.sku, quantity });
    setStatus(text.added);
    trackAnalyticsEvent("add_to_cart", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      product_slug: product.slug,
      sku: selectedVariant.sku,
      quantity,
      unit_price: selectedVariant.price,
      cart_count: cartCount + quantity,
    });
  };

  const quickAddRelated = (relatedProduct: PublicCatalogProduct) => (sku: string) => {
    const variant = relatedProduct.variants.find((candidate) => candidate.sku === sku);
    if (!variant || variant.availability !== "InStock") return;
    addItem({ productSlug: relatedProduct.slug, sku, quantity: 1 });
    setStatus(text.added);
    trackAnalyticsEvent("add_to_cart", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      source_surface: "product_related",
      product_slug: relatedProduct.slug,
      sku,
      quantity: 1,
      unit_price: variant.price,
      cart_count: cartCount + 1,
    });
  };

  return (
    <div className={styles.product} data-public-product data-reference-product>
      <AnalyticsViewEvent
        eventName="view_item"
        eventKey={`product:${locale}:${product.slug}`}
        properties={{
          product_slug: product.slug,
          sku: selectedVariant?.sku ?? "",
          brand: product.brand,
          collection: product.collection,
          currency: "SAR",
          value: selectedVariant?.price ?? 0,
        }}
      />
      {breadcrumb && breadcrumb.length > 0 ? (
        <div className={styles.breadcrumbBand}>
          <CinematicBreadcrumb label={text.breadcrumb} items={breadcrumb} />
        </div>
      ) : null}

      <section className={styles.overview}>
        <div className={styles.gallery}>
          <div className={styles.mainMedia}>
            {selectedMedia ? (
              <Image
                src={selectedMedia.url}
                alt={selectedMedia.alt}
                fill
                sizes="(max-width: 900px) 100vw, 56vw"
                priority
              />
            ) : (
              <p>{text.imageUnavailable}</p>
            )}
          </div>
          {product.media.length > 1 ? (
            <div className={styles.thumbnails} aria-label={product.name}>
              {product.media.map((media, index) => (
                <button
                  key={`${media.url}-${index}`}
                  type="button"
                  aria-pressed={index === selectedMediaIndex}
                  aria-label={`${product.name} · ${index + 1}`}
                  onClick={() => setSelectedMediaIndex(index)}
                >
                  <Image src={media.url} alt="" fill sizes="96px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.purchase} id="purchase" aria-labelledby="product-title">
          <p className={styles.eyebrow} lang="en">{text.productTruth}</p>
          <p className={styles.brand}>{product.brand}</p>
          <h1 id="product-title">{product.name}</h1>
          <p className={styles.subtitle}>{product.subtitle}</p>
          {product.merchandising.tags.length || product.merchandising.giftEligible ? (
            <ul className={styles.tags} aria-label={product.name}>
              {product.merchandising.tags.map((tag) => <li key={tag}>{tag}</li>)}
              {product.merchandising.giftEligible ? <li>{text.giftEligible}</li> : null}
            </ul>
          ) : null}
          <strong className={styles.price}>
            {formatPrice(selectedVariant?.price ?? 0, locale)}
          </strong>
          <WishlistButton
            productSlug={product.slug}
            productName={product.name}
            locale={locale}
            surface="product_purchase"
            className={styles.wishlistButton}
          />

          <fieldset className={styles.variantGroup}>
            <legend>{text.choose}</legend>
            <div className={styles.variantList}>
              {product.variants.map((variant) => (
                <button
                  key={variant.sku}
                  type="button"
                  aria-pressed={variant.sku === selectedVariant?.sku}
                  onClick={() => setSelectedSku(variant.sku)}
                >
                  <span><strong>{variant.label}</strong><small>{variant.size}</small></span>
                  <span><b>{formatPrice(variant.price, locale)}</b><small>{variant.availability === "InStock" ? text.available : text.unavailable}</small></span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className={styles.quantityRow}>
            <span>{text.quantity}</span>
            <div className={styles.quantity}>
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label={text.decrease}>−</button>
              <output aria-live="polite">{quantity}</output>
              <button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} aria-label={text.increase}>+</button>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.addButton} onClick={addToCart} disabled={!isAvailable}>
              {text.add} · {formatPrice((selectedVariant?.price ?? 0) * quantity, locale)}
            </button>
            <TrackedLink href={`/${locale}/cart`} className={styles.cartLink} analyticsLabel={`product_to_cart_${product.slug}`} analyticsSurface="product_purchase" analyticsDestinationType="cart">{text.cart}</TrackedLink>
          </div>
          {selectedVariant && !isAvailable ? <BackInStock productSlug={product.slug} productName={product.name} sku={selectedVariant.sku} locale={locale} /> : null}
          <p className={styles.shipping}>{product.shippingNote}</p>
          <p className={styles.status} role="status" aria-live="polite">{status}</p>
          <TrackedLink href={collectionHref} className={styles.collectionLink} analyticsLabel={`${product.slug}_collection`} analyticsSurface="product_reference">{text.collection}</TrackedLink>
        </div>
      </section>

      <section className={styles.facts} aria-labelledby="product-details-title">
        <header>
          <p className={styles.eyebrow} lang="en">APPROVED PRODUCT RECORD</p>
          <h2 id="product-details-title">{text.details}</h2>
        </header>
        <div className={styles.factGrid}>
          {productFacts.map(([label, value], index) => (
            <article key={label}><span>0{index + 1}</span><small>{label}</small><strong>{value}</strong></article>
          ))}
        </div>
      </section>

      {hasMerchandising ? (
        <section className={styles.merchandising} aria-labelledby="product-merchandising-title">
          <header>
            <p className={styles.eyebrow} lang="en">CURATED PRODUCT DETAIL</p>
            <h2 id="product-merchandising-title">{fragrance ? text.fragrance : text.benefits}</h2>
          </header>
          {fragrance ? (
            <div className={styles.fragranceMeta}>
              <article><small>{text.fragranceFamily}</small><strong>{fragrance.family}</strong></article>
              <article><small>{text.concentration}</small><strong>{fragrance.concentration}</strong></article>
            </div>
          ) : null}
          {fragrance ? (
            <div className={styles.notePyramid}>
              {[
                [text.topNotes, fragrance.topNotes],
                [text.heartNotes, fragrance.heartNotes],
                [text.baseNotes, fragrance.baseNotes],
              ].map(([label, notes]) => (
                <article key={label as string}>
                  <span aria-hidden="true" />
                  <small>{label}</small>
                  <p>{(notes as string[]).join(" · ") || "—"}</p>
                </article>
              ))}
            </div>
          ) : null}
          {product.merchandising.benefits.length ? (
            <div className={styles.benefits}>
              <h3>{text.benefits}</h3>
              <ul>{product.merchandising.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
            </div>
          ) : null}
          {product.merchandising.packaging ? (
            <article className={styles.packaging}>
              <small>{text.packaging}</small>
              <p>{product.merchandising.packaging}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className={styles.details}>
        <details open>
          <summary>{text.formula}</summary>
          <div><p>{text.formulaBody}</p><p className={styles.inci} lang="en" dir="ltr">{product.ingredientsInci ?? "—"}</p></div>
        </details>
        <details>
          <summary>{text.directions}</summary>
          <div className={styles.detailGrid}>
            <article><strong>{text.directions}</strong><p>{product.directions ?? "—"}</p></article>
            <article><strong>{text.storage}</strong><p>{product.storage ?? "—"}</p></article>
            <article><strong>{text.warnings}</strong>{product.warnings.length ? <ul>{product.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p>—</p>}</article>
          </div>
        </details>
        <details>
          <summary>{text.claims}</summary>
          <div>{product.approvedClaims.length ? <ul>{product.approvedClaims.map((claim) => <li key={claim}>{claim}</li>)}</ul> : <p>{text.noClaims}</p>}</div>
        </details>
        {product.questions.length ? (
          <details>
            <summary>{text.questions}</summary>
            <div className={styles.questionList}>{product.questions.map((item) => <article key={item.question}><strong>{item.question}</strong><p>{item.answer}</p></article>)}</div>
          </details>
        ) : null}
      </section>

      {relatedProducts.length ? (
        <section className={styles.related} aria-labelledby="related-products-title">
          <header>
            <p className={styles.eyebrow} lang="en">RITUAL PAIRINGS</p>
            <h2 id="related-products-title">{text.related}</h2>
            <p>{text.relatedBody}</p>
          </header>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.slug}
                product={relatedProduct}
                locale={locale}
                onQuickAdd={quickAddRelated(relatedProduct)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.mobileBar}>
        <span><small>{text.total}</small><strong>{formatPrice((selectedVariant?.price ?? 0) * quantity, locale)}</strong></span>
        <button type="button" onClick={addToCart} disabled={!isAvailable}>{text.add}</button>
      </div>
    </div>
  );
}
