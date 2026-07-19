"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { OpsNav } from "@/components/ops-nav";
import { OpsStructuredContentEditor } from "@/components/ops-structured-content-editor";
import { useClientPagination, PaginationControls } from "@/components/ops-pagination-controls";
import type { MediaAsset } from "@/lib/media-authority";
import type {
  HomeAuthorityContent,
  ShellAuthorityContent,
  SiteContentDocument,
  SiteContentRevision,
} from "@/lib/site-content-authority";
import styles from "./order-flow.module.css";
import contentStyles from "./ops-content-authority.module.css";

type RevisionSummary = Omit<SiteContentRevision, "content">;
type Workspace = {
  content: SiteContentDocument;
  latestVersion: number;
  publishedVersion: number | null;
  revisions: RevisionSummary[];
};
type LocaleKey = "ar" | "en";
type EditorSection = "identity" | "shell" | "trust" | "editorial" | "home";
const trustSupportRoutes = ["about", "contact", "faq", "terms", "verification", "privacy", "shipping", "returns", "authenticity"] as const;
type TrustSupportKey = (typeof trustSupportRoutes)[number];

function cloneContent(content: SiteContentDocument) {
  return JSON.parse(JSON.stringify(content)) as SiteContentDocument;
}

function Field({ label, value, onChange, multiline = false, dir }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  dir?: "rtl" | "ltr";
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {multiline ? (
        <textarea className={styles.textArea} dir={dir} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={styles.textInput} dir={dir} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

export function OpsContentSurface() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [content, setContent] = useState<SiteContentDocument | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [locale, setLocale] = useState<LocaleKey>("ar");
  const [editorSection, setEditorSection] = useState<EditorSection>("editorial");
  const [trustSupportKey, setTrustSupportKey] = useState<TrustSupportKey>("about");
  const [changeSummary, setChangeSummary] = useState("");
  const [approvalRef, setApprovalRef] = useState("");
  const [status, setStatus] = useState("جارٍ تحميل سلطة المحتوى…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAltAr, setUploadAltAr] = useState("");
  const [uploadAltEn, setUploadAltEn] = useState("");
  const [rightsEvidenceRef, setRightsEvidenceRef] = useState("");

  const load = useCallback(async () => {
    const [contentResponse, mediaResponse] = await Promise.all([
      fetch("/api/ops/content", { cache: "no-store" }),
      fetch("/api/ops/media", { cache: "no-store" }),
    ]);
    const contentBody = await contentResponse.json() as Workspace & { error?: string };
    const mediaBody = await mediaResponse.json() as { assets?: MediaAsset[]; error?: string };
    if (!contentResponse.ok || !contentBody.content) throw new Error(contentBody.error ?? "تعذر تحميل سلطة المحتوى.");
    if (!mediaResponse.ok || !mediaBody.assets) throw new Error(mediaBody.error ?? "تعذر تحميل مكتبة الوسائط.");
    setWorkspace(contentBody);
    setContent(cloneContent(contentBody.content));
    setAssets(mediaBody.assets);
    setStatus(`آخر نسخة محفوظة: ${contentBody.latestVersion || "النسخة الأساسية"} · المنشورة: ${contentBody.publishedVersion ?? "لا توجد"}`);
  }, []);

  useEffect(() => {
    load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "تعذر تحميل المحتوى."));
  }, [load]);

  function updateIdentity(field: keyof SiteContentDocument["identity"], value: string) {
    setContent((current) => current ? { ...current, identity: { ...current.identity, [field]: value } } : current);
  }

  function updateSeo(field: "homeTitle" | "homeDescription", value: string) {
    setContent((current) => current ? {
      ...current,
      seo: { ...current.seo, [locale]: { ...current.seo[locale], [field]: value } },
    } : current);
  }

  function updateShellField(field: keyof Omit<ShellAuthorityContent, "nav" | "policies" | "support" | "shopLinks" | "serviceStrip">, value: string) {
    setContent((current) => current ? {
      ...current,
      shell: { ...current.shell, [locale]: { ...current.shell[locale], [field]: value } },
    } : current);
  }

  function updateShellLink(section: "nav" | "policies" | "support" | "shopLinks", index: number, field: 0 | 1, value: string) {
    setContent((current) => {
      if (!current) return current;
      const links = current.shell[locale][section].map((link, itemIndex) => {
        if (itemIndex !== index) return link;
        const next: [string, string] = [...link];
        next[field] = value;
        return next;
      });
      return { ...current, shell: { ...current.shell, [locale]: { ...current.shell[locale], [section]: links } } };
    });
  }

  function updateServiceStrip(index: number, field: 1 | 2, value: string) {
    setContent((current) => {
      if (!current) return current;
      const serviceStrip = current.shell[locale].serviceStrip.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next: [string, string, string] = [...item];
        next[field] = value;
        return next;
      });
      return { ...current, shell: { ...current.shell, [locale]: { ...current.shell[locale], serviceStrip } } };
    });
  }

  function updateTrustSupportField(field: "eyebrow" | "title" | "summary" | "status", value: string) {
    setContent((current) => current ? {
      ...current,
      trustSupport: {
        ...current.trustSupport,
        [locale]: {
          ...current.trustSupport[locale],
          [trustSupportKey]: { ...current.trustSupport[locale][trustSupportKey], [field]: value },
        },
      },
    } : current);
  }

  function updateTrustSection(index: number, field: "title" | "body" | "points", value: string) {
    setContent((current) => {
      if (!current) return current;
      const record = current.trustSupport[locale][trustSupportKey];
      const sections = record.sections.map((section, itemIndex) => itemIndex === index ? {
        ...section,
        [field]: field === "points" ? value.split("\n").map((item) => item.trim()).filter(Boolean) : value,
      } : section);
      return { ...current, trustSupport: { ...current.trustSupport, [locale]: { ...current.trustSupport[locale], [trustSupportKey]: { ...record, sections } } } };
    });
  }

  function updateTrustFaq(index: number, field: 0 | 1, value: string) {
    setContent((current) => {
      if (!current) return current;
      const record = current.trustSupport[locale][trustSupportKey];
      const faqs = record.faqs.map((faq, itemIndex) => {
        if (itemIndex !== index) return faq;
        const next: [string, string] = [...faq];
        next[field] = value;
        return next;
      });
      return { ...current, trustSupport: { ...current.trustSupport, [locale]: { ...current.trustSupport[locale], [trustSupportKey]: { ...record, faqs } } } };
    });
  }

  function updateHomeSection<K extends keyof HomeAuthorityContent>(
    section: K,
    field: keyof HomeAuthorityContent[K],
    value: string | null,
  ) {
    setContent((current) => current ? {
      ...current,
      home: {
        ...current.home,
        [locale]: {
          ...current.home[locale],
          [section]: { ...current.home[locale][section], [field]: value },
        },
      },
    } : current);
  }

  function updateRoutineStep(index: number, fieldIndex: number, value: string) {
    setContent((current) => {
      if (!current) return current;
      const steps = current.home[locale].routine.steps.map((step, stepIndex) => {
        if (stepIndex !== index) return step;
        const next = [...step] as [string, string, string];
        next[fieldIndex] = value;
        return next;
      });
      return {
        ...current,
        home: {
          ...current.home,
          [locale]: { ...current.home[locale], routine: { ...current.home[locale].routine, steps } },
        },
      };
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!content || !workspace) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ops/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, expectedVersion: workspace.latestVersion, changeSummary }),
      });
      const body = await response.json() as { workspace?: Workspace; error?: string; issues?: string[] };
      if (!response.ok || !body.workspace) throw new Error([body.error, ...(body.issues ?? [])].filter(Boolean).join(" ") || "فشل حفظ النسخة.");
      setWorkspace(body.workspace);
      setContent(cloneContent(body.workspace.content));
      setChangeSummary("");
      setStatus(`تم حفظ النسخة ${body.workspace.latestVersion} كمسودة غير منشورة.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "فشل حفظ النسخة.");
    } finally {
      setBusy(false);
    }
  }

  async function publish(revision: RevisionSummary, rollback = false) {
    if (!approvalRef.trim()) {
      setError("مرجع الموافقة مطلوب قبل النشر أو الرجوع.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ops/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: rollback ? "rollback" : "publish", revisionId: revision.id, approvalRef }),
      });
      const body = await response.json() as { workspace?: Workspace; error?: string; issues?: string[] };
      if (!response.ok || !body.workspace) throw new Error([body.error, ...(body.issues ?? [])].filter(Boolean).join(" ") || "فشل النشر.");
      setWorkspace(body.workspace);
      setContent(cloneContent(body.workspace.content));
      setStatus(`${rollback ? "تم الرجوع" : "تم النشر"} إلى النسخة ${revision.version}.`);
      setApprovalRef("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "فشل النشر.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!uploadFile) return setError("اختاري صورة أولًا.");
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", uploadFile);
      form.set("altAr", uploadAltAr);
      form.set("altEn", uploadAltEn);
      form.set("rightsEvidenceRef", rightsEvidenceRef);
      const response = await fetch("/api/ops/media", { method: "POST", body: form });
      const body = await response.json() as { asset?: MediaAsset; error?: string };
      if (!response.ok || !body.asset) throw new Error(body.error ?? "فشل رفع الصورة.");
      setUploadFile(null);
      setStatus("تم رفع الصورة بأمان، وتنتظر الاعتماد قبل استخدامها.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "فشل رفع الصورة.");
    } finally {
      setBusy(false);
    }
  }

  async function approve(asset: MediaAsset) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ops/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", assetId: asset.id }),
      });
      const body = await response.json() as { asset?: MediaAsset; error?: string };
      if (!response.ok || !body.asset) throw new Error(body.error ?? "فشل اعتماد الصورة.");
      await load();
      setStatus("تم اعتماد الصورة وأصبحت قابلة للاستخدام في الصفحة الرئيسية.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "فشل اعتماد الصورة.");
    } finally {
      setBusy(false);
    }
  }

  const allRevisions = useMemo(() => workspace?.revisions ?? [], [workspace?.revisions]);
  const { pagination, paginatedItems, goToPage, changePageSize } =
    useClientPagination(allRevisions);

  if (!content || !workspace) {
    return <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsContent}`}><OpsNav activeHref="/ops/content" /><section className={styles.hero}><h1>سلطة محتوى الموقع</h1><p>{error || status}</p></section></div>;
  }

  const copy = content.home[locale];
  const trustRecord = content.trustSupport[locale][trustSupportKey];
  const approvedAssets = assets.filter((asset) => asset.status === "approved");
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsContent}`}>
      <OpsNav activeHref="/ops/content" />
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>SITE CONTENT AUTHORITY</p><h1>تحكم فعلي، نشر محكوم، ورجوع بلا فقد بيانات.</h1><p className={styles.summary}>الهوية وSEO ومحتوى الصفحة الرئيسية مرتبطون مباشرة بالنسخة المنشورة. الحفظ وحده لا يغيّر الموقع العام.</p></div>
        <div className={styles.heroAside}><div className={styles.metricCard}><p>الإصدار المنشور</p><strong>{workspace.publishedVersion ?? "—"}</strong><span>{status}</span></div><div className={styles.noticeCard}><p className={styles.eyebrow}>Protection</p><h2>Manager publish · immutable history</h2><p>كل صورة تحتاج حقوقًا موثقة واعتمادًا قبل ربطها بالموقع.</p></div></div>
      </section>

      {error ? <div className={styles.inlineError} role="alert">{error}</div> : null}

      <section className={styles.layout}>
        <div className={styles.summaryList}>
          <form className={styles.mainCard} onSubmit={save}>
            <div className={contentStyles.editorHeader}><div><p className={styles.sectionTitle}>المحرر</p><h2>الهوية وHomepage</h2></div><div className={styles.filterChipRow}>{(["ar", "en"] as const).map((item) => <button key={item} type="button" className={`${styles.filterChip} ${locale === item ? styles.filterChipActive : ""}`} onClick={() => setLocale(item)}>{item === "ar" ? "العربية" : "English"}</button>)}</div></div>

            <nav className={styles.filterChipRow} aria-label="Content editor sections">
              {([[
                "identity", "Identity & SEO",
              ], ["shell", "Navigation & footer"], ["trust", "Trust pages"], ["editorial", "Editorial surfaces"], ["home", "Homepage"]] as const).map(([section, label]) => <button key={section} type="button" className={`${styles.filterChip} ${editorSection === section ? styles.filterChipActive : ""}`} aria-pressed={editorSection === section} onClick={() => setEditorSection(section)}>{label}</button>)}
            </nav>

            {editorSection === "identity" ? <div className={styles.formGrid}>
              <Field label="اسم الموقع" value={content.identity.siteName} onChange={(value) => updateIdentity("siteName", value)} />
              <Field label={locale === "ar" ? "سطر العلامة العربي" : "English tagline"} value={locale === "ar" ? content.identity.taglineAr : content.identity.taglineEn} onChange={(value) => updateIdentity(locale === "ar" ? "taglineAr" : "taglineEn", value)} dir={dir} />
              <Field label="SEO title" value={content.seo[locale].homeTitle} onChange={(value) => updateSeo("homeTitle", value)} dir={dir} />
              <Field label="SEO description" value={content.seo[locale].homeDescription} onChange={(value) => updateSeo("homeDescription", value)} multiline dir={dir} />
            </div> : null}

            {editorSection === "shell" ? <div className={contentStyles.sectionBlock}><h3>Header, footer, and global navigation</h3><div className={styles.formGrid}>
              {(["market", "tagline", "trackOrder", "navLabel", "account", "aboutLabel", "policyTitle", "supportTitle", "shopTitle", "serviceStripTitle", "footerTagline"] as const).map((field) => <Field key={field} label={field} value={content.shell[locale][field]} onChange={(value) => updateShellField(field, value)} dir={dir} />)}
              <Field label="Footer body" value={content.shell[locale].footerBody} onChange={(value) => updateShellField("footerBody", value)} multiline dir={dir} />
              <Field label="Footer status" value={content.shell[locale].footerStatus} onChange={(value) => updateShellField("footerStatus", value)} multiline dir={dir} />
            </div>
            {(["nav", "shopLinks", "policies", "support"] as const).map((section) => <div className={contentStyles.linkEditor} key={section}><strong>{section}</strong>{content.shell[locale][section].map(([href, label], index) => <div className={contentStyles.linkEditorRow} key={`${section}-${index}`}><Field label="Path" value={href} onChange={(value) => updateShellLink(section, index, 0, value)} dir="ltr" /><Field label="Label" value={label} onChange={(value) => updateShellLink(section, index, 1, value)} dir={dir} /></div>)}</div>)}
            <div className={contentStyles.linkEditor}><strong>Trust service strip</strong>{content.shell[locale].serviceStrip.map(([icon, title, serviceStatus], index) => <div className={contentStyles.linkEditorRow} key={icon}><Field label={`${icon} title`} value={title} onChange={(value) => updateServiceStrip(index, 1, value)} dir={dir} /><Field label="Status" value={serviceStatus} onChange={(value) => updateServiceStrip(index, 2, value)} dir={dir} /></div>)}</div>
            </div> : null}

            {editorSection === "trust" ? <div className={contentStyles.sectionBlock}><div className={contentStyles.editorHeader}><h3>Trust, policy, and support pages</h3><label className={styles.field}><span className={styles.fieldLabel}>Page</span><select className={styles.textInput} value={trustSupportKey} onChange={(event) => setTrustSupportKey(event.target.value as TrustSupportKey)}>{trustSupportRoutes.map((slug) => <option key={slug} value={slug}>{slug}</option>)}</select></label></div><div className={styles.formGrid}>
              <Field label="Eyebrow" value={trustRecord.eyebrow} onChange={(value) => updateTrustSupportField("eyebrow", value)} />
              <Field label="Title" value={trustRecord.title} onChange={(value) => updateTrustSupportField("title", value)} multiline dir={dir} />
              <Field label="Summary" value={trustRecord.summary} onChange={(value) => updateTrustSupportField("summary", value)} multiline dir={dir} />
              <Field label="Publication / accuracy status" value={trustRecord.status} onChange={(value) => updateTrustSupportField("status", value)} multiline dir={dir} />
            </div>{trustRecord.sections.map((section, index) => <div className={contentStyles.recordBlock} key={`section-${index}`}><strong>Section {index + 1}</strong><Field label="Title" value={section.title} onChange={(value) => updateTrustSection(index, "title", value)} dir={dir} /><Field label="Body" value={section.body} onChange={(value) => updateTrustSection(index, "body", value)} multiline dir={dir} /><Field label="Points · one per line" value={(section.points ?? []).join("\n")} onChange={(value) => updateTrustSection(index, "points", value)} multiline dir={dir} /></div>)}{trustRecord.faqs.map(([question, answer], index) => <div className={contentStyles.recordBlock} key={`faq-${index}`}><strong>FAQ {index + 1}</strong><Field label="Question" value={question} onChange={(value) => updateTrustFaq(index, 0, value)} dir={dir} /><Field label="Answer" value={answer} onChange={(value) => updateTrustFaq(index, 1, value)} multiline dir={dir} /></div>)}</div> : null}

            {editorSection === "editorial" ? <div className={contentStyles.sectionBlock}>
              <h3>Journal, Discovery, Shop, Categories, and Bento</h3>
              <p>محرر منظم لكل الأسطح التحريرية المتبقية. المفاتيح البنيوية مقفلة، والصور تُختار من مكتبة الوسائط المعتمدة.</p>
              <OpsStructuredContentEditor
                content={content.editorial}
                locale={locale}
                assets={assets}
                onChange={(editorial) => setContent((current) => current ? { ...current, editorial } : current)}
              />
            </div> : null}

            {editorSection === "home" ? <>
            <div className={contentStyles.sectionBlock}><h3>Hero</h3><div className={styles.formGrid}>
              <Field label="Eyebrow" value={copy.hero.eyebrow} onChange={(value) => updateHomeSection("hero", "eyebrow", value)} />
              <Field label="العنوان" value={copy.hero.title} onChange={(value) => updateHomeSection("hero", "title", value)} dir={dir} />
              <Field label="النص" value={copy.hero.body} onChange={(value) => updateHomeSection("hero", "body", value)} multiline dir={dir} />
              <Field label="حالة الصورة / الإفصاح" value={copy.hero.assetStatus} onChange={(value) => updateHomeSection("hero", "assetStatus", value)} multiline dir={dir} />
              <Field label="CTA أساسي" value={copy.hero.primary} onChange={(value) => updateHomeSection("hero", "primary", value)} dir={dir} />
              <Field label="CTA ثانوي" value={copy.hero.secondary} onChange={(value) => updateHomeSection("hero", "secondary", value)} dir={dir} />
              {(["desktopMediaAssetId", "mobileMediaAssetId"] as const).map((field) => <label className={styles.field} key={field}><span className={styles.fieldLabel}>{field === "desktopMediaAssetId" ? "صورة Desktop المعتمدة" : "صورة Mobile المعتمدة"}</span><select className={styles.textInput} value={copy.hero[field] ?? ""} onChange={(event) => updateHomeSection("hero", field, event.target.value || null)}><option value="">استخدام الصورة الأساسية</option>{approvedAssets.map((asset) => <option key={asset.id} value={asset.id}>{locale === "ar" ? asset.altAr : asset.altEn} · {asset.width}×{asset.height}</option>)}</select></label>)}
            </div></div>

            <div className={contentStyles.sectionBlock}><h3>Product truth</h3><div className={styles.formGrid}>
              <Field label="Eyebrow" value={copy.productTruth.eyebrow} onChange={(value) => updateHomeSection("productTruth", "eyebrow", value)} />
              <Field label="العنوان" value={copy.productTruth.title} onChange={(value) => updateHomeSection("productTruth", "title", value)} dir={dir} />
              <Field label="النص" value={copy.productTruth.body} onChange={(value) => updateHomeSection("productTruth", "body", value)} multiline dir={dir} />
              <Field label="بوابة النشر" value={copy.productTruth.gate} onChange={(value) => updateHomeSection("productTruth", "gate", value)} multiline dir={dir} />
            </div></div>

            <div className={contentStyles.sectionBlock}><h3>Routine</h3><div className={styles.formGrid}>
              <Field label="العنوان" value={copy.routine.title} onChange={(value) => updateHomeSection("routine", "title", value)} dir={dir} />
              <Field label="CTA" value={copy.routine.cta} onChange={(value) => updateHomeSection("routine", "cta", value)} dir={dir} />
              <Field label="النص" value={copy.routine.body} onChange={(value) => updateHomeSection("routine", "body", value)} multiline dir={dir} />
            </div>{copy.routine.steps.map((step, index) => <div className={contentStyles.stepGrid} key={index}><Field label="رقم" value={step[0]} onChange={(value) => updateRoutineStep(index, 0, value)} /><Field label="عنوان الخطوة" value={step[1]} onChange={(value) => updateRoutineStep(index, 1, value)} dir={dir} /><Field label="وصف الخطوة" value={step[2]} onChange={(value) => updateRoutineStep(index, 2, value)} dir={dir} /></div>)}</div>

            {(["gifting", "story", "edit"] as const).map((section) => <div className={contentStyles.sectionBlock} key={section}><h3>{section}</h3><div className={styles.formGrid}><Field label="العنوان" value={copy[section].title} onChange={(value) => updateHomeSection(section, "title", value)} dir={dir} /><Field label="CTA" value={copy[section].cta} onChange={(value) => updateHomeSection(section, "cta", value)} dir={dir} /><Field label="النص" value={copy[section].body} onChange={(value) => updateHomeSection(section, "body", value)} multiline dir={dir} /></div></div>)}
            </> : null}

            <div className={contentStyles.publishBar}><Field label="ملخص التغيير (إلزامي)" value={changeSummary} onChange={setChangeSummary} /><button className={styles.primaryButton} disabled={busy} type="submit">{busy ? "جارٍ التنفيذ…" : "حفظ نسخة جديدة"}</button></div>
          </form>

          <article className={styles.mainCard}><p className={styles.sectionTitle}>سجل الإصدارات</p><h2>نشر أو Rollback</h2><Field label="مرجع الموافقة / التذكرة" value={approvalRef} onChange={setApprovalRef} /><div className={styles.ordersGrid}>{paginatedItems.map((revision) => <article className={styles.lineItem} key={revision.id}><div className={styles.lineHead}><div><h3>نسخة {revision.version}</h3><p className={styles.lineMeta}>{revision.changeSummary} · {new Date(revision.createdAt).toLocaleString("ar-SA")}</p></div><div className={styles.badgeRow}>{revision.isPublished ? <span>منشورة الآن</span> : <span>محفوظة</span>}</div></div><div className={styles.cardActions}>{!revision.isPublished ? <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => publish(revision, workspace.publishedVersion !== null && revision.version < workspace.publishedVersion!)}>{workspace.publishedVersion !== null && revision.version < workspace.publishedVersion ? "Rollback لهذه النسخة" : "نشر هذه النسخة"}</button> : null}</div></article>)}
          <PaginationControls
            pagination={pagination}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          /></div></article>
        </div>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Media Authority</p><h2>رفع واعتماد صور الموقع</h2>
          <form className={styles.cardActions} onSubmit={upload}><input className={styles.textInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /><Field label="Alt عربي" value={uploadAltAr} onChange={setUploadAltAr} /><Field label="Alt English" value={uploadAltEn} onChange={setUploadAltEn} /><Field label="مرجع حقوق الاستخدام" value={rightsEvidenceRef} onChange={setRightsEvidenceRef} /><button className={styles.primaryButton} disabled={busy} type="submit">رفع آمن</button></form>
          <div className={contentStyles.mediaGrid}>{assets.map((asset) => <article className={contentStyles.mediaCard} key={asset.id}>{asset.status === "approved" ? <Image src={asset.publicUrl} alt={asset.altAr} width={asset.width} height={asset.height} sizes="(max-width: 900px) 100vw, 28vw" /> : <div className={contentStyles.pendingMedia}>المعاينة تظهر بعد الاعتماد</div>}<strong>{asset.altAr}</strong><span>{asset.width}×{asset.height} · {asset.status}</span>{asset.status === "pending" ? <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => approve(asset)}>اعتماد الصورة</button> : null}</article>)}</div>
        </aside>
      </section>
    </div>
  );
}
