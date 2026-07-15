import { readFileSync } from "node:fs";
import { getAuthorityStorageInfo } from "@/lib/authority-database";
import { getCatalogAuthorityReadiness } from "@/lib/catalog-authority";
import { resolveProjectPath } from "@/lib/runtime-paths";
import {
  isPublicCatalogApproved,
  isPublicCommerceAvailable,
  isPublicCommerceEnabled,
  isPublicDiscoveryContentApproved,
  isPublicEditorialContentApproved,
  isExternalCustomerAuthConfigured,
  isPublicLegalContentApproved,
} from "@/lib/release-controls";
import {
  getSearchRuntimeStage,
  isPublicReleaseApproved,
  isSearchIndexingEnabled,
} from "@/lib/search-visibility";
import { getSiteUrl } from "@/lib/site-content";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getEnvironmentLabel() {
  return (
    process.env.APP_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

function getCommitReference() {
  const environmentReference =
    process.env.DEPLOYMENT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA;

  if (environmentReference?.trim()) {
    return environmentReference.trim();
  }

  try {
    const fileReference = readFileSync(
      resolveProjectPath(".deployment-commit"),
      "utf8",
    ).trim();
    return fileReference || null;
  } catch {
    return null;
  }
}

export function GET() {
  const authorityStorage = getAuthorityStorageInfo();
  const catalogAuthority = getCatalogAuthorityReadiness();
  const runtimeStage = getSearchRuntimeStage();
  const publicReleaseApproved = isPublicReleaseApproved();
  const searchIndexingEnabled = isSearchIndexingEnabled();

  return NextResponse.json(
    {
      status: "ok",
      service: "elore-paris-storefront",
      environment: getEnvironmentLabel(),
      hostingProvider: process.env.HOSTING_PROVIDER?.trim() || "local",
      runtimeStage,
      publicReleaseApproved,
      publicCatalogApproved: isPublicCatalogApproved(),
      publicDiscoveryContentApproved: isPublicDiscoveryContentApproved(),
      publicEditorialContentApproved: isPublicEditorialContentApproved(),
      publicLegalContentApproved: isPublicLegalContentApproved(),
      publicCommerceEnabled: isPublicCommerceEnabled(),
      externalCustomerAuthConfigured: isExternalCustomerAuthConfigured(),
      publicCommerceConfigured: isPublicCommerceAvailable(),
      publicCommerceAvailable:
        isPublicCommerceAvailable() && catalogAuthority.ready,
      catalogAuthority: {
        ready: catalogAuthority.ready,
        importId: catalogAuthority.importId,
        productCount: catalogAuthority.productCount,
        variantCount: catalogAuthority.variantCount,
        blockers: catalogAuthority.blockers,
      },
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
