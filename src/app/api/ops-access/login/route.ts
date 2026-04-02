import { NextResponse } from "next/server";
import { logOpsAuditEvent } from "@/lib/ops-audit";
import {
  canRoleAccessOpsPath,
  createOpsSessionToken,
  findOpsUserByAccessCode,
  findOpsUserByUsername,
  getDefaultOpsPathForRole,
  getOpsAccessConfig,
  OPS_SESSION_COOKIE,
  OPS_SESSION_MAX_AGE_SECONDS,
  shouldUseSecureOpsCookies,
  sanitizeOpsNextPath,
} from "@/lib/ops-access";
import { verifyOpsPasswordHash } from "@/lib/ops-password";
import type { OpsAuthMethod } from "@/lib/ops-types";

export const dynamic = "force-dynamic";

type LoginRequestBody = {
  accessCode?: string;
  username?: string;
  password?: string;
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
  const submittedUsername = requestBody.username?.trim() ?? "";
  const submittedPassword = requestBody.password ?? "";
  const nextPath = sanitizeOpsNextPath(requestBody.nextPath);

  let authMethod: OpsAuthMethod | null = null;
  let user = null;

  if (submittedUsername || submittedPassword) {
    if (!submittedUsername || !submittedPassword) {
      return NextResponse.json(
        {
          error: "Username and password are both required.",
        },
        { status: 400 },
      );
    }

    const identityUser = findOpsUserByUsername(submittedUsername, accessConfig);

    if (
      identityUser &&
      verifyOpsPasswordHash(submittedPassword, identityUser.passwordHash)
    ) {
      user = identityUser;
      authMethod = "identity_password";
    }
  } else if (submittedCode) {
    const accessCodeUser = findOpsUserByAccessCode(submittedCode, accessConfig);

    if (accessCodeUser) {
      user = accessCodeUser;
      authMethod = "access_code";
    }
  } else {
    return NextResponse.json(
      {
        error: accessConfig.supportsIdentityAuth
          ? "Username and password are required."
          : "Access code is required.",
      },
      { status: 400 },
    );
  }

  if (!user || !authMethod) {
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
        auth_method:
          submittedUsername || submittedPassword
            ? "identity_password"
            : "access_code",
        username: submittedUsername || "unknown",
      },
    });

    return NextResponse.json(
      {
        error:
          submittedUsername || submittedPassword
            ? "Username or password is not valid for the current ops environment."
            : "Access code is not valid for the current ops environment.",
      },
      { status: 401 },
    );
  }

  const finalRedirectTo = canRoleAccessOpsPath(user.role, nextPath)
    ? nextPath
    : getDefaultOpsPathForRole(user.role);
  const sessionToken = await createOpsSessionToken(user, authMethod, accessConfig);
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
      auth_method: authMethod,
      username: user.username ?? "not_applicable",
    },
  });

  return response;
}
