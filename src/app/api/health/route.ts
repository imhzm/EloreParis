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
        // Deliberately omitted from this public payload: importId, productCount,
        // variantCount, and the identifier half of each blocker.
        //
        // This route has no auth and proxy.ts guards only /ops, so it is
        // reachable by anyone. Readiness blockers are minted as
        // `product_not_approved:{slug}` and `variant_price_approval_missing:{sku}`
        // (catalog-authority.ts), so the moment an operator imports the real
        // catalogue to rehearse — which is the intended flow — curling this URL
        // would return every unreleased product slug, every SKU, and the size of
        // the line-up, before announcement.
        //
        // The blocker KIND is the useful diagnostic and is kept; the identifier
        // is not, and is dropped rather than hashed, because a stable hash of a
        // small slug set is not much of a secret either. Operators who need the
        // detail have /api/ops/catalog/authority, which is gated.
        blockers: redactCatalogBlockers(catalogAuthority.blockers),
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
