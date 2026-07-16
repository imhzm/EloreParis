import { NextResponse } from "next/server";
import {
  AwsSnsLifecycleCallbackError,
  processAwsSnsLifecycleCallback,
} from "@/lib/aws-sns-lifecycle-callback";
import { LifecycleEmailWebhookError } from "@/lib/lifecycle-email-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  try {
    const result = await processAwsSnsLifecycleCallback({
      request,
      expectedTopicArn: process.env.LIFECYCLE_SES_SNS_TOPIC_ARN ?? "",
      expectedRegion: process.env.LIFECYCLE_SES_REGION ?? "",
      providerKey: "aws-ses",
    });
    return json({ ok: true, ...result });
  } catch (error) {
    if (
      error instanceof AwsSnsLifecycleCallbackError ||
      error instanceof LifecycleEmailWebhookError
    ) {
      return json(
        {
          error: "The lifecycle provider callback could not be processed.",
          code: error.code,
        },
        error.statusCode,
      );
    }
    return json(
      { error: "Unable to process the lifecycle provider callback." },
      500,
    );
  }
}
