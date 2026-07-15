"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { OpsLifecycleConsentSurface } from "@/components/ops-lifecycle-consent-surface";
import { OpsLifecycleDeliveryOutboxSurface } from "@/components/ops-lifecycle-delivery-outbox-surface";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import {
  fetchOpsNotifications,
  updateOpsNotificationStatus,
} from "@/lib/ops-control-client";
import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  StoredNotification,
} from "@/lib/notification-types";
import styles from "./order-flow.module.css";

type NotificationFilter = "all" | NotificationDeliveryStatus;

const notificationFilters: NotificationFilter[] = [
  "all",
  "queued",
  "sent",
  "blocked",
];

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getNotificationStatusLabel(status: NotificationDeliveryStatus) {
  switch (status) {
    case "queued":
      return "بانتظار الإرسال";
    case "sent":
      return "تم الإرسال";
    case "blocked":
      return "محجوب تشغيليًا";
  }
}

function getChannelLabel(channel: NotificationChannel) {
  switch (channel) {
    case "email":
      return "Email";
    case "dashboard":
      return "Dashboard";
    default:
      return "WhatsApp";
  }
}

function getTemplateLabel(templateKey: StoredNotification["templateKey"]) {
  switch (templateKey) {
    case "order_received":
      return "تأكيد استلام الطلب";
    case "payment_link":
      return "رابط الدفع";
    case "preparation_update":
      return "تحديث التجهيز";
    case "delivery_update":
      return "تحديث الخروج للتوصيل";
  }
}

export function OpsNotificationsSurface() {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);

  useEffect(() => {
    void fetchOpsNotifications()
      .then(({ notifications: nextNotifications }) => {
        setNotifications(nextNotifications);
        setError(null);
      })
      .catch((loadError: unknown) => {
        setNotifications([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل قائمة الإشعارات التشغيلية الحالية.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const metrics = useMemo(
    () => ({
      total: notifications.length,
      queued: notifications.filter((notification) => notification.status === "queued")
        .length,
      sent: notifications.filter((notification) => notification.status === "sent")
        .length,
      blocked: notifications.filter((notification) => notification.status === "blocked")
        .length,
    }),
    [notifications],
  );

  const filterCounts = useMemo(
    () =>
      notificationFilters.reduce<Record<NotificationFilter, number>>(
        (accumulator, currentFilter) => {
          accumulator[currentFilter] = notifications.filter((notification) =>
            currentFilter === "all" ? true : notification.status === currentFilter,
          ).length;
          return accumulator;
        },
        {
          all: 0,
          queued: 0,
          sent: 0,
          blocked: 0,
        },
      ),
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notifications.filter((notification) => {
      if (filter !== "all" && notification.status !== filter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        notification.orderNumber,
        notification.label,
        notification.recipientHint,
        notification.templateKey,
        notification.channel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filter, notifications, query]);

  function updateLocalNotification(nextNotification: StoredNotification) {
    setNotifications((currentNotifications) =>
      currentNotifications
        .map((notification) =>
          notification.id === nextNotification.id ? nextNotification : notification,
        )
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    );
  }

  function handleNotificationStatusUpdate(
    notification: StoredNotification,
    nextStatus: Extract<NotificationDeliveryStatus, "queued" | "sent">,
  ) {
    if (notification.status === nextStatus) {
      return;
    }

    setPendingNotificationId(notification.id);
    setError(null);

    void updateOpsNotificationStatus(notification.id, nextStatus)
      .then(({ notification: nextNotification, previousStatus }) => {
        updateLocalNotification(nextNotification);
        trackAnalyticsEvent("ops_notification_status_update", {
          source_path: "/ops/notifications",
          source_page_type: getPageType("/ops/notifications"),
          order_reference: nextNotification.orderNumber,
          template_key: nextNotification.templateKey,
          previous_status: previousStatus,
          next_status: nextStatus,
          channel: nextNotification.channel,
        });
      })
      .catch((updateError: unknown) => {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "تعذر تحديث حالة الإشعار التشغيلي الحالية.",
        );
      })
      .finally(() => {
        setPendingNotificationId(null);
      });
  }

  return (
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsNotifications}`}>
      <OpsNav activeHref="/ops/notifications" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>إدارة الإشعارات</p>
          <h1>كل رسالة في حالتها الصحيحة، قبل أن تصل للعميل.</h1>
          <p className={styles.summary}>
            راجعي تحديثات الطلب والدفع والشحن، وميّزي ما ينتظر الإرسال عما تم
            إرساله أو حُجب وفق تفضيلات العميل وحدود التشغيل الحالية.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>إجمالي الإشعارات</p>
            <strong>{isLoading ? "..." : metrics.total}</strong>
            <span>
              {isLoading
                ? "جارٍ تحميل طابور الإشعارات."
                : `${metrics.queued} queued، ${metrics.sent} sent، و${metrics.blocked} blocked داخل authority الحالية.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>نطاق التشغيل</p>
            <h2>سجل مركزي لحالة كل رسالة</h2>
            <p>
              يعرض هذا السطح حالة الرسائل داخل النظام. الربط مع مزود الإرسال
              الخارجي يظل واضحًا ضمن حدود الجاهزية الحالية.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Queued</p>
          <strong>{metrics.queued}</strong>
          <span>رسائل جاهزة للإرسال أو المتابعة داخل queue الحالية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Sent</p>
          <strong>{metrics.sent}</strong>
          <span>رسائل تم تعليمها كمرسلة داخل سطح التشغيل الداخلي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Blocked</p>
          <strong>{metrics.blocked}</strong>
          <span>رسائل لا ينبغي تشغيلها لأن التحديثات التشغيلية غير مفعّلة.</span>
        </article>
      </section>

      <OpsLifecycleConsentSurface />

      <OpsLifecycleDeliveryOutboxSurface />

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Notification queue</p>
          <h2>الإشعارات التشغيلية الحالية</h2>

          <div className={styles.filterBar}>
            <label className={styles.searchField}>
              <span className={styles.fieldLabel}>بحث سريع</span>
              <input
                className={styles.textInput}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="مرجع الطلب أو نوع الرسالة أو القناة"
              />
            </label>

            <div className={styles.filterChipRow}>
              {notificationFilters.map((candidate) => {
                const isActive = filter === candidate;
                const label =
                  candidate === "all"
                    ? "كل الإشعارات"
                    : getNotificationStatusLabel(candidate);

                return (
                  <button
                    key={candidate}
                    type="button"
                    className={`${styles.filterChip} ${
                      isActive ? styles.filterChipActive : ""
                    }`}
                    onClick={() => setFilter(candidate)}
                  >
                    <span>{label}</span>
                    <strong>{filterCounts[candidate]}</strong>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <div className={styles.ordersGrid}>
            {isLoading ? (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Notifications</p>
                <h1>جارٍ تحميل طابور الإشعارات</h1>
                <p>يتم الآن استعادة queue الإشعارات من authority الحالية.</p>
              </article>
            ) : filteredNotifications.length ? (
              filteredNotifications.map((notification) => {
                const isPending = pendingNotificationId === notification.id;

                return (
                  <article key={notification.id} className={styles.lineItem}>
                    <div className={styles.lineHead}>
                      <div>
                        <h3>{getTemplateLabel(notification.templateKey)}</h3>
                        <p className={styles.lineMeta}>
                          {notification.orderNumber} | {formatTimestamp(notification.updatedAt)}
                        </p>
                      </div>
                      <div className={styles.linePrice}>
                        {getNotificationStatusLabel(notification.status)}
                      </div>
                    </div>

                    <div className={styles.badgeRow}>
                      <span>{getChannelLabel(notification.channel)}</span>
                      <span>{notification.recipientHint}</span>
                      <span>{notification.orderStatus}</span>
                    </div>

                    <p>{notification.note}</p>

                    {notification.sentAt ? (
                      <div className={styles.inlineNotice}>
                        تم تعليم هذه الرسالة كمرسلة في {formatTimestamp(notification.sentAt)}.
                      </div>
                    ) : null}

                    <div className={styles.cardActions}>
                      {notification.status !== "blocked" ? (
                        <>
                          <button
                            type="button"
                            className={styles.primaryButton}
                            disabled={isPending || notification.status === "sent"}
                            onClick={() =>
                              handleNotificationStatusUpdate(notification, "sent")
                            }
                          >
                            {isPending
                              ? "جارٍ التحديث..."
                              : notification.status === "sent"
                                ? "تم الإرسال"
                                : "تعليم كمرسل"}
                          </button>

                          <button
                            type="button"
                            className={styles.secondaryButton}
                            disabled={isPending || notification.status === "queued"}
                            onClick={() =>
                              handleNotificationStatusUpdate(notification, "queued")
                            }
                          >
                            إعادة إلى queue
                          </button>
                        </>
                      ) : null}
                    </div>

                    <div className={styles.linkList}>
                      <TrackedLink
                        href="/ops/orders"
                        analyticsLabel={`ops_notifications_to_orders_${notification.templateKey}`}
                        analyticsSurface="ops_notifications_card"
                        analyticsDestinationType="ops_orders"
                      >
                        <span>العودة إلى orders</span>
                        <span>Order state flow</span>
                      </TrackedLink>
                      <TrackedLink
                        href={`/track-order?order=${encodeURIComponent(notification.orderNumber)}`}
                        analyticsLabel={`ops_notifications_track_${notification.orderNumber.toLowerCase()}`}
                        analyticsSurface="ops_notifications_card"
                        analyticsDestinationType="order_tracking"
                      >
                        <span>فتح التتبع العام</span>
                        <span>Customer-facing view</span>
                      </TrackedLink>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>No notifications</p>
                <h1>لا توجد إشعارات تطابق الفلتر الحالي</h1>
                <p>أنشئ طلبًا جديدًا أو حرّك حالة طلب حتى تدخل الرسائل إلى queue الحالية.</p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Related ops paths</p>
          <h2>المسارات المرتبطة بالرسائل</h2>
          <div className={styles.linkList}>
            <TrackedLink
              href="/ops/fulfillment"
              analyticsLabel="ops_notifications_to_fulfillment"
              analyticsSurface="ops_notifications_links"
              analyticsDestinationType="ops_fulfillment"
            >
              <span>لوحة fulfillment</span>
              <span>Routing + notification plan</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/orders"
              analyticsLabel="ops_notifications_to_orders_sidebar"
              analyticsSurface="ops_notifications_links"
              analyticsDestinationType="ops_orders"
            >
              <span>لوحة الطلبات</span>
              <span>Statuses + queue</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/audit"
              analyticsLabel="ops_notifications_to_audit"
              analyticsSurface="ops_notifications_links"
              analyticsDestinationType="ops_audit"
            >
              <span>سجل المراجعة</span>
              <span>Session + notification trace</span>
            </TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
