"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { TrackedLink } from "@/components/tracked-link";
import styles from "./omnira-inspired-home.module.css";

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

const productPicks = [
  { image: "/brand-assets/product-01.jpg", name: "Bioderma Pigmentbio Night Renewer", note: "عناية ليلية موجهة للتصبغات" },
  { image: "/brand-assets/product-02.jpg", name: "Eucerin Calming Urea Shampoo", note: "تنظيف لطيف لفروة الرأس" },
  { image: "/brand-assets/product-03.jpg", name: "Eucerin pH5 Mild Shampoo", note: "توازن يومي للشعر والفروة" },
  { image: "/brand-assets/product-04.jpg", name: "Bioderma Cicabio Arnica+", note: "عناية مهدئة ومركزة" },
] as const;

const departments = [
  { label: "العناية بالبشرة", caption: "Skin ritual", href: "/shop/skincare", image: "/brand-assets/product-01.jpg" },
  { label: "المكياج", caption: "Colour edit", href: "/shop/makeup", image: "/brand-assets/product-05.jpg" },
  { label: "العناية بالشعر", caption: "Hair reset", href: "/shop/haircare", image: "/brand-assets/product-02.jpg" },
  { label: "العطور", caption: "Scent wardrobe", href: "/shop/fragrances", image: "/brand-assets/product-06.jpg" },
] as const;

const trustPoints = [
  ["01", "منتجات أصلية", "مختارة من علامات موثوقة"],
  ["02", "توصيل داخل السعودية", "مسار طلب واضح وسهل"],
  ["03", "دفع آمن", "خيارات دفع موثوقة"],
  ["04", "اختيار بوعي", "معلومات تساعدك قبل الشراء"],
] as const;

export function OmniraInspiredHome() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-cinematic-scene]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let requestId = 0;
    const update = () => {
      scenes.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const travel = Math.max(bounds.height - window.innerHeight, 1);
        const progress = clamp(-bounds.top / travel);
        const state = bounds.top > 0 ? "before" : bounds.bottom <= window.innerHeight ? "after" : "active";
        scene.dataset.sceneState = state;
        scene.style.setProperty("--scene-progress", `${progress}`);
        scene.style.setProperty("--scene-enter", `${clamp(progress / 0.22)}`);
        scene.style.setProperty("--scene-exit", `${clamp((progress - 0.76) / 0.24)}`);
      });
      requestId = 0;
    };
    const schedule = () => {
      if (!requestId) requestId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (requestId) window.cancelAnimationFrame(requestId);
    };
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      <section className={`${styles.scene} ${styles.openingScene}`} data-cinematic-scene aria-label="افتتاحية كوزماتكس">
        <div className={styles.frame}>
          <div className={styles.atmosphere} aria-hidden="true" />
          <div className={styles.openingVisual} aria-hidden="true">
            <div className={styles.orbit} />
            <div className={styles.heroProduct}><Image src="/brand-assets/product-01.jpg" alt="" fill sizes="(max-width: 800px) 74vw, 35vw" priority /></div>
            <div className={`${styles.floatingProduct} ${styles.floatingOne}`}><Image src="/brand-assets/product-04.jpg" alt="" fill sizes="140px" /></div>
            <div className={`${styles.floatingProduct} ${styles.floatingTwo}`}><Image src="/brand-assets/product-03.jpg" alt="" fill sizes="120px" /></div>
          </div>
          <div className={styles.openingCopy}>
            <p>COZMATEKS · BEAUTY & CARE</p>
            <h1>اختيار أوضح.<br />عناية أقرب لك.</h1>
            <span>منتجات أصلية من علامات موثوقة، مرتبة لتصلي لما تحتاجينه بدون حيرة.</span>
            <TrackedLink href="/shop" className={styles.primaryAction} analyticsLabel="home_opening_shop" analyticsSurface="home_cinematic">تسوّقي الآن</TrackedLink>
          </div>
          <div className={styles.scrollCue} aria-hidden="true"><i /> مرّري لبدء الرحلة</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.departmentScene}`} data-cinematic-scene id="departments" aria-label="أقسام المتجر">
        <div className={styles.frame}>
          <div className={styles.sceneNumber}>02 / 06</div>
          <div className={styles.sceneCopy}>
            <p>CHOOSE YOUR WORLD</p>
            <h2>كل احتياج<br />له باب.</h2>
            <span>ابدئي من القسم، واتركي التجربة تقرّب لك الاختيار.</span>
            <TrackedLink href="/shop" className={styles.textAction} analyticsLabel="home_departments_all" analyticsSurface="home_cinematic">المتجر كاملًا ←</TrackedLink>
          </div>
          <div className={styles.departmentRail}>
            {departments.map((department, index) => (
              <TrackedLink key={department.href} href={department.href} className={styles.departmentPortal} analyticsLabel={`home_department_${index}`} analyticsSurface="home_cinematic" analyticsDestinationType="collection">
                <Image src={department.image} alt="" fill sizes="(max-width: 700px) 50vw, 20vw" />
                <span>0{index + 1}</span><small>{department.caption}</small><h3>{department.label}</h3>
              </TrackedLink>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.productScene}`} data-cinematic-scene aria-label="مختارات المنتجات">
        <div className={styles.frame}>
          <div className={styles.sceneNumber}>03 / 06</div>
          <div className={styles.productHeadline}><p>CURATED, NOT CROWDED</p><h2>أربع اختيارات.<br />تركيز واحد.</h2></div>
          <div className={styles.productDeck}>
            {productPicks.map((product, index) => (
              <article className={styles.productSlide} key={product.name} style={{ "--card-index": index } as React.CSSProperties}>
                <div className={styles.productImage}><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 64vw, 25vw" /></div>
                <div><span>0{index + 1}</span><small>{product.note}</small><h3>{product.name}</h3><TrackedLink href="/shop" analyticsLabel={`home_product_${index}`} analyticsSurface="home_cinematic">عرض المنتج</TrackedLink></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.ritualScene}`} data-cinematic-scene aria-label="اختيار الروتين">
        <div className={styles.frame}>
          <div className={styles.ritualBackdrop}><Image src="/brand-assets/hero-live.webp" alt="مجموعة من منتجات العناية المتاحة في كوزماتكس" fill sizes="100vw" /></div>
          <div className={styles.ritualShade} aria-hidden="true" />
          <div className={styles.ritualCopy}>
            <p>THE SMARTER ROUTE</p>
            <h2>لا تبحثي عن منتج فقط.<br />ابني قرارًا أفضل.</h2>
            <span>ابدئي بالمشكلة أو المكوّن أو ترتيب الخطوات، لا بازدحام الرف.</span>
            <div><TrackedLink href="/concerns" analyticsLabel="home_concerns" analyticsSurface="home_cinematic">حسب المشكلة</TrackedLink><TrackedLink href="/routines" analyticsLabel="home_routines" analyticsSurface="home_cinematic">الروتينات</TrackedLink></div>
          </div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.trustScene}`} data-cinematic-scene aria-label="الثقة والخدمة">
        <div className={styles.frame}>
          <div className={styles.trustHalo} aria-hidden="true"><span>COZMATEKS</span></div>
          <div className={styles.trustIntro}><p>BEAUTY WITH CONFIDENCE</p><h2>من الاكتشاف<br />إلى بابك، بثقة.</h2></div>
          <div className={styles.trustOrbit}>
            {trustPoints.map(([number, title, body], index) => <article key={number} style={{ "--trust-index": index } as React.CSSProperties}><b>{number}</b><strong>{title}</strong><span>{body}</span></article>)}
          </div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.journalScene}`} data-cinematic-scene aria-label="مجلة كوزماتكس">
        <div className={styles.frame}>
          <div className={styles.journalWord} aria-hidden="true">JOURNAL</div>
          <div className={styles.journalCopy}>
            <p>COZMATEKS JOURNAL</p>
            <h2>المعلومة جزء<br />من العناية.</h2>
            <span>أدلة واضحة تساعدك تفهمي اختياراتك قبل إضافتها إلى روتينك.</span>
            <TrackedLink href="/journal" className={styles.primaryAction} analyticsLabel="home_journal" analyticsSurface="home_cinematic">اقرئي المجلة</TrackedLink>
          </div>
          <div className={styles.newsletterPanel}><NewsletterSignup /></div>
        </div>
      </section>
    </div>
  );
}
