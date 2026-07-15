"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ops-lifecycle-consent-surface.module.css";

type LifecycleKind = "newsletter" | "back_in_stock";
type LifecycleStatus = "subscribed" | "unsubscribed" | "fulfilled";
type StatusFilter = "all" | LifecycleStatus;
type KindFilter = "all" | LifecycleKind;

type LifecycleRecord = {
  id: string;
  kind: LifecycleKind;
  status: LifecycleStatus;
  contactHint: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  consentGrantedAt: string;
  consentWithdrawnAt: string | null;
  fulfilledAt: string | null;
  productSlug: string | null;
  sku: string | null;
  consentPolicyVersion: string;
  locale: "ar" | "en";
  consentEvidence: { action: string; source: string };
};

type LifecycleSummary = {
  metrics: {
    total: number;
    active: number;
    unsubscribed: number;
    fulfilled: number;
    newsletterActive: number;
    backInStockActive: number;
  };
  recent: LifecycleRecord[];
};

const statusLabels: Record<LifecycleStatus, string> = {
  subscribed: "Active",
  unsubscribed: "Unsubscribed",
  fulfilled: "Fulfilled",
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

async function readApiError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "تعذر تحميل ملخص lifecycle المحمي.";
  } catch {
    return "تعذر تحميل ملخص lifecycle المحمي.";
  }
}

export function OpsLifecycleConsentSurface() {
  const [summary, setSummary] = useState<LifecycleSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/ops/lifecycle?limit=50", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response));
        return (await response.json()) as { lifecycle: LifecycleSummary };
      })
      .then(({ lifecycle }) => {
        setSummary(lifecycle);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setSummary(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل ملخص lifecycle المحمي.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const filteredRecords = useMemo(
    () =>
      (summary?.recent ?? []).filter(
        (record) =>
          (statusFilter === "all" || record.status === statusFilter) &&
          (kindFilter === "all" || record.kind === kindFilter),
      ),
    [kindFilter, statusFilter, summary],
  );

  function reload() {
    setIsLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }

  return (
    <section className={styles.section} aria-labelledby="ops-lifecycle-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Lifecycle + consent</p>
          <h2 id="ops-lifecycle-title">موافقات قابلة للمراجعة، دون كشف البريد الكامل.</h2>
          <p>
            نظرة تشغيلية على اشتراكات newsletter وطلبات العودة للمخزون، مع حالة
            الموافقة ونسخة السياسة ودليل الإجراء.
          </p>
        </div>
        <button
          type="button"
          className={styles.reloadButton}
          onClick={reload}
          disabled={isLoading}
        >
          {isLoading ? "جارٍ التحديث..." : "تحديث البيانات"}
        </button>
      </div>

      <div className={styles.metrics} aria-live="polite" aria-busy={isLoading}>
        <article><span>Total</span><strong>{summary?.metrics.total ?? "—"}</strong><small>كل سجلات lifecycle</small></article>
        <article><span>Active</span><strong>{summary?.metrics.active ?? "—"}</strong><small>{summary ? `${summary.metrics.newsletterActive} newsletter · ${summary.metrics.backInStockActive} back-in-stock` : "موافقات نشطة"}</small></article>
        <article><span>Unsubscribed</span><strong>{summary?.metrics.unsubscribed ?? "—"}</strong><small>موافقات تم سحبها</small></article>
        <article><span>Fulfilled</span><strong>{summary?.metrics.fulfilled ?? "—"}</strong><small>طلبات مخزون تم تنفيذها</small></article>
      </div>

      <div className={styles.controls}>
        <label>
          <span>نوع lifecycle</span>
          <select value={kindFilter} onChange={(event) => setKindFilter(event.currentTarget.value as KindFilter)}>
            <option value="all">الكل</option>
            <option value="newsletter">Newsletter</option>
            <option value="back_in_stock">Back in stock</option>
          </select>
        </label>
        <label>
          <span>حالة الموافقة</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.currentTarget.value as StatusFilter)}>
            <option value="all">كل الحالات</option>
            <option value="subscribed">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="fulfilled">Fulfilled</option>
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
        <div className={styles.state} role="status" aria-live="polite">جارٍ تحميل سجل الموافقات المحمي...</div>
      ) : summary && filteredRecords.length > 0 ? (
        <div className={styles.records}>
          {filteredRecords.map((record) => (
            <article key={record.id} className={styles.record}>
              <div className={styles.recordHead}>
                <div>
                  <span>{record.kind === "newsletter" ? "Newsletter" : "Back in stock"}</span>
                  <h3>{record.contactHint}</h3>
                </div>
                <strong data-status={record.status}>{statusLabels[record.status]}</strong>
              </div>
              <dl>
                <div><dt>Source</dt><dd>{record.source}</dd></div>
                <div><dt>Locale</dt><dd>{record.locale.toUpperCase()}</dd></div>
                <div><dt>Policy</dt><dd>{record.consentPolicyVersion}</dd></div>
                <div><dt>Consent action</dt><dd>{record.consentEvidence.action}</dd></div>
                <div><dt>Evidence source</dt><dd>{record.consentEvidence.source}</dd></div>
                <div><dt>Consent captured</dt><dd>{formatTimestamp(record.consentGrantedAt)}</dd></div>
                <div><dt>Withdrawn</dt><dd>{formatTimestamp(record.consentWithdrawnAt)}</dd></div>
                <div><dt>Fulfilled</dt><dd>{formatTimestamp(record.fulfilledAt)}</dd></div>
                {record.productSlug ? <div><dt>Product</dt><dd>{record.productSlug}</dd></div> : null}
                {record.sku ? <div><dt>SKU</dt><dd>{record.sku}</dd></div> : null}
              </dl>
              <small>آخر تحديث: {formatTimestamp(record.updatedAt)}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.state}>لا توجد سجلات lifecycle تطابق الفلاتر الحالية.</div>
      )}
    </section>
  );
}
