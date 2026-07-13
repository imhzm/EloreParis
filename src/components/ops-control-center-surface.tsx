"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import { getContentGovernanceSummary } from "@/lib/content-governance";
import {
  getOrderFulfillmentPlan,
  getOrderProviderHandoff,
} from "@/lib/fulfillment";
import {
  getCatalogAuthoritySnapshot,
  getOpsDashboardSnapshot,
  getSupplierAuthoritySnapshot,
  getSupplierSyncLogs,
} from "@/lib/ops-catalog";
import {
  fetchOpsAuditEntries,
  fetchOpsNotifications,
  fetchOpsReleasePacket,
  updateOpsNotificationStatus,
} from "@/lib/ops-control-client";
import {
  advanceOpsOrderFromAuthority,
  fetchOpsOrdersFromAuthority,
  updateOpsOrderProviderBinding,
} from "@/lib/order-authority-client";
import type { StoredNotification } from "@/lib/notification-types";
import type {
  OrderProviderBindingAction,
  StoredOrder,
} from "@/lib/orders";
import { getNextOrderStatus, getOrderStatusMeta } from "@/lib/orders";
import type { OpsAuditEntry } from "@/lib/ops-types";
import type { ReleasePacketArtifact } from "@/lib/release-packet-types";
import styles from "./order-flow.module.css";

type QueueSeverity = "critical" | "attention" | "normal";

type QueueAction =
  | {
      kind: "advance";
      label: string;
      busyLabel: string;
      successMessage: string;
    }
  | {
      kind: OrderProviderBindingAction;
      label: string;
      busyLabel: string;
      successMessage: string;
    }
  | {
      kind: "notification_sent";
      label: string;
      busyLabel: string;
      successMessage: string;
    };

type QueueItem = {
  id: string;
  itemType: "order" | "notification";
  severity: QueueSeverity;
  title: string;
  subtitle: string;
  note: string;
  helper: string;
  route: string;
  routeLabel: string;
  badges: string[];
  updatedAt: string;
  action: QueueAction | null;
  order?: StoredOrder;
  notification?: StoredNotification;
};

type OwnerLaneDescriptor = {
  label: string;
  note: string;
};

type AuthorityOrderRecord = {
  order: StoredOrder;
  plan: ReturnType<typeof getOrderFulfillmentPlan>;
  providerHandoff: ReturnType<typeof getOrderProviderHandoff>;
  ownerLane: OwnerLaneDescriptor;
  nextStatus: ReturnType<typeof getNextOrderStatus>;
};

const severityRank: Record<QueueSeverity, number> = {
  critical: 0,
  attention: 1,
  normal: 2,
};

function formatCurrency(value: number) {
  return `${value} ر.س`;
}

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

function getQueueSeverityLabel(severity: QueueSeverity) {
  switch (severity) {
    case "critical":
      return "Critical";
    case "attention":
      return "Active";
    default:
      return "Watch";
  }
}

function getNotificationChannelLabel(channel: StoredNotification["channel"]) {
  switch (channel) {
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    default:
      return "Dashboard";
  }
}

function getOwnerLane(
  order: StoredOrder,
  plan: ReturnType<typeof getOrderFulfillmentPlan>,
): OwnerLaneDescriptor {
  if (plan.requiresManualReview) {
    return {
      label: "Fulfillment review desk",
      note: plan.manualReviewReasons[0] ?? "Manual review is still required.",
    };
  }

  if (plan.paymentLinkRequired && order.status === "payment_pending") {
    return {
      label: "Payment follow-up",
      note: "Payment confirmation must land before warehouse execution continues.",
    };
  }

  if (plan.splitShipment) {
    return {
      label: "Supplier coordination",
      note: "This order is split across more than one supplier lane.",
    };
  }

  if (order.status === "confirmed" || order.status === "processing") {
    return {
      label: "Warehouse ops",
      note: "Warehouse execution now owns the next movement on this order.",
    };
  }

  if (order.status === "out_for_delivery") {
    return {
      label: "Delivery trace",
      note: "Customer delivery visibility now depends on carrier events.",
    };
  }

  return {
    label: "Customer confirmation",
    note: "The customer-facing state needs a verified next handoff.",
  };
}

function getPrimaryOrderAction({
  order,
  plan,
  nextStatus,
}: AuthorityOrderRecord): QueueAction | null {
  if (plan.requiresManualReview) {
    return null;
  }

  if (
    order.paymentMethodId === "payment_link" &&
    order.providerBindings.payment.state === "pending"
  ) {
    return {
      kind: "payment_link_sent",
      label: "تسجيل إرسال رابط الدفع",
      busyLabel: "جارٍ تسجيل handoff الدفع...",
      successMessage: `${order.orderNumber}: تم تسجيل إرسال رابط الدفع.`,
    };
  }

  if (
    order.paymentMethodId === "payment_link" &&
    order.providerBindings.payment.state === "link_sent"
  ) {
    return {
      kind: "payment_confirmed",
      label: "تأكيد الدفع",
      busyLabel: "جارٍ تسجيل callback الدفع...",
      successMessage: `${order.orderNumber}: تم تأكيد الدفع داخل provider binding.`,
    };
  }

  if (
    order.providerBindings.shipping.state === "pending" &&
    (order.status === "confirmed" || order.status === "processing")
  ) {
    return {
      kind: "shipping_booked",
      label: "تسجيل حجز الشحنة",
      busyLabel: "جارٍ تسجيل booking الشحن...",
      successMessage: `${order.orderNumber}: تم تسجيل حجز الشحنة.`,
    };
  }

  if (order.providerBindings.shipping.state === "booked") {
    return {
      kind: "shipping_in_transit",
      label: "تسجيل خروجها للتوصيل",
      busyLabel: "جارٍ تسجيل callback الشحن...",
      successMessage: `${order.orderNumber}: تم تسجيل خروج الشحنة للتوصيل.`,
    };
  }

  if (!nextStatus) {
    return null;
  }

  return {
    kind: "advance",
    label: `نقل إلى ${getOrderStatusMeta(nextStatus).label}`,
    busyLabel: "جارٍ تحديث حالة الطلب...",
    successMessage: `${order.orderNumber}: تم النقل إلى ${getOrderStatusMeta(nextStatus).label}.`,
  };
}

function buildOrderQueueItem(record: AuthorityOrderRecord): QueueItem | null {
  const { order, plan, providerHandoff, ownerLane } = record;
  const action = getPrimaryOrderAction(record);

  if (
    !plan.requiresManualReview &&
    !action &&
    order.status !== "received" &&
    order.status !== "payment_pending"
  ) {
    return null;
  }

  const severity: QueueSeverity = plan.requiresManualReview
    ? "critical"
    : order.status === "payment_pending" ||
        order.providerBindings.shipping.state === "booked"
      ? "attention"
      : "normal";

  return {
    id: `order:${order.orderNumber}`,
    itemType: "order",
    severity,
    title: order.orderNumber,
    subtitle: `${order.customer.fullName} · ${formatCurrency(order.totalEstimate)} · ${ownerLane.label}`,
    note: plan.requiresManualReview
      ? ownerLane.note
      : providerHandoff.nextAction || ownerLane.note,
    helper: `${providerHandoff.paymentLaneLabel} · ${providerHandoff.shippingLaneLabel} · ${providerHandoff.nextOwnerLabel}`,
    route: "/ops/orders",
    routeLabel: "لوحة الطلبات",
    badges: [
      getOrderStatusMeta(order.status).label,
      `Payment ${order.providerBindings.payment.state}`,
      `Shipping ${order.providerBindings.shipping.state}`,
    ],
    updatedAt: order.createdAt,
    action,
    order,
  };
}

function buildNotificationQueueItem(
  notification: StoredNotification,
): QueueItem | null {
  if (notification.status === "sent") {
    return null;
  }

  return {
    id: `notification:${notification.id}`,
    itemType: "notification",
    severity: notification.status === "blocked" ? "critical" : "attention",
    title: `${notification.label} · ${notification.orderNumber}`,
    subtitle: `${getNotificationChannelLabel(notification.channel)} · ${notification.recipientHint}`,
    note: notification.note,
    helper: `آخر تحديث ${formatTimestamp(notification.updatedAt)}`,
    route: "/ops/notifications",
    routeLabel: "لوحة الإشعارات",
    badges: [
      notification.status,
      notification.templateKey,
      getOrderStatusMeta(notification.orderStatus).label,
    ],
    updatedAt: notification.updatedAt,
    action:
      notification.status === "queued"
        ? {
            kind: "notification_sent",
            label: "تسجيل الإرسال",
            busyLabel: "جارٍ تحديث الإشعار...",
            successMessage: `${notification.orderNumber}: تم تسجيل الإشعار كمرسل.`,
          }
        : null,
    notification,
  };
}

export function OpsControlCenterSurface() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [auditEntries, setAuditEntries] = useState<OpsAuditEntry[]>([]);
  const [releasePacket, setReleasePacket] = useState<ReleasePacketArtifact | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);

  const loadDashboardData = useCallback(
    async (backgroundRefresh: boolean) => {
      if (backgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const [nextOrders, nextNotifications, nextAuditEntries, nextReleasePacket] =
          await Promise.all([
            fetchOpsOrdersFromAuthority(),
            fetchOpsNotifications().then((payload) => payload.notifications),
            fetchOpsAuditEntries().then((payload) => payload.auditEntries),
            fetchOpsReleasePacket().then((payload) => payload.releasePacket),
          ]);

        setOrders(nextOrders);
        setNotifications(nextNotifications);
        setAuditEntries(nextAuditEntries);
        setReleasePacket(nextReleasePacket);
        setError(null);
      } catch (loadError: unknown) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل control center التشغيلي الحالي.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboardData(false);
  }, [loadDashboardData]);

  const snapshot = useMemo(() => getOpsDashboardSnapshot(orders), [orders]);
  const contentSummary = getContentGovernanceSummary();
  const syncLogs = getSupplierSyncLogs();
  const catalogAuthority = useMemo(
    () => getCatalogAuthoritySnapshot(orders),
    [orders],
  );
  const supplierAuthority = useMemo(
    () => getSupplierAuthoritySnapshot(orders),
    [orders],
  );
  const authorityOrders = useMemo<AuthorityOrderRecord[]>(
    () =>
      orders.map((order) => {
        const plan = getOrderFulfillmentPlan(order);

        return {
          order,
          plan,
          providerHandoff: getOrderProviderHandoff(order),
          ownerLane: getOwnerLane(order, plan),
          nextStatus: getNextOrderStatus(order),
        };
      }),
    [orders],
  );
  const authoritySummary = useMemo(() => {
    const laneCounter = new Map<string, number>();

    for (const item of authorityOrders) {
      laneCounter.set(
        item.ownerLane.label,
        (laneCounter.get(item.ownerLane.label) ?? 0) + 1,
      );
    }

    return {
      manualReviewCount: authorityOrders.filter(
        (item) => item.plan.requiresManualReview,
      ).length,
      splitShipmentCount: authorityOrders.filter((item) => item.plan.splitShipment)
        .length,
      paymentFollowupCount: authorityOrders.filter(
        (item) =>
          item.plan.paymentLinkRequired &&
          item.order.status === "payment_pending",
      ).length,
      ownerLanes: Array.from(laneCounter.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((left, right) => right.count - left.count),
      blockerOrders: authorityOrders
        .filter((item) => item.plan.requiresManualReview)
        .slice(0, 4)
        .map((item) => ({
          orderNumber: item.order.orderNumber,
          reason: item.plan.manualReviewReasons[0] ?? "Manual review required",
        })),
    };
  }, [authorityOrders]);
  const executionQueue = useMemo(() => {
    const queueItems = [
      ...authorityOrders
        .map((record) => buildOrderQueueItem(record))
        .filter((item): item is QueueItem => item !== null),
      ...notifications
        .map((notification) => buildNotificationQueueItem(notification))
        .filter((item): item is QueueItem => item !== null),
    ];

    return queueItems
      .sort((left, right) => {
        const severityDelta =
          severityRank[left.severity] - severityRank[right.severity];

        if (severityDelta !== 0) {
          return severityDelta;
        }

        return right.updatedAt.localeCompare(left.updatedAt);
      })
      .slice(0, 10);
  }, [authorityOrders, notifications]);
  const recentAuditEntries = useMemo(() => auditEntries.slice(0, 5), [auditEntries]);
  const releaseHighlights = useMemo(
    () => releasePacket?.blockerHighlights.slice(0, 4) ?? [],
    [releasePacket],
  );
  const ownershipQueueCount = executionQueue.length + releaseHighlights.length;
  const queuedNotificationsCount = notifications.filter(
    (notification) => notification.status === "queued",
  ).length;
  const blockedNotificationsCount = notifications.filter(
    (notification) => notification.status === "blocked",
  ).length;

  async function handleQueueAction(item: QueueItem) {
    if (!item.action) {
      return;
    }

    const actionKey = `${item.id}:${item.action.kind}`;
    setActiveActionKey(actionKey);
    setError(null);

    try {
      if (item.itemType === "order" && item.order) {
        if (item.action.kind === "advance") {
          await advanceOpsOrderFromAuthority(item.order.orderNumber);
        } else if (item.action.kind !== "notification_sent") {
          await updateOpsOrderProviderBinding(
            item.order.orderNumber,
            item.action.kind,
          );
        }
      }

      if (
        item.itemType === "notification" &&
        item.notification &&
        item.action.kind === "notification_sent"
      ) {
        await updateOpsNotificationStatus(item.notification.id, "sent");
      }

      setLastUpdate(item.action.successMessage);
      await loadDashboardData(true);
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "تعذر تنفيذ الإجراء التشغيلي المطلوب من dashboard.",
      );
    } finally {
      setActiveActionKey(null);
    }
  }

  return (
    <div className={styles.page}>
      <OpsNav activeHref="/ops" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Internal ops control center</p>
          <h1>لوحة قيادة تشغيلية تملك الخطوة التالية بدل الاكتفاء بعرض المؤشرات.</h1>
          <p className={styles.summary}>
            هذه الصفحة لم تعد dashboard تلخيصية فقط. أصبحت control center تجمع
            queue الطلبات والإشعارات وblockers الإطلاق من authority نفسها، وتسمح
            بتنفيذ أول handoff تشغيلي مباشر من داخل `/ops` قبل الانتقال إلى
            المسارات المتخصصة.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Current scope</p>
            <strong>{isLoading ? "..." : snapshot.orderCount}</strong>
            <span>
              {isLoading
                ? "جارٍ تحميل الطلبات والطبقات التشغيلية."
                : `طلبات حية عبر ${snapshot.catalogCoverage.stockedProducts} منتج نشط و${snapshot.catalogCoverage.variants} variants تشغيلية.`}
            </span>
          </div>

          <div className={styles.metricCard}>
            <p>Ownership queue</p>
            <strong>{isLoading ? "..." : ownershipQueueCount}</strong>
            <span>
              {isLoading
                ? "جارٍ حساب المهام التشغيلية المفتوحة."
                : `${executionQueue.length} عنصر تنفيذ مباشر و${releaseHighlights.length} blocker إطلاق يحتاج owner واضح.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Boundary note</p>
            <h2>Dashboard ownership داخل authority الحالية</h2>
            <p>
              هذه ليست provider-backed backoffice كاملة بعد، لكنها لم تعد واجهة
              rehearsal صامتة. لوحة `/ops` الآن تملك queue تشغيلية وإجراءات أولية
              فعلية، بينما يبقى Pack 05 مسؤولًا عن auth/RBAC/provider ownership
              النهائي.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>مبيعات اليوم</p>
          <strong>{formatCurrency(snapshot.todaySales)}</strong>
          <span>إجمالي الطلبات المسجلة اليوم داخل authority الحالية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>مبيعات الشهر</p>
          <strong>{formatCurrency(snapshot.monthSales)}</strong>
          <span>المجموع الشهري الحالي من الطلبات المتاحة.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>الطوابير المفتوحة</p>
          <strong>{ownershipQueueCount}</strong>
          <span>طلبات وإشعارات وblockers إطلاق تحتاج مالك خطوة تالٍ الآن.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Pending follow-up</p>
          <strong>{snapshot.pendingOrders}</strong>
          <span>طلبات ما زالت تحتاج متابعة دفع أو تأكيد أولي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Queued notifications</p>
          <strong>{queuedNotificationsCount}</strong>
          <span>إشعارات ما زالت تنتظر الإرسال من queue المركزية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Blocked notifications</p>
          <strong>{blockedNotificationsCount}</strong>
          <span>إشعارات محجوبة تشغيليًا وتحتاج مراجعة القاعدة نفسها.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Manual review</p>
          <strong>{authoritySummary.manualReviewCount}</strong>
          <span>طلبات تحتاج owner handoff تشغيلي قبل الاعتماد.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Payment follow-up</p>
          <strong>{authoritySummary.paymentFollowupCount}</strong>
          <span>طلبات تحتاج handoff دفع قبل الانتقال للـ warehouse ops.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Low stock</p>
          <strong>{snapshot.lowStockCount}</strong>
          <span>Variants عند أو دون حد low stock الحالي.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Repeat customers</p>
          <strong>{snapshot.repeatCustomerCount}</strong>
          <span>عملاء تكرر منهم الشراء داخل البيانات الحالية.</span>
        </article>
      </section>

      <section className={styles.layout}>
        <div className={styles.summaryList}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Execution queue</p>
            <h2>من يملك الخطوة التالية الآن؟</h2>
            <p>
              هذا هو الصف التنفيذي المباشر من داخل dashboard: الطلبات التي تحتاج
              handoff، الإشعارات التي ما زالت queued، والحالات التي يجب أن تعود
              إلى surface متخصص بدل أن تبقى معلقة في summary cards.
            </p>

            <div className={styles.cardActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void loadDashboardData(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? "جارٍ تحديث control center..." : "تحديث البيانات"}
              </button>
              <TrackedLink
                href="/ops/orders"
                analyticsLabel="ops_dashboard_queue_orders"
                analyticsSurface="ops_dashboard_queue"
                analyticsDestinationType="ops_orders"
                className={styles.secondaryLink}
              >
                فتح لوحة الطلبات
              </TrackedLink>
            </div>

            {error ? <div className={styles.inlineError}>{error}</div> : null}
            {lastUpdate ? <div className={styles.inlineNotice}>{lastUpdate}</div> : null}

            <div className={styles.ordersGrid}>
              {isLoading ? (
                <article className={styles.emptyCard}>
                  <p className={styles.eyebrow}>Queue</p>
                  <h1>جارٍ تحميل ownership queue...</h1>
                  <p>يتم الآن جمع الطلبات والإشعارات وrelease blockers من authority الحالية.</p>
                </article>
              ) : executionQueue.length ? (
                executionQueue.map((item) => {
                  const actionKey = item.action ? `${item.id}:${item.action.kind}` : null;
                  const isActionPending = Boolean(
                    actionKey && activeActionKey === actionKey,
                  );

                  return (
                    <article key={item.id} className={styles.lineItem}>
                      <div className={styles.lineHead}>
                        <div>
                          <h3>{item.title}</h3>
                          <p className={styles.lineMeta}>{item.subtitle}</p>
                        </div>
                        <div className={styles.linePrice}>
                          {getQueueSeverityLabel(item.severity)}
                        </div>
                      </div>

                      <p>{item.note}</p>
                      <div className={styles.badgeRow}>
                        {item.badges.map((badge) => (
                          <span key={`${item.id}:${badge}`}>{badge}</span>
                        ))}
                      </div>
                      <span className={styles.helperText}>{item.helper}</span>

                      <div className={styles.cardActions}>
                        {item.action ? (
                          <button
                            type="button"
                            className={styles.primaryButton}
                            disabled={isActionPending}
                            onClick={() => void handleQueueAction(item)}
                          >
                            {isActionPending ? item.action.busyLabel : item.action.label}
                          </button>
                        ) : null}
                        <TrackedLink
                          href={item.route}
                          analyticsLabel={`ops_dashboard_queue_open_${item.itemType}`}
                          analyticsSurface="ops_dashboard_queue"
                          analyticsDestinationType={
                            item.itemType === "order"
                              ? "ops_orders"
                              : "ops_notifications"
                          }
                          className={styles.secondaryLink}
                        >
                          فتح {item.routeLabel}
                        </TrackedLink>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className={styles.emptyCard}>
                  <p className={styles.eyebrow}>Queue</p>
                  <h1>لا توجد مهام تشغيلية مفتوحة الآن</h1>
                  <p>عندما تظهر handoffs جديدة ستظهر هنا قبل أن تضيع بين الأسطح المختلفة.</p>
                </article>
              )}
            </div>
          </article>

          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Governance lane</p>
            <h2>Release blockers + audit trace</h2>
            <div className={styles.catalogPanelGrid}>
              <div className={styles.referenceCard}>
                <div className={styles.referenceRow}>
                  <span>Runtime release state</span>
                  <strong className={styles.referenceValue}>
                    {releasePacket?.overallStatus ?? "loading..."}
                  </strong>
                </div>
                <p>
                  {releasePacket
                    ? `${releasePacket.integrationContract.summary} ${releasePacket.runtimeSecretAlignment.summary}`
                    : "جارٍ تحميل executive packet الحالي."}
                </p>
                <div className={styles.summaryList}>
                  {releaseHighlights.length ? (
                    releaseHighlights.map((highlight) => (
                      <div key={highlight} className={styles.infoBullet}>
                        {highlight}
                      </div>
                    ))
                  ) : (
                    <div className={styles.infoBullet}>
                      لا توجد blocker highlights ظاهرة حاليًا داخل executive packet.
                    </div>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <TrackedLink
                    href="/ops/release"
                    analyticsLabel="ops_dashboard_to_release_blockers"
                    analyticsSurface="ops_dashboard_governance"
                    analyticsDestinationType="ops_release"
                    className={styles.secondaryLink}
                  >
                    فتح لوحة الإطلاق
                  </TrackedLink>
                </div>
              </div>

              <div className={styles.referenceCard}>
                <div className={styles.referenceRow}>
                  <span>Recent audit activity</span>
                  <strong className={styles.referenceValue}>
                    {recentAuditEntries.length}
                  </strong>
                </div>
                <div className={styles.summaryList}>
                  {recentAuditEntries.length ? (
                    recentAuditEntries.map((entry) => (
                      <div key={entry.id} className={styles.infoBullet}>
                        <strong>{entry.summary}</strong>
                        <br />
                        {entry.actor.name} · {entry.actor.role} ·{" "}
                        {formatTimestamp(entry.createdAt)}
                      </div>
                    ))
                  ) : (
                    <div className={styles.infoBullet}>
                      لا توجد audit entries مقروءة بعد داخل هذا التحميل.
                    </div>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <TrackedLink
                    href="/ops/audit"
                    analyticsLabel="ops_dashboard_to_audit"
                    analyticsSurface="ops_dashboard_governance"
                    analyticsDestinationType="ops_audit"
                    className={styles.secondaryLink}
                  >
                    فتح سجل المراجعة
                  </TrackedLink>
                </div>
              </div>
            </div>
          </article>

          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Top products</p>
            <h2>الأعلى بيعًا</h2>
            <div className={styles.ordersGrid}>
              {snapshot.topProducts.length ? (
                snapshot.topProducts.map((product) => (
                  <article key={product.slug} className={styles.lineItem}>
                    <div className={styles.lineHead}>
                      <div>
                        <h3>{product.name}</h3>
                        <p className={styles.lineMeta}>{product.collectionTitle}</p>
                      </div>
                      <div className={styles.linePrice}>{product.quantity} قطعة</div>
                    </div>
                    <div className={styles.badgeRow}>
                      <span>Revenue: {formatCurrency(product.revenue)}</span>
                      <span>Slug: {product.slug}</span>
                    </div>
                  </article>
                ))
              ) : (
                <article className={styles.emptyCard}>
                  <p className={styles.eyebrow}>Sales</p>
                  <h1>لا توجد طلبات كافية بعد</h1>
                  <p>ستظهر المنتجات الأعلى بيعًا هنا بمجرد تراكم الطلبات داخل authority الحالية.</p>
                </article>
              )}
            </div>
          </article>

          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>Demand map</p>
            <h2>أعلى المدن وأفضل الفئات</h2>
            <div className={styles.catalogPanelGrid}>
              <div className={styles.referenceCard}>
                <strong>Top cities</strong>
                <div className={styles.summaryList}>
                  {snapshot.topCities.length ? (
                    snapshot.topCities.map((city) => (
                      <div key={city.city} className={styles.referenceRow}>
                        <span>{city.city}</span>
                        <strong className={styles.referenceValue}>{city.count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className={styles.helperText}>ستظهر خريطة المدن هنا بعد أولى الطلبات الفعلية.</p>
                  )}
                </div>
              </div>

              <div className={styles.referenceCard}>
                <strong>Top collections</strong>
                <div className={styles.summaryList}>
                  {snapshot.topCollections.length ? (
                    snapshot.topCollections.map((collection) => (
                      <div
                        key={collection.collection}
                        className={styles.referenceRow}
                      >
                        <span>{collection.title}</span>
                        <strong className={styles.referenceValue}>
                          {collection.count}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p className={styles.helperText}>أفضل الفئات ستظهر عندما تتراكم بيانات الطلبات.</p>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Authority lanes</p>
            <h2>من يملك القرار الآن؟</h2>
            <div className={styles.summaryList}>
              {authoritySummary.ownerLanes.length ? (
                authoritySummary.ownerLanes.map((lane) => (
                  <div key={lane.label} className={styles.referenceRow}>
                    <span>{lane.label}</span>
                    <strong className={styles.referenceValue}>{lane.count}</strong>
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>ستظهر owner lanes هنا بعد أولى الطلبات الداخلية.</div>
              )}
            </div>
            <div className={styles.summaryList}>
              {authoritySummary.blockerOrders.length ? (
                authoritySummary.blockerOrders.map((item) => (
                  <div key={item.orderNumber} className={styles.infoBullet}>
                    <strong>{item.orderNumber}</strong>
                    <br />
                    {item.reason}
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>لا توجد manual-review blockers بارزة الآن.</div>
              )}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Catalog authority</p>
            <h2>الضغط القادم من الكتالوج</h2>
            <div className={styles.summaryList}>
              <div className={styles.referenceRow}>
                <span>Products with demand</span>
                <strong className={styles.referenceValue}>
                  {catalogAuthority.productsWithDemand}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>Review-required products</span>
                <strong className={styles.referenceValue}>
                  {catalogAuthority.reviewRequiredProducts}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>Suppliers on watch</span>
                <strong className={styles.referenceValue}>
                  {supplierAuthority.suppliersOnWatch}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>Pending demand units</span>
                <strong className={styles.referenceValue}>
                  {catalogAuthority.pendingDemandUnits}
                </strong>
              </div>
            </div>
            <div className={styles.cardActions}>
              <TrackedLink
                href="/ops/catalog"
                analyticsLabel="ops_dashboard_to_catalog_authority"
                analyticsSurface="ops_dashboard_summary"
                analyticsDestinationType="ops_catalog"
                className={styles.secondaryLink}
              >
                فتح لوحة الكتالوج
              </TrackedLink>
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Low stock</p>
            <h2>الاستثناءات العاجلة</h2>
            <div className={styles.summaryList}>
              {snapshot.lowStock.length ? (
                snapshot.lowStock.map((variant) => (
                  <div key={`${variant.productSlug}-${variant.sku}`} className={styles.infoBullet}>
                    <strong>{variant.productName}</strong>
                    <br />
                    {variant.sku} | المخزون {variant.stockOnHand} / الحد{" "}
                    {variant.lowStockThreshold}
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>لا توجد variants منخفضة المخزون حاليًا.</div>
              )}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Supplier queue</p>
            <h2>ملاحظات الموردين والـ sync</h2>
            <div className={styles.summaryList}>
              {snapshot.supplierExceptions.length ? (
                snapshot.supplierExceptions.slice(0, 4).map((exception) => (
                  <div key={exception.id} className={styles.infoBullet}>
                    <strong>{exception.title}</strong>
                    <br />
                    {exception.note}
                  </div>
                ))
              ) : (
                <div className={styles.infoBullet}>لا توجد استثناءات supplier بارزة حاليًا.</div>
              )}
            </div>
            <div className={styles.summaryList}>
              {syncLogs.map((log) => (
                <div key={log.id} className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>{log.area}</span>
                    <strong className={styles.referenceValue}>{log.status}</strong>
                  </div>
                  <p>{log.note}</p>
                  <span className={styles.helperText}>{formatTimestamp(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Ownership freeze</p>
            <h2>المحتوى والإطلاق</h2>
            <div className={styles.summaryList}>
              <div className={styles.referenceRow}>
                <span>Owners mapped</span>
                <strong className={styles.referenceValue}>
                  {contentSummary.ownersMapped}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>Awaiting samples</span>
                <strong className={styles.referenceValue}>
                  {contentSummary.awaitingStyleSamples}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>Awaiting business inputs</span>
                <strong className={styles.referenceValue}>
                  {contentSummary.awaitingBusinessInputs}
                </strong>
              </div>
              <div className={styles.referenceRow}>
                <span>Launch-blocked groups</span>
                <strong className={styles.referenceValue}>
                  {contentSummary.launchBlocked}
                </strong>
              </div>
            </div>
            <div className={styles.cardActions}>
              <TrackedLink
                href="/ops/content"
                analyticsLabel="ops_dashboard_to_content"
                analyticsSurface="ops_dashboard_summary"
                analyticsDestinationType="ops_content"
                className={styles.secondaryLink}
              >
                فتح لوحة المحتوى
              </TrackedLink>
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Ops surfaces</p>
            <h2>مسارات الملكية التشغيلية</h2>
            <div className={styles.linkList}>
              <TrackedLink
                href="/ops/orders"
                analyticsLabel="ops_dashboard_to_orders"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_orders"
              >
                <span>إدارة الطلبات</span>
                <span>Queue + status flow</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/catalog"
                analyticsLabel="ops_dashboard_to_catalog"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_catalog"
              >
                <span>إدارة الكتالوج</span>
                <span>Stock + supplier map</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/fulfillment"
                analyticsLabel="ops_dashboard_to_fulfillment"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_fulfillment"
              >
                <span>إدارة fulfillment</span>
                <span>Routing + dispatch</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/notifications"
                analyticsLabel="ops_dashboard_to_notifications"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_notifications"
              >
                <span>إدارة الإشعارات</span>
                <span>Queue + delivery trace</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/release"
                analyticsLabel="ops_dashboard_to_release"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_release"
              >
                <span>Release readiness</span>
                <span>Live blockers + launch gates</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/audit"
                analyticsLabel="ops_dashboard_to_audit_summary"
                analyticsSurface="ops_dashboard_links"
                analyticsDestinationType="ops_audit"
              >
                <span>سجل المراجعة</span>
                <span>Sessions + protected mutations</span>
              </TrackedLink>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
