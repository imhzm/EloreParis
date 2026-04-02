import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import { buildReleasePackageArtifact } from "@/lib/release-package";
import { readReleaseEvidence } from "@/lib/release-evidence";
import { getReleaseReadinessSnapshot } from "@/lib/release-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/release");

    return NextResponse.json({
      releasePackage: buildReleasePackageArtifact(
        getReleaseReadinessSnapshot(),
        readReleaseEvidence(),
      ),
    });
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحميل حزمة الجاهزية التنفيذية الحالية." },
      { status: 500 },
    );
  }
}
