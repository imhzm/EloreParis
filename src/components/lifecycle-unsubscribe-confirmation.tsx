"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import styles from "./lifecycle-unsubscribe-confirmation.module.css";

type ConfirmationState =
  | "initializing"
  | "ready"
  | "submitting"
  | "success"
  | "error"
  | "invalid";

const copy = {
  ar: {
    eyebrow: "إدارة تفضيلات التواصل",
    title: "تأكيد إلغاء الاشتراك",
    body: "لن نغيّر تفضيلاتك قبل تأكيدك. سيؤدي الإلغاء إلى إيقاف الرسائل المرتبطة بهذا الاشتراك.",
    confirm: "تأكيد إلغاء الاشتراك",
    submitting: "جارٍ حفظ التفضيل…",
    successTitle: "تم إلغاء الاشتراك",
    successBody: "حُفظ تفضيلك ولن تصلك رسائل جديدة مرتبطة بهذا الاشتراك.",
    invalidTitle: "الرابط غير صالح",
    invalidBody: "استخدمي رابط إلغاء الاشتراك الكامل الموجود في الرسالة الأصلية.",
    error: "تعذر حفظ التفضيل الآن. يمكنك المحاولة مرة أخرى بأمان.",
    retry: "إعادة المحاولة",
    privacy: "الرمز الآمن لا يظهر على هذه الصفحة ولا يُرسل عبر طلب GET.",
  },
  en: {
    eyebrow: "Communication preferences",
    title: "Confirm unsubscribe",
    body: "We will not change your preference until you confirm. Unsubscribing stops messages associated with this subscription.",
    confirm: "Confirm unsubscribe",
    submitting: "Saving your preference…",
    successTitle: "You are unsubscribed",
    successBody: "Your preference has been saved. You will not receive new messages associated with this subscription.",
    invalidTitle: "This link is not valid",
    invalidBody: "Please use the complete unsubscribe link from the original message.",
    error: "We could not save your preference. It is safe to try again.",
    retry: "Try again",
    privacy: "The secure token is not shown on this page or sent in a GET request.",
  },
} as const;

const tokenPattern =
  /^[0-9a-f]{8}-[0-9a-f-]{27,45}\.[A-Za-z0-9_-]{43}$/i;

export function LifecycleUnsubscribeConfirmation({ locale }: { locale: Locale }) {
  const [state, setState] = useState<ConfirmationState>("initializing");
  const tokenRef = useRef<string | null>(null);
  const text = copy[locale];

  useEffect(() => {
    const fragmentToken = window.location.hash.startsWith("#")
      ? new URLSearchParams(window.location.hash.slice(1)).get("token")?.trim() ?? ""
      : "";
    if (!tokenRef.current && tokenPattern.test(fragmentToken)) {
      tokenRef.current = fragmentToken;
    }

    // URL fragments never reach the server; remove it before any network request.
    window.history.replaceState(window.history.state, "", window.location.pathname);
    const stateTimer = window.setTimeout(() => {
      setState(tokenRef.current ? "ready" : "invalid");
    }, 0);
    return () => window.clearTimeout(stateTimer);
  }, []);

  async function confirmUnsubscribe() {
    const unsubscribeToken = tokenRef.current;
    if (!unsubscribeToken || state === "submitting") return;
    setState("submitting");

    try {
      const response = await fetch("/api/lifecycle/unsubscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ unsubscribeToken }),
      });
      if (!response.ok) {
        setState("error");
        return;
      }
      tokenRef.current = null;
      setState("success");
    } catch {
      setState("error");
    }
  }

  const terminal = state === "success" || state === "invalid";

  return (
    <section className={styles.surface} aria-labelledby="unsubscribe-title">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.card}>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1 id="unsubscribe-title">
          {state === "success"
            ? text.successTitle
            : state === "invalid"
              ? text.invalidTitle
              : text.title}
        </h1>
        <p className={styles.body} aria-live="polite">
          {state === "success"
            ? text.successBody
            : state === "invalid"
              ? text.invalidBody
              : text.body}
        </p>

        {!terminal && state !== "initializing" ? (
          <button
            className={styles.action}
            type="button"
            onClick={confirmUnsubscribe}
            disabled={state === "submitting"}
          >
            {state === "submitting"
              ? text.submitting
              : state === "error"
                ? text.retry
                : text.confirm}
          </button>
        ) : null}

        {state === "error" ? (
          <p className={styles.error} role="alert">
            {text.error}
          </p>
        ) : null}
        <p className={styles.privacy}>{text.privacy}</p>
      </div>
    </section>
  );
}
