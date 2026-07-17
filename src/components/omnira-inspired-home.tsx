"use client";

import Image from "next/image";
import { BentoCommerceGrid } from "@/components/bento-commerce-grid";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { TrackedLink } from "@/components/tracked-link";
import { useScrollSceneProgress } from "@/hooks/use-scroll-scene-progress";
import { homeCopy, localizePath, type Locale } from "@/lib/i18n";
import styles from "./omnira-inspired-home.module.css";

type Props = { locale: Locale };

export function OmniraInspiredHome({ locale }: Props) {
  const copy = homeCopy[locale];
  const href = (path: string) => localizePath(locale, path);
  const pageRef = useScrollSceneProgress<HTMLDivElement>({
    selector: "[data-home-scene]",
    enterEnd: 0.24,
    exitStart: 0.84,
  });

  return (
    <div ref={pageRef} className={styles.page}>
      <section className={`${styles.hero} ${styles.scene}`} data-home-scene aria-labelledby="home-title">
        <div className={styles.heroViewport} data-home-cinematic-viewport>
          <div className={styles.heroWorld} data-home-3d-world aria-hidden="true">
            <div className={styles.heroMedia}>
              <Image src="/elore-assets/hero-silk-champagne-concept-1672w.avif" alt="" fill priority sizes="100vw" />
            </div>
            <div className={`${styles.depthPlane} ${styles.depthPlaneOne}`} />
            <div className={`${styles.depthPlane} ${styles.depthPlaneTwo}`} />
            {/* Neither priority nor eager. This mark is display:none below
                900px, and a preload link carries no media condition, so every
                phone fetched it at top priority to render 0×0 pixels — against
                the real hero LCP. `sizes` cannot rescue it: with no layout box
                the browser cannot resolve a sizes query and falls back to the
                largest candidate, which measured *worse* (w=3840). Lazy is what
                actually works: a display:none element never intersects the
                viewport, so on a phone it is never fetched at all, while on
                desktop it is in the hero and loads normally. It is decorative
                (alt="", aria-hidden parent), so it is not an LCP candidate. */}
            <Image
              className={styles.floatingMark}
              src="/elore-assets/logo-mark-burgundy.png"
              alt=""
              width={605}
              height={808}
              loading="lazy"
              sizes="40vw"
            />
          </div>
          <div className={styles.heroShade} aria-hidden="true" />
          {/* The brand rail. CLAUDE.md §7.2 opens the hero spec with "Brand rail
              داكن في الجانب" and §11 lists HeroBrandRail as a component; it is
              the element the reference composition hangs on, and it was the one
              thing in that spec with no counterpart in the build.

              aria-hidden, and it costs nothing to say so: the wordmark is already
              the <h1>'s neighbour as a real <Image alt="ÉLORÉ PARIS">, and the
              lockup repeats the tagline the footer carries. To a screen reader
              this rail is the third recital of the same name.

              The mark is the burgundy PNG masked to gold rather than a second
              asset. It is line art with a real alpha channel, so the alpha IS the
              shape — mask it and the ink is whatever colour you name. */}
          <div className={styles.heroBrandRail} aria-hidden="true">
            <span className={styles.heroBrandRailMark} />
            {/* dir, not just lang. lang="en" names the language; it does not set
                direction, and the document is RTL. A trailing comma is a neutral
                character, so bidi hands it the paragraph's direction and
                "Beauty," rendered as "،Beauty" — the comma jumped to the far side
                of the word. Measured: two rects, the 4px comma laid out before
                the 45px word. Every other lang="en" string in this repo is a
                single all-caps run with no edge punctuation, which is why none of
                them has needed this yet. */}
            <span className={styles.heroBrandRailLockup} lang="en" dir="ltr">
              Beauty,<br />composed<br />with<br />intention
            </span>
          </div>
          <div className={styles.heroContent}>
            {/* `sizes` is what makes next/image emit a w-descriptor srcset.
                Without it the srcset is x-descriptors, which pick on device
                pixel ratio alone and ignore the layout box entirely: measured at
                390px/DPR2 this fetched the w=1920 candidate for a slot that
                renders 230px wide. Keeps priority — it is in the hero. */}
            <Image
              className={styles.heroLogo}
              src="/elore-assets/logo-horizontal-ivory.png"
              alt="ÉLORÉ PARIS"
              width={650}
              height={205}
              sizes="(max-width: 767px) 230px, 30vw"
              priority
            />
            <p className={styles.eyebrow} lang="en">{copy.hero.eyebrow}</p>
            <h1 id="home-title">{copy.hero.title}</h1>
            <p className={styles.lead}>{copy.hero.body}</p>
            <div className={styles.actions}>
              <TrackedLink href={href("/shop")} className={styles.primaryAction} analyticsLabel="home_hero_collection" analyticsSurface="elore_home">{copy.hero.primary}</TrackedLink>
              <TrackedLink href={href("/routines")} className={styles.secondaryAction} analyticsLabel="home_hero_routine" analyticsSurface="elore_home">{copy.hero.secondary}</TrackedLink>
            </div>
          </div>
          <p className={styles.scrollCue} aria-hidden="true"><span />SCROLL TO EXPLORE</p>
          <p className={styles.assetStatus}>{copy.hero.assetStatus}</p>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.productTruth}`} data-home-scene aria-labelledby="product-truth-title">
        <div className={styles.cinematicViewport} data-home-cinematic-viewport>
          <div className={styles.sectionFrame}>
            <div className={styles.sectionCopy}>
              <p className={styles.eyebrow} lang="en">{copy.productTruth.eyebrow}</p>
              <h2 id="product-truth-title">{copy.productTruth.title}</h2>
              <p>{copy.productTruth.body}</p>
              <p className={styles.dataGate}>{copy.productTruth.gate}</p>
            </div>
            <div className={styles.productStage} data-home-motion-layer="product-truth" aria-label={copy.productTruth.stageAria}>
              <div className={styles.productHalo} aria-hidden="true" />
              <div className={styles.productOrbit} aria-hidden="true"><i /><i /><i /></div>
              <div className={styles.productObject} data-home-3d-object aria-hidden="true">
                <div className={styles.productCap}><span /></div>
                <div className={styles.productShoulder} />
                <div className={styles.productGlass}>
                  <div className={styles.productLiquid} />
                  <div className={styles.productLabel}>
                    <Image src="/elore-assets/logo-mark-burgundy.png" alt="" width={210} height={280} />
                    <small lang="en">RITUEL N° 01</small>
                  </div>
                  <span className={styles.glassHighlight} />
                </div>
              </div>
              <div className={styles.productPedestal} aria-hidden="true"><span /></div>
              <span lang="en">{copy.productTruth.pending}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.textureScene}`} data-home-scene aria-labelledby="texture-title">
        <div className={styles.cinematicViewport} data-home-cinematic-viewport>
          <div className={styles.textureMedia} data-home-motion-layer="texture" aria-hidden="true">
            <Image src="/elore-assets/texture-skincare-serum-concept-1536w.avif" alt="" fill sizes="100vw" />
          </div>
          <div className={styles.textureReveal} aria-hidden="true" />
          <div className={styles.textureCopy}>
            <p className={styles.eyebrow} lang="en">{copy.texture.eyebrow}</p>
            <h2 id="texture-title">{copy.texture.title}</h2>
            <p>{copy.texture.body}</p>
          </div>
          <p className={styles.assetStatus}>{copy.texture.assetStatus}</p>
        </div>
      </section>

      {/* The bento grid from the approved reference concept replaces the older
          three-band intention list: same job — routing a visitor into the house
          — but it carries all six categories plus the editorial routes, and it
          is a card system with variants rather than one bespoke band. */}
      <section className={styles.bentoScene} aria-labelledby="intentions-title">
        <header className={styles.sectionHeading}>
          <p className={styles.eyebrow} lang="en">SHOP BY INTENTION</p>
          <h2 id="intentions-title">{copy.intentionsTitle}</h2>
        </header>
        <BentoCommerceGrid locale={locale} />
      </section>

      <section className={`${styles.scene} ${styles.routine}`} data-home-scene aria-labelledby="routine-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow} lang="en">ROUTINE, SIMPLIFIED</p>
          <h2 id="routine-title">{copy.routine.title}</h2>
          <p>{copy.routine.body}</p>
        </div>
        <div className={styles.routineSteps}>
          {copy.routine.steps.map(([number, title, body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
        <TrackedLink href={href("/routines")} className={styles.darkAction} analyticsLabel="home_routine_essentials" analyticsSurface="elore_home">{copy.routine.cta}</TrackedLink>
      </section>

      <section className={`${styles.scene} ${styles.shades}`} data-home-scene aria-labelledby="shade-title">
        <div className={styles.cinematicViewport} data-home-cinematic-viewport>
          <div className={styles.shadeBackdrop} data-home-motion-layer="shade" aria-hidden="true">
            <Image src="/elore-assets/texture-makeup-pigment-concept-1536w.avif" alt="" fill sizes="100vw" />
          </div>
          <div className={styles.shadePanel}>
            <p className={styles.eyebrow} lang="en">SHADE &amp; SKIN REALITY</p>
            <h2 id="shade-title">{copy.shades.title}</h2>
            <p>{copy.shades.body}</p>
            <span lang="en">{copy.shades.status}</span>
          </div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.story}`} data-home-scene aria-labelledby="story-title">
        <div className={styles.storyMedia} data-home-motion-layer="story" aria-hidden="true"><Image src="/elore-assets/editorial-skin-light-concept-1122w.avif" alt="" fill sizes="(max-width: 760px) 100vw, 48vw" /></div>
        <div className={styles.storyCopy}>
          <p className={styles.eyebrow} lang="en">PARIS, REFRAMED</p>
          <h2 id="story-title">{copy.story.title}</h2>
          <p>{copy.story.body}</p>
          <TrackedLink href={href("/about")} className={styles.textAction} analyticsLabel="home_story" analyticsSurface="elore_home">{copy.story.cta}</TrackedLink>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.proof}`} data-home-scene aria-labelledby="proof-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow} lang="en">WHY THE EXPERIENCE FEELS DIFFERENT</p>
          <h2 id="proof-title">{copy.proofTitle}</h2>
        </div>
        <div className={styles.proofGrid}>
          {copy.proof.map(([number, title, body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className={`${styles.scene} ${styles.gifting}`} data-home-scene aria-labelledby="gifting-title">
        <div className={styles.cinematicViewport} data-home-cinematic-viewport>
          <div className={styles.giftingMedia} data-home-motion-layer="gifting" aria-hidden="true"><Image src="/elore-assets/gifting-ribbon-ritual-concept-1536w.avif" alt="" fill sizes="100vw" /></div>
          <div className={styles.giftingCopy}>
            <p className={styles.eyebrow} lang="en">THE ART OF GIFTING</p>
            <h2 id="gifting-title">{copy.gifting.title}</h2>
            <p>{copy.gifting.body}</p>
            <TrackedLink href={href("/shop/beauty-sets")} className={styles.lightAction} analyticsLabel="home_gifting" analyticsSurface="elore_home">{copy.gifting.cta}</TrackedLink>
          </div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.edit}`} data-home-scene aria-labelledby="edit-title">
        <div className={styles.cinematicViewport} data-home-cinematic-viewport>
          <div className={styles.editTexture} data-home-motion-layer="edit" aria-hidden="true"><Image src="/elore-assets/transition-burgundy-satin-concept-1672w.avif" alt="" fill sizes="100vw" /></div>
          <div className={styles.editContent}>
            <Image src="/elore-assets/logo-horizontal-ivory.png" alt="ÉLORÉ PARIS" width={520} height={164} />
            <div className={styles.editEditorial}>
              <p className={styles.eyebrow} lang="en">THE BEAUTY EDIT</p>
              <h2 id="edit-title">{copy.edit.title}</h2>
              <p>{copy.edit.body}</p>
              <TrackedLink href={href("/journal")} className={styles.lightAction} analyticsLabel="home_beauty_edit" analyticsSurface="elore_home">{copy.edit.cta}</TrackedLink>
            </div>
            <div className={styles.newsletterPanel}>
              <NewsletterSignup locale={locale} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
