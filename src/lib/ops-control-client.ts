import type {
  NotificationDeliveryStatus,
  StoredNotification,
} from "@/lib/notification-types";
import type { OpsAuditEntry, OpsSessionSummary } from "@/lib/ops-types";

async function parseApiError(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function fetchOpsSessionSummary() {
  const response = await fetch("/api/ops/session", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحميل جلسة ops الحالية."),
    );
  }

  return (await response.json()) as {
    session: OpsSessionSummary;
  };
}

export async function fetchOpsAuditEntries() {
  const response = await fetch("/api/ops/audit", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحميل سجل المراجعة الداخلي."),
    );
  }

  return (await response.json()) as {
    auditEntries: OpsAuditEntry[];
  };
}

export async function fetchOpsNotifications() {
  const response = await fetch("/api/ops/notifications", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحميل قائمة الإشعارات التشغيلية."),
    );
  }

  return (await response.json()) as {
    notifications: StoredNotification[];
  };
}

export async function updateOpsNotificationStatus(
  notificationId: string,
  status: Extract<NotificationDeliveryStatus, "queued" | "sent">,
) {
  const response = await fetch(
    `/api/ops/notifications/${encodeURIComponent(notificationId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحديث حالة الإشعار التشغيلي."),
    );
  }

  return (await response.json()) as {
    notification: StoredNotification;
    previousStatus: NotificationDeliveryStatus;
    nextStatus: NotificationDeliveryStatus;
  };
}
