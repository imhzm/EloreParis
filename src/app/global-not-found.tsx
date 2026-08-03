"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fontVariables } from "@/lib/fonts";
import { localeConfig } from "@/lib/i18n";
import styles from "./fallback.module.css";
import "./globals.css";

const notFoundCopy = {
  ar: {
    eyebrow: "404 | الصفحة غير موجودة",
    title: "الصفحة المطلوبة غير موجودة داخل المسار الحالي.",
    summary:
      "قد يكون الرابط قديمًا أو غير متاح في هذه النسخة. ابدئي من الصفحة الرئيسية للوصول إلى المسار الصحيح.",
    home: "العودة إلى الرئيسية",
    search: "البحث داخل المتجر",
  },
  en: {
    eyebrow: "404 | PAGE NOT FOUND",
    title: "This page is not available at this route.",
    summary:
      "The link may be outdated or unavailable in this build. Start from the homepage to reach the correct route.",
    home: "Return home",
    search: "Search the store",
  },
} as const;

/**
 * The global not-found, for URLs that match no route at all.
 *
 * There is no `src/app/layout.tsx` — the storefront and operations trees each
 * own a root layout under their own route group — so this file sits above every
 * layout and must render its own document. That also means it has no
 * CartProvider, which is why it deliberately does not use StorefrontShell: the
 * header's cart badge calls useCart and would throw here.
 *
 * It is a client component so the document language and direction follow the
 * URL prefix (`/en/*` gets `en-SA`/`ltr`, everything else stays on the Arabic
 * market entry point).
 */
export default function GlobalNotFound() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  // The global boundary sits above every route tree, so the server render has
  // no pathname. Keep the first paint deterministic (Arabic market entry) and
  // switch language/direction only after hydration to avoid error #418.
  const locale = mounted && pathname?.split("/")[1] === "en" ? "en" : "ar";
  const language = localeConfig[locale];
  const copy = notFoundCopy[locale];

  return (
    <html
      lang={language.htmlLang}
      dir={language.dir}
      className={fontVariables}
    >
      <body>
        <main className={styles.page}>
          <div className={styles.card}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1 className={styles.title}>{copy.title}</h1>
            <p className={styles.summary}>{copy.summary}</p>

            {/* Crossing from this root into the storefront root is a full page
                load either way; Link simply keeps prefetch and the router in
                charge of it. */}
            <div className={styles.actions}>
              <Link className={styles.primaryAction} href={`/${locale}`}>
                {copy.home}
              </Link>
              <Link className={styles.secondaryAction} href={`/${locale}/search`}>
                {copy.search}
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
