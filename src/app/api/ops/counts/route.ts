import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";
import { readAuthorityOrders } from "@/lib/order-authority";
import { readAuthorityNotifications } from "@/lib/notification-authority";
import { readOpsAuditEntries } from "@/lib/ops-audit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/api/ops/counts");
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const [orders, notifications, auditEntries] = await Promise.all([
    readAuthorityOrders(),
    readAuthorityNotifications(),
    readOpsAuditEntries(),
  ]);

  const pendingOrders = orders.filter(
    (order) => order.status === "received" || order.status === "payment_pending",
  ).length;

  const activeFulfillment = orders.filter(
    (order) =>
      order.status === "confirmed" ||
      order.status === "processing" ||
      order.status === "out_for_delivery",
  ).length;

  const queuedNotifications = notifications.filter(
    (notification) => notification.status === "queued",
  ).length;

  return NextResponse.json({
    pendingOrders,
    activeFulfillment,
    queuedNotifications,
    totalOrders: orders.length,
    auditEvents: auditEntries.length,
    blockedNotifications: notifications.filter(
      (notification) => notification.status === "blocked",
    ).length,
  });
}
