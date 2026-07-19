"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { MediaAsset } from "@/lib/media-authority";
import type { EditorialAuthorityContent } from "@/lib/site-editorial-authority";
import styles from "./ops-structured-content-editor.module.css";

type LocaleKey = "ar" | "en";
type PathPart = string | number;
type Family = "discovery-record" | "discovery-interface" | "journal-article" | "journal-interface" | "shop" | "category" | "category-shared" | "bento";

const discoveryKinds = ["concern", "routine", "ingredient"] as const;
const categorySlugs = ["perfumes", "skincare", "makeup", "haircare", "bodycare", "tools", "beauty-sets"] as const;

function getAtPath(root: unknown, path: PathPart[]) {
  let value = root;
  for (const part of path) value = (value as Record<string | number, unknown>)[part];
  return value;
}

function setAtPath(root: EditorialAuthorityContent, path: PathPart[], value: unknown) {
  const next = structuredClone(root);
  let cursor = next as unknown as Record<string | number, unknown>;
  for (let index = 0; index < path.length - 1; index += 1) {
    cursor = cursor[path[index]] as Record<string | number, unknown>;
  }
  cursor[path[path.length - 1]] = value;
  return next;
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function arrayFieldLabel(path: PathPart[], index: number) {
  const parent = String(path[path.length - 2] ?? "");
  const labels: Record<string, string[]> = {
    faqs: ["Question", "Answer"],
    chapters: ["Title", "Body"],
    principles: ["Title", "Body"],
    related: ["Title", "Body", "Path"],
    routes: ["Number / title", "Title / body", "Body / path", "Path", "Analytics key"],
    collections: ["Title", "English label", "Path", "Image", "Analytics key"],
    serviceStrip: ["Icon", "Title", "Status"],
  };
  return labels[parent]?.[index] ?? `Value ${index + 1}`;
}

function isStructural(path: PathPart[]) {
  const key = String(path[path.length - 1] ?? "");
  return key === "slug" || key === "id" || key === "kind";
}

function isImageField(path: PathPart[], value: string) {
  const key = String(path[path.length - 1] ?? "").toLowerCase();
  return key.includes("image") || value.startsWith("/elore-assets/") || value.startsWith("/api/media/");
}

function shouldUseTextArea(path: PathPart[], value: string) {
  const key = String(path[path.length - 1] ?? "").toLowerCase();
  return value.length > 90 || ["body", "summary", "description", "answer", "notice", "disclaimer", "quote", "intro", "status"].some((token) => key.includes(token));
}

function StructuredFields({ value, path, locale, assets, onValue }: {
  value: unknown;
  path: PathPart[];
  locale: LocaleKey;
  assets: MediaAsset[];
  onValue: (path: PathPart[], value: unknown) => void;
}) {
  if (typeof value === "string") {
    const labelPart = path[path.length - 1];
    const label = typeof labelPart === "number" ? arrayFieldLabel(path, labelPart) : humanize(labelPart);
    if (isStructural(path)) return <div className={styles.lockedField}><span>{label}</span><code>{value}</code><small>Structural key · locked</small></div>;
    if (isImageField(path, value)) {
      const approved = assets.filter((asset) => asset.status === "approved");
      return <label className={styles.field}><span>{label}</span><select value={value} onChange={(event) => onValue(path, event.target.value)}><option value={value}>Current · {value}</option>{approved.filter((asset) => asset.publicUrl !== value).map((asset) => <option key={asset.id} value={asset.publicUrl}>{locale === "ar" ? asset.altAr : asset.altEn} · {asset.width}×{asset.height}</option>)}</select><span className={styles.imagePreview}>{value.startsWith("/api/media/") || value.startsWith("/elore-assets/") ? <Image src={value} alt="" width={320} height={180} sizes="280px" /> : null}</span></label>;
    }
    return <label className={styles.field}><span>{label}</span>{shouldUseTextArea(path, value) ? <textarea dir={locale === "ar" ? "rtl" : "ltr"} value={value} onChange={(event) => onValue(path, event.target.value)} /> : <input dir={locale === "ar" ? "rtl" : "ltr"} value={value} onChange={(event) => onValue(path, event.target.value)} />}</label>;
  }
  if (typeof value === "number") {
    return <label className={styles.field}><span>{humanize(String(path[path.length - 1]))}</span><input type="number" value={value} onChange={(event) => onValue(path, Number(event.target.value))} /></label>;
  }
  if (typeof value === "boolean") {
    return <label className={styles.checkField}><input type="checkbox" checked={value} onChange={(event) => onValue(path, event.target.checked)} /><span>{humanize(String(path[path.length - 1]))}</span></label>;
  }
  if (Array.isArray(value)) {
    return <div className={styles.arrayGroup}>{value.map((item, index) => <details className={styles.arrayItem} key={index}><summary>Item {index + 1}</summary><StructuredFields value={item} path={[...path, index]} locale={locale} assets={assets} onValue={onValue} /></details>)}</div>;
  }
  if (value && typeof value === "object") {
    return <div className={styles.objectGrid}>{Object.entries(value).map(([key, child]) => {
      const collapsible = Array.isArray(child) || (child !== null && typeof child === "object");
      return collapsible
        ? <details className={styles.objectFieldset} key={key}><summary>{humanize(key)}</summary><StructuredFields value={child} path={[...path, key]} locale={locale} assets={assets} onValue={onValue} /></details>
        : <fieldset className={styles.objectFieldset} key={key}><legend>{humanize(key)}</legend><StructuredFields value={child} path={[...path, key]} locale={locale} assets={assets} onValue={onValue} /></fieldset>;
    })}</div>;
  }
  return null;
}

export function OpsStructuredContentEditor({ content, locale, assets, onChange }: {
  content: EditorialAuthorityContent;
  locale: LocaleKey;
  assets: MediaAsset[];
  onChange: (content: EditorialAuthorityContent) => void;
}) {
  const [family, setFamily] = useState<Family>("journal-article");
  const [discoveryKind, setDiscoveryKind] = useState<(typeof discoveryKinds)[number]>("concern");
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const journalSlugs = useMemo(() => Object.keys(content.journalContent[locale]), [content.journalContent, locale]);
  const [journalSlug, setJournalSlug] = useState(journalSlugs[0]);
  const [interfaceArea, setInterfaceArea] = useState("hub");
  const [categorySlug, setCategorySlug] = useState<(typeof categorySlugs)[number]>("skincare");

  const target = useMemo((): { title: string; path: PathPart[] } => {
    if (family === "discovery-record") {
      const records = content.discoveryRecords[locale][discoveryKind];
      const index = Math.min(discoveryIndex, records.length - 1);
      return { title: `${discoveryKind} · ${records[index]?.title ?? "Record"}`, path: ["discoveryRecords", locale, discoveryKind, index] };
    }
    if (family === "discovery-interface") {
      if (interfaceArea === "visual") return { title: `${discoveryKind} visual`, path: ["discoveryVisuals", discoveryKind] };
      if (interfaceArea === "detail") return { title: "Discovery detail interface", path: ["discoveryDetailCopy", locale] };
      if (interfaceArea === "labels") return { title: "Discovery route labels", path: ["discoveryDetailCopy", "labels", locale] };
      return { title: `${discoveryKind} hub interface`, path: ["discoveryHubCopy", locale, discoveryKind] };
    }
    if (family === "journal-article") return { title: `Journal · ${journalSlug}`, path: ["journalContent", locale, journalSlug] };
    if (family === "journal-interface") {
      if (interfaceArea === "hero-image") return { title: "Journal hero image", path: ["journalHeroImage"] };
      if (interfaceArea === "interface") return { title: "Journal interface", path: ["journalInterfaceCopy", locale] };
      return { title: `Journal ${interfaceArea}`, path: ["journalCopy", locale, interfaceArea] };
    }
    if (family === "shop") return { title: "Shop hub", path: ["shop", locale] };
    if (family === "category") return { title: `Category · ${categorySlug}`, path: ["categoryCopy", locale, categorySlug] };
    if (family === "category-shared") return { title: "Category shared interface", path: ["categorySharedCopy", locale] };
    return { title: "Homepage Bento system", path: ["bento", locale] };
  }, [categorySlug, content.discoveryRecords, discoveryIndex, discoveryKind, family, interfaceArea, journalSlug, locale]);

  const selectedValue = getAtPath(content, target.path);
  const discoveryRecords = content.discoveryRecords[locale][discoveryKind];

  return <div className={styles.editor}>
    <div className={styles.toolbar}>
      <label><span>Content family</span><select value={family} onChange={(event) => {
        const nextFamily = event.target.value as Family;
        setFamily(nextFamily);
        if (nextFamily === "journal-interface" || nextFamily === "discovery-interface") setInterfaceArea("hub");
      }}><option value="journal-article">Journal articles</option><option value="journal-interface">Journal interface</option><option value="discovery-record">Discovery records</option><option value="discovery-interface">Discovery interface</option><option value="shop">Shop hub</option><option value="category">Category pages</option><option value="category-shared">Category shared interface</option><option value="bento">Homepage Bento</option></select></label>
      {(family === "discovery-record" || family === "discovery-interface") ? <label><span>Discovery family</span><select value={discoveryKind} onChange={(event) => { setDiscoveryKind(event.target.value as typeof discoveryKind); setDiscoveryIndex(0); }}>{discoveryKinds.map((kind) => <option key={kind} value={kind}>{humanize(kind)}</option>)}</select></label> : null}
      {family === "discovery-record" ? <label><span>Record</span><select value={discoveryIndex} onChange={(event) => setDiscoveryIndex(Number(event.target.value))}>{discoveryRecords.map((record, index) => <option value={index} key={record.slug}>{record.title.replace("\n", " ")}</option>)}</select></label> : null}
      {family === "journal-article" ? <label><span>Article</span><select value={journalSlug} onChange={(event) => setJournalSlug(event.target.value)}>{journalSlugs.map((slug) => <option key={slug} value={slug}>{content.journalContent[locale][slug as keyof typeof content.journalContent[typeof locale]].title.replace("\n", " ")}</option>)}</select></label> : null}
      {family === "journal-interface" ? <label><span>Surface</span><select value={interfaceArea} onChange={(event) => setInterfaceArea(event.target.value)}><option value="hub">Hub</option><option value="detail">Detail labels</option><option value="interface">Presentation interface</option><option value="hero-image">Hero image</option></select></label> : null}
      {family === "discovery-interface" ? <label><span>Surface</span><select value={interfaceArea} onChange={(event) => setInterfaceArea(event.target.value)}><option value="hub">Selected hub</option><option value="detail">Detail interface</option><option value="labels">Route labels</option><option value="visual">Selected hub visual</option></select></label> : null}
      {family === "category" ? <label><span>Category</span><select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value as typeof categorySlug)}>{categorySlugs.map((slug) => <option key={slug} value={slug}>{slug}</option>)}</select></label> : null}
    </div>
    <div className={styles.targetHeader}><div><small>Structured editor</small><h4>{target.title}</h4></div><span>{locale === "ar" ? "العربية" : "English"}</span></div>
    <StructuredFields value={selectedValue} path={target.path} locale={locale} assets={assets} onValue={(path, value) => onChange(setAtPath(content, path, value))} />
  </div>;
}
