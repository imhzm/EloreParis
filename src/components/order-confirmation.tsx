"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { getOrderFulfillmentPlan, getOrderProviderHandoff } from "@/lib/fulfillment";
import type { StoredNotification } from "@/lib/notification-types";
import { fetchRecentOrderFromAuthority } from "@/lib/order-authority-client";
import {
  getOrderStatusMeta,
  getOrderTimeline,
  getPaymentMethodById,
  getPhoneLastFour,
  getShippingMethodById,
  type StoredOrder,
} from "@/lib/orders";
import {
  collectionDirectory,
  footerPolicyLinks,
  products,
} from "@/lib/site-content";
import styles from "./order-flow.module.css";

type OrderConfirmationProps = {
  orderNumber: string;
};

function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function OrderConfirmation({ orderNumber }: OrderConfirmationProps) {
  const hasOrderReference = orderNumber.trim().length > 0;
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [customerAccessHandoffPath, setCustomerAccessHandoffPath] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(hasOrderReference);

  useEffect(() => {
    if (!hasOrderReference) {
      return;
    }

    void fetchRecentOrderFromAuthority(orderNumber)
      .then(
        ({
          order: matchedOrder,
          notifications: nextNotifications,
          customerAccessHandoffPath: nextCustomerAccessHandoffPath,
        }) => {
          setOrder(matchedOrder);
          setNotifications(nextNotifications);
          setCustomerAccessHandoffPath(nextCustomerAccessHandoffPath ?? null);
        },
      )
      .catch(() => {
        setOrder(null);
        setNotifications([]);
        setCustomerAccessHandoffPath(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [hasOrderReference, orderNumber]);

  if (isLoading) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Order confirmation</p>
        <h1>جاري استعادة مرجع الطلب</h1>
        <p>
          يتم الآن تحميل الطلب من authority الحالية للتطبيق حتى تظهر صفحة
          التأكيد.
        </p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className={styles.emptyCard}>
        <p className={styles.eyebrow}>Order confirmation</p>
        <h1>لم يتم العثور على الطلب داخل authority الحالية</h1>
        <p>
          قد يكون رابط التأكيد فُتح خارج نفس جلسة الطلب، أو بعد انتهاء صلاحية
          الوصول القصير الخاص بصفحة التأكيد. يمكنك متابعة الرحلة عبر صفحة تتبع
          الطلب أو إنشاء طلب جديد.
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
  const providerHandoff = getOrderProviderHandoff(order);
  const statusMeta = getOrderStatusMeta(order.status);
  const orderedProducts = dedupeBy(
    order.lines
      .map((line) => products.find((product) => product.slug === line.productSlug))
      .filter((product): product is (typeof products)[number] => Boolean(product)),
    (product) => product.slug,
  );
  const orderedCollections = dedupeBy(
    orderedProducts.map((product) => collectionDirectory[product.collection]),
    (collection) => collection.href,
  );
  const continuationRoutes = dedupeBy(
    orderedProducts.flatMap((product) =>
      product.pairings.map((route) => ({
        ...route,
        productName: product.name,
      })),
    ),
    (route) => route.href,
  ).slice(0, 3);
  const bundleModeTitle =
    orderedProducts.length === 1
      ? "امتداد قرار واحد"
      : orderedCollections.length === 1
        ? `امتداد روتين ${orderedCollections[0]?.title ?? "المسار الحالي"}`
        : "امتداد متعدد المسارات";
  const bundleModeBody =
    orderedProducts.length === 1
      ? "إذا احتجتِ خطوة متابعة إضافية فلتكن route واحدة تخدم نفس قرار الطلب."
      : orderedCollections.length === 1
        ? "الطلب ما زال منضبطًا حول روتين واحد، لذلك أي متابعة لاحقة يجب أن تبقى داخل نفس النية."
        : "الطلب يجمع أكثر من مسار، لذا الأولوية الآن لتتبع التنفيذ لا لإعادة فتح رحلة اكتشاف واسعة.";
  const nextActionTitle =
    order.status === "payment_pending"
      ? "متابعة الدفع"
      : order.status === "received"
        ? "متابعة التأكيد"
        : "متابعة التنفيذ";
  const nextActionBody =
    order.status === "payment_pending"
      ? "احتفظي بمرجع الطلب وراقبي إشعار رابط الدفع أولًا بدل العودة إلى السلة أو إعادة فتح checkout."
      : order.status === "received"
        ? "الطلب تم حفظه بالفعل. المسار الصحيح الآن هو التتبع بنفس المرجع قبل أي تعديل جديد."
        : "الطلب تجاوز مرحلة checkout، لذلك الأفضل متابعة fulfillment والدعم بدل إعادة رحلة الشراء من البداية.";
  const continuationSignals = [
    {
      label: "Current state",
      title: statusMeta.label,
      body: statusMeta.description,
    },
    {
      label: "Next action",
      title: nextActionTitle,
      body: nextActionBody,
    },
    {
      label: "Continuation mode",
      title: bundleModeTitle,
      body: bundleModeBody,
    },
  ];
  const followUpGuardrails = [
    "استخدمي مرجع الطلب وآخر 4 أرقام من الجوال كمسار التتبع الأساسي.",
    "إذا كان الاعتراض تشغيليًا فحلّيه من tracking أولًا بدل العودة إلى checkout.",
    `الإجمالي الحالي ${order.totalEstimate} ر.س، لذلك أي إضافة لاحقة يجب أن تخدم نفس نية الطلب لا أن توسّع السلة عشوائيًا.`,
  ];
  const continuationFallbackRoute =
    orderedCollections[0] === undefined
      ? null
      : {
          href: orderedCollections[0].href,
          label: `العودة إلى ${orderedCollections[0].title}`,
          productName: orderedCollections[0].title,
        };
  const secondaryRoute = continuationRoutes[0] ?? continuationFallbackRoute;
  const activePaymentUrl =
    order.paymentMethodId === "payment_link" &&
    order.providerBindings.payment.state !== "confirmed"
      ? order.providerBindings.payment.paymentUrl
      : null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Order confirmed in app authority</p>
          <h1>تم تثبيت الطلب وإنشاء مرجع متابعة أوضح</h1>
          <p className={styles.summary}>
            تم تسجيل الطلب داخل authority الحالية للتطبيق بدل بقائه مربوطًا
            بالمتصفح فقط. المرجع التالي هو ما سيُستخدم لاحقًا في التتبع وربط
            الإشعارات والتشغيل الداخلي.
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

          <div className={styles.statusSummaryGrid}>
            {continuationSignals.map((signal) => (
              <article key={signal.label} className={styles.statusSummaryCard}>
                <p className={styles.eyebrow}>{signal.label}</p>
                <strong>{signal.title}</strong>
                <p>{signal.body}</p>
              </article>
            ))}
          </div>

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

          <div className={styles.catalogPanelGrid}>
            <article className={styles.referenceCard}>
              <p className={styles.eyebrow}>Post-checkout guardrails</p>
              <h3>أغلقي مسار التنفيذ قبل أي توسعة جديدة</h3>
              <div className={styles.cardActions}>
                {followUpGuardrails.map((item) => (
                  <div key={item} className={styles.infoBullet}>
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.referenceCard}>
              <p className={styles.eyebrow}>Continuation routes</p>
              <h3>خذي مسارًا واحدًا فقط إذا كنتِ ما زلتِ تحتاجين context</h3>
              {continuationRoutes.length ? (
                <div className={styles.linkList}>
                  {continuationRoutes.map((route) => (
                    <TrackedLink
                      key={route.href}
                      href={route.href}
                      analyticsLabel={`order_success_route_${route.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                      analyticsSurface="order_success_routes"
                      analyticsDestinationType="support_route"
                    >
                      <span>{route.label}</span>
                      <span>{route.productName}</span>
                    </TrackedLink>
                  ))}
                </div>
              ) : (
                <div className={styles.infoBullet}>
                  إذا لم تظهر route داعمة فالأفضل متابعة التتبع بدل إعادة فتح browse loop جديدة.
                </div>
              )}
            </article>
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
            <div className={styles.referenceRow}>
              <span>Tracking handoff</span>
              <strong className={styles.referenceValue}>
                {getPhoneLastFour(order.customer.phone)}
              </strong>
            </div>
            <div className={styles.referenceRow}>
              <span>Provider state</span>
              <strong className={styles.referenceValue}>
                {providerHandoff.providerReadinessLabel}
              </strong>
            </div>
              <div className={styles.referenceRow}>
                <span>Payment reference</span>
                <strong className={styles.referenceValue}>
                  {order.providerBindings.payment.referenceId ?? "pending"}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>Settlement reference</span>
                <strong className={styles.referenceValue}>
                  {order.providerBindings.payment.settlementReference ?? "pending"}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>Shipping reference</span>
                <strong className={styles.referenceValue}>
                  {order.providerBindings.shipping.bookingReference ?? "pending"}
                </strong>
            </div>
            <div className={styles.referenceRow}>
              <span>Tracking number</span>
              <strong className={styles.referenceValue}>
                {order.providerBindings.shipping.trackingNumber ?? "pending"}
              </strong>
            </div>
            <div className={styles.referenceRow}>
              <span>Continuation mode</span>
              <strong className={styles.referenceValue}>{bundleModeTitle}</strong>
            </div>
          </div>

          {fulfillmentPlan.requiresManualReview ? (
            <div className={styles.inlineError}>
              {fulfillmentPlan.manualReviewReasons.join(" ")}
            </div>
          ) : (
            <div className={styles.inlineNotice}>
              مسار التنفيذ الحالي لا يحتاج مراجعة يدوية إضافية داخل authority
              الحالية.
            </div>
          )}

          <div className={styles.summaryList}>
            {notifications.length ? (
              notifications.map((notification) => (
                <div key={notification.id} className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>{notification.label}</span>
                    <strong className={styles.referenceValue}>{notification.status}</strong>
                  </div>
                  <p>{notification.note}</p>
                </div>
              ))
            ) : (
              <div className={styles.inlineNotice}>
                لا توجد رسالة تشغيلية نشطة جديدة لهذا الطلب الآن. ستظهر الرسائل هنا عندما
                تدخل queue الإشعارات مرحلة جديدة.
              </div>
            )}
          </div>

          <div className={styles.actionColumn}>
            {activePaymentUrl ? (
              <TrackedLink
                href={activePaymentUrl}
                className={styles.primaryLink}
                analyticsLabel="order_success_to_payment_provider"
                analyticsSurface="order_success_summary"
                analyticsDestinationType="payment_provider"
                target="_blank"
                rel="noreferrer"
              >
                إكمال الدفع
              </TrackedLink>
            ) : null}
            <TrackedLink
              href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
              className={activePaymentUrl ? styles.secondaryLink : styles.primaryLink}
              analyticsLabel="order_success_to_tracking"
              analyticsSurface="order_success_summary"
              analyticsDestinationType="order_tracking"
            >
              تتبع الطلب
            </TrackedLink>
            <TrackedLink
              href="/account/orders"
              className={styles.secondaryLink}
              analyticsLabel="order_success_to_customer_orders"
              analyticsSurface="order_success_summary"
              analyticsDestinationType="account_orders"
            >
              عرض طلباتي
            </TrackedLink>
            {customerAccessHandoffPath ? (
              <TrackedLink
                href={customerAccessHandoffPath}
                className={styles.secondaryLink}
                analyticsLabel="order_success_to_customer_access_handoff"
                analyticsSurface="order_success_summary"
                analyticsDestinationType="account_access"
              >
                Open my orders on another device
              </TrackedLink>
            ) : null}
            {secondaryRoute ? (
              <TrackedLink
                href={secondaryRoute.href}
                className={styles.secondaryLink}
                analyticsLabel={`order_success_to_${secondaryRoute.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                analyticsSurface="order_success_summary"
                analyticsDestinationType="support_route"
              >
                {secondaryRoute.label}
              </TrackedLink>
            ) : null}
          </div>

          <div className={styles.linkList}>
            {continuationRoutes.map((route) => (
              <TrackedLink
                key={route.href}
                href={route.href}
                analyticsLabel={`order_success_sidebar_${route.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                analyticsSurface="order_success_policies"
                analyticsDestinationType="support_route"
              >
                <span>{route.label}</span>
                <span>{route.productName}</span>
              </TrackedLink>
            ))}
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
