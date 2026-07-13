"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { predictSearch } from "@/app/actions/search";
import type { SearchResult } from "@/lib/search";
import styles from "./search-form.module.css";
import { TrackedLink } from "./tracked-link";

type SearchFormProps = {
  initialQuery?: string;
  analyticsSurface: string;
  action?: string;
  buttonLabel?: string;
  placeholder?: string;
};

export function SearchForm({
  initialQuery = "",
  analyticsSurface,
  action = "/search",
  buttonLabel = "ابحثي الآن",
  placeholder = "ابحثي عن منتج أو مكوّن أو روتين أو مشكلة",
}: SearchFormProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [predictiveResults, setPredictiveResults] = useState<{ total: number; items: SearchResult[] } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      startTransition(() => {
        setPredictiveResults(null);
      });
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const result = await predictSearch(trimmedQuery);
          setPredictiveResults({ total: result.total, items: result.topResults });
        } catch {
          setPredictiveResults(null);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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
    router.push(`${action}?q=${encodeURIComponent(trimmedQuery)}`);
  }, [query, analyticsSurface, pathname, action, router]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit(event);
    } else if (event.key === "Escape") {
      setIsFocused(false);
    }
  };

  const showPredictive = isFocused && predictiveResults && query.trim().length >= 2;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <form
        action={action}
        className={styles.form}
        method="get"
        onSubmit={handleSubmit}
        role="search"
      >
        <label className={styles.label} htmlFor="site-search-query">
          ابحثي داخل Cozmateks
        </label>
        <div className={styles.fieldRow}>
          <input
            id="site-search-query"
            name="q"
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            type="search"
            value={query}
            autoComplete="off"
            role="combobox"
            aria-expanded={showPredictive ? "true" : "false"}
            aria-controls="predictive-results"
            aria-owns="predictive-results"
          />
          <button type="submit" aria-busy={isPending}>
            {isPending ? "..." : buttonLabel}
          </button>
        </div>
      </form>

      {showPredictive && (
        <div id="predictive-results" className={styles.predictivePanel} role="listbox">
          {predictiveResults.items.length > 0 ? (
            <div className={styles.predictiveList}>
              {predictiveResults.items.map((item, index) => (
                <TrackedLink
                  key={`${item.kind}-${item.slug}`}
                  href={item.href}
                  className={styles.predictiveItem}
                  onClick={() => setIsFocused(false)}
                  analyticsEvent="search_result_click"
                  analyticsLabel={`predictive_click_${item.kind}_${item.slug}`}
                  analyticsSurface={`${analyticsSurface}_predictive`}
                  analyticsDestinationType={item.kind}
                  analyticsProperties={{
                    result_rank: index + 1,
                  }}
                  role="option"
                  aria-selected="false"
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
                  عرض كل النتائج ({predictiveResults.total})
                </button>
              )}
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>لم نجد نتائج مطابقة لـ &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
