"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TrackedLink } from "@/components/tracked-link";
import { localizePath, shellCopy, type Locale } from "@/lib/i18n";
import styles from "./mobile-nav-drawer.module.css";

type MobileNavDrawerProps = {
  activeHref: string;
  locale?: Locale;
  languageHref?: string;
};

export function MobileNavDrawer({ activeHref, locale = "ar", languageHref }: MobileNavDrawerProps) {
  const copy = shellCopy[locale];
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    document.addEventListener("keydown", trapFocus);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", trapFocus);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        aria-label={copy.menuOpen}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        type="button"
      >
        <span className={styles.triggerBar} />
        <span className={styles.triggerBar} />
        <span className={styles.triggerBar} />
      </button>

      {isOpen && typeof document !== "undefined" ? createPortal(<>
        <div className={styles.backdrop} onClick={close} aria-hidden="true" />
        <div ref={drawerRef} id="mobile-nav-drawer" className={`${styles.drawer} ${styles.drawerOpen}`} role="dialog" aria-modal="true" aria-label={copy.navLabel} dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerBrand}>ÉLORÉ PARIS</span>
          <button
            className={styles.closeButton}
            onClick={close}
            aria-label={copy.menuClose}
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label={copy.navLabel}>
          {copy.nav.map(([itemHref, label], index) => {
            const isActive =
              itemHref === "/"
                ? activeHref === "/"
                : activeHref.startsWith(itemHref);

            return (
              <TrackedLink
                key={itemHref}
                href={localizePath(locale, itemHref)}
                analyticsEvent="navigation_click"
                analyticsLabel={`mobile_nav_${itemHref === "/" ? "home" : itemHref.replaceAll("/", "_").replace(/^_+/, "")}`}
                analyticsSurface="mobile_nav_drawer"
                aria-current={isActive ? "page" : undefined}
                className={`${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ""}`}
                onClick={close}
                style={{ animationDelay: `${80 + index * 40}ms` }}
              >
                <span className={styles.drawerLinkLabel}>{label}</span>
                <svg
                  className={styles.drawerLinkArrow}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10 4L6 8l4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TrackedLink>
            );
          })}
          <TrackedLink href={languageHref ?? copy.languageHref} className={styles.drawerLink} analyticsLabel="mobile_language_switch" analyticsSurface="mobile_nav_drawer" onClick={close}>
            <span className={styles.drawerLinkLabel}>{copy.languageLabel}</span>
          </TrackedLink>
        </nav>

        <div className={styles.drawerFooter}>
          <p>Saudi premium beauty house</p>
        </div>
        </div>
      </>, document.body) : null}
    </>
  );
}
