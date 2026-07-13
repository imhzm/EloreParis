import "server-only";

import {
  syncNotificationQueueForOrders,
  updateAuthorityNotificationStatus,
} from "@/lib/notification-authority";
import type { StoredNotification } from "@/lib/notification-types";
import type { StoredOrder } from "@/lib/orders";
import { getNotificationProviderConfig } from "@/lib/live-provider-config";
import {
  dispatchNotificationWithProvider,
  ProviderGatewayError,
} from "@/lib/provider-gateway";

const INTERNAL_DASHBOARD_PROVIDER_LABEL = "Internal dashboard surface";

async function deliverQueuedNotification(
  notification: StoredNotification,
  order: StoredOrder,
) {
  if (notification.status !== "queued") {
    return notification;
  }

  if (notification.channel === "dashboard") {
    const { notification: deliveredNotification } =
      await updateAuthorityNotificationStatus(notification.id, "sent", {
        sentAt: new Date().toISOString(),
        providerLabel: INTERNAL_DASHBOARD_PROVIDER_LABEL,
        providerDeliveryId:
          notification.providerDeliveryId ?? `${notification.orderNumber}-dashboard`,
        providerEventId: notification.providerEventId,
        lastError: null,
      });

    return deliveredNotification;
  }

  const providerConfig = getNotificationProviderConfig();

  if (!providerConfig.requestConfigured) {
    return notification;
  }

  try {
    const deliveryResult = await dispatchNotificationWithProvider(notification, order);
    const { notification: deliveredNotification } =
      await updateAuthorityNotificationStatus(notification.id, "sent", {
        sentAt: deliveryResult.sentAt,
        providerLabel: deliveryResult.providerLabel,
        providerDeliveryId: deliveryResult.providerDeliveryId,
        providerEventId: deliveryResult.providerEventId,
        lastError: null,
      });

    return deliveredNotification;
  } catch (error) {
    if (!(error instanceof ProviderGatewayError)) {
      throw error;
    }

    const { notification: retainedNotification } =
      await updateAuthorityNotificationStatus(notification.id, "queued", {
        providerLabel: providerConfig.label,
        providerDeliveryId: notification.providerDeliveryId,
        providerEventId: notification.providerEventId,
        lastError: error.message,
      });

    return retainedNotification;
  }
}

export async function deliverNotificationForOrder(
  notification: StoredNotification,
  order: StoredOrder,
) {
  return deliverQueuedNotification(notification, order);
}

export async function syncAndDeliverNotificationsForOrders(orders: StoredOrder[]) {
  const notifications = await syncNotificationQueueForOrders(orders);
  const updatedNotifications = new Map<string, StoredNotification>();

  for (const order of orders) {
    const orderNotifications = notifications.filter(
      (notification) => notification.orderNumber === order.orderNumber,
    );

    for (const notification of orderNotifications) {
      const deliveredNotification = await deliverQueuedNotification(
        notification,
        order,
      );
      updatedNotifications.set(deliveredNotification.id, deliveredNotification);
    }
  }

  return notifications.map(
    (notification) => updatedNotifications.get(notification.id) ?? notification,
  );
}
