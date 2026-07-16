import "server-only";

import {
  createHash,
  createVerify,
  X509Certificate,
} from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { runAuthorityTransaction } from "@/lib/authority-database";
import {
  processLifecycleEmailProviderEventWithDatabase,
} from "@/lib/lifecycle-email-provider";

const MAX_SNS_BODY_BYTES = 256 * 1024;
const MAX_CERTIFICATE_BYTES = 64 * 1024;
const CERTIFICATE_FETCH_TIMEOUT_MS = 5_000;
const CERTIFICATE_CACHE_MS = 60 * 60 * 1_000;
const SNS_TYPES = new Set([
  "Notification",
  "SubscriptionConfirmation",
  "UnsubscribeConfirmation",
]);
const OUTER_KEYS = new Set([
  "Type",
  "MessageId",
  "TopicArn",
  "Subject",
  "Message",
  "Timestamp",
  "SignatureVersion",
  "Signature",
  "SigningCertURL",
  "UnsubscribeURL",
  "Token",
  "SubscribeURL",
]);

type AwsSnsMessageType =
  | "Notification"
  | "SubscriptionConfirmation"
  | "UnsubscribeConfirmation";

type AwsSnsEnvelope = {
  Type: AwsSnsMessageType;
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: "1" | "2";
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL?: string;
  Token?: string;
  SubscribeURL?: string;
};

type CachedCertificate = {
  pem: string;
  expiresAt: number;
};

export type AwsSnsCertificateLoader = (
  certificateUrl: URL,
  signal: AbortSignal,
) => Promise<string>;

export class AwsSnsLifecycleCallbackError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    statusCode = 400,
    code = "sns_callback_invalid",
  ) {
    super(message);
    this.name = "AwsSnsLifecycleCallbackError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const certificateCache = new Map<string, CachedCertificate>();

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function requireObject(value: unknown, code = "sns_callback_invalid") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS payload must be a JSON object.",
      400,
      code,
    );
  }
  return value as Record<string, unknown>;
}

function requireString(
  object: Record<string, unknown>,
  key: string,
  maximumLength: number,
  allowMultiline = false,
) {
  const value = object[key];
  if (typeof value !== "string") {
    throw new AwsSnsLifecycleCallbackError(`${key} is required.`);
  }
  if (
    !value ||
    value.length > maximumLength ||
    (allowMultiline
      ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
      : /[\u0000-\u001f\u007f]/u.test(value))
  ) {
    throw new AwsSnsLifecycleCallbackError(`${key} is invalid.`);
  }
  return value;
}

function optionalString(
  object: Record<string, unknown>,
  key: string,
  maximumLength: number,
) {
  if (object[key] === undefined) return undefined;
  return requireString(object, key, maximumLength);
}

async function readBoundedUtf8(
  stream: ReadableStream<Uint8Array> | null,
  maximumBytes: number,
  tooLargeCode: string,
) {
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw new AwsSnsLifecycleCallbackError(
          "The SNS payload is too large.",
          413,
          tooLargeCode,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS payload must be valid UTF-8.",
      400,
      "sns_callback_encoding_invalid",
    );
  }
}

function parseExpectedTopicArn(topicArn: string, expectedRegion: string) {
  const match = /^arn:(aws|aws-cn|aws-us-gov):sns:([a-z0-9-]{3,32}):(\d{12}):([A-Za-z0-9_-]{1,256})$/u.exec(
    topicArn,
  );
  if (!match || match[2] !== expectedRegion) {
    throw new AwsSnsLifecycleCallbackError(
      "The configured SNS topic ARN or region is invalid.",
      503,
      "sns_callback_not_configured",
    );
  }
  return { partition: match[1], region: match[2] };
}

function validateSigningCertificateUrl(
  rawUrl: string,
  partition: string,
  region: string,
) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS signing certificate URL is invalid.",
      400,
      "sns_signing_certificate_invalid",
    );
  }

  const expectedHost =
    partition === "aws-cn"
      ? `sns.${region}.amazonaws.com.cn`
      : `sns.${region}.amazonaws.com`;
  if (
    url.protocol !== "https:" ||
    url.hostname !== expectedHost ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    !/^\/SimpleNotificationService-[A-Za-z0-9_-]{16,200}\.pem$/u.test(
      url.pathname,
    )
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS signing certificate URL is not an approved AWS SNS URL.",
      400,
      "sns_signing_certificate_invalid",
    );
  }
  return url;
}

function parseEnvelope(rawBody: string): AwsSnsEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS payload is not valid JSON.",
      400,
      "sns_callback_json_invalid",
    );
  }
  const body = requireObject(parsed);
  if (Object.keys(body).some((key) => !OUTER_KEYS.has(key))) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS payload contains unsupported fields.",
      400,
      "sns_callback_shape_invalid",
    );
  }

  const type = requireString(body, "Type", 40);
  if (!SNS_TYPES.has(type)) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS message type is unsupported.",
      400,
      "sns_callback_type_unsupported",
    );
  }
  const signatureVersion = requireString(body, "SignatureVersion", 4);
  if (signatureVersion !== "1" && signatureVersion !== "2") {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS signature version is unsupported.",
      400,
      "sns_signature_version_unsupported",
    );
  }
  const timestamp = requireString(body, "Timestamp", 80);
  if (Number.isNaN(Date.parse(timestamp))) {
    throw new AwsSnsLifecycleCallbackError("The SNS timestamp is invalid.");
  }
  const signature = requireString(body, "Signature", 4096);
  if (
    signature.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/u.test(signature)
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS signature encoding is invalid.",
      400,
      "sns_signature_invalid",
    );
  }

  const envelope: AwsSnsEnvelope = {
    Type: type as AwsSnsMessageType,
    MessageId: requireString(body, "MessageId", 200),
    TopicArn: requireString(body, "TopicArn", 512),
    Message: requireString(body, "Message", 220 * 1024, true),
    Timestamp: timestamp,
    SignatureVersion: signatureVersion,
    Signature: signature,
    SigningCertURL: requireString(body, "SigningCertURL", 2048),
    Subject: optionalString(body, "Subject", 200),
    UnsubscribeURL: optionalString(body, "UnsubscribeURL", 2048),
    Token: optionalString(body, "Token", 2048),
    SubscribeURL: optionalString(body, "SubscribeURL", 2048),
  };

  if (envelope.Type === "Notification") {
    if (envelope.Token || envelope.SubscribeURL) {
      throw new AwsSnsLifecycleCallbackError(
        "The SNS notification shape is invalid.",
        400,
        "sns_callback_shape_invalid",
      );
    }
  } else if (
    !envelope.Token ||
    !envelope.SubscribeURL ||
    envelope.Subject ||
    envelope.UnsubscribeURL
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS confirmation shape is invalid.",
      400,
      "sns_callback_shape_invalid",
    );
  }

  return envelope;
}

export function createAwsSnsStringToSign(envelope: AwsSnsEnvelope) {
  const fields: Array<[string, string | undefined]> =
    envelope.Type === "Notification"
      ? [
          ["Message", envelope.Message],
          ["MessageId", envelope.MessageId],
          ["Subject", envelope.Subject],
          ["Timestamp", envelope.Timestamp],
          ["TopicArn", envelope.TopicArn],
          ["Type", envelope.Type],
        ]
      : [
          ["Message", envelope.Message],
          ["MessageId", envelope.MessageId],
          ["SubscribeURL", envelope.SubscribeURL],
          ["Timestamp", envelope.Timestamp],
          ["Token", envelope.Token],
          ["TopicArn", envelope.TopicArn],
          ["Type", envelope.Type],
        ];
  return fields
    .filter((field): field is [string, string] => field[1] !== undefined)
    .map(([name, value]) => `${name}\n${value}\n`)
    .join("");
}

async function defaultCertificateLoader(url: URL, signal: AbortSignal) {
  const cached = certificateCache.get(url.toString());
  if (cached && cached.expiresAt > Date.now()) return cached.pem;

  const response = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal,
    headers: { accept: "application/x-pem-file, text/plain" },
  });
  if (!response.ok) {
    throw new AwsSnsLifecycleCallbackError(
      "Unable to retrieve the SNS signing certificate.",
      503,
      "sns_signing_certificate_unavailable",
    );
  }
  const pem = await readBoundedUtf8(
    response.body,
    MAX_CERTIFICATE_BYTES,
    "sns_signing_certificate_too_large",
  );
  let certificate: X509Certificate;
  try {
    certificate = new X509Certificate(pem);
  } catch {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS signing certificate is invalid.",
      503,
      "sns_signing_certificate_invalid",
    );
  }
  const validFrom = Date.parse(certificate.validFrom);
  const validTo = Date.parse(certificate.validTo);
  const now = Date.now();
  if (
    Number.isNaN(validFrom) ||
    Number.isNaN(validTo) ||
    now < validFrom ||
    now > validTo
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS signing certificate is outside its validity period.",
      503,
      "sns_signing_certificate_invalid",
    );
  }
  certificateCache.set(url.toString(), {
    pem,
    expiresAt: Math.min(now + CERTIFICATE_CACHE_MS, validTo),
  });
  return pem;
}

async function verifyEnvelopeSignature(
  envelope: AwsSnsEnvelope,
  certificateUrl: URL,
  certificateLoader: AwsSnsCertificateLoader,
) {
  const timeoutSignal = AbortSignal.timeout(CERTIFICATE_FETCH_TIMEOUT_MS);
  let publicKey: string;
  try {
    publicKey = await certificateLoader(certificateUrl, timeoutSignal);
  } catch (error) {
    if (error instanceof AwsSnsLifecycleCallbackError) throw error;
    throw new AwsSnsLifecycleCallbackError(
      "Unable to verify the SNS signing certificate.",
      503,
      "sns_signing_certificate_unavailable",
    );
  }

  try {
    const verifier = createVerify(
      envelope.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1",
    );
    verifier.update(createAwsSnsStringToSign(envelope), "utf8");
    verifier.end();
    return verifier.verify(publicKey, Buffer.from(envelope.Signature, "base64"));
  } catch {
    return false;
  }
}

function parseSesEvent(message: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS message does not contain valid SES event JSON.",
      400,
      "ses_event_json_invalid",
    );
  }
  const event = requireObject(parsed, "ses_event_invalid");
  const eventType = event.eventType ?? event.notificationType;
  if (
    event.eventType !== undefined &&
    event.notificationType !== undefined &&
    event.eventType !== event.notificationType
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SES event type is ambiguous.",
      400,
      "ses_event_invalid",
    );
  }

  const mappings = {
    Delivery: { detailKey: "delivery", authorityType: "delivered" },
    Bounce: { detailKey: "bounce", authorityType: "bounced" },
    Complaint: { detailKey: "complaint", authorityType: "complained" },
  } as const;
  if (
    typeof eventType !== "string" ||
    !Object.prototype.hasOwnProperty.call(mappings, eventType)
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SES event type is unsupported.",
      400,
      "ses_event_type_unsupported",
    );
  }
  const mapping = mappings[eventType as keyof typeof mappings];
  const mail = requireObject(event.mail, "ses_event_invalid");
  const detail = requireObject(event[mapping.detailKey], "ses_event_invalid");
  const providerMessageId = requireString(mail, "messageId", 200);
  const occurredAt = requireString(detail, "timestamp", 80);
  if (Number.isNaN(Date.parse(occurredAt))) {
    throw new AwsSnsLifecycleCallbackError(
      "The SES event timestamp is invalid.",
      400,
      "ses_event_invalid",
    );
  }

  return {
    providerMessageId,
    eventType: mapping.authorityType,
    occurredAt: new Date(occurredAt).toISOString(),
  };
}

function inspectExistingOuterMessage(
  database: DatabaseSync,
  envelope: AwsSnsEnvelope,
  payloadHash: string,
) {
  const existing = database.prepare(`
    SELECT message_type, payload_hash
    FROM authority_lifecycle_sns_messages
    WHERE topic_arn = ? AND message_id = ?
  `).get(envelope.TopicArn, envelope.MessageId) as
    | { message_type: AwsSnsMessageType; payload_hash: string }
    | undefined;
  if (!existing) return false;
  if (
    existing.message_type !== envelope.Type ||
    existing.payload_hash !== payloadHash
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS message id was already used with a different payload.",
      409,
      "sns_message_conflict",
    );
  }
  return true;
}

function recordOuterMessage(
  database: DatabaseSync,
  envelope: AwsSnsEnvelope,
  payloadHash: string,
) {
  database.prepare(`
    INSERT INTO authority_lifecycle_sns_messages (
      topic_arn, message_id, message_type, payload_hash, received_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    envelope.TopicArn,
    envelope.MessageId,
    envelope.Type,
    payloadHash,
    new Date().toISOString(),
  );
}

export async function processAwsSnsLifecycleCallback({
  request,
  expectedTopicArn,
  expectedRegion,
  providerKey = "aws-ses",
  certificateLoader = defaultCertificateLoader,
}: {
  request: Request;
  expectedTopicArn: string;
  expectedRegion: string;
  providerKey?: string;
  certificateLoader?: AwsSnsCertificateLoader;
}) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (
    !contentType.startsWith("text/plain") &&
    !contentType.startsWith("application/json")
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS callback content type is unsupported.",
      415,
      "sns_callback_content_type_invalid",
    );
  }
  const configuration = parseExpectedTopicArn(
    expectedTopicArn.trim(),
    expectedRegion.trim().toLowerCase(),
  );
  const rawBody = await readBoundedUtf8(
    request.body,
    MAX_SNS_BODY_BYTES,
    "sns_callback_body_too_large",
  );
  const envelope = parseEnvelope(rawBody);
  if (envelope.TopicArn !== expectedTopicArn.trim()) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS topic is not authorized for this callback.",
      403,
      "sns_topic_unauthorized",
    );
  }
  const certificateUrl = validateSigningCertificateUrl(
    envelope.SigningCertURL,
    configuration.partition,
    configuration.region,
  );
  if (
    !(await verifyEnvelopeSignature(
      envelope,
      certificateUrl,
      certificateLoader,
    ))
  ) {
    throw new AwsSnsLifecycleCallbackError(
      "The SNS signature is invalid.",
      401,
      "sns_signature_invalid",
    );
  }

  const outerPayloadHash = sha256(rawBody);
  if (envelope.Type !== "Notification") {
    const replayed = runAuthorityTransaction((database) => {
      if (inspectExistingOuterMessage(database, envelope, outerPayloadHash)) {
        return true;
      }
      recordOuterMessage(database, envelope, outerPayloadHash);
      return false;
    });
    return {
      accepted: true as const,
      replayed,
      messageType: envelope.Type,
      confirmationRequired: envelope.Type === "SubscriptionConfirmation",
    };
  }

  const event = parseSesEvent(envelope.Message);
  return runAuthorityTransaction((database) => {
    if (inspectExistingOuterMessage(database, envelope, outerPayloadHash)) {
      return {
        accepted: true as const,
        replayed: true as const,
        messageType: envelope.Type,
      };
    }
    recordOuterMessage(database, envelope, outerPayloadHash);
    processLifecycleEmailProviderEventWithDatabase(database, {
      providerKey,
      eventId: envelope.MessageId,
      providerMessageId: event.providerMessageId,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      payloadHash: sha256(envelope.Message),
    });
    return {
      accepted: true as const,
      replayed: false as const,
      messageType: envelope.Type,
    };
  });
}
