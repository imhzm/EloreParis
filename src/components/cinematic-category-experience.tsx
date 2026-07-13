"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { TrackedLink } from "@/components/tracked-link";
import type { CollectionFilterState } from "@/lib/collection-filters";
import styles from "./cinematic-category-experience.module.css";

type Props = {
  variant: "skincare" | "makeup";
  title: string;
  subtitle: string;
  description: string;
  filterState: CollectionFilterState;
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const assets = ["/brand-assets/product-01.jpg", "/brand-assets/product-02.jpg", "/brand-assets/product-03.jpg", "/brand-assets/product-04.jpg", "/brand-assets/product-05.jpg", "/brand-assets/product-06.jpg"];

export function CinematicCategoryExperience({ variant, title, subtitle, description, filterState }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isSkincare = variant === "skincare";

  useEffect(() => {
    const root = rootRef.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-category-scene]"));
    let frameId = 0;
    const update = () => {
      scenes.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const progress = clamp(-bounds.top / Math.max(bounds.height - innerHeight, 1));
        scene.dataset.sceneState = bounds.top > 0 ? "before" : bounds.bottom <= innerHeight ? "after" : "active";
        scene.style.setProperty("--progress", `${progress}`);
        scene.style.setProperty("--enter", `${clamp(progress / 0.2)}`);
        scene.style.setProperty("--exit", `${clamp((progress - 0.78) / 0.22)}`);
      });
      frameId = 0;
    };
    const schedule = () => { if (!frameId) frameId = requestAnimationFrame(update); };
    update(); addEventListener("scroll", schedule, { passive: true }); addEventListener("resize", schedule);
    return () => { removeEventListener("scroll", schedule); removeEventListener("resize", schedule); if (frameId) cancelAnimationFrame(frameId); };
  }, []);

  return <div ref={rootRef} className={`${styles.category} ${styles[variant]}`}>
    <section className={`${styles.scene} ${styles.heroScene}`} data-category-scene aria-label={`افتتاحية ${title}`}>
      <div className={styles.frame}>
        <div className={styles.heroRings} aria-hidden="true"><i /><i /></div>
        <div className={styles.heroProducts} aria-hidden="true">{assets.slice(isSkincare ? 0 : 4, isSkincare ? 3 : 6).map((asset, index) => <div key={asset} style={{ "--index": index } as CSSProperties}><Image src={asset} alt="" fill sizes="260px" /></div>)}</div>
        <div className={styles.heroCopy}><p>{subtitle}</p><h1>{title}</h1><span>{description}</span><TrackedLink href="#filters" className={styles.primaryAction} analyticsLabel={`${variant}_start_filters`} analyticsSurface="category_cinematic">ابدئي الاختيار</TrackedLink></div>
        <div className={styles.counter}>01 — 04</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.filterScene}`} data-category-scene id="filters" aria-label={`فلاتر ${title}`}>
      <div className={styles.frame}>
        <div className={styles.filterIntro}><p>FILTER WITH INTENT</p><h2>ضيّقي الاختيار.<br />مش الاحتمالات.</h2><span>{filterState.filteredProducts.length} من {filterState.totalProducts} منتجات ظاهرة الآن</span>{filterState.isFiltered ? <TrackedLink href={filterState.clearHref} analyticsLabel={`${variant}_clear_all`} analyticsSurface="category_filters">إزالة كل الفلاتر</TrackedLink> : null}</div>
        <div className={styles.filterOrbit}>{filterState.groups.map((group, groupIndex) => <article key={group.key} className={styles.filterGroup} style={{ "--index": groupIndex } as CSSProperties}><p>{group.label}</p><div>{group.options.map((option) => <TrackedLink key={option.value} href={option.href} className={option.isActive ? styles.activeFilter : undefined} aria-current={option.isActive ? "true" : undefined} analyticsEvent="filter_apply" analyticsLabel={`${variant}_filter_${group.key}`} analyticsSurface="category_filters" analyticsProperties={{ filter_key: group.key, filter_value: option.value, result_count: option.count }}>{option.label}<small>{option.count}</small></TrackedLink>)}</div></article>)}</div>
        <div className={styles.counter}>02 — 04</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.resultsScene}`} data-category-scene aria-label={`نتائج ${title}`}>
      <div className={styles.frame}>
        <div className={styles.resultsHeading}><p>YOUR CURRENT EDIT</p><h2>{filterState.filteredProducts.length ? "نتائج أقرب لقرارك." : "لا توجد نتيجة مطابقة."}</h2><span>{filterState.isFiltered ? "النتائج تتغير مباشرة حسب الفلاتر المختارة." : "مجموعة البداية قبل تطبيق أي فلتر."}</span></div>
        {filterState.filteredProducts.length ? <div className={styles.productDeck} style={{ "--deck-center": (filterState.filteredProducts.length - 1) / 2 } as CSSProperties}>{filterState.filteredProducts.map((product, index) => <article key={product.slug} className={styles.productCard} style={{ "--index": index } as CSSProperties}><div><Image src={assets[(index + (isSkincare ? 0 : 4)) % assets.length]} alt={product.name} fill sizes="(max-width: 700px) 70vw, 28vw" /></div><small>{product.brand}</small><h3>{product.name}</h3><p>{product.finish}</p><strong>من {product.priceFrom} ر.س</strong><TrackedLink href={`/products/${product.slug}`} analyticsLabel={`${variant}_product_${product.slug}`} analyticsSurface="category_results" analyticsDestinationType="product">عرض المنتج</TrackedLink></article>)}</div> : <div className={styles.emptyState}><b>ZERO MATCH</b><p>خففي شرطًا واحدًا أو ابدئي من البحث المباشر.</p><TrackedLink href={filterState.clearHref} analyticsLabel={`${variant}_zero_clear`} analyticsSurface="category_results">عرض كل النتائج</TrackedLink></div>}
        <div className={styles.counter}>03 — 04</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.finalScene}`} data-category-scene aria-label={`المسار التالي من ${title}`}>
      <div className={styles.frame}>
        <div className={styles.finalVisual} aria-hidden="true"><Image src={isSkincare ? assets[0] : assets[4]} alt="" fill sizes="45vw" /></div>
        <div className={styles.finalCopy}><p>ONE STEP CLOSER</p><h2>لسه محتاجة<br />طريق أوضح؟</h2><span>انتقلي للمشكلة أو الروتين، أو ابحثي عن الاسم مباشرة.</span><div><TrackedLink href="/concerns" className={styles.primaryAction} analyticsLabel={`${variant}_final_concerns`} analyticsSurface="category_cinematic">حسب المشكلة</TrackedLink><TrackedLink href="/routines" className={styles.secondaryAction} analyticsLabel={`${variant}_final_routines`} analyticsSurface="category_cinematic">الروتينات</TrackedLink><TrackedLink href="/search" className={styles.secondaryAction} analyticsLabel={`${variant}_final_search`} analyticsSurface="category_cinematic">البحث</TrackedLink></div></div>
        <div className={styles.counter}>04 — 04</div>
      </div>
    </section>
  </div>;
}
