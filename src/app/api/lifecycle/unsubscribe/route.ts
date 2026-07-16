import { NextResponse } from "next/server";
import {
  LifecycleAuthorityError,
  readLifecycleRequestBody,
  unsubscribeLifecycle,
} from "@/lib/lifecycle-consent-authority";
import {
  assertTrustedMutationRequest,
  RequestHardeningError,
} from "@/lib/request-hardening";
import {
  assertPublicRequestAllowed,
  LIFECYCLE_WITHDRAWAL_THROTTLE_POLICY,
  PublicRequestThrottleError,
} from "@/lib/public-request-throttle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unsubscribeKeys = ["unsubscribeToken"] as const;

export async function DELETE(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    assertPublicRequestAllowed({
      request,
      scope: "lifecycle_unsubscribe",
      policy: LIFECYCLE_WITHDRAWAL_THROTTLE_POLICY,
    });
    const body = await readLifecycleRequestBody(request, unsubscribeKeys);
    if (typeof body.unsubscribeToken !== "string") {
      throw new LifecycleAuthorityError(
        "An unsubscribe token is required.",
        400,
        "unsubscribe_token_required",
      );
    }
    unsubscribeLifecycle(body.unsubscribeToken);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PublicRequestThrottleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        {
          status: error.statusCode,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }
    if (error instanceof RequestHardeningError) {
      return NextResponse.json(
        { error: "The unsubscribe request could not be verified.", code: "mutation_request_untrusted" },
        { status: error.statusCode },
      );
    }
    if (error instanceof LifecycleAuthorityError) {
      return NextResponse.json(
        { error: "The unsubscribe request could not be completed.", code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: "The unsubscribe request could not be completed." },
      { status: 500 },
    );
  }
}
