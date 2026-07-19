"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SearchForm } from "@/components/search-form";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./search-dialog.module.css";

const copy = {
  ar: {
    open: "البحث داخل المتجر",
    close: "إغلاق البحث",
    eyebrow: "DISCOVER ÉLORÉ",
    title: "ماذا تبحثين عنه؟",
    body: "ابحثي حسب الفئة أو المكوّن أو الروتين. نعرض فقط المعلومات المتاحة من المصادر الحالية.",
    all: "افتحي صفحة البحث الكاملة",
  },
  en: {
    open: "Search the store",
    close: "Close search",
    eyebrow: "DISCOVER ÉLORÉ",
    title: "What are you looking for?",
    body: "Search by category, ingredient, or ritual. We show only information supported by the current sources.",
    all: "Open the full search page",
  },
} as const;

export function SearchDialog({ locale, className }: { locale: Locale; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const text = copy[locale];

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  const open = () => {
    setIsOpen(true);
    trackAnalyticsEvent("cta_click", {
      label: "header_search_open",
      surface: "header_actions",
      source_page_type: getPageType(window.location.pathname),
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    const searchInput = panelRef.current?.querySelector<HTMLInputElement>('input[type="search"]');
    (searchInput ?? first)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab" || !first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, isOpen]);

  return (
    <>
      <button ref={triggerRef} type="button" className={className} aria-label={text.open} aria-expanded={isOpen} aria-controls="store-search-dialog" onClick={open}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
      </button>

      {isOpen && typeof document !== "undefined" ? createPortal(
        <div className={styles.layer} dir={locale === "ar" ? "rtl" : "ltr"}>
          <button className={styles.backdrop} type="button" tabIndex={-1} aria-label={text.close} onClick={() => close()} />
          <div ref={panelRef} id="store-search-dialog" className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="store-search-title">
            <button className={styles.close} type="button" aria-label={text.close} onClick={() => close()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
            <header className={styles.header}>
              <p lang="en">{text.eyebrow}</p>
              <h2 id="store-search-title">{text.title}</h2>
              <span>{text.body}</span>
            </header>
            <SearchForm locale={locale} analyticsSurface="header_search_dialog" />
            <TrackedLink href={localizePath(locale, "/search")} className={styles.allResults} analyticsLabel="search_dialog_full_page" analyticsSurface="header_search_dialog" analyticsDestinationType="search" onClick={() => close(false)}>{text.all}</TrackedLink>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
