import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readOpsAuditEntries } from "@/lib/ops-audit";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/audit");
    const auditEntries = await readOpsAuditEntries();

    return NextResponse.json({
      auditEntries,
    });
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحميل سجل المراجعة الداخلي." },
      { status: 500 },
    );
  }
}
