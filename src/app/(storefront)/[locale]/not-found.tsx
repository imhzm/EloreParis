"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./localized-boundary.module.css";

const notFoundCopy = {
  ar: {
    eyebrow: "404 | الصفحة غير موجودة",
    title: "لم نتمكن من العثور على هذه الصفحة.",
    body: "قد يكون الرابط قديمًا أو أن المحتوى لم يعد متاحًا. يمكنك العودة إلى الصفحة الرئيسية أو البحث داخل المتجر.",
    home: "العودة إلى الرئيسية",
    search: "البحث داخل المتجر",
  },
  en: {
    eyebrow: "404 | PAGE NOT FOUND",
    title: "We could not find this page.",
    body: "The link may be outdated or the content may no longer be available. Return home or search the store to continue.",
    home: "Return home",
    search: "Search the store",
  },
} as const;

export default function LocalizedNotFound() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "ar";
  const copy = notFoundCopy[locale];
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className={styles.boundary}
      dir={locale === "ar" ? "rtl" : "ltr"}
      aria-labelledby="localized-not-found-title"
      aria-describedby="localized-not-found-description"
    >
      <div className={styles.panel}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1
          id="localized-not-found-title"
          className={styles.title}
          ref={headingRef}
          tabIndex={-1}
        >
          {copy.title}
        </h1>
        <p id="localized-not-found-description" className={styles.body}>
          {copy.body}
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={`/${locale}`}>
            {copy.home}
          </Link>
          <Link className={styles.secondary} href={`/${locale}/search`}>
            {copy.search}
          </Link>
        </div>
      </div>
    </section>
  );
}
