"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import styles from "./newsletter-signup.module.css";

const STORAGE_KEY = "elore_newsletter_dismissed";

const copy = {
  ar: {
    eyebrow: "VIP EARLY ACCESS",
    title: "كوني أول من يعرف.",
    description: "أدلة درجات وروتينات قصيرة وجديد ÉLORÉ PARIS، تُرسل باختيارك.",
    email: "بريدك الإلكتروني",
    consent: "أوافق على استلام رسائل ÉLORÉ PARIS التسويقية عبر البريد الإلكتروني، ويمكنني إلغاء الاشتراك مجانًا في أي وقت.",
    privacy: "سياسة الخصوصية",
    submit: "انضمي الآن",
    submitting: "جاري التسجيل…",
    success: "تم تسجيل اختيارك بنجاح.",
    error: "تعذر حفظ اختيارك الآن. حاولي مرة أخرى.",
    dismiss: "إخفاء نموذج الاشتراك",
  },
  en: {
    eyebrow: "VIP EARLY ACCESS",
    title: "Be first to know.",
    description: "Shade guides, concise routines and ÉLORÉ PARIS news, sent only by your choice.",
    email: "Your email address",
    consent: "I agree to receive ÉLORÉ PARIS marketing emails. I can unsubscribe free of charge at any time.",
    privacy: "Privacy policy",
    submit: "Join now",
    submitting: "Joining…",
    success: "Your preference has been recorded.",
    error: "We could not save your preference. Please try again.",
    dismiss: "Hide newsletter form",
  },
} as const;

export function NewsletterSignup({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !consent || state === "submitting") return;
    setState("submitting");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, locale }),
      });
      if (!response.ok) throw new Error("Newsletter preference rejected");
      trackAnalyticsEvent("newsletter_signup", { label: "home_vip_signup", surface: "home_newsletter", destinationType: "newsletter" });
      setState("success");
      try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* Storage is optional. */ }
    } catch { setState("error"); }
  }, [consent, email, locale, state]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* Storage is optional. */ }
  }, []);

  if (dismissed && state !== "success") return null;

  return <section className={styles.container} id="newsletter" aria-labelledby="newsletter-title">
    <div className={styles.content}>
      <div className={styles.textBlock}><p className={styles.eyebrow}>{text.eyebrow}</p><h2 className={styles.title} id="newsletter-title">{text.title}</h2><p className={styles.description}>{text.description}</p></div>
      <div className={styles.formBlock}>{state === "success" ? <div className={styles.successMessage} role="status"><span aria-hidden="true">✓</span><p>{text.success}</p></div> : <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={text.email} required className={styles.input} aria-label={text.email} dir="ltr" autoComplete="email" /><button type="submit" className={styles.submitButton} disabled={state === "submitting" || !consent}>{state === "submitting" ? text.submitting : text.submit}</button></div>
        <label className={styles.consent}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>{text.consent} <Link href={`/${locale}/trust/privacy`}>{text.privacy}</Link>.</span></label>
        {state === "error" ? <p className={styles.error} role="alert">{text.error}</p> : null}
      </form>}</div>
    </div>
    {state !== "success" ? <button className={styles.dismissButton} onClick={handleDismiss} aria-label={text.dismiss} type="button">×</button> : null}
  </section>;
}
