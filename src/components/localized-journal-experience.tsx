"use client";

import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
import { useScrollSceneProgress } from "@/hooks/use-scroll-scene-progress";
import { localizePath, type Locale } from "@/lib/i18n";
import { journalCopy, type JournalRecord } from "@/lib/journal-content";
import styles from "./localized-journal-experience.module.css";
import { MultilineTitle, keepFocusVisible } from "@/components/scene-primitives";

export function LocalizedJournalHub({ locale, records }: { locale: Locale; records: JournalRecord[] }) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-journal-scene]" });
  const copy = journalCopy[locale].hub;
  const featured = records[0];

  return <div ref={rootRef} className={styles.experience} data-journal-experience>
    <section className={`${styles.scene} ${styles.hero}`} data-journal-scene aria-labelledby="journal-title"><div className={styles.frame} data-journal-frame>
      <div className={styles.heroMedia} data-journal-motion aria-hidden="true"><Image src="/elore-assets/editorial-skin-light-concept-1122w.avif" alt="" fill priority sizes="(max-width: 900px) 100vw, 46vw" /></div>
      <div className={styles.heroCopy}><p>{copy.eyebrow}</p><h1 id="journal-title"><MultilineTitle value={copy.title} /></h1><span>{copy.intro}</span><TrackedLink className={styles.action} href="#journal-featured" onFocus={keepFocusVisible} analyticsLabel="journal_begin" analyticsSurface="journal_block_motion">{copy.open}</TrackedLink><small>{copy.notice}</small></div>
      <b className={styles.counter} aria-hidden="true">01 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.lanes}`} data-journal-scene aria-label={copy.methodTitle}><div className={styles.frame} data-journal-frame>
      <div className={styles.heading}><p lang="en">EDITORIAL LENSES</p><h2><MultilineTitle value={copy.methodTitle} /></h2><span>{copy.methodBody}</span></div>
      <nav className={styles.laneGrid} data-journal-lanes>
        {[{ number: "01", ar: "المشكلة", en: "Concern", href: "/concerns" }, { number: "02", ar: "الروتين", en: "Ritual", href: "/routines" }, { number: "03", ar: "المكوّن", en: "Ingredient", href: "/ingredients" }].map((lane) => <TrackedLink key={lane.href} href={localizePath(locale, lane.href)} onFocus={keepFocusVisible} analyticsLabel={`journal_lane_${lane.number}`} analyticsSurface="journal_block_motion"><b>{lane.number}</b><h3>{locale === "ar" ? lane.ar : lane.en}</h3><span>{locale === "ar" ? "ابدئي من السؤال، ثم ضيّقي القرار." : "Begin with the question, then narrow the decision."}</span></TrackedLink>)}
      </nav><b className={styles.counter} aria-hidden="true">02 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.featured}`} data-journal-scene id="journal-featured" aria-label={featured.title}><div className={styles.frame} data-journal-frame data-journal-featured>
      <div className={styles.featuredMedia} data-journal-motion><Image src={featured.image} alt={featured.imageAlt} fill sizes="(max-width: 900px) 100vw, 48vw" /></div>
      <div className={styles.featuredCopy}><p>{featured.eyebrow}</p><h2><MultilineTitle value={featured.title} /></h2><span>{featured.summary}</span><ul>{featured.takeaways.map((item) => <li key={item}>{item}</li>)}</ul><TrackedLink className={styles.action} href={`/${locale}/journal/${featured.slug}`} onFocus={keepFocusVisible} analyticsLabel={`journal_featured_${featured.slug}`} analyticsSurface="journal_block_motion">{copy.open}</TrackedLink></div>
      <b className={styles.counter} aria-hidden="true">03 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.directory}`} data-journal-scene aria-label={copy.directory}><div className={styles.frame} data-journal-frame>
      <div className={styles.heading}><p>{copy.directory}</p><h2><MultilineTitle value={copy.directoryTitle} /></h2></div>
      <nav className={styles.directoryList} data-journal-directory>{records.map((record, index) => <TrackedLink key={record.slug} href={`/${locale}/journal/${record.slug}`} onFocus={keepFocusVisible} data-journal-card analyticsLabel={`journal_directory_${record.slug}`} analyticsSurface="journal_block_motion"><span className={styles.directoryThumb} aria-hidden="true"><Image src={record.image} alt="" fill sizes="(max-width: 900px) 28vw, 6vw" /><b>0{index + 1}</b></span><small>{record.category}</small><h3>{record.title.replace("\n", " ")}</h3><span>{record.readingLabel}</span></TrackedLink>)}</nav>
      <b className={styles.counter} aria-hidden="true">04 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.close}`} data-journal-scene aria-label={copy.closeTitle}><div className={styles.frame} data-journal-frame data-journal-close>
      <div className={styles.closeMark} aria-hidden="true">É</div><div className={styles.closeCopy}><p>BEAUTY, CONSIDERED</p><h2><MultilineTitle value={copy.closeTitle} /></h2><span>{copy.notice}</span><TrackedLink className={styles.action} href={localizePath(locale, "/routines")} onFocus={keepFocusVisible} analyticsLabel="journal_close_routines" analyticsSurface="journal_block_motion">{copy.closeCta}</TrackedLink></div>
      <b className={styles.counter} aria-hidden="true">05 — 05</b>
    </div></section>
  </div>;
}

export function LocalizedJournalArticle({ locale, record, relatedArticles }: { locale: Locale; record: JournalRecord; relatedArticles: JournalRecord[] }) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-article-scene]" });
  const copy = journalCopy[locale].detail;

  return <article ref={rootRef} className={styles.experience} data-article-experience>
    <section className={`${styles.scene} ${styles.articleHero}`} data-article-scene aria-labelledby="article-title"><div className={styles.frame} data-article-frame>
      <div className={styles.articleMedia} data-journal-motion><Image src={record.image} alt={record.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 45vw" /></div>
      <div className={styles.articleHeroCopy} data-article-meta><p>{record.eyebrow}</p><small>{record.category} · {record.readingLabel}</small><h1 id="article-title"><MultilineTitle value={record.title} /></h1><span>{record.summary}</span><TrackedLink className={styles.action} href="#article-answer" onFocus={keepFocusVisible} analyticsLabel={`${record.slug}_answer`} analyticsSurface="article_block_motion">{copy.answer}</TrackedLink><em>{copy.disclaimer}</em></div>
      <b className={styles.counter} aria-hidden="true">01 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.answer}`} data-article-scene id="article-answer" aria-label={copy.answer}><div className={styles.frame} data-article-frame>
      <div className={styles.heading}><p>{copy.answer}</p><h2>{record.answer}</h2></div>
      <ol className={styles.takeaways} data-article-takeaways>{record.takeaways.map((item, index) => <li key={item}><b>0{index + 1}</b><span>{item}</span></li>)}</ol>
      <b className={styles.counter} aria-hidden="true">02 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.chapters}`} data-article-scene aria-label={copy.chapters}><div className={styles.frame} data-article-frame>
      <div className={styles.heading}><p>{copy.chapters}</p><h2>{locale === "ar" ? "ثلاث نقاط، بترتيب واضح." : "Three points, in a clear order."}</h2><nav className={styles.toc} data-article-toc aria-label={copy.chapters}>{record.sections.map((section, index) => <a key={section.title} href={`#chapter-${index + 1}`} onFocus={keepFocusVisible}>0{index + 1} {section.title}</a>)}</nav></div>
      <div className={styles.chapterList} data-article-chapters>{record.sections.map((section, index) => <section key={section.title} id={`chapter-${index + 1}`}><b>0{index + 1}</b><h3>{section.title}</h3><p>{section.body}</p></section>)}</div>
      <b className={styles.counter} aria-hidden="true">03 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.related}`} data-article-scene aria-label={copy.related}><div className={styles.frame} data-article-frame>
      <div className={styles.heading}><p>{copy.related}</p><h2>{locale === "ar" ? "المعلومة طريق، لا نهاية." : "Information is a path, not an end."}</h2></div>
      <nav className={styles.relatedGrid} data-article-related>{record.related.map((link, index) => <TrackedLink key={link.href} href={localizePath(locale, link.href)} onFocus={keepFocusVisible} analyticsLabel={`${record.slug}_related_path_${index}`} analyticsSurface="article_block_motion"><b>0{index + 1}</b><h3>{link.title}</h3><span>{link.body}</span></TrackedLink>)}{relatedArticles.map((article, index) => <TrackedLink key={article.slug} href={`/${locale}/journal/${article.slug}`} onFocus={keepFocusVisible} analyticsLabel={`${record.slug}_related_article_${index}`} analyticsSurface="article_block_motion"><b>J{index + 1}</b><h3>{article.title.replace("\n", " ")}</h3><span>{article.summary}</span></TrackedLink>)}</nav>
      <b className={styles.counter} aria-hidden="true">04 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.faq}`} data-article-scene aria-label={copy.questions}><div className={styles.frame} data-article-frame>
      <div className={styles.heading}><p>{copy.questions}</p><h2>{locale === "ar" ? "إجابة بلا وعد زائد." : "An answer without an extra promise."}</h2><TrackedLink className={styles.action} href={`/${locale}/journal`} onFocus={keepFocusVisible} analyticsLabel={`${record.slug}_back`} analyticsSurface="article_block_motion">{copy.back}</TrackedLink></div>
      <div className={styles.faqList} data-article-faq>{record.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      <b className={styles.counter} aria-hidden="true">05 — 05</b>
    </div></section>
  </article>;
}
