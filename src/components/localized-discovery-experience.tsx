"use client";

import { type FocusEvent } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { useScrollSceneProgress } from "@/hooks/use-scroll-scene-progress";
import {
  discoveryDetailCopy,
  discoveryHubCopy,
  discoveryPaths,
  type DiscoveryKind,
  type DiscoveryRecord,
} from "@/lib/discovery-content";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./localized-discovery-experience.module.css";

function MultilineTitle({ value }: { value: string }) {
  const [first, ...rest] = value.split("\n");
  return <>{first}{rest.map((line) => <span key={line}><br />{line}</span>)}</>;
}

function keepFocusVisible(event: FocusEvent<HTMLAnchorElement>) {
  const target = event.currentTarget;
  requestAnimationFrame(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    target.scrollIntoView({ block: "center", inline: "nearest" });
    root.style.scrollBehavior = previous;
  });
}

function routeFor(locale: Locale, href: string) {
  return localizePath(locale, href);
}

type HubProps = { locale: Locale; kind: DiscoveryKind; items: DiscoveryRecord[] };

export function LocalizedDiscoveryHub({ locale, kind, items }: HubProps) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-discovery-scene]" });
  const shared = discoveryHubCopy[locale];
  const copy = shared[kind];
  const baseHref = `/${discoveryPaths[kind]}`;

  return (
    <div ref={rootRef} className={styles.experience} data-discovery-experience>
      <section className={`${styles.scene} ${styles.hubHero}`} data-discovery-scene aria-labelledby="discovery-title">
        <div className={styles.frame}>
          <div className={styles.motionGrid} data-discovery-motion aria-hidden="true"><span>01</span><span>{copy.eyebrow}</span><span>ÉLORÉ</span></div>
          <div className={styles.heroIndex} aria-hidden="true">{items.map((item, index) => <span key={item.slug}>0{index + 1}<b>{item.title}</b></span>)}</div>
          <div className={styles.heroCopy}><p>{copy.eyebrow}</p><h1 id="discovery-title"><MultilineTitle value={copy.title} /></h1><span>{copy.intro}</span><TrackedLink href="#directory" onFocus={keepFocusVisible} className={styles.primaryAction} analyticsLabel={`${kind}_directory_begin`} analyticsSurface="discovery_block_motion">{shared.openLabel}</TrackedLink><small>{shared.conceptNotice}</small></div>
          <div className={styles.counter} aria-hidden="true">01 — 04</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.directoryScene}`} data-discovery-scene id="directory" aria-label={shared.directory}>
        <div className={styles.frame}>
          <div className={styles.sectionHeading}><p>{shared.directory}</p><h2><MultilineTitle value={shared.directoryTitle} /></h2></div>
          <div className={styles.directoryGrid}>{items.map((item, index) => <TrackedLink key={item.slug} href={`/${locale}${baseHref}/${item.slug}`} onFocus={keepFocusVisible} analyticsLabel={`${kind}_directory_${item.slug}`} analyticsSurface="discovery_block_motion"><b>0{index + 1}</b><small>{item.subtitle}</small><h3>{item.title}</h3><p>{item.summary}</p><strong>{shared.openLabel}</strong></TrackedLink>)}</div>
          <div className={styles.counter} aria-hidden="true">02 — 04</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.decisionScene}`} data-discovery-scene aria-label={copy.decisionTitle}>
        <div className={styles.frame}>
          <div className={styles.decisionCopy} data-discovery-column="copy"><p>DECISION BEFORE PRODUCT</p><h2>{copy.decisionTitle}</h2><span>{copy.decisionBody}</span></div>
          <div className={styles.signalGrid} data-discovery-column="panel">{items.map((item, index) => <article key={item.slug}><b>0{index + 1}</b><h3>{item.title}</h3><small>{shared.signalLabel}</small><ul>{item.signals.slice(0,3).map((signal) => <li key={signal}>{signal}</li>)}</ul></article>)}</div>
          <div className={styles.counter} aria-hidden="true">03 — 04</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.closingScene}`} data-discovery-scene aria-label={shared.closingEyebrow}>
        <div className={styles.frame}>
          <div className={styles.closingRule} aria-hidden="true" />
          <div className={styles.closingCopy}><p>{shared.closingEyebrow}</p><h2><MultilineTitle value={shared.closingTitle} /></h2><span>{copy.decisionBody}</span><TrackedLink href={routeFor(locale, copy.nextHref)} onFocus={keepFocusVisible} className={styles.primaryAction} analyticsLabel={`${kind}_directory_next`} analyticsSurface="discovery_block_motion">{copy.nextLabel}</TrackedLink></div>
          <div className={styles.counter} aria-hidden="true">04 — 04</div>
        </div>
      </section>
    </div>
  );
}

type DetailProps = { locale: Locale; kind: DiscoveryKind; record: DiscoveryRecord };

export function LocalizedDiscoveryDetail({ locale, kind, record }: DetailProps) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-knowledge-scene]" });
  const copy = discoveryDetailCopy[locale];
  const baseHref = `/${discoveryPaths[kind]}`;
  const relatedLinks = record.related.filter(([, , href]) => (
    locale !== "en" || !href.startsWith("/search")
  ));

  return (
    <div ref={rootRef} className={styles.experience} data-discovery-experience>
      <section className={`${styles.scene} ${styles.detailHero}`} data-knowledge-scene aria-labelledby="knowledge-title">
        <div className={styles.frame}>
          <div className={styles.detailMark} data-discovery-motion aria-hidden="true"><span>{record.subtitle}</span><b>ÉLORÉ<br />PARIS</b></div>
          <div className={styles.detailHeroCopy}><p>{record.subtitle}</p><h1 id="knowledge-title">{record.title}</h1><span>{record.summary}</span><TrackedLink href="#chapters" onFocus={keepFocusVisible} className={styles.primaryAction} analyticsLabel={`${kind}_${record.slug}_begin`} analyticsSurface="knowledge_block_motion">{copy.chaptersEyebrow}</TrackedLink><small>{copy.disclaimer}</small></div>
          <div className={styles.counter} aria-hidden="true">01 — 05</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.chaptersScene}`} data-knowledge-scene id="chapters" aria-label={copy.chaptersEyebrow}>
        <div className={styles.frame}>
          <div className={styles.sectionHeading}><p>{copy.chaptersEyebrow}</p><h2><MultilineTitle value={copy.chaptersTitle} /></h2></div>
          <div className={styles.chapterGrid}>{record.chapters.map(([title, body], index) => <article key={title}><b>0{index + 1}</b><h3>{title}</h3><p>{body}</p></article>)}</div>
          <div className={styles.counter} aria-hidden="true">02 — 05</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.watchScene}`} data-knowledge-scene aria-label={copy.watchEyebrow}>
        <div className={styles.frame}>
          <div className={styles.watchCopy} data-discovery-column="copy"><p>{copy.watchEyebrow}</p><h2><MultilineTitle value={copy.watchTitle} /></h2><span>{copy.disclaimer}</span></div>
          <ol className={styles.watchList} data-discovery-column="panel">{record.watchouts.map((item, index) => <li key={item}><b>0{index + 1}</b><span>{item}</span></li>)}</ol>
          <div className={styles.counter} aria-hidden="true">03 — 05</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.relatedScene}`} data-knowledge-scene aria-label={copy.relatedEyebrow}>
        <div className={styles.frame}>
          <div className={styles.relatedCopy}><p>{copy.relatedEyebrow}</p><h2><MultilineTitle value={copy.relatedTitle} /></h2></div>
          <nav className={styles.relatedGrid} data-discovery-related aria-label={copy.relatedEyebrow}>{relatedLinks.map(([title, body, href], index) => <TrackedLink key={`${title}-${href}`} href={routeFor(locale, href)} onFocus={keepFocusVisible} analyticsLabel={`${kind}_${record.slug}_related_${index}`} analyticsSurface="knowledge_block_motion"><b>0{index + 1}</b><h3>{title}</h3><span>{body}</span></TrackedLink>)}</nav>
          <div className={styles.counter} aria-hidden="true">04 — 05</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.faqScene}`} data-knowledge-scene aria-label={copy.faqEyebrow}>
        <div className={styles.frame}>
          <div className={styles.faqCopy} data-discovery-column="copy"><p>{copy.faqEyebrow}</p><h2><MultilineTitle value={copy.faqTitle} /></h2><TrackedLink href={`/${locale}${baseHref}`} onFocus={keepFocusVisible} className={styles.primaryAction} analyticsLabel={`${kind}_${record.slug}_back`} analyticsSurface="knowledge_block_motion">{copy.back}</TrackedLink></div>
          <div className={styles.faqList} data-discovery-column="panel" data-discovery-faq>{record.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
          <div className={styles.counter} aria-hidden="true">05 — 05</div>
        </div>
      </section>
    </div>
  );
}
