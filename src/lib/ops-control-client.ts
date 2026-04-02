import type {
  NotificationDeliveryStatus,
  StoredNotification,
} from "@/lib/notification-types";
import type { OpsAuditEntry, OpsSessionSummary } from "@/lib/ops-types";
import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import type {
  ReleaseDecisionRecord,
  ReleasePackageComparison,
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import type { ReleaseReadinessSnapshot } from "@/lib/release-readiness-types";

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

export async function fetchOpsReleaseReadiness() {
  const response = await fetch("/api/ops/release", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحميل حالة الجاهزية التشغيلية للإطلاق."),
    );
  }

  return (await response.json()) as {
    releaseReadiness: ReleaseReadinessSnapshot;
  };
}

export async function fetchOpsReleaseEvidence() {
  const response = await fetch("/api/ops/release/evidence", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحميل تقرير التحقق التنفيذي الحالي."),
    );
  }

  return (await response.json()) as {
    releaseEvidence: ReleaseEvidenceReport;
  };
}

export async function fetchOpsReleaseHistory() {
  const response = await fetch("/api/ops/release/history", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحميل سجل حزم الإطلاق الحالية."),
    );
  }

  return (await response.json()) as {
    releasePackages: ReleasePackageRecord[];
  };
}

export async function fetchOpsReleaseComparison() {
  const response = await fetch("/api/ops/release/compare", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحميل مقارنة حزم الإطلاق الحالية."),
    );
  }

  return (await response.json()) as {
    releaseComparison: ReleasePackageComparison;
  };
}

export async function fetchOpsReleaseDecisions() {
  const response = await fetch("/api/ops/release/decisions", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, "تعذر تحميل سجل قرارات الإطلاق الحالية."),
    );
  }

  return (await response.json()) as {
    releaseDecisions: ReleaseDecisionRecord[];
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
