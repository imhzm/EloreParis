"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import {
  type CheckoutSubmissionInput,
  validateCheckoutSubmission,
} from "@/lib/checkout-validation";
import { getCheckoutRules } from "@/lib/fulfillment";
import { createOrderThroughAuthority } from "@/lib/order-authority-client";
import {
  getPaymentMethodById,
  getShippingMethodById,
  paymentMethods,
  shippingMethods,
  type CheckoutCustomerDetails,
  type PaymentMethodId,
  type ShippingMethodId,
} from "@/lib/orders";
import { footerPolicyLinks } from "@/lib/site-content";
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

export function CheckoutReview() {
  const pathname = usePathname() ?? "/checkout";
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { cartCount, clearCart, isHydrated, items, lines, subtotal } = useCart();

  const checkoutRules = useMemo(
    () => getCheckoutRules(lines, formState.city, subtotal),
    [formState.city, lines, subtotal],
  );

  const effectiveShippingMethodId =
    checkoutRules.shippingOptions.find(
      (option) => option.id === formState.shippingMethodId && option.enabled,
    )?.id ?? checkoutRules.recommendedShippingMethodId;

  const effectivePaymentMethodId =
    checkoutRules.paymentOptions.find(
      (option) => option.id === formState.paymentMethodId && option.enabled,
    )?.id ?? checkoutRules.recommendedPaymentMethodId;

  const selectedShipping =
    getShippingMethodById(effectiveShippingMethodId) ?? shippingMethods[0];
  const selectedPayment =
    getPaymentMethodById(effectivePaymentMethodId) ?? paymentMethods[0];
  const totalEstimate = useMemo(
    () => subtotal + selectedShipping.estimatedFee,
    [selectedShipping.estimatedFee, subtotal],
  );

  function updateField<Field extends keyof CheckoutFormState>(
    field: Field,
    value: CheckoutFormState[Field],
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleShippingSelection(methodId: ShippingMethodId) {
    const option = checkoutRules.shippingOptions.find(
      (candidate) => candidate.id === methodId,
    );

    if (!option?.enabled || formState.shippingMethodId === methodId) {
      return;
    }

    trackAnalyticsEvent("checkout_option_change", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      option_group: "shipping",
      option_value: methodId,
      delivery_zone: checkoutRules.deliveryZoneId,
      express_eligible: checkoutRules.expressEligible,
    });

    updateField("shippingMethodId", methodId);
  }

  function handlePaymentSelection(methodId: PaymentMethodId) {
    const option = checkoutRules.paymentOptions.find(
      (candidate) => candidate.id === methodId,
    );

    if (!option?.enabled || formState.paymentMethodId === methodId) {
      return;
    }

    trackAnalyticsEvent("checkout_option_change", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      option_group: "payment",
      option_value: methodId,
      delivery_zone: checkoutRules.deliveryZoneId,
      cod_eligible: checkoutRules.codEligible,
    });

    updateField("paymentMethodId", methodId);
  }

  if (!isHydrated) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Checkout</p>
        <h1>جاري تحميل خطوة تثبيت الطلب</h1>
        <p>
          يتم الآن استعادة السلة حتى تظهر تفاصيل الطلب ونموذج التسليم بالشكل
          الصحيح.
        </p>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Checkout</p>
        <h1>لا يمكن تثبيت الطلب بدون عناصر في السلة</h1>
        <p>
          أصبحت هذه الخطوة الآن مسؤولة عن جمع بيانات الطلب وتوليد مرجع قابل
          للتتبع، لذلك يجب أن تبدأ من سلة تحتوي عناصر فعلية.
        </p>
        <div className={styles.actionColumn}>
          <TrackedLink
            href="/cart"
            className={styles.primaryLink}
            analyticsLabel="checkout_empty_to_cart"
            analyticsSurface="checkout_empty"
            analyticsDestinationType="cart"
          >
            العودة إلى السلة
          </TrackedLink>
          <TrackedLink
            href="/shop/makeup"
            className={styles.secondaryLink}
            analyticsLabel="checkout_empty_to_makeup"
            analyticsSurface="checkout_empty"
            analyticsDestinationType="collection"
          >
            الاستمرار في التصفح
          </TrackedLink>
        </div>
      </section>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const effectiveFormState = {
      ...formState,
      shippingMethodId: effectiveShippingMethodId,
      paymentMethodId: effectivePaymentMethodId,
    } satisfies CheckoutSubmissionInput;

    const validationError = validateCheckoutSubmission(
      effectiveFormState,
      checkoutRules,
    );

    if (validationError) {
      setSubmissionError(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    void createOrderThroughAuthority({
      items,
      checkout: effectiveFormState,
    })
      .then(({ order }) => {
        clearCart();

        trackAnalyticsEvent("checkout_complete", {
          source_path: pathname,
          source_page_type: getPageType(pathname),
          order_reference: order.orderNumber,
          cart_count: cartCount,
          subtotal: order.subtotal,
          shipping_method: order.shippingMethodId,
          payment_method: order.paymentMethodId,
          total_estimate: order.totalEstimate,
          delivery_zone: checkoutRules.deliveryZoneId,
          cod_eligible: checkoutRules.codEligible,
          express_eligible: checkoutRules.expressEligible,
        });

        router.push(
          `/checkout/success?order=${encodeURIComponent(order.orderNumber)}`,
        );
      })
      .catch((error: unknown) => {
        setSubmissionError(
          error instanceof Error
            ? error.message
            : "تعذر إنشاء الطلب داخل authority الحالية للتطبيق.",
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Checkout handoff</p>
          <h1>ثبّتي الطلب بمرجع واضح وخطوة تشغيل قابلة للمتابعة</h1>
          <p className={styles.summary}>
            هذه الخطوة لم تعد مراجعة ساكنة. الآن هي handoff حقيقي يطبّق قواعد
            المدينة والشحن والدفع على عناصر السلة الحالية قبل إنشاء مرجع الطلب.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>إجمالي العناصر</p>
            <strong>{cartCount}</strong>
            <span>
              يتم استخدام عناصر السلة الحالية لبناء قرار تشغيلي أوضح: نافذة خدمة،
              أهلية COD، وحدود fulfillment قبل تثبيت المرجع.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Route rules</p>
            <h2>{checkoutRules.deliveryZoneLabel}</h2>
            <p>
              {checkoutRules.codEligible
                ? "الدفع عند الاستلام متاح لهذا الطلب ضمن القواعد الحالية."
                : "هذا الطلب يميل حاليًا إلى رابط دفع تشغيلي بسبب المدينة أو نوع العناصر أو قيمة الطلب."}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <form className={styles.mainCard} onSubmit={handleSubmit}>
          <p className={styles.sectionTitle}>Order details</p>
          <h2>بيانات الطلب والتسليم</h2>
          <p>
            الهدف هنا هو جمع الحد الأدنى الصحيح لتحويل قرار الشراء إلى طلب يمكن
            تأكيده وتتبع حالته لاحقًا دون طلب بيانات غير لازمة.
          </p>

          <div className={styles.lineList}>
            {lines.map((line) => (
              <article key={line.key} className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <h3>{line.product.name}</h3>
                    <p className={styles.lineMeta}>{line.variant.label}</p>
                  </div>
                  <div className={styles.linePrice}>{line.lineTotal} ر.س</div>
                </div>

                <div className={styles.badgeRow}>
                  <span>{line.variant.size}</span>
                  <span>الكمية: {line.quantity}</span>
                  <span>{line.product.shippingNote}</span>
                  <span>
                    {line.variant.availability === "PreOrder"
                      ? "PreOrder"
                      : "InStock"}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>الاسم الكامل</span>
              <input
                className={styles.textInput}
                value={formState.fullName}
                onChange={(event) => updateField("fullName", event.currentTarget.value)}
                autoComplete="name"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>رقم الجوال</span>
              <input
                className={styles.textInput}
                value={formState.phone}
                onChange={(event) => updateField("phone", event.currentTarget.value)}
                autoComplete="tel"
                inputMode="tel"
                dir="ltr"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>البريد الإلكتروني</span>
              <input
                className={styles.textInput}
                value={formState.email}
                onChange={(event) => updateField("email", event.currentTarget.value)}
                autoComplete="email"
                inputMode="email"
                dir="ltr"
              />
              <span className={styles.helperText}>
                اختياري، لكنه يجعل الرسائل التشغيلية أوضح إذا اخترتِ استقبالها.
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>المدينة</span>
              <input
                className={styles.textInput}
                value={formState.city}
                onChange={(event) => updateField("city", event.currentTarget.value)}
                autoComplete="address-level2"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>الحي</span>
              <input
                className={styles.textInput}
                value={formState.district}
                onChange={(event) => updateField("district", event.currentTarget.value)}
                autoComplete="address-level3"
              />
            </label>

            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>العنوان التفصيلي</span>
              <textarea
                className={styles.textArea}
                value={formState.addressLine}
                onChange={(event) =>
                  updateField("addressLine", event.currentTarget.value)
                }
                autoComplete="street-address"
              />
            </label>

            <div className={styles.fieldFull}>
              <span className={styles.fieldLabel}>اختيار الشحن</span>
              <div className={styles.radioGrid}>
                {shippingMethods.map((method) => {
                  const availability = checkoutRules.shippingOptions.find(
                    (option) => option.id === method.id,
                  );
                  const isActive = method.id === effectiveShippingMethodId;
                  const isDisabled = !availability?.enabled;

                  return (
                    <label
                      key={method.id}
                      className={`${styles.optionCard} ${
                        isActive ? styles.optionCardActive : ""
                      } ${isDisabled ? styles.optionCardDisabled : ""}`}
                    >
                      <div className={styles.optionHead}>
                        <div>
                          <strong>{method.label}</strong>
                          <p className={styles.optionNote}>{method.summary}</p>
                        </div>
                        <input
                          className={styles.optionRadio}
                          type="radio"
                          name="shipping-method"
                          checked={isActive}
                          disabled={isDisabled}
                          onChange={() => handleShippingSelection(method.id)}
                        />
                      </div>
                      <div className={styles.badgeRow}>
                        <span>{method.deliveryWindow}</span>
                        <span>تقدير الشحن: {method.estimatedFee} ر.س</span>
                      </div>
                      <p className={styles.optionNote}>
                        {availability?.reason ?? method.note}
                      </p>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.fieldFull}>
              <span className={styles.fieldLabel}>اختيار الدفع</span>
              <div className={styles.radioGrid}>
                {paymentMethods.map((method) => {
                  const availability = checkoutRules.paymentOptions.find(
                    (option) => option.id === method.id,
                  );
                  const isActive = method.id === effectivePaymentMethodId;
                  const isDisabled = !availability?.enabled;

                  return (
                    <label
                      key={method.id}
                      className={`${styles.optionCard} ${
                        isActive ? styles.optionCardActive : ""
                      } ${isDisabled ? styles.optionCardDisabled : ""}`}
                    >
                      <div className={styles.optionHead}>
                        <div>
                          <strong>{method.label}</strong>
                          <p className={styles.optionNote}>{method.summary}</p>
                        </div>
                        <input
                          className={styles.optionRadio}
                          type="radio"
                          name="payment-method"
                          checked={isActive}
                          disabled={isDisabled}
                          onChange={() => handlePaymentSelection(method.id)}
                        />
                      </div>
                      <p className={styles.optionNote}>
                        {availability?.reason ?? method.note}
                      </p>
                    </label>
                  );
                })}
              </div>
            </div>

            <label className={styles.fieldFull}>
              <span className={styles.fieldLabel}>ملاحظات إضافية</span>
              <textarea
                className={styles.textArea}
                value={formState.notes}
                onChange={(event) => updateField("notes", event.currentTarget.value)}
              />
              <span className={styles.helperText}>
                استخدمي هذه المساحة فقط لما يخدم التسليم أو تجهيز الطلب.
              </span>
            </label>

            <label className={styles.fieldFull}>
              <span className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={formState.acceptPolicies}
                  onChange={(event) =>
                    updateField("acceptPolicies", event.currentTarget.checked)
                  }
                />
                <span>
                  راجعت سياسات الشحن والخصوصية والاسترجاع وأفهم أن هذه النسخة
                  التأسيسية تحفظ الطلب داخل authority التطبيق الحالية قبل ربط
                  نظام طلبات خارجي.
                </span>
              </span>
            </label>

            <label className={styles.fieldFull}>
              <span className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={formState.acceptUpdates}
                  onChange={(event) =>
                    updateField("acceptUpdates", event.currentTarget.checked)
                  }
                />
                <span>
                  أوافق على استخدام بيانات التواصل لإرسال تحديثات تشغيلية تخص
                  الطلب فقط.
                </span>
              </span>
            </label>
          </div>

          <div className={styles.inlineNotice}>
            منطقة الخدمة الحالية: <strong>{checkoutRules.deliveryZoneLabel}</strong>.{" "}
            {checkoutRules.expressEligible
              ? "الشحن السريع متاح."
              : "الشحن السريع غير متاح حاليًا."}{" "}
            {checkoutRules.codEligible
              ? "الدفع عند الاستلام متاح."
              : "الدفع عند الاستلام غير متاح لهذا الطلب الآن."}
          </div>

          {checkoutRules.manualReviewReasons.length ? (
            <div className={styles.inlineNotice}>
              {checkoutRules.manualReviewReasons.join(" ")}
            </div>
          ) : null}

          {submissionError ? (
            <div className={styles.inlineError}>{submissionError}</div>
          ) : null}

          <div className={styles.actionColumn}>
            <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري تثبيت الطلب..." : "تثبيت الطلب وإنشاء المرجع"}
            </button>

            <TrackedLink
              href="/cart"
              className={styles.secondaryLink}
              analyticsLabel="checkout_back_to_cart"
              analyticsSurface="checkout_form"
              analyticsDestinationType="cart"
            >
              العودة إلى السلة
            </TrackedLink>
          </div>
        </form>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Checkout summary</p>
          <h2>الملخص الحالي قبل تثبيت الطلب</h2>

          <div className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <span>إجمالي السلة</span>
              <strong className={styles.summaryValue}>{subtotal} ر.س</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>رسوم الشحن التقديرية</span>
              <strong className={styles.summaryValue}>
                {selectedShipping.estimatedFee} ر.س
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>الإجمالي التقديري</span>
              <strong className={styles.summaryValue}>{totalEstimate} ر.س</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>منطقة الخدمة</span>
              <strong className={styles.summaryValue}>
                {checkoutRules.deliveryZoneLabel}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>نافذة التسليم</span>
              <strong className={styles.summaryValue}>
                {selectedShipping.deliveryWindow}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>آلية الدفع</span>
              <strong className={styles.summaryValue}>{selectedPayment.label}</strong>
            </div>
          </div>

          <div className={styles.inlineNotice}>
            سيتم إنشاء مرجع الطلب داخل authority التطبيق الحالية، بينما تظل
            database أو منصة الطلبات النهائية مؤجلة إلى phase التشغيل التالية.
          </div>

          <div className={styles.linkList}>
            {footerPolicyLinks.map((policy) => (
              <TrackedLink
                key={policy.href}
                href={policy.href}
                analyticsLabel={`checkout_policy_${policy.href.split("/").at(-1) ?? "route"}`}
                analyticsSurface="checkout_policies"
                analyticsDestinationType="trust_policy"
              >
                <span>{policy.label}</span>
                <span>طبقة الثقة</span>
              </TrackedLink>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
