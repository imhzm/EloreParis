import "server-only";

import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandOutput,
} from "@aws-sdk/client-sesv2";
import {
  LifecycleEmailAdapterError,
  type LifecycleEmailAdapter,
} from "@/lib/lifecycle-email-provider";

const PROVIDER_KEY = "aws-ses";
const DEFAULT_TIMEOUT_MS = 10_000;
const IDEMPOTENCY_TAG_NAME = "lifecycle-idempotency-key";

type SesClient = {
  send(
    command: SendEmailCommand,
    options?: { abortSignal?: AbortSignal },
  ): Promise<SendEmailCommandOutput>;
};

type AwsErrorShape = {
  name?: unknown;
  code?: unknown;
  $fault?: unknown;
  $retryable?: unknown;
  $metadata?: { httpStatusCode?: unknown };
};

function configurationError() {
  return new LifecycleEmailAdapterError({
    code: "aws_ses_config_invalid",
    retryable: false,
  });
}

function requiredEnvironmentValue(
  environment: NodeJS.ProcessEnv,
  key: string,
  maximumLength: number,
) {
  const value = environment[key]?.trim() ?? "";
  if (
    !value ||
    value.length > maximumLength ||
    /[\u0000-\u001f\u007f]/.test(value) ||
    /(replace|placeholder|example|changeme|todo|your-)/i.test(value)
  ) {
    throw configurationError();
  }
  return value;
}

function resolveConfiguration(environment: NodeJS.ProcessEnv) {
  if (environment.LIFECYCLE_DELIVERY_PROVIDER_KEY?.trim().toLowerCase() !== PROVIDER_KEY) {
    throw configurationError();
  }

  const region = requiredEnvironmentValue(
    environment,
    "LIFECYCLE_SES_REGION",
    40,
  ).toLowerCase();
  if (!/^[a-z]{2}(?:-[a-z0-9]+)+-\d$/u.test(region)) {
    throw configurationError();
  }

  const fromEmail = requiredEnvironmentValue(
    environment,
    "LIFECYCLE_SES_FROM_EMAIL",
    254,
  ).toLowerCase();
  if (
    !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u.test(fromEmail) ||
    fromEmail.startsWith(".") ||
    fromEmail.includes("..")
  ) {
    throw configurationError();
  }

  const configurationSet = requiredEnvironmentValue(
    environment,
    "LIFECYCLE_SES_CONFIGURATION_SET",
    64,
  );
  if (!/^[A-Za-z0-9_-]{1,64}$/u.test(configurationSet)) {
    throw configurationError();
  }

  const configuredTimeout = environment.LIFECYCLE_SES_TIMEOUT_MS?.trim();
  const timeoutMs = configuredTimeout
    ? Number.parseInt(configuredTimeout, 10)
    : DEFAULT_TIMEOUT_MS;
  if (
    !Number.isSafeInteger(timeoutMs) ||
    String(timeoutMs) !== (configuredTimeout ?? String(DEFAULT_TIMEOUT_MS)) ||
    timeoutMs < 1_000 ||
    timeoutMs > 30_000
  ) {
    throw configurationError();
  }

  return { region, fromEmail, configurationSet, timeoutMs };
}

function readAwsErrorName(error: AwsErrorShape) {
  const value =
    typeof error.name === "string"
      ? error.name
      : typeof error.code === "string"
        ? error.code
        : "request_failed";
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 48);
}

function classifyAwsError(error: unknown) {
  const awsError =
    error && typeof error === "object" ? (error as AwsErrorShape) : {};
  const name = readAwsErrorName(awsError);
  const transportCode =
    typeof awsError.code === "string" ? awsError.code.trim().toUpperCase() : "";
  const statusCode = awsError.$metadata?.httpStatusCode;
  const nonRetryable = new Set([
    "accessdeniedexception",
    "accountsuspendedexception",
    "badrequestexception",
    "credentialsprovidererror",
    "invalidclienttokenid",
    "mailfromdomainnotverifiedexception",
    "messagerejected",
    "notfoundexception",
    "sendingpausedexception",
    "signaturedoesnotmatch",
    "unrecognizedclientexception",
  ]);
  const retryable =
    !nonRetryable.has(name) &&
    (name === "aborterror" ||
      name === "internalserviceerrorexception" ||
      name === "serviceunavailableexception" ||
      name === "throttlingexception" ||
      name === "toomanyrequestsexception" ||
      name === "timeouterror" ||
      ["ECONNRESET", "ECONNREFUSED", "EHOSTUNREACH", "ENETUNREACH", "ETIMEDOUT"].includes(
        transportCode,
      ) ||
      awsError.$retryable !== undefined ||
      statusCode === 429 ||
      (typeof statusCode === "number" && statusCode >= 500));

  return new LifecycleEmailAdapterError({
    code: name === "aborterror" ? "provider_timeout" : `aws_ses_${name}`,
    retryable,
  });
}

export function createAwsSesLifecycleEmailAdapter({
  environment = process.env,
  client,
}: {
  environment?: NodeJS.ProcessEnv;
  client?: SesClient;
} = {}): LifecycleEmailAdapter {
  const configuration = resolveConfiguration(environment);
  const sesClient = client ?? new SESv2Client({ region: configuration.region });

  return {
    providerKey: PROVIDER_KEY,
    timeoutMs: configuration.timeoutMs,
    async send(payload, context) {
      try {
        const response = await sesClient.send(
          new SendEmailCommand({
            FromEmailAddress: configuration.fromEmail,
            Destination: { ToAddresses: [payload.destinationEmail] },
            ConfigurationSetName: configuration.configurationSet,
            EmailTags: [
              { Name: IDEMPOTENCY_TAG_NAME, Value: context.idempotencyKey },
            ],
            Content: {
              Simple: {
                Subject: { Data: payload.message.subject, Charset: "UTF-8" },
                Body: {
                  Html: { Data: payload.message.html, Charset: "UTF-8" },
                  Text: { Data: payload.message.text, Charset: "UTF-8" },
                },
                Headers: [
                  {
                    Name: "X-Elore-Idempotency-Key",
                    Value: context.idempotencyKey,
                  },
                ],
              },
            },
          }),
          { abortSignal: context.signal },
        );
        const providerMessageId = response.MessageId?.trim() ?? "";
        if (!providerMessageId) {
          throw new LifecycleEmailAdapterError({
            code: "provider_response_invalid",
            retryable: false,
          });
        }
        return { providerMessageId };
      } catch (error) {
        if (error instanceof LifecycleEmailAdapterError) throw error;
        throw classifyAwsError(error);
      }
    },
  };
}
