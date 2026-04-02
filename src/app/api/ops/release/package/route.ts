import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import {
  buildCurrentReleasePackageArtifact,
  publishReleasePackageRecord,
} from "@/lib/release-package-history";
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
      releasePackage: buildCurrentReleasePackageArtifact(),
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

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/release");

    return NextResponse.json(
      {
        releasePackageRecord: await publishReleasePackageRecord(session),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OpsAccessError || error instanceof RequestHardeningError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر نشر حزمة الإطلاق الحالية داخل بيئة التشغيل." },
      { status: 500 },
    );
  }
}
