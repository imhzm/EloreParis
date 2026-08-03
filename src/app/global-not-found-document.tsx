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
    title: "الصفحة المطلوبة غير موجودة داخل المسار الحالي.",
    summary:
      "قد يكون الرابط قديمًا أو غير متاح في هذه النسخة. ابدئي من الصفحة الرئيسية للوصول إلى المسار الصحيح.",
    documentTitle: "الصفحة غير موجودة | ÉLORÉ PARIS",
    home: "العودة إلى الرئيسية",
    search: "البحث داخل المتجر",
  },
  en: {
    title: "This page is not available at this route.",
    summary:
      "The link may be outdated or unavailable in this build. Start from the homepage to reach the correct route.",
    documentTitle: "Page not found | ÉLORÉ PARIS",
    home: "Return home",
    search: "Search the store",
  },
} as const;

export function GlobalNotFoundDocument() {
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

  useEffect(() => {
    if (!mounted) return;
    document.title = copy.documentTitle;
  }, [mounted, copy.documentTitle]);

  return (
    <html
      lang={language.htmlLang}
      dir={language.dir}
      className={fontVariables}
    >
      <body>
        <main className={styles.page}>
          <div className={styles.card}>
            <p className={styles.eyebrow}>404</p>
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
