import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  canRoleAccessOpsPath,
  createOpsSessionToken,
  findOpsUserByAccessCode,
  getDefaultOpsPathForRole,
  getOpsAccessConfig,
  OPS_SESSION_COOKIE,
  OPS_SESSION_MAX_AGE_SECONDS,
  shouldUseSecureOpsCookies,
  sanitizeOpsNextPath,
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
          "Ops access is not configured yet. Set OPS_ACCESS_USERS_JSON or the legacy OPS_ACCESS_CODE before using the internal gate.",
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
  const nextPath = sanitizeOpsNextPath(requestBody.nextPath);

  if (!submittedCode) {
    return NextResponse.json(
      {
        error: "Access code is required.",
      },
      { status: 400 },
    );
  }

  const user = findOpsUserByAccessCode(submittedCode, accessConfig);

  if (!user) {
    await logOpsAuditEvent({
      action: "ops_login_failure",
      actor: {
        userId: "unknown",
        name: "Unknown operator",
        role: "system",
      },
      entityType: "ops_session",
      entityId: "failed-login",
      summary: `Failed ops login attempt for ${nextPath}.`,
      metadata: {
        next_path: nextPath,
      },
    });

    return NextResponse.json(
      {
        error: "Access code is not valid for the current ops environment.",
      },
      { status: 401 },
    );
  }

  const finalRedirectTo = canRoleAccessOpsPath(user.role, nextPath)
    ? nextPath
    : getDefaultOpsPathForRole(user.role);
  const sessionToken = await createOpsSessionToken(user, accessConfig);
  const response = NextResponse.json({
    ok: true,
    redirectTo: finalRedirectTo,
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

  await logOpsAuditEvent({
    action: "ops_login_success",
    actor: {
      userId: user.id,
      name: user.name,
      role: user.role,
    },
    entityType: "ops_session",
    entityId: user.id,
    summary: `${user.name} opened an ops session.`,
    metadata: {
      next_path: nextPath,
      role: user.role,
    },
  });

  return response;
}
