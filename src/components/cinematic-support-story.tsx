"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TrackedLink } from "@/components/tracked-link";
import styles from "./cinematic-support-story.module.css";

type Section = { eyebrow?: string; title: string; body: string; href?: string; linkLabel?: string; type?: string };
type Faq = { question: string; answer: string };
type CinematicSupportStoryProps = {
  kind: "about" | "contact" | "faq" | "terms";
  eyebrow: string;
  title: string;
  intro: string;
  statement: string;
  principles: string[];
  sectionTitle: string;
  sections: Section[];
  faqs: Faq[];
  nextHref: string;
  nextLabel: string;
};

const imageByKind = {
  about: "/brand-assets/product-03.jpg",
  contact: "/brand-assets/product-05.jpg",
  faq: "/brand-assets/product-02.jpg",
  terms: "/brand-assets/product-01.jpg",
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export function CinematicSupportStory(props: CinematicSupportStoryProps) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-support-scene]"));
    let requestId = 0;
    const update = () => {
      scenes.forEach((scene) => {
        const rect = scene.getBoundingClientRect();
        const progress = clamp(-rect.top / Math.max(rect.height - innerHeight, 1));
        const active = rect.top <= 0 && rect.bottom >= innerHeight;
        scene.dataset.state = rect.top > 0 ? "before" : rect.bottom < innerHeight ? "after" : "active";
        scene.style.setProperty("--progress", String(progress));
        scene.querySelector<HTMLElement>("[data-support-frame]")?.classList.toggle(styles.fixed, active);
      });
      requestId = 0;
    };
    const schedule = () => {
      if (!requestId) requestId = requestAnimationFrame(update);
    };

    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      if (requestId) cancelAnimationFrame(requestId);
    };
  }, []);

  return (
    <main ref={rootRef} className={styles.story}>
      <section className={`${styles.scene} ${styles.hero}`} data-support-scene>
        <div className={styles.frame} data-support-frame>
          <div className={styles.heroArt} aria-hidden="true">
            <Image src={imageByKind[props.kind]} alt="" fill priority sizes="(max-width: 760px) 76vw, 36vw" />
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{props.eyebrow}</p>
            <h1>{props.title}</h1>
            <span>{props.intro}</span>
            <a href="#support-principles">تابعي القصة <b aria-hidden="true">↓</b></a>
          </div>
          <i className={styles.number}>01 / 04</i>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.principles}`} data-support-scene id="support-principles">
        <div className={styles.frame} data-support-frame>
          <div className={styles.statement}>
            <p className={styles.eyebrow}>المبدأ الأساسي</p>
            <h2>{props.statement}</h2>
          </div>
          <div className={styles.orbit} aria-hidden="true"><i /><i /></div>
          <div className={styles.principleList}>
            {props.principles.slice(0, 4).map((item, index) => (
              <article key={item}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <p>{item}</p>
              </article>
            ))}
          </div>
          <i className={styles.number}>02 / 04</i>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.directory}`} data-support-scene>
        <div className={styles.frame} data-support-frame>
          <header>
            <p className={styles.eyebrow}>تفاصيل واضحة</p>
            <h2>{props.sectionTitle}</h2>
          </header>
          <div className={styles.sectionRail}>
            {props.sections.map((section, index) => (
              <article key={`${section.title}-${index}`}>
                <small>{section.eyebrow ?? String(index + 1).padStart(2, "0")}</small>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
                {section.href && section.linkLabel ? (
                  <TrackedLink
                    href={section.href}
                    analyticsLabel={`${props.kind}_section_${index + 1}`}
                    analyticsSurface="support_story_directory"
                    analyticsDestinationType={section.type}
                  >
                    {section.linkLabel}
                    <span aria-hidden="true">↗</span>
                  </TrackedLink>
                ) : null}
              </article>
            ))}
          </div>
          <i className={styles.number}>03 / 04</i>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.final}`} data-support-scene>
        <div className={styles.frame} data-support-frame>
          <div className={styles.finalCopy}>
            <p className={styles.eyebrow}>قبل أن تكملي</p>
            <h2>الوضوح جزء من الخدمة.</h2>
            <TrackedLink
              href={props.nextHref}
              className={styles.primary}
              analyticsLabel={`${props.kind}_final_next`}
              analyticsSurface="support_story_final"
              analyticsDestinationType="support_route"
            >
              {props.nextLabel}
            </TrackedLink>
          </div>
          <div className={styles.faqs}>
            {props.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
          <i className={styles.number}>04 / 04</i>
        </div>
      </section>
    </main>
  );
}
