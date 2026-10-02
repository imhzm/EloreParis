"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  setAnalyticsConsent,
} from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import styles from "./analytics-consent-banner.module.css";

const copy = {
  ar: {
    label: "اختيارات الخصوصية",
    title: "خصوصيتك أولًا",
    body: "نستخدم تحليلات اختيارية لتحسين تجربة التصفح.",
    accept: "السماح بالتحليلات",
    reject: "المتابعة دونها",
    privacy: "سياسة الخصوصية",
  },
  en: {
    label: "Privacy choices",
    title: "Your Privacy",
    body: "We use optional analytics to improve your experience.",
    accept: "Allow analytics",
    reject: "Continue without",
    privacy: "Privacy policy",
  },
} as const;

function subscribeToConsent(callback: () => void) {
  window.addEventListener(ANALYTICS_CONSENT_EVENT, callback);
  return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, callback);
}

function hasNoStoredDecision() {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY) === null;
  } catch {
    return false;
  }
}

export function AnalyticsConsentBanner({ locale }: { locale: Locale }) {
  const isVisible = useSyncExternalStore(
    subscribeToConsent,
    hasNoStoredDecision,
    () => false,
  );
  const text = copy[locale];

  if (!isVisible) {
    return null;
  }

  const decide = (consent: "granted" | "denied") => {
    setAnalyticsConsent(consent);
  };

  return (
    <section className={styles.banner} aria-label={text.label} data-analytics-consent>
      <div className={styles.content}>
        <div className={styles.iconWrap} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className={styles.copy}>
          <div className={styles.headerRow}>
            <span className={styles.title}>{text.title}</span>
            <span className={styles.bullet}>•</span>
            <Link href={`/${locale}/trust/privacy`} className={styles.privacyLink}>{text.privacy}</Link>
          </div>
          <p className={styles.description}>{text.body}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.accept} onClick={() => decide("granted")}>{text.accept}</button>
        <button type="button" className={styles.reject} onClick={() => decide("denied")}>{text.reject}</button>
      </div>
    </section>
  );
}
