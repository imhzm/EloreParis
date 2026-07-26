import { getCatalogAuthorityReadiness } from "@/lib/catalog-authority";
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
import { getRuntimeDeploymentCommitReference } from "@/lib/runtime-deployment";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Strips the identifier off each readiness blocker, keeping only its kind.
 *
 * `product_not_approved:radiant-dew-serum` -> `product_not_approved`
 * `active_catalog_publication_missing`     -> unchanged (carries no identifier)
 *
 * Deduplicated, so ten unapproved products read as one `product_not_approved`
 * rather than leaking the count through the array length.
 */
function redactCatalogBlockers(blockers: readonly string[]) {
  return [...new Set(blockers.map((blocker) => blocker.split(":", 1)[0]))];
}

function getEnvironmentLabel() {
  return process.env.NODE_ENV ?? "development";
}

export function GET() {
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
      commitReference: getRuntimeDeploymentCommitReference(),
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
        blockers: redactCatalogBlockers(catalogAuthority.blockers),
      },
      searchIndexingEnabled,
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
