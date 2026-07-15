import "server-only";

import {
  buildProviderIntegrationContract,
  buildProviderIntegrationOwnables,
} from "@/lib/provider-integration-contract";
import {
  getContentGovernanceSummary,
} from "@/lib/content-governance";
import { getAuthorityStorageInfo } from "@/lib/authority-database";
import { getCatalogAuthorityReadiness } from "@/lib/catalog-authority";
import { getHostingDirection } from "@/lib/hosting-direction";
import { getOpsAccessConfig } from "@/lib/ops-access";
import {
  buildReleaseOwnerSummaries,
  getReleaseCommerceOwner,
  getReleaseContentOwner,
  getReleaseDeliveryOwner,
  getReleasePlatformOwner,
  getReleaseSecurityOwner,
} from "@/lib/release-ownership";
import { getReleaseRuntimePreflightSnapshot } from "@/lib/release-runtime-preflight";
import type {
  ReleaseReadinessGate,
  ReleaseReadinessSnapshot,
  ReleaseReadinessStatus,
} from "@/lib/release-readiness-types";
import {
  isPublicCatalogApproved,
  isPublicCommerceAvailable,
  isPublicCommerceEnabled,
  isPublicDiscoveryContentApproved,
  isPublicEditorialContentApproved,
  isPublicLegalContentApproved,
} from "@/lib/release-controls";
import { getSiteUrl } from "@/lib/site-content";
import { isPublicReleaseApproved } from "@/lib/search-visibility";

function isLocalCanonicalUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1" ||
      parsedUrl.hostname === "::1"
    );
  } catch {
    return true;
  }
}

function getRuntimeEnvironment() {
  if (process.env.APP_ENV?.trim()) {
    return process.env.APP_ENV.trim();
  }

  if (process.env.VERCEL_ENV?.trim()) {
    return `vercel:${process.env.VERCEL_ENV.trim()}`;
  }

  return process.env.NODE_ENV ?? "development";
}

function getOverallStatus(
  items: ReadonlyArray<{ status: ReleaseReadinessStatus }>,
): ReleaseReadinessStatus {
  if (items.some((item) => item.status === "blocked")) {
    return "blocked";
  }

  if (items.some((item) => item.status === "warning")) {
    return "warning";
  }

  return "ready";
}

export function getReleaseReadinessSnapshot(): ReleaseReadinessSnapshot {
  const siteUrl = getSiteUrl();
  const authorityStorage = getAuthorityStorageInfo();
  const contentSummary = getContentGovernanceSummary();
  const hostingDirection = getHostingDirection();
  const opsAccessConfig = getOpsAccessConfig();
  const runtimePreflight = getReleaseRuntimePreflightSnapshot();
  const providerContract = buildProviderIntegrationContract();
  const providerOwnables = buildProviderIntegrationOwnables(providerContract);
  const deliveryOwner = getReleaseDeliveryOwner();
  const platformOwner = getReleasePlatformOwner();
  const commerceOwner = getReleaseCommerceOwner();
  const securityOwner = getReleaseSecurityOwner();
  const contentOwner = getReleaseContentOwner();
  const publicReleaseApproved = isPublicReleaseApproved();
  const publicCatalogApproved = isPublicCatalogApproved();
  const publicDiscoveryContentApproved = isPublicDiscoveryContentApproved();
  const publicEditorialContentApproved = isPublicEditorialContentApproved();
  const publicLegalContentApproved = isPublicLegalContentApproved();
  const publicCommerceEnabled = isPublicCommerceEnabled();
  const catalogAuthority = getCatalogAuthorityReadiness();
  const publicCommerceConfigured = isPublicCommerceAvailable();
  const publicCommerceAvailable =
    publicCommerceConfigured && catalogAuthority.ready;

  const gates: ReleaseReadinessGate[] = [
    {
      id: "ci-health",
      title: "Local and CI validation",
      status: "ready",
      summary:
        "The repository already enforces lint, typecheck, build, and smoke checks before future release claims.",
      details: [
        "GitHub Actions CI runs on every push to main.",
        "Smoke checks verify key public routes, protected ops routes, and transactional APIs.",
      ],
      owner: deliveryOwner,
      resolutionAction:
        "Keep CI green on main and republish a protected release package after any release-surface change.",
    },
    {
      id: "hosting-direction",
      title: "Hosting direction freeze",
      status: "ready",
      summary:
        "The repository now freezes the primary runtime to a Hostinger VPS systemd service behind nginx with persistent local storage for the current SQLite-backed authorities.",
      details: [
        `Primary provider: ${hostingDirection.primaryProvider}`,
        `Service type: ${hostingDirection.primaryServiceType}`,
        `Runtime artifact: ${hostingDirection.runtimeArtifact}`,
        `Persistent state path: ${hostingDirection.persistencePath}`,
        `Reverse proxy: ${hostingDirection.reverseProxy}`,
        `Secondary path: ${hostingDirection.optionalSecondaryPath}`,
      ],
      owner: platformOwner,
      resolutionAction:
        "Keep the Hostinger single-instance systemd deployment as the supported launch path until shared backend ownership replaces the single-host runtime.",
    },
    {
      id: "hosting-runtime",
      title: "Hosted canonical runtime",
      status: isLocalCanonicalUrl(siteUrl) ? "blocked" : "ready",
      summary: isLocalCanonicalUrl(siteUrl)
        ? "Canonical URLs still resolve to a local runtime because the Hostinger production domain is not configured in this runtime."
        : "Canonical URLs now resolve to a hosted runtime instead of a local fallback.",
      details: isLocalCanonicalUrl(siteUrl)
        ? [
            `Current canonical URL: ${siteUrl}`,
            "The Hostinger runtime must set NEXT_PUBLIC_SITE_URL=https://elore-paris.com.",
          ]
        : [`Current canonical URL: ${siteUrl}`],
      owner: platformOwner,
      resolutionAction:
        "Deploy the verified Hostinger release, bind elore-paris.com, and republish the release package from that runtime.",
    },
    {
      id: "public-release-approval",
      title: "Explicit public release approval",
      status: publicReleaseApproved ? "ready" : "blocked",
      summary: publicReleaseApproved
        ? "The runtime has an explicit public-release approval flag."
        : "Public indexing and release claims remain disabled until PUBLIC_RELEASE_APPROVED is explicitly enabled after all gates pass.",
      details: [
        `PUBLIC_RELEASE_APPROVED: ${publicReleaseApproved ? "true" : "false"}`,
        "This flag must not be inferred from NODE_ENV, a hosted URL, or a successful build.",
      ],
      owner: platformOwner,
      resolutionAction:
        "Enable PUBLIC_RELEASE_APPROVED only after the latest release packet has no blockers and the business owner approves launch.",
    },
    {
      id: "public-catalog-approval",
      title: "Approved public catalog",
      status: publicCatalogApproved && catalogAuthority.ready ? "ready" : "blocked",
      summary: publicCatalogApproved && catalogAuthority.ready
        ? "The runtime flag and evidence-backed catalog authority both approve the public catalog."
        : "Prototype products, pricing, claims, and media remain blocked until the catalog authority is complete and approved.",
      details: [
        `PUBLIC_CATALOG_APPROVED: ${publicCatalogApproved ? "true" : "false"}`,
        `Catalog authority ready: ${catalogAuthority.ready ? "yes" : "no"}`,
        `Active catalog products/variants: ${catalogAuthority.productCount}/${catalogAuthority.variantCount}`,
        ...catalogAuthority.blockers.map((blocker) => `Authority blocker: ${blocker}`),
        "Approval requires authoritative SKUs, variants, SAR prices, inventory, media rights, claims, and compliance records.",
        "Concept imagery and research references must never satisfy this gate.",
      ],
      owner: commerceOwner,
      resolutionAction:
        "Import and validate the authoritative catalog, obtain business and compliance approval, then enable PUBLIC_CATALOG_APPROVED explicitly.",
    },
    {
      id: "public-discovery-content-approval",
      title: "Approved educational discovery content",
      status: publicDiscoveryContentApproved ? "ready" : "blocked",
      summary: publicDiscoveryContentApproved
        ? "Concern, routine, and ingredient guidance has an explicit content and compliance approval."
        : "Educational discovery pages remain outside public indexing until their claims, disclaimers, and localized copy receive explicit approval.",
      details: [
        `PUBLIC_DISCOVERY_CONTENT_APPROVED: ${publicDiscoveryContentApproved ? "true" : "false"}`,
        "Approval covers both Arabic and English concern, routine, and ingredient pages.",
        "This gate must not be inferred from a successful build or catalogue approval.",
      ],
      owner: contentOwner,
      resolutionAction:
        "Complete content and compliance review for every localized discovery route, then enable PUBLIC_DISCOVERY_CONTENT_APPROVED explicitly.",
    },
    {
      id: "public-editorial-content-approval",
      title: "Approved public editorial content",
      status: publicEditorialContentApproved ? "ready" : "blocked",
      summary: publicEditorialContentApproved
        ? "The public journal has explicit editorial and cosmetics-claims approval."
        : "The prototype journal remains outside public indexing until its Arabic and English editions are rewritten and approved.",
      details: [
        `PUBLIC_EDITORIAL_CONTENT_APPROVED: ${publicEditorialContentApproved ? "true" : "false"}`,
        "Approval requires human editorial ownership, representative imagery, claim review, and removal of prototype product links.",
      ],
      owner: contentOwner,
      resolutionAction:
        "Replace the synthetic journal set with a focused reviewed edition, then enable PUBLIC_EDITORIAL_CONTENT_APPROVED explicitly.",
    },
    {
      id: "public-legal-content-approval",
      title: "Approved legal and support content",
      status: publicLegalContentApproved ? "ready" : "blocked",
      summary: publicLegalContentApproved
        ? "Trust, legal, and support surfaces have explicit business and legal approval."
        : "Trust and support pages remain provisional until entity, privacy, shipping, returns, and contact facts are approved.",
      details: [
        `PUBLIC_LEGAL_CONTENT_APPROVED: ${publicLegalContentApproved ? "true" : "false"}`,
        "Approval requires the legal entity, contact channel, provider terms, privacy handling, shipping coverage, and return rules.",
      ],
      owner: contentOwner,
      resolutionAction:
        "Complete owner and legal review for every localized trust and support page, then enable PUBLIC_LEGAL_CONTENT_APPROVED explicitly.",
    },
    {
      id: "public-commerce-activation",
      title: "Public commerce activation",
      status: publicCommerceAvailable ? "ready" : "blocked",
      summary: publicCommerceAvailable
        ? "Public commerce is explicitly enabled and all prerequisite approvals are present."
        : "Production order creation remains disabled until release, catalog, and commerce approvals are all enabled.",
      details: [
        `PUBLIC_RELEASE_APPROVED: ${publicReleaseApproved ? "true" : "false"}`,
        `PUBLIC_CATALOG_APPROVED: ${publicCatalogApproved ? "true" : "false"}`,
        `PUBLIC_COMMERCE_ENABLED: ${publicCommerceEnabled ? "true" : "false"}`,
        `Environment prerequisites configured: ${publicCommerceConfigured ? "yes" : "no"}`,
        `Evidence-backed catalog authority ready: ${catalogAuthority.ready ? "yes" : "no"}`,
      ],
      owner: commerceOwner,
      resolutionAction:
        "Clear every release and catalog blocker, verify payment and shipping providers, and only then enable PUBLIC_COMMERCE_ENABLED.",
    },
    {
      id: "transactional-backend",
      title: "Durable transactional authority",
      status: authorityStorage.engine === "sqlite" ? "warning" : "ready",
      summary:
        authorityStorage.engine === "sqlite"
          ? "Orders, notifications, and audit logs now match the frozen persistent-host path, but they still run on single-host SQLite instead of a shared durable backend."
          : "Transactional state is backed by a non-local shared authority.",
      details: [
        `Current storage engine: ${authorityStorage.engine}`,
        `Durability mode: ${authorityStorage.durability}`,
        `Storage path: ${authorityStorage.path}`,
      ],
      owner: commerceOwner,
      resolutionAction:
        "Replace the current single-host SQLite authority with shared durable ownership for orders, notifications, and audit data before multi-operator production use.",
    },
    {
      id: "ops-auth",
      title: "Ops identity and RBAC",
      status: opsAccessConfig.supportsIdentityAuth ? "warning" : "blocked",
      summary: opsAccessConfig.supportsIdentityAuth
        ? "Role-aware identity login exists, but it is still env-backed and not provider-backed auth/RBAC."
        : "Ops surfaces still need identity-backed login before production operations can be trusted.",
      details: [
        `Access mode: ${opsAccessConfig.mode}`,
        `Primary auth method: ${opsAccessConfig.primaryAuthMethod}`,
        `Identity login available: ${opsAccessConfig.supportsIdentityAuth ? "yes" : "no"}`,
      ],
      owner: securityOwner,
      resolutionAction:
        "Upgrade the current env-backed identities into provider-backed auth with real RBAC before trusting live internal operations.",
    },
    {
      id: "content-approval",
      title: "Public content approval gates",
      status: contentSummary.launchBlocked > 0 ? "blocked" : "ready",
      summary:
        contentSummary.launchBlocked > 0
          ? "Public copy and trust surfaces are still blocked behind sample-pack and business-input approvals."
          : "Public content approval blockers are cleared.",
      details: [
        `${contentSummary.awaitingStyleSamples} groups are waiting for real style samples.`,
        `${contentSummary.awaitingBusinessInputs} groups are waiting for approved business inputs.`,
        `${contentSummary.launchBlocked} governance groups still block final launch claims.`,
      ],
      owner: contentOwner,
      resolutionAction:
        "Clear the remaining sample-pack, legal, and business-input approvals in /ops/content before any public launch claim.",
    },
  ];
  const ownerSummaries = buildReleaseOwnerSummaries([
    ...gates,
    ...runtimePreflight.checks,
    ...providerOwnables,
  ]);
  const releaseStatusItems = [...gates, ...providerOwnables];
  const providerNextActions = Array.from(
    new Set(
      providerContract.lanes
        .filter((lane) => lane.status !== "ready")
        .map((lane) => lane.nextAction),
    ),
  );

  return {
    overallStatus: getOverallStatus(releaseStatusItems),
    blockedCount: releaseStatusItems.filter((item) => item.status === "blocked").length,
    warningCount: releaseStatusItems.filter((item) => item.status === "warning").length,
    readyCount: releaseStatusItems.filter((item) => item.status === "ready").length,
    runtimeEnvironment: getRuntimeEnvironment(),
    canonicalUrl: siteUrl,
    gates,
    runtimePreflight,
    ownerSummaries,
    nextActions: [
      "Bootstrap the Hostinger systemd/nginx runtime, install the dedicated SSH public key, and keep commerce plus indexing disabled during rehearsal deployments.",
      "Use the runtime preflight section inside /ops/release to clear the public URL, persistent path, signing-secret, and protected-identity blockers before the first live deploy claim.",
      ...providerNextActions,
      "Keep the current SQLite-backed authority only as a single-host launch path; replace it with a shared durable backend for orders, notifications, and audit data when the backend ownership phase starts.",
      "Upgrade the current signed-session ops gate into provider-backed auth and real RBAC.",
      "Clear the remaining sample-pack, legal, and business-input gates tracked in CONTENT-OWNERSHIP.md before public launch claims.",
      "Approve the localized concern, routine, and ingredient guidance before enabling PUBLIC_DISCOVERY_CONTENT_APPROVED.",
      "Replace and approve the bilingual journal before enabling PUBLIC_EDITORIAL_CONTENT_APPROVED.",
      "Approve the bilingual trust, legal, and support facts before enabling PUBLIC_LEGAL_CONTENT_APPROVED.",
    ],
  };
}
