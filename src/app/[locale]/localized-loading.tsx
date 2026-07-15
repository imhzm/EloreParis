"use client";

import { usePathname } from "next/navigation";
import styles from "./localized-boundary.module.css";

const loadingCopy = {
  ar: {
    eyebrow: "ÉLORÉ PARIS · LOADING",
    title: "نجهّز تجربتك الآن.",
    body: "يرجى الانتظار لحظات بينما نحضر أحدث المعلومات بأمان.",
    announcement: "جاري تحميل محتوى الصفحة",
  },
  en: {
    eyebrow: "ÉLORÉ PARIS · LOADING",
    title: "Preparing your experience.",
    body: "Please wait while we securely retrieve the latest information.",
    announcement: "Page content is loading",
  },
} as const;

export function LocalizedLoading() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "ar";
  const copy = loadingCopy[locale];

  return (
    <section className={styles.boundary} dir={locale === "ar" ? "rtl" : "ltr"} aria-busy="true">
      <div className={styles.panel} role="status" aria-live="polite" aria-atomic="true">
        <span className={styles.srOnly}>{copy.announcement}</span>
        <p className={styles.eyebrow} aria-hidden="true">{copy.eyebrow}</p>
        <h1 className={styles.title} aria-hidden="true">{copy.title}</h1>
        <p className={styles.body} aria-hidden="true">{copy.body}</p>
        <div className={styles.loadingGrid} aria-hidden="true">
          <span className={styles.loadingBlock} />
          <span className={styles.loadingBlock} />
          <span className={styles.loadingBlock} />
        </div>
      </div>
    </section>
  );
}
