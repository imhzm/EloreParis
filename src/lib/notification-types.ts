import type { OrderStatus } from "@/lib/orders";

export type NotificationTemplateKey =
  | "order_received"
  | "payment_link"
  | "preparation_update"
  | "delivery_update";

export type NotificationChannel = "whatsapp" | "email" | "dashboard";

export type NotificationDeliveryStatus = "queued" | "sent" | "blocked";

export type StoredNotification = {
  id: string;
  orderNumber: string;
  templateKey: NotificationTemplateKey;
  label: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  note: string;
  recipientHint: string;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};
