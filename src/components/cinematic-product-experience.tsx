"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import type { ProductRecord } from "@/lib/site-content";
import styles from "./cinematic-product-experience.module.css";

type Props = {
  product: ProductRecord;
  collection: { title: string; href: string; subtitle: string; mode: "filtered" | "editorial" };
  ingredientSlug?: string;
};
const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const assets = ["/brand-assets/product-01.jpg", "/brand-assets/product-02.jpg", "/brand-assets/product-03.jpg", "/brand-assets/product-04.jpg", "/brand-assets/product-05.jpg", "/brand-assets/product-06.jpg"];

export function CinematicProductExperience({ product, collection, ingredientSlug }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? `/products/${product.slug}`;
  const { addItem, cartCount } = useCart();
  const [selectedSku, setSelectedSku] = useState(product.variants[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const selectedVariant = product.variants.find((variant) => variant.sku === selectedSku) ?? product.variants[0];
  const imageIndex = useMemo(() => [...product.slug].reduce((sum, character) => sum + character.charCodeAt(0), 0) % assets.length, [product.slug]);
  const productImage = assets[imageIndex];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-product-scene]"));
    let frameId = 0;
    const update = () => {
      scenes.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const progress = clamp(-bounds.top / Math.max(bounds.height - innerHeight, 1));
        scene.dataset.sceneState = bounds.top > 0 ? "before" : bounds.bottom <= innerHeight ? "after" : "active";
        scene.style.setProperty("--progress", `${progress}`); scene.style.setProperty("--enter", `${clamp(progress / 0.2)}`); scene.style.setProperty("--exit", `${clamp((progress - 0.78) / 0.22)}`);
      }); frameId = 0;
    };
    const schedule = () => { if (!frameId) frameId = requestAnimationFrame(update); };
    update(); addEventListener("scroll", schedule, { passive: true }); addEventListener("resize", schedule);
    return () => { removeEventListener("scroll", schedule); removeEventListener("resize", schedule); if (frameId) cancelAnimationFrame(frameId); };
  }, []);

  const addToCart = () => {
    if (!selectedVariant) return;
    addItem({ productSlug: product.slug, sku: selectedVariant.sku, quantity });
    setStatus(`تمت إضافة ${product.name} إلى السلة.`);
    trackAnalyticsEvent("add_to_cart", { source_path: pathname, source_page_type: getPageType(pathname), product_slug: product.slug, sku: selectedVariant.sku, quantity, unit_price: selectedVariant.price, cart_count: cartCount + quantity });
  };

  return <div ref={rootRef} className={styles.product}>
    <section className={`${styles.scene} ${styles.heroScene}`} data-product-scene aria-label={`منتج ${product.name}`}>
      <div className={styles.frame}>
        <div className={styles.productHalo} aria-hidden="true"><i /><i /></div>
        <div className={styles.heroVisual}><Image src={productImage} alt={product.name} fill sizes="(max-width: 800px) 78vw, 42vw" priority /></div>
        <div className={styles.heroCopy}><p>{product.brand} · {product.category}</p><h1>{product.name}</h1><span>{product.subtitle}</span><div><TrackedLink href="#purchase" className={styles.primaryAction} analyticsLabel={`${product.slug}_buy`} analyticsSurface="product_cinematic">من {product.priceFrom} ر.س</TrackedLink><TrackedLink href={collection.href} className={styles.secondaryAction} analyticsLabel={`${product.slug}_collection`} analyticsSurface="product_cinematic">{collection.title}</TrackedLink></div></div>
        <div className={styles.counter}>01 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.fitScene}`} data-product-scene aria-label={`ملاءمة ${product.name}`}>
      <div className={styles.frame}>
        <div className={styles.sceneCopy}><p>WHY IT FITS</p><h2>قرار المنتج<br />يبدأ من الملاءمة.</h2><span>{product.description}</span></div>
        <div className={styles.fitOrbit}>{[["المشكلة",product.concern],["الملمس",product.texture],["النتيجة",product.finish],["التوقيت",product.usageTiming]].map(([label,value],index)=><article key={label} style={{"--index":index} as CSSProperties}><b>0{index+1}</b><small>{label}</small><h3>{value}</h3></article>)}</div>
        <div className={styles.counter}>02 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.ingredientScene}`} data-product-scene aria-label={`مكونات ${product.name}`}>
      <div className={styles.frame}>
        <div className={styles.ingredientWord} aria-hidden="true">FORMULA</div>
        <div className={styles.ingredientCopy}><p>INSIDE THE FORMULA</p><h2>{product.ingredient}</h2><span>المكوّن البارز ليس وعدًا منفصلًا، بل جزء من قرار الاستخدام والروتين.</span>{ingredientSlug ? <TrackedLink href={`/ingredients/${ingredientSlug}`} analyticsLabel={`${product.slug}_ingredient`} analyticsSurface="product_cinematic">افهمي المكوّن ←</TrackedLink> : null}</div>
        <div className={styles.ingredientStack}>{product.ingredientsHighlights.slice(0,3).map((item,index)=><article key={item} style={{"--index":index} as CSSProperties}><b>0{index+1}</b><p>{item}</p></article>)}</div>
        <div className={styles.counter}>03 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.usageScene}`} data-product-scene aria-label={`استخدام ${product.name}`}>
      <div className={styles.frame}>
        <div className={styles.usageVisual}><Image src={productImage} alt="" fill sizes="38vw" /></div>
        <div className={styles.usageCopy}><p>HOW TO USE</p><h2>خطوات قليلة.<br />استخدام أوضح.</h2><div>{product.usage.slice(0,4).map((item,index)=><article key={item}><b>0{index+1}</b><span>{item}</span></article>)}</div></div>
        <div className={styles.counter}>04 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.purchaseScene}`} data-product-scene id="purchase" aria-label={`شراء ${product.name}`}>
      <div className={styles.frame}>
        <div className={styles.purchaseVisual}><Image src={productImage} alt={product.name} fill sizes="40vw" /></div>
        <div className={styles.purchasePanel}><p>READY TO CHOOSE</p><h2>اختاري نسختك.</h2><div className={styles.variantList}>{product.variants.map((variant)=><button key={variant.sku} type="button" aria-pressed={variant.sku===selectedVariant?.sku} onClick={()=>setSelectedSku(variant.sku)}><strong>{variant.label}</strong><span>{variant.size}</span><b>{variant.price} ر.س</b><small>{variant.availability==="InStock"?"متاح":"طلب مسبق"}</small></button>)}</div><div className={styles.quantity}><button type="button" onClick={()=>setQuantity(Math.max(1,quantity-1))} aria-label="تقليل الكمية">−</button><span>{quantity}</span><button type="button" onClick={()=>setQuantity(Math.min(10,quantity+1))} aria-label="زيادة الكمية">+</button></div><div className={styles.purchaseActions}><button type="button" onClick={addToCart}>أضيفي للسلة · {(selectedVariant?.price??0)*quantity} ر.س</button><TrackedLink href="/cart" analyticsLabel={`${product.slug}_cart`} analyticsSurface="product_purchase" analyticsDestinationType="cart">استعراض السلة</TrackedLink></div><span className={styles.shipping}>{product.shippingNote}</span><p className={styles.status} aria-live="polite">{status}</p></div>
        <div className={styles.counter}>05 — 05</div>
      </div>
    </section>
  </div>;
}
