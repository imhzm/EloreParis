"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import {
  type CheckoutSubmissionInput,
  validateCheckoutSubmission,
} from "@/lib/checkout-validation";
import {
  AuthorityApiError,
  createCheckoutQuoteThroughAuthority,
  createOrderThroughAuthority,
  recoverOrderAttemptFromAuthority,
  type CheckoutQuoteResponse,
} from "@/lib/order-authority-client";
import type {
  CheckoutCustomerDetails,
  PaymentMethodId,
  ShippingMethodId,
} from "@/lib/orders";
import styles from "./order-flow.module.css";

type CheckoutFormState = CheckoutCustomerDetails & {
  shippingMethodId: ShippingMethodId;
  paymentMethodId: PaymentMethodId;
  acceptPolicies: boolean;
  acceptUpdates: boolean;
};

const initialFormState: CheckoutFormState = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  district: "",
  addressLine: "",
  notes: "",
  shippingMethodId: "standard",
  paymentMethodId: "payment_link",
  acceptPolicies: false,
  acceptUpdates: false,
};

const ORDER_ATTEMPT_STORAGE_KEY = "elore.checkout.order-attempt.v1";
const ORDER_ATTEMPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type StoredOrderAttempt = {
  version: 1;
  idempotencyKey: string;
  quoteId: string;
  locale: Locale;
  createdAt: string;
};

function readStoredOrderAttempt(): StoredOrderAttempt | null {
  try {
    const raw = window.localStorage.getItem(ORDER_ATTEMPT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredOrderAttempt>;
    const keys = Object.keys(value);
    const createdAt = typeof value.createdAt === "string" ? Date.parse(value.createdAt) : NaN;
    if (
      keys.length !== 5 ||
      keys.some(
        (key) =>
          !["version", "idempotencyKey", "quoteId", "locale", "createdAt"].includes(key),
      ) ||
      value.version !== 1 ||
      typeof value.idempotencyKey !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{15,159}$/.test(value.idempotencyKey) ||
      typeof value.quoteId !== "string" ||
      !/^quote_[A-Za-z0-9-]{16,160}$/.test(value.quoteId) ||
      (value.locale !== "ar" && value.locale !== "en") ||
      !Number.isFinite(createdAt) ||
      Date.now() - createdAt > ORDER_ATTEMPT_MAX_AGE_MS ||
      createdAt > Date.now() + 60_000
    ) {
      window.localStorage.removeItem(ORDER_ATTEMPT_STORAGE_KEY);
      return null;
    }
    return value as StoredOrderAttempt;
  } catch {
    window.localStorage.removeItem(ORDER_ATTEMPT_STORAGE_KEY);
    return null;
  }
}

function clearStoredOrderAttempt() {
  window.localStorage.removeItem(ORDER_ATTEMPT_STORAGE_KEY);
}

const shippingChoices: Array<{
  id: ShippingMethodId;
  label: string;
  description: string;
}> = [
  { id: "standard", label: "الشحن القياسي", description: "الخيار المتوازن للتوصيل داخل السعودية." },
  { id: "express", label: "الشحن السريع", description: "يظهر السعر والموعد بعد تحقق الـquote." },
];

const paymentLabels: Record<PaymentMethodId, { label: string; description: string }> = {
  payment_link: { label: "رابط دفع آمن", description: "يُنشأ رابط الدفع من المزود بعد حفظ الطلب." },
  cash_on_delivery: { label: "الدفع عند الاستلام", description: "يتاح فقط عندما تسمح به كل عناصر الطلب." },
};

function money(halalas: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(halalas / 100);
}

function quoteErrorMessage(error: unknown) {
  if (!(error instanceof AuthorityApiError)) {
    return error instanceof Error ? error.message : "تعذر تثبيت السعر والتوفر الآن.";
  }
  const messages: Record<string, string> = {
    commerce_disabled: "الشراء متوقف مؤقتًا حتى اكتمال اعتماد الكتالوج والتجارة.",
    quote_items_unavailable: "تغيّر توفر عنصر في السلة. ارجعي للسلة لمراجعته قبل المتابعة.",
    shipping_method_unavailable: "خيار الشحن المحدد غير متاح حاليًا.",
    quote_expired: "انتهت صلاحية السعر الحالي. حدّثي الـquote ثم أعيدي المحاولة.",
    quote_stale: "تغيّر الكتالوج أو السعر. يلزم تحديث المراجعة قبل إنشاء الطلب.",
    insufficient_stock: "الكمية المطلوبة لم تعد متاحة بالكامل.",
    payment_method_unavailable: "طريقة الدفع المحددة لم تعد متاحة لهذا الطلب.",
    policy_version_mismatch: "تم تحديث إحدى السياسات. راجعي الروابط ثم أعيدي التأكيد.",
  };
  return messages[error.code] ?? error.message;
}

export function CheckoutReview() {
  const pathname = usePathname() ?? "/checkout";
  const router = useRouter();
  const isEnglish = pathname === "/en/checkout" || pathname.startsWith("/en/checkout/");
  const locale: Locale = isEnglish ? "en" : "ar";
  const gateCopy = isEnglish ? {
    loadingEyebrow: "Checkout verification",
    loadingTitle: "Restoring your cart",
    loadingBody: "The order form will remain closed until every cart item is verified.",
    eyebrow: "Checkout unavailable",
    title: "Your cart is not ready for checkout",
    unavailable: "An item in your cart is no longer available. Review it before continuing.",
    empty: "The verified catalog is unavailable, or your cart has no eligible items.",
    action: "Return to cart",
  } : {
    loadingEyebrow: "التحقق من الدفع",
    loadingTitle: "جارٍ استعادة السلة وتثبيت بيانات الكتالوج",
    loadingBody: "لن نفتح نموذج الطلب قبل اكتمال التحقق من عناصر السلة.",
    eyebrow: "الدفع غير متاح",
    title: "السلة ليست جاهزة لإنشاء طلب",
    unavailable: "تحتوي السلة على عنصر لم يعد متاحًا. راجعيه قبل المتابعة.",
    empty: "الكتالوج التجاري غير متاح أو لا توجد عناصر صالحة في السلة.",
    action: "العودة إلى السلة",
  };
  const [formState, setFormState] = useState(initialFormState);
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "ready" | "error" | "expired">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [recoveryNonce, setRecoveryNonce] = useState(0);
  const [recoveryState, setRecoveryState] = useState<
    "checking" | "in_progress" | "none"
  >("checking");
  const quoteAbortRef = useRef<AbortController | null>(null);
  const orderAttemptKeyRef = useRef<string | null>(null);
  const {
    catalogStatus,
    clearCart,
    isHydrated,
    items,
    lines,
    unavailableItems,
  } = useCart();
  const clearCartRef = useRef(clearCart);
  const itemFingerprint = useMemo(() => JSON.stringify(items), [items]);

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  useEffect(() => {
    const attempt = readStoredOrderAttempt();
    if (!attempt) {
      orderAttemptKeyRef.current = null;
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) setRecoveryState("none");
      });
      return () => {
        cancelled = true;
      };
    }

    orderAttemptKeyRef.current = attempt.idempotencyKey;
    const controller = new AbortController();
    let retryTimer = 0;

    const recover = async () => {
      try {
        const result = await recoverOrderAttemptFromAuthority(
          attempt.idempotencyKey,
          controller.signal,
        );
        if (result.state === "unknown") {
          clearStoredOrderAttempt();
          orderAttemptKeyRef.current = null;
          setRecoveryState("none");
          return;
        }
        if (result.state === "in_progress") {
          setRecoveryState("in_progress");
          retryTimer = window.setTimeout(recover, 1_500);
          return;
        }

        clearStoredOrderAttempt();
        clearCartRef.current();
        trackAnalyticsEvent("checkout_complete", {
          source_path: pathname,
          source_page_type: getPageType(pathname),
          order_reference: result.order.orderNumber,
          recovery: true,
        });
        router.replace(
          `${localizePath(attempt.locale, "/checkout/success")}?order=${encodeURIComponent(result.order.orderNumber)}`,
        );
      } catch (recoveryError) {
        if (controller.signal.aborted) return;
        if (
          recoveryError instanceof AuthorityApiError &&
          recoveryError.statusCode >= 400 &&
          recoveryError.statusCode < 500
        ) {
          clearStoredOrderAttempt();
          orderAttemptKeyRef.current = null;
          setRecoveryState("none");
          setError(quoteErrorMessage(recoveryError));
          return;
        }
        setRecoveryState("in_progress");
        setError(quoteErrorMessage(recoveryError));
        retryTimer = window.setTimeout(recover, 2_500);
      }
    };

    void recover();
    return () => {
      controller.abort();
      window.clearTimeout(retryTimer);
    };
  }, [pathname, recoveryNonce, router]);

  useEffect(() => {
    if (
      recoveryState !== "none" ||
      !isHydrated ||
      catalogStatus !== "ready" ||
      items.length === 0 ||
      unavailableItems.length > 0
    ) {
      return;
    }

    quoteAbortRef.current?.abort();
    const controller = new AbortController();
    quoteAbortRef.current = controller;
    orderAttemptKeyRef.current = null;
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setQuoteState("loading");
        setQuote(null);
      }
    });

    void createCheckoutQuoteThroughAuthority(
      { items, shippingMethodId: formState.shippingMethodId, locale },
      controller.signal,
    )
      .then((nextQuote) => {
        setQuote(nextQuote);
        setQuoteState("ready");
        setError(null);
        const selectedPayment = nextQuote.paymentOptions.find(
          (option) => option.id === formState.paymentMethodId,
        );
        if (!selectedPayment?.enabled) {
          const fallback = nextQuote.paymentOptions.find((option) => option.enabled);
          if (fallback) {
            setFormState((current) => ({ ...current, paymentMethodId: fallback.id }));
          }
        }
      })
      .catch((quoteError: unknown) => {
        if (quoteError instanceof DOMException && quoteError.name === "AbortError") return;
        setQuoteState("error");
        setError(quoteErrorMessage(quoteError));
      });

    return () => controller.abort();
  }, [catalogStatus, formState.paymentMethodId, formState.shippingMethodId, isHydrated, itemFingerprint, items, locale, recoveryState, refreshNonce, unavailableItems.length]);

  useEffect(() => {
    if (!quote) return;
    const timeout = window.setTimeout(() => setQuoteState("expired"), Math.max(0, Date.parse(quote.expiresAt) - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [quote]);

  function updateField<Field extends keyof CheckoutFormState>(
    field: Field,
    value: CheckoutFormState[Field],
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function selectShipping(id: ShippingMethodId) {
    if (id === formState.shippingMethodId || quoteState === "loading") return;
    updateField("shippingMethodId", id);
    trackAnalyticsEvent("checkout_option_change", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      option_group: "shipping",
      option_value: id,
    });
  }

  function selectPayment(id: PaymentMethodId) {
    if (!quote?.paymentOptions.find((option) => option.id === id)?.enabled) return;
    updateField("paymentMethodId", id);
    trackAnalyticsEvent("checkout_option_change", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      option_group: "payment",
      option_value: id,
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recoveryState !== "none") return;
    if (!quote || quoteState !== "ready" || Date.parse(quote.expiresAt) <= Date.now()) {
      setQuoteState("expired");
      setError("انتهت صلاحية السعر أو لم يكتمل التحقق منه بعد.");
      return;
    }

    const enabledPaymentIds = quote.paymentOptions
      .filter((option) => option.enabled)
      .map((option) => option.id);
    const validationError = validateCheckoutSubmission(
      formState satisfies CheckoutSubmissionInput,
      {
        shippingMethodIds: [quote.shipping.methodId],
        paymentMethodIds: enabledPaymentIds,
      },
    );
    if (validationError) {
      setError(validationError);
      document.querySelector<HTMLElement>("[data-checkout-error]")?.focus();
      return;
    }

    const idempotencyKey = orderAttemptKeyRef.current ?? `checkout-${crypto.randomUUID()}`;
    const attempt: StoredOrderAttempt = {
      version: 1,
      idempotencyKey,
      quoteId: quote.quoteId,
      locale,
      createdAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(
        ORDER_ATTEMPT_STORAGE_KEY,
        JSON.stringify(attempt),
      );
    } catch {
      setError("تعذر حفظ مرجع المحاولة بأمان. تحققي من إعدادات التخزين ثم أعيدي المحاولة.");
      return;
    }
    orderAttemptKeyRef.current = idempotencyKey;
    setIsSubmitting(true);
    setError(null);
    void createOrderThroughAuthority(
      {
        quoteId: quote.quoteId,
        checkout: {
          ...formState,
          termsVersion: quote.policySet.termsVersion,
          privacyNoticeVersion: quote.policySet.privacyNoticeVersion,
        },
      },
      idempotencyKey,
    )
      .then(({ order }) => {
        clearStoredOrderAttempt();
        clearCart();
        trackAnalyticsEvent("checkout_complete", {
          source_path: pathname,
          source_page_type: getPageType(pathname),
          order_reference: order.orderNumber,
        });
        router.push(`${localizePath(locale, "/checkout/success")}?order=${encodeURIComponent(order.orderNumber)}`);
      })
      .catch((submitError: unknown) => {
        setError(quoteErrorMessage(submitError));
        if (
          !(submitError instanceof AuthorityApiError) ||
          submitError.statusCode >= 500 ||
          submitError.code === "idempotency_in_progress"
        ) {
          setRecoveryState("checking");
          setRecoveryNonce((value) => value + 1);
        } else {
          clearStoredOrderAttempt();
          orderAttemptKeyRef.current = null;
        }
        if (submitError instanceof AuthorityApiError && ["quote_expired", "quote_stale", "insufficient_stock"].includes(submitError.code)) {
          setQuoteState("expired");
        }
      })
      .finally(() => setIsSubmitting(false));
  }

  if (!isHydrated || catalogStatus === "loading") {
    return <section className={styles.emptyCard}><p className={styles.eyebrow}>{gateCopy.loadingEyebrow}</p><h1>{gateCopy.loadingTitle}</h1><p>{gateCopy.loadingBody}</p></section>;
  }

  if (catalogStatus !== "ready" || !items.length || !lines.length || unavailableItems.length) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>{gateCopy.eyebrow}</p>
        <h1>{gateCopy.title}</h1>
        <p>{unavailableItems.length ? gateCopy.unavailable : gateCopy.empty}</p>
        <div className={styles.actionColumn}><TrackedLink href={localizePath(locale, "/cart")} className={styles.primaryLink} analyticsLabel="checkout_back_to_cart" analyticsSurface="checkout_gate">{gateCopy.action}</TrackedLink></div>
      </section>
    );
  }

  return (
    <div className={`${styles.page} ${styles.checkoutPage}`}>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>Secure checkout · Saudi Arabia</p><h1>ثبّتي الطلب على سعر وتوفر حقيقيين.</h1><p className={styles.summary}>كل quote صالحة لعشر دقائق فقط، والأسعار تشمل ضريبة القيمة المضافة وفق ملف الكتالوج المعتمد.</p></div>
        <div className={styles.heroAside}>
          <div className={styles.metricCard}><p>حالة السعر</p><strong>{quoteState === "ready" ? "مثبّت" : quoteState === "loading" ? "جارٍ التحقق" : quoteState === "expired" ? "انتهى" : "غير جاهز"}</strong><span>{quote ? `صالح حتى ${new Date(quote.expiresAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}` : "سيظهر الإجمالي بعد تحقق الخادم."}</span></div>
          <div className={styles.noticeCard}><p className={styles.eyebrow}>PDPL notice</p><h2>نستخدم بياناتك لتنفيذ الطلب فقط</h2><p>نشارك الحد الأدنى اللازم مع مزودي الدفع والشحن. التسويق اختياري ومنفصل.</p></div>
        </div>
      </section>

      <section className={styles.layout}>
        <form className={styles.mainCard} onSubmit={submit} noValidate>
          <p className={styles.sectionTitle}>بيانات الاستلام</p><h2>من يستلم الطلب وأين؟</h2>
          <div className={styles.inlineNotice}>قبل إدخال البيانات، راجعي <TrackedLink href={localizePath(locale, quote?.policySet.privacyNoticePath ?? "/trust/privacy")} analyticsLabel="checkout_privacy_notice" analyticsSurface="checkout_form">إشعار الخصوصية</TrackedLink>. الحقول مطلوبة لتنفيذ الطلب، والبريد اختياري.</div>

          {error ? <div className={styles.inlineError} role="alert" tabIndex={-1} data-checkout-error>{error}</div> : null}
          {recoveryState !== "none" ? <div className={styles.inlineNotice} role="status">جارٍ التحقق من محاولة الطلب السابقة. لن يُنشأ طلب جديد حتى تتضح نتيجتها.</div> : null}

          <div className={styles.formGrid}>
            <label className={styles.field}><span className={styles.fieldLabel}>الاسم الكامل</span><input className={styles.textInput} autoComplete="name" value={formState.fullName} onChange={(event) => updateField("fullName", event.currentTarget.value)} required /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>الجوال السعودي</span><input className={styles.textInput} inputMode="tel" autoComplete="tel" placeholder="05XXXXXXXX" value={formState.phone} onChange={(event) => updateField("phone", event.currentTarget.value)} required /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>البريد الإلكتروني (اختياري)</span><input className={styles.textInput} type="email" autoComplete="email" value={formState.email} onChange={(event) => updateField("email", event.currentTarget.value)} /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>المدينة</span><input className={styles.textInput} autoComplete="address-level2" value={formState.city} onChange={(event) => updateField("city", event.currentTarget.value)} required /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>الحي</span><input className={styles.textInput} autoComplete="address-level3" value={formState.district} onChange={(event) => updateField("district", event.currentTarget.value)} required /></label>
            <label className={styles.fieldFull}><span className={styles.fieldLabel}>العنوان التفصيلي</span><input className={styles.textInput} autoComplete="street-address" value={formState.addressLine} onChange={(event) => updateField("addressLine", event.currentTarget.value)} required /></label>
            <label className={styles.fieldFull}><span className={styles.fieldLabel}>تعليمات التسليم (اختياري)</span><textarea className={styles.textArea} value={formState.notes} onChange={(event) => updateField("notes", event.currentTarget.value)} placeholder="اكتبي تعليمات التسليم فقط، ولا تضيفي بيانات صحية أو حساسة." /></label>
          </div>

          <div className={styles.radioGrid}>
            <p className={styles.sectionTitle}>الشحن</p>
            {shippingChoices.map((choice) => <button key={choice.id} type="button" className={`${styles.optionCard} ${formState.shippingMethodId === choice.id ? styles.optionCardActive : ""}`} aria-pressed={formState.shippingMethodId === choice.id} onClick={() => selectShipping(choice.id)} disabled={quoteState === "loading"}><span className={styles.optionHead}><strong>{choice.label}</strong><span>{quote?.shipping.methodId === choice.id ? money(quote.shipping.grossHalalas) : "تحقق عند الاختيار"}</span></span><span className={styles.optionNote}>{choice.description}</span></button>)}
          </div>

          <div className={styles.radioGrid}>
            <p className={styles.sectionTitle}>الدفع</p>
            {(quote?.paymentOptions ?? []).map((option) => { const copy = paymentLabels[option.id]; return <button key={option.id} type="button" className={`${styles.optionCard} ${formState.paymentMethodId === option.id ? styles.optionCardActive : ""} ${!option.enabled ? styles.optionCardDisabled : ""}`} aria-pressed={formState.paymentMethodId === option.id} onClick={() => selectPayment(option.id)} disabled={!option.enabled}><span className={styles.optionHead}><strong>{copy.label}</strong><span>{option.enabled ? "متاح" : "غير متاح"}</span></span><span className={styles.optionNote}>{option.enabled ? copy.description : option.reasonCode === "provider_unavailable" ? "مزود الدفع غير جاهز حاليًا." : "طريقة الدفع غير متاحة لهذه السلة."}</span></button>; })}
          </div>

          <label className={styles.checkboxRow}><input type="checkbox" checked={formState.acceptPolicies} onChange={(event) => updateField("acceptPolicies", event.currentTarget.checked)} /><span>قرأت وأوافق على <TrackedLink href={localizePath(locale, quote?.policySet.termsPath ?? "/terms")} analyticsLabel="checkout_terms" analyticsSurface="checkout_form">الشروط</TrackedLink> وسياسات الشحن والاسترجاع المرتبطة بالطلب.</span></label>
          <label className={styles.checkboxRow}><input type="checkbox" checked={formState.acceptUpdates} onChange={(event) => updateField("acceptUpdates", event.currentTarget.checked)} /><span>أوافق اختياريًا على رسائل تسويقية مستقبلية. رسائل الطلب التشغيلية لا تعتمد على هذا الاختيار.</span></label>

          {quoteState === "expired" || quoteState === "error" ? <button type="button" className={styles.secondaryButton} onClick={() => setRefreshNonce((value) => value + 1)}>تحديث السعر والتوفر</button> : null}
          <button type="submit" className={styles.primaryButton} disabled={recoveryState !== "none" || isSubmitting || quoteState !== "ready" || !quote?.paymentOptions.some((option) => option.enabled)}>{recoveryState !== "none" ? "جارٍ استعادة المحاولة السابقة..." : isSubmitting ? "جارٍ إنشاء الطلب بأمان..." : "تأكيد وإنشاء الطلب"}</button>
        </form>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Quote authority</p><h2>{quote ? money(quote.totalGrossHalalas) : "—"}</h2>
            <div className={styles.summaryList}>
              {(quote?.lines ?? []).map((line) => <div key={`${line.productSlug}:${line.sku}`} className={styles.summaryRow}><span>{isEnglish ? line.nameEn : line.nameAr} × {line.quantity}</span><strong className={styles.summaryValue}>{money(line.lineGrossHalalas)}</strong></div>)}
              <div className={styles.summaryRow}><span>المجموع الفرعي</span><strong className={styles.summaryValue}>{quote ? money(quote.subtotalGrossHalalas) : "—"}</strong></div>
              <div className={styles.summaryRow}><span>الشحن</span><strong className={styles.summaryValue}>{quote ? money(quote.shipping.grossHalalas) : "—"}</strong></div>
              <div className={styles.summaryRow}><span>ضريبة شاملة</span><strong className={styles.summaryValue}>{quote ? money(quote.totalVatHalalas) : "—"}</strong></div>
            </div>
            <p className={styles.helperText}>{quote ? (isEnglish ? quote.shipping.estimatedDeliveryEn : quote.shipping.estimatedDeliveryAr) : "جارٍ التحقق من نافذة التوصيل."}</p>
          </article>
          <article className={styles.summaryCard}><p className={styles.sectionTitle}>ضمان العملية</p><h2>لا يوجد سعر من localStorage</h2><p>الطلب يستخدم quote محفوظة في الخادم، ومفتاح idempotency يمنع تكرار نفس المحاولة عند إعادة إرسالها.</p><TrackedLink href={localizePath(locale, "/cart")} className={styles.secondaryLink} analyticsLabel="checkout_edit_cart" analyticsSurface="checkout_summary">تعديل السلة</TrackedLink></article>
        </aside>
      </section>
    </div>
  );
}
