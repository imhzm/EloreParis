"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { getOrderFulfillmentPlan, getOrderProviderHandoff } from "@/lib/fulfillment";
import type { StoredNotification } from "@/lib/notification-types";
import {
  fetchRecentOrderFromAuthority,
  fetchTrackedOrderFromAuthority,
} from "@/lib/order-authority-client";
import {
  getOrderStatusMeta,
  getOrderTimeline,
  getPaymentMethodById,
  getShippingMethodById,
  type StoredOrder,
} from "@/lib/orders";
import { collectionDirectory, footerPolicyLinks, products } from "@/lib/site-content";
import styles from "./order-flow.module.css";

type TrackOrderSurfaceProps = {
  initialOrderNumber?: string;
};

function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function TrackOrderSurface({ initialOrderNumber = "" }: TrackOrderSurfaceProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phoneLastFour, setPhoneLastFour] = useState("");
  const [match, setMatch] = useState<StoredOrder | null>(null);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [customerAccessHandoffPath, setCustomerAccessHandoffPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const normalizedInitialOrder = initialOrderNumber.trim().toUpperCase();

  useEffect(() => {
    if (!normalizedInitialOrder) return;

    let isActive = true;
    const runAutoLookup = async () => {
      setIsSearching(true);
      try {
        const {
          order,
          notifications: nextNotifications,
          customerAccessHandoffPath: nextCustomerAccessHandoffPath,
        } = await fetchRecentOrderFromAuthority(normalizedInitialOrder);

        if (!isActive) return;
        setMatch(order);
        setNotifications(nextNotifications);
        setCustomerAccessHandoffPath(nextCustomerAccessHandoffPath ?? null);
        setError(null);
        setOrderNumber(order.orderNumber);

        trackAnalyticsEvent("track_order_lookup", {
          source_path: "/track-order",
          source_page_type: getPageType("/track-order"),
          has_reference: true,
          has_phone_last4: false,
          lookup_found: true,
          order_status: order.status,
          access_mode: "order_session",
        });
      } catch {
        if (isActive) {
          setMatch(null);
          setNotifications([]);
          setCustomerAccessHandoffPath(null);
        }
      } finally {
        if (isActive) setIsSearching(false);
      }
    };

    void runAutoLookup();
    return () => {
      isActive = false;
    };
  }, [normalizedInitialOrder]);

  const handleLookup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedOrder = orderNumber.trim().toUpperCase();
    const normalizedLastFour = phoneLastFour.replace(/\D/g, "").slice(-4);

    if (!normalizedOrder) {
      setMatch(null);
      setError("أدخلي مرجع الطلب لإظهار الحالة الحالية.");
      return;
    }

    setIsSearching(true);
    setError(null);

    const lookupRequest =
      normalizedLastFour.length === 4
        ? fetchTrackedOrderFromAuthority(normalizedOrder, normalizedLastFour)
        : fetchRecentOrderFromAuthority(normalizedOrder);

    void lookupRequest
      .then(({ order, notifications: nextNotifications, customerAccessHandoffPath: nextCustomerAccessHandoffPath }) => {
        setMatch(order);
        setNotifications(nextNotifications);
        setCustomerAccessHandoffPath(nextCustomerAccessHandoffPath ?? null);

        trackAnalyticsEvent("track_order_lookup", {
          source_path: "/track-order",
          source_page_type: getPageType("/track-order"),
          has_reference: true,
          has_phone_last4: normalizedLastFour.length === 4,
          lookup_found: true,
          order_status: order.status,
          access_mode: normalizedLastFour.length === 4 ? "phone_last4" : "order_session",
        });
      })
      .catch((lookupError: unknown) => {
        setMatch(null);
        setNotifications([]);
        setCustomerAccessHandoffPath(null);
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : "لم يتم العثور على طلب مطابق لهذه البيانات داخل نظام التتبع الحالي.",
        );

        trackAnalyticsEvent("track_order_lookup", {
          source_path: "/track-order",
          source_page_type: getPageType("/track-order"),
          has_reference: true,
          has_phone_last4: normalizedLastFour.length === 4,
          lookup_found: false,
          order_status: "not_found",
          access_mode: normalizedLastFour.length === 4 ? "phone_last4" : "order_session",
        });
      })
      .finally(() => setIsSearching(false));
  };

  const fulfillmentPlan = match ? getOrderFulfillmentPlan(match) : null;
  const providerHandoff = match ? getOrderProviderHandoff(match) : null;
  const matchedProducts = match
    ? dedupeBy(
        match.lines
          .map((line) => products.find((product) => product.slug === line.productSlug))
          .filter((product): product is (typeof products)[number] => Boolean(product)),
        (product) => product.slug,
      )
    : [];
  const matchedCollections = dedupeBy(
    matchedProducts.map((product) => collectionDirectory[product.collection]),
    (collection) => collection.href,
  );
  const trackingRoutes = dedupeBy(
    matchedProducts.flatMap((product) =>
      product.pairings.map((route) => ({
        ...route,
        productName: product.name,
      })),
    ),
    (route) => route.href,
  ).slice(0, 3);
  const statusMeta = match ? getOrderStatusMeta(match.status) : null;
  const trackingModeTitle =
    matchedProducts.length === 1
      ? "تتبع قرار واحد"
      : matchedCollections.length === 1
        ? `تتبع مسار ${matchedCollections[0]?.title ?? "واحد"}`
        : "تتبع متعدد المسارات";
  const trackingModeBody =
    matchedProducts.length === 1
      ? "استخدمي نتيجة التتبع لتأكيد التنفيذ أولًا، ثم عودي إلى مسار داعم واحد فقط إذا احتجتِ مزيدًا من السياق."
      : matchedCollections.length === 1
        ? "المسار ما زال متماسكًا، لذلك المتابعة الجيدة هي رابط واحد يخدم نفس الروتين بدل تصفح عام جديد."
        : "الطلب الحالي يحتاج وضوحًا تشغيليًا أكثر من حاجته إلى توسعة جديدة داخل المتجر.";
  const trackingSignals =
    match && fulfillmentPlan && statusMeta
      ? [
          { label: "الحالة الحالية", title: statusMeta.label, body: statusMeta.description },
          {
            label: "مسار التنفيذ",
            title: fulfillmentPlan.recommendedCarrier,
            body: fulfillmentPlan.requiresManualReview
              ? fulfillmentPlan.manualReviewReasons[0]
              : "المسار الحالي واضح بما يكفي للمتابعة دون فتح تصعيد إضافي.",
          },
          { label: "طريقة المتابعة", title: trackingModeTitle, body: trackingModeBody },
        ]
      : [];
  const trackingGuardrails =
    match && fulfillmentPlan
      ? [
          "ابدئي دائمًا بمرجع الطلب وآخر 4 أرقام من الجوال قبل الانتقال إلى أي قناة دعم أخرى.",
          fulfillmentPlan.requiresManualReview
            ? "بما أن الطلب يحتاج مراجعة، تابعي الحالة الحالية أولًا بدل إضافة عناصر جديدة أو إعادة فتح checkout."
            : "طالما لا توجد مراجعة يدوية، فالأولوية هي مراقبة التقدم التشغيلي بدل تعديل قرار الشراء.",
          `الإجمالي الحالي ${match.totalEstimate} ر.س، لذلك أي خطوة لاحقة يجب أن تدعم نفس الطلب لا أن تفتح حلقة تصفح جديدة.`,
        ]
      : [];
  const fallbackCollectionRoute =
    matchedCollections[0] === undefined
      ? null
      : {
          href: matchedCollections[0].href,
          label: `العودة إلى ${matchedCollections[0].title}`,
          productName: matchedCollections[0].title,
        };
  const resultRoute = trackingRoutes[0] ?? fallbackCollectionRoute;
  const activePaymentUrl =
    match &&
    match.paymentMethodId === "payment_link" &&
    match.providerBindings.payment.state !== "confirmed"
      ? match.providerBindings.payment.paymentUrl
      : null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Order tracking</p>
          <h1>تتبعي الحالة الحالية بمرجع واضح بدل الرسائل المبهمة.</h1>
          <p className={styles.summary}>
            صفحة تتبع الطلب تربط بين مرجع الطلب وآخر 4 أرقام من الجوال حتى تعرض حالة واضحة داخل نظام
            التتبع الحالي، مع مسار تنفيذ مفهوم وليس مجرد تسمية عامة للحالة.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>ما الذي تحتاجينه؟</p>
            <strong>مرجع الطلب أو جلسة التتبع الحالية</strong>
            <span>هذا يقلل الاعتماد على معلومات شخصية كاملة ويجعل التتبع أوضح في المرحلة الحالية.</span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Scope</p>
            <h2>نظام تتبع داخل التطبيق وليس OMS نهائيًا</h2>
            <p>
              التتبع يعمل فوق authority داخل التطبيق، ولم ينتقل بعد إلى نظام طلبات خارجي كامل.
              لذلك نعرض ما نعرفه الآن بوضوح ونفصل بين المؤكد وما يحتاج مراجعة.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <form className={styles.mainCard} onSubmit={handleLookup}>
          <p className={styles.sectionTitle}>Lookup</p>
          <h2>البحث عن الطلب</h2>
          <p>إذا خرجتِ من صفحة التأكيد، يمكنك العودة إلى الحالة الحالية من هنا متى كان المرجع متاحًا لديك.</p>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>مرجع الطلب</span>
              <input
                className={styles.textInput}
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.currentTarget.value)}
                dir="ltr"
                autoCapitalize="characters"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>آخر 4 أرقام من الجوال (اختياري على نفس الجهاز)</span>
              <input
                className={styles.textInput}
                value={phoneLastFour}
                onChange={(event) => setPhoneLastFour(event.currentTarget.value.replace(/\D/g, "").slice(-4))}
                dir="ltr"
                inputMode="numeric"
              />
            </label>
          </div>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <div className={styles.actionColumn}>
            <button className={styles.primaryButton} type="submit" disabled={isSearching}>
              {isSearching ? "جاري البحث..." : "عرض الحالة الحالية"}
            </button>
            <TrackedLink
              href="/trust/shipping"
              className={styles.secondaryLink}
              analyticsLabel="track_order_to_shipping_policy"
              analyticsSurface="track_order_lookup"
              analyticsDestinationType="trust_policy"
            >
              مراجعة سياسة الشحن
            </TrackedLink>
          </div>
        </form>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Support</p>
          <h2>قبل التتبع أو بعده</h2>
          <div className={styles.linkList}>
            {footerPolicyLinks.map((policy) => (
              <TrackedLink
                key={policy.href}
                href={policy.href}
                analyticsLabel={`track_order_policy_${policy.href.split("/").at(-1) ?? "route"}`}
                analyticsSurface="track_order_policies"
                analyticsDestinationType="trust_policy"
              >
                <span>{policy.label}</span>
                <span>مرجع مساند</span>
              </TrackedLink>
            ))}
          </div>
        </aside>
      </section>

      {match && fulfillmentPlan ? (
        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Current status</p>
            <h2>الحالة الحالية للطلب {match.orderNumber}</h2>

            <div className={styles.statusSummaryGrid}>
              {trackingSignals.map((signal) => (
                <article key={signal.label} className={styles.statusSummaryCard}>
                  <p className={styles.eyebrow}>{signal.label}</p>
                  <strong>{signal.title}</strong>
                  <p>{signal.body}</p>
                </article>
              ))}
            </div>

            <div className={styles.timeline}>
              {getOrderTimeline(match).map((step) => (
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
                      {step.state === "current" ? "الحالة الحالية" : step.state === "complete" ? "مكتمل" : "قادم"}
                    </span>
                  </div>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>

            <div className={styles.catalogPanelGrid}>
              <article className={styles.referenceCard}>
                <p className={styles.eyebrow}>Tracking guardrails</p>
                <h3>لا تحولي التتبع إلى رحلة شراء جديدة</h3>
                <div className={styles.cardActions}>
                  {trackingGuardrails.map((item) => (
                    <div key={item} className={styles.infoBullet}>{item}</div>
                  ))}
                </div>
              </article>

              <article className={styles.referenceCard}>
                <p className={styles.eyebrow}>Continuation routes</p>
                <h3>إذا احتجتِ مزيدًا من السياق فخذي مسارًا واحدًا فقط</h3>
                {trackingRoutes.length ? (
                  <div className={styles.linkList}>
                    {trackingRoutes.map((route) => (
                      <TrackedLink
                        key={route.href}
                        href={route.href}
                        analyticsLabel={`track_order_route_${route.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                        analyticsSurface="track_order_result_routes"
                        analyticsDestinationType="support_route"
                      >
                        <span>{route.label}</span>
                        <span>{route.productName}</span>
                      </TrackedLink>
                    ))}
                  </div>
                ) : (
                  <div className={styles.infoBullet}>
                    إذا لم تظهر روابط داعمة إضافية، ابقي على مسار التتبع الحالي حتى تتضح الخطوة التالية.
                  </div>
                )}
              </article>
            </div>

            <div className={styles.lineList}>
              {fulfillmentPlan.linePlans.map((line) => (
                <article key={line.key} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{line.productName}</h3>
                      <p className={styles.lineMeta}>{line.routeLabel}</p>
                    </div>
                    <div className={styles.linePrice}>{line.sku}</div>
                  </div>

                  <div className={styles.badgeRow}>
                    <span>{line.supplierName}</span>
                    <span>{line.availability}</span>
                    <span>{line.shippingClass}</span>
                    <span>{line.codEligible ? "COD yes" : "COD no"}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Order summary</p>
            <h2>الملخص المرتبط بالتتبع</h2>

            <div className={styles.referenceCard}>
              <div className={styles.referenceRow}><span>منطقة الخدمة</span><strong className={styles.referenceValue}>{fulfillmentPlan.deliveryZoneLabel}</strong></div>
              <div className={styles.referenceRow}><span>الشحن</span><strong className={styles.referenceValue}>{getShippingMethodById(match.shippingMethodId)?.label}</strong></div>
              <div className={styles.referenceRow}><span>الدفع</span><strong className={styles.referenceValue}>{getPaymentMethodById(match.paymentMethodId)?.label}</strong></div>
              <div className={styles.referenceRow}><span>الناقل المقترح</span><strong className={styles.referenceValue}>{fulfillmentPlan.recommendedCarrier}</strong></div>
              <div className={styles.referenceRow}><span>حالة المزوّد</span><strong className={styles.referenceValue}>{providerHandoff?.providerReadinessLabel ?? "pending"}</strong></div>
              <div className={styles.referenceRow}><span>مرجع الدفع</span><strong className={styles.referenceValue}>{match.providerBindings.payment.referenceId ?? "pending"}</strong></div>
              <div className={styles.referenceRow}><span>مرجع التسوية</span><strong className={styles.referenceValue}>{match.providerBindings.payment.settlementReference ?? "pending"}</strong></div>
              <div className={styles.referenceRow}><span>مرجع الشحن</span><strong className={styles.referenceValue}>{match.providerBindings.shipping.bookingReference ?? "pending"}</strong></div>
              <div className={styles.referenceRow}><span>رقم التتبع</span><strong className={styles.referenceValue}>{match.providerBindings.shipping.trackingNumber ?? "pending"}</strong></div>
              <div className={styles.referenceRow}><span>الإجمالي التقديري</span><strong className={styles.referenceValue}>{match.totalEstimate} ر.س</strong></div>
              <div className={styles.referenceRow}><span>طريقة المتابعة</span><strong className={styles.referenceValue}>{trackingModeTitle}</strong></div>
            </div>

            {fulfillmentPlan.requiresManualReview ? (
              <div className={styles.inlineError}>{fulfillmentPlan.manualReviewReasons.join(" ")}</div>
            ) : (
              <div className={styles.inlineNotice}>لا توجد مراجعة يدوية إضافية مطلوبة لهذا الطلب داخل النموذج الحالي.</div>
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
                <div className={styles.inlineNotice}>لا توجد رسالة تشغيلية جديدة في queue هذا الطلب الآن.</div>
              )}
            </div>

            <div className={styles.actionColumn}>
              {activePaymentUrl ? (
                <TrackedLink
                  href={activePaymentUrl}
                  className={styles.primaryLink}
                  analyticsLabel="track_order_to_payment_provider"
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="payment_provider"
                  target="_blank"
                  rel="noreferrer"
                >
                  إكمال الدفع
                </TrackedLink>
              ) : null}
              <TrackedLink
                href="/account/orders"
                className={styles.secondaryLink}
                analyticsLabel="track_order_to_customer_orders"
                analyticsSurface="track_order_result"
                analyticsDestinationType="account_orders"
              >
                عرض طلباتي
              </TrackedLink>
              {customerAccessHandoffPath ? (
                <TrackedLink
                  href={customerAccessHandoffPath}
                  className={styles.secondaryLink}
                  analyticsLabel="track_order_to_customer_access_handoff"
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="account_access"
                >
                  فتح طلباتي على جهاز آخر
                </TrackedLink>
              ) : null}
              {resultRoute ? (
                <TrackedLink
                  href={resultRoute.href}
                  className={styles.secondaryLink}
                  analyticsLabel={`track_order_to_${resultRoute.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="support_route"
                >
                  {resultRoute.label}
                </TrackedLink>
              ) : null}
            </div>

            <div className={styles.linkList}>
              {trackingRoutes.map((route) => (
                <TrackedLink
                  key={route.href}
                  href={route.href}
                  analyticsLabel={`track_order_sidebar_${route.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                  analyticsSurface="track_order_result"
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
                  analyticsLabel={`track_order_result_policy_${policy.href.split("/").at(-1) ?? "route"}`}
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="trust_policy"
                >
                  <span>{policy.label}</span>
                  <span>مرجع مساند</span>
                </TrackedLink>
              ))}
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  );
}
