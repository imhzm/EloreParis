import { NextResponse } from "next/server";
import { OPS_SESSION_COOKIE, shouldUseSecureOpsCookies } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

export async function POST() {
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

  return response;
}
