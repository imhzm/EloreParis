"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { TrackedLink } from "@/components/tracked-link";
import type { ShopCollectionPage } from "@/lib/site-content";
import styles from "./cinematic-editorial-collection.module.css";

type Props = { collection: ShopCollectionPage };
const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const visualMap = {
  haircare: ["/brand-assets/product-02.jpg", "/brand-assets/product-03.jpg", "/brand-assets/product-04.jpg"],
  bodycare: ["/brand-assets/product-04.jpg", "/brand-assets/product-05.jpg", "/brand-assets/product-01.jpg"],
  tools: ["/brand-assets/product-06.jpg", "/brand-assets/product-05.jpg", "/brand-assets/product-03.jpg"],
  "beauty-sets": ["/brand-assets/product-01.jpg", "/brand-assets/product-04.jpg", "/brand-assets/product-06.jpg"],
} as const;

export function CinematicEditorialCollection({ collection }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const visuals = visualMap[collection.slug as keyof typeof visualMap] ?? visualMap.haircare;
  const primaryLink = collection.discoveryLinks[0];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-editorial-scene]"));
    let frameId = 0;
    const update = () => {
      scenes.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const progress = clamp(-bounds.top / Math.max(bounds.height - innerHeight, 1));
        scene.dataset.sceneState = bounds.top > 0 ? "before" : bounds.bottom <= innerHeight ? "after" : "active";
        scene.style.setProperty("--progress", `${progress}`);
        scene.style.setProperty("--enter", `${clamp(progress / 0.2)}`);
        scene.style.setProperty("--exit", `${clamp((progress - 0.78) / 0.22)}`);
      }); frameId = 0;
    };
    const schedule = () => { if (!frameId) frameId = requestAnimationFrame(update); };
    update(); addEventListener("scroll", schedule, { passive: true }); addEventListener("resize", schedule);
    return () => { removeEventListener("scroll", schedule); removeEventListener("resize", schedule); if (frameId) cancelAnimationFrame(frameId); };
  }, []);

  return <div ref={rootRef} className={`${styles.collection} ${styles[collection.slug]}`}>
    <section className={`${styles.scene} ${styles.heroScene}`} data-editorial-scene aria-label={`افتتاحية ${collection.title}`}>
      <div className={styles.frame}>
        <div className={styles.heroHalo} aria-hidden="true"><i /><i /></div>
        <div className={styles.visualCluster} aria-hidden="true">{visuals.map((visual, index) => <div key={visual} style={{ "--index": index } as CSSProperties}><Image src={visual} alt="" fill sizes="250px" /></div>)}</div>
        <div className={styles.heroCopy}><p>{collection.subtitle}</p><h1>{collection.title}</h1><span>{collection.description}</span><div><TrackedLink href="#decision-lanes" className={styles.primaryAction} analyticsLabel={`${collection.slug}_start`} analyticsSurface="editorial_cinematic">اكتشفي الفئة</TrackedLink><TrackedLink href="/shop" className={styles.secondaryAction} analyticsLabel={`${collection.slug}_shop`} analyticsSurface="editorial_cinematic">كل الأقسام</TrackedLink></div></div>
        <div className={styles.counter}>01 — 04</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.decisionScene}`} data-editorial-scene id="decision-lanes" aria-label={`زوايا اختيار ${collection.title}`}>
      <div className={styles.frame}>
        <div className={styles.sceneCopy}><p>DECISION LANES</p><h2>ثلاث زوايا.<br />سؤال أوضح.</h2><span>{collection.introduction}</span></div>
        <div className={styles.decisionOrbit}>{collection.focusCards.map((card, index) => <article key={card.title} style={{ "--index": index } as CSSProperties}><b>0{index + 1}</b><small>{card.label}</small><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>
        <div className={styles.counter}>02 — 04</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.pathsScene}`} data-editorial-scene aria-label={`مسارات ${collection.title}`}>
      <div className={styles.frame}>
        <div className={styles.pathsHeading}><p>LIVE PATHS</p><h2>لا تتصفحي أكثر.<br />انتقلي أذكى.</h2><span>كل مسار هنا يقربك من قرار محدد.</span></div>
        <div className={styles.pathTrack}>{collection.discoveryLinks.map((link, index) => <TrackedLink key={link.href} href={link.href} className={styles.pathCard} style={{ "--index": index } as CSSProperties} analyticsLabel={`${collection.slug}_path_${index}`} analyticsSurface="editorial_cinematic" analyticsDestinationType={link.destinationType}><span>0{index + 1}</span><small>{link.label}</small><h3>{link.title}</h3><p>{link.description}</p><b>متابعة المسار ←</b></TrackedLink>)}</div>
        <div className={styles.counter}>03 — 04</div>
      </div>
    </section>

    <section className={`${styles.scene} ${styles.faqScene}`} data-editorial-scene aria-label={`أسئلة ${collection.title}`}>
      <div className={styles.frame}>
        <div className={styles.faqWord} aria-hidden="true">CLARITY</div>
        <div className={styles.faqCopy}><p>BEFORE YOU CONTINUE</p><h2>إجابة أخيرة<br />قبل القرار.</h2>{primaryLink ? <TrackedLink href={primaryLink.href} className={styles.primaryAction} analyticsLabel={`${collection.slug}_final_primary`} analyticsSurface="editorial_cinematic">{primaryLink.title}</TrackedLink> : null}</div>
        <div className={styles.faqStack}>{collection.faqs.slice(0, 3).map((faq, index) => <article key={faq.question} style={{ "--index": index } as CSSProperties}><span>0{index + 1}</span><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}</div>
        <div className={styles.counter}>04 — 04</div>
      </div>
    </section>
  </div>;
}
