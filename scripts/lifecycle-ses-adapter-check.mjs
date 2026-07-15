import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function compileModule(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

class MockSendEmailCommand {
  constructor(input) {
    this.input = input;
  }
}

class MockLifecycleEmailAdapterError extends Error {
  constructor({ code, retryable }) {
    super("Lifecycle email provider request failed.");
    this.name = "LifecycleEmailAdapterError";
    this.code = code;
    this.retryable = retryable;
  }
}

globalThis.__lifecycleSesTestDeps = {
  SESv2Client: class UnexpectedSesClient {
    constructor() {
      throw new Error("Unit test must inject the SES client.");
    }
  },
  SendEmailCommand: MockSendEmailCommand,
  LifecycleEmailAdapterError: MockLifecycleEmailAdapterError,
};

const source = readFileSync(
  "src/lib/aws-ses-lifecycle-email-adapter.ts",
  "utf8",
);
const compiledSource = source
  .replace('import "server-only";', "")
  .replace(
    /import \{\s*SESv2Client,\s*SendEmailCommand,\s*type SendEmailCommandOutput,\s*\} from "@aws-sdk\/client-sesv2";/,
    "const { SESv2Client, SendEmailCommand } = globalThis.__lifecycleSesTestDeps;",
  )
  .replace(
    /import \{\s*LifecycleEmailAdapterError,\s*type LifecycleEmailAdapter,\s*\} from "@\/lib\/lifecycle-email-provider";/,
    "const { LifecycleEmailAdapterError } = globalThis.__lifecycleSesTestDeps;",
  );
const adapterModule = await compileModule(compiledSource);

const environment = {
  LIFECYCLE_DELIVERY_PROVIDER_KEY: "aws-ses",
  LIFECYCLE_SES_REGION: "eu-west-1",
  LIFECYCLE_SES_FROM_EMAIL: "updates@elore.test",
  LIFECYCLE_SES_CONFIGURATION_SET: "lifecycle-production",
  LIFECYCLE_SES_TIMEOUT_MS: "7000",
};
const calls = [];
const signal = new AbortController().signal;
const adapter = adapterModule.createAwsSesLifecycleEmailAdapter({
  environment,
  client: {
    async send(command, options) {
      calls.push({ command, options });
      return { MessageId: "ses-message-1", $metadata: {} };
    },
  },
});
const payload = {
  destinationEmail: "customer@recipient.test",
  message: {
    subject: "Subject",
    preheader: "Preheader",
    html: "<p>HTML body</p>",
    text: "Text body",
  },
};
const context = { signal, idempotencyKey: "a".repeat(64) };
assert.deepEqual(await adapter.send(payload, context), {
  providerMessageId: "ses-message-1",
});
assert.equal(adapter.providerKey, "aws-ses");
assert.equal(adapter.timeoutMs, 7000);
assert.equal(calls.length, 1);
assert.equal(calls[0].options.abortSignal, signal);
assert.deepEqual(calls[0].command.input, {
  FromEmailAddress: "updates@elore.test",
  Destination: { ToAddresses: ["customer@recipient.test"] },
  ConfigurationSetName: "lifecycle-production",
  EmailTags: [
    { Name: "lifecycle-idempotency-key", Value: "a".repeat(64) },
  ],
  Content: {
    Simple: {
      Subject: { Data: "Subject", Charset: "UTF-8" },
      Body: {
        Html: { Data: "<p>HTML body</p>", Charset: "UTF-8" },
        Text: { Data: "Text body", Charset: "UTF-8" },
      },
      Headers: [
        { Name: "X-Elore-Idempotency-Key", Value: "a".repeat(64) },
      ],
    },
  },
});

for (const invalidEnvironment of [
  { ...environment, LIFECYCLE_DELIVERY_PROVIDER_KEY: "other" },
  { ...environment, LIFECYCLE_SES_REGION: "invalid" },
  { ...environment, LIFECYCLE_SES_FROM_EMAIL: "not-an-email" },
  { ...environment, LIFECYCLE_SES_CONFIGURATION_SET: "bad set" },
  { ...environment, LIFECYCLE_SES_TIMEOUT_MS: "999" },
]) {
  assert.throws(
    () =>
      adapterModule.createAwsSesLifecycleEmailAdapter({
        environment: invalidEnvironment,
        client: { send: async () => ({ MessageId: "unused", $metadata: {} }) },
      }),
    (error) => error.code === "aws_ses_config_invalid" && !error.retryable,
  );
}

async function assertAwsFailure(awsError, expectedCode, retryable) {
  const failingAdapter = adapterModule.createAwsSesLifecycleEmailAdapter({
    environment,
    client: { send: async () => Promise.reject(awsError) },
  });
  await assert.rejects(
    failingAdapter.send(payload, context),
    (error) => error.code === expectedCode && error.retryable === retryable,
  );
}

await assertAwsFailure(
  { name: "TooManyRequestsException", $metadata: { httpStatusCode: 429 } },
  "aws_ses_toomanyrequestsexception",
  true,
);
await assertAwsFailure(
  { name: "InternalServiceErrorException", $metadata: { httpStatusCode: 500 } },
  "aws_ses_internalserviceerrorexception",
  true,
);
await assertAwsFailure(
  { name: "MessageRejected", $metadata: { httpStatusCode: 400 } },
  "aws_ses_messagerejected",
  false,
);
await assertAwsFailure(
  { name: "AbortError" },
  "provider_timeout",
  true,
);
await assertAwsFailure(
  { name: "Error", code: "ECONNRESET" },
  "aws_ses_error",
  true,
);
await assertAwsFailure(
  {},
  "aws_ses_request_failed",
  false,
);

assert.match(source, /from "@aws-sdk\/client-sesv2"/u);
assert.doesNotMatch(source, /AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|console\./u);
delete globalThis.__lifecycleSesTestDeps;
console.log("AWS SES v2 lifecycle adapter config, payload, abort, and retry classification passed.");
