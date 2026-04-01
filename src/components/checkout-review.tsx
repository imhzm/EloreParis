"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import {
  getPageType,
  trackAnalyticsEvent,
} from "@/lib/analytics";
import {
  createStoredOrder,
  getPaymentMethodById,
  getShippingMethodById,
  ORDER_STORAGE_KEY,
  paymentMethods,
  sanitizeStoredOrders,
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

function validateCheckoutForm(formState: CheckoutFormState) {
  const normalizedPhone = formState.phone.replace(/\D/g, "");

  if (formState.fullName.trim().length < 4) {
    return "يرجى إدخال اسم واضح حتى يمكن ربط الطلب بمرجع قابل للمتابعة.";
  }

  if (normalizedPhone.length < 9) {
    return "رقم الجوال مطلوب بصيغة قابلة للتواصل وتتبع الحالة.";
  }

  if (formState.city.trim().length < 2 || formState.district.trim().length < 2) {
    return "يرجى تحديد المدينة والحي حتى تصبح نافذة الشحن مفهومة من البداية.";
  }

  if (formState.addressLine.trim().length < 8) {
    return "أضيفي عنوانًا أدق حتى تكون خطوة الطلب قابلة للتحويل إلى تشغيل فعلي لاحقًا.";
  }

  if (
    formState.email.trim().length > 0 &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())
  ) {
    return "البريد الإلكتروني المدخل لا يبدو صالحًا.";
  }

  if (!formState.acceptPolicies) {
    return "يلزم تأكيد مراجعة سياسات الشحن والخصوصية والاسترجاع قبل تثبيت الطلب.";
  }

  return null;
}

export function CheckoutReview() {
  const pathname = usePathname() ?? "/checkout";
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [formState, setFormState] = useState(initialFormState);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { cartCount, clearCart, isHydrated, lines, subtotal } = useCart();

  const selectedShipping =
    getShippingMethodById(formState.shippingMethodId) ?? shippingMethods[0];
  const selectedPayment =
    getPaymentMethodById(formState.paymentMethodId) ?? paymentMethods[0];
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

  if (!isHydrated) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Checkout</p>
        <h1>جاري تحميل خطوة تثبيت الطلب</h1>
        <p>يتم الآن استعادة السلة حتى تظهر تفاصيل الطلب ونموذج التسليم بالشكل الصحيح.</p>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Checkout</p>
        <h1>لا يمكن تثبيت الطلب بدون عناصر في السلة</h1>
        <p>
          أصبحت هذه الخطوة الآن مسؤولة عن جمع بيانات الطلب وتوليد مرجع قابل للتتبع،
          لذلك يجب أن تبدأ من سلة تحتوي عناصر فعلية.
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

    const validationError = validateCheckoutForm(formState);

    if (validationError) {
      setSubmissionError(validationError);
      return;
    }

    try {
      const rawOrders = window.localStorage.getItem(ORDER_STORAGE_KEY);
      const parsedOrders = rawOrders ? JSON.parse(rawOrders) : [];
      const existingOrders = sanitizeStoredOrders(parsedOrders);
      const order = createStoredOrder({
        lines,
        customer: {
          fullName: formState.fullName,
          phone: formState.phone,
          email: formState.email,
          city: formState.city,
          district: formState.district,
          addressLine: formState.addressLine,
          notes: formState.notes,
        },
        shippingMethodId: formState.shippingMethodId,
        paymentMethodId: formState.paymentMethodId,
      });

      window.localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify([order, ...existingOrders]),
      );

      clearCart();
      setSubmissionError(null);

      trackAnalyticsEvent("checkout_complete", {
        source_path: pathname,
        source_page_type: getPageType(pathname),
        order_reference: order.orderNumber,
        cart_count: cartCount,
        subtotal: order.subtotal,
        shipping_method: order.shippingMethodId,
        payment_method: order.paymentMethodId,
        total_estimate: order.totalEstimate,
      });

      startTransition(() => {
        router.push(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
      });
    } catch {
      setSubmissionError(
        "تعذر حفظ الطلب على هذا المتصفح. راجعي إعدادات التخزين المحلي ثم أعيدي المحاولة.",
      );
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Checkout handoff</p>
          <h1>ثبّتي الطلب بمرجع واضح وخطوة تشغيل قابلة للمتابعة</h1>
          <p className={styles.summary}>
            انتقلت هذه الخطوة من مراجعة ثابتة إلى handoff حقيقي: بيانات التسليم،
            تفضيل الشحن، آلية الدفع المناسبة لهذه المرحلة، ثم إنشاء مرجع طلب يمكن تتبعه.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>إجمالي العناصر</p>
            <strong>{cartCount}</strong>
            <span>
              يتم استخدام نفس عناصر السلة الحالية لتكوين الطلب، ثم حفظ مرجعه محليًا
              على هذا المتصفح لحين ربط backend فعلي.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Operational note</p>
            <h2>الرسوم والتسليم هنا تقديرية وليست claim نهائيًا</h2>
            <p>
              هذه الطبقة صادقة: اختيار الشحن والدفع موجودان، لكن التثبيت النهائي
              لبوابات الدفع ومزودات الشحن سيأتي في المرحلة التشغيلية التالية.
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
              <span className={styles.helperText}>اختياري، ويفيد في مشاركة التحديثات لاحقًا.</span>
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
                onChange={(event) => updateField("addressLine", event.currentTarget.value)}
                autoComplete="street-address"
              />
            </label>

            <div className={styles.fieldFull}>
              <span className={styles.fieldLabel}>اختيار الشحن</span>
              <div className={styles.radioGrid}>
                {shippingMethods.map((method) => {
                  const isActive = method.id === formState.shippingMethodId;

                  return (
                    <label
                      key={method.id}
                      className={`${styles.optionCard} ${isActive ? styles.optionCardActive : ""}`}
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
                          onChange={() => updateField("shippingMethodId", method.id)}
                        />
                      </div>
                      <div className={styles.badgeRow}>
                        <span>{method.deliveryWindow}</span>
                        <span>تقدير الشحن: {method.estimatedFee} ر.س</span>
                      </div>
                      <p className={styles.optionNote}>{method.note}</p>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.fieldFull}>
              <span className={styles.fieldLabel}>اختيار الدفع</span>
              <div className={styles.radioGrid}>
                {paymentMethods.map((method) => {
                  const isActive = method.id === formState.paymentMethodId;

                  return (
                    <label
                      key={method.id}
                      className={`${styles.optionCard} ${isActive ? styles.optionCardActive : ""}`}
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
                          onChange={() => updateField("paymentMethodId", method.id)}
                        />
                      </div>
                      <p className={styles.optionNote}>{method.note}</p>
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
                  التأسيسية تحفظ الطلب محليًا على هذا المتصفح.
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
                  أوافق على استخدام بيانات التواصل لإرسال تحديثات تشغيلية تخص الطلب فقط.
                </span>
              </span>
            </label>
          </div>

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
              <span>نافذة التسليم</span>
              <strong className={styles.summaryValue}>{selectedShipping.deliveryWindow}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>آلية الدفع</span>
              <strong className={styles.summaryValue}>{selectedPayment.label}</strong>
            </div>
          </div>

          <div className={styles.inlineNotice}>
            يتم إنشاء مرجع الطلب على هذا المتصفح فقط في هذه المرحلة، ثم يمكن استخدامه
            داخل صفحة تتبع الطلب لمراجعة الحالة الحالية.
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
