import { getAuthorityStorageInfo } from "@/lib/authority-database";
import { getSearchRuntimeStage, isSearchIndexingEnabled } from "@/lib/search-visibility";
import { getSiteUrl } from "@/lib/site-content";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
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
  const authorityStorage = getAuthorityStorageInfo();
  const runtimeStage = getSearchRuntimeStage();
  const searchIndexingEnabled = isSearchIndexingEnabled();

  return NextResponse.json(
    {
      status: "ok",
      service: "cozmateks-storefront",
      environment: getEnvironmentLabel(),
      runtimeStage,
      searchIndexingEnabled,
      canonicalUrl: getSiteUrl(),
      commitReference: getCommitReference(),
      authorityStorage: {
        engine: authorityStorage.engine,
        durability: authorityStorage.durability,
      },
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
