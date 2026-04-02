import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import {
  normalizeReleaseDecisionDraft,
} from "@/lib/release-decision";
import {
  publishReleaseDecisionRecord,
  readReleaseDecisionHistory,
  ReleaseDecisionError,
} from "@/lib/release-decision-history";
import {
  RequestHardeningError,
  assertTrustedMutationRequest,
} from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/release");

    return NextResponse.json({
      releaseDecisions: readReleaseDecisionHistory(),
    });
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحميل سجل قرارات الإطلاق الحالية." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/release");

    if (session.role !== "manager") {
      return NextResponse.json(
        { error: "Only manager sessions can record release decisions." },
        { status: 403 },
      );
    }

    let body: {
      releaseDecision?: unknown;
    };

    try {
      body = (await request.json()) as {
        releaseDecision?: unknown;
      };
    } catch {
      return NextResponse.json(
        { error: "The release decision payload could not be parsed." },
        { status: 400 },
      );
    }

    const releaseDecision = normalizeReleaseDecisionDraft(body.releaseDecision);

    if (!releaseDecision) {
      return NextResponse.json(
        { error: "The submitted release decision is not valid." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        releaseDecisionRecord: await publishReleaseDecisionRecord(
          session,
          releaseDecision,
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof OpsAccessError ||
      error instanceof RequestHardeningError ||
      error instanceof ReleaseDecisionError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تسجيل قرار الإطلاق الحالي داخل بيئة التشغيل." },
      { status: 500 },
    );
  }
}
