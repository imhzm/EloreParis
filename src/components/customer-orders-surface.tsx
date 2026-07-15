import { TrackedLink } from "@/components/tracked-link";
import { localizePath, type Locale } from "@/lib/i18n";
import type {
  OrderStatus,
  PaymentMethodId,
  ShippingMethodId,
} from "@/lib/orders";
import styles from "./order-flow.module.css";

export type CustomerOrderSummary = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethodId: PaymentMethodId;
  shippingMethodId: ShippingMethodId;
  paymentUrl: string | null;
  trackingNumber: string | null;
};

type Props = {
  locale: Locale;
  orders: CustomerOrderSummary[];
};

const copy = {
  ar: {
    eyebrow: "وصول العميل",
    title: "راجعي طلباتك من مكان واحد.",
    body: "تعرض هذه الصفحة الطلبات المرتبطة بحسابك أو بجلسة الوصول الآمنة على هذا الجهاز فقط.",
    scope: "نطاق الوصول",
    orderCount: (count: number) => `${count} طلب موثّق`,
    scopeBody: "بعد ربط الحساب تظهر طلباتك الموثقة عبر أجهزتك، وإلا يظل الوصول مرتبطًا بهذا الجهاز.",
    next: "تفاصيل مفيدة",
    detailTitle: "المعلومات المهمة دون مراجع تشغيلية داخلية",
    detailBody: "نعرض حالة الطلب وطريقة الدفع والشحن ورقم التتبع عند توفره. تبقى مراجع المزوّد والتسوية والحجز داخل الأنظمة التشغيلية.",
    listEyebrow: "الطلبات الموثّقة",
    listTitle: "قائمة الطلبات",
    createdAt: "تاريخ الطلب",
    payment: "الدفع",
    shipping: "الشحن",
    trackingNumber: "رقم التتبع",
    pending: "قيد الانتظار",
    completePayment: "إكمال الدفع",
    track: "تتبّع الطلب",
    empty: "لا توجد طلبات موثّقة لهذا الحساب أو الجهاز حاليًا. ابدئي من تتبّع الطلب باستخدام مرجعه.",
    routes: "مسارات الوصول",
    routesTitle: "ادخلي إلى الطلب الصحيح بالمرجع الأوضح",
    trackAnother: "تتبّع طلب آخر",
    shop: "العودة إلى المتجر",
  },
  en: {
    eyebrow: "Customer access",
    title: "Review your orders in one place.",
    body: "This page shows only orders linked to your account or secure access session on this device.",
    scope: "Access scope",
    orderCount: (count: number) => `${count} verified ${count === 1 ? "order" : "orders"}`,
    scopeBody: "Once your account is linked, verified orders can appear across devices; otherwise access stays tied to this device.",
    next: "Useful details",
    detailTitle: "Customer-relevant information without internal references",
    detailBody: "We show status, payment and shipping methods, and the tracking number when available. Provider, settlement and booking references remain operational-only.",
    listEyebrow: "Verified orders",
    listTitle: "Order list",
    createdAt: "Order date",
    payment: "Payment",
    shipping: "Shipping",
    trackingNumber: "Tracking number",
    pending: "Pending",
    completePayment: "Complete payment",
    track: "Track order",
    empty: "No verified orders are available for this account or device. Start by tracking an order with its reference.",
    routes: "Access routes",
    routesTitle: "Open the right order with the clearest reference",
    trackAnother: "Track another order",
    shop: "Return to shop",
  },
} as const;

const statusCopy: Record<Locale, Record<OrderStatus, { label: string; description: string }>> = {
  ar: {
    received: { label: "تم استلام الطلب", description: "تم تسجيل الطلب بمرجع واضح." },
    payment_pending: { label: "بانتظار الدفع", description: "أكملي الدفع من خلال رابط الدفع الآمن عند توفره." },
    confirmed: { label: "تم تأكيد الطلب", description: "الطلب مؤكد وجاهز للتجهيز." },
    processing: { label: "جاري التجهيز", description: "يتم تجهيز عناصر الطلب للخطوة التالية." },
    out_for_delivery: { label: "خرج للتوصيل", description: "الطلب في مرحلة التوصيل النهائية." },
    payment_expired: { label: "انتهت مهلة الدفع", description: "انتهت مهلة الدفع قبل تأكيد الطلب." },
    cancelled: { label: "تم إلغاء الطلب", description: "تم إلغاء الطلب وإيقاف خطوات تنفيذه." },
  },
  en: {
    received: { label: "Order received", description: "The order has been recorded with a clear reference." },
    payment_pending: { label: "Payment pending", description: "Complete payment through the secure payment link when available." },
    confirmed: { label: "Order confirmed", description: "The order is confirmed and ready for preparation." },
    processing: { label: "Being prepared", description: "Your items are being prepared for the next step." },
    out_for_delivery: { label: "Out for delivery", description: "The order is in the final delivery stage." },
    payment_expired: { label: "Payment window expired", description: "The payment window ended before confirmation." },
    cancelled: { label: "Order cancelled", description: "The order and its fulfilment steps have been cancelled." },
  },
};

const paymentCopy: Record<Locale, Record<PaymentMethodId, string>> = {
  ar: { payment_link: "رابط دفع آمن", cash_on_delivery: "الدفع عند الاستلام" },
  en: { payment_link: "Secure payment link", cash_on_delivery: "Cash on delivery" },
};

const shippingCopy: Record<Locale, Record<ShippingMethodId, string>> = {
  ar: { standard: "الشحن القياسي داخل السعودية", express: "الشحن السريع للمدن المغطاة" },
  en: { standard: "Standard shipping within Saudi Arabia", express: "Express shipping in covered cities" },
};

function formatOrderDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function CustomerOrdersSurface({ locale, orders }: Props) {
  const text = copy[locale];
  const sortedOrders = [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className={styles.summary}>{text.body}</p>
        </div>
        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>{text.scope}</p>
            <strong>{text.orderCount(sortedOrders.length)}</strong>
            <span>{text.scopeBody}</span>
          </div>
          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>{text.next}</p>
            <h2>{text.detailTitle}</h2>
            <p>{text.detailBody}</p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>{text.listEyebrow}</p>
          <h2>{text.listTitle}</h2>
          {sortedOrders.length ? (
            <div className={styles.summaryList}>
              {sortedOrders.map((order) => {
                const status = statusCopy[locale][order.status];
                return (
                  <article key={order.orderNumber} className={styles.referenceCard}>
                    <div className={styles.referenceRow}>
                      <span>{order.orderNumber}</span>
                      <strong className={styles.referenceValue}>{status.label}</strong>
                    </div>
                    <p>{status.description}</p>
                    <div className={styles.referenceRow}><span>{text.createdAt}</span><strong className={styles.referenceValue}>{formatOrderDate(order.createdAt, locale)}</strong></div>
                    <div className={styles.referenceRow}><span>{text.payment}</span><strong className={styles.referenceValue}>{paymentCopy[locale][order.paymentMethodId]}</strong></div>
                    <div className={styles.referenceRow}><span>{text.shipping}</span><strong className={styles.referenceValue}>{shippingCopy[locale][order.shippingMethodId]}</strong></div>
                    <div className={styles.referenceRow}><span>{text.trackingNumber}</span><strong className={styles.referenceValue}>{order.trackingNumber ?? text.pending}</strong></div>
                    <div className={styles.actionColumn}>
                      {order.paymentUrl ? (
                        <TrackedLink href={order.paymentUrl} className={styles.primaryLink} analyticsLabel="customer_orders_to_payment_provider" analyticsSurface="customer_orders_list" analyticsDestinationType="payment_provider" target="_blank" rel="noreferrer">
                          {text.completePayment}
                        </TrackedLink>
                      ) : null}
                      <TrackedLink href={`${localizePath(locale, "/track-order")}?order=${encodeURIComponent(order.orderNumber)}`} className={order.paymentUrl ? styles.secondaryLink : styles.primaryLink} analyticsLabel="customer_orders_to_tracking" analyticsSurface="customer_orders_list" analyticsDestinationType="order_tracking">
                        {text.track}
                      </TrackedLink>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className={styles.inlineNotice}>{text.empty}</div>}
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>{text.routes}</p>
          <h2>{text.routesTitle}</h2>
          <div className={styles.actionColumn}>
            <TrackedLink href={localizePath(locale, "/track-order")} className={styles.primaryLink} analyticsLabel="customer_orders_to_track_order" analyticsSurface="customer_orders_empty_state" analyticsDestinationType="order_tracking">{text.trackAnother}</TrackedLink>
            <TrackedLink href={localizePath(locale, "/shop")} className={styles.secondaryLink} analyticsLabel="customer_orders_to_shop" analyticsSurface="customer_orders_empty_state" analyticsDestinationType="collection_hub">{text.shop}</TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
