import type { Metadata } from "next";
import Link from "next/link";
import { fontVariables } from "@/lib/fonts";
import { localeConfig } from "@/lib/i18n";
import { previewNoindexRobots } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-content";
import styles from "./fallback.module.css";
import "./globals.css";

export const metadata: Metadata = {
  // This file sits at the app root, above both route groups, so it inherits no
  // metadataBase from a layout and has to declare its own — otherwise the
  // this page must resolve its own absolute metadata URLs.
  metadataBase: new URL(getSiteUrl()),
  title: "الصفحة غير موجودة | ÉLORÉ PARIS",
  robots: previewNoindexRobots,
  // A 404 does not advertise a social preview.
  openGraph: { images: [] },
};

const language = localeConfig.ar;

/**
 * The global not-found, for URLs that match no route at all.
 *
 * There is no `src/app/layout.tsx` — the storefront and operations trees each
 * own a root layout under their own route group — so this file sits above every
 * layout and must render its own document. That also means it has no
 * CartProvider, which is why it deliberately does not use StorefrontShell: the
 * header's cart badge calls useCart and would throw here.
 *
 * Nearly every real 404 is a bad slug beneath /ar or /en and is caught by
 * `(storefront)/[locale]/not-found.tsx`, which does get the full shell. This is
 * the last resort for an unmatched, locale-less path, so it stays deliberately
 * small and routes the visitor into the Arabic market entry point.
 */
export default function GlobalNotFound() {
  return (
    <html
      lang={language.htmlLang}
      dir={language.dir}
      className={fontVariables}
    >
      <body>
        <main className={styles.page}>
          <div className={styles.card}>
            <p className={styles.eyebrow}>404 | Not Found</p>
            <h1 className={styles.title}>
              الصفحة المطلوبة غير موجودة داخل المسار الحالي.
            </h1>
            <p className={styles.summary}>
              قد يكون الرابط قديمًا أو غير متاح في هذه النسخة. ابدئي من الصفحة
              الرئيسية للوصول إلى المسار الصحيح.
            </p>

            {/* Crossing from this root into the storefront root is a full page
                load either way; Link simply keeps prefetch and the router in
                charge of it. */}
            <div className={styles.actions}>
              <Link className={styles.primaryAction} href="/ar">
                العودة إلى الرئيسية
              </Link>
              <Link className={styles.secondaryAction} href="/ar/search">
                البحث داخل المتجر
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
