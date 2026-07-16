"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./localized-boundary.module.css";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const errorCopy = {
  ar: {
    eyebrow: "تعذر إكمال الطلب",
    title: "حدث عطل مؤقت.",
    body: "لم نتمكن من عرض هذه الصفحة الآن. يمكنك إعادة تحميل العرض، وإذا حدث ذلك بعد الدفع أو تأكيد الطلب فتحققي من التتبع أولًا.",
    retry: "المحاولة مرة أخرى",
    home: "العودة إلى الرئيسية",
    tracking: "تتبّع الطلب",
  },
  en: {
    eyebrow: "REQUEST INTERRUPTED",
    title: "A temporary issue occurred.",
    body: "We could not display this page right now. You can reload the view; if this followed payment or order confirmation, check tracking first.",
    retry: "Try again",
    home: "Return home",
    tracking: "Track an order",
  },
} as const;

export default function LocalizedErrorBoundary({ reset }: ErrorBoundaryProps) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "ar";
  const copy = errorCopy[locale];
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className={styles.boundary}
      dir={locale === "ar" ? "rtl" : "ltr"}
      role="alert"
      aria-live="assertive"
      aria-labelledby="localized-error-title"
      aria-describedby="localized-error-description"
    >
      <div className={styles.panel}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="localized-error-title" className={styles.title} ref={headingRef} tabIndex={-1}>{copy.title}</h1>
        <p id="localized-error-description" className={styles.body}>{copy.body}</p>
        <div className={styles.actions}>
          <button className={styles.primary} type="button" onClick={reset}>{copy.retry}</button>
          <Link className={styles.secondary} href={`/${locale}`}>{copy.home}</Link>
          <Link className={styles.secondary} href={`/${locale}/track-order`}>{copy.tracking}</Link>
        </div>
      </div>
    </section>
  );
}
