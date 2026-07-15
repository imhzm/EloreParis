"use client";

import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import styles from "./order-flow.module.css";
import catalogStyles from "./catalog-authority-ops.module.css";

const CATALOG_ENDPOINT = "/api/ops/catalog/authority";
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

type CatalogReadiness = {
  ready: boolean;
  importId: string | null;
  productCount: number;
  variantCount: number;
  blockers: string[];
};

type CatalogImportSummary = {
  id: string;
  sourceRef: string;
  sourceHash: string;
  status: "validated" | "active" | "retired";
  productCount: number;
  variantCount: number;
  createdBy: string;
  createdAt: string;
  activatedAt: string | null;
  readiness: CatalogReadiness;
};

type CatalogSnapshot = {
  readiness: CatalogReadiness;
  imports: CatalogImportSummary[];
};

type CatalogApiError = {
  error?: string;
  code?: string;
  issues?: string[];
};

const statusLabels: Record<CatalogImportSummary["status"], string> = {
  validated: "بانتظار النشر",
  active: "منشور الآن",
  retired: "نسخة سابقة",
};

const blockerLabels: Record<string, string> = {
  active_catalog_publication_missing: "لا توجد نسخة كتالوج منشورة حتى الآن.",
  catalog_empty: "الاستيراد لا يحتوي على منتجات.",
  catalog_publication_approval_missing: "اعتماد نشر الكتالوج غير موجود.",
  catalog_pricing_approval_missing: "اعتماد الأسعار العام غير موجود.",
  shipping_methods_incomplete: "بيانات الشحن أو أدلتها غير مكتملة.",
  quarantined_product_present: "الاستيراد يحتوي على منتج محجوز للمراجعة.",
  quarantined_sku_present: "الاستيراد يحتوي على SKU محجوز للمراجعة.",
};

function formatBlocker(blocker: string) {
  if (blockerLabels[blocker]) return blockerLabels[blocker];
  const [code, subject] = blocker.split(":", 2);
  const labels: Record<string, string> = {
    product_not_approved: "المنتج غير معتمد",
    product_compliance_incomplete: "ملف مطابقة المنتج غير مكتمل",
    product_media_incomplete: "وسائط المنتج أو حقوقها غير مكتملة",
    product_return_policy_missing: "سياسة إرجاع المنتج غير معتمدة",
    product_claims_unapproved: "ادعاءات المنتج تحتاج اعتمادًا أو دليلًا",
    product_data_approval_missing: "اعتماد بيانات المنتج غير موجود",
    product_media_approval_missing: "اعتماد وسائط المنتج غير موجود",
    product_claims_approval_missing: "اعتماد ادعاءات المنتج غير موجود",
    product_compliance_approval_missing: "اعتماد مطابقة المنتج غير موجود",
    variant_not_approved: "نسخة المنتج غير معتمدة",
    variant_price_invalid: "سعر نسخة المنتج غير صالح",
    variant_price_approval_missing: "اعتماد سعر نسخة المنتج غير موجود",
  };
  return `${labels[code] ?? blocker}${subject ? `: ${subject}` : ""}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & CatalogApiError;
  if (!response.ok) {
    const details = body.issues?.length ? `\n${body.issues.map(formatBlocker).join("\n")}` : "";
    throw new Error(`${body.error ?? "تعذر إتمام طلب الكتالوج."}${details}`);
  }
  return body;
}

export function CatalogOpsSurface() {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [operation, setOperation] = useState<"import" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [publishCandidate, setPublishCandidate] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    const response = await fetch(CATALOG_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store",
    });
    setSnapshot(await readApiResponse<CatalogSnapshot>(response));
  }, []);

  useEffect(() => {
    void loadSnapshot()
      .then(() => setError(null))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل حقيقة الكتالوج الحالية.");
      })
      .finally(() => setIsLoading(false));
  }, [loadSnapshot]);

  const importPreview = useMemo(() => {
    if (!jsonInput.trim()) return null;
    try {
      const value = JSON.parse(jsonInput) as Record<string, unknown>;
      return {
        validJson: true,
        sourceRef: typeof value.sourceRef === "string" ? value.sourceRef : "غير محدد",
        products: Array.isArray(value.products) ? value.products.length : 0,
        approvals: Array.isArray(value.approvals) ? value.approvals.length : 0,
      };
    } catch {
      return { validJson: false, sourceRef: "—", products: 0, approvals: 0 };
    }
  }, [jsonInput]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setError(null);
    setNotice(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setSelectedFile("");
      setError("حجم ملف الكتالوج يتجاوز الحد المسموح وهو 2 MB.");
      event.currentTarget.value = "";
      return;
    }
    try {
      setJsonInput(await file.text());
      setSelectedFile(file.name);
    } catch {
      setError("تعذر قراءة الملف المختار. تأكد أنه ملف JSON نصي صالح.");
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!jsonInput.trim()) {
      setError("اختر ملف JSON أو الصق بيانات الكتالوج أولًا.");
      return;
    }
    if (!importPreview?.validJson) {
      setError("النص الحالي ليس JSON صالحًا.");
      return;
    }

    setOperation("import");
    try {
      const response = await fetch(CATALOG_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: jsonInput,
      });
      const result = await readApiResponse<{ importId: string; readiness: CatalogReadiness }>(response);
      await loadSnapshot();
      setNotice(
        result.readiness.ready
          ? "تم استيراد النسخة والتحقق منها. أصبحت جاهزة لخطوة النشر اليدوية."
          : `تم حفظ الاستيراد، لكنه يحتاج معالجة ${result.readiness.blockers.length} مانع قبل النشر.`,
      );
      setJsonInput("");
      setSelectedFile("");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "تعذر استيراد الكتالوج.");
    } finally {
      setOperation(null);
    }
  }

  async function handlePublish(importId: string) {
    if (publishCandidate !== importId) {
      setPublishCandidate(importId);
      setNotice("راجع النسخة ثم اضغط تأكيد النشر. سيتم استبدال الكتالوج النشط بهذه النسخة.");
      return;
    }

    setOperation("publish");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(CATALOG_ENDPOINT, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", importId }),
      });
      await readApiResponse(response);
      await loadSnapshot();
      setPublishCandidate(null);
      setNotice("تم نشر نسخة الكتالوج وتحديث الحقيقة النشطة بنجاح.");
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "تعذر نشر الكتالوج.");
    } finally {
      setOperation(null);
    }
  }

  const activeReadiness = snapshot?.readiness;
  const readyDrafts = snapshot?.imports.filter((item) => item.status === "validated" && item.readiness.ready).length ?? 0;

  return (
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsCatalog} ${catalogStyles.catalogPage}`}>
      <OpsNav activeHref="/ops/catalog" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Catalog Authority</p>
          <h1>حقيقة واحدة للمنتج، السعر والمخزون.</h1>
          <p className={styles.summary}>
            استورد ملف الكتالوج المعتمد، راجع بوابات المطابقة والأدلة، ثم انشر نسخة محددة فقط عندما تصبح جاهزة بالكامل.
          </p>
        </div>
        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>حالة الكتالوج العام</p>
            <strong>{isLoading ? "..." : activeReadiness?.ready ? "جاهز" : "موقوف"}</strong>
            <span>{activeReadiness?.ready ? "النسخة النشطة اجتازت كل بوابات النشر." : "لن يستخدم المتجر بيانات غير مكتملة أو غير معتمدة."}</span>
          </div>
          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>نشر آمن</p>
            <h2>الاستيراد لا يعني النشر</h2>
            <p>كل ملف يُحفظ أولًا كنسخة متحقق منها. النشر يحتاج جاهزية كاملة وتأكيدًا يدويًا منفصلًا.</p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid} aria-label="ملخص الكتالوج">
        <article className={styles.statusSummaryCard}><p className={styles.sectionTitle}>المنتجات النشطة</p><strong>{activeReadiness?.productCount ?? 0}</strong><span>من مصدر الكتالوج المنشور.</span></article>
        <article className={styles.statusSummaryCard}><p className={styles.sectionTitle}>النسخ النشطة</p><strong>{activeReadiness?.variantCount ?? 0}</strong><span>SKU متاح داخل authority الحالية.</span></article>
        <article className={styles.statusSummaryCard}><p className={styles.sectionTitle}>جاهز للنشر</p><strong>{readyDrafts}</strong><span>استيرادات اجتازت كل بوابات الأدلة.</span></article>
        <article className={styles.statusSummaryCard}><p className={styles.sectionTitle}>موانع الإطلاق</p><strong>{activeReadiness?.blockers.length ?? 0}</strong><span>موانع تمنع الكتالوج العام من العمل.</span></article>
      </section>

      <section className={styles.layout}>
        <div className={catalogStyles.mainColumn}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>استيراد مضبوط</p>
            <h2>إضافة نسخة كتالوج جديدة</h2>
            <p>الحد الأقصى 2 MB. يتحقق الخادم من البنية، الأسعار، المخزون، SFDA/eCosma، حقوق الصور، الادعاءات والاعتمادات.</p>

            <form className={catalogStyles.importForm} onSubmit={handleImport}>
              <label className={catalogStyles.filePicker}>
                <span className={styles.fieldLabel}>ملف JSON</span>
                <input type="file" accept="application/json,.json" onChange={handleFile} disabled={operation !== null} />
                <strong>{selectedFile || "اختر ملف الكتالوج"}</strong>
                <small>JSON فقط · بحد أقصى 2 MB</small>
              </label>
              <label className={styles.fieldFull}>
                <span className={styles.fieldLabel}>أو الصق JSON</span>
                <textarea className={`${styles.textArea} ${catalogStyles.jsonEditor}`} value={jsonInput} onChange={(event) => { setJsonInput(event.currentTarget.value); setSelectedFile(""); }} placeholder={'{\n  "sourceRef": "approved-source-...",\n  "currency": "SAR",\n  "products": []\n}'} spellCheck={false} disabled={operation !== null} />
              </label>

              {importPreview ? (
                <div className={importPreview.validJson ? styles.inlineNotice : styles.inlineError} aria-live="polite">
                  {importPreview.validJson ? `JSON صالح مبدئيًا · المصدر: ${importPreview.sourceRef} · المنتجات: ${importPreview.products} · الاعتمادات: ${importPreview.approvals}` : "JSON غير صالح. صحح التنسيق قبل الإرسال."}
                </div>
              ) : null}

              <button className={styles.primaryButton} type="submit" disabled={operation !== null || !importPreview?.validJson}>
                {operation === "import" ? "جارٍ التحقق والاستيراد..." : "تحقق واحفظ كنسخة جديدة"}
              </button>
            </form>
          </article>

          <article className={styles.mainCard}>
            <div className={catalogStyles.sectionHeading}>
              <div><p className={styles.sectionTitle}>سجل النسخ</p><h2>الاستيرادات والنسخة المنشورة</h2></div>
              <button className={styles.secondaryButton} type="button" onClick={() => void loadSnapshot().catch((refreshError: unknown) => setError(refreshError instanceof Error ? refreshError.message : "تعذر التحديث."))} disabled={operation !== null}>تحديث</button>
            </div>

            <div className={catalogStyles.importList}>
              {isLoading ? <p>جارٍ تحميل سجل الكتالوج...</p> : snapshot?.imports.length ? snapshot.imports.map((item) => (
                <article key={item.id} className={catalogStyles.importCard}>
                  <div className={catalogStyles.importHeader}>
                    <div><span className={`${catalogStyles.statusBadge} ${catalogStyles[item.status]}`}>{statusLabels[item.status]}</span><h3>{item.sourceRef}</h3><code>{item.id}</code></div>
                    <div className={catalogStyles.counts}><strong>{item.productCount}</strong><span>منتج</span><strong>{item.variantCount}</strong><span>SKU</span></div>
                  </div>
                  <dl className={catalogStyles.metadata}>
                    <div><dt>تاريخ الاستيراد</dt><dd>{formatDate(item.createdAt)}</dd></div>
                    <div><dt>تاريخ النشر</dt><dd>{formatDate(item.activatedAt)}</dd></div>
                    <div><dt>البصمة</dt><dd><code>{item.sourceHash.slice(0, 16)}…</code></dd></div>
                    <div><dt>المشغّل</dt><dd>{item.createdBy}</dd></div>
                  </dl>

                  {item.readiness.blockers.length ? (
                    <details className={catalogStyles.blockers}>
                      <summary>{item.readiness.blockers.length} مانع نشر</summary>
                      <ul>{item.readiness.blockers.map((blocker) => <li key={blocker}>{formatBlocker(blocker)}</li>)}</ul>
                    </details>
                  ) : <div className={styles.inlineNotice}>كل بوابات الأدلة مكتملة وجاهزة.</div>}

                  {item.status === "validated" ? (
                    <div className={styles.cardActions}>
                      <button className={publishCandidate === item.id ? styles.primaryButton : styles.secondaryButton} type="button" onClick={() => void handlePublish(item.id)} disabled={operation !== null || !item.readiness.ready}>
                        {operation === "publish" && publishCandidate === item.id ? "جارٍ النشر..." : publishCandidate === item.id ? "تأكيد النشر الآن" : "نشر هذه النسخة"}
                      </button>
                      {publishCandidate === item.id ? <button className={styles.secondaryButton} type="button" onClick={() => { setPublishCandidate(null); setNotice(null); }} disabled={operation !== null}>إلغاء</button> : null}
                    </div>
                  ) : null}
                </article>
              )) : <div className={styles.inlineNotice}>لا توجد استيرادات بعد. ابدأ بملف الكتالوج المعتمد.</div>}
            </div>
          </article>
        </div>

        <aside className={styles.summaryList}>
          {error ? <div className={styles.inlineError} role="alert" style={{ whiteSpace: "pre-line" }}>{error}</div> : null}
          {notice ? <div className={styles.inlineNotice} role="status">{notice}</div> : null}
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>بوابات الحقيقة</p>
            <h2>{activeReadiness?.ready ? "الكتالوج النشط مكتمل" : "النشر العام متوقف بأمان"}</h2>
            <div className={styles.summaryList}>
              {activeReadiness?.blockers.length ? activeReadiness.blockers.map((blocker) => <div key={blocker} className={catalogStyles.blockerItem}>{formatBlocker(blocker)}</div>) : <div className={styles.inlineNotice}>لا توجد موانع على النسخة النشطة.</div>}
            </div>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>العقد المطلوب</p>
            <h2>ما الذي يجب أن يحتويه الملف؟</h2>
            <ul className={catalogStyles.requirements}>
              <li>مرجع مصدر وتوقيت توليد واضحان.</li>
              <li>ضريبة SAR شاملة مع دليل اعتماد.</li>
              <li>مخزون وموقع تنفيذ لكل SKU.</li>
              <li>بيانات مطابقة ومستندات SFDA/eCosma.</li>
              <li>حقوق الصور وأدلة الادعاءات وسياسة الإرجاع.</li>
              <li>اعتماد مستقل للبيانات والوسائط والسعر والنشر.</li>
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
