import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
import { MultilineTitle } from "@/components/scene-primitives";
import { localizePath, type Locale } from "@/lib/i18n";
import {
  journalCopy,
  journalInterfaceCopy,
  type JournalRecord,
} from "@/lib/journal-content";
import type { EditorialAuthorityContent } from "@/lib/site-editorial-authority";
import styles from "./localized-journal-experience.module.css";

type HubProps = {
  locale: Locale;
  records: JournalRecord[];
  copy?: EditorialAuthorityContent["journalCopy"][Locale]["hub"];
  interfaceCopy?: EditorialAuthorityContent["journalInterfaceCopy"][Locale];
  heroImage?: string;
};

type ArticleProps = {
  locale: Locale;
  record: JournalRecord;
  relatedArticles: JournalRecord[];
  copy?: EditorialAuthorityContent["journalCopy"][Locale]["detail"];
  interfaceCopy?: EditorialAuthorityContent["journalInterfaceCopy"][Locale]["detail"];
};

function JournalCard({
  locale,
  record,
  index,
}: {
  locale: Locale;
  record: JournalRecord;
  index: number;
}) {
  return (
    <article className={styles.storyCard} data-journal-card>
      <TrackedLink
        href={`/${locale}/journal/${record.slug}`}
        analyticsLabel={`journal_directory_${record.slug}`}
        analyticsSurface="journal_magazine_grid"
      >
        <span className={styles.storyMedia} aria-hidden="true">
          <Image src={record.image} alt="" fill sizes="(max-width: 680px) 100vw, (max-width: 1050px) 50vw, 31vw" />
          <b>{String(index + 1).padStart(2, "0")}</b>
        </span>
        <span className={styles.storyBody}>
          <small>{record.category} · {record.readingLabel}</small>
          <h3>{record.title.replace("\n", " ")}</h3>
          <span>{record.summary}</span>
        </span>
      </TrackedLink>
    </article>
  );
}

export function LocalizedJournalHub({ locale, records, copy: controlledCopy, interfaceCopy: controlledInterfaceCopy, heroImage }: HubProps) {
  const copy = controlledCopy ?? journalCopy[locale].hub;
  const interfaceCopy = controlledInterfaceCopy ?? journalInterfaceCopy[locale];
  const [featured, ...remainingStories] = records;

  return (
    <div className={styles.experience} data-journal-experience>
      <section className={styles.journalHero} data-journal-scene aria-labelledby="journal-title">
        <div className={styles.heroInner} data-journal-frame>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow} lang="en">{copy.eyebrow}</p>
            <h1 id="journal-title"><MultilineTitle value={copy.title} /></h1>
            <p className={styles.lead}>{copy.intro}</p>
            <TrackedLink
              className={styles.action}
              href="#journal-featured"
              analyticsLabel="journal_begin"
              analyticsSurface="journal_magazine_hero"
            >
              {copy.open}
            </TrackedLink>
            <small className={styles.notice}>{copy.notice}</small>
          </div>
          <div className={styles.heroMedia} data-journal-motion aria-hidden="true">
            <Image
              src={heroImage ?? "/elore-assets/editorial-skin-light-concept-1122w.avif"}
              alt=""
              fill
              priority
              sizes="(max-width: 880px) 100vw, 42vw"
            />
            <span>ÉDIT</span>
          </div>
        </div>
      </section>

      <section
        className={styles.featured}
        id="journal-featured"
        data-journal-scene
        aria-labelledby="journal-featured-title"
      >
        <div className={styles.featuredMedia} data-journal-motion>
          <Image src={featured.image} alt={featured.imageAlt} fill sizes="(max-width: 880px) 100vw, 46vw" />
        </div>
        <div className={styles.featuredCopy} data-journal-frame data-journal-featured>
          <p className={styles.eyebrow}>{featured.eyebrow}</p>
          <small>{featured.category} · {featured.readingLabel}</small>
          <h2 id="journal-featured-title"><MultilineTitle value={featured.title} /></h2>
          <p>{featured.summary}</p>
          <ul>{featured.takeaways.map((item) => <li key={item}>{item}</li>)}</ul>
          <TrackedLink
            className={styles.actionDark}
            href={`/${locale}/journal/${featured.slug}`}
            analyticsLabel={`journal_featured_${featured.slug}`}
            analyticsSurface="journal_featured_story"
          >
            {copy.open}
          </TrackedLink>
        </div>
      </section>

      <section className={styles.directory} data-journal-scene aria-labelledby="journal-directory-title">
        <header className={styles.sectionHeading} data-journal-frame>
          <p className={styles.eyebrow}>{copy.directory}</p>
          <h2 id="journal-directory-title"><MultilineTitle value={copy.directoryTitle} /></h2>
        </header>
        <div className={styles.storyGrid} data-journal-directory>
          {remainingStories.map((record, index) => (
            <JournalCard key={record.slug} locale={locale} record={record} index={index + 1} />
          ))}
        </div>
      </section>

      <section className={styles.lanes} data-journal-scene aria-labelledby="journal-lanes-title">
        <header className={styles.sectionHeading} data-journal-frame>
          <p className={styles.eyebrow} lang="en">{interfaceCopy.lensesEyebrow}</p>
          <h2 id="journal-lanes-title"><MultilineTitle value={copy.methodTitle} /></h2>
          <span>{copy.methodBody}</span>
        </header>
        <nav className={styles.laneGrid} data-journal-lanes aria-label={copy.methodTitle}>
          {interfaceCopy.lanes.map((lane) => (
            <TrackedLink
              key={lane.href}
              href={localizePath(locale, lane.href)}
              analyticsLabel={`journal_lane_${lane.number}`}
              analyticsSurface="journal_editorial_lenses"
            >
              <b>{lane.number}</b>
              <h3>{lane.label}</h3>
              <span>{interfaceCopy.laneBody}</span>
            </TrackedLink>
          ))}
        </nav>
      </section>

      <section className={styles.close} data-journal-scene aria-labelledby="journal-close-title" data-journal-close>
        <div>
          <p className={styles.eyebrow} lang="en">BEAUTY, CONSIDERED</p>
          <h2 id="journal-close-title"><MultilineTitle value={copy.closeTitle} /></h2>
        </div>
        <div>
          <p>{copy.notice}</p>
          <TrackedLink
            className={styles.action}
            href={localizePath(locale, "/routines")}
            analyticsLabel="journal_close_routines"
            analyticsSurface="journal_magazine_close"
          >
            {copy.closeCta}
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}

export function LocalizedJournalArticle({ locale, record, relatedArticles, copy: controlledCopy, interfaceCopy: controlledInterfaceCopy }: ArticleProps) {
  const copy = controlledCopy ?? journalCopy[locale].detail;
  const interfaceCopy = controlledInterfaceCopy ?? journalInterfaceCopy[locale].detail;

  return (
    <article className={styles.experience} data-article-experience>
      <header className={styles.articleHero} data-article-scene aria-labelledby="article-title">
        <div className={styles.articleHeroInner} data-article-frame>
          <div className={styles.articleMedia} data-journal-motion>
            <Image
              src={record.image}
              alt={record.imageAlt}
              fill
              priority
              sizes="(max-width: 880px) 100vw, 43vw"
            />
          </div>
          <div className={styles.articleHeroCopy} data-article-meta>
            <p className={styles.eyebrow}>{record.eyebrow}</p>
            <small>{record.category} · {record.readingLabel}</small>
            <h1 id="article-title"><MultilineTitle value={record.title} /></h1>
            <p>{record.summary}</p>
            <TrackedLink
              className={styles.action}
              href="#article-answer"
              analyticsLabel={`${record.slug}_answer`}
              analyticsSurface="article_editorial_hero"
            >
              {copy.answer}
            </TrackedLink>
            <em className={styles.disclaimer}>{copy.disclaimer}</em>
          </div>
        </div>
      </header>

      <div className={styles.articleLayout}>
        <aside className={styles.articleRail}>
          <nav className={styles.toc} data-article-toc aria-label={copy.chapters}>
            <p>{copy.chapters}</p>
            <a href="#article-answer">{copy.answer}</a>
            {record.sections.map((section, index) => (
              <a key={section.title} href={`#chapter-${index + 1}`}>
                {String(index + 1).padStart(2, "0")} {section.title}
              </a>
            ))}
            <a href="#article-questions">{copy.questions}</a>
          </nav>
        </aside>

        <div className={styles.articleBody}>
          <section className={styles.answer} id="article-answer" data-article-scene aria-labelledby="article-answer-title">
            <div data-article-frame>
              <p className={styles.eyebrow}>{copy.answer}</p>
              <h2 id="article-answer-title">{record.answer}</h2>
            </div>
            <ol className={styles.takeaways} data-article-takeaways>
              {record.takeaways.map((item, index) => (
                <li key={item}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span></li>
              ))}
            </ol>
          </section>

          <section className={styles.guide} data-article-scene aria-labelledby="article-guide-title">
            <header className={styles.sectionIntro} data-article-frame>
              <p className={styles.eyebrow}>{copy.chapters}</p>
              <h2 id="article-guide-title">{interfaceCopy.guideTitle}</h2>
            </header>
            <div className={styles.chapterList} data-article-chapters>
              {record.sections.map((section, index) => (
                <section key={section.title} id={`chapter-${index + 1}`}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
          </section>

          <section className={styles.faqBlock} id="article-questions" data-article-scene aria-labelledby="article-faq-title">
            <header className={styles.sectionIntro} data-article-frame>
              <p className={styles.eyebrow}>{copy.questions}</p>
              <h2 id="article-faq-title">{interfaceCopy.faqTitle}</h2>
            </header>
            <div className={styles.faqList} data-article-faq>
              {record.faqs.map(([question, answer]) => (
                <details key={question}><summary>{question}</summary><p>{answer}</p></details>
              ))}
            </div>
          </section>

          <section className={styles.relatedBlock} data-article-scene aria-labelledby="article-related-title">
            <header className={styles.sectionIntro} data-article-frame>
              <p className={styles.eyebrow}>{copy.related}</p>
              <h2 id="article-related-title">{interfaceCopy.relatedTitle}</h2>
            </header>
            <nav className={styles.relatedGrid} data-article-related aria-label={copy.related}>
              {record.related.map((link, index) => (
                <TrackedLink
                  key={link.href}
                  href={localizePath(locale, link.href)}
                  analyticsLabel={`${record.slug}_related_path_${index}`}
                  analyticsSurface="article_related"
                >
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <h3>{link.title}</h3>
                  <span>{link.body}</span>
                </TrackedLink>
              ))}
              {relatedArticles.map((article, index) => (
                <TrackedLink
                  key={article.slug}
                  href={`/${locale}/journal/${article.slug}`}
                  analyticsLabel={`${record.slug}_related_article_${index}`}
                  analyticsSurface="article_related"
                >
                  <b>J{index + 1}</b>
                  <h3>{article.title.replace("\n", " ")}</h3>
                  <span>{article.summary}</span>
                </TrackedLink>
              ))}
            </nav>
            <TrackedLink
              className={styles.backLink}
              href={`/${locale}/journal`}
              analyticsLabel={`${record.slug}_back`}
              analyticsSurface="article_footer"
            >
              {copy.back}
            </TrackedLink>
          </section>
        </div>
      </div>
    </article>
  );
}
