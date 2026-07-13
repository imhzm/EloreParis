"use client";

import { useCallback, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import styles from "./newsletter-signup.module.css";

const STORAGE_KEY = "cozmateks_newsletter_dismissed";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!email.trim() || state === "submitting") return;

      setState("submitting");

      trackAnalyticsEvent("newsletter_signup", {
        label: "home_vip_signup",
        surface: "home_newsletter",
        destinationType: "newsletter",
      });

      try {
        const response = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          setState("success");
          try {
            localStorage.setItem(STORAGE_KEY, "true");
          } catch {
            // localStorage unavailable
          }
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    },
    [email, state],
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);

    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (dismissed && state !== "success") return null;

  return (
    <section className={styles.container} id="newsletter">
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <p className={styles.eyebrow}>VIP early access</p>
          <h2 className={styles.title}>
            كوني أول من يعرف
            <br />
            الجديد والعروض.
          </h2>
          <p className={styles.description}>
            انضمي لقائمة Cozmateks لتصلك مختارات وعروض حصرية، ومحتوى جمال مفيد
            قبل أي شخص آخر.
          </p>
        </div>

        <div className={styles.formBlock}>
          {state === "success" ? (
            <div className={styles.successMessage}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="16" cy="16" r="16" fill="var(--sage-mist)" opacity="0.2" />
                <path
                  d="M10 16l4 4 8-8"
                  stroke="var(--sage-mist)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>تم تسجيلك بنجاح! سنتواصل معك قريبًا.</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="بريدك الإلكتروني"
                  required
                  className={styles.input}
                  aria-label="البريد الإلكتروني"
                  dir="ltr"
                />
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={state === "submitting"}
                >
                  {state === "submitting" ? "جاري التسجيل..." : "انضمي الآن"}
                </button>
              </div>
              <p className={styles.disclaimer}>
                لا إزعاج. يمكنك إلغاء الاشتراك في أي وقت.
              </p>
            </form>
          )}
        </div>
      </div>

      {state !== "success" && (
        <button
          className={styles.dismissButton}
          onClick={handleDismiss}
          aria-label="إخفاء نموذج الاشتراك"
          type="button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </section>
  );
}
