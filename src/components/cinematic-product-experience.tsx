"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { BackInStock } from "@/components/back-in-stock";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { useScrollSceneProgress } from "@/hooks/use-scroll-scene-progress";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";
import styles from "./cinematic-product-experience.module.css";

type Props = { product: PublicCatalogProduct; locale: Locale };

const copy = {
  ar: {
    choose: "اختاري نسختك.", add: "أضيفي للسلة", cart: "استعراض السلة",
    available: "متاح", unavailable: "غير متاح حاليًا", collection: "العودة للمجموعة",
    fitTitle: "قرار المنتج\nيبدأ من الوضوح.", formulaTitle: "داخل التركيبة",
    formulaBody: "قائمة المكونات المعتمدة كما وصلت من بيانات المنتج، من دون إضافة وعود أو تفسير غير موثق.",
    usageTitle: "استخدام واضح.\nوتحذيرات قريبة.", purchase: "جاهزة للاختيار",
    function: "وظيفة المنتج", origin: "بلد المنشأ", expiry: "مدة الاستخدام",
    returns: "نافذة الاسترجاع", months: "شهر", days: "أيام", afterOpening: "بعد الفتح",
    directions: "طريقة الاستخدام", storage: "الحفظ", warnings: "التحذيرات",
    noClaims: "لا توجد ادعاءات تسويقية عامة منشورة خارج النصوص المعتمدة.", added: "تمت الإضافة إلى السلة.",
  },
  en: {
    choose: "Choose your version.", add: "Add to cart", cart: "Review cart",
    available: "Available", unavailable: "Currently unavailable", collection: "Back to collection",
    fitTitle: "A product decision\nstarts with clarity.", formulaTitle: "Inside the formula",
    formulaBody: "The approved ingredient list as supplied by the product record, without added promises or unsupported interpretation.",
    usageTitle: "Clear directions.\nVisible cautions.", purchase: "Ready to choose",
    function: "Product function", origin: "Country of origin", expiry: "Use period",
    returns: "Return window", months: "months", days: "days", afterOpening: "after opening",
    directions: "Directions", storage: "Storage", warnings: "Warnings",
    noClaims: "No public marketing claims are shown beyond approved product text.", added: "Added to your cart.",
  },
} as const;

function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency", currency: "SAR", maximumFractionDigits: 2,
  }).format(value);
}

export function CinematicProductExperience({ product, locale }: Props) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-product-scene]" });
  const pathname = usePathname() ?? `/${locale}/product/${product.slug}`;
  const { addItem, cartCount } = useCart();
  const text = copy[locale];
  const [selectedSku, setSelectedSku] = useState(product.variants.find((variant) => variant.availability === "InStock")?.sku ?? product.variants[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const selectedVariant = product.variants.find((variant) => variant.sku === selectedSku) ?? product.variants[0];
  const productImage = product.media[0];
  const collectionHref = `/${locale}/shop/${product.collection}`;
  const isAvailable = selectedVariant?.availability === "InStock";
  const expiryLabel = product.expiry
    ? `${product.expiry.months} ${text.months}${product.expiry.mode === "pao" ? ` · ${text.afterOpening}` : ""}`
    : "—";

  const addToCart = () => {
    if (!selectedVariant || !isAvailable) return;
    addItem({ productSlug: product.slug, sku: selectedVariant.sku, quantity });
    setStatus(text.added);
    trackAnalyticsEvent("add_to_cart", {
      source_path: pathname, source_page_type: getPageType(pathname), product_slug: product.slug,
      sku: selectedVariant.sku, quantity, unit_price: selectedVariant.price, cart_count: cartCount + quantity,
    });
  };

  const fitSignals = [
    [text.function, product.finish],
    [text.origin, product.countryOfOrigin ?? "—"],
    [text.expiry, expiryLabel],
    [text.returns, `${product.returns.windowDays} ${text.days}`],
  ];
  const usageSignals = [
    product.directions ? [text.directions, product.directions] : null,
    product.storage ? [text.storage, product.storage] : null,
    ...product.warnings.map((warning) => [text.warnings, warning]),
  ].filter((item): item is string[] => Boolean(item));

  return <div ref={rootRef} className={styles.product} data-public-product>
    <section className={`${styles.scene} ${styles.heroScene}`} data-product-scene aria-label={product.name}>
      <div className={styles.frame}>
        <div className={styles.productHalo} aria-hidden="true"><i /><i /></div>
        <div className={styles.heroVisual}><Image src={productImage.url} alt={productImage.alt} fill sizes="(max-width: 800px) 78vw, 42vw" priority /></div>
        <div className={styles.heroCopy}><p>{product.brand}</p><h1>{product.name}</h1><span>{product.subtitle}</span><div><TrackedLink href="#purchase" className={styles.primaryAction} analyticsLabel={`${product.slug}_buy`} analyticsSurface="product_cinematic">{formatPrice(Math.min(...product.variants.map((variant) => variant.price)), locale)}</TrackedLink><TrackedLink href={collectionHref} className={styles.secondaryAction} analyticsLabel={`${product.slug}_collection`} analyticsSurface="product_cinematic">{text.collection}</TrackedLink></div></div>
        <div className={styles.counter}>01 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.fitScene}`} data-product-scene aria-label={text.fitTitle.replace("\n", " ")}>
      <div className={styles.frame}>
        <div className={styles.sceneCopy}><p>PRODUCT TRUTH</p><h2>{text.fitTitle.split("\n").map((line, index) => <span key={line}>{index ? <br /> : null}{line}</span>)}</h2><span>{product.subtitle}</span></div>
        <div className={styles.fitOrbit}>{fitSignals.map(([label, value], index) => <article key={label} style={{ "--index": index } as CSSProperties}><b>0{index + 1}</b><small>{label}</small><h3>{value}</h3></article>)}</div>
        <div className={styles.counter}>02 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.ingredientScene}`} data-product-scene aria-label={text.formulaTitle}>
      <div className={styles.frame}>
        <div className={styles.ingredientWord} aria-hidden="true">FORMULA</div>
        <div className={styles.ingredientCopy}><p>APPROVED FORMULA</p><h2>{text.formulaTitle}</h2><span>{text.formulaBody}</span></div>
        <div className={styles.ingredientStack}>{[product.ingredientsInci ?? "—", ...(product.approvedClaims.length ? product.approvedClaims : [text.noClaims])].slice(0, 3).map((item, index) => <article key={`${index}-${item}`} style={{ "--index": index } as CSSProperties}><b>0{index + 1}</b><p>{item}</p></article>)}</div>
        <div className={styles.counter}>03 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.usageScene}`} data-product-scene aria-label={text.usageTitle.replace("\n", " ")}>
      <div className={styles.frame}>
        <div className={styles.usageVisual}><Image src={productImage.url} alt="" fill sizes="38vw" /></div>
        <div className={styles.usageCopy}><p>HOW TO USE</p><h2>{text.usageTitle.split("\n").map((line, index) => <span key={line}>{index ? <br /> : null}{line}</span>)}</h2><div>{usageSignals.slice(0, 4).map(([label, value], index) => <article key={`${label}-${index}`}><b>0{index + 1}</b><span><strong>{label}</strong><br />{value}</span></article>)}</div></div>
        <div className={styles.counter}>04 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.purchaseScene}`} data-product-scene id="purchase" aria-label={text.purchase}>
      <div className={styles.frame}>
        <div className={styles.purchaseVisual}><Image src={productImage.url} alt={productImage.alt} fill sizes="40vw" /></div>
        <div className={styles.purchasePanel}><p>READY TO CHOOSE</p><h2>{text.choose}</h2><div className={styles.variantList}>{product.variants.map((variant) => <button key={variant.sku} type="button" aria-pressed={variant.sku === selectedVariant?.sku} onClick={() => setSelectedSku(variant.sku)}><strong>{variant.label}</strong><span>{variant.size}</span><b>{formatPrice(variant.price, locale)}</b><small>{variant.availability === "InStock" ? text.available : text.unavailable}</small></button>)}</div><div className={styles.quantity}><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))} aria-label="Increase quantity">+</button></div><div className={styles.purchaseActions}><button type="button" onClick={addToCart} disabled={!isAvailable}>{text.add} · {formatPrice((selectedVariant?.price ?? 0) * quantity, locale)}</button><TrackedLink href={`/${locale}/cart`} analyticsLabel={`product_to_cart_${product.slug}`} analyticsSurface="product_purchase" analyticsDestinationType="cart">{text.cart}</TrackedLink></div>{selectedVariant && !isAvailable ? <BackInStock productSlug={product.slug} productName={product.name} sku={selectedVariant.sku} locale={locale} /> : null}<span className={styles.shipping}>{product.shippingNote}</span><p className={styles.status} aria-live="polite">{status}</p></div>
        <div className={styles.counter}>05 — 05</div>
      </div>
    </section>
  </div>;
}
