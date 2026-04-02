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
