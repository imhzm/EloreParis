import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getOrderFulfillmentPlan } from "@/lib/fulfillment";
import type {
  NotificationDeliveryStatus,
  NotificationTemplateKey,
  StoredNotification,
} from "@/lib/notification-types";
import { getPhoneLastFour, type StoredOrder } from "@/lib/orders";

export class NotificationAuthorityError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "NotificationAuthorityError";
    this.statusCode = statusCode;
  }
}

function getNotificationAuthorityFilePath() {
  const configuredPath = process.env.NOTIFICATION_AUTHORITY_FILE?.trim();
  const relativePath =
    configuredPath && configuredPath.length > 0
      ? configuredPath
      : ".data/notifications.json";

  return path.resolve(/* turbopackIgnore: true */ process.cwd(), relativePath);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isNotificationTemplateKey(value: unknown): value is NotificationTemplateKey {
  return (
    value === "order_received" ||
    value === "payment_link" ||
    value === "preparation_update" ||
    value === "delivery_update"
  );
}

function isNotificationChannel(value: unknown): value is StoredNotification["channel"] {
  return value === "whatsapp" || value === "email" || value === "dashboard";
}

function isNotificationStatus(value: unknown): value is NotificationDeliveryStatus {
  return value === "queued" || value === "sent" || value === "blocked";
}

function maskEmail(email: string) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail.includes("@")) {
    return "email pending";
  }

  const [localPart, domainPart] = normalizedEmail.split("@");
  const safeLocal = localPart.trim();
  const safeDomain = domainPart?.trim() ?? "";

  if (!safeLocal || !safeDomain) {
    return "email pending";
  }

  return `${safeLocal.slice(0, 1)}***@${safeDomain}`;
}

function getRecipientHint(order: StoredOrder, channel: StoredNotification["channel"]) {
  if (channel === "email") {
    return order.customer.email ? maskEmail(order.customer.email) : "email pending";
  }

  if (channel === "dashboard") {
    return "internal ops feed";
  }

  return `***${getPhoneLastFour(order.customer.phone)}`;
}

function normalizeNotification(value: unknown): StoredNotification | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.orderNumber !== "string" ||
    !isNotificationTemplateKey(value.templateKey) ||
    typeof value.label !== "string" ||
    !isNotificationChannel(value.channel) ||
    !isNotificationStatus(value.status) ||
    typeof value.note !== "string" ||
    typeof value.recipientHint !== "string" ||
    typeof value.orderStatus !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    !("sentAt" in value) ||
    (typeof value.sentAt !== "string" && value.sentAt !== null)
  ) {
    return null;
  }

  return {
    id: value.id,
    orderNumber: value.orderNumber.trim().toUpperCase(),
    templateKey: value.templateKey,
    label: value.label,
    channel: value.channel,
    status: value.status,
    note: value.note,
    recipientHint: value.recipientHint,
    orderStatus: value.orderStatus as StoredOrder["status"],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    sentAt: value.sentAt,
  };
}

async function writeAuthorityNotifications(notifications: StoredNotification[]) {
  const filePath = getNotificationAuthorityFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(notifications, null, 2), "utf8");
}

function sortNotifications(
  notifications: StoredNotification[],
) {
  return [...notifications].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

function normalizeNotificationStatus(
  status: string,
): NotificationDeliveryStatus {
  if (status === "disabled") {
    return "blocked";
  }

  return "queued";
}

function syncNotificationsForSingleOrder(
  currentNotifications: StoredNotification[],
  order: StoredOrder,
) {
  const now = new Date().toISOString();
  const plan = getOrderFulfillmentPlan(order);
  let didChange = false;
  const nextNotifications = [...currentNotifications];

  for (const notification of plan.notifications) {
    if (notification.status === "upcoming" || notification.status === "completed") {
      continue;
    }

    const existingIndex = nextNotifications.findIndex(
      (item) =>
        item.orderNumber === order.orderNumber &&
        item.templateKey === notification.key,
    );
    const nextStatus = normalizeNotificationStatus(notification.status);
    const nextRecipientHint = getRecipientHint(order, notification.channel);

    if (existingIndex === -1) {
      nextNotifications.push({
        id: randomUUID(),
        orderNumber: order.orderNumber,
        templateKey: notification.key,
        label: notification.label,
        channel: notification.channel,
        status: nextStatus,
        note: notification.note,
        recipientHint: nextRecipientHint,
        orderStatus: order.status,
        createdAt: now,
        updatedAt: now,
        sentAt: null,
      });
      didChange = true;
      continue;
    }

    const currentNotification = nextNotifications[existingIndex];
    const shouldUpdateBlockedState =
      currentNotification.status === "blocked" && nextStatus === "blocked";
    const nextNotification: StoredNotification = {
      ...currentNotification,
      label: notification.label,
      channel: notification.channel,
      note: notification.note,
      recipientHint: nextRecipientHint,
      orderStatus: order.status,
      status: shouldUpdateBlockedState ? "blocked" : currentNotification.status,
      updatedAt:
        currentNotification.orderStatus !== order.status ||
        currentNotification.recipientHint !== nextRecipientHint ||
        currentNotification.note !== notification.note
          ? now
          : currentNotification.updatedAt,
    };

    if (
      JSON.stringify(nextNotification) !== JSON.stringify(currentNotification)
    ) {
      nextNotifications[existingIndex] = nextNotification;
      didChange = true;
    }
  }

  return {
    notifications: sortNotifications(nextNotifications),
    didChange,
  };
}

export async function readAuthorityNotifications() {
  const filePath = getNotificationAuthorityFilePath();

  try {
    const rawValue = await readFile(filePath, "utf8");
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [] as StoredNotification[];
    }

    return sortNotifications(
      parsedValue
        .map((notification) => normalizeNotification(notification))
        .filter(
          (notification): notification is StoredNotification =>
            notification !== null,
        ),
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [] as StoredNotification[];
    }

    throw new NotificationAuthorityError(
      "تعذر قراءة طبقة الإشعارات الحالية من authority التطبيق.",
      500,
    );
  }
}

export async function syncNotificationQueueForOrders(orders: StoredOrder[]) {
  let notifications = await readAuthorityNotifications();
  let shouldWrite = false;

  for (const order of orders) {
    const syncResult = syncNotificationsForSingleOrder(notifications, order);
    notifications = syncResult.notifications;
    shouldWrite = shouldWrite || syncResult.didChange;
  }

  if (shouldWrite) {
    await writeAuthorityNotifications(notifications);
  }

  return notifications;
}

export async function listAuthorityNotifications(orders: StoredOrder[]) {
  return syncNotificationQueueForOrders(orders);
}

export async function listAuthorityNotificationsForOrder(order: StoredOrder) {
  const notifications = await syncNotificationQueueForOrders([order]);
  return notifications.filter(
    (notification) => notification.orderNumber === order.orderNumber,
  );
}

export async function updateAuthorityNotificationStatus(
  notificationId: string,
  nextStatus: NotificationDeliveryStatus,
) {
  if (nextStatus !== "queued" && nextStatus !== "sent") {
    throw new NotificationAuthorityError(
      "حالة الإشعار المطلوبة غير مدعومة داخل طبقة التشغيل الحالية.",
      400,
    );
  }

  const notifications = await readAuthorityNotifications();
  const normalizedId = notificationId.trim();
  const notificationIndex = notifications.findIndex(
    (notification) => notification.id === normalizedId,
  );

  if (notificationIndex === -1) {
    throw new NotificationAuthorityError(
      "تعذر العثور على الإشعار المطلوب داخل authority الحالية.",
      404,
    );
  }

  const currentNotification = notifications[notificationIndex];

  if (currentNotification.status === "blocked") {
    throw new NotificationAuthorityError(
      "هذا الإشعار محجوب تشغيليًا ولا يمكن تحديثه يدويًا.",
      409,
    );
  }

  const now = new Date().toISOString();
  const nextNotification: StoredNotification = {
    ...currentNotification,
    status: nextStatus,
    updatedAt: now,
    sentAt: nextStatus === "sent" ? now : null,
  };

  notifications[notificationIndex] = nextNotification;
  const sortedNotifications = sortNotifications(notifications);
  await writeAuthorityNotifications(sortedNotifications);

  return {
    notification: nextNotification,
    previousStatus: currentNotification.status,
  };
}
