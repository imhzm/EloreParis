import type { ReactNode } from "react";
import { CartStatusLink } from "@/components/cart-status-link";
import { TrackedLink } from "@/components/tracked-link";
import {
  footerPolicyLinks,
  footerSupportLinks,
  primaryNavigation,
  siteTagline,
  trustPoints,
} from "@/lib/site-content";
import styles from "./storefront-shell.module.css";

type StorefrontShellProps = {
  activeHref: string;
  children: ReactNode;
};

export function StorefrontShell({
  activeHref,
  children,
}: StorefrontShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        تخطي إلى المحتوى
      </a>

      <div className={styles.topRibbon}>
        {trustPoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </div>

      <header className={styles.header}>
        <TrackedLink
          className={styles.brand}
          href="/"
          analyticsEvent="navigation_click"
          analyticsLabel="brand_home"
          analyticsSurface="header_brand"
          analyticsDestinationType="home"
        >
          Cozmateks
          <span>{siteTagline}</span>
        </TrackedLink>

        <div className={styles.headerActions}>
          <nav className={styles.nav} aria-label="التنقل الرئيسي">
            {primaryNavigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? activeHref === "/"
                  : activeHref.startsWith(item.href);

              return (
                <TrackedLink
                  key={item.href}
                  href={item.href}
                  analyticsEvent="navigation_click"
                  analyticsLabel={`nav_${item.href === "/" ? "home" : item.href.replaceAll("/", "_").replace(/^_+/, "")}`}
                  analyticsSurface="header_nav"
                  aria-current={isActive ? "page" : undefined}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                >
                  {item.label}
                </TrackedLink>
              );
            })}
          </nav>

          <CartStatusLink
            className={styles.cartLink}
            badgeClassName={styles.cartBadge}
          />
        </div>
      </header>

      <main className={styles.main} id="main-content">
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <strong>Cozmateks</strong>
          <p>
            واجهة متجر تجميل سعودي فاخر مبنية حول الاكتشاف الذكي، الثقة
            النظامية، والمحتوى العربي الأنيق.
          </p>
          <span>
            سيتم إدراج بيانات السجل والتوثيق الرسمية فور اعتماد بيانات المنشأة
            النهائية.
          </span>
        </div>

        <div className={styles.footerPanel}>
          <h2>روابط الثقة</h2>
          <div className={styles.footerLinks}>
            {footerPolicyLinks.map((item) => (
              <TrackedLink
                key={item.href}
                href={item.href}
                analyticsEvent="navigation_click"
                analyticsLabel={`footer_${item.href.replaceAll("/", "_").replace("#", "_")}`}
                analyticsSurface="footer_policies"
              >
                {item.label}
              </TrackedLink>
            ))}
          </div>
        </div>

        <div className={styles.footerPanel}>
          <h2>خدمات الطلب</h2>
          <div className={styles.footerLinks}>
            {footerSupportLinks.map((item) => (
              <TrackedLink
                key={item.href}
                href={item.href}
                analyticsEvent="navigation_click"
                analyticsLabel={`footer_support_${item.href.replaceAll("/", "_").replace(/^_+/, "")}`}
                analyticsSurface="footer_support"
              >
                {item.label}
              </TrackedLink>
            ))}
          </div>
        </div>

        <div className={styles.footerPanel}>
          <h2>تشغيل الواجهة</h2>
          <ul className={styles.footerList}>
            <li>واجهة عامة متوافقة مع SEO وAEO وGEO من البداية.</li>
            <li>مسارات شراء واضحة تربط بين الفئة والمشكلة والمكوّن والروتين.</li>
            <li>محتوى عربي احترافي بلا ادعاءات علاجية أو مبالغة تسويقية.</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
