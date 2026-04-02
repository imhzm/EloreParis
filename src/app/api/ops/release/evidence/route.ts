import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import {
  normalizeReleaseEvidenceReport,
  readReleaseEvidence,
  writeReleaseEvidence,
} from "@/lib/release-evidence";
import {
  RequestHardeningError,
  assertTrustedMutationRequest,
} from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/release");
    const releaseEvidence = readReleaseEvidence();

    if (!releaseEvidence) {
      return NextResponse.json(
        { error: "No release evidence report is available yet." },
        { status: 404 },
      );
    }

    return NextResponse.json({ releaseEvidence });
  } catch (error) {
    if (error instanceof OpsAccessError || error instanceof RequestHardeningError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحميل تقرير التحقق التنفيذي الحالي." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/release");

    let body: {
      releaseEvidence?: unknown;
    };

    try {
      body = (await request.json()) as {
        releaseEvidence?: unknown;
      };
    } catch {
      return NextResponse.json(
        { error: "The release evidence payload could not be parsed." },
        { status: 400 },
      );
    }

    const releaseEvidence = normalizeReleaseEvidenceReport(body.releaseEvidence);

    if (!releaseEvidence) {
      return NextResponse.json(
        { error: "The submitted release evidence report is not valid." },
        { status: 400 },
      );
    }

    writeReleaseEvidence(releaseEvidence);

    await logOpsAuditEvent({
      action: "ops_release_evidence_publish",
      actor: {
        userId: session.userId,
        name: session.name,
        role: session.role,
      },
      entityType: "release",
      entityId: "latest-evidence",
      summary: `${session.name} published a ${releaseEvidence.verificationMode} release evidence report for ${releaseEvidence.targetBaseUrl}.`,
      metadata: {
        verification_mode: releaseEvidence.verificationMode,
        target_base_url: releaseEvidence.targetBaseUrl,
        generated_at: releaseEvidence.generatedAt,
        api_checks: releaseEvidence.summary.apiChecks,
        protected_route_checks: releaseEvidence.summary.protectedRouteChecks,
      },
    });

    return NextResponse.json({ releaseEvidence }, { status: 201 });
  } catch (error) {
    if (error instanceof OpsAccessError || error instanceof RequestHardeningError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر حفظ تقرير التحقق التنفيذي الحالي داخل بيئة التشغيل." },
      { status: 500 },
    );
  }
}
