import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  getDevelopmentOpenOpsSession,
  getOpsAccessConfig,
  getOpsSessionFromCookieValue,
  OPS_SESSION_COOKIE,
  shouldUseSecureOpsCookies,
} from "@/lib/ops-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const accessConfig = getOpsAccessConfig();
  const sessionCookie = request.cookies.get(OPS_SESSION_COOKIE)?.value;
  const session =
    (await getOpsSessionFromCookieValue(sessionCookie, accessConfig)) ??
    getDevelopmentOpenOpsSession();

  const response = NextResponse.json({
    ok: true,
  });

  response.cookies.set({
    name: OPS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureOpsCookies(),
    path: "/",
    maxAge: 0,
  });

  await logOpsAuditEvent({
    action: "ops_logout",
    actor: {
      userId: session.userId,
      name: session.name,
      role: session.role,
    },
    entityType: "ops_session",
    entityId: session.sessionId,
    summary: `${session.name} closed the current ops session.`,
    metadata: {
      role: session.role,
      mode: session.mode,
    },
  });

  return response;
}
