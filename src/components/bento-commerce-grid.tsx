"use client";

import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
import { MultilineTitle, keepFocusVisible } from "@/components/scene-primitives";
import { bentoCopy, type BentoCard } from "@/lib/bento-content";
import { localizePath, type Locale } from "@/lib/i18n";
import type { BentoAuthorityLocale } from "@/lib/site-editorial-authority";
import styles from "./bento-commerce-grid.module.css";

type Props = { locale: Locale; content?: BentoAuthorityLocale };

/**
 * The bento commerce grid from the approved reference concept.
 *
 * One card system with typed variants rather than a bespoke block per section.
 * Every card is a whole link, and nothing a visitor needs to make a decision is
 * revealed by hover — the arrow and the lift are confirmation, not disclosure.
 */
function ArrowMark() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
        <path
          d="M5 12h13M12 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Card({ card, locale }: { card: BentoCard; locale: Locale }) {
  const copy = bentoCopy[locale];

  switch (card.kind) {
    case "intro":
      return (
        <div className={`${styles.card} ${styles.intro}`}>
          <p className={styles.eyebrow}>{card.eyebrow}</p>
          <h3 className={styles.introTitle}>
            <MultilineTitle value={card.title} />
          </h3>
          <TrackedLink
            className={styles.textAction}
            href={localizePath(locale, card.href)}
            onFocus={keepFocusVisible}
            analyticsLabel={`bento_${card.id}`}
            analyticsSurface="home_bento"
          >
            {card.cta}
            <ArrowMark />
          </TrackedLink>
        </div>
      );

    case "category":
      return (
        <TrackedLink
          className={`${styles.card} ${styles.category}`}
          href={localizePath(locale, card.href)}
          onFocus={keepFocusVisible}
          analyticsLabel={`bento_category_${card.id}`}
          analyticsSurface="home_bento"
        >
          <Image
            className={styles.media}
            src={card.image}
            alt={card.imageAlt}
            fill
            sizes="(max-width: 359px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 17vw"
          />
          <span className={styles.categoryLabel}>{card.title}</span>
          <ArrowMark />
        </TrackedLink>
      );

    case "editorial":
      return (
        <div className={`${styles.card} ${styles.editorial} ${styles[card.theme]}`}>
          <h3 className={styles.editorialTitle}>
            <MultilineTitle value={card.title} />
          </h3>
          <p className={styles.editorialBody}>{card.body}</p>
          <TrackedLink
            className={styles.textAction}
            href={localizePath(locale, card.href)}
            onFocus={keepFocusVisible}
            analyticsLabel={`bento_${card.id}`}
            analyticsSurface="home_bento"
          >
            {card.cta}
            <ArrowMark />
          </TrackedLink>
        </div>
      );

    case "media":
      return (
        <div className={`${styles.card} ${styles.mediaCard}`} aria-hidden="true">
          <Image
            className={styles.media}
            src={card.image}
            alt=""
            fill
            sizes={card.id === "journal-media"
              ? "(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 9vw"
              : "(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 17vw"}
          />
        </div>
      );

    case "quote":
      return (
        <figure className={`${styles.card} ${styles.quote}`}>
          <span className={styles.quoteMark} aria-hidden="true">
            &ldquo;
          </span>
          <blockquote className={styles.quoteText}>
            <MultilineTitle value={card.quote} />
          </blockquote>
          <figcaption className={styles.quoteAttribution}>
            {card.attribution}
          </figcaption>
        </figure>
      );
  }

  // Exhaustive above; kept for the type checker's benefit.
  void copy;
  return null;
}

export function BentoCommerceGrid({ locale, content }: Props) {
  const copy = content ?? bentoCopy[locale];

  return (
    <section className={styles.section} aria-labelledby="bento-section-title">
      <h2 id="bento-section-title" className={styles.srOnly}>
        {copy.sectionLabel}
      </h2>
      <div className={styles.grid}>
        {copy.cards.map((card) => (
          <div
            key={card.id}
            className={styles.cell}
            data-cell={card.id}
            data-kind={card.kind}
          >
            <Card card={card} locale={locale} />
          </div>
        ))}
      </div>
      <p className={styles.notice}>{copy.conceptNotice}</p>
    </section>
  );
}
