"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TrackedLink } from "@/components/tracked-link";
import styles from "./cinematic-discovery-hub.module.css";

type DiscoveryItem = {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  signals: string[];
};

type CinematicDiscoveryHubProps = {
  kind: "routine" | "concern" | "ingredient";
  eyebrow: string;
  title: string;
  intro: string;
  decisionTitle: string;
  decisionCopy: string;
  items: DiscoveryItem[];
  baseHref: string;
  nextHref: string;
  nextLabel: string;
};

const assetByKind = {
  routine: "/brand-assets/product-04.jpg",
  concern: "/brand-assets/product-02.jpg",
  ingredient: "/brand-assets/product-06.jpg",
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export function CinematicDiscoveryHub({
  kind,
  eyebrow,
  title,
  intro,
  decisionTitle,
  decisionCopy,
  items,
  baseHref,
  nextHref,
  nextLabel,
}: CinematicDiscoveryHubProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"));
    let frame = 0;

    const update = () => {
      scenes.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const distance = Math.max(bounds.height - window.innerHeight, 1);
        const progress = clamp(-bounds.top / distance);
        const active = bounds.top <= 0 && bounds.bottom >= window.innerHeight;
        const state = bounds.top > 0 ? "before" : bounds.bottom < window.innerHeight ? "after" : "active";
        scene.dataset.state = state;
        scene.style.setProperty("--scene-progress", String(progress));
        scene.querySelector<HTMLElement>("[data-frame]")?.classList.toggle(styles.fixed, active);
      });
      frame = 0;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.experience}>
      <section className={`${styles.scene} ${styles.opening}`} data-scene>
        <div className={styles.frame} data-frame>
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.openingCopy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.lead}>{intro}</p>
            <a className={styles.scrollCue} href="#discovery-decision">مرّري لاكتشاف المسار <span aria-hidden="true">↓</span></a>
          </div>
          <div className={styles.productPortrait} aria-hidden="true">
            <Image src={assetByKind[kind]} alt={`عنصر بصري يعبر عن قسم ${title}`} fill priority sizes="(max-width: 760px) 72vw, 34vw" />
          </div>
          <span className={styles.sceneNumber}>01</span>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.decision}`} data-scene id="discovery-decision">
        <div className={styles.frame} data-frame>
          <div className={styles.orbit} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.centerCopy}>
            <p className={styles.eyebrow}>ابدئي من السؤال الصحيح</p>
            <h2>{decisionTitle}</h2>
            <p className={styles.lead}>{decisionCopy}</p>
          </div>
          <div className={styles.signalCloud} aria-hidden="true">
            {items.slice(0, 3).map((item, index) => <span key={item.slug} style={{ "--signal-index": index } as React.CSSProperties}>{item.title}</span>)}
          </div>
          <span className={styles.sceneNumber}>02</span>
        </div>
      </section>

      <section
        className={`${styles.scene} ${styles.directory}`}
        data-scene
        style={{ "--item-count": items.length } as React.CSSProperties}
      >
        <div className={styles.frame} data-frame>
          <div className={styles.directoryIntro}>
            <p className={styles.eyebrow}>اختيارات واضحة</p>
            <h2>كل مسار يقرّبك من قرار واحد مفهوم.</h2>
          </div>
          <div className={styles.itemRail}>
            {items.map((item, index) => (
              <TrackedLink
                key={item.slug}
                href={`${baseHref}/${item.slug}`}
                className={styles.discoveryItem}
                analyticsLabel={`${kind}_hub_item_${item.slug}`}
                analyticsSurface={`${kind}_cinematic_directory`}
                analyticsDestinationType={kind}
              >
                <span className={styles.itemIndex}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.itemText}><small>{item.subtitle}</small><strong>{item.title}</strong><em>{item.summary}</em></span>
                <span className={styles.itemSignals}>{item.signals.slice(0, 3).map((signal) => <i key={signal}>{signal}</i>)}</span>
                <span className={styles.itemArrow} aria-hidden="true">↗</span>
              </TrackedLink>
            ))}
          </div>
          <span className={styles.sceneNumber}>03</span>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.closing}`} data-scene>
        <div className={styles.frame} data-frame>
          <div className={styles.closingArt} aria-hidden="true">
            <Image src="/brand-assets/product-01.jpg" alt="صورة تجريبية غير معتمدة لواجهة اكتشاف المنتجات" fill sizes="(max-width: 760px) 80vw, 38vw" />
          </div>
          <div className={styles.closingCopy}>
            <p className={styles.eyebrow}>الخطوة التالية</p>
            <h2>المعرفة الجيدة تنتهي باختيار أسهل.</h2>
            <p className={styles.lead}>انتقلي إلى المسار المكمل، أو افتحي أحد الاختيارات السابقة للحصول على التفاصيل والمنتجات المرتبطة.</p>
            <TrackedLink href={nextHref} className={styles.primaryAction} analyticsLabel={`${kind}_hub_next`} analyticsSurface={`${kind}_cinematic_closing`} analyticsDestinationType="discovery_hub">{nextLabel}</TrackedLink>
          </div>
          <span className={styles.sceneNumber}>04</span>
        </div>
      </section>
    </div>
  );
}
