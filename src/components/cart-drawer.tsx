"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./cart-drawer.module.css";

const copy = {
  ar: { cart: "السلة", close: "إغلاق السلة", title: "اختياراتك", empty: "السلة تنتظر أول اختيار.", emptyBody: "استكشفي المجموعة، ثم عودي هنا لمراجعة المنتجات والبيانات الموثقة.", shop: "استكشفي المتجر", subtotal: "المجموع الأولي", checkout: "مراجعة الطلب", full: "عرض السلة كاملة", unavailable: "بعض العناصر تحتاج مراجعة قبل المتابعة.", loading: "جارٍ التحقق من السلة…", item: "عنصر" },
  en: { cart: "Cart", close: "Close cart", title: "Your selection", empty: "Your cart is ready for a first choice.", emptyBody: "Explore the collection, then return here to review products and verified details.", shop: "Explore the shop", subtotal: "Preliminary subtotal", checkout: "Review order", full: "View full cart", unavailable: "Some items need review before you continue.", loading: "Verifying your cart…", item: "item" },
} as const;

export function CartDrawer({ locale, className, badgeClassName }: { locale: Locale; className?: string; badgeClassName?: string }) {
  const { cartCount, catalogStatus, isHydrated, lines, subtotal, unavailableItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const text = copy[locale];
  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const open = () => {
    setIsOpen(true);
    trackAnalyticsEvent("cta_click", { label: "header_cart_open", source_page_type: getPageType(window.location.pathname), surface: "header_cart_drawer", item_count: cartCount });
  };

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    first?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab" || !first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [close, isOpen]);

  return (
    <>
      <button ref={triggerRef} type="button" className={className} aria-label={isHydrated && cartCount > 0 ? `${text.cart}، ${cartCount} ${text.item}` : text.cart} aria-expanded={isOpen} aria-controls="header-cart-drawer" onClick={open}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5.5 8h13l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.4H8.2a1.6 1.6 0 0 1-1.6-1.4L5.5 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 10.5V7a3 3 0 1 1 6 0v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <span aria-hidden="true">{text.cart}</span>
        {isHydrated && cartCount > 0 ? <span className={badgeClassName} aria-hidden="true">{cartCount}</span> : null}
      </button>

      {isOpen && typeof document !== "undefined" ? createPortal(
        <div className={styles.layer} dir={locale === "ar" ? "rtl" : "ltr"}>
          <button className={styles.backdrop} type="button" tabIndex={-1} aria-label={text.close} onClick={() => close()} />
          <aside ref={panelRef} id="header-cart-drawer" className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
            <header className={styles.header}>
              <div><p lang="en">ÉLORÉ SELECTION</p><h2 id="cart-drawer-title">{text.title}</h2></div>
              <button className={styles.close} type="button" aria-label={text.close} onClick={() => close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
            </header>

            <div className={styles.content}>
              {!isHydrated ? <p className={styles.status}>{text.loading}</p> : lines.length === 0 ? (
                <div className={styles.empty}><span>01</span><h3>{text.empty}</h3><p>{text.emptyBody}</p><TrackedLink href={localizePath(locale, "/shop")} onClick={() => close(false)} analyticsLabel="cart_drawer_empty_shop" analyticsSurface="header_cart_drawer">{text.shop}</TrackedLink></div>
              ) : (
                <>
                  <div className={styles.lines}>
                    {lines.slice(0, 3).map((line) => {
                      const media = line.product.media[0];
                      return <article key={line.key} className={styles.line}>
                        <div className={styles.media}>{media ? <Image src={media.url} alt="" fill sizes="84px" /> : <span aria-hidden="true">É</span>}</div>
                        <div><h3>{line.product.name}</h3><p>{line.variant.label} · {line.variant.size}</p><span>{line.quantity} × {line.variant.price} {locale === "ar" ? "ر.س" : "SAR"}</span></div>
                      </article>;
                    })}
                  </div>
                  {lines.length > 3 ? <p className={styles.more}>+{lines.length - 3} {text.item}</p> : null}
                  {catalogStatus !== "ready" || unavailableItems.length ? <p className={styles.warning}>{text.unavailable}</p> : null}
                </>
              )}
            </div>

            <footer className={styles.footer}>
              <div><span>{text.subtotal}</span><strong>{subtotal} {locale === "ar" ? "ر.س" : "SAR"}</strong></div>
              <TrackedLink href={localizePath(locale, "/cart")} className={styles.secondary} onClick={() => close(false)} analyticsLabel="cart_drawer_full_cart" analyticsSurface="header_cart_drawer">{text.full}</TrackedLink>
              {lines.length > 0 && catalogStatus === "ready" && unavailableItems.length === 0 ? <TrackedLink href={localizePath(locale, "/checkout")} className={styles.primary} onClick={() => close(false)} analyticsLabel="cart_drawer_checkout" analyticsSurface="header_cart_drawer">{text.checkout}</TrackedLink> : null}
            </footer>
          </aside>
        </div>, document.body,
      ) : null}
    </>
  );
}
