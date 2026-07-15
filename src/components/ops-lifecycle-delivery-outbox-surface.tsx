"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ops-lifecycle-delivery-outbox-surface.module.css";

type DeliveryStatus =
  | "pending"
  | "processing"
  | "accepted"
  | "failed"
  | "dead_letter";
type DeliveryType = "newsletter_confirmation" | "back_in_stock_available";
type StatusFilter = "all" | DeliveryStatus;
type TypeFilter = "all" | DeliveryType;

type DeliveryOutboxRecord = {
  id: string;
  subscriptionId: string;
  deliveryType: DeliveryType;
  providerKey: string | null;
  status: DeliveryStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  leaseExpiresAt: string | null;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  contactHint: string;
  productSlug: string | null;
  sku: string | null;
};

type DeliveryOutboxSnapshot = {
  availability: {
    available: boolean;
    providerKey: string | null;
    code?: string;
  };
  metrics: {
    pending: number;
    processing: number;
    accepted: number;
    failed: number;
    deadLetter: number;
  };
  recent: DeliveryOutboxRecord[];
};

type ProviderReadiness = {
  selectedProvider: string | null;
  region: string | null;
  fromDomainConfigured: boolean;
  configurationSetConfigured: boolean;
  callbackConfigured: boolean;
  blockers: string[];
};

const statusLabels: Record<DeliveryStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  accepted: "Accepted",
  failed: "Failed",
  dead_letter: "Dead letter",
};

const deliveryTypeLabels: Record<DeliveryType, string> = {
  newsletter_confirmation: "Newsletter confirmation",
  back_in_stock_available: "Back in stock",
};

function formatTimestamp(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function safeMaskedDestination(value: string) {
  const hint = value.trim().slice(0, 160);
  if (hint.toLowerCase() === "withdrawn") return "withdrawn";
  return /[*•…]/u.test(hint) ? hint : "masked-contact";
}

function isDeliveryOutboxSnapshot(value: unknown): value is DeliveryOutboxSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DeliveryOutboxSnapshot>;
  return (
    typeof candidate.availability?.available === "boolean" &&
    typeof candidate.metrics?.pending === "number" &&
    typeof candidate.metrics?.processing === "number" &&
    typeof candidate.metrics?.accepted === "number" &&
    typeof candidate.metrics?.failed === "number" &&
    typeof candidate.metrics?.deadLetter === "number" &&
    Array.isArray(candidate.recent)
  );
}

function isProviderReadiness(value: unknown): value is ProviderReadiness {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProviderReadiness>;
  return (
    (candidate.selectedProvider === null ||
      typeof candidate.selectedProvider === "string") &&
    (candidate.region === null || typeof candidate.region === "string") &&
    typeof candidate.fromDomainConfigured === "boolean" &&
    typeof candidate.configurationSetConfigured === "boolean" &&
    typeof candidate.callbackConfigured === "boolean" &&
    Array.isArray(candidate.blockers) &&
    candidate.blockers.every((blocker) => typeof blocker === "string")
  );
}

async function readApiError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "تعذر تحميل سجل lifecycle delivery outbox.";
  } catch {
    return "تعذر تحميل سجل lifecycle delivery outbox.";
  }
}

export function OpsLifecycleDeliveryOutboxSurface() {
  const [snapshot, setSnapshot] = useState<DeliveryOutboxSnapshot | null>(null);
  const [providerReadiness, setProviderReadiness] =
    useState<ProviderReadiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/ops/lifecycle?limit=50", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response));
        const payload = (await response.json()) as {
          deliveryOutbox?: unknown;
          providerReadiness?: unknown;
        };
        if (!isDeliveryOutboxSnapshot(payload.deliveryOutbox)) {
          throw new Error("عقد lifecycle delivery outbox غير متاح في الاستجابة الحالية.");
        }
        if (!isProviderReadiness(payload.providerReadiness)) {
          throw new Error("عقد provider readiness غير متاح في الاستجابة الحالية.");
        }
        return {
          deliveryOutbox: payload.deliveryOutbox,
          providerReadiness: payload.providerReadiness,
        };
      })
      .then((payload) => {
        setSnapshot(payload.deliveryOutbox);
        setProviderReadiness(payload.providerReadiness);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setSnapshot(null);
        setProviderReadiness(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل سجل lifecycle delivery outbox.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const filteredRecords = useMemo(
    () =>
      (snapshot?.recent ?? []).filter(
        (record) =>
          (statusFilter === "all" || record.status === statusFilter) &&
          (typeFilter === "all" || record.deliveryType === typeFilter),
      ),
    [snapshot, statusFilter, typeFilter],
  );

  function reload() {
    setIsLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }

  const metrics = snapshot?.metrics;

  return (
    <section className={styles.section} aria-labelledby="ops-delivery-outbox-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Lifecycle delivery outbox</p>
          <h2 id="ops-delivery-outbox-title">دليل قبول المزود وإعادة المحاولة، دون كشف الوجهة.</h2>
          <p>
            سجل read-only لمحاولات الإرسال ومواعيد retry وحالة dead-letter. حالة
            Accepted تعني أن المزود قبل الرسالة، ولا تثبت وصولها إلى صندوق العميل.
          </p>
        </div>
        <button
          type="button"
          className={styles.reloadButton}
          onClick={reload}
          disabled={isLoading}
        >
          {isLoading ? "جارٍ التحديث..." : "تحديث السجل"}
        </button>
      </div>

      <section className={styles.readiness} aria-labelledby="provider-readiness-title">
        <div className={styles.readinessHead}>
          <div>
            <p className={styles.eyebrow}>Provider preflight</p>
            <h3 id="provider-readiness-title">جاهزية الإرسال الحالية</h3>
          </div>
          <strong data-ready={providerReadiness?.blockers.length === 0}>
            {isLoading
              ? "جارٍ الفحص"
              : providerReadiness?.blockers.length === 0
                ? "Ready"
                : "Blocked"}
          </strong>
        </div>

        <div className={styles.readinessGrid} aria-live="polite" aria-busy={isLoading}>
          <article><span>Selected provider</span><strong>{providerReadiness?.selectedProvider ?? "—"}</strong></article>
          <article><span>Region</span><strong>{providerReadiness?.region ?? "—"}</strong></article>
          <article><span>From domain</span><strong>{providerReadiness?.fromDomainConfigured ? "Configured" : "Not configured"}</strong></article>
          <article><span>Configuration set</span><strong>{providerReadiness?.configurationSetConfigured ? "Configured" : "Not configured"}</strong></article>
          <article><span>Provider callback</span><strong>{providerReadiness?.callbackConfigured ? "Configured" : "Not configured"}</strong></article>
        </div>

        {providerReadiness?.blockers.length ? (
          <div className={styles.blockers}>
            <span>Blocker codes</span>
            <ul>
              {providerReadiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        ) : null}
      </section>

      <div className={styles.metrics} aria-live="polite" aria-busy={isLoading}>
        <article data-tone="pending"><span>Pending</span><strong>{metrics?.pending ?? "—"}</strong><small>بانتظار أول محاولة أو retry</small></article>
        <article data-tone="processing"><span>Processing</span><strong>{metrics?.processing ?? "—"}</strong><small>محاولات تملك lease نشطة</small></article>
        <article data-tone="accepted"><span>Accepted</span><strong>{metrics?.accepted ?? "—"}</strong><small>قبول المزود، وليس وصولًا للعميل</small></article>
        <article data-tone="failed"><span>Failed</span><strong>{metrics?.failed ?? "—"}</strong><small>فشل قابل للمراجعة</small></article>
        <article data-tone="dead_letter"><span>Dead letter</span><strong>{metrics?.deadLetter ?? "—"}</strong><small>استنفدت حد المحاولات</small></article>
      </div>

      {snapshot && !snapshot.availability.available ? (
        <div className={styles.availability} role="status">
          <div>
            <strong>مزود lifecycle delivery غير متاح حاليًا.</strong>
            <p>يمكن مراجعة السجل، لكن لا توجد قدرة إرسال نشطة في runtime الحالي.</p>
          </div>
          <span>{snapshot.availability.code ?? "provider_unavailable"}</span>
        </div>
      ) : snapshot ? (
        <div className={styles.providerState}>
          <span aria-hidden="true" />
          Provider: {snapshot.availability.providerKey ?? "internal"}
        </div>
      ) : null}

      <div className={styles.controls}>
        <label>
          <span>حالة الإرسال</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value as StatusFilter)}
          >
            <option value="all">كل الحالات</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="accepted">Accepted</option>
            <option value="failed">Failed</option>
            <option value="dead_letter">Dead letter</option>
          </select>
        </label>
        <label>
          <span>نوع الرسالة</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.currentTarget.value as TypeFilter)}
          >
            <option value="all">كل الأنواع</option>
            <option value="newsletter_confirmation">Newsletter confirmation</option>
            <option value="back_in_stock_available">Back in stock</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button type="button" onClick={reload}>إعادة المحاولة</button>
        </div>
      ) : null}

      {isLoading ? (
        <div className={styles.state} role="status" aria-live="polite">
          جارٍ تحميل lifecycle delivery outbox المحمي...
        </div>
      ) : snapshot && filteredRecords.length > 0 ? (
        <div className={styles.records}>
          {filteredRecords.map((record) => (
            <article key={record.id} className={styles.record}>
              <div className={styles.recordHead}>
                <div>
                  <span>{deliveryTypeLabels[record.deliveryType]}</span>
                  <h3>{safeMaskedDestination(record.contactHint)}</h3>
                </div>
                <strong data-status={record.status}>{statusLabels[record.status]}</strong>
              </div>

              <dl>
                <div><dt>Attempts</dt><dd>{record.attempts} / {record.maxAttempts}</dd></div>
                <div><dt>Provider</dt><dd>{record.providerKey ?? "internal"}</dd></div>
                <div><dt>Next retry</dt><dd>{formatTimestamp(record.nextAttemptAt)}</dd></div>
                <div><dt>Lease expires</dt><dd>{formatTimestamp(record.leaseExpiresAt)}</dd></div>
                <div><dt>Provider accepted</dt><dd>{formatTimestamp(record.acceptedAt)}</dd></div>
                <div><dt>Last error code</dt><dd>{record.lastErrorCode ?? "—"}</dd></div>
                {record.productSlug ? <div><dt>Product</dt><dd>{record.productSlug}</dd></div> : null}
                {record.sku ? <div><dt>SKU</dt><dd>{record.sku}</dd></div> : null}
              </dl>

              <footer>
                <span>Subscription {record.subscriptionId.slice(0, 12)}</span>
                <span>آخر تحديث: {formatTimestamp(record.updatedAt)}</span>
              </footer>
            </article>
          ))}
        </div>
      ) : snapshot?.recent.length ? (
        <div className={styles.state}>لا توجد محاولات إرسال تطابق الفلاتر الحالية.</div>
      ) : (
        <div className={styles.state}>لا توجد أحداث lifecycle delivery في outbox حتى الآن.</div>
      )}
    </section>
  );
}
