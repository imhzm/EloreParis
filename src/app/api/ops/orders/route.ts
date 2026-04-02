import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertOpsApiAccess,
  listAuthorityOrders,
  OrderAuthorityError,
} from "@/lib/order-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await assertOpsApiAccess(request);
    const orders = await listAuthorityOrders();

    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof OrderAuthorityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "تعذر تحميل قائمة الطلبات الداخلية." },
      { status: 500 },
    );
  }
}
