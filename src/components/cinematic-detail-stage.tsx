"use client";

import { useEffect, useRef } from "react";
import { TrackedLink } from "@/components/tracked-link";
import styles from "./cinematic-detail-stage.module.css";

type CinematicDetailStageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  collectionHref: string;
  collectionLabel: string;
  purchaseHref: string;
  analyticsKey: string;
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export function CinematicDetailStage({
  eyebrow,
  title,
  summary,
  collectionHref,
  collectionLabel,
  purchaseHref,
  analyticsKey,
}: CinematicDetailStageProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const frame = frameRef.current;
    if (!scene || !frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let requestId = 0;
    const update = () => {
      const bounds = scene.getBoundingClientRect();
      const progress = clamp(-bounds.top / Math.max(bounds.height - window.innerHeight, 1));
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      frame.classList.toggle(styles.pinned, bounds.top <= 0 && bounds.bottom > window.innerHeight);
      frame.classList.toggle(styles.complete, bounds.bottom <= window.innerHeight);
      scene.style.setProperty("--progress", `${progress}`);
      scene.style.setProperty("--object-scale", `${0.76 + eased * 0.5}`);
      scene.style.setProperty("--object-rotate", `${-12 + eased * 28}deg`);
      scene.style.setProperty("--intro", `${1 - clamp((progress - 0.22) / 0.16)}`);
      scene.style.setProperty("--detail", `${clamp((progress - 0.42) / 0.18) * (1 - clamp((progress - 0.7) / 0.16))}`);
      scene.style.setProperty("--outro", `${clamp((progress - 0.76) / 0.16)}`);
      requestId = 0;
    };
    const schedule = () => { if (!requestId) requestId = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (requestId) cancelAnimationFrame(requestId);
    };
  }, []);

  return (
    <section ref={sceneRef} className={styles.scene} aria-label={`${title} story`}>
      <div ref={frameRef} className={styles.frame}>
        <div className={styles.aura} aria-hidden="true" />
        <div className={styles.object} aria-hidden="true"><i /><i /><b>{eyebrow}</b></div>
        <div className={`${styles.copy} ${styles.intro}`}>
          <p>{eyebrow}</p><h1>{title}</h1><span>{summary}</span>
          <TrackedLink href={purchaseHref} className={styles.primaryAction} analyticsLabel={`cinematic_product_buy_${analyticsKey}`} analyticsSurface="product_cinematic" analyticsDestinationType="purchase">شاهدي الخيارات</TrackedLink>
        </div>
        <div className={`${styles.copy} ${styles.detail}`}>
          <p>قرار يحتاج مساحة</p><h2>اختيار واحد، لكن بوضوح كافٍ ليشعرك بالثقة.</h2>
        </div>
        <div className={`${styles.copy} ${styles.outro}`}>
          <p>استكشفي الفئة</p><h2>اكملي حسب ما يناسب روتينك.</h2>
          <TrackedLink href={collectionHref} className={styles.secondaryAction} analyticsLabel={`cinematic_product_collection_${analyticsKey}`} analyticsSurface="product_cinematic" analyticsDestinationType="collection">{collectionLabel}</TrackedLink>
        </div>
      </div>
    </section>
  );
}
