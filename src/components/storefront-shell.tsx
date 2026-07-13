import Image from "next/image";
import type { ReactNode } from "react";
import { CartStatusLink } from "@/components/cart-status-link";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { TrackedLink } from "@/components/tracked-link";
import { footerPolicyLinks, footerSupportLinks, primaryNavigation, trustPoints } from "@/lib/site-content";
import styles from "./storefront-shell.module.css";

type StorefrontShellProps = { activeHref: string; children: ReactNode };

export function StorefrontShell({ activeHref, children }: StorefrontShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">تخطي إلى المحتوى</a>

      <div className={styles.topRibbon}>
        <span>{trustPoints[1]}</span><span>{trustPoints[0]}</span><TrackedLink href="/track-order" analyticsLabel="header_track_order" analyticsSurface="top_ribbon">تتبّع طلبك ←</TrackedLink>
      </div>

      <header className={styles.header}>
        <TrackedLink className={styles.brand} href="/" analyticsEvent="navigation_click" analyticsLabel="brand_home" analyticsSurface="header_brand" analyticsDestinationType="home">
          <Image src="/brand-assets/cozmateks-logo.png" alt="Cozmateks Cosmetics" width={200} height={62} priority />
        </TrackedLink>

        <nav className={styles.nav} aria-label="التنقل الرئيسي">
          {primaryNavigation.slice(0, 6).map((item) => {
            const isActive = item.href === "/" ? activeHref === "/" : activeHref.startsWith(item.href);
            return <TrackedLink key={item.href} href={item.href} analyticsEvent="navigation_click" analyticsLabel={`nav_${item.href === "/" ? "home" : item.href.replaceAll("/", "_").replace(/^_+/, "")}`} analyticsSurface="header_nav" aria-current={isActive ? "page" : undefined} className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}>{item.label}</TrackedLink>;
          })}
        </nav>

        <div className={styles.headerActions}>
          <TrackedLink href="/search" className={styles.searchLink} analyticsLabel="header_search" analyticsSurface="header_actions" analyticsDestinationType="search" aria-label="البحث داخل المتجر">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          </TrackedLink>
          <CartStatusLink className={styles.cartLink} badgeClassName={styles.cartBadge} />
          <MobileNavDrawer activeHref={activeHref} />
        </div>
      </header>

      <main className={styles.main} id="main-content">{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/brand-assets/cozmateks-logo.png" alt="Cozmateks Cosmetics" width={210} height={65} />
          <p>وجهة سعودية للعناية والجمال، تجمع المنتجات الأصلية مع تجربة اختيار أكثر وضوحًا.</p>
          <span>بيانات النشاط والسياسات النهائية قيد التحقق والاعتماد.</span>
        </div>
        <div className={styles.footerPanel}><h2>الثقة والسياسات</h2><div className={styles.footerLinks}>{footerPolicyLinks.slice(0, 5).map((item) => <TrackedLink key={item.href} href={item.href} analyticsEvent="navigation_click" analyticsLabel={`footer_${item.href.replaceAll("/", "_")}`} analyticsSurface="footer_policies">{item.label}</TrackedLink>)}</div></div>
        <div className={styles.footerPanel}><h2>خدمة الطلب</h2><div className={styles.footerLinks}>{footerSupportLinks.slice(0, 5).map((item) => <TrackedLink key={item.href} href={item.href} analyticsEvent="navigation_click" analyticsLabel={`footer_support_${item.href.replaceAll("/", "_")}`} analyticsSurface="footer_support">{item.label}</TrackedLink>)}</div></div>
        <div className={styles.footerBottom}><span>© Cozmateks</span><span>اختيار أوضح · عناية أقرب</span></div>
      </footer>
    </div>
  );
}
