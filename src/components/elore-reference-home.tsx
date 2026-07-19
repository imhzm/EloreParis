import Image from "next/image";
import type { ReactNode } from "react";
import { BentoCommerceGrid } from "@/components/bento-commerce-grid";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { TrackedLink } from "@/components/tracked-link";
import { homeCopy, localizePath, type Locale } from "@/lib/i18n";
import type { HomeAuthorityContent } from "@/lib/site-content-authority";
import type { BentoAuthorityLocale } from "@/lib/site-editorial-authority";
import styles from "./elore-reference-home.module.css";

type Props = {
  locale: Locale;
  content?: HomeAuthorityContent;
  bentoContent?: BentoAuthorityLocale;
  serviceStrip?: ReactNode;
};

export function EloreReferenceHome({ locale, content, bentoContent, serviceStrip }: Props) {
  const copy = content ?? homeCopy[locale];
  const href = (path: string) => localizePath(locale, path);
  const desktopHeroSrc = content?.hero.desktopMediaAssetId
    ? `/api/media/${encodeURIComponent(content.hero.desktopMediaAssetId)}`
    : "/elore-assets/hero-perfume-ritual-desktop-v3.avif";
  const mobileHeroSrc = content?.hero.mobileMediaAssetId
    ? `/api/media/${encodeURIComponent(content.hero.mobileMediaAssetId)}`
    : "/elore-assets/hero-perfume-ritual-mobile-v2.avif";

  return (
    <div className={styles.page} data-reference-home>
      <section className={styles.hero} data-home-hero aria-labelledby="home-title">
        <picture className={styles.heroMedia} data-home-hero-media>
          <source
            media="(max-width: 680px)"
            srcSet={mobileHeroSrc}
          />
          <img
            src={desktopHeroSrc}
            alt=""
            width="1904"
            height="826"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.brandRail} aria-hidden="true">
          <Image src="/elore-assets/logo-mark-burgundy.png" alt="" width={605} height={808} />
          <span lang="en" dir="ltr">Beauty,<br />composed<br />with intention</span>
        </div>
        <div className={styles.heroCopy} data-home-signature-motion>
          <p className={styles.eyebrow} lang="en">{copy.hero.eyebrow}</p>
          <h1 id="home-title">{copy.hero.title}</h1>
          <p className={styles.heroLead}>{copy.hero.body}</p>
          <div className={styles.heroActions}>
            <TrackedLink
              href={href("/shop")}
              className={styles.primaryAction}
              analyticsLabel="home_reference_collection"
              analyticsSurface="reference_home"
            >
              {copy.hero.primary}
            </TrackedLink>
          </div>
          <p className={styles.heroStatus}>{copy.hero.assetStatus}</p>
        </div>
        <div className={styles.sceneIndex} aria-hidden="true">
          <b>01</b>
          <span>02</span>
          <span>03</span>
          <span>04</span>
        </div>
        <TrackedLink
          href="#discovery"
          className={styles.scrollCue}
          analyticsLabel="home_reference_discovery"
          analyticsSurface="reference_home"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4v15m0 0-5-5m5 5 5-5" />
          </svg>
          <span>{copy.hero.secondary}</span>
        </TrackedLink>
      </section>

      <div id="discovery" className={styles.bentoWrap} data-home-bento>
        <BentoCommerceGrid locale={locale} content={bentoContent} />
      </div>

      {serviceStrip ? <div data-home-trust>{serviceStrip}</div> : null}

      <section className={styles.catalogGate} data-home-catalog-gate aria-labelledby="catalog-gate-title">
        <div className={styles.catalogMedia} aria-hidden="true">
          <Image
            src="/elore-assets/texture-skincare-serum-concept-1536w.avif"
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 42vw"
          />
        </div>
        <div className={styles.catalogCopy}>
          <p className={styles.eyebrow} lang="en">{copy.productTruth.eyebrow}</p>
          <h2 id="catalog-gate-title">{copy.productTruth.title}</h2>
          <p>{copy.productTruth.body}</p>
          <p className={styles.gateNote}>{copy.productTruth.gate}</p>
          <TrackedLink
            href={href("/shop")}
            className={styles.textAction}
            analyticsLabel="home_reference_catalog_gate"
            analyticsSurface="reference_home"
          >
            {copy.hero.primary}
          </TrackedLink>
        </div>
      </section>

      <section className={styles.routine} data-home-routine aria-labelledby="routine-title">
        <header className={styles.sectionHeading}>
          <p className={styles.eyebrow} lang="en">RITUAL, SIMPLIFIED</p>
          <h2 id="routine-title">{copy.routine.title}</h2>
          <p>{copy.routine.body}</p>
        </header>
        <div className={styles.routineSteps}>
          {copy.routine.steps.map(([number, title, body]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <TrackedLink
          href={href("/routines")}
          className={styles.primaryAction}
          analyticsLabel="home_reference_routine"
          analyticsSurface="reference_home"
        >
          {copy.routine.cta}
        </TrackedLink>
      </section>

      <section className={styles.gifting} data-home-gifting aria-labelledby="gifting-title">
        <Image
          src="/elore-assets/gifting-ribbon-ritual-concept-1536w.avif"
          alt=""
          fill
          sizes="100vw"
        />
        <div className={styles.giftingShade} aria-hidden="true" />
        <div className={styles.giftingCopy}>
          <p className={styles.eyebrow} lang="en">THE ART OF GIFTING</p>
          <h2 id="gifting-title">{copy.gifting.title}</h2>
          <p>{copy.gifting.body}</p>
          <TrackedLink
            href={href("/shop/beauty-sets")}
            className={styles.lightAction}
            analyticsLabel="home_reference_gifting"
            analyticsSurface="reference_home"
          >
            {copy.gifting.cta}
          </TrackedLink>
        </div>
      </section>

      <section className={styles.editorial} data-home-editorial>
        <article className={styles.storyCard} aria-labelledby="story-title">
          <div className={styles.storyMedia} aria-hidden="true">
            <Image src="/elore-assets/editorial-skin-light-concept-1122w.avif" alt="" fill sizes="(max-width: 760px) 100vw, 34vw" />
          </div>
          <div className={styles.storyCopy}>
            <p className={styles.eyebrow} lang="en">PARIS, REFRAMED</p>
            <h2 id="story-title">{copy.story.title}</h2>
            <p>{copy.story.body}</p>
            <TrackedLink href={href("/about")} className={styles.textAction} analyticsLabel="home_reference_story" analyticsSurface="reference_home">{copy.story.cta}</TrackedLink>
          </div>
        </article>
        <article className={styles.journalCard} aria-labelledby="edit-title">
          <p className={styles.eyebrow} lang="en">THE BEAUTY EDIT</p>
          <h2 id="edit-title">{copy.edit.title}</h2>
          <p>{copy.edit.body}</p>
          <TrackedLink href={href("/journal")} className={styles.lightAction} analyticsLabel="home_reference_journal" analyticsSurface="reference_home">{copy.edit.cta}</TrackedLink>
        </article>
      </section>

      <section className={styles.newsletter} data-home-newsletter aria-label={copy.edit.title}>
        <NewsletterSignup locale={locale} />
      </section>
    </div>
  );
}
