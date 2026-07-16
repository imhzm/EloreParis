"use client";

import Image from "next/image";
import { type FocusEvent } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { useScrollSceneProgress } from "@/hooks/use-scroll-scene-progress";
import { localizePath, type Locale } from "@/lib/i18n";
import { supportContent, trustContent, trustHubCopy, trustSlugs, type TrustSupportRecord } from "@/lib/trust-support-content";
import styles from "./localized-trust-support-experience.module.css";

function Title({ value }: { value: string }) {
  const [first, ...rest] = value.split("\n");
  return <>{first}{rest.map((line) => <span key={line}><br />{line}</span>)}</>;
}

function keepFocusVisible(event: FocusEvent<HTMLElement>) {
  const target = event.currentTarget;
  requestAnimationFrame(() => target.scrollIntoView({ block: "center", inline: "nearest" }));
}

const visualBySlug: Record<string, string> = {
  verification: "/elore-assets/ingredient-botanical-lab-concept-1536x1024.avif",
  privacy: "/elore-assets/editorial-skin-light-concept-1122w.avif",
  shipping: "/elore-assets/gifting-folds-concept-1536x1024.avif",
  returns: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif",
  authenticity: "/elore-assets/tools-brass-flatlay-concept-1254x1254.avif",
  about: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif",
  contact: "/elore-assets/gifting-folds-concept-1536x1024.avif",
  faq: "/elore-assets/ingredient-botanical-lab-concept-1536x1024.avif",
  terms: "/elore-assets/transition-burgundy-satin-concept-1672w.avif",
};

export function LocalizedTrustHub({ locale }: { locale: Locale }) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-trust-scene]" });
  const copy = trustHubCopy[locale];
  const records = trustSlugs.map((slug) => trustContent[locale][slug]);

  return <div ref={rootRef} className={styles.experience} data-trust-experience>
    <section className={`${styles.scene} ${styles.hero}`} data-trust-scene aria-labelledby="trust-title"><div className={styles.frame}>
      <div className={styles.motionMark} aria-hidden="true"><Image src="/elore-assets/editorial-skin-light-concept-1122w.avif" alt="" fill priority sizes="(max-width: 900px) 90vw, 42vw" /><span>É</span><i>TRUST / 01</i></div>
      <div className={styles.heroCopy}><p>{copy.eyebrow}</p><h1 id="trust-title"><Title value={copy.title} /></h1><span>{copy.intro}</span><TrackedLink className={styles.action} href="#trust-directory" onFocus={keepFocusVisible} analyticsLabel="trust_directory_begin" analyticsSurface="trust_block_motion">{copy.directory}</TrackedLink><small>{copy.notice}</small></div>
      <b className={styles.counter}>01 — 04</b>
    </div></section>
    <section className={`${styles.scene} ${styles.directory}`} data-trust-scene id="trust-directory" aria-label={copy.directory}><div className={styles.frame}>
      <div className={styles.heading}><p>{copy.directory}</p><h2><Title value={copy.principlesTitle} /></h2></div>
      <nav className={styles.directoryGrid}>{records.map((record, index) => <TrackedLink key={record.slug} href={`/${locale}/trust/${record.slug}`} onFocus={keepFocusVisible} analyticsLabel={`trust_${record.slug}`} analyticsSurface="trust_block_motion"><b>0{index + 1}</b><small>{record.eyebrow}</small><h3>{record.title.replace("\n", " ")}</h3><span>{record.summary}</span><strong>{copy.open}</strong></TrackedLink>)}</nav>
      <b className={styles.counter}>02 — 04</b>
    </div></section>
    <section className={`${styles.scene} ${styles.principles}`} data-trust-scene aria-label={copy.principlesTitle}><div className={styles.frame}>
      <div className={styles.statement}><p>PROOF BEFORE PROMISE</p><h2><Title value={copy.principlesTitle} /></h2><span>{copy.notice}</span></div>
      <ol className={styles.rules}>{records.slice(0, 4).map((record, index) => <li key={record.slug}><b>0{index + 1}</b><span>{record.sections[0].title}</span><small>{record.sections[0].body}</small></li>)}</ol>
      <b className={styles.counter}>03 — 04</b>
    </div></section>
    <section className={`${styles.scene} ${styles.close}`} data-trust-scene aria-label={copy.closeTitle}><div className={styles.frame}>
      <div className={styles.closeCopy}><p>CLARITY BEFORE COMMERCE</p><h2><Title value={copy.closeTitle} /></h2><span>{copy.intro}</span><TrackedLink className={styles.action} href={`/${locale}/faq`} onFocus={keepFocusVisible} analyticsLabel="trust_to_faq" analyticsSurface="trust_block_motion">{copy.support}</TrackedLink></div>
      <b className={styles.counter}>04 — 04</b>
    </div></section>
  </div>;
}

export function LocalizedTrustSupportDetail({ locale, record, parentHref }: { locale: Locale; record: TrustSupportRecord; parentHref: string }) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-trust-detail-scene]" });
  const isAr = locale === "ar";
  const faqHref = localizePath(locale, "/faq");

  return <div ref={rootRef} className={styles.experience} data-trust-experience>
    <section className={`${styles.scene} ${styles.hero}`} data-trust-detail-scene aria-labelledby="policy-title"><div className={styles.frame}>
      <div className={styles.motionMark} aria-hidden="true"><Image src={visualBySlug[record.slug] ?? visualBySlug.verification} alt="" fill priority sizes="(max-width: 900px) 90vw, 42vw" /><span>É</span><i>{record.eyebrow}</i></div>
      <div className={styles.heroCopy}><p>{record.eyebrow}</p><h1 id="policy-title"><Title value={record.title} /></h1><span>{record.summary}</span><TrackedLink className={styles.action} href="#policy-sections" onFocus={keepFocusVisible} analyticsLabel={`${record.slug}_begin`} analyticsSurface="trust_block_motion">{isAr ? "اقرئي التفاصيل" : "Read the detail"}</TrackedLink><small>{record.status}</small></div>
      <b className={styles.counter}>01 — 04</b>
    </div></section>
    <section className={`${styles.scene} ${styles.detail}`} data-trust-detail-scene id="policy-sections" aria-label={isAr ? "التفاصيل" : "Details"}><div className={styles.frame}>
      <div className={styles.heading}><p>{isAr ? "التفاصيل" : "THE DETAIL"}</p><h2>{isAr ? "معلومة يمكن مراجعتها." : "Information you can review."}</h2></div>
      <div className={styles.sectionGrid}>{record.sections.map((section, index) => <article key={section.title}><b>0{index + 1}</b><h3>{section.title}</h3><p>{section.body}</p>{section.points && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}</article>)}</div>
      <b className={styles.counter}>02 — 04</b>
    </div></section>
    <section className={`${styles.scene} ${styles.questions}`} data-trust-detail-scene aria-label={isAr ? "أسئلة واضحة" : "Clear questions"}><div className={styles.frame}>
      <div className={styles.statement}><p>QUESTIONS / ANSWERS</p><h2>{isAr ? "لا إجابة مخترعة." : "No invented answer."}</h2><span>{record.status}</span></div>
      <div className={styles.faqList}>{record.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      <b className={styles.counter}>03 — 04</b>
    </div></section>
    <section className={`${styles.scene} ${styles.close}`} data-trust-detail-scene aria-label={isAr ? "الخطوة التالية" : "Next step"}><div className={styles.frame}>
      <div className={styles.closeCopy}><p>ÉLORÉ / CONSIDERED</p><h2>{isAr ? "اعرفي قبل أن تختاري." : "Know before you choose."}</h2><span>{record.status}</span><div className={styles.actions}><TrackedLink className={styles.action} href={`/${locale}${parentHref}`} onFocus={keepFocusVisible} analyticsLabel={`${record.slug}_back`} analyticsSurface="trust_block_motion">{isAr ? "العودة إلى الدليل" : "Back to the directory"}</TrackedLink>{record.slug !== "faq" && <TrackedLink className={styles.textAction} href={faqHref} onFocus={keepFocusVisible} analyticsLabel={`${record.slug}_faq`} analyticsSurface="trust_block_motion">{isAr ? "الأسئلة الشائعة" : "Frequently asked questions"}</TrackedLink>}</div></div>
      <b className={styles.counter}>04 — 04</b>
    </div></section>
  </div>;
}

export const localizedSupportDirectory = supportContent;
