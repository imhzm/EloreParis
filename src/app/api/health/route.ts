import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getEnvironmentLabel() {
  return (
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

function getCommitReference() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    null
  );
}

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "cozmateks-storefront",
      environment: getEnvironmentLabel(),
      commitReference: getCommitReference(),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
