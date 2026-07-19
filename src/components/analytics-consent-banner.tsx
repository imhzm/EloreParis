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
    title: "اختيارك أولًا.",
    body: "نستخدم تحليلات اختيارية لفهم أداء الموقع وتحسين التجربة. لن تعمل قبل موافقتك، ويمكنك متابعة التصفح بدونها.",
    accept: "السماح بالتحليلات",
    reject: "المتابعة دونها",
    privacy: "سياسة الخصوصية",
  },
  en: {
    label: "Privacy choices",
    title: "Your choice comes first.",
    body: "We use optional analytics to understand site performance and improve the experience. They remain off until you agree, and you can continue without them.",
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
      <div className={styles.copy}>
        <p>{text.title}</p>
        <span>{text.body}</span>
        <Link href={`/${locale}/trust/privacy`}>{text.privacy}</Link>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.accept} onClick={() => decide("granted")}>{text.accept}</button>
        <button type="button" className={styles.reject} onClick={() => decide("denied")}>{text.reject}</button>
      </div>
    </section>
  );
}
