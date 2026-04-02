import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import { readReleaseEvidence } from "@/lib/release-evidence";

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
    if (error instanceof OpsAccessError) {
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
