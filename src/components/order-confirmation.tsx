"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { getOrderFulfillmentPlan } from "@/lib/fulfillment";
import {
  getOrderTimeline,
  getPaymentMethodById,
  getPhoneLastFour,
  getShippingMethodById,
  ORDER_STORAGE_KEY,
  sanitizeStoredOrders,
  type StoredOrder,
} from "@/lib/orders";
import { footerPolicyLinks } from "@/lib/site-content";
import styles from "./order-flow.module.css";

type OrderConfirmationProps = {
  orderNumber: string;
};

export function OrderConfirmation({ orderNumber }: OrderConfirmationProps) {
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawOrders = window.localStorage.getItem(ORDER_STORAGE_KEY);
      const parsedOrders = rawOrders ? JSON.parse(rawOrders) : [];
      const orders = sanitizeStoredOrders(parsedOrders);

      setOrder(
        orders.find(
          (candidate) => candidate.orderNumber === orderNumber.trim().toUpperCase(),
        ) ?? null,
      );
    } catch {
      setOrder(null);
    } finally {
      setIsHydrated(true);
    }
  }, [orderNumber]);

  if (!isHydrated) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Order confirmation</p>
        <h1>جاري استعادة مرجع الطلب</h1>
        <p>
          يتم الآن تحميل الطلب المحفوظ محليًا على هذا المتصفح حتى تظهر صفحة التأكيد.
        </p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Order confirmation</p>
        <h1>لم يتم العثور على الطلب على هذا المتصفح</h1>
        <p>
          قد يكون الرابط فُتح من جهاز آخر أو بعد مسح التخزين المحلي. يمكنك متابعة
          الرحلة عبر صفحة تتبع الطلب أو إنشاء طلب جديد.
        </p>
        <div className={styles.actionColumn}>
          <TrackedLink
            href="/track-order"
            className={styles.primaryLink}
            analyticsLabel="order_success_missing_to_tracking"
            analyticsSurface="order_success_missing"
            analyticsDestinationType="order_tracking"
          >
            تتبع الطلب
          </TrackedLink>
          <TrackedLink
            href="/shop/skincare"
            className={styles.secondaryLink}
            analyticsLabel="order_success_missing_to_shop"
            analyticsSurface="order_success_missing"
            analyticsDestinationType="collection"
          >
            العودة إلى المتجر
          </TrackedLink>
        </div>
      </section>
    );
  }

  const shippingMethod =
    getShippingMethodById(order.shippingMethodId) ?? getShippingMethodById("standard");
  const paymentMethod =
    getPaymentMethodById(order.paymentMethodId) ?? getPaymentMethodById("payment_link");
  const timeline = getOrderTimeline(order);
  const fulfillmentPlan = getOrderFulfillmentPlan(order);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Order confirmed locally</p>
          <h1>تم تثبيت الطلب وإنشاء مرجع متابعة أوضح</h1>
          <p className={styles.summary}>
            تم حفظ الطلب محليًا على هذا المتصفح كخطوة تأسيسية قابلة للربط. المرجع
            التالي هو ما سيُستخدم لاحقًا في التتبع وربط الإشعارات والتشغيل الداخلي.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>مرجع الطلب</p>
            <strong>{order.orderNumber}</strong>
            <span>
              استخدميه مع آخر 4 أرقام من الجوال: {getPhoneLastFour(order.customer.phone)}.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Fulfillment route</p>
            <h2>{fulfillmentPlan.recommendedCarrier}</h2>
            <p>{fulfillmentPlan.estimatedDispatchWindow}</p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Order timeline</p>
          <h2>حالة الطلب الحالية</h2>

          <div className={styles.timeline}>
            {timeline.map((step) => (
              <article
                key={step.key}
                className={`${styles.timelineItem} ${
                  step.state === "current"
                    ? styles.timelineCurrent
                    : step.state === "complete"
                      ? styles.timelineComplete
                      : styles.timelineUpcoming
                }`}
              >
                <div className={styles.optionHead}>
                  <strong>{step.label}</strong>
                  <span className={styles.timelineBadge}>
                    {step.state === "current"
                      ? "الحالة الحالية"
                      : step.state === "complete"
                        ? "مكتمل"
                        : "قادم"}
                  </span>
                </div>
                <p>{step.description}</p>
              </article>
            ))}
          </div>

          <div className={styles.lineList}>
            {order.lines.map((line) => (
              <article key={line.key} className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <h3>{line.productName}</h3>
                    <p className={styles.lineMeta}>{line.variantLabel}</p>
                  </div>
                  <div className={styles.linePrice}>{line.lineTotal} ر.س</div>
                </div>

                <div className={styles.badgeRow}>
                  <span>{line.size}</span>
                  <span>الكمية: {line.quantity}</span>
                  <span>{line.shippingNote}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Reference</p>
          <h2>ملخص التنفيذ الحالي</h2>

          <div className={styles.referenceCard}>
            <div className={styles.referenceRow}>
              <span>منطقة الخدمة</span>
              <strong className={styles.referenceValue}>
                {fulfillmentPlan.deliveryZoneLabel}
              </strong>
            </div>
            <div className={styles.referenceRow}>
              <span>طريقة الشحن</span>
              <strong className={styles.referenceValue}>{shippingMethod?.label}</strong>
            </div>
            <div className={styles.referenceRow}>
              <span>الدفع</span>
              <strong className={styles.referenceValue}>{paymentMethod?.label}</strong>
            </div>
            <div className={styles.referenceRow}>
              <span>الإجمالي التقديري</span>
              <strong className={styles.referenceValue}>{order.totalEstimate} ر.س</strong>
            </div>
          </div>

          {fulfillmentPlan.requiresManualReview ? (
            <div className={styles.inlineError}>
              {fulfillmentPlan.manualReviewReasons.join(" ")}
            </div>
          ) : (
            <div className={styles.inlineNotice}>
              مسار التنفيذ الحالي لا يحتاج مراجعة يدوية إضافية داخل النموذج المحلي.
            </div>
          )}

          <div className={styles.summaryList}>
            {fulfillmentPlan.notifications.map((notification) => (
              <div key={notification.key} className={styles.referenceCard}>
                <div className={styles.referenceRow}>
                  <span>{notification.label}</span>
                  <strong className={styles.referenceValue}>{notification.status}</strong>
                </div>
                <p>{notification.note}</p>
              </div>
            ))}
          </div>

          <div className={styles.actionColumn}>
            <TrackedLink
              href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
              className={styles.primaryLink}
              analyticsLabel="order_success_to_tracking"
              analyticsSurface="order_success_summary"
              analyticsDestinationType="order_tracking"
            >
              تتبع الطلب
            </TrackedLink>
            <TrackedLink
              href="/ops/fulfillment"
              className={styles.secondaryLink}
              analyticsLabel="order_success_to_ops_fulfillment"
              analyticsSurface="order_success_summary"
              analyticsDestinationType="ops_fulfillment"
            >
              مراجعة fulfillment الداخلي
            </TrackedLink>
          </div>

          <div className={styles.linkList}>
            {footerPolicyLinks.map((policy) => (
              <TrackedLink
                key={policy.href}
                href={policy.href}
                analyticsLabel={`order_success_policy_${policy.href.split("/").at(-1) ?? "route"}`}
                analyticsSurface="order_success_policies"
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
