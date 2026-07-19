import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
import { localizePath, type Locale } from "@/lib/i18n";
import {
  getTrustSupportVariant,
  supportContent,
  trustContent,
  trustHubCopy,
  trustSlugs,
  trustSupportUiCopy,
  type TrustSupportRecord,
  type TrustSupportVariant,
} from "@/lib/trust-support-content";
import styles from "./localized-trust-support-experience.module.css";

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

function DetailActions({
  locale,
  parentHref,
  record,
  variant,
}: {
  locale: Locale;
  parentHref: string;
  record: TrustSupportRecord;
  variant: TrustSupportVariant;
}) {
  const copy = trustSupportUiCopy[locale];
  const primary = variant === "brand"
    ? { href: localizePath(locale, "/shop"), label: copy.explore }
    : variant === "support"
      ? { href: localizePath(locale, "/faq"), label: copy.support }
      : variant === "faq"
        ? { href: localizePath(locale, "/trust"), label: copy.openTrust }
        : { href: localizePath(locale, parentHref), label: copy.backTrust };
  const secondary = variant === "support"
    ? { href: localizePath(locale, "/trust"), label: copy.openTrust }
    : variant === "faq"
      ? null
      : { href: localizePath(locale, "/faq"), label: copy.faq };

  return (
    <div className={styles.actions}>
      <TrackedLink
        className={styles.action}
        href={primary.href}
        analyticsLabel={`${record.slug}_primary`}
        analyticsSurface="trust_compact"
      >
        {primary.label}
      </TrackedLink>
      {secondary ? (
        <TrackedLink
          className={styles.textAction}
          href={secondary.href}
          analyticsLabel={`${record.slug}_secondary`}
          analyticsSurface="trust_compact"
        >
          {secondary.label}
        </TrackedLink>
      ) : null}
    </div>
  );
}

export function LocalizedTrustHub({ locale }: { locale: Locale }) {
  const copy = trustHubCopy[locale];
  const ui = trustSupportUiCopy[locale];
  const records = trustSlugs.map((slug) => trustContent[locale][slug]);

  return (
    <div
      className={`${styles.experience} ${styles.policy}`}
      data-trust-experience
      data-trust-variant="policy"
    >
      <header className={`${styles.shell} ${styles.hero}`} aria-labelledby="trust-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 id="trust-title">{copy.title}</h1>
          <p className={styles.lead}>{copy.intro}</p>
          <aside className={styles.statusNote} aria-label={ui.statusLabel}>
            <strong>{ui.statusLabel}</strong>
            <span>{copy.notice}</span>
          </aside>
          <TrackedLink
            className={styles.action}
            href="#trust-directory"
            analyticsLabel="trust_directory_begin"
            analyticsSurface="trust_compact"
          >
            {copy.directory}
          </TrackedLink>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <Image
            src="/elore-assets/editorial-skin-light-concept-1122w.avif"
            alt=""
            fill
            priority
            sizes="(max-width: 820px) 92vw, 38vw"
          />
          <span>É</span>
        </div>
      </header>

      <section className={`${styles.shell} ${styles.directorySection}`} id="trust-directory" aria-labelledby="trust-directory-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{copy.directory}</p>
            <h2 id="trust-directory-title">{copy.principlesTitle}</h2>
          </div>
          <p>{ui.directoryIntro}</p>
        </div>
        <nav aria-label={copy.directory}>
          <ol className={styles.directoryGrid}>
            {records.map((record, index) => (
              <li key={record.slug}>
                <TrackedLink
                  href={localizePath(locale, `/trust/${record.slug}`)}
                  analyticsLabel={`trust_${record.slug}`}
                  analyticsSurface="trust_compact"
                >
                  <span className={styles.cardNumber} aria-hidden="true">0{index + 1}</span>
                  <small>{record.eyebrow}</small>
                  <h3>{record.title.replace("\n", " ")}</h3>
                  <p>{record.summary}</p>
                  <strong>{copy.open}</strong>
                </TrackedLink>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section className={styles.closingBand} aria-labelledby="trust-next-title">
        <div className={`${styles.shell} ${styles.closingInner}`}>
          <div>
            <p className={styles.eyebrow}>{copy.principlesTitle.replace("\n", " ")}</p>
            <h2 id="trust-next-title">{copy.closeTitle}</h2>
            <p>{copy.intro}</p>
          </div>
          <TrackedLink
            className={styles.lightAction}
            href={localizePath(locale, "/faq")}
            analyticsLabel="trust_to_faq"
            analyticsSurface="trust_compact"
          >
            {copy.support}
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}

export function LocalizedTrustSupportDetail({
  locale,
  record,
  parentHref,
}: {
  locale: Locale;
  record: TrustSupportRecord;
  parentHref: string;
}) {
  const copy = trustSupportUiCopy[locale];
  const variant = getTrustSupportVariant(record.slug);

  return (
    <div
      className={`${styles.experience} ${styles[variant]}`}
      data-trust-experience
      data-trust-variant={variant}
    >
      <header className={`${styles.shell} ${styles.hero}`} aria-labelledby="trust-detail-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{record.eyebrow}</p>
          <h1 id="trust-detail-title">{record.title}</h1>
          <p className={styles.lead}>{record.summary}</p>
          <aside className={styles.statusNote} aria-label={copy.statusLabel}>
            <strong>{copy.statusLabel}</strong>
            <span>{record.status}</span>
          </aside>
          <TrackedLink
            className={styles.action}
            href="#trust-detail-sections"
            analyticsLabel={`${record.slug}_begin`}
            analyticsSurface="trust_compact"
          >
            {copy.readDetail}
          </TrackedLink>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <Image
            src={visualBySlug[record.slug] ?? visualBySlug.verification}
            alt=""
            fill
            priority
            sizes="(max-width: 820px) 92vw, 38vw"
          />
          <span>É</span>
        </div>
      </header>

      <section className={`${styles.shell} ${styles.detailSection}`} id="trust-detail-sections" aria-labelledby="trust-detail-sections-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{record.eyebrow}</p>
            <h2 id="trust-detail-sections-title">{copy.sectionHeading[variant]}</h2>
          </div>
          <p>{record.status}</p>
        </div>
        <div className={styles.sectionGrid}>
          {record.sections.map((section, index) => (
            <article key={section.title}>
              <span className={styles.cardNumber} aria-hidden="true">0{index + 1}</span>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              {section.points ? (
                <ul>
                  {section.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.shell} ${styles.questionsSection}`} aria-labelledby="trust-questions-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{copy.questionsEyebrow}</p>
            <h2 id="trust-questions-title">{copy.questionsTitle}</h2>
          </div>
          <p>{record.status}</p>
        </div>
        <div className={styles.faqList}>
          {record.faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.nextStep} aria-labelledby="trust-next-step-title">
        <div className={`${styles.shell} ${styles.nextStepInner}`}>
          <div>
            <p className={styles.eyebrow}>{copy.nextEyebrow}</p>
            <h2 id="trust-next-step-title">{copy.nextTitle[variant]}</h2>
            <p>{record.status}</p>
          </div>
          <DetailActions locale={locale} parentHref={parentHref} record={record} variant={variant} />
        </div>
      </section>
    </div>
  );
}

export const localizedSupportDirectory = supportContent;
