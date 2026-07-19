"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnalyticsViewEvent } from "@/components/analytics-view-event";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import {
  type CheckoutFieldErrors,
  type CheckoutSubmissionInput,
  validateCheckoutSubmissionFields,
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

const shippingChoices: Record<Locale, Array<{
  id: ShippingMethodId;
  label: string;
  description: string;
}>> = {
  en: [
    { id: "standard", label: "Standard shipping", description: "A balanced delivery option within Saudi Arabia." },
    { id: "express", label: "Express shipping", description: "Price and delivery window appear after the quote is verified." },
  ],
  ar: [
    { id: "standard", label: "الشحن القياسي", description: "الخيار المتوازن للتوصيل داخل السعودية." },
    { id: "express", label: "الشحن السريع", description: "يظهر السعر والموعد بعد تحقق عرض السعر." },
  ],
};

const paymentLabels: Record<Locale, Record<PaymentMethodId, { label: string; description: string }>> = {
  en: {
    payment_link: { label: "Secure payment link", description: "The payment provider creates a secure link after the order is saved." },
    cash_on_delivery: { label: "Cash on delivery", description: "Available only when every item in the order is eligible." },
  },
  ar: {
    payment_link: { label: "رابط دفع آمن", description: "يُنشأ رابط الدفع من المزود بعد حفظ الطلب." },
    cash_on_delivery: { label: "الدفع عند الاستلام", description: "يتاح فقط عندما تسمح به كل عناصر الطلب." },
  },
};

const checkoutCopy = {
  en: {
    gate: {
      loadingEyebrow: "Checkout verification",
      loadingTitle: "Restoring your cart",
      loadingBody: "The order form will remain closed until every cart item is verified.",
      eyebrow: "Checkout unavailable",
      title: "Your cart is not ready for checkout",
      unavailable: "An item in your cart is no longer available. Review it before continuing.",
      empty: "The verified catalog is unavailable, or your cart has no eligible items.",
      action: "Return to cart",
    },
    expiredError: "The verified price has expired or verification is not complete yet.",
    storageError: "We could not safely save the order attempt reference. Check your storage settings and try again.",
    heroEyebrow: "Secure checkout · Saudi Arabia",
    heroTitle: "Place your order with verified price and availability.",
    heroSummary: "Each quote is valid for ten minutes. Prices include VAT according to the approved catalog record.",
    priceStatus: "Price status",
    statusReady: "Verified",
    statusLoading: "Verifying",
    statusExpired: "Expired",
    statusUnavailable: "Not ready",
    expiresAt: "Valid until",
    totalPending: "The total will appear after server verification.",
    pdplEyebrow: "PDPL notice",
    pdplTitle: "We use your data only to fulfil the order",
    pdplBody: "We share only what is necessary with payment and shipping providers. Marketing consent is optional and separate.",
    recipient: "Delivery details",
    formTitle: "Who will receive the order, and where?",
    privacyBefore: "Before entering your details, review the",
    privacyLink: "privacy notice",
    privacyAfter: ". These fields are required to fulfil the order; email is optional.",
    recoveryNotice: "We are checking a previous order attempt. A new order will not be created until its result is known.",
    fullName: "Full name",
    phone: "Saudi mobile number",
    email: "Email address (optional)",
    city: "City",
    district: "District",
    address: "Detailed address",
    deliveryInstructions: "Delivery instructions (optional)",
    deliveryPlaceholder: "Add delivery instructions only. Do not include health or other sensitive information.",
    shipping: "Shipping",
    verifyOnSelection: "Verified after selection",
    payment: "Payment",
    available: "Available",
    unavailable: "Unavailable",
    providerUnavailable: "The payment provider is not ready at the moment.",
    paymentUnavailable: "This payment method is not available for the current cart.",
    termsBefore: "I have read and agree to the",
    termsLink: "terms",
    termsAfter: "and the shipping and returns policies associated with this order.",
    updates: "I optionally consent to future marketing messages. Operational order messages do not depend on this choice.",
    refresh: "Refresh price and availability",
    recovering: "Restoring the previous attempt...",
    submitting: "Creating the order securely...",
    submit: "Confirm and create order",
    quoteAuthority: "Verified quote",
    subtotal: "Subtotal",
    vat: "VAT included",
    deliveryPending: "Verifying the delivery window.",
    processGuarantee: "Process integrity",
    processTitle: "No price is trusted from local storage",
    processBody: "The order uses a server-side quote, while an idempotency key prevents a retry from creating the same order twice.",
    editCart: "Edit cart",
    couponCode: "Coupon code",
    applyCoupon: "Apply",
  },
  ar: {
    gate: {
      loadingEyebrow: "التحقق من الدفع",
      loadingTitle: "جارٍ استعادة السلة وتثبيت بيانات الكتالوج",
      loadingBody: "لن نفتح نموذج الطلب قبل اكتمال التحقق من عناصر السلة.",
      eyebrow: "الدفع غير متاح",
      title: "السلة ليست جاهزة لإنشاء طلب",
      unavailable: "تحتوي السلة على عنصر لم يعد متاحًا. راجعيه قبل المتابعة.",
      empty: "الكتالوج التجاري غير متاح أو لا توجد عناصر صالحة في السلة.",
      action: "العودة إلى السلة",
    },
    expiredError: "انتهت صلاحية السعر أو لم يكتمل التحقق منه بعد.",
    storageError: "تعذر حفظ مرجع المحاولة بأمان. تحققي من إعدادات التخزين ثم أعيدي المحاولة.",
    heroEyebrow: "دفع آمن · المملكة العربية السعودية",
    heroTitle: "ثبّتي الطلب على سعر وتوفر حقيقيين.",
    heroSummary: "كل عرض سعر صالح لعشر دقائق فقط، والأسعار تشمل ضريبة القيمة المضافة وفق ملف الكتالوج المعتمد.",
    priceStatus: "حالة السعر",
    statusReady: "مثبّت",
    statusLoading: "جارٍ التحقق",
    statusExpired: "انتهى",
    statusUnavailable: "غير جاهز",
    expiresAt: "صالح حتى",
    totalPending: "سيظهر الإجمالي بعد تحقق الخادم.",
    pdplEyebrow: "إشعار حماية البيانات",
    pdplTitle: "نستخدم بياناتك لتنفيذ الطلب فقط",
    pdplBody: "نشارك الحد الأدنى اللازم مع مزودي الدفع والشحن. التسويق اختياري ومنفصل.",
    recipient: "بيانات الاستلام",
    formTitle: "من يستلم الطلب وأين؟",
    privacyBefore: "قبل إدخال البيانات، راجعي",
    privacyLink: "إشعار الخصوصية",
    privacyAfter: ". الحقول مطلوبة لتنفيذ الطلب، والبريد اختياري.",
    recoveryNotice: "جارٍ التحقق من محاولة الطلب السابقة. لن يُنشأ طلب جديد حتى تتضح نتيجتها.",
    fullName: "الاسم الكامل",
    phone: "الجوال السعودي",
    email: "البريد الإلكتروني (اختياري)",
    city: "المدينة",
    district: "الحي",
    address: "العنوان التفصيلي",
    deliveryInstructions: "تعليمات التسليم (اختياري)",
    deliveryPlaceholder: "اكتبي تعليمات التسليم فقط، ولا تضيفي بيانات صحية أو حساسة.",
    shipping: "الشحن",
    verifyOnSelection: "تحقق عند الاختيار",
    payment: "الدفع",
    available: "متاح",
    unavailable: "غير متاح",
    providerUnavailable: "مزود الدفع غير جاهز حاليًا.",
    paymentUnavailable: "طريقة الدفع غير متاحة لهذه السلة.",
    termsBefore: "قرأت وأوافق على",
    termsLink: "الشروط",
    termsAfter: "وسياسات الشحن والاسترجاع المرتبطة بالطلب.",
    updates: "أوافق اختياريًا على رسائل تسويقية مستقبلية. رسائل الطلب التشغيلية لا تعتمد على هذا الاختيار.",
    refresh: "تحديث السعر والتوفر",
    recovering: "جارٍ استعادة المحاولة السابقة...",
    submitting: "جارٍ إنشاء الطلب بأمان...",
    submit: "تأكيد وإنشاء الطلب",
    quoteAuthority: "مرجع السعر الموثّق",
    subtotal: "المجموع الفرعي",
    vat: "ضريبة شاملة",
    deliveryPending: "جارٍ التحقق من نافذة التوصيل.",
    processGuarantee: "ضمان العملية",
    processTitle: "لا يوجد سعر من التخزين المحلي",
    processBody: "الطلب يستخدم عرض سعر محفوظًا في الخادم، ومفتاح عدم التكرار يمنع إنشاء الطلب نفسه مرتين عند إعادة الإرسال.",
    editCart: "تعديل السلة",
    couponCode: "كود الخصم",
    applyCoupon: "تطبيق",
  },
} as const;

const quoteErrorMessages: Record<Locale, { fallback: string; byCode: Record<string, string> }> = {
  en: {
    fallback: "We could not verify price and availability at the moment.",
    byCode: {
      commerce_disabled: "Shopping is temporarily paused until the catalog and commerce setup are approved.",
      quote_items_unavailable: "An item in the cart has changed availability. Review the cart before continuing.",
      shipping_method_unavailable: "The selected shipping option is not currently available.",
      quote_expired: "The current quote has expired. Refresh it and try again.",
      quote_stale: "The catalog or price changed. Refresh the review before creating the order.",
      insufficient_stock: "The requested quantity is no longer fully available.",
      payment_method_unavailable: "The selected payment method is no longer available for this order.",
      policy_version_mismatch: "A policy has been updated. Review the links and confirm again.",
      coupon_unavailable: "This coupon is inactive, expired, exhausted, or not eligible for this cart.",
      promotion_stale: "The promotion changed after the quote. Refresh the quote before ordering.",
      promotion_usage_exhausted: "This promotion reached its usage limit. Refresh the quote before ordering.",
    },
  },
  ar: {
    fallback: "تعذر تثبيت السعر والتوفر الآن.",
    byCode: {
      commerce_disabled: "الشراء متوقف مؤقتًا حتى اكتمال اعتماد الكتالوج والتجارة.",
      quote_items_unavailable: "تغيّر توفر عنصر في السلة. ارجعي للسلة لمراجعته قبل المتابعة.",
      shipping_method_unavailable: "خيار الشحن المحدد غير متاح حاليًا.",
      quote_expired: "انتهت صلاحية السعر الحالي. حدّثي عرض السعر ثم أعيدي المحاولة.",
      quote_stale: "تغيّر الكتالوج أو السعر. يلزم تحديث المراجعة قبل إنشاء الطلب.",
      insufficient_stock: "الكمية المطلوبة لم تعد متاحة بالكامل.",
      payment_method_unavailable: "طريقة الدفع المحددة لم تعد متاحة لهذا الطلب.",
      policy_version_mismatch: "تم تحديث إحدى السياسات. راجعي الروابط ثم أعيدي التأكيد.",
      coupon_unavailable: "الكوبون غير نشط أو منتهي أو غير متاح لهذه السلة.",
      promotion_stale: "تغيّر العرض بعد إصدار السعر. حدّثي السعر قبل إكمال الطلب.",
      promotion_usage_exhausted: "وصل العرض إلى حد الاستخدام. حدّثي السعر قبل إكمال الطلب.",
    },
  },
};

function money(halalas: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-SA" : "ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(halalas / 100);
}

function quoteErrorMessage(error: unknown, locale: Locale) {
  const messages = quoteErrorMessages[locale];
  if (!(error instanceof AuthorityApiError)) {
    return messages.fallback;
  }
  return messages.byCode[error.code] ?? messages.fallback;
}

export function CheckoutReview() {
  const pathname = usePathname() ?? "/checkout";
  const router = useRouter();
  const isEnglish = pathname === "/en/checkout" || pathname.startsWith("/en/checkout/");
  const locale: Locale = isEnglish ? "en" : "ar";
  const copy = checkoutCopy[locale];
  const gateCopy = copy.gate;
  const [formState, setFormState] = useState(initialFormState);
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "ready" | "error" | "expired">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
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
          setError(quoteErrorMessage(recoveryError, locale));
          return;
        }
        setRecoveryState("in_progress");
        setError(quoteErrorMessage(recoveryError, locale));
        retryTimer = window.setTimeout(recover, 2_500);
      }
    };

    void recover();
    return () => {
      controller.abort();
      window.clearTimeout(retryTimer);
    };
  }, [locale, pathname, recoveryNonce, router]);

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
      {
        items,
        shippingMethodId: formState.shippingMethodId,
        locale,
        couponCode: appliedCouponCode,
      },
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
        setError(quoteErrorMessage(quoteError, locale));
      });

    return () => controller.abort();
  }, [appliedCouponCode, catalogStatus, formState.paymentMethodId, formState.shippingMethodId, isHydrated, itemFingerprint, items, locale, recoveryState, refreshNonce, unavailableItems.length]);

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
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
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
      setError(copy.expiredError);
      setFieldErrors({});
      return;
    }

    const enabledPaymentIds = quote.paymentOptions
      .filter((option) => option.enabled)
      .map((option) => option.id);
    const validation = validateCheckoutSubmissionFields(
      formState satisfies CheckoutSubmissionInput,
      {
        shippingMethodIds: [quote.shipping.methodId],
        paymentMethodIds: enabledPaymentIds,
      },
      locale,
    );
    if (validation) {
      setError(validation.summary);
      setFieldErrors(validation.fieldErrors);
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-checkout-invalid="true"]')?.focus();
      });
      return;
    }
    setFieldErrors({});

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
      setError(copy.storageError);
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
        setError(quoteErrorMessage(submitError, locale));
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
    return <section className={styles.emptyCard} data-checkout-surface data-checkout-state="loading"><p className={styles.eyebrow}>{gateCopy.loadingEyebrow}</p><h1>{gateCopy.loadingTitle}</h1><p>{gateCopy.loadingBody}</p></section>;
  }

  if (catalogStatus !== "ready" || !items.length || !lines.length || unavailableItems.length) {
    return (
      <section className={styles.emptyCard} data-checkout-surface data-checkout-state="gated">
        <p className={styles.eyebrow}>{gateCopy.eyebrow}</p>
        <h1>{gateCopy.title}</h1>
        <p>{unavailableItems.length ? gateCopy.unavailable : gateCopy.empty}</p>
        <div className={styles.actionColumn}><TrackedLink href={localizePath(locale, "/cart")} className={styles.primaryLink} analyticsLabel="checkout_back_to_cart" analyticsSurface="checkout_gate">{gateCopy.action}</TrackedLink></div>
      </section>
    );
  }

  return (
    <div className={`${styles.page} ${styles.checkoutPage}`} data-checkout-surface data-checkout-state="ready">
      {quoteState === "ready" && quote ? (
        <AnalyticsViewEvent
          eventName="begin_checkout"
          eventKey={`checkout:${locale}`}
          properties={{
            currency: "SAR",
            item_count: items.reduce((total, item) => total + item.quantity, 0),
            line_count: lines.length,
            payment_option_count: quote.paymentOptions.length,
            value: quote.totalGrossHalalas / 100,
          }}
        />
      ) : null}
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>{copy.heroEyebrow}</p><h1>{copy.heroTitle}</h1><p className={styles.summary}>{copy.heroSummary}</p></div>
        <div className={styles.heroAside}>
          <div className={styles.metricCard}><p>{copy.priceStatus}</p><strong>{quoteState === "ready" ? copy.statusReady : quoteState === "loading" ? copy.statusLoading : quoteState === "expired" ? copy.statusExpired : copy.statusUnavailable}</strong><span>{quote ? `${copy.expiresAt} ${new Date(quote.expiresAt).toLocaleTimeString(locale === "en" ? "en-SA" : "ar-SA", { hour: "2-digit", minute: "2-digit" })}` : copy.totalPending}</span></div>
          <div className={styles.noticeCard}><p className={styles.eyebrow}>{copy.pdplEyebrow}</p><h2>{copy.pdplTitle}</h2><p>{copy.pdplBody}</p></div>
        </div>
      </section>

      <section className={styles.layout}>
        <form className={styles.mainCard} onSubmit={submit} noValidate>
          <p className={styles.sectionTitle}>{copy.recipient}</p><h2>{copy.formTitle}</h2>
          <div className={styles.inlineNotice}>{copy.privacyBefore} <TrackedLink href={localizePath(locale, quote?.policySet.privacyNoticePath ?? "/trust/privacy")} analyticsLabel="checkout_privacy_notice" analyticsSurface="checkout_form">{copy.privacyLink}</TrackedLink>{copy.privacyAfter}</div>

          {error ? <div className={styles.inlineError} role="alert" tabIndex={-1} data-checkout-error>{error}</div> : null}
          {recoveryState !== "none" ? <div className={styles.inlineNotice} role="status">{copy.recoveryNotice}</div> : null}

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{copy.fullName}</span>
              <input id="checkout-full-name" className={styles.textInput} autoComplete="name" value={formState.fullName} onChange={(event) => updateField("fullName", event.currentTarget.value)} required aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "checkout-full-name-error" : undefined} data-checkout-invalid={fieldErrors.fullName ? "true" : undefined} />
              {fieldErrors.fullName ? <span id="checkout-full-name-error" className={styles.helperText}>{fieldErrors.fullName}</span> : null}
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{copy.phone}</span>
              <input id="checkout-phone" className={styles.textInput} inputMode="tel" autoComplete="tel" placeholder="05XXXXXXXX" value={formState.phone} onChange={(event) => updateField("phone", event.currentTarget.value)} required aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined} data-checkout-invalid={fieldErrors.phone ? "true" : undefined} />
              {fieldErrors.phone ? <span id="checkout-phone-error" className={styles.helperText}>{fieldErrors.phone}</span> : null}
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{copy.email}</span>
              <input id="checkout-email" className={styles.textInput} type="email" autoComplete="email" value={formState.email} onChange={(event) => updateField("email", event.currentTarget.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined} data-checkout-invalid={fieldErrors.email ? "true" : undefined} />
              {fieldErrors.email ? <span id="checkout-email-error" className={styles.helperText}>{fieldErrors.email}</span> : null}
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{copy.city}</span>
              <input id="checkout-city" className={styles.textInput} autoComplete="address-level2" value={formState.city} onChange={(event) => updateField("city", event.currentTarget.value)} required aria-invalid={Boolean(fieldErrors.city)} aria-describedby={fieldErrors.city ? "checkout-city-error" : undefined} data-checkout-invalid={fieldErrors.city ? "true" : undefined} />
              {fieldErrors.city ? <span id="checkout-city-error" className={styles.helperText}>{fieldErrors.city}</span> : null}
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{copy.district}</span>
              <input id="checkout-district" className={styles.textInput} autoComplete="address-level3" value={formState.district} onChange={(event) => updateField("district", event.currentTarget.value)} required aria-invalid={Boolean(fieldErrors.district)} aria-describedby={fieldErrors.district ? "checkout-district-error" : undefined} data-checkout-invalid={fieldErrors.district ? "true" : undefined} />
              {fieldErrors.district ? <span id="checkout-district-error" className={styles.helperText}>{fieldErrors.district}</span> : null}
            </label>
            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>{copy.address}</span>
              <input id="checkout-address" className={styles.textInput} autoComplete="street-address" value={formState.addressLine} onChange={(event) => updateField("addressLine", event.currentTarget.value)} required aria-invalid={Boolean(fieldErrors.addressLine)} aria-describedby={fieldErrors.addressLine ? "checkout-address-error" : undefined} data-checkout-invalid={fieldErrors.addressLine ? "true" : undefined} />
              {fieldErrors.addressLine ? <span id="checkout-address-error" className={styles.helperText}>{fieldErrors.addressLine}</span> : null}
            </label>
            <label className={styles.fieldFull}><span className={styles.fieldLabel}>{copy.deliveryInstructions}</span><textarea className={styles.textArea} value={formState.notes} onChange={(event) => updateField("notes", event.currentTarget.value)} placeholder={copy.deliveryPlaceholder} /></label>
          </div>

          <div className={styles.radioGrid} role="radiogroup" aria-labelledby="checkout-shipping-label" aria-invalid={Boolean(fieldErrors.shippingMethodId)} aria-describedby={fieldErrors.shippingMethodId ? "checkout-shipping-error" : undefined} data-checkout-invalid={fieldErrors.shippingMethodId ? "true" : undefined} tabIndex={fieldErrors.shippingMethodId ? -1 : undefined}>
            <p id="checkout-shipping-label" className={styles.sectionTitle}>{copy.shipping}</p>
            {shippingChoices[locale].map((choice) => { const isSelected = formState.shippingMethodId === choice.id; return <button key={choice.id} type="button" role="radio" className={`${styles.optionCard} ${isSelected ? styles.optionCardActive : ""}`} aria-checked={isSelected} onClick={() => selectShipping(choice.id)} disabled={quoteState === "loading"}><span className={styles.optionHead}><strong>{choice.label}</strong><span>{quote?.shipping.methodId === choice.id ? money(quote.shipping.grossHalalas, locale) : copy.verifyOnSelection}</span></span><span className={styles.optionNote}>{choice.description}</span></button>; })}
            {fieldErrors.shippingMethodId ? <p id="checkout-shipping-error" className={styles.helperText}>{fieldErrors.shippingMethodId}</p> : null}
          </div>

          <div className={styles.radioGrid} role="radiogroup" aria-labelledby="checkout-payment-label" aria-invalid={Boolean(fieldErrors.paymentMethodId)} aria-describedby={fieldErrors.paymentMethodId ? "checkout-payment-error" : undefined} data-checkout-invalid={fieldErrors.paymentMethodId ? "true" : undefined} tabIndex={fieldErrors.paymentMethodId ? -1 : undefined}>
            <p id="checkout-payment-label" className={styles.sectionTitle}>{copy.payment}</p>
            {(quote?.paymentOptions ?? []).map((option) => { const paymentCopy = paymentLabels[locale][option.id]; const isSelected = formState.paymentMethodId === option.id; return <button key={option.id} type="button" role="radio" className={`${styles.optionCard} ${isSelected ? styles.optionCardActive : ""} ${!option.enabled ? styles.optionCardDisabled : ""}`} aria-checked={isSelected} onClick={() => selectPayment(option.id)} disabled={!option.enabled}><span className={styles.optionHead}><strong>{paymentCopy.label}</strong><span>{option.enabled ? copy.available : copy.unavailable}</span></span><span className={styles.optionNote}>{option.enabled ? paymentCopy.description : option.reasonCode === "provider_unavailable" ? copy.providerUnavailable : copy.paymentUnavailable}</span></button>; })}
            {fieldErrors.paymentMethodId ? <p id="checkout-payment-error" className={styles.helperText}>{fieldErrors.paymentMethodId}</p> : null}
          </div>

          <label className={styles.checkboxRow}><input id="checkout-policies" type="checkbox" checked={formState.acceptPolicies} onChange={(event) => updateField("acceptPolicies", event.currentTarget.checked)} aria-invalid={Boolean(fieldErrors.acceptPolicies)} aria-describedby={fieldErrors.acceptPolicies ? "checkout-policies-error" : undefined} data-checkout-invalid={fieldErrors.acceptPolicies ? "true" : undefined} /><span>{copy.termsBefore} <TrackedLink href={localizePath(locale, quote?.policySet.termsPath ?? "/terms")} analyticsLabel="checkout_terms" analyticsSurface="checkout_form">{copy.termsLink}</TrackedLink> {copy.termsAfter}</span></label>
          {fieldErrors.acceptPolicies ? <p id="checkout-policies-error" className={styles.helperText}>{fieldErrors.acceptPolicies}</p> : null}
          <label className={styles.checkboxRow}><input type="checkbox" checked={formState.acceptUpdates} onChange={(event) => updateField("acceptUpdates", event.currentTarget.checked)} /><span>{copy.updates}</span></label>

          {quoteState === "expired" || quoteState === "error" ? <button type="button" className={styles.secondaryButton} onClick={() => setRefreshNonce((value) => value + 1)}>{copy.refresh}</button> : null}
          <button type="submit" className={styles.primaryButton} disabled={recoveryState !== "none" || isSubmitting || quoteState !== "ready" || !quote?.paymentOptions.some((option) => option.enabled)}>{recoveryState !== "none" ? copy.recovering : isSubmitting ? copy.submitting : copy.submit}</button>
        </form>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>{copy.quoteAuthority}</p><h2>{quote ? money(quote.totalGrossHalalas, locale) : "—"}</h2>
            <div className={styles.summaryList}>
              {(quote?.lines ?? []).map((line) => <div key={`${line.productSlug}:${line.sku}`} className={styles.summaryRow}><span>{isEnglish ? line.nameEn : line.nameAr} × {line.quantity}</span><strong className={styles.summaryValue}>{money(line.lineGrossHalalas, locale)}</strong></div>)}
              <div className={styles.summaryRow}><span>{copy.subtotal}</span><strong className={styles.summaryValue}>{quote ? money(quote.subtotalGrossHalalas, locale) : "—"}</strong></div>
              {quote?.promotion ? <div className={styles.summaryRow}><span>{isEnglish ? quote.promotion.titleEn : quote.promotion.titleAr}</span><strong className={styles.summaryValue}>−{money(quote.discountGrossHalalas, locale)}</strong></div> : null}
              <div className={styles.summaryRow}><span>{copy.shipping}</span><strong className={styles.summaryValue}>{quote ? money(quote.shipping.grossHalalas, locale) : "—"}</strong></div>
              <div className={styles.summaryRow}><span>{copy.vat}</span><strong className={styles.summaryValue}>{quote ? money(quote.totalVatHalalas, locale) : "—"}</strong></div>
            </div>
            <div className={styles.summaryRow}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{copy.couponCode}</span>
                <input className={styles.textInput} value={couponCode} onChange={(event) => setCouponCode(event.currentTarget.value.toUpperCase())} maxLength={32} autoComplete="off" />
              </label>
              <button type="button" className={styles.secondaryButton} onClick={() => { setAppliedCouponCode(couponCode.trim() || null); setRefreshNonce((value) => value + 1); }}>
                {copy.applyCoupon}
              </button>
            </div>
            <p className={styles.helperText}>{quote ? (isEnglish ? quote.shipping.estimatedDeliveryEn : quote.shipping.estimatedDeliveryAr) : copy.deliveryPending}</p>
          </article>
          <article className={styles.summaryCard}><p className={styles.sectionTitle}>{copy.processGuarantee}</p><h2>{copy.processTitle}</h2><p>{copy.processBody}</p><TrackedLink href={localizePath(locale, "/cart")} className={styles.secondaryLink} analyticsLabel="checkout_edit_cart" analyticsSurface="checkout_summary">{copy.editCart}</TrackedLink></article>
        </aside>
      </section>
    </div>
  );
}
