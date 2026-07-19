import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  listPromotions,
  PromotionAuthorityError,
  savePromotion,
} from "@/lib/promotion-authority";
import {
  assertTrustedMutationRequest,
  RequestHardeningError,
} from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMOTION_REQUEST_BYTES = 128 * 1024;

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorResponse(error: unknown) {
  if (error instanceof PromotionAuthorityError) {
    return response(
      { error: error.message, code: error.code, issues: error.issues },
      error.statusCode,
    );
  }
  if (error instanceof OpsAccessError) {
    return response({ error: error.message, code: "ops_access_denied" }, error.statusCode);
  }
  if (error instanceof RequestHardeningError) {
    return response({ error: error.message, code: "untrusted_mutation_request" }, error.statusCode);
  }
  return response(
    { error: "Promotion authority request failed.", code: "promotion_internal_error" },
    500,
  );
}

async function readBoundedJson(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    throw new PromotionAuthorityError(
      "unsupported_media_type",
      "Promotion authority accepts application/json only.",
      415,
    );
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PROMOTION_REQUEST_BYTES) {
    throw new PromotionAuthorityError("promotion_payload_too_large", "Promotion payload is too large.", 413);
  }
  if (!request.body) {
    throw new PromotionAuthorityError("invalid_json", "Promotion payload is empty.", 400);
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_PROMOTION_REQUEST_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new PromotionAuthorityError("promotion_payload_too_large", "Promotion payload is too large.", 413);
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new PromotionAuthorityError("invalid_json", "Promotion payload is not valid JSON.", 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/promotions");
    return response({ promotions: listPromotions() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/promotions");
    if (session.role !== "manager") {
      throw new OpsAccessError("Only ops managers can change promotions.", 403);
    }
    const payload = await readBoundedJson(request);
    const promotion = savePromotion(payload, session.userId);
    await logOpsAuditEvent({
      action: promotion.version === 1 ? "ops_promotion_create" : "ops_promotion_update",
      actor: {
        userId: session.userId,
        name: session.name,
        role: session.role,
      },
      entityType: "promotion",
      entityId: promotion.id,
      summary: `${session.name} ${promotion.version === 1 ? "created" : "updated"} promotion ${promotion.name}.`,
      metadata: {
        version: promotion.version,
        state: promotion.state,
        mode: promotion.mode,
      },
    });
    return response({ promotion }, promotion.version === 1 ? 201 : 200);
  } catch (error) {
    return errorResponse(error);
  }
}
