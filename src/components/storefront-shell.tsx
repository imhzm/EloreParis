import Image from "next/image";
import type { ReactNode } from "react";
import { CartStatusLink } from "@/components/cart-status-link";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { TrackedLink } from "@/components/tracked-link";
import { localizePath, shellCopy, type Locale } from "@/lib/i18n";
import styles from "./storefront-shell.module.css";

type StorefrontShellProps = {
  activeHref: string;
  children: ReactNode;
  locale?: Locale;
  languageHref?: string;
};

export function StorefrontShell({
  activeHref,
  children,
  locale = "ar",
  languageHref,
}: StorefrontShellProps) {
  const copy = shellCopy[locale];
  const isOperationsSurface =
    activeHref === "/ops-access" || activeHref.startsWith("/ops");

  if (isOperationsSurface) {
    return (
      <div className={styles.opsShell} dir="rtl">
        <a className={styles.skipLink} href="#main-content">تخطي إلى المحتوى</a>
        <main className={styles.opsMain} id="main-content">{children}</main>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">{copy.skip}</a>

      <div className={styles.topRibbon}>
        <span>{copy.market}</span>
        <span>{copy.tagline}</span>
        <TrackedLink href={localizePath(locale, "/track-order")} analyticsLabel="header_track_order" analyticsSurface="top_ribbon">{copy.trackOrder}</TrackedLink>
      </div>

      <header className={styles.header}>
        <TrackedLink className={styles.brand} href={localizePath(locale, "/")} analyticsEvent="navigation_click" analyticsLabel="brand_home" analyticsSurface="header_brand" analyticsDestinationType="home">
          <Image src="/elore-assets/logo-horizontal-gold.png" alt="ÉLORÉ PARIS" width={260} height={82} priority />
        </TrackedLink>

        <nav className={styles.nav} aria-label={copy.navLabel}>
          {copy.nav.map(([itemHref, label]) => {
            const isActive = itemHref === "/" ? activeHref === "/" : activeHref.startsWith(itemHref);
            return (
              <TrackedLink
                key={itemHref}
                href={localizePath(locale, itemHref)}
                analyticsEvent="navigation_click"
                analyticsLabel={`nav_${itemHref === "/" ? "home" : itemHref.replaceAll("/", "_").replace(/^_+/, "")}`}
                analyticsSurface="header_nav"
                aria-current={isActive ? "page" : undefined}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                {label}
              </TrackedLink>
            );
          })}
        </nav>

        <div className={styles.headerActions}>
          <TrackedLink href={localizePath(locale, "/search")} className={styles.searchLink} analyticsLabel="header_search" analyticsSurface="header_actions" analyticsDestinationType="search" aria-label={copy.searchLabel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          </TrackedLink>
          <CartStatusLink href={localizePath(locale, "/cart")} className={styles.cartLink} badgeClassName={styles.cartBadge} label={copy.cart} countLabel={copy.cartCountLabel} />
          <TrackedLink href={languageHref ?? copy.languageHref} className={styles.searchLink} analyticsLabel="header_language_switch" analyticsSurface="header_actions" aria-label={copy.languageLabel}>
            {locale === "ar" ? "EN" : "AR"}
          </TrackedLink>
          <MobileNavDrawer activeHref={activeHref} locale={locale} languageHref={languageHref} />
        </div>
      </header>

      <main className={styles.main} id="main-content">{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/elore-assets/logo-horizontal-ivory.png" alt="ÉLORÉ PARIS" width={260} height={82} />
          <p>{copy.footerBody}</p>
          <span>{copy.footerStatus}</span>
        </div>
        <div className={styles.footerPanel}>
          <h2>{copy.policyTitle}</h2>
          <div className={styles.footerLinks}>
            {copy.policies.map(([itemHref, label]) => <TrackedLink key={itemHref} href={localizePath(locale, itemHref)} analyticsEvent="navigation_click" analyticsLabel={`footer_${itemHref.replaceAll("/", "_")}`} analyticsSurface="footer_policies">{label}</TrackedLink>)}
          </div>
        </div>
        <div className={styles.footerPanel}>
          <h2>{copy.supportTitle}</h2>
          <div className={styles.footerLinks}>
            {copy.support.map(([itemHref, label]) => <TrackedLink key={itemHref} href={localizePath(locale, itemHref)} analyticsEvent="navigation_click" analyticsLabel={`footer_support_${itemHref.replaceAll("/", "_").replace(/^_+/, "")}`} analyticsSurface="footer_support">{label}</TrackedLink>)}
          </div>
        </div>
        <div className={styles.footerBottom}><span>© ÉLORÉ PARIS</span><span>{copy.footerTagline}</span></div>
      </footer>
    </div>
  );
}
