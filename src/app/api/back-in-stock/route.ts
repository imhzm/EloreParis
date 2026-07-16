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
import {
  assertPublicRequestAllowed,
  LIFECYCLE_COLLECTION_THROTTLE_POLICY,
  LIFECYCLE_WITHDRAWAL_THROTTLE_POLICY,
  PublicRequestThrottleError,
} from "@/lib/public-request-throttle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subscribeKeys = ["email", "productSlug", "sku", "consent", "locale"] as const;
const unsubscribeKeys = ["unsubscribeToken"] as const;

function localeFromBody(body: Record<string, unknown>) {
  if (body.locale === undefined) return "ar" as const;
  if (body.locale !== "ar" && body.locale !== "en") {
    throw new LifecycleAuthorityError("A supported locale is required.");
  }
  return body.locale;
}

function lifecycleErrorResponse(error: unknown) {
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
    { error: "Unable to update the back-in-stock preference." },
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
          error: "Back-in-stock collection is not enabled for this release.",
          code: availability.code,
        },
        { status: 503 },
      );
    }
    const body = await readLifecycleRequestBody(request, subscribeKeys);
    assertPublicRequestAllowed({
      request,
      scope: "back_in_stock_subscribe",
      policy: LIFECYCLE_COLLECTION_THROTTLE_POLICY,
      subject: typeof body.email === "string" ? body.email : undefined,
    });
    const result = subscribeLifecycle({
      kind: "back_in_stock",
      email: typeof body.email === "string" ? body.email : "",
      consent: body.consent === true,
      source: "pdp_back_in_stock",
      locale: localeFromBody(body),
      productSlug:
        typeof body.productSlug === "string" ? body.productSlug : undefined,
      sku: typeof body.sku === "string" ? body.sku : undefined,
    });
    return NextResponse.json({
      success: true,
      message: "Your back-in-stock preference has been recorded.",
      subscription: result.subscription,
    });
  } catch (error) {
    return lifecycleErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertTrustedMutationRequest(request);
    assertPublicRequestAllowed({
      request,
      scope: "back_in_stock_unsubscribe",
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
    return NextResponse.json({
      success: true,
      message: "The back-in-stock preference has been withdrawn.",
    });
  } catch (error) {
    return lifecycleErrorResponse(error);
  }
}
