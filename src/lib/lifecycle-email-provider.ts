import "server-only";

import type { DatabaseSync } from "node:sqlite";
import { runAuthorityTransaction } from "@/lib/authority-database";
import {
  resolveLifecycleDeliveryEnvelope,
} from "@/lib/lifecycle-consent-authority";
import {
  cancelLifecycleDeliveriesForSubscriptionWithDatabase,
  claimLifecycleDeliveryJobs,
  getLifecycleDeliveryAvailability,
  markLifecycleDeliveryAccepted,
  markLifecycleDeliveryFailed,
  type ClaimedLifecycleDelivery,
} from "@/lib/lifecycle-delivery-outbox";
import {
  renderLifecycleEmail,
  type RenderedLifecycleEmail,
} from "@/lib/lifecycle-email-templates";
import {
  ProviderEventAuthorityError,
  readAuthenticatedProviderCallback,
} from "@/lib/provider-event-authority";

const DEFAULT_ADAPTER_TIMEOUT_MS = 10_000;
const MIN_ADAPTER_TIMEOUT_MS = 1_000;
const MAX_ADAPTER_TIMEOUT_MS = 30_000;
const CALLBACK_KEYS = [
  "eventId",
  "providerMessageId",
  "eventType",
  "occurredAt",
] as const;

export type LifecycleEmailEnvelope = ReturnType<
  typeof resolveLifecycleDeliveryEnvelope
>;

export type LifecycleEmailSendContext = {
  signal: AbortSignal;
  idempotencyKey: string;
};

export type LifecycleEmailPayload = {
  destinationEmail: string;
  message: RenderedLifecycleEmail;
};

export type LifecycleEmailAdapterResponse = {
  providerMessageId: string;
};

export interface LifecycleEmailAdapter {
  readonly providerKey: string;
  readonly timeoutMs?: number;
  send(
    payload: LifecycleEmailPayload,
    context: LifecycleEmailSendContext,
  ): Promise<LifecycleEmailAdapterResponse>;
}

export class LifecycleEmailAdapterError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor({
    code,
    retryable,
    message = "Lifecycle email provider request failed.",
  }: {
    code: string;
    retryable: boolean;
    message?: string;
  }) {
    super(message);
    this.name = "LifecycleEmailAdapterError";
    this.code = sanitizeProviderCode(code);
    this.retryable = retryable;
  }
}

export class LifecycleEmailWebhookError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    statusCode = 400,
    code = "lifecycle_provider_event_invalid",
  ) {
    super(message);
    this.name = "LifecycleEmailWebhookError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export type LifecycleEmailProviderEventType =
  | "delivered"
  | "bounced"
  | "complained";

function sanitizeProviderCode(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^[a-z][a-z0-9_:-]{0,79}$/.test(normalized)
    ? normalized
    : "provider_request_failed";
}

function normalizeProviderKey(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.:-]{1,79}$/.test(normalized)) {
    throw new LifecycleEmailAdapterError({
      code: "provider_config_invalid",
      retryable: false,
    });
  }
  return normalized;
}

function normalizeTimeoutMs(value: number | undefined) {
  if (value === undefined) return DEFAULT_ADAPTER_TIMEOUT_MS;
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_ADAPTER_TIMEOUT_MS ||
    value > MAX_ADAPTER_TIMEOUT_MS
  ) {
    throw new LifecycleEmailAdapterError({
      code: "provider_config_invalid",
      retryable: false,
    });
  }
  return value;
}

function resolvePublicSiteOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "");
    if (url.protocol !== "https:" || url.username || url.password) throw new Error();
    return url.origin;
  } catch {
    throw new LifecycleEmailAdapterError({
      code: "provider_config_invalid",
      retryable: false,
    });
  }
}

function normalizeProviderMessageId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized &&
    normalized.length <= 200 &&
    !/[\u0000-\u001f\u007f]/.test(normalized)
    ? normalized
    : null;
}

function classifyProviderFailure(error: unknown) {
  if (error instanceof LifecycleEmailAdapterError) {
    return { code: error.code, retryable: error.retryable };
  }
  return { code: "provider_request_failed", retryable: true };
}

async function sendWithTimeout(
  adapter: LifecycleEmailAdapter,
  payload: LifecycleEmailPayload,
  event: ClaimedLifecycleDelivery,
) {
  const controller = new AbortController();
  const timeoutMs = normalizeTimeoutMs(adapter.timeoutMs);
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort();
      reject(
        new LifecycleEmailAdapterError({
          code: "provider_timeout",
          retryable: true,
        }),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      adapter.send(payload, {
        signal: controller.signal,
        idempotencyKey: event.dedupeKey,
      }),
      timeout,
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

async function processClaimedDelivery(
  event: ClaimedLifecycleDelivery,
  adapter: LifecycleEmailAdapter,
) {
  try {
    const envelope = resolveLifecycleDeliveryEnvelope(event);
    const origin = resolvePublicSiteOrigin();
    const siteUrl = new URL(`/${envelope.locale}`, origin).toString();
    const message = renderLifecycleEmail(
      envelope.deliveryType === "back_in_stock_available"
        ? {
            deliveryType: envelope.deliveryType,
            locale: envelope.locale,
            siteUrl,
            unsubscribeUrl: envelope.unsubscribeUrl,
            productUrl: new URL(
              `/${envelope.locale}/product/${envelope.productSlug}`,
              origin,
            ).toString(),
          }
        : {
            deliveryType: envelope.deliveryType,
            locale: envelope.locale,
            siteUrl,
            unsubscribeUrl: envelope.unsubscribeUrl,
          },
    );
    const response = await sendWithTimeout(
      adapter,
      { destinationEmail: envelope.destinationEmail, message },
      event,
    );
    const providerMessageId = normalizeProviderMessageId(
      response?.providerMessageId,
    );
    if (!providerMessageId) {
      throw new LifecycleEmailAdapterError({
        code: "provider_response_invalid",
        retryable: false,
      });
    }
    if (!markLifecycleDeliveryAccepted(event, providerMessageId)) {
      throw new LifecycleEmailAdapterError({
        code: "lifecycle_delivery_lease_invalid",
        retryable: true,
      });
    }
    return "accepted" as const;
  } catch (error) {
    const failure = classifyProviderFailure(error);
    markLifecycleDeliveryFailed(event, {
      errorCode: failure.code,
      retryable: failure.retryable,
    });
    return failure.retryable ? ("retried" as const) : ("failed" as const);
  }
}

export async function drainLifecycleEmailDeliveries({
  adapter,
  limit,
}: {
  adapter: LifecycleEmailAdapter;
  limit?: number;
}) {
  const availability = getLifecycleDeliveryAvailability();
  if (!availability.available) {
    throw new LifecycleEmailAdapterError({
      code: availability.code,
      retryable: true,
    });
  }
  if (normalizeProviderKey(adapter.providerKey) !== availability.providerKey) {
    throw new LifecycleEmailAdapterError({
      code: "provider_config_mismatch",
      retryable: false,
    });
  }
  normalizeTimeoutMs(adapter.timeoutMs);

  const claimed = claimLifecycleDeliveryJobs({ limit });
  const summary = {
    claimed: claimed.length,
    accepted: 0,
    retried: 0,
    failed: 0,
  };
  for (const event of claimed) {
    const outcome = await processClaimedDelivery(event, adapter);
    summary[outcome] += 1;
  }
  return summary;
}

function requireWebhookString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
) {
  const value = body[key];
  if (typeof value !== "string") {
    throw new LifecycleEmailWebhookError(`${key} is required.`);
  }
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > maxLength ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    throw new LifecycleEmailWebhookError(`${key} is invalid.`);
  }
  return normalized;
}

function normalizeProviderEventType(
  value: string,
): LifecycleEmailProviderEventType | null {
  return value === "delivered" || value === "bounced" || value === "complained"
    ? value
    : null;
}

type LifecycleProviderEventRow = {
  delivery_id: string;
  provider_message_id: string;
  event_type: LifecycleEmailProviderEventType;
  payload_hash: string;
};

export type LifecycleEmailProviderEventInput = {
  providerKey: string;
  eventId: string;
  providerMessageId: string;
  eventType: LifecycleEmailProviderEventType;
  occurredAt: string;
  payloadHash: string;
};

function assertMatchingProviderEvent(
  row: LifecycleProviderEventRow,
  expected: LifecycleProviderEventRow,
) {
  if (
    row.delivery_id !== expected.delivery_id ||
    row.provider_message_id !== expected.provider_message_id ||
    row.event_type !== expected.event_type ||
    row.payload_hash !== expected.payload_hash
  ) {
    throw new LifecycleEmailWebhookError(
      "The provider event id was already used with a different payload.",
      409,
      "provider_event_conflict",
    );
  }
}

function normalizeAuthorityEventInput(
  input: LifecycleEmailProviderEventInput,
) {
  const eventId = requireWebhookString({ eventId: input.eventId }, "eventId", 200);
  const providerMessageId = requireWebhookString(
    { providerMessageId: input.providerMessageId },
    "providerMessageId",
    200,
  );
  const eventType = normalizeProviderEventType(input.eventType);
  const occurredAt = requireWebhookString(
    { occurredAt: input.occurredAt },
    "occurredAt",
    80,
  );
  const payloadHash = requireWebhookString(
    { payloadHash: input.payloadHash },
    "payloadHash",
    128,
  ).toLowerCase();
  if (
    !eventType ||
    Number.isNaN(Date.parse(occurredAt)) ||
    !/^[a-f0-9]{64}$/u.test(payloadHash)
  ) {
    throw new LifecycleEmailWebhookError(
      "The provider event type, timestamp, or payload hash is invalid.",
    );
  }

  return {
    providerKey: normalizeProviderKey(input.providerKey),
    eventId,
    providerMessageId,
    eventType,
    occurredAtIso: new Date(occurredAt).toISOString(),
    payloadHash,
  };
}

export function processLifecycleEmailProviderEventWithDatabase(
  database: DatabaseSync,
  input: LifecycleEmailProviderEventInput,
) {
  const event = normalizeAuthorityEventInput(input);
  const delivery = database.prepare(`
    SELECT id, subscription_id, consent_revision, delivery_type
    FROM authority_lifecycle_delivery_outbox
    WHERE provider_key = ? AND provider_message_id = ? AND status = 'accepted'
    LIMIT 1
  `).get(event.providerKey, event.providerMessageId) as
    | {
        id: string;
        subscription_id: string;
        consent_revision: number;
        delivery_type: "newsletter_confirmation" | "back_in_stock_available";
      }
    | undefined;
  if (!delivery) {
    throw new LifecycleEmailWebhookError(
      "The lifecycle provider event target was not found.",
      404,
      "provider_event_target_not_found",
    );
  }

  const expected: LifecycleProviderEventRow = {
    delivery_id: delivery.id,
    provider_message_id: event.providerMessageId,
    event_type: event.eventType,
    payload_hash: event.payloadHash,
  };
  const existing = database.prepare(`
    SELECT delivery_id, provider_message_id, event_type, payload_hash
    FROM authority_lifecycle_provider_events
    WHERE provider_key = ? AND event_id = ?
  `).get(event.providerKey, event.eventId) as LifecycleProviderEventRow | undefined;
  if (existing) {
    assertMatchingProviderEvent(existing, expected);
    return { accepted: true as const, replayed: true as const };
  }

  database.prepare(`
    INSERT INTO authority_lifecycle_provider_events (
      provider_key, event_id, delivery_id, provider_message_id, event_type,
      payload_hash, occurred_at, processed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.providerKey,
    event.eventId,
    delivery.id,
    event.providerMessageId,
    event.eventType,
    event.payloadHash,
    event.occurredAtIso,
    new Date().toISOString(),
  );

  if (
    event.eventType === "delivered" &&
    delivery.delivery_type === "back_in_stock_available"
  ) {
    database.prepare(`
      UPDATE authority_lifecycle_subscriptions
      SET status = 'fulfilled', fulfilled_at = ?, updated_at = ?
      WHERE id = ? AND status = 'subscribed' AND consent_revision = ?
    `).run(
      event.occurredAtIso,
      event.occurredAtIso,
      delivery.subscription_id,
      delivery.consent_revision,
    );
  } else if (event.eventType === "complained") {
    const suppressed = database.prepare(`
      UPDATE authority_lifecycle_subscriptions
      SET status = 'unsubscribed', contact_email = '',
          consent_withdrawn_at = ?, consent_revision = consent_revision + 1,
          updated_at = ?
      WHERE id = ? AND status = 'subscribed' AND consent_revision = ?
    `).run(
      event.occurredAtIso,
      event.occurredAtIso,
      delivery.subscription_id,
      delivery.consent_revision,
    ) as { changes: number | bigint };
    if (Number(suppressed.changes) === 1) {
      cancelLifecycleDeliveriesForSubscriptionWithDatabase(
        database,
        delivery.subscription_id,
      );
    }
  }

  return { accepted: true as const, replayed: false as const };
}

export function processLifecycleEmailProviderEvent(
  input: LifecycleEmailProviderEventInput,
) {
  return runAuthorityTransaction((database) =>
    processLifecycleEmailProviderEventWithDatabase(database, input),
  );
}

export async function processLifecycleEmailProviderWebhook({
  request,
  providerKey,
  callbackSecret,
}: {
  request: Request;
  providerKey: string;
  callbackSecret: string;
}) {
  let callback: Awaited<ReturnType<typeof readAuthenticatedProviderCallback>>;
  try {
    callback = await readAuthenticatedProviderCallback(
      request,
      CALLBACK_KEYS,
      callbackSecret,
    );
  } catch (error) {
    if (error instanceof ProviderEventAuthorityError) {
      throw new LifecycleEmailWebhookError(
        error.message,
        error.statusCode,
        error.code,
      );
    }
    throw error;
  }

  const eventId = requireWebhookString(callback.body, "eventId", 200);
  const providerMessageId = requireWebhookString(
    callback.body,
    "providerMessageId",
    200,
  );
  const eventType = normalizeProviderEventType(
    requireWebhookString(callback.body, "eventType", 40).toLowerCase(),
  );
  const occurredAt = requireWebhookString(callback.body, "occurredAt", 80);
  if (!eventType || Number.isNaN(Date.parse(occurredAt))) {
    throw new LifecycleEmailWebhookError(
      "The provider event type or timestamp is invalid.",
    );
  }

  return processLifecycleEmailProviderEvent({
    providerKey,
    eventId,
    providerMessageId,
    eventType,
    occurredAt,
    payloadHash: callback.payloadHash,
  });
}
