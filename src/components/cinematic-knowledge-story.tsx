"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TrackedLink } from "@/components/tracked-link";
import styles from "./cinematic-knowledge-story.module.css";

type StoryItem = { label: string; title: string; copy: string; href?: string };
type StoryLink = { label: string; meta: string; href: string; type: string };
type StoryFaq = { question: string; answer: string };

type CinematicKnowledgeStoryProps = {
  kind: "routine" | "concern" | "ingredient";
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  answer: string;
  signals: string[];
  chapterEyebrow: string;
  chapterTitle: string;
  items: StoryItem[];
  watchTitle: string;
  watchItems: string[];
  related: StoryLink[];
  faqs: StoryFaq[];
  backHref: string;
  backLabel: string;
  primaryHref: string;
  primaryLabel: string;
};

const imagery = {
  routine: ["/brand-assets/product-04.jpg", "/brand-assets/product-01.jpg"],
  concern: ["/brand-assets/product-02.jpg", "/brand-assets/product-05.jpg"],
  ingredient: ["/brand-assets/product-06.jpg", "/brand-assets/product-03.jpg"],
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export function CinematicKnowledgeStory(props: CinematicKnowledgeStoryProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-story-scene]"));
    let requestId = 0;
    const update = () => {
      for (const scene of scenes) {
        const bounds = scene.getBoundingClientRect();
        const progress = clamp(-bounds.top / Math.max(bounds.height - innerHeight, 1));
        const active = bounds.top <= 0 && bounds.bottom >= innerHeight;
        scene.dataset.state = bounds.top > 0 ? "before" : bounds.bottom < innerHeight ? "after" : "active";
        scene.style.setProperty("--progress", String(progress));
        scene.querySelector<HTMLElement>("[data-story-frame]")?.classList.toggle(styles.fixed, active);
      }
      requestId = 0;
    };
    const schedule = () => { if (!requestId) requestId = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      if (requestId) cancelAnimationFrame(requestId);
    };
  }, []);

  const [heroImage, secondaryImage] = imagery[props.kind];
  return (
    <div ref={rootRef} className={styles.story}>
      <section className={`${styles.scene} ${styles.hero}`} data-story-scene>
        <div className={styles.frame} data-story-frame>
          <div className={styles.heroImage} aria-hidden="true"><Image src={heroImage} alt="" fill priority sizes="(max-width: 760px) 78vw, 38vw" /></div>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{props.eyebrow}</p><h1>{props.title}</h1><p>{props.summary}</p>
            <div className={styles.actions}>
              <TrackedLink href={props.primaryHref} className={styles.primary} analyticsLabel={`${props.kind}_${props.slug}_primary`} analyticsSurface="knowledge_story_hero" analyticsDestinationType="primary_next">{props.primaryLabel}</TrackedLink>
              <TrackedLink href={props.backHref} className={styles.secondary} analyticsLabel={`${props.kind}_${props.slug}_back`} analyticsSurface="knowledge_story_hero" analyticsDestinationType={`${props.kind}_index`}>{props.backLabel}</TrackedLink>
            </div>
          </div>
          <span className={styles.counter}>01 / 05</span>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.answer}`} data-story-scene>
        <div className={styles.frame} data-story-frame>
          <div className={styles.answerRing} aria-hidden="true"><i /><i /></div>
          <div className={styles.answerCopy}><p className={styles.eyebrow}>الخلاصة أولًا</p><h2>{props.answer}</h2><div className={styles.signals}>{props.signals.slice(0, 4).map((signal) => <span key={signal}>{signal}</span>)}</div></div>
          <span className={styles.counter}>02 / 05</span>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.chapters}`} data-story-scene>
        <div className={styles.frame} data-story-frame>
          <header><p className={styles.eyebrow}>{props.chapterEyebrow}</p><h2>{props.chapterTitle}</h2></header>
          <div className={styles.chapterRail}>
            {props.items.map((item, index) => {
              const body = <><small>{item.label || String(index + 1).padStart(2, "0")}</small><strong>{item.title}</strong><span>{item.copy}</span><b aria-hidden="true">{item.href ? "↗" : "—"}</b></>;
              return item.href ? <TrackedLink key={`${item.label}-${item.title}`} href={item.href} className={styles.chapter} analyticsLabel={`${props.kind}_${props.slug}_chapter_${index + 1}`} analyticsSurface="knowledge_story_chapters" analyticsDestinationType="connected_content">{body}</TrackedLink> : <article key={`${item.label}-${item.title}`} className={styles.chapter}>{body}</article>;
            })}
          </div>
          <span className={styles.counter}>03 / 05</span>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.context}`} data-story-scene>
        <div className={styles.frame} data-story-frame>
          <div className={styles.contextImage} aria-hidden="true"><Image src={secondaryImage} alt="" fill sizes="(max-width: 760px) 74vw, 34vw" /></div>
          <div className={styles.contextCopy}><p className={styles.eyebrow}>استخدميه بوعي</p><h2>{props.watchTitle}</h2><ol>{props.watchItems.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol></div>
          <span className={styles.counter}>04 / 05</span>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.final}`} data-story-scene>
        <div className={styles.frame} data-story-frame>
          <div className={styles.finalCopy}><p className={styles.eyebrow}>أكملي المسار</p><h2>كل معلومة هنا لها خطوة تالية.</h2><div className={styles.related}>{props.related.slice(0, 6).map((link) => <TrackedLink key={`${link.href}-${link.label}`} href={link.href} analyticsLabel={`${props.kind}_${props.slug}_related_${link.label}`} analyticsSurface="knowledge_story_related" analyticsDestinationType={link.type}><small>{link.meta}</small><strong>{link.label}</strong><span aria-hidden="true">↗</span></TrackedLink>)}</div></div>
          <div className={styles.faq}><p className={styles.eyebrow}>أسئلة شائعة</p>{props.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
          <span className={styles.counter}>05 / 05</span>
        </div>
      </section>
    </div>
  );
}
