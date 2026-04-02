import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await assertOpsRequestAccess(request, "/api/ops/session");
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحميل جلسة التشغيل الحالية." },
      { status: 500 },
    );
  }
}
