"use client";

import Image from "next/image";
import { SearchForm } from "@/components/search-form";
import { MultilineTitle } from "@/components/scene-primitives";
import { TrackedLink } from "@/components/tracked-link";
import { localizePath, type Locale } from "@/lib/i18n";
import {
  popularSearchQueriesByLocale,
  type SearchResult,
  type SearchResultKind,
} from "@/lib/search";
import { searchPageCopy } from "@/lib/search-page-data";
import styles from "./localized-search-experience.module.css";

type SearchGroups = Record<SearchResultKind, SearchResult[]>;

const catalogStateCopy = {
  ar: {
    available: "الكتالوج المنشور متصل بالبحث؛ تظهر هنا المنتجات المطابقة المعتمدة فقط.",
    unavailable: "لا توجد منتجات منشورة حاليًا؛ تبقى النتائج تعليمية حتى اعتماد الكتالوج.",
    availableTitle: "المعرفة والمنتج، ضمن مصدر واحد معتمد.",
    availableBody: "تظهر المنتجات والأسعار من الكتالوج المنشور فقط، بينما تظل المسارات التعليمية متاحة لمقارنة أوضح.",
  },
  en: {
    available: "The published catalogue is connected; only matching approved products appear here.",
    unavailable: "No products are published yet; results remain educational until the catalogue is approved.",
    availableTitle: "Knowledge and product, from one approved source.",
    availableBody: "Products and prices come only from the published catalogue, while educational routes remain available for a clearer decision.",
  },
} as const;

type Props = {
  locale: Locale;
  query: string;
  total: number;
  groups: SearchGroups;
  catalogAvailable: boolean;
};

export function LocalizedSearchExperience({
  locale,
  query,
  total,
  groups,
  catalogAvailable,
}: Props) {
  const copy = searchPageCopy[locale];
  const catalogCopy = catalogStateCopy[locale];
  const popular = popularSearchQueriesByLocale[locale];
  const groupOrder: SearchResultKind[] = [
    "product",
    "collection",
    "concern",
    "routine",
    "ingredient",
    "article",
  ];
  const visibleGroups = groupOrder.filter((kind) => groups[kind].length > 0);
  const catalogStatus = catalogAvailable
    ? catalogCopy.available
    : catalogCopy.unavailable;

  return (
    <div className={styles.experience} data-search-experience>
      <section className={styles.hero} data-search-scene aria-labelledby="search-title">
        <div className={styles.heroGrid} data-search-frame>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow} lang="en">{copy.eyebrow}</p>
            <h1 id="search-title"><MultilineTitle value={copy.title} /></h1>
            <p className={styles.intro}>{copy.intro}</p>
            <SearchForm
              key={`${locale}:${query}`}
              locale={locale}
              initialQuery={query}
              analyticsSurface="localized_search_hero"
            />
            <div
              className={styles.catalogStatus}
              data-catalog-state={catalogAvailable ? "available" : "gated"}
              role="status"
            >
              <span aria-hidden="true" />
              <p>{catalogStatus}</p>
            </div>
          </div>
          <div className={styles.heroMedia} data-search-motion aria-hidden="true">
            <Image
              src="/elore-assets/transition-burgundy-satin-concept-1672w.avif"
              alt=""
              fill
              priority
              sizes="(max-width: 840px) 100vw, 38vw"
            />
            <span>É</span>
          </div>
        </div>
      </section>

      <section className={styles.popular} data-search-scene aria-labelledby="search-popular-title">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow} lang="en">{copy.popularEyebrow}</p>
            <h2 id="search-popular-title"><MultilineTitle value={copy.popularTitle} /></h2>
          </div>
          <p>{copy.popularBody}</p>
        </div>
        <nav className={styles.popularList} aria-label={copy.popularEyebrow}>
          {popular.map((item, index) => (
            <TrackedLink
              key={item.slug}
              href={`${localizePath(locale, "/search")}?q=${encodeURIComponent(item.query)}`}
              analyticsLabel={`localized_search_popular_${item.slug}`}
              analyticsSurface="localized_search_popular"
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span>{item.label}</span>
            </TrackedLink>
          ))}
        </nav>
      </section>

      <section className={styles.results} data-search-scene aria-labelledby="search-results-title" data-search-results>
        <header className={styles.resultsHead}>
          <div>
            <p className={styles.eyebrow} lang="en">{copy.resultsEyebrow}</p>
            <h2 id="search-results-title"><MultilineTitle value={copy.resultsTitle} /></h2>
          </div>
          {query && total > 0 ? (
            <p className={styles.resultCount} aria-live="polite">
              <strong>{total}</strong> {copy.resultCount} · “{query}”
            </p>
          ) : null}
        </header>

        {!query ? (
          <div className={styles.resultState}>
            <span aria-hidden="true">01</span>
            <div><h3>{copy.startTitle}</h3><p>{copy.startBody}</p></div>
          </div>
        ) : total === 0 ? (
          <div className={styles.resultState}>
            <span aria-hidden="true">00</span>
            <div>
              <h3>{copy.zeroTitle}</h3>
              <p>{copy.zeroBody}</p>
              <nav aria-label={copy.popularEyebrow}>
                {popular.slice(0, 3).map((item) => (
                  <TrackedLink
                    key={item.slug}
                    href={`${localizePath(locale, "/search")}?q=${encodeURIComponent(item.query)}`}
                    analyticsLabel={`localized_search_zero_${item.slug}`}
                    analyticsSurface="localized_search_zero"
                  >
                    {item.label}
                  </TrackedLink>
                ))}
              </nav>
            </div>
          </div>
        ) : (
          <div className={styles.resultGroups}>
            {visibleGroups.map((kind) => (
              <section key={kind} aria-labelledby={`search-group-${kind}`}>
                <header>
                  <h3 id={`search-group-${kind}`}>{copy.groupLabels[kind]}</h3>
                  <b>{String(groups[kind].length).padStart(2, "0")}</b>
                </header>
                <div className={styles.resultList}>
                  {groups[kind].map((item, index) => (
                    <TrackedLink
                      key={`${kind}-${item.slug}`}
                      href={item.href}
                      analyticsEvent="search_result_click"
                      analyticsLabel={`localized_search_${kind}_${item.slug}`}
                      analyticsSurface="localized_search_results"
                      analyticsDestinationType={kind}
                      analyticsProperties={{ result_rank: index + 1 }}
                    >
                      <small>{item.eyebrow}</small>
                      <h4>{item.title}</h4>
                      <span>{item.description}</span>
                      <strong>{item.metadata}</strong>
                    </TrackedLink>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className={styles.map} data-search-scene aria-labelledby="search-map-title">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow} lang="en">{copy.mapEyebrow}</p>
            <h2 id="search-map-title"><MultilineTitle value={copy.mapTitle} /></h2>
          </div>
        </div>
        <div className={styles.mapList}>
          {copy.map.map(([number, title, body]) => (
            <article key={number}><b>{number}</b><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.close} data-search-scene aria-labelledby="search-close-title">
        <div>
          <p className={styles.eyebrow} lang="en">{copy.closeEyebrow}</p>
          <h2 id="search-close-title">
            <MultilineTitle value={catalogAvailable ? catalogCopy.availableTitle : copy.closeTitle} />
          </h2>
        </div>
        <div>
          <p>{catalogAvailable ? catalogCopy.availableBody : copy.closeBody}</p>
          <TrackedLink
            className={styles.action}
            href={localizePath(locale, "/shop")}
            analyticsLabel="localized_search_close_shop"
            analyticsSurface="localized_search_close"
          >
            {copy.closeCta}
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}
