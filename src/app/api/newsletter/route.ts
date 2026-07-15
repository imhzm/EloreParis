import { NextResponse } from "next/server";
import {
  getLifecycleCollectionAvailability,
  LifecycleAuthorityError,
  readLifecycleRequestBody,
  subscribeLifecycle,
  unsubscribeLifecycle,
} from "@/lib/lifecycle-consent-authority";
import {
  assertTrustedMutationRequest,
  RequestHardeningError,
} from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subscribeKeys = ["email", "consent", "locale"] as const;
const unsubscribeKeys = ["unsubscribeToken"] as const;

function localeFromBody(body: Record<string, unknown>) {
  if (body.locale === undefined) return "ar" as const;
  if (body.locale !== "ar" && body.locale !== "en") {
    throw new LifecycleAuthorityError("A supported locale is required.");
  }
  return body.locale;
}

function lifecycleErrorResponse(error: unknown) {
  if (error instanceof RequestHardeningError) {
    return NextResponse.json(
      { error: error.message, code: "mutation_request_untrusted" },
      { status: error.statusCode },
    );
  }
  if (error instanceof LifecycleAuthorityError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }
  return NextResponse.json(
    { error: "Unable to update the newsletter preference." },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    const availability = getLifecycleCollectionAvailability();
    if (!availability.available) {
      return NextResponse.json(
        {
          error: "Newsletter collection is not enabled for this release.",
          code: availability.code,
        },
        { status: 503 },
      );
    }
    const body = await readLifecycleRequestBody(request, subscribeKeys);
    const result = subscribeLifecycle({
      kind: "newsletter",
      email: typeof body.email === "string" ? body.email : "",
      consent: body.consent === true,
      source: "home_newsletter",
      locale: localeFromBody(body),
    });
    return NextResponse.json({
      success: true,
      message: "Your newsletter preference has been recorded.",
      subscription: result.subscription,
    });
  } catch (error) {
    return lifecycleErrorResponse(error);
  }
}

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
    return NextResponse.json({
      success: true,
      message: "The newsletter preference has been withdrawn.",
    });
  } catch (error) {
    return lifecycleErrorResponse(error);
  }
}
