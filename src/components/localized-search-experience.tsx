"use client";

import Image from "next/image";
import { SearchForm } from "@/components/search-form";
import { TrackedLink } from "@/components/tracked-link";
import { useScrollSceneProgress } from "@/hooks/use-scroll-scene-progress";
import { localizePath, type Locale } from "@/lib/i18n";
import { popularSearchQueriesByLocale, type SearchResult, type SearchResultKind } from "@/lib/search";
import { searchPageCopy } from "@/lib/search-page-data";
import styles from "./localized-search-experience.module.css";
import { MultilineTitle, keepFocusVisible } from "@/components/scene-primitives";

type SearchGroups = Record<SearchResultKind, SearchResult[]>;

export function LocalizedSearchExperience({ locale, query, total, groups }: { locale: Locale; query: string; total: number; groups: SearchGroups }) {
  const rootRef = useScrollSceneProgress<HTMLDivElement>({ selector: "[data-search-scene]" });
  const copy = searchPageCopy[locale];
  const popular = popularSearchQueriesByLocale[locale];
  const groupOrder: SearchResultKind[] = ["collection", "concern", "routine", "ingredient", "article"];
  const visibleGroups = groupOrder.filter((kind) => groups[kind].length > 0);

  return <div ref={rootRef} className={styles.experience} data-search-experience>
    <section className={`${styles.scene} ${styles.hero}`} data-search-scene aria-labelledby="search-title"><div className={styles.frame} data-search-frame>
      <div className={styles.heroMedia} data-search-motion aria-hidden="true"><Image src="/elore-assets/transition-burgundy-satin-concept-1672w.avif" alt="" fill priority sizes="(max-width: 900px) 100vw, 48vw" /></div>
      <div className={styles.heroCopy}><p>{copy.eyebrow}</p><h1 id="search-title"><MultilineTitle value={copy.title} /></h1><span>{copy.intro}</span><SearchForm key={`${locale}:${query}`} locale={locale} initialQuery={query} analyticsSurface="localized_search_hero" /><small>{copy.concept}</small></div>
      <b className={styles.counter}>01 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.popular}`} data-search-scene aria-labelledby="search-popular-title"><div className={styles.frame} data-search-frame>
      <div className={styles.heading}><p>{copy.popularEyebrow}</p><h2 id="search-popular-title"><MultilineTitle value={copy.popularTitle} /></h2><span>{copy.popularBody}</span></div>
      <nav className={styles.popularList} aria-label={copy.popularEyebrow}>{popular.map((item, index) => <TrackedLink key={item.slug} href={`${localizePath(locale, "/search")}?q=${encodeURIComponent(item.query)}`} onFocus={keepFocusVisible} analyticsLabel={`localized_search_popular_${item.slug}`} analyticsSurface="localized_search_popular"><b>0{index + 1}</b><span>{item.label}</span></TrackedLink>)}</nav>
      <b className={styles.counter}>02 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.map}`} data-search-scene aria-labelledby="search-map-title"><div className={styles.frame} data-search-frame>
      <div className={styles.heading}><p>{copy.mapEyebrow}</p><h2 id="search-map-title"><MultilineTitle value={copy.mapTitle} /></h2></div>
      <div className={styles.mapList}>{copy.map.map(([number, title, body]) => <article key={number}><b>{number}</b><h3>{title}</h3><p>{body}</p></article>)}</div>
      <b className={styles.counter}>03 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.results}`} data-search-scene aria-labelledby="search-results-title"><div className={styles.frame} data-search-frame data-search-results>
      <div className={styles.resultsHead}><p>{copy.resultsEyebrow}</p><h2 id="search-results-title"><MultilineTitle value={copy.resultsTitle} /></h2>{query && total > 0 ? <strong>{total} {copy.resultCount} · “{query}”</strong> : null}</div>
      {!query ? <div className={styles.resultState}><h3>{copy.startTitle}</h3><p>{copy.startBody}</p></div> : total === 0 ? <div className={styles.resultState}><h3>{copy.zeroTitle}</h3><p>{copy.zeroBody}</p><nav>{popular.slice(0, 3).map((item) => <TrackedLink key={item.slug} href={`${localizePath(locale, "/search")}?q=${encodeURIComponent(item.query)}`} onFocus={keepFocusVisible} analyticsLabel={`localized_search_zero_${item.slug}`} analyticsSurface="localized_search_zero">{item.label}</TrackedLink>)}</nav></div> : <div className={styles.resultGroups}>{visibleGroups.map((kind) => <section key={kind} aria-labelledby={`search-group-${kind}`}><header><p>{copy.groupLabels[kind]}</p><b>{String(groups[kind].length).padStart(2, "0")}</b></header><div>{groups[kind].map((item, index) => <TrackedLink key={`${kind}-${item.slug}`} href={item.href} onFocus={keepFocusVisible} analyticsEvent="search_result_click" analyticsLabel={`localized_search_${kind}_${item.slug}`} analyticsSurface="localized_search_results" analyticsDestinationType={kind} analyticsProperties={{ result_rank: index + 1 }}><small>{item.eyebrow}</small><h3>{item.title}</h3><span>{item.description}</span><strong>{item.metadata}</strong></TrackedLink>)}</div></section>)}</div>}
      <b className={styles.counter}>04 — 05</b>
    </div></section>

    <section className={`${styles.scene} ${styles.close}`} data-search-scene aria-labelledby="search-close-title"><div className={styles.frame} data-search-frame>
      <div className={styles.closeMark} aria-hidden="true">É</div><div className={styles.closeCopy}><p>{copy.closeEyebrow}</p><h2 id="search-close-title"><MultilineTitle value={copy.closeTitle} /></h2><span>{copy.closeBody}</span><TrackedLink className={styles.action} href={localizePath(locale, "/shop")} onFocus={keepFocusVisible} analyticsLabel="localized_search_close_shop" analyticsSurface="localized_search_close">{copy.closeCta}</TrackedLink></div>
      <b className={styles.counter}>05 — 05</b>
    </div></section>
  </div>;
}
