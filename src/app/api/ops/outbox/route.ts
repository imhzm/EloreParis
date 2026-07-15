import { NextResponse, type NextRequest } from "next/server";
import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";
import {
  drainAuthorityOutbox,
  getAuthorityOutboxSummary,
} from "@/lib/order-outbox";
import { expireDueAuthorityInventoryReservations } from "@/lib/inventory-reservation-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/orders");
    return noStoreJson({ outbox: getAuthorityOutboxSummary() });
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return noStoreJson({ error: error.message, code: "ops_access_denied" }, error.statusCode);
    }
    return noStoreJson({ error: "Unable to read the authority outbox." }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/orders");
    const body = await request.json().catch(() => ({})) as { limit?: unknown };
    const limit =
      typeof body.limit === "number" && Number.isInteger(body.limit)
        ? body.limit
        : 20;
    const reservations = expireDueAuthorityInventoryReservations({ limit });
    const result = await drainAuthorityOutbox({ limit });
    return noStoreJson({ result, reservations, outbox: getAuthorityOutboxSummary() });
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return noStoreJson({ error: error.message, code: "ops_access_denied" }, error.statusCode);
    }
    return noStoreJson({ error: "Unable to process the authority outbox." }, 500);
  }
}
