import { NextResponse } from "next/server";
import {
  createOpsSessionToken,
  getOpsAccessConfig,
  OPS_SESSION_COOKIE,
  OPS_SESSION_MAX_AGE_SECONDS,
  sanitizeOpsNextPath,
  shouldUseSecureOpsCookies,
} from "@/lib/ops-access";

export const dynamic = "force-dynamic";

type LoginRequestBody = {
  accessCode?: string;
  nextPath?: string;
};

export async function POST(request: Request) {
  const accessConfig = getOpsAccessConfig();

  if (!accessConfig.isConfigured) {
    return NextResponse.json(
      {
        error:
          "Ops access is not configured yet. Set OPS_ACCESS_CODE before using the internal gate.",
      },
      { status: 503 },
    );
  }

  let requestBody: LoginRequestBody;

  try {
    requestBody = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const submittedCode = requestBody.accessCode?.trim() ?? "";

  if (!submittedCode) {
    return NextResponse.json(
      {
        error: "Access code is required.",
      },
      { status: 400 },
    );
  }

  if (submittedCode !== accessConfig.accessCode) {
    return NextResponse.json(
      {
        error: "Access code is not valid for the current ops environment.",
      },
      { status: 401 },
    );
  }

  const redirectTo = sanitizeOpsNextPath(requestBody.nextPath);
  const sessionToken = await createOpsSessionToken(accessConfig.accessCode);
  const response = NextResponse.json({
    ok: true,
    redirectTo,
  });

  response.cookies.set({
    name: OPS_SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureOpsCookies(),
    path: "/",
    maxAge: OPS_SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
