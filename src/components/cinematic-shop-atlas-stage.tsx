"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { TrackedLink } from "@/components/tracked-link";
import styles from "./cinematic-shop-atlas-stage.module.css";

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

const collections = [
  { title: "العناية بالبشرة", label: "SKINCARE", href: "/shop/skincare", image: "/brand-assets/product-01.jpg" },
  { title: "المكياج", label: "MAKEUP", href: "/shop/makeup", image: "/brand-assets/product-05.jpg" },
  { title: "العناية بالشعر", label: "HAIRCARE", href: "/shop/haircare", image: "/brand-assets/product-02.jpg" },
  { title: "العناية بالجسم", label: "BODYCARE", href: "/shop/bodycare", image: "/brand-assets/product-04.jpg" },
  { title: "الأدوات", label: "TOOLS", href: "/shop/tools", image: "/brand-assets/product-06.jpg" },
  { title: "مجموعات الجمال", label: "BEAUTY SETS", href: "/shop/beauty-sets", image: "/brand-assets/product-03.jpg" },
] as const;

const products = [
  { name: "Pigmentbio Night Renewer", brand: "BIODERMA", image: "/brand-assets/product-01.jpg" },
  { name: "Calming Urea Shampoo", brand: "EUCERIN", image: "/brand-assets/product-02.jpg" },
  { name: "pH5 Mild Shampoo", brand: "EUCERIN", image: "/brand-assets/product-03.jpg" },
  { name: "Cicabio Arnica+", brand: "BIODERMA", image: "/brand-assets/product-04.jpg" },
] as const;

const routes = [
  { number: "01", title: "حسب المشكلة", body: "ابدئي بالنتيجة التي تبحثين عنها.", href: "/concerns" },
  { number: "02", title: "حسب الروتين", body: "رتّبي الخطوات قبل اختيار المنتجات.", href: "/routines" },
  { number: "03", title: "حسب المكوّن", body: "افهمي التركيبة وما يناسب احتياجك.", href: "/ingredients" },
  { number: "04", title: "بحث مباشر", body: "عندما تعرفين الاسم أو العلامة.", href: "/search" },
] as const;

export function CinematicShopAtlasStage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-shop-scene]"));
    let requestId = 0;
    const update = () => {
      scenes.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const progress = clamp(-bounds.top / Math.max(bounds.height - innerHeight, 1));
        scene.dataset.sceneState = bounds.top > 0 ? "before" : bounds.bottom <= innerHeight ? "after" : "active";
        scene.style.setProperty("--progress", `${progress}`);
        scene.style.setProperty("--enter", `${clamp(progress / 0.2)}`);
        scene.style.setProperty("--exit", `${clamp((progress - 0.78) / 0.22)}`);
      });
      requestId = 0;
    };
    const schedule = () => { if (!requestId) requestId = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => { removeEventListener("scroll", schedule); removeEventListener("resize", schedule); if (requestId) cancelAnimationFrame(requestId); };
  }, []);

  return <div ref={rootRef} className={styles.shop}>
    <section className={`${styles.scene} ${styles.atlasScene}`} data-shop-scene aria-label="بوابة المتجر">
      <div className={styles.frame}>
        <div className={styles.atlas} aria-hidden="true"><i /><i /><i /><b>COZMATEKS<br />ATLAS</b></div>
        <div className={styles.heroCopy}><p>THE BEAUTY ATLAS</p><h1>اختاري طريقك.<br />مش مجرد منتج.</h1><span>فئة، مشكلة، روتين أو مكوّن. كل طريق يقربك من قرار أوضح.</span><TrackedLink href="#collections" className={styles.primaryAction} analyticsLabel="shop_atlas_collections" analyticsSurface="shop_cinematic">ابدئي الرحلة</TrackedLink></div>
        <div className={styles.sceneCounter}>01 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.collectionScene}`} data-shop-scene id="collections" aria-label="تصنيفات المتجر">
      <div className={styles.frame}>
        <div className={styles.heading}><p>SHOP BY CATEGORY</p><h2>ستة أبواب.<br />اختيار واحد.</h2></div>
        <div className={styles.collectionTrack}>{collections.map((collection, index) => <TrackedLink key={collection.href} href={collection.href} className={styles.collectionCard} style={{ "--index": index } as CSSProperties} analyticsLabel={`shop_collection_${index}`} analyticsSurface="shop_cinematic" analyticsDestinationType="collection"><Image src={collection.image} alt="" fill sizes="(max-width: 700px) 58vw, 20vw" /><span>0{index + 1}</span><small>{collection.label}</small><h3>{collection.title}</h3></TrackedLink>)}</div>
        <div className={styles.sceneCounter}>02 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.productsScene}`} data-shop-scene aria-label="منتجات مختارة">
      <div className={styles.frame}>
        <div className={styles.productCopy}><p>THE CURRENT EDIT</p><h2>منتجات حقيقية.<br />عرض أهدأ.</h2><TrackedLink href="/search" analyticsLabel="shop_products_search" analyticsSurface="shop_cinematic">البحث في المتجر ←</TrackedLink></div>
        <div className={styles.productStack}>{products.map((product, index) => <article key={product.name} className={styles.productCard} style={{ "--index": index } as CSSProperties}><div><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 70vw, 28vw" /></div><small>{product.brand}</small><h3>{product.name}</h3><TrackedLink href="/shop/skincare" analyticsLabel={`shop_product_${index}`} analyticsSurface="shop_cinematic">اكتشفي المنتج</TrackedLink></article>)}</div>
        <div className={styles.sceneCounter}>03 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.routesScene}`} data-shop-scene aria-label="طرق الاختيار">
      <div className={styles.frame}>
        <div className={styles.routeCenter}><p>CHOOSE WITH INTENT</p><h2>لو القسم<br />مش كفاية.</h2><span>ابدئي من السؤال الأقرب لك.</span></div>
        <div className={styles.routeOrbit}>{routes.map((route, index) => <TrackedLink key={route.href} href={route.href} className={styles.routeCard} style={{ "--index": index } as CSSProperties} analyticsLabel={`shop_route_${index}`} analyticsSurface="shop_cinematic"><b>{route.number}</b><h3>{route.title}</h3><span>{route.body}</span></TrackedLink>)}</div>
        <div className={styles.sceneCounter}>04 — 05</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.finalScene}`} data-shop-scene aria-label="نهاية تجربة المتجر">
      <div className={styles.frame}>
        <div className={styles.finalGlow} aria-hidden="true" />
        <div className={styles.finalProducts} aria-hidden="true">{products.slice(0, 3).map((product, index) => <div key={product.image} style={{ "--index": index } as CSSProperties}><Image src={product.image} alt="" fill sizes="240px" /></div>)}</div>
        <div className={styles.finalCopy}><p>READY WHEN YOU ARE</p><h2>اختيارك يبدأ<br />من هنا.</h2><span>منتجات أصلية، مسارات أوضح، وتجربة مصممة لتقلل الحيرة.</span><div><TrackedLink href="/search" className={styles.primaryAction} analyticsLabel="shop_final_search" analyticsSurface="shop_cinematic">ابحثي الآن</TrackedLink><TrackedLink href="/trust" className={styles.secondaryAction} analyticsLabel="shop_final_trust" analyticsSurface="shop_cinematic">الثقة والسياسات</TrackedLink></div></div>
        <div className={styles.sceneCounter}>05 — 05</div>
      </div>
    </section>
  </div>;
}
