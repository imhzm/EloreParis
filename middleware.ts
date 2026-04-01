import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getOpsAccessConfig,
  OPS_SESSION_COOKIE,
  sanitizeOpsNextPath,
  verifyOpsSessionToken,
} from "@/lib/ops-access";

export async function middleware(request: NextRequest) {
  const accessConfig = getOpsAccessConfig();

  if (!accessConfig.isProtectionActive) {
    return NextResponse.next();
  }

  const nextPath = sanitizeOpsNextPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const redirectUrl = new URL("/ops-access", request.url);
  redirectUrl.searchParams.set("next", nextPath);

  if (!accessConfig.isConfigured) {
    redirectUrl.searchParams.set("mode", "setup_required");
    return NextResponse.redirect(redirectUrl);
  }

  const sessionCookie = request.cookies.get(OPS_SESSION_COOKIE)?.value;

  if (
    sessionCookie &&
    (await verifyOpsSessionToken(sessionCookie, accessConfig.accessCode))
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/ops/:path*"],
};
