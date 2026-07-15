"use client";

import { useCallback, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import styles from "./back-in-stock.module.css";

type Props = { productSlug: string; productName: string; sku: string; locale: Locale };
const copy = {
  ar: { label: "غير متاح حاليًا", email: "بريدك لإشعار التوفر", button: "أبلغيني", submitting: "جارٍ الحفظ…", disclosure: "باختيار «أبلغيني» توافقين على رسالة تخص توفر هذا المنتج فقط، ويمكنك إلغاؤها مجانًا.", success: "سنسجل إشعارًا عند توفر", error: "تعذر حفظ الطلب. حاولي مرة أخرى." },
  en: { label: "Currently unavailable", email: "Email for availability alert", button: "Notify me", submitting: "Saving…", disclosure: "By choosing “Notify me”, you agree to one product availability purpose. You can opt out free of charge.", success: "We will record an alert when available:", error: "We could not save this request. Please try again." },
} as const;

export function BackInStock({ productSlug, productName, sku, locale }: Props) {
  const text = copy[locale];
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || state === "submitting") return;
    setState("submitting");
    try {
      const response = await fetch("/api/back-in-stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, productSlug, sku, consent: true, locale }) });
      if (!response.ok) throw new Error("Back-in-stock preference rejected");
      trackAnalyticsEvent("back_in_stock_request", { label: `restock_${productSlug}`, surface: "pdp_back_in_stock", destinationType: "notification" });
      setState("success");
    } catch { setState("error"); }
  }, [email, locale, productSlug, sku, state]);

  if (state === "success") return <div className={styles.success} role="status"><span aria-hidden="true">✓</span><p>{text.success} <strong>{productName}</strong>.</p></div>;
  return <div className={styles.container}><p className={styles.label}>{text.label}</p><form className={styles.form} onSubmit={handleSubmit}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={text.email} required className={styles.input} aria-label={text.email} dir="ltr" autoComplete="email" /><button type="submit" className={styles.button} disabled={state === "submitting"}>{state === "submitting" ? text.submitting : text.button}</button></form><p className={styles.disclosure}>{text.disclosure}</p>{state === "error" ? <p className={styles.error} role="alert">{text.error}</p> : null}</div>;
}
