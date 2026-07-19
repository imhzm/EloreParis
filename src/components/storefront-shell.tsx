import Image from "next/image";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import { MegaShopMenu } from "@/components/mega-shop-menu";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { SearchDialog } from "@/components/search-dialog";
import { TrackedLink } from "@/components/tracked-link";
import { TrustServiceStrip } from "@/components/trust-service-strip";
import { localizePath, resolveActiveNavHref, shellCopy, type Locale } from "@/lib/i18n";
import { getEffectiveSiteContent } from "@/lib/site-content-authority";
import styles from "./storefront-shell.module.css";

type StorefrontShellProps = {
  activeHref: string;
  children: ReactNode;
  locale?: Locale;
  languageHref?: string;
  showServiceStrip?: boolean;
};

export function StorefrontShell({
  activeHref,
  children,
  locale = "ar",
  languageHref,
  showServiceStrip = true,
}: StorefrontShellProps) {
  const copy = { ...shellCopy[locale], ...getEffectiveSiteContent().shell[locale] };
  const isOperationsSurface =
    activeHref === "/ops-access" || activeHref.startsWith("/ops");

  const activeNavHref = resolveActiveNavHref(copy.nav, activeHref);

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

      {/* The reference concept centres the wordmark and splits the utilities
          either side of it, with navigation on its own row beneath. Laid out
          with logical properties, so the market control sits at the reading
          start in both directions rather than being pinned to one edge. */}
      <header className={styles.header}>
        <div className={styles.headerBar}>
          <div className={styles.marketControl}>
            {/* SAR is shown, not offered: the catalogue authority constrains
                currency to SAR in SQL, so a picker here would be a control that
                cannot do anything. */}
            <span className={styles.currency} lang="en">SAR</span>
            <span className={styles.marketDivider} aria-hidden="true" />
            <TrackedLink
              href={languageHref ?? copy.languageHref}
              className={styles.languageLink}
              analyticsLabel="header_language_switch"
              analyticsSurface="header_actions"
              lang={locale === "ar" ? "en" : "ar"}
            >
              {copy.languageLabel}
            </TrackedLink>
          </div>

          <TrackedLink className={styles.brand} href={localizePath(locale, "/")} analyticsEvent="navigation_click" analyticsLabel="brand_home" analyticsSurface="header_brand" analyticsDestinationType="home">
            {/* Not priority. This shell wraps all 109 prerendered pages, and a
                132–230px wordmark is never the LCP on any of them — so the
                preload it forced only ever stole a high-priority slot from
                whatever the real LCP was on that page. `sizes` gives it a
                w-descriptor srcset so it stops being chosen on DPR alone. */}
            <Image
              src="/elore-assets/logo-horizontal-gold.png"
              alt="ÉLORÉ PARIS"
              width={260}
              height={82}
              sizes="(max-width: 700px) 132px, 230px"
            />
          </TrackedLink>

          <div className={styles.headerActions}>
            <SearchDialog locale={locale} className={styles.searchLink} />
            <TrackedLink href={localizePath(locale, "/account/orders")} className={styles.accountLink} analyticsLabel="header_account" analyticsSurface="header_actions" analyticsDestinationType="account" aria-label={copy.account}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.25" /><path d="M5.75 19c.65-3.35 2.75-5.25 6.25-5.25S17.6 15.65 18.25 19" /></svg>
            </TrackedLink>
            <CartDrawer locale={locale} className={styles.cartLink} badgeClassName={styles.cartBadge} />
            <MobileNavDrawer activeHref={activeHref} locale={locale} languageHref={languageHref} copy={copy} />
          </div>
        </div>

        <nav className={styles.nav} aria-label={copy.navLabel}>
          {copy.nav.map(([itemHref, label]) => {
            const isActive = itemHref === activeNavHref;
            if (itemHref === "/shop") {
              return <MegaShopMenu key={itemHref} locale={locale} isActive={isActive} />;
            }
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
      </header>

      <main className={styles.main} id="main-content">{children}</main>

      {showServiceStrip ? <TrustServiceStrip locale={locale} copy={copy} /> : null}

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/elore-assets/logo-horizontal-ivory.png" alt="ÉLORÉ PARIS" width={260} height={82} />
          <p>{copy.footerBody}</p>
          <span>{copy.footerStatus}</span>
          <TrackedLink href={localizePath(locale, "/about")} className={styles.footerBrandLink} analyticsEvent="navigation_click" analyticsLabel="footer_about" analyticsSurface="footer_brand">{copy.aboutLabel}</TrackedLink>
        </div>
        <div className={styles.footerPanel}>
          <h2>{copy.shopTitle}</h2>
          <div className={styles.footerLinks}>
            {copy.shopLinks.map(([itemHref, label]) => <TrackedLink key={itemHref} href={localizePath(locale, itemHref)} analyticsEvent="navigation_click" analyticsLabel={`footer_shop_${itemHref.replaceAll("/", "_").replace(/^_+/, "")}`} analyticsSurface="footer_shop">{label}</TrackedLink>)}
          </div>
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
        <div className={styles.footerBottom}>
          <span>© ÉLORÉ PARIS</span>
          <span lang="en">Saudi Arabia · SAR</span>
          <TrackedLink href={languageHref ?? copy.languageHref} analyticsLabel="footer_language_switch" analyticsSurface="footer_meta" lang={locale === "ar" ? "en" : "ar"}>{copy.languageLabel}</TrackedLink>
          <span>{copy.footerTagline}</span>
        </div>
      </footer>
    </div>
  );
}
