import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  approveMediaAsset,
  ingestPromotionImage,
  listMediaAssets,
  MAX_AUTHORITY_IMAGE_BYTES,
  MediaAuthorityError,
} from "@/lib/media-authority";
import { assertTrustedMutationRequest, RequestHardeningError } from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(error: unknown) {
  if (error instanceof MediaAuthorityError) return response({ error: error.message, code: error.code }, error.statusCode);
  if (error instanceof OpsAccessError) return response({ error: error.message, code: "ops_access_denied" }, error.statusCode);
  if (error instanceof RequestHardeningError) return response({ error: error.message, code: "untrusted_mutation_request" }, error.statusCode);
  return response({ error: "Media authority request failed.", code: "media_internal_error" }, 500);
}

function managerOnly(role: string) {
  if (role !== "manager") throw new OpsAccessError("Only ops managers can change media assets.", 403);
}

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/promotions");
    return response({ assets: listMediaAssets() });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/promotions");
    managerOnly(session.role);
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_AUTHORITY_IMAGE_BYTES + 64 * 1024) {
      throw new MediaAuthorityError("media_payload_too_large", "Media upload exceeds the 10 MB limit.", 413);
    }
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
      throw new MediaAuthorityError("unsupported_media_type", "Media upload requires multipart/form-data.", 415);
    }
    const form = await request.formData();
    const allowed = new Set(["file", "altAr", "altEn", "rightsEvidenceRef"]);
    if ([...form.keys()].some((key) => !allowed.has(key))) {
      throw new MediaAuthorityError("media_metadata_invalid", "Media upload contains unsupported fields.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new MediaAuthorityError("media_file_missing", "One image file is required.");
    }
    if (file.size > MAX_AUTHORITY_IMAGE_BYTES) {
      throw new MediaAuthorityError("media_payload_too_large", "Media upload exceeds the 10 MB limit.", 413);
    }
    const result = await ingestPromotionImage({
      bytes: new Uint8Array(await file.arrayBuffer()),
      declaredMimeType: file.type,
      altAr: String(form.get("altAr") ?? ""),
      altEn: String(form.get("altEn") ?? ""),
      rightsEvidenceRef: String(form.get("rightsEvidenceRef") ?? ""),
      actor: session.userId,
    });
    await logOpsAuditEvent({
      action: "ops_media_upload",
      actor: { userId: session.userId, name: session.name, role: session.role },
      entityType: "media",
      entityId: result.asset.id,
      summary: `${session.name} uploaded promotion media ${result.asset.id}.`,
      metadata: {
        width: result.asset.width,
        height: result.asset.height,
        byte_size: result.asset.byteSize,
        deduplicated: result.deduplicated,
      },
    });
    return response(result, result.deduplicated ? 200 : 201);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/promotions");
    managerOnly(session.role);
    const body = await request.json() as unknown;
    if (
      !body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 2 || !("action" in body) || !("assetId" in body) ||
      body.action !== "approve" || typeof body.assetId !== "string"
    ) {
      throw new MediaAuthorityError("media_action_invalid", "Approval requires action=approve and one assetId.");
    }
    const asset = approveMediaAsset(body.assetId, session.userId);
    await logOpsAuditEvent({
      action: "ops_media_approve",
      actor: { userId: session.userId, name: session.name, role: session.role },
      entityType: "media",
      entityId: asset.id,
      summary: `${session.name} approved promotion media ${asset.id}.`,
      metadata: { width: asset.width, height: asset.height, byte_size: asset.byteSize },
    });
    return response({ asset });
  } catch (error) {
    return failure(error);
  }
}
