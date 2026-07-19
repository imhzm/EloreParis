"use client";

import Image from "next/image";
import { MultilineTitle } from "@/components/scene-primitives";
import { TrackedLink } from "@/components/tracked-link";
import {
  discoveryDetailCopy,
  discoveryHubCopy,
  discoveryPaths,
  type DiscoveryKind,
  type DiscoveryRecord,
} from "@/lib/discovery-content";
import { localizePath, type Locale } from "@/lib/i18n";
import type { EditorialAuthorityContent } from "@/lib/site-editorial-authority";
import styles from "./localized-discovery-experience.module.css";

const visualByKind: Record<DiscoveryKind, string> = {
  concern: "/elore-assets/editorial-skin-light-concept-1122w.avif",
  routine: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif",
  ingredient: "/elore-assets/ingredient-botanical-lab-concept-1536x1024.avif",
};

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

type HubProps = {
  locale: Locale;
  kind: DiscoveryKind;
  items: DiscoveryRecord[];
  hubCopy?: EditorialAuthorityContent["discoveryHubCopy"][Locale];
  visual?: string;
};

export function LocalizedDiscoveryHub({ locale, kind, items, hubCopy, visual }: HubProps) {
  const shared = hubCopy ?? discoveryHubCopy[locale];
  const copy = shared[kind];
  const baseHref = `/${discoveryPaths[kind]}`;

  return (
    <div className={styles.experience} data-discovery-experience data-discovery-kind={kind}>
      <section className={styles.hubHero} aria-labelledby="discovery-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow} lang="en">{copy.eyebrow}</p>
          <h1 id="discovery-title">
            <MultilineTitle value={copy.title} />
          </h1>
          <p className={styles.lede}>{copy.intro}</p>
          <TrackedLink
            href="#directory"
            className={styles.primaryAction}
            analyticsLabel={`${kind}_directory_begin`}
            analyticsSurface="discovery_index"
          >
            {shared.openLabel}
          </TrackedLink>
          <small className={styles.guidanceNote}>{shared.conceptNotice}</small>
        </div>

        <figure className={styles.heroMedia}>
          <Image
            src={visual ?? visualByKind[kind]}
            alt={copy.visualAlt}
            fill
            priority
            sizes="(max-width: 820px) 92vw, 46vw"
          />
          <figcaption>{copy.visualCaption}</figcaption>
        </figure>
      </section>

      <section className={styles.indexSection} id="directory" aria-labelledby="directory-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow} lang="en">{shared.directory}</p>
          <h2 id="directory-title">
            <MultilineTitle value={shared.directoryTitle} />
          </h2>
          <p>{copy.decisionBody}</p>
        </div>

        <nav aria-label={shared.directoryAria}>
          <ol className={styles.indexGrid}>
            {items.map((item, index) => (
              <li key={item.slug}>
                <TrackedLink
                  href={`/${locale}${baseHref}/${item.slug}`}
                  className={styles.indexCard}
                  analyticsLabel={`${kind}_directory_${item.slug}`}
                  analyticsSurface="discovery_index"
                >
                  <span className={styles.indexNumber} aria-hidden="true">{formatIndex(index)}</span>
                  <small lang="en">{item.subtitle}</small>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <div className={styles.signalBlock}>
                    <strong>{shared.signalLabel}</strong>
                    <ul>
                      {item.signals.map((signal) => <li key={signal}>{signal}</li>)}
                    </ul>
                  </div>
                  <span className={styles.textAction}>{shared.openLabel}</span>
                </TrackedLink>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section className={styles.decisionPanel} aria-labelledby="decision-title">
        <div className={styles.decisionCopy}>
          <p className={styles.eyebrow} lang="en">{shared.closingEyebrow}</p>
          <h2 id="decision-title">{copy.decisionTitle}</h2>
          <p>{copy.decisionBody}</p>
        </div>
        <div className={styles.decisionNext}>
          <p><MultilineTitle value={shared.closingTitle} /></p>
          <TrackedLink
            href={localizePath(locale, copy.nextHref)}
            className={styles.lightAction}
            analyticsLabel={`${kind}_directory_next`}
            analyticsSurface="discovery_index"
          >
            {copy.nextLabel}
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}

type DetailProps = {
  locale: Locale;
  kind: DiscoveryKind;
  record: DiscoveryRecord;
  detailCopy?: EditorialAuthorityContent["discoveryDetailCopy"][Locale];
  hubCopy?: EditorialAuthorityContent["discoveryHubCopy"][Locale];
  visual?: string;
};

export function LocalizedDiscoveryDetail({ locale, kind, record, detailCopy, hubCopy, visual }: DetailProps) {
  const copy = detailCopy ?? discoveryDetailCopy[locale];
  const kindCopy = (hubCopy ?? discoveryHubCopy[locale])[kind];
  const baseHref = `/${discoveryPaths[kind]}`;

  return (
    <article className={styles.experience} data-discovery-experience data-discovery-detail={kind}>
      <header className={styles.detailHero} aria-labelledby="knowledge-title">
        <div className={styles.detailHeroCopy}>
          <p className={styles.eyebrow} lang="en">{record.subtitle}</p>
          <h1 id="knowledge-title">{record.title}</h1>
          <p className={styles.lede}>{record.summary}</p>
          <TrackedLink
            href="#chapters"
            className={styles.primaryAction}
            analyticsLabel={`${kind}_${record.slug}_begin`}
            analyticsSurface="discovery_detail"
          >
            {copy.chaptersCta}
          </TrackedLink>
          <small className={styles.guidanceNote}>{copy.disclaimer}</small>
        </div>

        <figure className={styles.heroMedia}>
          <Image
            src={visual ?? visualByKind[kind]}
            alt={kindCopy.visualAlt}
            fill
            priority
            sizes="(max-width: 820px) 92vw, 46vw"
          />
          <figcaption>{kindCopy.visualCaption}</figcaption>
        </figure>
      </header>

      <section className={styles.contentSection} id="chapters" aria-labelledby="chapters-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow} lang="en">{copy.chaptersEyebrow}</p>
          <h2 id="chapters-title">
            <MultilineTitle value={copy.chaptersTitle} />
          </h2>
          <p>{record.summary}</p>
        </div>

        <ol className={styles.chapterGrid}>
          {record.chapters.map(([title, body], index) => (
            <li key={title} className={styles.chapterCard}>
              <span aria-hidden="true">{formatIndex(index)}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>

        <aside className={styles.watchPanel} aria-labelledby="watch-title">
          <div className={styles.watchCopy} data-discovery-column="copy">
            <p className={styles.eyebrow} lang="en">{copy.watchEyebrow}</p>
            <h2 id="watch-title">
              <MultilineTitle value={copy.watchTitle} />
            </h2>
            <p>{copy.disclaimer}</p>
          </div>
          <ol className={styles.watchList} data-discovery-column="panel">
            {record.watchouts.map((item, index) => (
              <li key={item}>
                <span aria-hidden="true">{formatIndex(index)}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className={styles.relatedSection} aria-labelledby="related-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow} lang="en">{copy.relatedEyebrow}</p>
          <h2 id="related-title">
            <MultilineTitle value={copy.relatedTitle} />
          </h2>
        </div>
        <nav className={styles.relatedGrid} data-discovery-related aria-label={copy.relatedAria}>
          {record.related.map(([title, body, href], index) => (
            <TrackedLink
              key={`${title}-${href}`}
              href={localizePath(locale, href)}
              className={styles.relatedCard}
              analyticsLabel={`${kind}_${record.slug}_related_${index}`}
              analyticsSurface="discovery_detail"
            >
              <span aria-hidden="true">{formatIndex(index)}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </TrackedLink>
          ))}
        </nav>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title">
        <div className={styles.faqLayout}>
          <div className={styles.faqCopy} data-discovery-column="copy">
            <p className={styles.eyebrow} lang="en">{copy.faqEyebrow}</p>
            <h2 id="faq-title">
              <MultilineTitle value={copy.faqTitle} />
            </h2>
            <TrackedLink
              href={`/${locale}${baseHref}`}
              className={styles.primaryAction}
              analyticsLabel={`${kind}_${record.slug}_back`}
              analyticsSurface="discovery_detail"
            >
              {copy.back}
            </TrackedLink>
          </div>
          <div className={styles.faqList} data-discovery-column="panel" data-discovery-faq>
            {record.faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
