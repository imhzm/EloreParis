import type { NextRequest } from "next/server";
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
import {
  assertOpsLoginThrottleAllowed,
  clearOpsLoginThrottleAttempts,
  getOpsLoginThrottlePolicy,
  getOpsLoginThrottleTargets,
  OpsLoginThrottleError,
  recordFailedOpsLoginAttempt,
} from "@/lib/ops-login-throttle";
import { verifyOpsPasswordHash } from "@/lib/ops-password";
import type { OpsAuthMethod } from "@/lib/ops-types";
import {
  RequestHardeningError,
  assertTrustedMutationRequest,
} from "@/lib/request-hardening";

export const dynamic = "force-dynamic";

type LoginRequestBody = {
  accessCode?: string;
  username?: string;
  password?: string;
  nextPath?: string;
};

export async function POST(request: NextRequest) {
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

  try {
    assertTrustedMutationRequest(request);
  } catch (error) {
    if (error instanceof RequestHardeningError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.statusCode },
      );
    }

    throw error;
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
  const throttleTargets = getOpsLoginThrottleTargets({
    username: submittedUsername,
    accessCode: submittedCode,
    request,
  });

  try {
    assertOpsLoginThrottleAllowed(throttleTargets);
  } catch (error) {
    if (error instanceof OpsLoginThrottleError) {
      const throttlePolicy = getOpsLoginThrottlePolicy();

      await logOpsAuditEvent({
        action: "ops_login_rate_limited",
        actor: {
          userId: "unknown",
          name: "Unknown operator",
          role: "system",
        },
        entityType: "ops_session",
        entityId: "rate-limited-login",
        summary: `Rate-limited ops login attempt for ${nextPath}.`,
        metadata: {
          next_path: nextPath,
          retry_after_seconds: error.retryAfterSeconds,
          blocked_until: error.blockedUntil,
          username: submittedUsername || "unknown",
          max_attempts: throttlePolicy.maxAttempts,
          cooldown_seconds: throttlePolicy.cooldownSeconds,
        },
      });

      return NextResponse.json(
        {
          error: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        {
          status: error.statusCode,
          headers: {
            "Retry-After": String(error.retryAfterSeconds),
          },
        },
      );
    }

    throw error;
  }

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
    recordFailedOpsLoginAttempt(throttleTargets);

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

  clearOpsLoginThrottleAttempts(throttleTargets);

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
