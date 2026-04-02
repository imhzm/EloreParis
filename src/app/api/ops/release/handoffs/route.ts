import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  assertOpsRequestAccess,
  OpsAccessError,
} from "@/lib/ops-access";
import {
  normalizeReleaseHandoffDraft,
} from "@/lib/release-handoff";
import {
  publishReleaseHandoffRecord,
  readReleaseHandoffHistory,
  ReleaseHandoffError,
} from "@/lib/release-handoff-history";
import {
  RequestHardeningError,
  assertTrustedMutationRequest,
} from "@/lib/request-hardening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await assertOpsRequestAccess(request, "/ops/release");

    return NextResponse.json({
      releaseHandoffs: readReleaseHandoffHistory(),
    });
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to load the protected release handoff trail." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const session = await assertOpsRequestAccess(request, "/ops/release");

    if (session.role !== "manager") {
      return NextResponse.json(
        { error: "Only manager sessions can record blocker handoffs." },
        { status: 403 },
      );
    }

    let body: {
      releaseHandoff?: unknown;
    };

    try {
      body = (await request.json()) as {
        releaseHandoff?: unknown;
      };
    } catch {
      return NextResponse.json(
        { error: "The blocker handoff payload could not be parsed." },
        { status: 400 },
      );
    }

    const releaseHandoff = normalizeReleaseHandoffDraft(body.releaseHandoff);

    if (!releaseHandoff) {
      return NextResponse.json(
        { error: "The submitted blocker handoff is not valid." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        releaseHandoffRecord: await publishReleaseHandoffRecord(
          session,
          releaseHandoff,
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof OpsAccessError ||
      error instanceof RequestHardeningError ||
      error instanceof ReleaseHandoffError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to record the current blocker handoff inside the runtime." },
      { status: 500 },
    );
  }
}
