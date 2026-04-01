"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import {
  findStoredOrder,
  getOrderTimeline,
  getPaymentMethodById,
  getShippingMethodById,
  ORDER_STORAGE_KEY,
  sanitizeStoredOrders,
  type StoredOrder,
} from "@/lib/orders";
import { footerPolicyLinks } from "@/lib/site-content";
import styles from "./order-flow.module.css";

type TrackOrderSurfaceProps = {
  initialOrderNumber?: string;
};

export function TrackOrderSurface({
  initialOrderNumber = "",
}: TrackOrderSurfaceProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phoneLastFour, setPhoneLastFour] = useState("");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [match, setMatch] = useState<StoredOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawOrders = window.localStorage.getItem(ORDER_STORAGE_KEY);
      const parsedOrders = rawOrders ? JSON.parse(rawOrders) : [];
      setOrders(sanitizeStoredOrders(parsedOrders));
    } catch {
      setOrders([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const handleLookup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedOrder = orderNumber.trim().toUpperCase();
    const normalizedLastFour = phoneLastFour.replace(/\D/g, "").slice(-4);

    if (!normalizedOrder || normalizedLastFour.length !== 4) {
      setMatch(null);
      setError("أدخلي مرجع الطلب وآخر 4 أرقام من الجوال لإظهار الحالة.");
      return;
    }

    const order = findStoredOrder(orders, normalizedOrder, normalizedLastFour);

    setMatch(order);
    setError(order ? null : "لم يتم العثور على طلب مطابق لهذه البيانات على هذا المتصفح.");

    trackAnalyticsEvent("track_order_lookup", {
      source_path: "/track-order",
      source_page_type: getPageType("/track-order"),
      has_reference: Boolean(normalizedOrder),
      has_phone_last4: normalizedLastFour.length === 4,
      lookup_found: Boolean(order),
      order_status: order?.status ?? "not_found",
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Order tracking</p>
          <h1>تتبعي الحالة الحالية بمرجع واضح بدل الرسائل المبهمة</h1>
          <p className={styles.summary}>
            صفحة تتبع الطلب هنا تربط بين مرجع الطلب وآخر 4 أرقام من الجوال حتى تعرض
            حالة واضحة داخل النسخة التأسيسية الحالية.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>ما الذي تحتاجينه؟</p>
            <strong>مرجع الطلب + آخر 4 أرقام</strong>
            <span>
              هذا يقلل الاعتماد على معلومات شخصية كاملة ويجعل التتبع أوضح في المرحلة الحالية.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Scope</p>
            <h2>التتبع الحالي محلي على هذا المتصفح</h2>
            <p>
              تم بناء هذه الصفحة لتغلق الرحلة end-to-end قبل ربط نظام طلبات مركزي.
              لذلك لن يظهر إلا ما تم إنشاؤه على نفس المتصفح.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <form className={styles.mainCard} onSubmit={handleLookup}>
          <p className={styles.sectionTitle}>Lookup</p>
          <h2>البحث عن الطلب</h2>
          <p>
            إذا خرجتِ من صفحة التأكيد، يمكنك العودة إلى الحالة الحالية من هنا متى
            كان المرجع متاحًا لديك.
          </p>

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
              <span className={styles.fieldLabel}>آخر 4 أرقام من الجوال</span>
              <input
                className={styles.textInput}
                value={phoneLastFour}
                onChange={(event) =>
                  setPhoneLastFour(event.currentTarget.value.replace(/\D/g, "").slice(-4))
                }
                dir="ltr"
                inputMode="numeric"
              />
            </label>
          </div>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <div className={styles.actionColumn}>
            <button className={styles.primaryButton} type="submit" disabled={!isHydrated}>
              {isHydrated ? "عرض الحالة الحالية" : "جاري تحميل الطلبات..."}
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

      {match ? (
        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Current status</p>
            <h2>الحالة الحالية للطلب {match.orderNumber}</h2>

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
              {match.lines.map((line) => (
                <article key={line.key} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{line.productName}</h3>
                      <p className={styles.lineMeta}>{line.productSubtitle}</p>
                    </div>
                    <div className={styles.linePrice}>{line.lineTotal} ر.س</div>
                  </div>

                  <div className={styles.badgeRow}>
                    <span>{line.variantLabel}</span>
                    <span>{line.size}</span>
                    <span>الكمية: {line.quantity}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Order summary</p>
            <h2>الملخص المرتبط بالتتبع</h2>

            <div className={styles.referenceCard}>
              <div className={styles.referenceRow}>
                <span>الشحن</span>
                <strong className={styles.referenceValue}>
                  {getShippingMethodById(match.shippingMethodId)?.label}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>الدفع</span>
                <strong className={styles.referenceValue}>
                  {getPaymentMethodById(match.paymentMethodId)?.label}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>الإجمالي التقديري</span>
                <strong className={styles.referenceValue}>{match.totalEstimate} ر.س</strong>
              </div>
            </div>

            <div className={styles.inlineNotice}>
              الحالة الحالية مرتبطة بمرجع محلي محفوظ على هذا المتصفح، ولذلك تظل
              مناسبة للنسخة التأسيسية قبل ربط نظام طلبات مركزي.
            </div>

            <div className={styles.actionColumn}>
              <TrackedLink
                href="/shop/skincare"
                className={styles.secondaryLink}
                analyticsLabel="track_order_to_skincare"
                analyticsSurface="track_order_result"
                analyticsDestinationType="collection"
              >
                العودة إلى المتجر
              </TrackedLink>
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  );
}
