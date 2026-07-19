import "server-only";

import { getAuthorityDatabase } from "@/lib/authority-database";
import { bentoCopy, type BentoCard } from "@/lib/bento-content";
import { categoryCopy, categorySharedCopy, type CategorySlug } from "@/lib/category-content";
import {
  discoveryDetailCopy,
  discoveryHubCopy,
  discoveryRecords,
  type DiscoveryKind,
  type DiscoveryRecord,
} from "@/lib/discovery-content";
import type { Locale } from "@/lib/i18n";
import {
  journalContent,
  journalCopy,
  journalInterfaceCopy,
  type JournalRecord,
} from "@/lib/journal-content";
import type { JournalSlug } from "@/lib/journal-routing";
import { shopCopy } from "@/lib/shop-content";

type DeepWiden<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends readonly [unknown, ...unknown[]]
    ? { -readonly [K in keyof T]: DeepWiden<T[K]> }
    : T extends ReadonlyArray<infer U>
      ? DeepWiden<U>[]
      : T extends object
        ? { -readonly [K in keyof T]: DeepWiden<T[K]> }
        : T;

export type ShopAuthorityLocale = {
  metadata: DeepWiden<(typeof shopCopy)["ar"]["metadata"]>;
  hero: DeepWiden<(typeof shopCopy)["ar"]["hero"]>;
  categories: DeepWiden<(typeof shopCopy)["ar"]["categories"]>;
  catalog: Omit<DeepWiden<(typeof shopCopy)["ar"]["catalog"]>, "count">;
  editorial: DeepWiden<(typeof shopCopy)["ar"]["editorial"]>;
  collections: Array<[string, string, string, string, string]>;
  routes: Array<[string, string, string, string, string]>;
};

export type BentoAuthorityLocale = {
  sectionLabel: string;
  conceptNotice: string;
  openLabel: string;
  cards: BentoCard[];
};

export type EditorialAuthorityContent = {
  discoveryVisuals: Record<DiscoveryKind, string>;
  discoveryHubCopy: DeepWiden<typeof discoveryHubCopy>;
  discoveryDetailCopy: DeepWiden<typeof discoveryDetailCopy>;
  discoveryRecords: Record<Locale, Record<DiscoveryKind, DiscoveryRecord[]>>;
  journalCopy: DeepWiden<typeof journalCopy>;
  journalInterfaceCopy: DeepWiden<typeof journalInterfaceCopy>;
  journalContent: Record<Locale, Record<JournalSlug, JournalRecord>>;
  journalHeroImage: string;
  shop: Record<Locale, ShopAuthorityLocale>;
  categorySharedCopy: DeepWiden<typeof categorySharedCopy>;
  categoryCopy: Record<Locale, Record<CategorySlug, {
    title: string;
    eyebrow: string;
    description: string;
    image: string;
    imageAlt: string;
    principles: Array<[string, string]>;
    routes: Array<[string, string, string]>;
  }>>;
  bento: Record<Locale, BentoAuthorityLocale>;
};

export class EditorialAuthorityValidationError extends Error {
  constructor(public issues: string[]) {
    super("Editorial content validation failed.");
    this.name = "EditorialAuthorityValidationError";
  }
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getDefaultEditorialAuthorityContent(): EditorialAuthorityContent {
  return {
    discoveryVisuals: {
      concern: "/elore-assets/editorial-skin-light-concept-1122w.avif",
      routine: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif",
      ingredient: "/elore-assets/ingredient-botanical-lab-concept-1536x1024.avif",
    },
    discoveryHubCopy: jsonClone(discoveryHubCopy) as EditorialAuthorityContent["discoveryHubCopy"],
    discoveryDetailCopy: jsonClone(discoveryDetailCopy) as EditorialAuthorityContent["discoveryDetailCopy"],
    discoveryRecords: jsonClone(discoveryRecords),
    journalCopy: jsonClone(journalCopy) as EditorialAuthorityContent["journalCopy"],
    journalInterfaceCopy: jsonClone(journalInterfaceCopy) as EditorialAuthorityContent["journalInterfaceCopy"],
    journalContent: jsonClone(journalContent),
    journalHeroImage: "/elore-assets/editorial-skin-light-concept-1122w.avif",
    shop: jsonClone(shopCopy) as unknown as EditorialAuthorityContent["shop"],
    categorySharedCopy: jsonClone(categorySharedCopy) as EditorialAuthorityContent["categorySharedCopy"],
    categoryCopy: jsonClone(categoryCopy),
    bento: jsonClone(bentoCopy) as unknown as EditorialAuthorityContent["bento"],
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeLocalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !/[\u0000-\u001f]/.test(value);
}

function validateTemplate(
  value: unknown,
  template: unknown,
  path: string,
  issues: string[],
  referencedMedia: Set<string>,
): unknown {
  if (typeof template === "string") {
    if (typeof value !== "string") {
      issues.push(`${path} must be text.`);
      return template;
    }
    const normalized = value.trim();
    if (normalized.length < 1 || normalized.length > 4000) {
      issues.push(`${path} must contain 1-4000 characters.`);
    }
    if (template.startsWith("/") && !safeLocalPath(normalized)) {
      issues.push(`${path} must be a safe local path.`);
    }
    if (/\.(slug|id|kind)$/.test(path) && normalized !== template) {
      issues.push(`${path} is structural and cannot be changed.`);
    }
    if (template.startsWith("/elore-assets/") && normalized.startsWith("/api/media/")) {
      const assetId = decodeURIComponent(normalized.slice("/api/media/".length));
      if (!/^media_[A-Za-z0-9-]{16,160}$/.test(assetId)) issues.push(`${path} has an invalid media asset id.`);
      else referencedMedia.add(assetId);
    } else if (template.startsWith("/elore-assets/") && !normalized.startsWith("/elore-assets/")) {
      issues.push(`${path} must reference an approved media asset or an existing ÉLORÉ asset.`);
    }
    return normalized;
  }
  if (typeof template === "number") {
    if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1_000_000) {
      issues.push(`${path} must be a bounded number.`);
      return template;
    }
    return value;
  }
  if (typeof template === "boolean") {
    if (typeof value !== "boolean") {
      issues.push(`${path} must be true or false.`);
      return template;
    }
    return value;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(value)) {
      issues.push(`${path} must be an array.`);
      return jsonClone(template);
    }
    if (value.length !== template.length) {
      issues.push(`${path} must contain exactly ${template.length} items.`);
    }
    return template.map((item, index) => validateTemplate(value[index], item, `${path}[${index}]`, issues, referencedMedia));
  }
  if (isObject(template)) {
    if (!isObject(value)) {
      issues.push(`${path} must be an object.`);
      return jsonClone(template);
    }
    const allowedKeys = Object.keys(template);
    const extraKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key));
    if (extraKeys.length > 0) issues.push(`${path} contains unsupported fields: ${extraKeys.join(", ")}.`);
    return Object.fromEntries(allowedKeys.map((key) => [
      key,
      validateTemplate(value[key], template[key], `${path}.${key}`, issues, referencedMedia),
    ]));
  }
  issues.push(`${path} uses an unsupported template value.`);
  return template;
}

function assertApprovedMedia(assetIds: Set<string>, issues: string[]) {
  if (assetIds.size === 0) return;
  const statement = getAuthorityDatabase().prepare("SELECT status FROM authority_media_assets WHERE id = ?");
  for (const assetId of assetIds) {
    const row = statement.get(assetId) as { status: string } | undefined;
    if (row?.status !== "approved") issues.push(`Media asset ${assetId} must exist and be approved.`);
  }
}

export function validateEditorialAuthorityContent(value: unknown): EditorialAuthorityContent {
  const issues: string[] = [];
  const referencedMedia = new Set<string>();
  const normalized = validateTemplate(
    value,
    getDefaultEditorialAuthorityContent(),
    "content.editorial",
    issues,
    referencedMedia,
  ) as EditorialAuthorityContent;
  assertApprovedMedia(referencedMedia, issues);
  if (issues.length > 0) throw new EditorialAuthorityValidationError(issues.slice(0, 100));
  return normalized;
}

export function mergeStoredEditorialAuthorityContent(value: unknown) {
  if (!value) return getDefaultEditorialAuthorityContent();
  try {
    return validateEditorialAuthorityContent(value);
  } catch {
    return getDefaultEditorialAuthorityContent();
  }
}
