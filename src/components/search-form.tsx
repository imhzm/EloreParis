"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import styles from "./search-form.module.css";

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
  const [query, setQuery] = useState(initialQuery);

  return (
    <form
      action={action}
      className={styles.form}
      method="get"
      onSubmit={() => {
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
      }}
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
          placeholder={placeholder}
          type="search"
          value={query}
        />
        <button type="submit">{buttonLabel}</button>
      </div>
    </form>
  );
}
