import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CatalogAuthorityError,
  getCatalogAuthoritySnapshot,
  importCatalogAuthorityDraft,
  publishCatalogAuthorityImport,
} from "@/lib/catalog-authority";
import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";
import {
  assertTrustedMutationRequest,
  RequestHardeningError,
} from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CATALOG_IMPORT_BYTES = 2 * 1024 * 1024;

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorResponse(error: unknown) {
  if (error instanceof CatalogAuthorityError) {
    return jsonResponse(
      { error: error.message, code: error.code, issues: error.issues },
      error.statusCode,
    );
  }
  if (error instanceof OpsAccessError) {
    return jsonResponse(
      { error: error.message, code: "ops_access_denied" },
      error.statusCode,
    );
  }
  if (error instanceof RequestHardeningError) {
    return jsonResponse(
      { error: error.message, code: "untrusted_mutation_request" },
      error.statusCode,
    );
  }
  return jsonResponse(
    { error: "Catalog authority request failed.", code: "catalog_internal_error" },
    500,
  );
}

async function readBoundedJson(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    throw new CatalogAuthorityError(
      "unsupported_media_type",
      "Catalog authority accepts application/json only.",
      415,
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_CATALOG_IMPORT_BYTES) {
    throw new CatalogAuthorityError(
      "catalog_payload_too_large",
      "Catalog import exceeds the 2 MB authority limit.",
      413,
    );
  }

  if (!request.body) {
    throw new CatalogAuthorityError("invalid_json", "Catalog payload is empty.", 400);
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_CATALOG_IMPORT_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new CatalogAuthorityError(
        "catalog_payload_too_large",
        "Catalog import exceeds the 2 MB authority limit.",
        413,
      );
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new CatalogAuthorityError("invalid_json", "Catalog payload is not valid JSON.", 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/catalog");
    return jsonResponse(getCatalogAuthoritySnapshot());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/catalog");
    const payload = await readBoundedJson(request);
    return jsonResponse(
      importCatalogAuthorityDraft(payload, session.userId),
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/catalog");
    const payload = await readBoundedJson(request);
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      !("action" in payload) ||
      !("importId" in payload) ||
      payload.action !== "publish" ||
      typeof payload.importId !== "string" ||
      Object.keys(payload).length !== 2
    ) {
      throw new CatalogAuthorityError(
        "catalog_action_invalid",
        "Publish requests require only action=publish and a catalog importId.",
        400,
      );
    }
    return jsonResponse(
      publishCatalogAuthorityImport(payload.importId, session.userId),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
