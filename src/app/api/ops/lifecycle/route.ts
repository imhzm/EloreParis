import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getLifecycleOpsSnapshot } from "@/lib/lifecycle-consent-authority";
import { getLifecycleDeliveryOpsSnapshot } from "@/lib/lifecycle-delivery-outbox";
import { getLifecycleProviderReadiness } from "@/lib/lifecycle-provider-readiness";
import { assertOpsRequestAccess, OpsAccessError } from "@/lib/ops-access";

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
          selectedProvider: safeOptionalText(
            providerReadiness.selectedProvider,
            80,
          ),
          region: safeOptionalText(providerReadiness.region, 40),
          fromDomainConfigured: providerReadiness.fromDomainConfigured,
          configurationSetConfigured:
            providerReadiness.configurationSetConfigured,
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
