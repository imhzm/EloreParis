"use client";

import Image from "next/image";
import { type FocusEvent } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { useScrollSceneProgress } from "@/hooks/use-scroll-scene-progress";
import { categoryCopy, categorySharedCopy, type CategorySlug } from "@/lib/category-content";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./localized-category-stage.module.css";

type Props = { locale: Locale; slug: CategorySlug };

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

export function LocalizedCategoryStage({ locale, slug }: Props) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-category-scene]" });
  const copy = categoryCopy[locale][slug];
  const shared = categorySharedCopy[locale];

  return (
    <div ref={rootRef} className={styles.category}>
      <section className={`${styles.scene} ${styles.heroScene}`} data-category-scene aria-label={`${shared.sceneLabels[0]}: ${copy.title}`}>
        <div className={styles.frame}>
          <div className={styles.heroGrid} aria-hidden="true"><span>01</span><span>{copy.eyebrow.split(" · ")[0]}</span><span>ÉLORÉ</span></div>
          <div className={styles.heroMedia} data-category-motion-layer="hero"><Image src={copy.image} alt={copy.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 48vw" /></div>
          <div className={styles.heroCopy}><p>{copy.eyebrow}</p><h1>{copy.title}</h1><span>{copy.description}</span><TrackedLink href="#principles" onFocus={keepFocusVisible} className={styles.primaryAction} analyticsLabel={`${slug}_category_begin`} analyticsSurface="category_block_motion">{shared.heroCta}</TrackedLink><small>{shared.conceptNotice}</small></div>
          <div className={styles.counter} aria-hidden="true">01 — 04</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.principlesScene}`} data-category-scene id="principles" aria-label={shared.sceneLabels[1]}>
        <div className={styles.frame}>
          <div className={styles.sectionHeading}><p>{shared.principlesEyebrow}</p><h2><MultilineTitle value={shared.principlesTitle} /></h2></div>
          <div className={styles.principleGrid}>{copy.principles.map(([title, body], index) => <article key={title}><b>0{index + 1}</b><h3>{title}</h3><p>{body}</p></article>)}</div>
          <div className={styles.counter} aria-hidden="true">02 — 04</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.routesScene}`} data-category-scene aria-label={shared.sceneLabels[2]}>
        <div className={styles.frame}>
          <div className={styles.routeCopy}><p>{shared.routesEyebrow}</p><h2><MultilineTitle value={shared.routesTitle} /></h2><span>{shared.routesBody}</span></div>
          <nav className={styles.routeGrid} aria-label={shared.sceneLabels[2]}>{copy.routes.map(([title, body, href], index) => <TrackedLink key={title} href={localizePath(locale, href)} onFocus={keepFocusVisible} analyticsLabel={`${slug}_route_${index}`} analyticsSurface="category_block_motion"><b>0{index + 1}</b><h3>{title}</h3><span>{body}</span></TrackedLink>)}</nav>
          <div className={styles.counter} aria-hidden="true">03 — 04</div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.gateScene}`} data-category-scene aria-label={shared.sceneLabels[3]}>
        <div className={styles.frame}>
          <div className={styles.gateMedia} aria-hidden="true"><Image src={copy.image} alt="" fill sizes="(max-width: 900px) 100vw, 43vw" /></div>
          <div className={styles.gateCopy}><p>{shared.gateEyebrow}</p><h2><MultilineTitle value={shared.gateTitle} /></h2><span>{shared.gateBody}</span><div><TrackedLink href={localizePath(locale, "/shop")} onFocus={keepFocusVisible} className={styles.primaryAction} analyticsLabel={`${slug}_back_shop`} analyticsSurface="category_block_motion">{shared.backToShop}</TrackedLink><TrackedLink href="/trust" onFocus={keepFocusVisible} className={styles.secondaryAction} analyticsLabel={`${slug}_trust`} analyticsSurface="category_block_motion">{shared.trust}</TrackedLink></div></div>
          <div className={styles.counter} aria-hidden="true">04 — 04</div>
        </div>
      </section>
    </div>
  );
}
