"use client";

import { useCallback, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import styles from "./back-in-stock.module.css";

type BackInStockProps = {
  productSlug: string;
  productName: string;
};

export function BackInStock({ productSlug, productName }: BackInStockProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!email.trim() || state === "submitting") return;

      setState("submitting");

      trackAnalyticsEvent("back_in_stock_request", {
        label: `restock_${productSlug}`,
        surface: "pdp_back_in_stock",
        destinationType: "notification",
      });

      try {
        const response = await fetch("/api/back-in-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, productSlug, sku: productSlug }),
        });

        if (response.ok) {
          setState("success");
        } else {
          setState("idle");
        }
      } catch {
        setState("idle");
      }
    },
    [email, state, productSlug],
  );

  if (state === "success") {
    return (
      <div className={styles.success}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 10l3 3 5-5"
            stroke="var(--sage-mist)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p>
          سنبلغك عند توفر <strong>{productName}</strong> مرة أخرى.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.label}>نفد المخزون حالياً</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="بريدك للإشعار عند التوفر"
          required
          className={styles.input}
          aria-label="البريد الإلكتروني لإشعار التوفر"
          dir="ltr"
        />
        <button
          type="submit"
          className={styles.button}
          disabled={state === "submitting"}
        >
          {state === "submitting" ? "..." : "أبلغيني"}
        </button>
      </form>
    </div>
  );
}
