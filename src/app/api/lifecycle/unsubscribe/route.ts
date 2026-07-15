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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unsubscribeKeys = ["unsubscribeToken"] as const;

export async function DELETE(request: Request) {
  try {
    assertTrustedMutationRequest(request);
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
