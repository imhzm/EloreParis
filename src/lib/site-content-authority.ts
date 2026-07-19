import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { getAuthorityDatabase, runAuthorityTransaction } from "@/lib/authority-database";
import { homeCopy, shellCopy, type Locale } from "@/lib/i18n";
import { defaultDescription, siteName, siteTagline } from "@/lib/site-content";
import type { DiscoveryKind } from "@/lib/discovery-content";
import type { JournalSlug } from "@/lib/journal-routing";
import type { CategorySlug } from "@/lib/category-content";
import {
  EditorialAuthorityValidationError,
  getDefaultEditorialAuthorityContent,
  mergeStoredEditorialAuthorityContent,
  validateEditorialAuthorityContent,
  type EditorialAuthorityContent,
} from "@/lib/site-editorial-authority";
import {
  supportContent,
  supportSlugs,
  trustContent,
  trustSlugs,
  type SupportSlug,
  type TrustSlug,
  type TrustSupportRecord,
} from "@/lib/trust-support-content";

export const SITE_CONTENT_DOCUMENT_KEY = "storefront-core";
export const SITE_CONTENT_SCHEMA_VERSION = 3;

type RoutineStep = [number: string, title: string, body: string];

export type HomeAuthorityContent = {
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
    assetStatus: string;
    desktopMediaAssetId: string | null;
    mobileMediaAssetId: string | null;
  };
  productTruth: { eyebrow: string; title: string; body: string; gate: string };
  routine: { title: string; body: string; cta: string; steps: RoutineStep[] };
  gifting: { title: string; body: string; cta: string };
  story: { title: string; body: string; cta: string };
  edit: { title: string; body: string; cta: string };
};

type NavigationLink = [href: string, label: string];
type ServiceStripItem = [icon: string, title: string, status: string];

export type ShellAuthorityContent = {
  skip: string;
  market: string;
  tagline: string;
  trackOrder: string;
  navLabel: string;
  account: string;
  footerBody: string;
  footerStatus: string;
  aboutLabel: string;
  policyTitle: string;
  supportTitle: string;
  footerTagline: string;
  serviceStripTitle: string;
  shopTitle: string;
  nav: NavigationLink[];
  policies: NavigationLink[];
  support: NavigationLink[];
  shopLinks: NavigationLink[];
  serviceStrip: ServiceStripItem[];
};

export type SiteContentDocument = {
  schemaVersion: 3;
  identity: {
    siteName: string;
    taglineAr: string;
    taglineEn: string;
  };
  seo: Record<Locale, { homeTitle: string; homeDescription: string }>;
  home: Record<Locale, HomeAuthorityContent>;
  shell: Record<Locale, ShellAuthorityContent>;
  trustSupport: Record<Locale, Record<TrustSlug | SupportSlug, TrustSupportRecord>>;
  editorial: EditorialAuthorityContent;
};

export type SiteContentRevision = {
  id: string;
  documentKey: string;
  version: number;
  schemaVersion: number;
  contentHash: string;
  content: SiteContentDocument;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
  isPublished: boolean;
  publishedAt: string | null;
  publishedBy: string | null;
  approvalRef: string | null;
};

type RevisionRow = {
  id: string;
  document_key: string;
  version: number;
  schema_version: number;
  content_hash: string;
  payload_json: string;
  change_summary: string;
  created_by: string;
  created_at: string;
  published_at: string | null;
  published_by: string | null;
  approval_ref: string | null;
};

export class SiteContentAuthorityError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
    public issues: string[] = [],
  ) {
    super(message);
    this.name = "SiteContentAuthorityError";
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultHome(locale: Locale): HomeAuthorityContent {
  const source = homeCopy[locale];
  return {
    hero: {
      ...clone(source.hero),
      desktopMediaAssetId: null,
      mobileMediaAssetId: null,
    },
    productTruth: {
      eyebrow: source.productTruth.eyebrow,
      title: source.productTruth.title,
      body: source.productTruth.body,
      gate: source.productTruth.gate,
    },
    routine: {
      title: source.routine.title,
      body: source.routine.body,
      cta: source.routine.cta,
      steps: source.routine.steps.map(([number, title, body]) => [number, title, body]),
    },
    gifting: clone(source.gifting),
    story: clone(source.story),
    edit: clone(source.edit),
  };
}

export function getDefaultSiteContent(): SiteContentDocument {
  return {
    schemaVersion: SITE_CONTENT_SCHEMA_VERSION,
    identity: {
      siteName,
      taglineAr: siteTagline,
      taglineEn: "Beauty, composed with intention",
    },
    seo: {
      ar: { homeTitle: `${siteName} | ${siteTagline}`, homeDescription: defaultDescription },
      en: {
        homeTitle: `${siteName} | Beauty, composed with intention`,
        homeDescription: "A premium Saudi beauty experience shaped by Parisian sensibility, verified product information, and intentional rituals.",
      },
    },
    home: { ar: defaultHome("ar"), en: defaultHome("en") },
    shell: { ar: defaultShell("ar"), en: defaultShell("en") },
    trustSupport: {
      ar: { ...clone(trustContent.ar), ...clone(supportContent.ar) },
      en: { ...clone(trustContent.en), ...clone(supportContent.en) },
    },
    editorial: getDefaultEditorialAuthorityContent(),
  };
}

function defaultShell(locale: Locale): ShellAuthorityContent {
  const source = shellCopy[locale];
  return {
    skip: source.skip,
    market: source.market,
    tagline: source.tagline,
    trackOrder: source.trackOrder,
    navLabel: source.navLabel,
    account: source.account,
    footerBody: source.footerBody,
    footerStatus: source.footerStatus,
    aboutLabel: source.aboutLabel,
    policyTitle: source.policyTitle,
    supportTitle: source.supportTitle,
    footerTagline: source.footerTagline,
    serviceStripTitle: source.serviceStripTitle,
    shopTitle: source.shopTitle,
    nav: source.nav.map(([href, label]) => [href, label]),
    policies: source.policies.map(([href, label]) => [href, label]),
    support: source.support.map(([href, label]) => [href, label]),
    shopLinks: source.shopLinks.map(([href, label]) => [href, label]),
    serviceStrip: source.serviceStrip.map(([icon, title, status]) => [icon, title, status]),
  };
}

function textValue(value: unknown, path: string, min: number, max: number, issues: string[]) {
  if (typeof value !== "string") {
    issues.push(`${path} must be text.`);
    return "";
  }
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    issues.push(`${path} must contain ${min}-${max} characters.`);
  }
  return normalized;
}

function requiredText(value: unknown, path: string, min: number, max: number) {
  const issues: string[] = [];
  const result = textValue(value, path, min, max, issues);
  if (issues.length > 0) {
    throw new SiteContentAuthorityError("site_content_invalid", issues[0], 400, issues);
  }
  return result;
}

function nullableAssetId(value: unknown, path: string, issues: string[]) {
  if (value === null || value === undefined || value === "") return null;
  const assetId = textValue(value, path, 8, 100, issues);
  if (!/^media_[A-Za-z0-9-]{16,160}$/.test(assetId)) issues.push(`${path} has an invalid asset id.`);
  return assetId;
}

function objectValue(value: unknown, path: string, issues: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    issues.push(`${path} must be an object.`);
    return {} as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
}

function validateHome(value: unknown, path: string, issues: string[]): HomeAuthorityContent {
  const home = objectValue(value, path, issues);
  const hero = objectValue(home.hero, `${path}.hero`, issues);
  const productTruth = objectValue(home.productTruth, `${path}.productTruth`, issues);
  const routine = objectValue(home.routine, `${path}.routine`, issues);
  const gifting = objectValue(home.gifting, `${path}.gifting`, issues);
  const story = objectValue(home.story, `${path}.story`, issues);
  const edit = objectValue(home.edit, `${path}.edit`, issues);
  const rawSteps = Array.isArray(routine.steps) ? routine.steps : [];
  if (rawSteps.length !== 3) issues.push(`${path}.routine.steps must contain exactly 3 steps.`);
  const steps = rawSteps.slice(0, 3).map((step, index): RoutineStep => {
    const values = Array.isArray(step) ? step : [];
    if (values.length !== 3) issues.push(`${path}.routine.steps[${index}] must contain number, title, and body.`);
    return [
      textValue(values[0], `${path}.routine.steps[${index}][0]`, 1, 8, issues),
      textValue(values[1], `${path}.routine.steps[${index}][1]`, 2, 80, issues),
      textValue(values[2], `${path}.routine.steps[${index}][2]`, 5, 240, issues),
    ];
  });

  return {
    hero: {
      eyebrow: textValue(hero.eyebrow, `${path}.hero.eyebrow`, 2, 100, issues),
      title: textValue(hero.title, `${path}.hero.title`, 2, 140, issues),
      body: textValue(hero.body, `${path}.hero.body`, 10, 500, issues),
      primary: textValue(hero.primary, `${path}.hero.primary`, 2, 80, issues),
      secondary: textValue(hero.secondary, `${path}.hero.secondary`, 2, 80, issues),
      assetStatus: textValue(hero.assetStatus, `${path}.hero.assetStatus`, 3, 240, issues),
      desktopMediaAssetId: nullableAssetId(hero.desktopMediaAssetId, `${path}.hero.desktopMediaAssetId`, issues),
      mobileMediaAssetId: nullableAssetId(hero.mobileMediaAssetId, `${path}.hero.mobileMediaAssetId`, issues),
    },
    productTruth: {
      eyebrow: textValue(productTruth.eyebrow, `${path}.productTruth.eyebrow`, 2, 100, issues),
      title: textValue(productTruth.title, `${path}.productTruth.title`, 2, 140, issues),
      body: textValue(productTruth.body, `${path}.productTruth.body`, 10, 500, issues),
      gate: textValue(productTruth.gate, `${path}.productTruth.gate`, 10, 500, issues),
    },
    routine: {
      title: textValue(routine.title, `${path}.routine.title`, 2, 140, issues),
      body: textValue(routine.body, `${path}.routine.body`, 10, 500, issues),
      cta: textValue(routine.cta, `${path}.routine.cta`, 2, 80, issues),
      steps,
    },
    gifting: {
      title: textValue(gifting.title, `${path}.gifting.title`, 2, 140, issues),
      body: textValue(gifting.body, `${path}.gifting.body`, 10, 500, issues),
      cta: textValue(gifting.cta, `${path}.gifting.cta`, 2, 80, issues),
    },
    story: {
      title: textValue(story.title, `${path}.story.title`, 2, 140, issues),
      body: textValue(story.body, `${path}.story.body`, 10, 500, issues),
      cta: textValue(story.cta, `${path}.story.cta`, 2, 80, issues),
    },
    edit: {
      title: textValue(edit.title, `${path}.edit.title`, 2, 140, issues),
      body: textValue(edit.body, `${path}.edit.body`, 10, 500, issues),
      cta: textValue(edit.cta, `${path}.edit.cta`, 2, 80, issues),
    },
  };
}

function validatePublicPath(value: unknown, path: string, issues: string[]) {
  const href = textValue(value, path, 1, 160, issues);
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("\\") || /[\u0000-\u001f]/.test(href)) {
    issues.push(`${path} must be a safe local path.`);
  }
  return href;
}

function validateLinks(value: unknown, path: string, min: number, max: number, issues: string[]) {
  const links = Array.isArray(value) ? value : [];
  if (links.length < min || links.length > max) issues.push(`${path} must contain ${min}-${max} links.`);
  return links.slice(0, max).map((link, index): NavigationLink => {
    const pair = Array.isArray(link) ? link : [];
    if (pair.length !== 2) issues.push(`${path}[${index}] must contain href and label.`);
    return [
      validatePublicPath(pair[0], `${path}[${index}][0]`, issues),
      textValue(pair[1], `${path}[${index}][1]`, 1, 80, issues),
    ];
  });
}

function validateShell(value: unknown, path: string, issues: string[]): ShellAuthorityContent {
  const shell = objectValue(value, path, issues);
  const rawServiceStrip = Array.isArray(shell.serviceStrip) ? shell.serviceStrip : [];
  if (rawServiceStrip.length !== 5) issues.push(`${path}.serviceStrip must contain exactly 5 items.`);
  const allowedIcons = new Set(["delivery", "samples", "packaging", "ingredients", "returns"]);
  const serviceStrip = rawServiceStrip.slice(0, 5).map((item, index): ServiceStripItem => {
    const values = Array.isArray(item) ? item : [];
    const icon = textValue(values[0], `${path}.serviceStrip[${index}][0]`, 2, 40, issues);
    if (!allowedIcons.has(icon)) issues.push(`${path}.serviceStrip[${index}][0] has an unsupported icon.`);
    return [
      icon,
      textValue(values[1], `${path}.serviceStrip[${index}][1]`, 2, 100, issues),
      textValue(values[2], `${path}.serviceStrip[${index}][2]`, 3, 180, issues),
    ];
  });
  const copy = (field: keyof Omit<ShellAuthorityContent, "nav" | "policies" | "support" | "shopLinks" | "serviceStrip">, max = 240) =>
    textValue(shell[field], `${path}.${field}`, 2, max, issues);
  return {
    skip: copy("skip", 80),
    market: copy("market", 120),
    tagline: copy("tagline", 160),
    trackOrder: copy("trackOrder", 80),
    navLabel: copy("navLabel", 80),
    account: copy("account", 80),
    footerBody: copy("footerBody", 500),
    footerStatus: copy("footerStatus", 500),
    aboutLabel: copy("aboutLabel", 80),
    policyTitle: copy("policyTitle", 100),
    supportTitle: copy("supportTitle", 100),
    footerTagline: copy("footerTagline", 180),
    serviceStripTitle: copy("serviceStripTitle", 100),
    shopTitle: copy("shopTitle", 80),
    nav: validateLinks(shell.nav, `${path}.nav`, 3, 12, issues),
    policies: validateLinks(shell.policies, `${path}.policies`, 1, 12, issues),
    support: validateLinks(shell.support, `${path}.support`, 1, 12, issues),
    shopLinks: validateLinks(shell.shopLinks, `${path}.shopLinks`, 1, 12, issues),
    serviceStrip,
  };
}

const trustSupportSlugs = [...trustSlugs, ...supportSlugs] as const;

function validateTrustSupportRecord(value: unknown, slug: TrustSlug | SupportSlug, path: string, issues: string[]): TrustSupportRecord {
  const record = objectValue(value, path, issues);
  const rawSections = Array.isArray(record.sections) ? record.sections : [];
  const rawFaqs = Array.isArray(record.faqs) ? record.faqs : [];
  if (rawSections.length < 1 || rawSections.length > 12) issues.push(`${path}.sections must contain 1-12 sections.`);
  if (rawFaqs.length > 20) issues.push(`${path}.faqs cannot contain more than 20 entries.`);
  const sections = rawSections.slice(0, 12).map((section, index) => {
    const item = objectValue(section, `${path}.sections[${index}]`, issues);
    const rawPoints = item.points === undefined ? undefined : Array.isArray(item.points) ? item.points : [];
    if (rawPoints && rawPoints.length > 20) issues.push(`${path}.sections[${index}].points cannot exceed 20 entries.`);
    return {
      title: textValue(item.title, `${path}.sections[${index}].title`, 2, 160, issues),
      body: textValue(item.body, `${path}.sections[${index}].body`, 5, 2000, issues),
      ...(rawPoints ? { points: rawPoints.slice(0, 20).map((point, pointIndex) => textValue(point, `${path}.sections[${index}].points[${pointIndex}]`, 2, 300, issues)) } : {}),
    };
  });
  const faqs = rawFaqs.slice(0, 20).map((faq, index): [string, string] => {
    const pair = Array.isArray(faq) ? faq : [];
    if (pair.length !== 2) issues.push(`${path}.faqs[${index}] must contain a question and answer.`);
    return [
      textValue(pair[0], `${path}.faqs[${index}][0]`, 3, 300, issues),
      textValue(pair[1], `${path}.faqs[${index}][1]`, 3, 1200, issues),
    ];
  });
  return {
    slug,
    eyebrow: textValue(record.eyebrow, `${path}.eyebrow`, 2, 100, issues),
    title: textValue(record.title, `${path}.title`, 2, 200, issues),
    summary: textValue(record.summary, `${path}.summary`, 10, 1200, issues),
    status: textValue(record.status, `${path}.status`, 3, 800, issues),
    sections,
    faqs,
  };
}

function assertApprovedAssets(content: SiteContentDocument) {
  const assetIds = new Set(
    (["ar", "en"] as const).flatMap((locale) => [
      content.home[locale].hero.desktopMediaAssetId,
      content.home[locale].hero.mobileMediaAssetId,
    ]).filter((value): value is string => Boolean(value)),
  );
  if (assetIds.size === 0) return;
  const statement = getAuthorityDatabase().prepare(
    "SELECT status FROM authority_media_assets WHERE id = ?",
  );
  const issues: string[] = [];
  for (const assetId of assetIds) {
    const row = statement.get(assetId) as { status: string } | undefined;
    if (row?.status !== "approved") issues.push(`Media asset ${assetId} must exist and be approved before content can be saved.`);
  }
  if (issues.length > 0) throw new SiteContentAuthorityError("site_content_media_invalid", "Site content references unavailable media.", 409, issues);
}

export function validateSiteContent(value: unknown): SiteContentDocument {
  const issues: string[] = [];
  const root = objectValue(value, "content", issues);
  const identity = objectValue(root.identity, "content.identity", issues);
  const seo = objectValue(root.seo, "content.seo", issues);
  const home = objectValue(root.home, "content.home", issues);
  const shell = objectValue(root.shell, "content.shell", issues);
  const trustSupportRoot = objectValue(root.trustSupport, "content.trustSupport", issues);
  const document: SiteContentDocument = {
    schemaVersion: SITE_CONTENT_SCHEMA_VERSION,
    identity: {
      siteName: textValue(identity.siteName, "content.identity.siteName", 2, 80, issues),
      taglineAr: textValue(identity.taglineAr, "content.identity.taglineAr", 2, 160, issues),
      taglineEn: textValue(identity.taglineEn, "content.identity.taglineEn", 2, 160, issues),
    },
    seo: {
      ar: {
        homeTitle: textValue(objectValue(seo.ar, "content.seo.ar", issues).homeTitle, "content.seo.ar.homeTitle", 5, 160, issues),
        homeDescription: textValue(objectValue(seo.ar, "content.seo.ar", issues).homeDescription, "content.seo.ar.homeDescription", 30, 320, issues),
      },
      en: {
        homeTitle: textValue(objectValue(seo.en, "content.seo.en", issues).homeTitle, "content.seo.en.homeTitle", 5, 160, issues),
        homeDescription: textValue(objectValue(seo.en, "content.seo.en", issues).homeDescription, "content.seo.en.homeDescription", 30, 320, issues),
      },
    },
    home: {
      ar: validateHome(home.ar, "content.home.ar", issues),
      en: validateHome(home.en, "content.home.en", issues),
    },
    shell: {
      ar: validateShell(shell.ar, "content.shell.ar", issues),
      en: validateShell(shell.en, "content.shell.en", issues),
    },
    trustSupport: {
      ar: {} as Record<TrustSlug | SupportSlug, TrustSupportRecord>,
      en: {} as Record<TrustSlug | SupportSlug, TrustSupportRecord>,
    },
    editorial: getDefaultEditorialAuthorityContent(),
  };
  for (const locale of ["ar", "en"] as const) {
    const localized = objectValue(trustSupportRoot[locale], `content.trustSupport.${locale}`, issues);
    for (const slug of trustSupportSlugs) {
      document.trustSupport[locale][slug] = validateTrustSupportRecord(
        localized[slug],
        slug,
        `content.trustSupport.${locale}.${slug}`,
        issues,
      );
    }
  }
  try {
    document.editorial = validateEditorialAuthorityContent(root.editorial);
  } catch (error) {
    if (error instanceof EditorialAuthorityValidationError) issues.push(...error.issues);
    else issues.push("content.editorial could not be validated.");
  }
  if (issues.length > 0) throw new SiteContentAuthorityError("site_content_invalid", "Site content validation failed.", 400, issues);
  assertApprovedAssets(document);
  return document;
}

function canonicalJson(content: SiteContentDocument) {
  return JSON.stringify(content);
}

function mapRevision(row: RevisionRow): SiteContentRevision {
  const stored = JSON.parse(row.payload_json) as Partial<SiteContentDocument>;
  const defaults = getDefaultSiteContent();
  const content = {
    ...defaults,
    ...stored,
    schemaVersion: SITE_CONTENT_SCHEMA_VERSION,
    shell: stored.shell ?? defaults.shell,
    trustSupport: stored.trustSupport ?? defaults.trustSupport,
    editorial: mergeStoredEditorialAuthorityContent(stored.editorial),
  } as SiteContentDocument;
  return {
    id: row.id,
    documentKey: row.document_key,
    version: row.version,
    schemaVersion: row.schema_version,
    contentHash: row.content_hash,
    content,
    changeSummary: row.change_summary,
    createdBy: row.created_by,
    createdAt: row.created_at,
    isPublished: row.published_at !== null,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
    approvalRef: row.approval_ref,
  };
}

const revisionSelect = `
  SELECT r.id, r.document_key, r.version, r.schema_version, r.content_hash,
         r.payload_json, r.change_summary, r.created_by, r.created_at,
         CASE WHEN p.revision_id = r.id THEN p.published_at END AS published_at,
         CASE WHEN p.revision_id = r.id THEN p.published_by END AS published_by,
         CASE WHEN p.revision_id = r.id THEN p.approval_ref END AS approval_ref
  FROM authority_site_content_revisions r
  LEFT JOIN authority_site_content_publications p ON p.document_key = r.document_key
`;

export function listSiteContentRevisions(limit = 50) {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  return (getAuthorityDatabase().prepare(`${revisionSelect}
    WHERE r.document_key = ? ORDER BY r.version DESC LIMIT ?
  `).all(SITE_CONTENT_DOCUMENT_KEY, safeLimit) as RevisionRow[]).map(mapRevision);
}

export function getSiteContentWorkspace() {
  const revisions = listSiteContentRevisions();
  return {
    content: revisions[0]?.content ?? getDefaultSiteContent(),
    latestVersion: revisions[0]?.version ?? 0,
    publishedVersion: revisions.find((revision) => revision.isPublished)?.version ?? null,
    revisions: revisions.map((revision) => ({
      id: revision.id,
      documentKey: revision.documentKey,
      version: revision.version,
      schemaVersion: revision.schemaVersion,
      contentHash: revision.contentHash,
      changeSummary: revision.changeSummary,
      createdBy: revision.createdBy,
      createdAt: revision.createdAt,
      isPublished: revision.isPublished,
      publishedAt: revision.publishedAt,
      publishedBy: revision.publishedBy,
      approvalRef: revision.approvalRef,
    })),
  };
}

export function saveSiteContentRevision(input: {
  content: unknown;
  expectedVersion: number;
  changeSummary: string;
  actor: string;
}) {
  const content = validateSiteContent(input.content);
  const changeSummary = requiredText(input.changeSummary, "changeSummary", 3, 240);
  const actor = requiredText(input.actor, "actor", 2, 160);
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0) {
    throw new SiteContentAuthorityError("site_content_version_invalid", "expectedVersion must be a non-negative integer.");
  }
  const payloadJson = canonicalJson(content);
  const contentHash = createHash("sha256").update(payloadJson).digest("hex");

  return runAuthorityTransaction((database) => {
    const current = database.prepare(
      "SELECT id, version, content_hash FROM authority_site_content_revisions WHERE document_key = ? ORDER BY version DESC LIMIT 1",
    ).get(SITE_CONTENT_DOCUMENT_KEY) as { id: string; version: number; content_hash: string } | undefined;
    const currentVersion = current?.version ?? 0;
    if (currentVersion !== input.expectedVersion) {
      throw new SiteContentAuthorityError("site_content_version_conflict", `Content changed since version ${input.expectedVersion}. Refresh before saving.`, 409);
    }
    if (current?.content_hash === contentHash) {
      throw new SiteContentAuthorityError("site_content_unchanged", "No content changes were detected.", 409);
    }
    const id = randomUUID();
    const version = currentVersion + 1;
    const createdAt = new Date().toISOString();
    database.prepare(`
      INSERT INTO authority_site_content_revisions (
        id, document_key, version, schema_version, content_hash, payload_json,
        change_summary, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, SITE_CONTENT_DOCUMENT_KEY, version, SITE_CONTENT_SCHEMA_VERSION, contentHash, payloadJson, changeSummary, actor, createdAt);
    return { id, version, contentHash, content, changeSummary, createdBy: actor, createdAt };
  });
}

export function publishSiteContentRevision(input: {
  revisionId: string;
  approvalRef: string;
  actor: string;
}) {
  const revisionId = requiredText(input.revisionId, "revisionId", 8, 100);
  const approvalRef = requiredText(input.approvalRef, "approvalRef", 3, 500);
  const actor = requiredText(input.actor, "actor", 2, 160);
  return runAuthorityTransaction((database) => {
    const revision = database.prepare(
      "SELECT id, version, payload_json FROM authority_site_content_revisions WHERE id = ? AND document_key = ?",
    ).get(revisionId, SITE_CONTENT_DOCUMENT_KEY) as { id: string; version: number; payload_json: string } | undefined;
    if (!revision) throw new SiteContentAuthorityError("site_content_revision_not_found", "Content revision was not found.", 404);
    const revisionContent = JSON.parse(revision.payload_json) as SiteContentDocument;
    assertApprovedAssets(revisionContent);
    if (revisionContent.editorial) validateEditorialAuthorityContent(revisionContent.editorial);
    const publishedAt = new Date().toISOString();
    database.prepare(`
      INSERT INTO authority_site_content_publications (document_key, revision_id, published_by, published_at, approval_ref)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(document_key) DO UPDATE SET
        revision_id = excluded.revision_id,
        published_by = excluded.published_by,
        published_at = excluded.published_at,
        approval_ref = excluded.approval_ref
    `).run(SITE_CONTENT_DOCUMENT_KEY, revision.id, actor, publishedAt, approvalRef);
    return { revisionId: revision.id, version: revision.version, publishedAt, publishedBy: actor, approvalRef };
  });
}

export function getPublishedSiteContent() {
  const row = getAuthorityDatabase().prepare(`${revisionSelect}
    WHERE r.document_key = ? AND p.revision_id = r.id LIMIT 1
  `).get(SITE_CONTENT_DOCUMENT_KEY) as RevisionRow | undefined;
  return row ? mapRevision(row) : null;
}

export function getEffectiveSiteContent() {
  return getPublishedSiteContent()?.content ?? getDefaultSiteContent();
}

export function getEffectiveTrustSupportRecord(locale: Locale, slug: TrustSlug | SupportSlug) {
  return getEffectiveSiteContent().trustSupport[locale][slug];
}

export function getEffectiveEditorialContent() {
  return getEffectiveSiteContent().editorial;
}

export function getEffectiveDiscoveryContent(locale: Locale, kind: DiscoveryKind) {
  const content = getEffectiveSiteContent();
  return {
    records: content.editorial.discoveryRecords[locale][kind],
    hubCopy: content.editorial.discoveryHubCopy[locale],
    detailCopy: content.editorial.discoveryDetailCopy[locale],
    labels: content.editorial.discoveryDetailCopy.labels[locale],
    visual: content.editorial.discoveryVisuals[kind],
    siteName: content.identity.siteName,
  };
}

export function getEffectiveJournalContent(locale: Locale) {
  const content = getEffectiveSiteContent();
  return {
    records: content.editorial.journalContent[locale],
    copy: content.editorial.journalCopy[locale],
    interfaceCopy: content.editorial.journalInterfaceCopy[locale],
    heroImage: content.editorial.journalHeroImage,
    siteName: content.identity.siteName,
  };
}

export function getEffectiveJournalRecord(locale: Locale, slug: JournalSlug) {
  return getEffectiveJournalContent(locale).records[slug];
}

export function getEffectiveShopContent(locale: Locale) {
  return getEffectiveSiteContent().editorial.shop[locale];
}

export function getEffectiveCategoryContent(locale: Locale, slug: CategorySlug) {
  const editorial = getEffectiveSiteContent().editorial;
  return { copy: editorial.categoryCopy[locale][slug], shared: editorial.categorySharedCopy[locale] };
}
