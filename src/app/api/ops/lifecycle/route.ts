import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAwsSesLifecycleEmailAdapter } from "@/lib/aws-ses-lifecycle-email-adapter";
import { getLifecycleOpsSnapshot } from "@/lib/lifecycle-consent-authority";
import { getLifecycleDeliveryOpsSnapshot } from "@/lib/lifecycle-delivery-outbox";
import {
  drainLifecycleEmailDeliveries,
  LifecycleEmailAdapterError,
} from "@/lib/lifecycle-email-provider";
import { getLifecycleProviderReadiness } from "@/lib/lifecycle-provider-readiness";
import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";
import {
  assertTrustedMutationRequest,
  RequestHardeningError,
} from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function boundedCount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

function safeText(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function safeOptionalText(value: unknown, maximumLength: number) {
  const text = safeText(value, maximumLength);
  return text || null;
}

function maskedContactHint(value: unknown) {
  const hint = safeText(value, 160);
  const separator = hint.lastIndexOf("@");
  if (separator <= 0) return "masked-contact";
  const localPart = hint.slice(0, separator);
  const domain = hint.slice(separator + 1);
  const maskedLocal = localPart.includes("*")
    ? localPart
    : `${localPart.slice(0, 1)}***`;
  return domain ? `${maskedLocal}@${domain}` : "masked-contact";
}

function parseLimit(requestUrl: URL) {
  if ([...requestUrl.searchParams.keys()].some((key) => key !== "limit")) {
    return null;
  }
  const rawLimit = requestUrl.searchParams.get("limit");
  if (rawLimit === null) return 50;
  if (!/^\d{1,3}$/.test(rawLimit)) return null;
  const limit = Number(rawLimit);
  return limit >= 1 && limit <= 100 ? limit : null;
}

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/notifications");
    const limit = parseLimit(new URL(request.url));
    if (limit === null) {
      return NextResponse.json(
        { error: "Lifecycle summary query is invalid." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const snapshot = getLifecycleOpsSnapshot(limit);
    const deliverySnapshot = getLifecycleDeliveryOpsSnapshot(limit);
    const providerReadiness = getLifecycleProviderReadiness();
    const recent = snapshot.recent
      .filter(
        (entry) =>
          (entry.kind === "newsletter" || entry.kind === "back_in_stock") &&
          (entry.status === "subscribed" ||
            entry.status === "unsubscribed" ||
            entry.status === "fulfilled"),
      )
      .map((entry) => ({
        id: safeText(entry.id, 80),
        kind: entry.kind,
        status: entry.status,
        contactHint: maskedContactHint(entry.contactHint),
        source: safeText(entry.source, 80),
        createdAt: safeText(entry.createdAt, 40),
        updatedAt: safeText(entry.updatedAt, 40),
        consentGrantedAt: safeText(entry.consentGrantedAt, 40),
        consentWithdrawnAt: safeOptionalText(entry.consentWithdrawnAt, 40),
        fulfilledAt: safeOptionalText(entry.fulfilledAt, 40),
        productSlug: safeOptionalText(entry.productSlug, 160),
        sku: safeOptionalText(entry.sku, 160),
        consentPolicyVersion: safeText(entry.consentPolicyVersion, 80),
        locale: entry.locale === "en" ? "en" : "ar",
        consentEvidence: {
          action: safeText(entry.consentEvidence.action, 80),
          source: safeText(entry.consentEvidence.source, 80),
        },
      }));

    return NextResponse.json(
      {
        lifecycle: {
          metrics: {
            total: boundedCount(snapshot.metrics.total),
            active: boundedCount(snapshot.metrics.subscribed),
            unsubscribed: boundedCount(snapshot.metrics.unsubscribed),
            fulfilled: boundedCount(snapshot.metrics.fulfilled),
            newsletterActive: boundedCount(snapshot.metrics.newsletterSubscribed),
            backInStockActive: boundedCount(snapshot.metrics.backInStockSubscribed),
          },
          recent,
        },
        deliveryOutbox: {
          availability: {
            available: deliverySnapshot.availability.available,
            providerKey: safeOptionalText(
              deliverySnapshot.availability.providerKey,
              80,
            ),
            ...(!deliverySnapshot.availability.available
              ? { code: deliverySnapshot.availability.code }
              : {}),
          },
          metrics: {
            pending: boundedCount(deliverySnapshot.metrics.pending),
            processing: boundedCount(deliverySnapshot.metrics.processing),
            accepted: boundedCount(deliverySnapshot.metrics.accepted),
            failed: boundedCount(deliverySnapshot.metrics.failed),
            deadLetter: boundedCount(deliverySnapshot.metrics.deadLetter),
          },
          recent: deliverySnapshot.recent.map((entry) => ({
            id: safeText(entry.id, 80),
            subscriptionId: safeText(entry.subscriptionId, 80),
            deliveryType: entry.deliveryType,
            providerKey: safeOptionalText(entry.providerKey, 80),
            status: entry.status,
            attempts: boundedCount(entry.attempts),
            maxAttempts: boundedCount(entry.maxAttempts),
            nextAttemptAt: safeText(entry.nextAttemptAt, 40),
            leaseExpiresAt: safeOptionalText(entry.leaseExpiresAt, 40),
            lastErrorCode: safeOptionalText(entry.lastErrorCode, 80),
            createdAt: safeText(entry.createdAt, 40),
            updatedAt: safeText(entry.updatedAt, 40),
            acceptedAt: safeOptionalText(entry.acceptedAt, 40),
            contactHint: maskedContactHint(entry.contactHint),
            productSlug: safeOptionalText(entry.productSlug, 160),
            sku: safeOptionalText(entry.sku, 160),
          })),
        },
        providerReadiness: {
          ready: providerReadiness.ready,
          deliveryEnabled: providerReadiness.deliveryEnabled,
          providerEnabled: providerReadiness.providerEnabled,
          selectedProvider: safeOptionalText(
            providerReadiness.selectedProvider,
            80,
          ),
          providerSupported: providerReadiness.providerSupported,
          region: safeOptionalText(providerReadiness.region, 40),
          regionConfigured: providerReadiness.regionConfigured,
          fromDomainConfigured: providerReadiness.fromDomainConfigured,
          configurationSetConfigured:
            providerReadiness.configurationSetConfigured,
          timeoutValid: providerReadiness.timeoutValid,
          timeoutOverrideConfigured:
            providerReadiness.timeoutOverrideConfigured,
          callbackConfigured: providerReadiness.callbackConfigured,
          blockers: providerReadiness.blockers.map((code) => safeText(code, 80)),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { error: "Unable to load the protected lifecycle consent summary." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

function parseDrainLimit(value: unknown) {
  if (value === undefined) return 20;
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return null;
  return value >= 1 && value <= 50 ? value : null;
}

/**
 * Drains the lifecycle delivery outbox.
 *
 * The outbox had no caller anywhere in the application: rows were enqueued and
 * nothing ever sent them. The order outbox has had /api/ops/outbox to drain it
 * from the start; this is the same shape for the lifecycle one, so an operator
 * who can see the queue can also work it.
 *
 * Nothing here decides whether mail may be sent. drainLifecycleEmailDeliveries
 * re-checks getLifecycleDeliveryAvailability and refuses unless every gate is
 * open, and the SES adapter throws at construction on a placeholder config — so
 * on a stock deployment this answers 503 and sends nothing. The response
 * carries counts only: no address, no subject, no payload.
 */
export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    await assertOpsRequestAccess(request, "/ops/notifications");

    const body = (await request.json().catch(() => ({}))) as { limit?: unknown };
    const limit = parseDrainLimit(body.limit);
    if (limit === null) {
      return NextResponse.json(
        { error: "Lifecycle drain limit is invalid." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const summary = await drainLifecycleEmailDeliveries({
      adapter: createAwsSesLifecycleEmailAdapter(),
      limit,
    });

    return NextResponse.json(
      {
        drain: {
          claimed: boundedCount(summary.claimed),
          accepted: boundedCount(summary.accepted),
          retried: boundedCount(summary.retried),
          failed: boundedCount(summary.failed),
        },
        deliveryOutbox: {
          metrics: getLifecycleDeliveryOpsSnapshot(1).metrics,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RequestHardeningError) {
      return NextResponse.json(
        { error: error.message, code: "untrusted_request" },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (error instanceof OpsAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (error instanceof LifecycleEmailAdapterError) {
      // Gate refusals and provider-config failures are expected states, not
      // faults. The code is safe to surface; the message is not guaranteed to be.
      return NextResponse.json(
        { error: "Lifecycle delivery is not available.", code: error.code },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { error: "Unable to drain the lifecycle delivery outbox." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
