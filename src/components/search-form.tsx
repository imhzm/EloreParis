"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { predictSearch } from "@/app/actions/search";
import { localizePath, type Locale } from "@/lib/i18n";
import type { SearchResult } from "@/lib/search";
import styles from "./search-form.module.css";
import { TrackedLink } from "./tracked-link";

type SearchFormProps = {
  initialQuery?: string;
  analyticsSurface: string;
  action?: string;
  buttonLabel?: string;
  placeholder?: string;
  locale?: Locale;
};

export function SearchForm({
  initialQuery = "",
  analyticsSurface,
  action,
  buttonLabel,
  placeholder,
  locale = "ar",
}: SearchFormProps) {
  const copy = locale === "ar"
    ? { label: "ابحثي داخل ÉLORÉ PARIS", button: "اعرضي النتائج", placeholder: "ابحثي عن فئة أو مكوّن أو روتين", all: "عرض كل النتائج", none: "لم نجد نتيجة مطابقة" }
    : { label: "Search ÉLORÉ PARIS", button: "Show results", placeholder: "Search a category, ingredient or ritual", all: "View all results", none: "No matching result" };
  const resolvedAction = action ?? localizePath(locale, "/search");
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [predictiveResults, setPredictiveResults] = useState<{ total: number; items: SearchResult[] } | null>(null);
  const [predictiveState, setPredictiveState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [isFocused, setIsFocused] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const requestSequenceRef = useRef(0);
  const generatedId = useId().replace(/:/g, "");
  const inputId = `site-search-query-${generatedId}`;
  const listboxId = `predictive-results-${generatedId}`;
  const statusId = `predictive-status-${generatedId}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setActiveResultIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const requestSequence = ++requestSequenceRef.current;
    let cancelled = false;

    if (trimmedQuery.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      setPredictiveState("loading");
      void predictSearch(trimmedQuery, locale)
        .then((result) => {
          if (cancelled || requestSequence !== requestSequenceRef.current) return;
          startTransition(() => {
            setPredictiveResults({ total: result.total, items: result.topResults });
            setPredictiveState("ready");
          });
        })
        .catch(() => {
          if (cancelled || requestSequence !== requestSequenceRef.current) return;
          startTransition(() => {
            setPredictiveResults(null);
            setPredictiveState("error");
          });
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [locale, query]);

  const handleSubmit = useCallback((event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    const trimmedQuery = query.trim();

    trackAnalyticsEvent("search_submit", {
      surface: analyticsSurface,
      source_path: pathname,
      source_page_type: getPageType(pathname),
      query_length: trimmedQuery.length,
      query_token_count: trimmedQuery ? trimmedQuery.split(/\s+/).length : 0,
      has_arabic: /[\u0600-\u06FF]/.test(trimmedQuery),
      has_latin: /[A-Za-z]/.test(trimmedQuery),
      is_empty: trimmedQuery.length === 0,
    });

    setIsFocused(false);
    setActiveResultIndex(-1);
    router.push(`${resolvedAction}?q=${encodeURIComponent(trimmedQuery)}`);
  }, [query, analyticsSurface, pathname, resolvedAction, router]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const items = predictiveResults?.items ?? [];

    if (event.key === "ArrowDown" && items.length > 0) {
      event.preventDefault();
      setIsFocused(true);
      setActiveResultIndex((current) => (current + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length > 0) {
      event.preventDefault();
      setIsFocused(true);
      setActiveResultIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeResultIndex >= 0 && items[activeResultIndex]) {
      event.preventDefault();
      const item = items[activeResultIndex];
      trackAnalyticsEvent("search_result_click", {
        label: `predictive_click_${item.kind}_${item.slug}`,
        surface: `${analyticsSurface}_predictive`,
        source_path: pathname,
        source_page_type: getPageType(pathname),
        destination_path: item.href,
        destination_type: item.kind,
        result_rank: activeResultIndex + 1,
      });
      setIsFocused(false);
      setActiveResultIndex(-1);
      router.push(item.href);
    } else if (event.key === "Enter") {
      handleSubmit(event);
    } else if (event.key === "Escape") {
      setIsFocused(false);
      setActiveResultIndex(-1);
    } else if (event.key === "Tab") {
      setIsFocused(false);
      setActiveResultIndex(-1);
    }
  };

  const showPredictive = isFocused && predictiveResults && query.trim().length >= 2;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <form
        action={resolvedAction}
        className={styles.form}
        method="get"
        onSubmit={handleSubmit}
        role="search"
      >
        <label className={styles.label} htmlFor={inputId}>
          {copy.label}
        </label>
        <div className={styles.fieldRow}>
          <input
            id={inputId}
            name="q"
            onChange={(event) => {
              requestSequenceRef.current += 1;
              setQuery(event.target.value);
              setActiveResultIndex(-1);
              setPredictiveResults(null);
              setPredictiveState(event.target.value.trim().length >= 2 ? "loading" : "idle");
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? copy.placeholder}
            type="search"
            value={query}
            autoComplete="off"
            maxLength={120}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showPredictive ? "true" : "false"}
            aria-controls={listboxId}
            aria-activedescendant={showPredictive && activeResultIndex >= 0 ? `${listboxId}-option-${activeResultIndex}` : undefined}
            aria-describedby={statusId}
            aria-busy={predictiveState === "loading"}
          />
          <button type="submit" aria-busy={isPending}>
            {isPending ? "..." : (buttonLabel ?? copy.button)}
          </button>
        </div>
      </form>

      <p id={statusId} className={styles.liveStatus} aria-live="polite">
        {predictiveState === "loading"
          ? (locale === "ar" ? "جارٍ البحث" : "Searching")
          : predictiveState === "error"
            ? (locale === "ar" ? "تعذر تحميل الاقتراحات. يمكنك عرض صفحة النتائج." : "Suggestions could not load. You can still open the results page.")
            : predictiveState === "ready" && predictiveResults
              ? `${predictiveResults.total} ${locale === "ar" ? "نتيجة" : "results"}`
              : ""}
      </p>

      {showPredictive && (
        <div id={listboxId} className={styles.predictivePanel} role="listbox">
          {predictiveResults.items.length > 0 ? (
            <div className={styles.predictiveList}>
              {predictiveResults.items.map((item, index) => (
                <TrackedLink
                  id={`${listboxId}-option-${index}`}
                  key={`${item.kind}-${item.slug}`}
                  href={item.href}
                  // The keyboard-active row was an inline mint wash left over
                  // from the retired palette. Composited over the ivory panel it
                  // measured 1.04:1 — a sighted keyboard user could arrow
                  // through the list and never see which row they were on, then
                  // press Enter and navigate somewhere they could not identify.
                  // It is a class now, so the state carries real contrast and
                  // the colour lives with the rest of the theme.
                  className={`${styles.predictiveItem} ${activeResultIndex === index ? styles.predictiveItemActive : ""}`}
                  onClick={() => {
                    setIsFocused(false);
                    setActiveResultIndex(-1);
                  }}
                  analyticsEvent="search_result_click"
                  analyticsLabel={`predictive_click_${item.kind}_${item.slug}`}
                  analyticsSurface={`${analyticsSurface}_predictive`}
                  analyticsDestinationType={item.kind}
                  analyticsProperties={{
                    result_rank: index + 1,
                  }}
                  role="option"
                  aria-selected={activeResultIndex === index}
                  tabIndex={-1}
                >
                  <span className={styles.predictiveKind}>{item.eyebrow}</span>
                  <div className={styles.predictiveDetails}>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </TrackedLink>
              ))}
              {predictiveResults.total > 5 && (
                <button
                  type="button"
                  className={styles.viewAllButton}
                  onClick={() => handleSubmit()}
                >
                  {copy.all} ({predictiveResults.total})
                </button>
              )}
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>{copy.none}: &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
