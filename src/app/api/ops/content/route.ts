import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import { assertTrustedMutationRequest, RequestHardeningError } from "@/lib/request-hardening";
import {
  getSiteContentWorkspace,
  publishSiteContentRevision,
  saveSiteContentRevision,
  SiteContentAuthorityError,
} from "@/lib/site-content-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SITE_CONTENT_BYTES = 256 * 1024;

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(error: unknown) {
  if (error instanceof SiteContentAuthorityError) {
    return response({ error: error.message, code: error.code, issues: error.issues }, error.statusCode);
  }
  if (error instanceof OpsAccessError) {
    return response({ error: error.message, code: "ops_access_denied" }, error.statusCode);
  }
  if (error instanceof RequestHardeningError) {
    return response({ error: error.message, code: "untrusted_mutation_request" }, error.statusCode);
  }
  return response({ error: "Site content authority request failed.", code: "site_content_internal_error" }, 500);
}

function managerOnly(role: string) {
  if (role !== "manager") throw new OpsAccessError("Only ops managers can change site content.", 403);
}

async function readBoundedJson(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    throw new SiteContentAuthorityError("unsupported_media_type", "Site content authority accepts application/json only.", 415);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SITE_CONTENT_BYTES) {
    throw new SiteContentAuthorityError("site_content_payload_too_large", "Site content payload is too large.", 413);
  }
  if (!request.body) throw new SiteContentAuthorityError("invalid_json", "Site content payload is empty.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_SITE_CONTENT_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new SiteContentAuthorityError("site_content_payload_too_large", "Site content payload is too large.", 413);
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new SiteContentAuthorityError("invalid_json", "Site content payload is not valid JSON.");
  }
}

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/content");
    return response(getSiteContentWorkspace());
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/content");
    managerOnly(session.role);
    const body = await readBoundedJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new SiteContentAuthorityError("site_content_invalid", "Site content save payload must be an object.");
    }
    const payload = body as Record<string, unknown>;
    const revision = saveSiteContentRevision({
      content: payload.content,
      expectedVersion: Number(payload.expectedVersion),
      changeSummary: typeof payload.changeSummary === "string" ? payload.changeSummary : "",
      actor: session.userId,
    });
    await logOpsAuditEvent({
      action: "ops_site_content_save",
      actor: { userId: session.userId, name: session.name, role: session.role },
      entityType: "site_content",
      entityId: revision.id,
      summary: `${session.name} saved site content revision ${revision.version}.`,
      metadata: { version: revision.version, content_hash: revision.contentHash },
    });
    return response({ revision, workspace: getSiteContentWorkspace() }, 201);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/content");
    managerOnly(session.role);
    const body = await readBoundedJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new SiteContentAuthorityError("site_content_action_invalid", "Publish payload must be an object.");
    }
    const payload = body as Record<string, unknown>;
    if (payload.action !== "publish" && payload.action !== "rollback") {
      throw new SiteContentAuthorityError("site_content_action_invalid", "Action must be publish or rollback.");
    }
    const before = getSiteContentWorkspace().publishedVersion;
    const publication = publishSiteContentRevision({
      revisionId: typeof payload.revisionId === "string" ? payload.revisionId : "",
      approvalRef: typeof payload.approvalRef === "string" ? payload.approvalRef : "",
      actor: session.userId,
    });
    const isRollback = payload.action === "rollback" || (before !== null && publication.version < before);
    await logOpsAuditEvent({
      action: isRollback ? "ops_site_content_rollback" : "ops_site_content_publish",
      actor: { userId: session.userId, name: session.name, role: session.role },
      entityType: "site_content",
      entityId: publication.revisionId,
      summary: `${session.name} ${isRollback ? "rolled back" : "published"} site content to revision ${publication.version}.`,
      metadata: { version: publication.version, previous_version: before ?? 0 },
    });
    return response({ publication, workspace: getSiteContentWorkspace() });
  } catch (error) {
    return failure(error);
  }
}
