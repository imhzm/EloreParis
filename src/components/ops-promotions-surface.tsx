"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClientPagination, PaginationControls } from "@/components/ops-pagination-controls";
import { DownloadCsvButton } from "@/components/ops-download-csv";
import type { MediaAsset } from "@/lib/media-authority";
import type { PromotionRecord } from "@/lib/promotion-authority";
import styles from "./ops-promotions.module.css";
import mediaStyles from "./ops-promotions-media.module.css";

type PromotionForm = {
  id?: string;
  expectedVersion?: number;
  mode: "automatic" | "coupon";
  code: string;
  name: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  state: "draft" | "active" | "paused" | "archived";
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  maxDiscountSar: string;
  minSubtotalSar: string;
  usageLimitTotal: string;
  usageLimitPerCustomer: string;
  startsAt: string;
  endsAt: string;
  priority: string;
  appliesToAll: boolean;
  targets: string;
  publicBadge: string;
  publicPath: string;
  mediaAssetId: string;
};

function localDateTime(date = new Date()) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

const emptyForm = (): PromotionForm => ({
  mode: "automatic",
  code: "",
  name: "",
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  state: "draft",
  discountType: "percentage",
  discountValue: "10",
  maxDiscountSar: "",
  minSubtotalSar: "0",
  usageLimitTotal: "",
  usageLimitPerCustomer: "",
  startsAt: localDateTime(),
  endsAt: "",
  priority: "0",
  appliesToAll: true,
  targets: "",
  publicBadge: "",
  publicPath: "",
  mediaAssetId: "",
});

function sarToHalalas(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

function optionalInteger(value: string) {
  return value.trim() ? Number(value) : null;
}

function parseTargets(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator < 1) throw new Error(`Invalid target: ${line}`);
      return {
        type: line.slice(0, separator).trim(),
        key: line.slice(separator + 1).trim(),
      };
    });
}

function formFromPromotion(promotion: PromotionRecord): PromotionForm {
  return {
    id: promotion.id,
    expectedVersion: promotion.version,
    mode: promotion.mode,
    code: promotion.code ?? "",
    name: promotion.name,
    titleAr: promotion.titleAr,
    titleEn: promotion.titleEn,
    descriptionAr: promotion.descriptionAr,
    descriptionEn: promotion.descriptionEn,
    state: promotion.state,
    discountType: promotion.discountType,
    discountValue: String(
      promotion.discountType === "percentage"
        ? (promotion.percentageBps ?? 0) / 100
        : (promotion.fixedHalalas ?? 0) / 100,
    ),
    maxDiscountSar: promotion.maxDiscountHalalas === null ? "" : String(promotion.maxDiscountHalalas / 100),
    minSubtotalSar: String(promotion.minSubtotalHalalas / 100),
    usageLimitTotal: promotion.usageLimitTotal?.toString() ?? "",
    usageLimitPerCustomer: promotion.usageLimitPerCustomer?.toString() ?? "",
    startsAt: localDateTime(new Date(promotion.startsAt)),
    endsAt: promotion.endsAt ? localDateTime(new Date(promotion.endsAt)) : "",
    priority: String(promotion.priority),
    appliesToAll: promotion.appliesToAll,
    targets: promotion.targets.map((target) => `${target.type}:${target.key}`).join("\n"),
    publicBadge: promotion.publicBadge ?? "",
    publicPath: promotion.publicPath ?? "",
    mediaAssetId: promotion.mediaAssetId ?? "",
  };
}

function promotionPayload(form: PromotionForm) {
  const discountValue = Number(form.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error("Discount value must be greater than zero.");
  }
  return {
    id: form.id,
    expectedVersion: form.expectedVersion,
    mode: form.mode,
    code: form.mode === "coupon" ? form.code : null,
    name: form.name,
    titleAr: form.titleAr,
    titleEn: form.titleEn,
    descriptionAr: form.descriptionAr,
    descriptionEn: form.descriptionEn,
    state: form.state,
    discountType: form.discountType,
    percentageBps: form.discountType === "percentage" ? Math.round(discountValue * 100) : null,
    fixedHalalas: form.discountType === "fixed_amount" ? sarToHalalas(form.discountValue) : null,
    maxDiscountHalalas: sarToHalalas(form.maxDiscountSar),
    minSubtotalHalalas: sarToHalalas(form.minSubtotalSar),
    usageLimitTotal: optionalInteger(form.usageLimitTotal),
    usageLimitPerCustomer: optionalInteger(form.usageLimitPerCustomer),
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    priority: Number(form.priority),
    appliesToAll: form.appliesToAll,
    targets: form.appliesToAll ? [] : parseTargets(form.targets),
    mediaAssetId: form.mediaAssetId || null,
    publicBadge: form.publicBadge || null,
    publicPath: form.publicPath || null,
  };
}

export function OpsPromotionsSurface() {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [form, setForm] = useState<PromotionForm>(emptyForm);
  const [status, setStatus] = useState("Loading promotion authority…");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAltAr, setUploadAltAr] = useState("");
  const [uploadAltEn, setUploadAltEn] = useState("");
  const [rightsEvidenceRef, setRightsEvidenceRef] = useState("");

  const load = useCallback(async () => {
    const result = await fetch("/api/ops/promotions", { cache: "no-store" });
    const body = await result.json() as { promotions?: PromotionRecord[]; error?: string };
    if (!result.ok || !body.promotions) throw new Error(body.error ?? "Promotion authority failed to load.");
    setPromotions(body.promotions);
    const mediaResult = await fetch("/api/ops/media", { cache: "no-store" });
    const mediaBody = await mediaResult.json() as { assets?: MediaAsset[]; error?: string };
    if (!mediaResult.ok || !mediaBody.assets) throw new Error(mediaBody.error ?? "Media authority failed to load.");
    setAssets(mediaBody.assets);
    setStatus(body.promotions.length ? `${body.promotions.length} promotion records loaded.` : "No promotions yet.");
  }, []);

  useEffect(() => {
    void load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Load failed."));
  }, [load]);

  const activeCount = useMemo(
    () => promotions.filter((promotion) => promotion.state === "active").length,
    [promotions],
  );

  const filteredPromotions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return promotions;
    return promotions.filter(
      (promotion) =>
        promotion.name.toLowerCase().includes(normalizedQuery) ||
        promotion.code?.toLowerCase().includes(normalizedQuery) ||
        promotion.titleAr.includes(searchQuery.trim()) ||
        promotion.titleEn.toLowerCase().includes(normalizedQuery),
    );
  }, [promotions, searchQuery]);

  const { pagination, paginatedItems, goToPage, changePageSize } =
    useClientPagination(filteredPromotions);

  const update = <Key extends keyof PromotionForm>(key: Key, value: PromotionForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus("Validating and saving…");
    try {
      const result = await fetch("/api/ops/promotions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promotionPayload(form)),
      });
      const body = await result.json() as { promotion?: PromotionRecord; error?: string; issues?: string[] };
      if (!result.ok || !body.promotion) {
        throw new Error([body.error, ...(body.issues ?? [])].filter(Boolean).join(" · ") || "Save failed.");
      }
      setForm(formFromPromotion(body.promotion));
      await load();
      setStatus(`Saved ${body.promotion.name} at version ${body.promotion.version}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const upload = async () => {
    if (!uploadFile) return setStatus("Choose an image before uploading.");
    setSaving(true);
    setStatus("Decoding, validating, and optimizing image…");
    try {
      const body = new FormData();
      body.set("file", uploadFile);
      body.set("altAr", uploadAltAr);
      body.set("altEn", uploadAltEn);
      body.set("rightsEvidenceRef", rightsEvidenceRef);
      const result = await fetch("/api/ops/media", { method: "POST", body });
      const payload = await result.json() as { asset?: MediaAsset; error?: string };
      if (!result.ok || !payload.asset) throw new Error(payload.error ?? "Image upload failed.");
      setUploadFile(null);
      await load();
      setStatus(`Image ${payload.asset.id} is ${payload.asset.status}; approve it before publishing.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setSaving(false);
    }
  };

  const approveAndSelect = async (asset: MediaAsset) => {
    setSaving(true);
    try {
      const selected = asset.status === "approved"
        ? asset
        : await fetch("/api/ops/media", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve", assetId: asset.id }),
          }).then(async (result) => {
            const payload = await result.json() as { asset?: MediaAsset; error?: string };
            if (!result.ok || !payload.asset) throw new Error(payload.error ?? "Image approval failed.");
            return payload.asset;
          });
      update("mediaAssetId", selected.id);
      await load();
      setStatus(`Approved and selected ${selected.id}. Save the promotion to link it.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image approval failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div><span>PRICING AUTHORITY</span><h1>العروض والكوبونات</h1><p>قواعد تسعير محكومة، مؤرخة، قابلة للتدقيق، ومربوطة مباشرة بالـ Checkout.</p></div>
        <div className={styles.metrics}><strong>{promotions.length}</strong><span>إجمالي السجلات</span><strong>{activeCount}</strong><span>نشطة</span></div>
      </header>

      <div className={styles.workspace}>
        {error ? <div className={styles.bannerError} role="alert">{error}</div> : null}
        {status ? <div className={styles.bannerInfo} role="status">{status}</div> : null}

        <section className={styles.listPanel} aria-label="Promotion records">
          <div className={styles.panelHeader}>
            <h2>الحملات</h2>
            <div className={styles.panelActions}>
              <input
                className={styles.searchInput}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                placeholder="بحث بالاسم أو الكود…"
                aria-label="بحث في الحملات"
              />
              <DownloadCsvButton
                filename="elore-promotions.csv"
                rows={filteredPromotions.map((p) => ({
                  الاسم: p.name,
                  الحالة: p.state,
                  النوع: p.mode,
                  الكود: p.code ?? "",
                  العنوان_عربي: p.titleAr,
                  العنوان_English: p.titleEn,
                  الخصم: p.discountType,
                  النسبة_bps: p.percentageBps ?? "",
                  المبلغ_هللات: p.fixedHalalas ?? "",
                  مرات_الاستخدام: p.redemptionCount,
                  الحد_الأقصى: p.usageLimitTotal ?? "",
                  تاريخ_البدء: p.startsAt,
                  تاريخ_الانتهاء: p.endsAt ?? "",
                }))}
                label="CSV"
              />
              <button type="button" onClick={() => setForm(emptyForm())}>حملة جديدة</button>
            </div>
          </div>
          <div className={styles.records}>
            {paginatedItems.map((promotion) => (
              <button key={promotion.id} type="button" className={form.id === promotion.id ? styles.selectedRecord : styles.record} onClick={() => setForm(formFromPromotion(promotion))}>
                <span className={styles.state} data-state={promotion.state}>{promotion.state}</span>
                <strong>{promotion.name}</strong>
                <small>{promotion.mode === "coupon" ? promotion.code : "AUTOMATIC"} · v{promotion.version} · {promotion.redemptionCount} uses</small>
              </button>
            ))}
            {!promotions.length && <p className={styles.empty}>ابدأ بأول حملة من النموذج.</p>}
            {promotions.length > 0 ? (
              <PaginationControls
                pagination={pagination}
                onPageChange={goToPage}
                onPageSizeChange={changePageSize}
              />
            ) : null}
          </div>
        </section>

        <form className={styles.editor} onSubmit={save}>
          <div className={styles.panelHeader}><div><span>{form.id ? `VERSION ${form.expectedVersion}` : "NEW RECORD"}</span><h2>{form.id ? "تعديل الحملة" : "إنشاء حملة"}</h2></div><button type="submit" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ محكوم"}</button></div>
          <div className={styles.grid}>
            <label><span>الاسم الداخلي</span><input required value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
            <label><span>الحالة</span><select value={form.state} onChange={(event) => update("state", event.target.value as PromotionForm["state"])}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label>
            <label><span>النوع</span><select value={form.mode} onChange={(event) => update("mode", event.target.value as PromotionForm["mode"])}><option value="automatic">Automatic</option><option value="coupon">Coupon</option></select></label>
            <label><span>كود الكوبون</span><input disabled={form.mode !== "coupon"} required={form.mode === "coupon"} value={form.code} onChange={(event) => update("code", event.target.value.toUpperCase())} /></label>
            <label><span>العنوان العربي</span><input required dir="rtl" value={form.titleAr} onChange={(event) => update("titleAr", event.target.value)} /></label>
            <label><span>English title</span><input required value={form.titleEn} onChange={(event) => update("titleEn", event.target.value)} /></label>
            <label className={styles.wide}><span>الوصف العربي</span><textarea dir="rtl" value={form.descriptionAr} onChange={(event) => update("descriptionAr", event.target.value)} /></label>
            <label className={styles.wide}><span>English description</span><textarea value={form.descriptionEn} onChange={(event) => update("descriptionEn", event.target.value)} /></label>
            <label><span>طريقة الخصم</span><select value={form.discountType} onChange={(event) => update("discountType", event.target.value as PromotionForm["discountType"])}><option value="percentage">Percentage</option><option value="fixed_amount">Fixed SAR</option></select></label>
            <label><span>{form.discountType === "percentage" ? "النسبة %" : "القيمة SAR"}</span><input required min="0.01" step="0.01" type="number" value={form.discountValue} onChange={(event) => update("discountValue", event.target.value)} /></label>
            <label><span>أقصى خصم SAR</span><input min="0.01" step="0.01" type="number" value={form.maxDiscountSar} onChange={(event) => update("maxDiscountSar", event.target.value)} /></label>
            <label><span>حد الطلب الأدنى SAR</span><input required min="0" step="0.01" type="number" value={form.minSubtotalSar} onChange={(event) => update("minSubtotalSar", event.target.value)} /></label>
            <label><span>بداية التفعيل</span><input required type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)} /></label>
            <label><span>نهاية التفعيل</span><input type="datetime-local" value={form.endsAt} onChange={(event) => update("endsAt", event.target.value)} /></label>
            <label><span>إجمالي الاستخدام</span><input min="1" step="1" type="number" value={form.usageLimitTotal} onChange={(event) => update("usageLimitTotal", event.target.value)} /></label>
            <label><span>لكل عميل</span><input min="1" step="1" type="number" value={form.usageLimitPerCustomer} onChange={(event) => update("usageLimitPerCustomer", event.target.value)} /></label>
            <label><span>الأولوية</span><input min="-100000" max="100000" step="1" type="number" value={form.priority} onChange={(event) => update("priority", event.target.value)} /></label>
            <label className={styles.checkbox}><input type="checkbox" checked={form.appliesToAll} onChange={(event) => update("appliesToAll", event.target.checked)} /><span>ينطبق على كل المنتجات</span></label>
            {!form.appliesToAll && <label className={styles.wide}><span>Targets — سطر مثل product:slug أو sku:CODE</span><textarea required value={form.targets} onChange={(event) => update("targets", event.target.value)} /></label>}
            <label><span>الشارة العامة</span><input value={form.publicBadge} onChange={(event) => update("publicBadge", event.target.value)} /></label>
            <label><span>مسار CTA</span><input placeholder="/ar/shop" value={form.publicPath} onChange={(event) => update("publicPath", event.target.value)} /></label>
            <section className={mediaStyles.mediaAuthority}>
              <div><span>MEDIA AUTHORITY</span><h3>صورة الحملة</h3><p>رفع آمن، تحسين WebP، توثيق حقوق، واعتماد قبل النشر.</p></div>
              <div className={mediaStyles.mediaUpload}>
                <label><span>الصورة</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setUploadFile(event.currentTarget.files?.[0] ?? null)} /></label>
                <label><span>وصف عربي</span><input value={uploadAltAr} onChange={(event) => setUploadAltAr(event.target.value)} /></label>
                <label><span>English alt</span><input value={uploadAltEn} onChange={(event) => setUploadAltEn(event.target.value)} /></label>
                <label><span>مرجع حقوق الاستخدام</span><input value={rightsEvidenceRef} onChange={(event) => setRightsEvidenceRef(event.target.value)} /></label>
                <button type="button" onClick={upload} disabled={saving}>رفع وفحص الصورة</button>
              </div>
              <div className={mediaStyles.assetGrid}>
                {assets.map((asset) => (
                  <button key={asset.id} type="button" className={form.mediaAssetId === asset.id ? mediaStyles.selectedAsset : mediaStyles.asset} onClick={() => void approveAndSelect(asset)} disabled={saving}>
                    {asset.status === "approved" ? <Image src={asset.publicUrl} alt={asset.altEn} width={asset.width} height={asset.height} unoptimized /> : <span className={mediaStyles.pendingAsset}>Pending approval</span>}
                    <strong>{asset.width} × {asset.height}</strong>
                    <small>{asset.status} · {(asset.byteSize / 1024).toFixed(0)} KB</small>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <p className={styles.status} role="status">{status}</p>
        </form>
      </div>
    </main>
  );
}
