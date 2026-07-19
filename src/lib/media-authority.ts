import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getAuthorityDatabase } from "@/lib/authority-database";
import { resolveProjectPath } from "@/lib/runtime-paths";

export const MAX_AUTHORITY_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 12_000;
const MAX_OUTPUT_DIMENSION = 2_400;
const MIN_IMAGE_DIMENSION = 400;

export type MediaAsset = {
  id: string;
  publicUrl: string;
  mimeType: "image/webp";
  byteSize: number;
  width: number;
  height: number;
  altAr: string;
  altEn: string;
  rightsEvidenceRef: string;
  status: "pending" | "approved" | "retired";
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
};

type MediaRow = {
  id: string;
  storage_key: string;
  sha256: string;
  mime_type: "image/webp";
  byte_size: number;
  width: number;
  height: number;
  alt_ar: string;
  alt_en: string;
  rights_evidence_ref: string;
  status: MediaAsset["status"];
  created_by: string;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
};

export class MediaAuthorityError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "MediaAuthorityError";
  }
}

function mediaRoot() {
  return resolveProjectPath(
    process.env.PROMOTION_MEDIA_ROOT?.trim() || ".data/media/promotions",
  );
}

function boundedText(value: string, field: string, min: number, max: number) {
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new MediaAuthorityError(
      "media_metadata_invalid",
      `${field} must contain ${min}-${max} characters.`,
    );
  }
  return normalized;
}

function mapMedia(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    publicUrl: `/api/media/${encodeURIComponent(row.id)}`,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    width: row.width,
    height: row.height,
    altAr: row.alt_ar,
    altEn: row.alt_en,
    rightsEvidenceRef: row.rights_evidence_ref,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
  };
}

const mediaColumns = `
  id, storage_key, sha256, mime_type, byte_size, width, height,
  alt_ar, alt_en, rights_evidence_ref, status, created_by, created_at,
  approved_by, approved_at
`;

export function listMediaAssets() {
  return (getAuthorityDatabase().prepare(`
    SELECT ${mediaColumns} FROM authority_media_assets
    ORDER BY created_at DESC LIMIT 200
  `).all() as MediaRow[]).map(mapMedia);
}

export async function ingestPromotionImage(input: {
  bytes: Uint8Array;
  declaredMimeType: string;
  altAr: string;
  altEn: string;
  rightsEvidenceRef: string;
  actor: string;
}) {
  if (input.bytes.byteLength < 1 || input.bytes.byteLength > MAX_AUTHORITY_IMAGE_BYTES) {
    throw new MediaAuthorityError(
      "media_size_invalid",
      "Images must be between 1 byte and 10 MB.",
      413,
    );
  }
  if (!new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(input.declaredMimeType)) {
    throw new MediaAuthorityError("media_type_invalid", "Only JPEG, PNG, WebP, and AVIF images are accepted.", 415);
  }
  const altAr = boundedText(input.altAr, "altAr", 3, 240);
  const altEn = boundedText(input.altEn, "altEn", 3, 240);
  const rightsEvidenceRef = boundedText(input.rightsEvidenceRef, "rightsEvidenceRef", 3, 500);
  const actor = boundedText(input.actor, "actor", 2, 160);

  let pipeline: sharp.Sharp;
  let metadata: sharp.Metadata;
  try {
    pipeline = sharp(input.bytes, {
      failOn: "error",
      limitInputPixels: MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION,
      pages: 1,
    });
    metadata = await pipeline.metadata();
  } catch {
    throw new MediaAuthorityError(
      "media_decode_invalid",
      "Image bytes do not decode as a supported, safe image.",
      415,
    );
  }
  const expectedFormat: Record<string, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const decodedMimeType =
    metadata.format === "heif" && metadata.compression === "av1"
      ? "image/avif"
      : metadata.format
        ? expectedFormat[metadata.format]
        : undefined;
  if (decodedMimeType !== input.declaredMimeType) {
    throw new MediaAuthorityError(
      "media_signature_mismatch",
      "Declared MIME type does not match the decoded image signature.",
      415,
    );
  }
  if (
    !metadata.width || !metadata.height ||
    metadata.width < MIN_IMAGE_DIMENSION || metadata.height < MIN_IMAGE_DIMENSION ||
    metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION ||
    (metadata.pages ?? 1) !== 1
  ) {
    throw new MediaAuthorityError(
      "media_dimensions_invalid",
      `Images must be single-frame and between ${MIN_IMAGE_DIMENSION}px and ${MAX_IMAGE_DIMENSION}px per side.`,
    );
  }

  const output = await pipeline
    .rotate()
    .resize({
      width: MAX_OUTPUT_DIMENSION,
      height: MAX_OUTPUT_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 86, effort: 5, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
  if (!output.info.width || !output.info.height) {
    throw new MediaAuthorityError("media_processing_failed", "Optimized image dimensions are unavailable.", 500);
  }
  const sha256 = createHash("sha256").update(output.data).digest("hex");
  const existing = getAuthorityDatabase().prepare(`
    SELECT ${mediaColumns} FROM authority_media_assets WHERE sha256 = ?
  `).get(sha256) as MediaRow | undefined;
  if (existing) return { asset: mapMedia(existing), deduplicated: true };

  const storageKey = `${sha256}.webp`;
  const root = mediaRoot();
  await mkdir(root, { recursive: true });
  const outputPath = path.resolve(root, storageKey);
  if (path.dirname(outputPath) !== path.resolve(root)) {
    throw new MediaAuthorityError("media_storage_invalid", "Media storage path is invalid.", 500);
  }
  try {
    await writeFile(outputPath, output.data, { flag: "wx" });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
  }

  const id = `media_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  getAuthorityDatabase().prepare(`
    INSERT INTO authority_media_assets (
      id, storage_key, sha256, mime_type, byte_size, width, height,
      alt_ar, alt_en, rights_evidence_ref, status, created_by, created_at,
      approved_by, approved_at
    ) VALUES (?, ?, ?, 'image/webp', ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, NULL)
  `).run(
    id, storageKey, sha256, output.data.byteLength, output.info.width, output.info.height,
    altAr, altEn, rightsEvidenceRef, actor, createdAt,
  );
  const row = getAuthorityDatabase().prepare(`
    SELECT ${mediaColumns} FROM authority_media_assets WHERE id = ?
  `).get(id) as MediaRow;
  return { asset: mapMedia(row), deduplicated: false };
}

export function approveMediaAsset(assetId: string, actor: string) {
  const id = boundedText(assetId, "assetId", 8, 160);
  const approvedBy = boundedText(actor, "actor", 2, 160);
  const approvedAt = new Date().toISOString();
  const result = getAuthorityDatabase().prepare(`
    UPDATE authority_media_assets
    SET status = 'approved', approved_by = ?, approved_at = ?
    WHERE id = ? AND status = 'pending'
  `).run(approvedBy, approvedAt, id) as { changes: number | bigint };
  if (Number(result.changes) !== 1) {
    throw new MediaAuthorityError(
      "media_approval_conflict",
      "Media asset was not found or is no longer pending approval.",
      409,
    );
  }
  const row = getAuthorityDatabase().prepare(`
    SELECT ${mediaColumns} FROM authority_media_assets WHERE id = ?
  `).get(id) as MediaRow;
  return mapMedia(row);
}

export async function readApprovedMediaAsset(assetId: string) {
  if (!/^media_[A-Za-z0-9-]{16,160}$/.test(assetId)) return null;
  const row = getAuthorityDatabase().prepare(`
    SELECT ${mediaColumns} FROM authority_media_assets
    WHERE id = ? AND status = 'approved'
  `).get(assetId) as MediaRow | undefined;
  if (!row || !/^[a-f0-9]{64}\.webp$/.test(row.storage_key)) return null;
  const root = mediaRoot();
  const filePath = path.resolve(root, row.storage_key);
  if (path.dirname(filePath) !== path.resolve(root)) return null;
  try {
    return { asset: mapMedia(row), sha256: row.sha256, bytes: await readFile(filePath) };
  } catch {
    throw new MediaAuthorityError("media_storage_missing", "Approved media bytes are unavailable.", 503);
  }
}
