"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TrackedLink } from "@/components/tracked-link";
import { primaryNavigation } from "@/lib/site-content";
import styles from "./mobile-nav-drawer.module.css";

type MobileNavDrawerProps = {
  activeHref: string;
};

export function MobileNavDrawer({ activeHref }: MobileNavDrawerProps) {
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
        aria-label="فتح القائمة"
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
        <div ref={drawerRef} id="mobile-nav-drawer" className={`${styles.drawer} ${styles.drawerOpen}`} role="dialog" aria-modal="true" aria-label="القائمة الرئيسية">
        <div className={styles.drawerHeader}>
          <span className={styles.drawerBrand}>Cozmateks</span>
          <button
            className={styles.closeButton}
            onClick={close}
            aria-label="إغلاق القائمة"
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

        <nav className={styles.drawerNav} aria-label="التنقل الرئيسي">
          {primaryNavigation.map((item, index) => {
            const isActive =
              item.href === "/"
                ? activeHref === "/"
                : activeHref.startsWith(item.href);

            return (
              <TrackedLink
                key={item.href}
                href={item.href}
                analyticsEvent="navigation_click"
                analyticsLabel={`mobile_nav_${item.href === "/" ? "home" : item.href.replaceAll("/", "_").replace(/^_+/, "")}`}
                analyticsSurface="mobile_nav_drawer"
                aria-current={isActive ? "page" : undefined}
                className={`${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ""}`}
                onClick={close}
                style={{ animationDelay: `${80 + index * 40}ms` }}
              >
                <span className={styles.drawerLinkLabel}>{item.label}</span>
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
        </nav>

        <div className={styles.drawerFooter}>
          <p>Saudi premium beauty house</p>
        </div>
        </div>
      </>, document.body) : null}
    </>
  );
}
