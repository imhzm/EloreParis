"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { fetchRecentOrderFromAuthority } from "@/lib/order-authority-client";
import { localizePath, type Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/orders";
import styles from "./order-flow.module.css";

type OrderConfirmationProps = {
  orderNumber: string;
  locale?: Locale;
};

const statusCopy: Record<StoredOrder["status"], { ar: string; en: string }> = {
  received: { ar: "تم استلام الطلب", en: "Order received" },
  payment_pending: { ar: "بانتظار الدفع", en: "Payment pending" },
  confirmed: { ar: "تم تأكيد الطلب", en: "Order confirmed" },
  processing: { ar: "قيد التجهيز", en: "Preparing your order" },
  out_for_delivery: { ar: "خرج للتوصيل", en: "Out for delivery" },
  payment_expired: { ar: "انتهت مهلة الدفع", en: "Payment window expired" },
  cancelled: { ar: "تم إلغاء الطلب", en: "Order cancelled" },
};

const copy = {
  ar: {
    loading: "جارٍ استعادة مرجع الطلب",
    missingTitle: "تعذر فتح تفاصيل الطلب",
    missingBody: "قد يكون الرابط فُتح خارج نفس جلسة الطلب أو انتهت صلاحية الوصول القصير. استخدمي صفحة التتبع للمتابعة بأمان.",
    title: "تم حفظ الطلب وإنشاء مرجع متابعة.",
    body: "احتفظي بالمرجع التالي. تعرض هذه الصفحة معلومات العميل الضرورية فقط، من دون تفاصيل المورد أو المخزون أو المزود الداخلية.",
    reference: "مرجع الطلب",
    items: "عناصر الطلب",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    total: "الإجمالي",
    payment: "الدفع",
    shippingMethod: "طريقة الشحن",
    track: "تتبع الطلب",
    shop: "العودة إلى المتجر",
    pay: "متابعة الدفع الآمن",
  },
  en: {
    loading: "Restoring your order reference",
    missingTitle: "We could not open this order",
    missingBody: "The link may have been opened outside the original checkout session or its short access window may have expired. Use order tracking to continue safely.",
    title: "Your order is saved with a tracking reference.",
    body: "Keep the reference below. This page shows only the customer details needed for the journey, never internal supplier, inventory or provider data.",
    reference: "Order reference",
    items: "Order items",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    payment: "Payment",
    shippingMethod: "Shipping method",
    track: "Track order",
    shop: "Return to shop",
    pay: "Continue secure payment",
  },
} as const;

function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
  }).format(value);
}

export function OrderConfirmation({
  orderNumber,
  locale = "ar",
}: OrderConfirmationProps) {
  const text = copy[locale];
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(orderNumber));

  useEffect(() => {
    if (!orderNumber) return;
    const controller = new AbortController();
    void fetchRecentOrderFromAuthority(orderNumber)
      .then(({ order: nextOrder }) => {
        if (!controller.signal.aborted) setOrder(nextOrder);
      })
      .catch(() => {
        if (!controller.signal.aborted) setOrder(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [orderNumber]);

  if (isLoading) {
    return <section className={styles.emptyCard}><p className={styles.eyebrow}>Order confirmation</p><h1>{text.loading}</h1></section>;
  }

  if (!order) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Protected order view</p>
        <h1>{text.missingTitle}</h1><p>{text.missingBody}</p>
        <div className={styles.actionColumn}>
          <TrackedLink href={localizePath(locale, "/track-order")} className={styles.primaryLink} analyticsLabel="order_missing_tracking" analyticsSurface="order_success">{text.track}</TrackedLink>
          <TrackedLink href={localizePath(locale, "/shop")} className={styles.secondaryLink} analyticsLabel="order_missing_shop" analyticsSurface="order_success">{text.shop}</TrackedLink>
        </div>
      </section>
    );
  }

  const status = statusCopy[order.status][locale];
  const paymentLabel = order.paymentMethodId === "payment_link"
    ? locale === "ar" ? "رابط دفع" : "Payment link"
    : locale === "ar" ? "الدفع عند الاستلام" : "Cash on delivery";
  const shippingLabel = order.shippingMethodId === "express"
    ? locale === "ar" ? "شحن سريع" : "Express shipping"
    : locale === "ar" ? "شحن قياسي" : "Standard shipping";
  const paymentUrl =
    order.paymentMethodId === "payment_link" &&
    order.providerBindings.payment.state !== "confirmed"
      ? order.providerBindings.payment.paymentUrl
      : null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>Order authority · {status}</p><h1>{text.title}</h1><p className={styles.summary}>{text.body}</p></div>
        <div className={styles.heroAside}>
          <div className={styles.metricCard}><p>{text.reference}</p><strong>{order.orderNumber}</strong><span>{status}</span></div>
          <div className={styles.noticeCard}><p className={styles.eyebrow}>Next step</p><h2>{status}</h2><p>{paymentUrl ? text.pay : text.track}</p></div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>{text.items}</p><h2>{order.lines.length} {text.items}</h2>
          <div className={styles.ordersGrid}>
            {order.lines.map((line) => (
              <article key={line.key} className={styles.lineItem}>
                <div className={styles.lineHead}><div><h3>{line.productName}</h3><p className={styles.lineMeta}>{line.variantLabel} · {line.size}</p></div><strong className={styles.linePrice}>{formatMoney(line.lineTotal, locale)}</strong></div>
                <div className={styles.badgeRow}><span>SKU {line.sku}</span><span>× {line.quantity}</span></div>
              </article>
            ))}
          </div>
          <div className={styles.cardActions}>
            {paymentUrl ? <TrackedLink href={paymentUrl} className={styles.primaryLink} analyticsLabel="order_continue_payment" analyticsSurface="order_success">{text.pay}</TrackedLink> : null}
            <TrackedLink href={localizePath(locale, "/track-order")} className={styles.secondaryLink} analyticsLabel="order_success_tracking" analyticsSurface="order_success">{text.track}</TrackedLink>
          </div>
        </article>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>{status}</p><h2>{formatMoney(order.totalEstimate, locale)}</h2>
            <div className={styles.summaryList}>
              <div className={styles.summaryRow}><span>{text.subtotal}</span><strong className={styles.summaryValue}>{formatMoney(order.subtotal, locale)}</strong></div>
              <div className={styles.summaryRow}><span>{text.shipping}</span><strong className={styles.summaryValue}>{formatMoney(order.shippingFeeEstimate, locale)}</strong></div>
              <div className={styles.summaryRow}><span>{text.payment}</span><strong className={styles.summaryValue}>{paymentLabel}</strong></div>
              <div className={styles.summaryRow}><span>{text.shippingMethod}</span><strong className={styles.summaryValue}>{shippingLabel}</strong></div>
            </div>
          </article>
          <article className={styles.summaryCard}><p className={styles.sectionTitle}>Customer-safe view</p><h2>{text.reference}</h2><p>{order.orderNumber}</p><TrackedLink href={localizePath(locale, "/shop")} className={styles.secondaryLink} analyticsLabel="order_success_shop" analyticsSurface="order_success">{text.shop}</TrackedLink></article>
        </aside>
      </section>
    </div>
  );
}
