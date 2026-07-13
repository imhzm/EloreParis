import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.SMOKE_PORT ?? 3066);
const host = process.env.SMOKE_HOST ?? "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const providerPort = Number(process.env.SMOKE_PROVIDER_PORT ?? 4071);
const providerHost = process.env.SMOKE_PROVIDER_HOST ?? "127.0.0.1";
const providerBaseUrl = `http://${providerHost}:${providerPort}`;
const trustedMutationHeaders = {
  Origin: baseUrl,
};
const opsManagerUsername =
  process.env.SMOKE_OPS_MANAGER_USERNAME ?? "smoke.manager";
const opsManagerPassword =
  process.env.SMOKE_OPS_MANAGER_PASSWORD ?? "SmokeManager!123";
const opsCatalogUsername =
  process.env.SMOKE_OPS_CATALOG_USERNAME ?? "smoke.catalog";
const opsCatalogPassword =
  process.env.SMOKE_OPS_CATALOG_PASSWORD ?? "SmokeCatalog!123";
const orderAuthoritySecret =
  process.env.SMOKE_ORDER_AUTHORITY_SECRET ?? "smoke-order-authority";
const authorityDbFile =
  process.env.SMOKE_AUTHORITY_DB_PATH ?? ".data/smoke-authority.sqlite";
const orderAuthorityFile =
  process.env.SMOKE_ORDER_AUTHORITY_FILE ?? ".data/smoke-orders.json";
const opsAuditFile =
  process.env.SMOKE_OPS_AUDIT_FILE ?? ".data/smoke-ops-audit.json";
const notificationAuthorityFile =
  process.env.SMOKE_NOTIFICATION_AUTHORITY_FILE ??
  ".data/smoke-notifications.json";
const releaseEvidenceFile =
  process.env.SMOKE_RELEASE_EVIDENCE_PATH ??
  process.env.RELEASE_EVIDENCE_PATH ??
  ".artifacts/release-evidence.json";
const releasePackageFile =
  process.env.SMOKE_RELEASE_PACKAGE_PATH ?? ".artifacts/release-package.json";
const releasePackageMarkdownFile =
  process.env.SMOKE_RELEASE_PACKAGE_MARKDOWN_PATH ??
  ".artifacts/release-package.md";
const releaseHistoryFile =
  process.env.SMOKE_RELEASE_HISTORY_PATH ?? ".artifacts/release-history.json";
const releaseHistoryMarkdownFile =
  process.env.SMOKE_RELEASE_HISTORY_MARKDOWN_PATH ??
  ".artifacts/release-history.md";
const releaseDiffFile =
  process.env.SMOKE_RELEASE_DIFF_PATH ?? ".artifacts/release-diff.json";
const releaseDiffMarkdownFile =
  process.env.SMOKE_RELEASE_DIFF_MARKDOWN_PATH ??
  ".artifacts/release-diff.md";
const releaseHandoffFile =
  process.env.SMOKE_RELEASE_HANDOFF_PATH ?? ".artifacts/release-handoff.json";
const releaseHandoffMarkdownFile =
  process.env.SMOKE_RELEASE_HANDOFF_MARKDOWN_PATH ??
  ".artifacts/release-handoff.md";
const releaseDecisionFile =
  process.env.SMOKE_RELEASE_DECISION_PATH ?? ".artifacts/release-decision.json";
const releaseDecisionMarkdownFile =
  process.env.SMOKE_RELEASE_DECISION_MARKDOWN_PATH ??
  ".artifacts/release-decision.md";
const releasePacketFile =
  process.env.SMOKE_RELEASE_PACKET_PATH ?? ".artifacts/release-packet.json";
const releasePacketMarkdownFile =
  process.env.SMOKE_RELEASE_PACKET_MARKDOWN_PATH ??
  ".artifacts/release-packet.md";
const paymentProviderSecret =
  process.env.SMOKE_PAYMENT_PROVIDER_CALLBACK_SECRET ??
  "smoke-payment-provider-secret";
const paymentProviderLabel =
  process.env.SMOKE_PAYMENT_PROVIDER_LABEL ?? "Smoke Payment Provider";
const paymentProviderApiKey =
  process.env.SMOKE_PAYMENT_PROVIDER_API_KEY ?? "smoke-payment-provider-api-key";
const shippingProviderSecret =
  process.env.SMOKE_SHIPPING_PROVIDER_CALLBACK_SECRET ??
  "smoke-shipping-provider-secret";
const shippingProviderLabel =
  process.env.SMOKE_SHIPPING_PROVIDER_LABEL ?? "Smoke Shipping Provider";
const shippingProviderApiKey =
  process.env.SMOKE_SHIPPING_PROVIDER_API_KEY ?? "smoke-shipping-provider-api-key";
const notificationProviderSecret =
  process.env.SMOKE_NOTIFICATION_PROVIDER_CALLBACK_SECRET ??
  "smoke-notification-provider-secret";
const notificationProviderLabel =
  process.env.SMOKE_NOTIFICATION_PROVIDER_LABEL ??
  "Smoke Notification Provider";
const notificationProviderApiKey =
  process.env.SMOKE_NOTIFICATION_PROVIDER_API_KEY ??
  "smoke-notification-provider-api-key";
const authProviderSecret =
  process.env.SMOKE_AUTH_PROVIDER_CALLBACK_SECRET ??
  "smoke-auth-provider-secret";
const authProviderLabel =
  process.env.SMOKE_AUTH_PROVIDER_LABEL ?? "Smoke Auth Provider";
const authProviderClientId =
  process.env.SMOKE_AUTH_PROVIDER_CLIENT_ID ?? "smoke-auth-client-id";
const authProviderClientSecret =
  process.env.SMOKE_AUTH_PROVIDER_CLIENT_SECRET ?? "smoke-auth-client-secret";
const authProviderEmail =
  process.env.SMOKE_AUTH_PROVIDER_EMAIL ?? "smoke@example.com";
const authProviderPhone =
  process.env.SMOKE_AUTH_PROVIDER_PHONE ?? "0501234567";
const authProviderSubject =
  process.env.SMOKE_AUTH_PROVIDER_SUBJECT ?? "smoke-customer-01";
const standaloneStartScript = path.resolve(
  process.cwd(),
  "scripts/start-standalone.mjs",
);
const mockProviderScript = path.resolve(
  process.cwd(),
  "scripts/mock-provider-server.mjs",
);

if (!existsSync(".next/BUILD_ID")) {
  throw new Error("Production build not found. Run `npm run build` before `npm run test:smoke`.");
}

const outputBuffer = [];
let server;
let providerServer;

function appendLog(chunk, prefix = "") {
  const text = `${prefix}${chunk.toString()}`;
  outputBuffer.push(text);

  if (outputBuffer.length > 80) {
    outputBuffer.shift();
  }
}

function formatRecentLogs() {
  return outputBuffer.join("").trim();
}

function safeRemoveAuthorityArtifact(filePath) {
  try {
    rmSync(filePath, { force: true });
  } catch {
    // Ignore smoke cleanup failures.
  }
}

function safeCleanupAuthorityState() {
  safeRemoveAuthorityArtifact(authorityDbFile);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-shm`);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-wal`);
  safeRemoveAuthorityArtifact(`${authorityDbFile}-journal`);
  safeRemoveAuthorityArtifact(orderAuthorityFile);
  safeRemoveAuthorityArtifact(opsAuditFile);
  safeRemoveAuthorityArtifact(notificationAuthorityFile);
}

function resetReleaseArtifacts() {
  safeRemoveAuthorityArtifact(releaseEvidenceFile);
  safeRemoveAuthorityArtifact(releasePackageFile);
  safeRemoveAuthorityArtifact(releasePackageMarkdownFile);
  safeRemoveAuthorityArtifact(releaseHistoryFile);
  safeRemoveAuthorityArtifact(releaseHistoryMarkdownFile);
  safeRemoveAuthorityArtifact(releaseDiffFile);
  safeRemoveAuthorityArtifact(releaseDiffMarkdownFile);
  safeRemoveAuthorityArtifact(releaseHandoffFile);
  safeRemoveAuthorityArtifact(releaseHandoffMarkdownFile);
  safeRemoveAuthorityArtifact(releaseDecisionFile);
  safeRemoveAuthorityArtifact(releaseDecisionMarkdownFile);
  safeRemoveAuthorityArtifact(releasePacketFile);
  safeRemoveAuthorityArtifact(releasePacketMarkdownFile);
}

function writeReleaseEvidence(report) {
  mkdirSync(path.dirname(releaseEvidenceFile), { recursive: true });
  writeFileSync(releaseEvidenceFile, JSON.stringify(report, null, 2));
}

function renderOwnerSummariesMarkdown(ownerSummaries) {
  if (!ownerSummaries?.length) {
    return "- None.";
  }

  return ownerSummaries
    .map(
      (summary) =>
        `- ${summary.ownerLabel} (${summary.lane})\n  - Route: ${summary.defaultPath}\n  - Blocked: ${summary.blockedCount}\n  - Warning: ${summary.warningCount}\n  - Ready: ${summary.readyCount}\n  - Next step: ${summary.nextStep}`,
    )
    .join("\n");
}

function renderReleasePackageMarkdown(releasePackage) {
  const blockedItems = releasePackage.blockedItems
    .map(
      (item) =>
        `- ${item.title} (${item.source})\n  - Owner: ${item.owner.label} (${item.owner.lane})\n  - Route: ${item.owner.defaultPath}\n  - Summary: ${item.summary}\n  - Next step: ${item.resolutionAction}\n  ${item.details
          .map((detail) => `  - ${detail}`)
          .join("\n")}`,
    )
    .join("\n");
  const warningItems = releasePackage.warningItems
    .map(
      (item) =>
        `- ${item.title} (${item.source})\n  - Owner: ${item.owner.label} (${item.owner.lane})\n  - Route: ${item.owner.defaultPath}\n  - Summary: ${item.summary}\n  - Next step: ${item.resolutionAction}\n  ${item.details
          .map((detail) => `  - ${detail}`)
          .join("\n")}`,
    )
    .join("\n");
  const nextActions = releasePackage.nextActions
    .map((action) => `- ${action}`)
    .join("\n");
  const ownerSummaries = renderOwnerSummariesMarkdown(
    releasePackage.releaseReadiness.ownerSummaries,
  );
  const evidenceNotes =
    releasePackage.releaseEvidence?.notes.map((note) => `- ${note}`).join("\n") ??
    "- No stored release evidence is available yet.";

  return [
    "# Release Package",
    "",
    `- Generated at: ${releasePackage.generatedAt}`,
    `- Verification mode: ${releasePackage.verificationMode}`,
    `- Target base URL: ${releasePackage.targetBaseUrl}`,
    `- Runtime environment: ${releasePackage.runtimeEnvironment}`,
    `- Canonical URL: ${releasePackage.canonicalUrl}`,
    `- Overall status: ${releasePackage.overallStatus}`,
    `- Blocked items: ${releasePackage.blockedCount}`,
    `- Warning items: ${releasePackage.warningCount}`,
    `- Ready items: ${releasePackage.readyCount}`,
    "",
    "## Blocked Items",
    blockedItems || "- None.",
    "",
    "## Warning Items",
    warningItems || "- None.",
    "",
    "## Blocker Ownership",
    ownerSummaries,
    "",
    "## Next Actions",
    nextActions || "- None.",
    "",
    "## Latest Evidence Notes",
    evidenceNotes,
    "",
  ].join("\n");
}

function writeReleasePackageArtifacts(releasePackage) {
  mkdirSync(path.dirname(releasePackageFile), { recursive: true });
  writeFileSync(releasePackageFile, JSON.stringify(releasePackage, null, 2));
  writeFileSync(
    releasePackageMarkdownFile,
    renderReleasePackageMarkdown(releasePackage),
  );
}

function renderReleaseHistoryMarkdown(releasePackages) {
  if (!releasePackages.length) {
    return "# Release History\n\n- No published release packages are stored yet.\n";
  }

  return [
    "# Release History",
    "",
    ...releasePackages.flatMap((record) => [
      `## ${record.id}`,
      "",
      `- Published at: ${record.publishedAt}`,
      `- Actor: ${record.actor.name} (${record.actor.role})`,
      `- Verification mode: ${record.verificationMode}`,
      `- Target base URL: ${record.targetBaseUrl}`,
      `- Overall status: ${record.overallStatus}`,
      `- Blocked items: ${record.blockedCount}`,
      `- Warning items: ${record.warningCount}`,
      `- Ready items: ${record.readyCount}`,
      "- Blocker ownership:",
      renderOwnerSummariesMarkdown(record.artifact.releaseReadiness.ownerSummaries),
      "",
    ]),
  ].join("\n");
}

function writeReleaseHistoryArtifacts(releasePackages) {
  mkdirSync(path.dirname(releaseHistoryFile), { recursive: true });
  writeFileSync(releaseHistoryFile, JSON.stringify(releasePackages, null, 2));
  writeFileSync(
    releaseHistoryMarkdownFile,
    renderReleaseHistoryMarkdown(releasePackages),
  );
}

function renderReleaseDiffMarkdown(releaseComparison) {
  return [
    "# Release Drift",
    "",
    `- Compared at: ${releaseComparison.comparedAt}`,
    `- Status: ${releaseComparison.status}`,
    `- Latest published record: ${releaseComparison.latestPublishedRecord?.id ?? "none"}`,
    `- Blocked delta: ${releaseComparison.countDeltas.blocked.delta}`,
    `- Warning delta: ${releaseComparison.countDeltas.warning.delta}`,
    `- Ready delta: ${releaseComparison.countDeltas.ready.delta}`,
    "",
    "## Summary",
    ...(releaseComparison.summary.length
      ? releaseComparison.summary.map((item) => `- ${item}`)
      : ["- No summary items."]),
    "",
  ].join("\n");
}

function writeReleaseDiffArtifacts(releaseComparison) {
  mkdirSync(path.dirname(releaseDiffFile), { recursive: true });
  writeFileSync(releaseDiffFile, JSON.stringify(releaseComparison, null, 2));
  writeFileSync(
    releaseDiffMarkdownFile,
    renderReleaseDiffMarkdown(releaseComparison),
  );
}

function renderReleaseHandoffMarkdown(releaseHandoffs) {
  if (!releaseHandoffs.length) {
    return "# Release Handoffs\n\n- No release handoffs are stored yet.\n";
  }

  return [
    "# Release Handoffs",
    "",
    ...releaseHandoffs.flatMap((record) => [
      `## ${record.id}`,
      "",
      `- Handed off at: ${record.handedOffAt}`,
      `- Actor: ${record.actor.name} (${record.actor.role})`,
      `- Reviewed packet: ${record.releasePacketGeneratedAt}`,
      `- Review token: ${record.releasePacketReviewToken}`,
      `- Review window minutes: ${record.releasePacketReviewWindowMinutes}`,
      `- Handed off owner lanes: ${record.handedOffOwnerIds.join(", ") || "none"}`,
      `- Verification mode: ${record.verificationMode}`,
      `- Target base URL: ${record.targetBaseUrl}`,
      `- Overall status: ${record.overallStatus}`,
      `- Rationale: ${record.rationale}`,
      "- Owner summaries:",
      renderOwnerSummariesMarkdown(record.ownerSummaries),
      ...(record.notes.length
        ? ["- Notes:", ...record.notes.map((note) => `  - ${note}`)]
        : ["- Notes: none"]),
      "",
    ]),
  ].join("\n");
}

function writeReleaseHandoffArtifacts(releaseHandoffs) {
  mkdirSync(path.dirname(releaseHandoffFile), { recursive: true });
  writeFileSync(releaseHandoffFile, JSON.stringify(releaseHandoffs, null, 2));
  writeFileSync(
    releaseHandoffMarkdownFile,
    renderReleaseHandoffMarkdown(releaseHandoffs),
  );
}

function renderReleaseDecisionMarkdown(releaseDecisions) {
  if (!releaseDecisions.length) {
    return "# Release Decisions\n\n- No release decisions are stored yet.\n";
  }

  return [
    "# Release Decisions",
    "",
    ...releaseDecisions.flatMap((record) => [
      `## ${record.id}`,
      "",
      `- Decided at: ${record.decidedAt}`,
      `- Actor: ${record.actor.name} (${record.actor.role})`,
      `- Verdict: ${record.verdict}`,
      `- Reviewed packet: ${record.releasePacketGeneratedAt}`,
      `- Review token: ${record.releasePacketReviewToken}`,
      `- Review window minutes: ${record.releasePacketReviewWindowMinutes}`,
      `- Acknowledged blocked items: ${record.acknowledgedBlockedItemIds.join(", ") || "none"}`,
      `- Published package: ${record.releasePackageRecordId}`,
      `- Compare status: ${record.compareStatus}`,
      `- Verification mode: ${record.verificationMode}`,
      `- Target base URL: ${record.targetBaseUrl}`,
      `- Overall status: ${record.overallStatus}`,
      `- Rationale: ${record.rationale}`,
      ...(record.notes.length
        ? ["- Notes:", ...record.notes.map((note) => `  - ${note}`)]
        : ["- Notes: none"]),
      "",
    ]),
  ].join("\n");
}

function writeReleaseDecisionArtifacts(releaseDecisions) {
  mkdirSync(path.dirname(releaseDecisionFile), { recursive: true });
  writeFileSync(releaseDecisionFile, JSON.stringify(releaseDecisions, null, 2));
  writeFileSync(
    releaseDecisionMarkdownFile,
    renderReleaseDecisionMarkdown(releaseDecisions),
  );
}

function renderReleasePacketMarkdown(releasePacket) {
  const executiveSummary = releasePacket.executiveSummary
    .map((item) => `- ${item}`)
    .join("\n");
  const blockerHighlights = releasePacket.blockerHighlights
    .map((item) => `- ${item}`)
    .join("\n");
  const nextActions = releasePacket.nextActions
    .map((item) => `- ${item}`)
    .join("\n");
  const integrationContract = releasePacket.integrationContract.lanes
    .map(
      (lane) =>
        `- ${lane.title} (${lane.status})\n  - Route: ${lane.ownerPath}\n  - Current mode: ${lane.currentMode}\n  - Evidence: ${lane.evidence}\n  - Next action: ${lane.nextAction}\n  - Missing bindings: ${lane.missingBindings.length ? lane.missingBindings.join("; ") : "none"}`,
    )
    .join("\n");
  const ownerSummaries = renderOwnerSummariesMarkdown(
    releasePacket.currentArtifact.releaseReadiness.ownerSummaries,
  );

  return [
    "# Release Packet",
    "",
    `- Generated at: ${releasePacket.generatedAt}`,
    `- Review token: ${releasePacket.reviewToken}`,
    `- Review window minutes: ${releasePacket.reviewWindowMinutes}`,
    `- Review expires at: ${releasePacket.reviewExpiresAt}`,
    `- Overall status: ${releasePacket.overallStatus}`,
    `- Verification mode: ${releasePacket.verificationMode}`,
    `- Target base URL: ${releasePacket.targetBaseUrl}`,
    `- Runtime environment: ${releasePacket.runtimeEnvironment}`,
    `- Canonical URL: ${releasePacket.canonicalUrl}`,
    `- Latest published record: ${releasePacket.latestPublishedRecord?.id ?? "none"}`,
    `- Latest handoff: ${releasePacket.latestHandoff?.id ?? "none"}`,
    `- Latest handoff review: ${releasePacket.latestHandoffReview.status}`,
    `- Latest decision: ${releasePacket.latestDecision?.verdict ?? "none"}`,
    `- Latest decision review: ${releasePacket.latestDecisionReview.status}`,
    `- Latest decision delta: ${releasePacket.latestDecisionDelta.status}`,
    `- Comparison status: ${releasePacket.comparison.status}`,
    `- Content launch blockers: ${releasePacket.contentGovernance.launchBlocked}`,
    "",
    "## Executive Summary",
    executiveSummary || "- None.",
    "",
    "## Blocker Ownership",
    ownerSummaries,
    "",
    "## Latest Handoff Review",
    `- ${releasePacket.latestHandoffReview.summary}`,
    ...(releasePacket.latestHandoffReview.details.length
      ? releasePacket.latestHandoffReview.details.map((item) => `- ${item}`)
      : ["- No additional detail."]),
    "",
    "## Latest Decision Review",
    `- ${releasePacket.latestDecisionReview.summary}`,
    ...(releasePacket.latestDecisionReview.details.length
      ? releasePacket.latestDecisionReview.details.map((item) => `- ${item}`)
      : ["- No additional detail."]),
    "",
    "## Latest Decision Delta",
    ...(releasePacket.latestDecisionDelta.summary.length
      ? releasePacket.latestDecisionDelta.summary.map((item) => `- ${item}`)
      : ["- No decision delta detail."]),
    ...(releasePacket.latestDecisionDelta.countDeltas
      ? [
          `- Blocked delta: ${releasePacket.latestDecisionDelta.countDeltas.blocked.delta}`,
          `- Warning delta: ${releasePacket.latestDecisionDelta.countDeltas.warning.delta}`,
          `- Ready delta: ${releasePacket.latestDecisionDelta.countDeltas.ready.delta}`,
        ]
      : ["- No structured decision delta is available."]),
    "",
    "## Blocker Highlights",
    blockerHighlights || "- None.",
    "",
    "## Integration Contract",
    `- Overall status: ${releasePacket.integrationContract.overallStatus}`,
    `- Blocked lanes: ${releasePacket.integrationContract.blockedCount}`,
    `- Warning lanes: ${releasePacket.integrationContract.warningCount}`,
    `- Ready lanes: ${releasePacket.integrationContract.readyCount}`,
    `- Summary: ${releasePacket.integrationContract.summary}`,
    integrationContract || "- None.",
    "",
    "## Next Actions",
    nextActions || "- None.",
    "",
  ].join("\n");
}

function writeReleasePacketArtifacts(releasePacket) {
  mkdirSync(path.dirname(releasePacketFile), { recursive: true });
  writeFileSync(releasePacketFile, JSON.stringify(releasePacket, null, 2));
  writeFileSync(
    releasePacketMarkdownFile,
    renderReleasePacketMarkdown(releasePacket),
  );
}

async function shutdownChildProcess(childProcess) {
  if (!childProcess || childProcess.exitCode !== null || childProcess.killed) {
    return;
  }

  childProcess.kill("SIGTERM");
  await delay(1000);

  if (childProcess.exitCode === null && !childProcess.killed) {
    childProcess.kill("SIGKILL");
    await delay(500);
  }
}

async function shutdownServer() {
  await shutdownChildProcess(server);
  await shutdownChildProcess(providerServer);
}

async function waitForProviderServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (providerServer?.exitCode !== null) {
      throw new Error(
        `Mock provider server exited before readiness.\n\nRecent logs:\n${formatRecentLogs()}`,
      );
    }

    try {
      const response = await fetch(`${providerBaseUrl}/health`, {
        cache: "no-store",
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload.status === "ok") {
          return payload;
        }
      }
    } catch {
      // Provider server is still starting.
    }

    await delay(500);
  }

  throw new Error(
    `Timed out waiting for mock provider server readiness at ${providerBaseUrl}.`,
  );
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(
        `Smoke server exited before readiness.\n\nRecent logs:\n${formatRecentLogs()}`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        cache: "no-store",
      });

      if (response.ok) {
        const payload = await response.json();
        if (payload.status === "ok") {
          return payload;
        }
      }
    } catch {
      // Server is still starting.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for smoke server readiness at ${baseUrl}.`);
}

async function fetchText(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    cache: "no-store",
    ...init,
  });

  const body = await response.text();
  return { response, body };
}

async function fetchJson(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    cache: "no-store",
    ...init,
  });

  const body = await response.json();
  return { response, body };
}

async function fetchHead(pathname, init = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    method: "HEAD",
    cache: "no-store",
    ...init,
  });
}

function joinCookies(...cookies) {
  return cookies.filter(Boolean).join("; ");
}

async function sendJson(method, pathname, body, init = {}) {
  const { headers: extraHeaders = {}, ...restInit } = init;

  return fetchJson(pathname, {
    method,
    ...restInit,
    headers: {
      ...trustedMutationHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

function assertIncludes(body, marker, pathname) {
  assert.ok(
    body.includes(marker),
    `Expected ${pathname} to include marker: ${marker}`,
  );
}

function assertExcludes(body, marker, pathname) {
  assert.ok(
    !body.includes(marker),
    `Expected ${pathname} to exclude marker: ${marker}`,
  );
}

function extractCookie(response, cookieName) {
  const setCookieHeader = response.headers.get("set-cookie");
  assert.ok(setCookieHeader, `Expected response to include ${cookieName} cookie`);

  const match = setCookieHeader.match(new RegExp(`${cookieName}=[^;]+`));
  assert.ok(match, `Expected ${cookieName} cookie in Set-Cookie header`);

  return match[0];
}

const publicSmokeChecks = [
  {
    pathname: "/",
    markers: [
      "nav_search",
      "home_entry_haircare",
      "/manifest.webmanifest",
      "/opengraph-image",
    ],
  },
  {
    pathname: "/shop",
    markers: [
      "shop_hub_collection_haircare",
      "shop_hub_to_trust",
      "shop_hub_to_concerns",
    ],
  },
  {
    pathname: "/shop/haircare",
    markers: [
      "collection_haircare_primary_route",
      "collection_haircare_to_shop_hub",
    ],
  },
  {
    pathname: "/products/radiant-dew-serum",
    markers: ["og-product.svg", "product_to_cart_radiant-dew-serum"],
  },
  {
    pathname: "/journal/niacinamide-vs-vitamin-c-which-fits-your-routine",
    markers: [
      "og-journal.svg",
      "article_to_trust_niacinamide-vs-vitamin-c-which-fits-your-routine",
    ],
  },
  {
    pathname: "/cart",
    markers: ['content="noindex, nofollow"', "footer_support_cart"],
  },
  {
    pathname: "/ops-access?next=%2Fops",
    markers: [
      "Ops access gate",
      "ops_access_to_dashboard",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops-access?next=%2Fops%2Faudit",
    markers: [
      "Ops access gate",
      "ops_access_to_audit",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops-access?next=%2Fops%2Fnotifications",
    markers: [
      "Ops access gate",
      "ops_access_to_notifications",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/ops-access?next=%2Fops%2Frelease",
    markers: [
      "Ops access gate",
      "ops_access_to_release",
      'content="noindex, nofollow"',
    ],
  },
  {
    pathname: "/robots.txt",
    markers: ["User-Agent: *", "Disallow: /"],
  },
];

const protectedOpsChecks = [
  {
    pathname: "/ops",
    markers: ['content="noindex, nofollow"'],
  },
  {
    pathname: "/ops/orders",
    markers: ['content="noindex, nofollow"'],
  },
  {
    pathname: "/ops/catalog",
    markers: ['content="noindex, nofollow"'],
  },
  {
    pathname: "/ops/content",
    markers: ['content="noindex, nofollow"'],
  },
  {
    pathname: "/ops/release",
    markers: ['content="noindex, nofollow"'],
  },
  {
    pathname: "/ops/fulfillment",
    markers: ['content="noindex, nofollow"'],
  },
  {
    pathname: "/ops/audit",
    markers: ['content="noindex, nofollow"'],
  },
  {
    pathname: "/ops/notifications",
    markers: ['content="noindex, nofollow"'],
  },
];

const assetChecks = ["/og-product.svg", "/og-journal.svg"];

process.on("SIGINT", () => {
  void shutdownServer().finally(() => process.exit(1));
});

process.on("SIGTERM", () => {
  void shutdownServer().finally(() => process.exit(1));
});

safeCleanupAuthorityState();
resetReleaseArtifacts();

providerServer = spawn(process.execPath, [mockProviderScript], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    MOCK_PROVIDER_HOST: providerHost,
    MOCK_PROVIDER_PORT: String(providerPort),
    MOCK_PROVIDER_BASE_URL: providerBaseUrl,
    MOCK_PAYMENT_PROVIDER_API_KEY: paymentProviderApiKey,
    MOCK_SHIPPING_PROVIDER_API_KEY: shippingProviderApiKey,
    MOCK_NOTIFICATION_PROVIDER_API_KEY: notificationProviderApiKey,
    MOCK_AUTH_PROVIDER_CLIENT_ID: authProviderClientId,
    MOCK_AUTH_PROVIDER_CLIENT_SECRET: authProviderClientSecret,
    MOCK_AUTH_PROVIDER_EMAIL: authProviderEmail,
    MOCK_AUTH_PROVIDER_PHONE: authProviderPhone,
    MOCK_AUTH_PROVIDER_SUBJECT: authProviderSubject,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

providerServer.stdout.on("data", (chunk) => appendLog(chunk, "[provider] "));
providerServer.stderr.on("data", (chunk) => appendLog(chunk, "[provider] "));

server = spawn(process.execPath, [standaloneStartScript], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: baseUrl,
    PORT: String(port),
    HOSTNAME: host,
    OPS_AUTH_USERS_JSON: JSON.stringify([
      {
        id: "manager",
        name: "Smoke Manager",
        role: "manager",
        username: opsManagerUsername,
        passwordHash:
          "scrypt$V0g4xKAfr5fs8KbyqDGz+w==$KtF2LAD+/iUv3nc2xoaahQflidn+UBhky2Va1Zf2rZ1Pkex5h28D3jTFCjZwcokyukHpX8aV97/pSFkC02QiDg==",
      },
      {
        id: "catalog",
        name: "Smoke Catalog",
        role: "catalog_operator",
        username: opsCatalogUsername,
        passwordHash:
          "scrypt$VZqgRZ7iQ1a6cSa0wMLPcw==$TxYvPyblj+ajRequEMrZXXUFrFL8rIcnUTCGuQExaAHP2WElqMoEe81xghsBI7MP2bBfOou0MoQ3K9NKrkvleg==",
      },
    ]),
    OPS_ACCESS_SIGNING_SECRET: "smoke-ops-signing-secret",
    ENFORCE_OPS_ACCESS: "true",
    AUTHORITY_DB_PATH: authorityDbFile,
    ORDER_AUTHORITY_SECRET: orderAuthoritySecret,
    ORDER_AUTHORITY_FILE: orderAuthorityFile,
    OPS_AUDIT_FILE: opsAuditFile,
    NOTIFICATION_AUTHORITY_FILE: notificationAuthorityFile,
    RELEASE_EVIDENCE_PATH: releaseEvidenceFile,
    AUTH_PROVIDER_CALLBACK_SECRET: authProviderSecret,
    AUTH_PROVIDER_LABEL: authProviderLabel,
    AUTH_PROVIDER_AUTHORIZE_URL: `${providerBaseUrl}/auth/authorize`,
    AUTH_PROVIDER_TOKEN_URL: `${providerBaseUrl}/auth/token`,
    AUTH_PROVIDER_PROFILE_URL: `${providerBaseUrl}/auth/profile`,
    AUTH_PROVIDER_CLIENT_ID: authProviderClientId,
    AUTH_PROVIDER_CLIENT_SECRET: authProviderClientSecret,
    PAYMENT_PROVIDER_CALLBACK_SECRET: paymentProviderSecret,
    PAYMENT_PROVIDER_LABEL: paymentProviderLabel,
    PAYMENT_PROVIDER_BASE_URL: providerBaseUrl,
    PAYMENT_PROVIDER_REQUEST_PATH: "/payments/links",
    PAYMENT_PROVIDER_API_KEY: paymentProviderApiKey,
    SHIPPING_PROVIDER_CALLBACK_SECRET: shippingProviderSecret,
    SHIPPING_PROVIDER_LABEL: shippingProviderLabel,
    SHIPPING_PROVIDER_BASE_URL: providerBaseUrl,
    SHIPPING_PROVIDER_REQUEST_PATH: "/shipments/bookings",
    SHIPPING_PROVIDER_API_KEY: shippingProviderApiKey,
    NOTIFICATION_PROVIDER_CALLBACK_SECRET: notificationProviderSecret,
    NOTIFICATION_PROVIDER_LABEL: notificationProviderLabel,
    NOTIFICATION_PROVIDER_BASE_URL: providerBaseUrl,
    NOTIFICATION_PROVIDER_REQUEST_PATH: "/notifications/send",
    NOTIFICATION_PROVIDER_API_KEY: notificationProviderApiKey,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", (chunk) => appendLog(chunk));
server.stderr.on("data", (chunk) => appendLog(chunk));

try {
  const providerHealth = await waitForProviderServer();
  assert.equal(providerHealth.status, "ok");
  const health = await waitForServer();
  assert.equal(health.status, "ok");
  assert.equal(health.authorityStorage?.engine, "sqlite");

  const { response: healthResponse } = await fetchJson("/api/health");
  assert.equal(healthResponse.status, 200);
  assert.equal(healthResponse.headers.get("cache-control"), "no-store");
  assert.equal(health.runtimeStage, "local");
  assert.equal(health.searchIndexingEnabled, false);
  assert.equal(health.canonicalUrl, baseUrl);

  const opsRedirectResponse = await fetch(`${baseUrl}/ops`, {
    cache: "no-store",
    redirect: "manual",
  });
  assert.equal(opsRedirectResponse.status, 307);
  assert.ok(
    (opsRedirectResponse.headers.get("location") ?? "").includes("/ops-access"),
    "Expected /ops to redirect to /ops-access before authentication",
  );

  for (const pathname of assetChecks) {
    const response = await fetchHead(pathname);
    assert.equal(response.status, 200, `Expected ${pathname} to return 200`);
    assert.equal(
      response.headers.get("content-type"),
      "image/svg+xml",
      `Expected ${pathname} to return image/svg+xml`,
    );
  }

  for (const check of publicSmokeChecks) {
    const { response, body } = await fetchText(check.pathname);
    assert.equal(
      response.status,
      200,
      `Expected ${check.pathname} to return 200`,
    );

    for (const marker of check.markers) {
      assertIncludes(body, marker, check.pathname);
    }
  }

  const homeHeadResponse = await fetchHead("/");
  assert.equal(homeHeadResponse.status, 200, "Expected / HEAD request to return 200");
  assert.equal(
    homeHeadResponse.headers.get("x-robots-tag"),
    "noindex, nofollow, noarchive",
    "Expected local smoke responses to expose preview-safe X-Robots-Tag headers",
  );

  const { response: sitemapResponse, body: sitemapBody } = await fetchText(
    "/sitemap.xml",
  );
  assert.equal(sitemapResponse.status, 200, "Expected /sitemap.xml to return 200");
  assert.match(
    sitemapResponse.headers.get("content-type") ?? "",
    /xml/i,
    "Expected /sitemap.xml to return XML content",
  );

  for (const marker of [
    "/shop/haircare",
    "/shop/beauty-sets",
    "/products/radiant-dew-serum",
    "/journal/niacinamide-vs-vitamin-c-which-fits-your-routine",
  ]) {
    assertExcludes(sitemapBody, marker, "/sitemap.xml");
  }

  const { response: createOrderResponse, body: createOrderBody } = await sendJson(
    "POST",
    "/api/orders",
    {
      items: [
        {
          productSlug: "radiant-dew-serum",
          sku: "RD-30",
          quantity: 1,
        },
      ],
      checkout: {
        fullName: "Smoke Test Customer",
        phone: "0501234567",
        email: "smoke@example.com",
        city: "الرياض",
        district: "العليا",
        addressLine: "شارع الملك فهد، مبنى 10",
        notes: "Smoke test order",
        shippingMethodId: "standard",
        paymentMethodId: "payment_link",
        acceptPolicies: true,
        acceptUpdates: true,
      },
    },
  );
  assert.equal(createOrderResponse.status, 201);
  assert.ok(createOrderBody.order.orderNumber, "Expected created order reference");
  const createdPaymentNotification = createOrderBody.notifications.find(
    (notification) => notification.templateKey === "payment_link",
  );
  const createdOrderReceivedNotification = createOrderBody.notifications.find(
    (notification) => notification.templateKey === "order_received",
  );
  assert.ok(
    Array.isArray(createOrderBody.notifications) &&
      createdPaymentNotification &&
      createdOrderReceivedNotification,
    "Expected created order response to include active notification queue items",
  );
  assert.equal(
    typeof createOrderBody.customerAccessHandoffPath,
    "string",
    "Expected created order response to include a cross-device customer access handoff path",
  );
  assert.ok(
    createOrderBody.customerAccessHandoffPath.includes("/account/access?token="),
    "Expected created order response to expose a signed customer access handoff route",
  );
  assert.equal(
    createOrderBody.order.status,
    "payment_pending",
    "Expected payment-link smoke orders to start in payment_pending state",
  );
  assert.equal(
    createOrderBody.order.providerBindings.payment.state,
    "link_sent",
    "Expected payment-link smoke orders to create a live payment-link provider binding immediately",
  );
  assert.equal(
    createOrderBody.order.providerBindings.shipping.state,
    "pending",
    "Expected smoke orders to start with a pending shipping provider binding",
  );
  assert.equal(
    createOrderBody.order.providerBindings.payment.providerLabel,
    paymentProviderLabel,
  );
  assert.ok(
    typeof createOrderBody.order.providerBindings.payment.referenceId === "string" &&
      createOrderBody.order.providerBindings.payment.referenceId.length > 0,
    "Expected payment-link smoke orders to persist a live provider payment reference",
  );
  assert.ok(
    typeof createOrderBody.order.providerBindings.payment.paymentUrl === "string" &&
      createOrderBody.order.providerBindings.payment.paymentUrl.startsWith(
        `${providerBaseUrl}/checkout/pay/`,
      ),
    "Expected payment-link smoke orders to expose a live provider payment URL",
  );
  assert.equal(createdPaymentNotification.status, "sent");
  assert.equal(createdPaymentNotification.providerLabel, notificationProviderLabel);
  assert.ok(
    typeof createdPaymentNotification.providerDeliveryId === "string" &&
      createdPaymentNotification.providerDeliveryId.length > 0,
    "Expected the payment-link notification to be dispatched through the live notification provider",
  );
  assert.equal(createdOrderReceivedNotification.status, "sent");
  assert.equal(
    createdOrderReceivedNotification.providerLabel,
    notificationProviderLabel,
  );

  const recentOrderCookie = extractCookie(
    createOrderResponse,
    "cozmateks-recent-order",
  );

  const { response: recentOrderResponse, body: recentOrderBody } = await fetchJson(
    `/api/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`,
    {
      headers: {
        Cookie: recentOrderCookie,
      },
    },
  );
  assert.equal(
    recentOrderResponse.status,
    200,
    "Expected recent-order API lookup to return 200",
  );
  assert.equal(
    recentOrderBody.order.orderNumber,
    createOrderBody.order.orderNumber,
  );
  assert.ok(
    recentOrderBody.notifications.some(
      (notification) =>
        notification.templateKey === "payment_link" &&
        notification.status === "sent",
    ),
    "Expected recent-order API to include dispatched notification items",
  );
  const orderAccessCookie = extractCookie(
    recentOrderResponse,
    "cozmateks-order-access",
  );

  const {
    response: orderAccessResponse,
    body: orderAccessBody,
  } = await fetchJson(
    `/api/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`,
    {
      headers: {
        Cookie: orderAccessCookie,
      },
    },
  );
  assert.equal(
    orderAccessResponse.status,
    200,
    "Expected order-access session lookup to return 200 without phone-last-four after the first trusted lookup",
  );
  assert.equal(
    orderAccessBody.order.orderNumber,
    createOrderBody.order.orderNumber,
  );

  const { response: trackedOrderResponse, body: trackedOrderBody } = await fetchJson(
    `/api/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}?phoneLastFour=4567`,
  );
  assert.equal(
    trackedOrderResponse.status,
    200,
    "Expected tracked-order API lookup to return 200",
  );
  assert.equal(
    trackedOrderBody.order.orderNumber,
    createOrderBody.order.orderNumber,
  );
  assert.ok(
    trackedOrderBody.notifications.some(
      (notification) =>
        notification.templateKey === "payment_link" &&
        notification.status === "sent",
    ),
    "Expected tracked-order API to include dispatched notification items",
  );

  const { response: loginResponse, body: loginBody } = await sendJson(
    "POST",
    "/api/ops-access/login",
    {
      username: opsManagerUsername,
      password: opsManagerPassword,
      nextPath: "/ops",
    },
  );
  assert.equal(loginResponse.status, 200, "Expected manager ops login to return 200");
  assert.equal(loginBody.ok, true);
  assert.equal(loginBody.redirectTo, "/ops");

  const opsCookie = extractCookie(loginResponse, "cozmateks-ops-session");

  const logoutWithoutOriginResponse = await fetch(`${baseUrl}/api/ops-access/logout`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(logoutWithoutOriginResponse.status, 403);

  const { response: opsSessionResponse, body: opsSessionBody } = await fetchJson(
    "/api/ops/session",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    opsSessionResponse.status,
    200,
    "Expected ops session summary to return 200 after login",
  );
  assert.equal(opsSessionBody.session.role, "manager");
  assert.equal(opsSessionBody.session.authMethod, "identity_password");
  assert.equal(opsSessionBody.session.username, opsManagerUsername);

  const { response: opsReleaseResponse, body: opsReleaseBody } = await fetchJson(
    "/api/ops/release",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    opsReleaseResponse.status,
    200,
    "Expected ops release API to return 200 for manager role",
  );
  assert.equal(opsReleaseBody.releaseReadiness.overallStatus, "blocked");
  assert.ok(
    opsReleaseBody.releaseReadiness.gates.some(
      (gate) => gate.id === "transactional-backend",
    ),
    "Expected ops release API to include the transactional-backend gate",
  );
  assert.ok(
    opsReleaseBody.releaseReadiness.runtimePreflight,
    "Expected ops release API to include runtime preflight details",
  );
  assert.ok(
    opsReleaseBody.releaseReadiness.runtimePreflight.checks.some(
      (check) => check.id === "signing-secrets",
    ),
    "Expected ops release API to include the signing-secrets preflight check",
  );
  assert.ok(
    opsReleaseBody.releaseReadiness.ownerSummaries.length > 0,
    "Expected ops release API to expose blocker ownership summaries",
  );
  assert.equal(
    opsReleaseBody.releaseReadiness.gates.find(
      (gate) => gate.id === "hosting-runtime",
    )?.owner?.id,
    "platform-runtime",
  );
  assert.equal(
    opsReleaseBody.releaseReadiness.runtimePreflight.checks.find(
      (check) => check.id === "signing-secrets",
    )?.owner?.id,
    "security-access",
  );

  const { response: opsOrdersResponse, body: opsOrdersBody } = await fetchJson(
    "/api/ops/orders",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    opsOrdersResponse.status,
    200,
    "Expected ops orders API to return 200 for manager role",
  );
  assert.ok(
    opsOrdersBody.orders.some(
      (order) => order.orderNumber === createOrderBody.order.orderNumber,
    ),
    "Expected ops orders API to include the smoke order",
  );

  const {
    response: opsNotificationsResponse,
    body: opsNotificationsBody,
  } = await fetchJson("/api/ops/notifications", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    opsNotificationsResponse.status,
    200,
    "Expected ops notifications API to return 200 for manager role",
  );

  const smokeNotification = opsNotificationsBody.notifications.find(
    (notification) =>
      notification.orderNumber === createOrderBody.order.orderNumber &&
      notification.templateKey === "payment_link",
  );

  assert.ok(
    smokeNotification,
    "Expected ops notifications API to include the smoke payment-link notification",
  );
  assert.equal(smokeNotification.status, "sent");
  assert.equal(smokeNotification.providerLabel, notificationProviderLabel);
  assert.ok(
    typeof smokeNotification.providerDeliveryId === "string" &&
      smokeNotification.providerDeliveryId.length > 0,
    "Expected ops notifications API to expose the live provider delivery id",
  );

  const {
    response: prematureOrderAdvanceResponse,
    body: prematureOrderAdvanceBody,
  } = await sendJson(
    "PATCH",
    `/api/ops/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`,
    {},
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    prematureOrderAdvanceResponse.status,
    409,
    "Expected ops order status update to reject payment-link orders before provider confirmation",
  );
  assert.ok(
    typeof prematureOrderAdvanceBody.error === "string" &&
      prematureOrderAdvanceBody.error.length > 0,
    "Expected premature status advancement to return a descriptive error message",
  );

  const {
    response: requeueNotificationResponse,
    body: requeueNotificationBody,
  } = await sendJson(
    "PATCH",
    `/api/ops/notifications/${encodeURIComponent(smokeNotification.id)}`,
    {
      status: "queued",
    },
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    requeueNotificationResponse.status,
    200,
    "Expected ops notification requeue to return 200",
  );
  assert.equal(requeueNotificationBody.previousStatus, "sent");
  assert.equal(requeueNotificationBody.nextStatus, "queued");

  const {
    response: resendNotificationResponse,
    body: resendNotificationBody,
  } = await sendJson(
    "PATCH",
    `/api/ops/notifications/${encodeURIComponent(smokeNotification.id)}`,
    {
      status: "sent",
    },
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    resendNotificationResponse.status,
    200,
    "Expected ops notification resend to dispatch through the live provider",
  );
  assert.equal(
    resendNotificationBody.previousStatus,
    "queued",
  );
  assert.equal(resendNotificationBody.nextStatus, "sent");
  assert.equal(
    resendNotificationBody.notification.providerLabel,
    notificationProviderLabel,
  );
  assert.ok(
    typeof resendNotificationBody.notification.providerDeliveryId === "string" &&
      resendNotificationBody.notification.providerDeliveryId.length > 0,
    "Expected resend to persist a live notification provider delivery id",
  );

  const {
    response: blockedAfterLinkResponse,
    body: blockedAfterLinkBody,
  } = await sendJson(
    "PATCH",
    `/api/ops/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`,
    {},
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    blockedAfterLinkResponse.status,
    409,
    "Expected payment-link orders to remain blocked until the provider callback confirms payment",
  );
  assert.ok(
    typeof blockedAfterLinkBody.error === "string" &&
      blockedAfterLinkBody.error.length > 0,
    "Expected blocked payment-link orders to keep returning a descriptive confirmation error",
  );

  const {
    response: paymentCallbackResponse,
    body: paymentCallbackBody,
  } = await sendJson(
    "POST",
    "/api/providers/payment",
    {
      orderNumber: createOrderBody.order.orderNumber,
      paymentReferenceId: createOrderBody.order.providerBindings.payment.referenceId,
      settlementReference: "SET-SMOKE-01",
      eventId: "evt-payment-settlement-smoke-01",
      settledAt: "2026-04-04T10:15:00.000Z",
    },
    {
      headers: {
        Authorization: `Bearer ${paymentProviderSecret}`,
      },
    },
  );
  assert.equal(
    paymentCallbackResponse.status,
    200,
    "Expected the payment provider callback to confirm the smoke order",
  );
  assert.equal(paymentCallbackBody.ok, true);
  assert.equal(paymentCallbackBody.order.status, "confirmed");
  assert.equal(paymentCallbackBody.order.providerBindings.payment.state, "confirmed");
  assert.equal(
    paymentCallbackBody.order.providerBindings.payment.referenceId,
    createOrderBody.order.providerBindings.payment.referenceId,
    "Expected payment confirmation to preserve the existing provider reference",
  );
  assert.equal(
    paymentCallbackBody.order.providerBindings.payment.settlementReference,
    "SET-SMOKE-01",
    "Expected payment confirmation to persist the settlement reference",
  );
  assert.equal(
    paymentCallbackBody.order.providerBindings.payment.settlementEventId,
    "evt-payment-settlement-smoke-01",
    "Expected payment confirmation to persist the settlement event id",
  );

  const { response: updateOrderResponse, body: updateOrderBody } = await sendJson(
    "PATCH",
    `/api/ops/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`,
    {},
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    updateOrderResponse.status,
    200,
    "Expected ops order status update to move confirmed orders into processing",
  );
  assert.equal(updateOrderBody.previousStatus, "confirmed");
  assert.equal(updateOrderBody.nextStatus, "processing");

  const {
    response: preparationNotificationsResponse,
    body: preparationNotificationsBody,
  } = await fetchJson("/api/ops/notifications", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(preparationNotificationsResponse.status, 200);
  const preparationNotification = preparationNotificationsBody.notifications.find(
    (notification) =>
      notification.orderNumber === createOrderBody.order.orderNumber &&
      notification.templateKey === "preparation_update",
  );
  assert.ok(
    preparationNotification,
    "Expected processing orders to enqueue and dispatch the preparation update notification",
  );
  assert.equal(preparationNotification.status, "sent");
  assert.equal(preparationNotification.providerLabel, notificationProviderLabel);

  const {
    response: shippingBookedResponse,
    body: shippingBookedBody,
  } = await sendJson(
    "PATCH",
    `/api/ops/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}/provider`,
    {
      action: "shipping_booked",
    },
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    shippingBookedResponse.status,
    200,
    "Expected ops provider update to record the shipping booking handoff",
  );
  assert.equal(shippingBookedBody.action, "shipping_booked");
  assert.equal(shippingBookedBody.order.status, "processing");
  assert.equal(shippingBookedBody.order.providerBindings.shipping.state, "booked");
  assert.equal(
    shippingBookedBody.order.providerBindings.shipping.providerLabel,
    shippingProviderLabel,
  );
  assert.ok(
    typeof shippingBookedBody.order.providerBindings.shipping.bookingReference ===
      "string" &&
      shippingBookedBody.order.providerBindings.shipping.bookingReference.length > 0,
    "Expected shipping booking handoff to persist the live provider booking reference",
  );

  const {
    response: blockedDeliveryAdvanceResponse,
    body: blockedDeliveryAdvanceBody,
  } = await sendJson(
    "PATCH",
    `/api/ops/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`,
    {},
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    blockedDeliveryAdvanceResponse.status,
    409,
    "Expected processing orders to remain blocked until the shipping callback records in-transit status",
  );
  assert.ok(
    typeof blockedDeliveryAdvanceBody.error === "string" &&
      blockedDeliveryAdvanceBody.error.length > 0,
    "Expected the blocked delivery transition to return a descriptive shipping handoff error",
  );

  const {
    response: shippingCallbackResponse,
    body: shippingCallbackBody,
  } = await sendJson(
    "POST",
    "/api/providers/shipping",
    {
      orderNumber: createOrderBody.order.orderNumber,
      bookingReference:
        shippingBookedBody.order.providerBindings.shipping.bookingReference,
      trackingNumber: "TRK-SMOKE-01",
      eventId: "evt-shipping-in-transit-smoke-01",
      occurredAt: "2026-04-04T10:40:00.000Z",
    },
    {
      headers: {
        Authorization: `Bearer ${shippingProviderSecret}`,
      },
    },
  );
  assert.equal(
    shippingCallbackResponse.status,
    200,
    "Expected the shipping provider callback to move the smoke order into out_for_delivery",
  );
  assert.equal(shippingCallbackBody.ok, true);
  assert.equal(shippingCallbackBody.order.status, "out_for_delivery");
  assert.equal(
    shippingCallbackBody.order.providerBindings.shipping.state,
    "in_transit",
  );
  assert.equal(
    shippingCallbackBody.order.providerBindings.shipping.bookingReference,
    shippingBookedBody.order.providerBindings.shipping.bookingReference,
    "Expected shipping callback to preserve the existing booking reference",
  );
  assert.equal(
    shippingCallbackBody.order.providerBindings.shipping.trackingNumber,
    "TRK-SMOKE-01",
    "Expected shipping callback to persist the explicit tracking number",
  );
  assert.equal(
    shippingCallbackBody.order.providerBindings.shipping.carrierEventId,
    "evt-shipping-in-transit-smoke-01",
    "Expected shipping callback to persist the carrier event id",
  );

  const {
    response: deliveryNotificationsResponse,
    body: deliveryNotificationsBody,
  } = await fetchJson("/api/ops/notifications", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(deliveryNotificationsResponse.status, 200);
  const deliveryNotification = deliveryNotificationsBody.notifications.find(
    (notification) =>
      notification.orderNumber === createOrderBody.order.orderNumber &&
      notification.templateKey === "delivery_update",
  );
  assert.ok(
    deliveryNotification,
    "Expected out-for-delivery orders to publish a delivery update notification",
  );
  assert.equal(deliveryNotification.status, "sent");
  assert.equal(
    deliveryNotification.providerLabel,
    "Internal dashboard surface",
  );

  const {
    response: finalTrackedOrderResponse,
    body: finalTrackedOrderBody,
  } = await fetchJson(
    `/api/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}?phoneLastFour=4567`,
  );
  assert.equal(
    finalTrackedOrderResponse.status,
    200,
    "Expected tracked-order API lookup to keep working after provider callbacks",
  );
  assert.equal(finalTrackedOrderBody.order.status, "out_for_delivery");
  assert.equal(
    finalTrackedOrderBody.order.providerBindings.payment.state,
    "confirmed",
  );
  assert.equal(
    finalTrackedOrderBody.order.providerBindings.shipping.state,
    "in_transit",
  );
  assert.equal(
    finalTrackedOrderBody.order.providerBindings.shipping.trackingNumber,
    shippingCallbackBody.order.providerBindings.shipping.trackingNumber,
    "Expected tracked-order API to expose the persisted tracking number",
  );
  assert.equal(
    finalTrackedOrderBody.order.providerBindings.payment.settlementReference,
    "SET-SMOKE-01",
    "Expected tracked-order API to expose the persisted settlement reference",
  );

  const {
    response: crossDeviceAccessResponse,
  } = await fetchText(createOrderBody.customerAccessHandoffPath, {
    redirect: "manual",
  });
  assert.equal(
    crossDeviceAccessResponse.status,
    307,
    "Expected the signed account-access handoff to redirect into the external auth provider",
  );
  const providerAuthorizeLocation =
    crossDeviceAccessResponse.headers.get("location") ?? "";
  assert.ok(
    providerAuthorizeLocation.startsWith(`${providerBaseUrl}/auth/authorize?`),
    "Expected the signed account-access handoff to redirect into the configured auth provider",
  );

  const providerAuthorizeResponse = await fetch(providerAuthorizeLocation, {
    cache: "no-store",
    redirect: "manual",
  });
  assert.equal(
    providerAuthorizeResponse.status,
    307,
    "Expected the mock auth provider to redirect back into the app callback",
  );
  const providerCallbackLocation =
    providerAuthorizeResponse.headers.get("location") ?? "";
  assert.ok(
    providerCallbackLocation.startsWith(`${baseUrl}/api/providers/auth?code=`),
    "Expected the mock auth provider to redirect into the app auth callback with a code and state",
  );

  const providerCallbackResponse = await fetch(providerCallbackLocation, {
    cache: "no-store",
    redirect: "manual",
  });
  assert.equal(
    providerCallbackResponse.status,
    307,
    "Expected the app auth callback to mint customer cookies and redirect to /account/orders",
  );
  assert.ok(
    (providerCallbackResponse.headers.get("location") ?? "").includes(
      "/account/orders",
    ),
    "Expected the app auth callback to complete at /account/orders",
  );

  const crossDeviceCustomerAccessCookie = extractCookie(
    providerCallbackResponse,
    "cozmateks-customer-access",
  );
  const crossDeviceCustomerAccountCookie = extractCookie(
    providerCallbackResponse,
    "cozmateks-customer-account",
  );

  const {
    response: crossDeviceTrackedOrderResponse,
    body: crossDeviceTrackedOrderBody,
  } = await fetchJson(`/api/orders/${encodeURIComponent(createOrderBody.order.orderNumber)}`, {
    headers: {
      Cookie: crossDeviceCustomerAccessCookie,
    },
  });
  assert.equal(
    crossDeviceTrackedOrderResponse.status,
    200,
    "Expected cross-device customer access to restore tracked-order API access without phone-last-four",
  );
  assert.equal(
    crossDeviceTrackedOrderBody.order.orderNumber,
    createOrderBody.order.orderNumber,
  );
  assert.equal(
    crossDeviceTrackedOrderBody.order.providerBindings.payment.settlementReference,
    "SET-SMOKE-01",
    "Expected cross-device customer access to preserve settlement evidence on tracked-order API reads",
  );

  const {
    response: customerOrdersResponse,
    body: customerOrdersBody,
  } = await fetchText("/account/orders", {
    headers: {
      Cookie: joinCookies(
        crossDeviceCustomerAccessCookie,
        crossDeviceCustomerAccountCookie,
      ),
    },
  });
  assert.equal(
    customerOrdersResponse.status,
    200,
    "Expected customer orders route to render with a verified customer-access session",
  );
  assertIncludes(
    customerOrdersBody,
    "Verified orders for the current account",
    "/account/orders",
  );
  assertIncludes(
    customerOrdersBody,
    createOrderBody.order.orderNumber,
    "/account/orders",
  );
  assertIncludes(
    customerOrdersBody,
    "SET-SMOKE-01",
    "/account/orders",
  );
  assertIncludes(
    customerOrdersBody,
    "TRK-SMOKE-01",
    "/account/orders",
  );

  for (const check of protectedOpsChecks) {
    const { response, body } = await fetchText(check.pathname, {
      headers: {
        Cookie: opsCookie,
      },
    });
    assert.equal(
      response.status,
      200,
      `Expected ${check.pathname} to return 200 with ops session`,
    );
    assert.equal(
      new URL(response.url).pathname,
      check.pathname,
      `Expected authenticated request to stay on ${check.pathname}`,
    );
    assert.ok(
      !body.includes("Ops access gate"),
      `Expected authenticated ${check.pathname} response to bypass the ops access gate`,
    );

    for (const marker of check.markers) {
      assertIncludes(body, marker, check.pathname);
    }
  }

  const { response: catalogLoginResponse, body: catalogLoginBody } = await sendJson(
    "POST",
    "/api/ops-access/login",
    {
      username: opsCatalogUsername,
      password: opsCatalogPassword,
      nextPath: "/ops",
    },
  );
  assert.equal(
    catalogLoginResponse.status,
    200,
    "Expected catalog-role ops login to return 200",
  );
  assert.equal(catalogLoginBody.redirectTo, "/ops/catalog");

  const catalogCookie = extractCookie(
    catalogLoginResponse,
    "cozmateks-ops-session",
  );

  const catalogRedirectResponse = await fetch(`${baseUrl}/ops/orders`, {
    cache: "no-store",
    headers: {
      Cookie: catalogCookie,
    },
    redirect: "manual",
  });
  assert.equal(catalogRedirectResponse.status, 307);
  assert.ok(
    (catalogRedirectResponse.headers.get("location") ?? "").includes(
      "/ops/catalog",
    ),
    "Expected catalog operator to be redirected back to /ops/catalog",
  );

  const { response: forbiddenOrdersApiResponse, body: forbiddenOrdersApiBody } =
    await fetchJson("/api/ops/orders", {
      headers: {
        Cookie: catalogCookie,
      },
    });
  assert.equal(forbiddenOrdersApiResponse.status, 403);
  assert.match(
    forbiddenOrdersApiBody.error,
    /permission/i,
    "Expected role-aware permission error for catalog operator",
  );

  const {
    response: forbiddenNotificationsApiResponse,
    body: forbiddenNotificationsApiBody,
  } = await fetchJson("/api/ops/notifications", {
    headers: {
      Cookie: catalogCookie,
    },
  });
  assert.equal(forbiddenNotificationsApiResponse.status, 403);
  assert.match(
    forbiddenNotificationsApiBody.error,
    /permission/i,
    "Expected role-aware permission error for notifications API",
  );

  const catalogContentRedirectResponse = await fetch(`${baseUrl}/ops/content`, {
    cache: "no-store",
    headers: {
      Cookie: catalogCookie,
    },
    redirect: "manual",
  });
  assert.equal(catalogContentRedirectResponse.status, 307);
  assert.ok(
    (catalogContentRedirectResponse.headers.get("location") ?? "").includes(
      "/ops/catalog",
    ),
    "Expected catalog operator to be redirected away from /ops/content",
  );

  const catalogReleaseRedirectResponse = await fetch(`${baseUrl}/ops/release`, {
    cache: "no-store",
    headers: {
      Cookie: catalogCookie,
    },
    redirect: "manual",
  });
  assert.equal(catalogReleaseRedirectResponse.status, 307);
  assert.ok(
    (catalogReleaseRedirectResponse.headers.get("location") ?? "").includes(
      "/ops/catalog",
    ),
    "Expected catalog operator to be redirected away from /ops/release",
  );

  const releaseEvidence = {
    generatedAt: new Date().toISOString(),
    verificationMode: "local_smoke",
    targetBaseUrl: baseUrl,
    environment: health.environment,
    commitReference: health.commitReference ?? null,
    authorityStorage: {
      engine: health.authorityStorage.engine,
      durability: health.authorityStorage.durability,
    },
    summary: {
      publicRouteChecks: publicSmokeChecks.length,
      protectedRouteChecks: protectedOpsChecks.length,
      assetChecks: assetChecks.length,
      apiChecks: 29,
    },
    checks: [
      {
        id: "public-routes",
        title: "Public route rendering and SEO markers",
        count: publicSmokeChecks.length,
      },
      {
        id: "protected-ops-routes",
        title: "Protected ops routes behind authenticated sessions",
        count: protectedOpsChecks.length,
      },
      {
        id: "api-contracts",
        title: "Health, order, provider callback, release, notification, audit, package, packet, history, compare, handoff, and decision APIs with packet-bound freshness, owner-handoff, provider-binding, and blocker-acknowledgement guards",
        count: 29,
      },
      {
        id: "release-assets",
        title: "Release-facing assets and social preview surfaces",
        count: assetChecks.length,
      },
    ],
    notes: [
      "Generated from the standalone smoke suite before any live deploy claim.",
      `Health authority engine: ${health.authorityStorage.engine}.`,
      `Release preflight status: ${opsReleaseBody.releaseReadiness.runtimePreflight.overallStatus}.`,
    ],
  };

  writeReleaseEvidence(releaseEvidence);

  const {
    response: publishEvidenceResponse,
    body: publishEvidenceBody,
  } = await sendJson("POST", "/api/ops/release/evidence", {
    releaseEvidence,
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    publishEvidenceResponse.status,
    201,
    "Expected ops release evidence publish API to return 201 for manager role",
  );
  assert.equal(
    publishEvidenceBody.releaseEvidence.verificationMode,
    "local_smoke",
  );

  const {
    response: releaseEvidenceResponse,
    body: releaseEvidenceBody,
  } = await fetchJson("/api/ops/release/evidence", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseEvidenceResponse.status,
    200,
    "Expected ops release evidence API to return 200 for manager role",
  );
  assert.equal(
    releaseEvidenceBody.releaseEvidence.summary.publicRouteChecks,
    publicSmokeChecks.length,
  );
  assert.equal(
    releaseEvidenceBody.releaseEvidence.summary.protectedRouteChecks,
    protectedOpsChecks.length,
  );
  assert.equal(
    releaseEvidenceBody.releaseEvidence.summary.apiChecks,
    29,
  );

  const {
    response: releasePackageResponse,
    body: releasePackageBody,
  } = await fetchJson("/api/ops/release/package", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releasePackageResponse.status,
    200,
    "Expected ops release package API to return 200 for manager role",
  );
  assert.equal(
    releasePackageBody.releasePackage.releaseEvidence?.summary.apiChecks,
    29,
  );
  assert.ok(
    releasePackageBody.releasePackage.blockedItems.some(
      (item) => item.id === "hosting-runtime",
    ),
    "Expected release package to include the hosting-runtime blocker in local smoke mode",
  );
  assert.equal(
    releasePackageBody.releasePackage.blockedItems.find(
      (item) => item.id === "hosting-runtime",
    )?.owner?.id,
    "platform-runtime",
  );
  assert.ok(
    releasePackageBody.releasePackage.releaseReadiness.ownerSummaries.length > 0,
    "Expected release package to retain blocker ownership summaries",
  );
  assert.equal(
    releasePackageBody.releasePackage.warningItems.find(
      (item) => item.id === "payment_routing",
    )?.source,
    "provider_contract",
    "Expected release package warnings to include provider-contract payment routing ownership",
  );
  assert.equal(
    releasePackageBody.releasePackage.warningItems.find(
      (item) => item.id === "payment_routing",
    )?.owner?.id,
    "commerce-backend",
    "Expected payment routing warning ownership to resolve to the commerce backend lane",
  );
  assert.ok(
    releasePackageBody.releasePackage.releaseReadiness.ownerSummaries.some(
      (summary) =>
        summary.ownerId === "commerce-backend" &&
        summary.itemIds.includes("payment_routing"),
    ),
    "Expected release readiness ownership summaries to include provider-backed payment routing work",
  );

  const {
    response: publishReleasePackageResponse,
    body: publishReleasePackageBody,
  } = await sendJson("POST", "/api/ops/release/package", {}, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    publishReleasePackageResponse.status,
    201,
    "Expected ops release package publish API to return 201 for manager role",
  );
  assert.equal(
    publishReleasePackageBody.releasePackageRecord.verificationMode,
    "local_smoke",
  );
  assert.equal(
    publishReleasePackageBody.releasePackageRecord.artifact.releaseEvidence?.summary.apiChecks,
    29,
  );

  const {
    response: releaseHistoryResponse,
    body: releaseHistoryBody,
  } = await fetchJson("/api/ops/release/history", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseHistoryResponse.status,
    200,
    "Expected ops release history API to return 200 for manager role",
  );
  const publishedReleaseRecord = releaseHistoryBody.releasePackages.find(
    (record) => record.id === publishReleasePackageBody.releasePackageRecord.id,
  );
  assert.ok(
    publishedReleaseRecord,
    "Expected ops release history API to include the newly published release package",
  );
  assert.equal(
    publishedReleaseRecord.artifact.releaseEvidence?.verificationMode,
    "local_smoke",
  );
  writeReleasePackageArtifacts(publishedReleaseRecord.artifact);
  writeReleaseHistoryArtifacts(releaseHistoryBody.releasePackages);

  const {
    response: releaseCompareResponse,
    body: releaseCompareBody,
  } = await fetchJson("/api/ops/release/compare", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseCompareResponse.status,
    200,
    "Expected ops release compare API to return 200 for manager role",
  );
  assert.equal(releaseCompareBody.releaseComparison.status, "unchanged");
  assert.equal(
    releaseCompareBody.releaseComparison.latestPublishedRecord?.id,
    publishReleasePackageBody.releasePackageRecord.id,
  );
  assert.equal(
    releaseCompareBody.releaseComparison.countDeltas.blocked.delta,
    0,
  );
  writeReleaseDiffArtifacts(releaseCompareBody.releaseComparison);

  const {
    response: preDecisionPacketResponse,
    body: preDecisionPacketBody,
  } = await fetchJson("/api/ops/release/packet", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    preDecisionPacketResponse.status,
    200,
    "Expected ops release packet API to return 200 before decision publication",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.latestDecisionReview.status,
    "missing",
    "Expected the executive release packet to report a missing decision before the first verdict is recorded",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.latestHandoffReview.status,
    "missing",
    "Expected the executive release packet to report a missing handoff before the first owner handoff is recorded",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.latestDecisionDelta.status,
    "missing",
    "Expected the executive release packet to report a missing decision delta before the first verdict is recorded",
  );
  assert.ok(
    preDecisionPacketBody.releasePacket.currentArtifact.releaseReadiness.ownerSummaries.length > 0,
    "Expected the executive release packet to expose blocker ownership summaries",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.currentArtifact.blockedItems.find(
      (item) => item.id === "hosting-runtime",
    )?.owner?.id,
    "platform-runtime",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.integrationContract.overallStatus,
    "warning",
    "Expected the executive release packet to expose a warning integration contract before release approval",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.integrationContract.blockedCount,
    0,
    "Expected the executive release packet to report zero blocked integration lanes in smoke mode once callback scaffolding is active",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.integrationContract.warningCount,
    3,
    "Expected the executive release packet to report three warning integration lanes in smoke mode",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.integrationContract.readyCount,
    2,
    "Expected the executive release packet to report two ready integration lanes in smoke mode",
  );
  assert.deepEqual(
    preDecisionPacketBody.releasePacket.integrationContract.lanes.map(
      (lane) => lane.id,
    ),
    [
      "ops_auth",
      "customer_order_access",
      "payment_routing",
      "shipping_execution",
      "notification_delivery",
    ],
    "Expected the executive release packet to keep the integration contract lanes stable in smoke mode",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.integrationContract.lanes.find(
      (lane) => lane.id === "ops_auth",
    )?.status,
    "ready",
    "Expected ops auth to be a ready integration lane in smoke mode",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.integrationContract.lanes.find(
      (lane) => lane.id === "notification_delivery",
    )?.status,
    "ready",
    "Expected notification delivery to be fully ready in smoke mode once the outbound provider contract is configured",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.currentArtifact.blockedItems.find(
      (item) => item.id === "payment_routing",
    )?.source,
    undefined,
    "Expected payment routing to move out of the blocked issue trail once callback scaffolding is active",
  );
  assert.equal(
    preDecisionPacketBody.releasePacket.currentArtifact.warningItems.find(
      (item) => item.id === "payment_routing",
    )?.source,
    "provider_contract",
    "Expected the executive release packet to fold payment routing into the warning issue trail",
  );
  assert.ok(
    preDecisionPacketBody.releasePacket.currentArtifact.releaseReadiness.ownerSummaries.some(
      (summary) =>
        summary.ownerId === "commerce-backend" &&
        summary.itemIds.includes("payment_routing"),
    ),
    "Expected the executive release packet to retain provider ownership inside release readiness summaries",
  );

  const {
    response: staleDecisionResponse,
    body: staleDecisionBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "hold",
      rationale:
        "Automated smoke verification should reject stale decisions that are not based on the latest packet token.",
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: "stale-release-packet-token",
      notes: [
        "Smoke confirms that release decisions are bound to the latest executive packet.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    staleDecisionResponse.status,
    409,
    "Expected ops release decision API to reject stale packet review tokens",
  );
  assert.equal(
    staleDecisionBody.error,
    "The release decision must be based on the latest executive release packet.",
  );

  const stalePacketGeneratedAt = new Date(
    Date.parse(preDecisionPacketBody.releasePacket.generatedAt) -
      (preDecisionPacketBody.releasePacket.reviewWindowMinutes + 5) * 60_000,
  ).toISOString();

  const {
    response: stalePacketAgeResponse,
    body: stalePacketAgeBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "hold",
      rationale:
        "Automated smoke verification should reject release decisions that reference an expired executive review packet.",
      releasePacketGeneratedAt: stalePacketGeneratedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        "Smoke confirms that executive packet age is enforced alongside token matching.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    stalePacketAgeResponse.status,
    409,
    "Expected ops release decision API to reject stale executive packet age",
  );
  assert.equal(
    stalePacketAgeBody.error,
    "The executive release packet is stale and must be refreshed before a release decision can be recorded.",
  );

  const blockedItemIds = publishedReleaseRecord.artifact.blockedItems.map(
    (item) => item.id,
  );
  assert.ok(
    blockedItemIds.length > 0,
    "Expected the current protected runtime to still expose blocked release items during smoke verification.",
  );
  const activeOwnerIds = preDecisionPacketBody.releasePacket.currentArtifact.releaseReadiness.ownerSummaries
    .filter((summary) => summary.blockedCount > 0 || summary.warningCount > 0)
    .map((summary) => summary.ownerId);
  assert.ok(
    activeOwnerIds.length > 0,
    "Expected the current executive release packet to expose active owner lanes that require blocker handoff.",
  );
  const incompleteAcknowledgedBlockedItemIds =
    blockedItemIds.length > 1 ? blockedItemIds.slice(0, blockedItemIds.length - 1) : [];

  const {
    response: incompleteAcknowledgementResponse,
    body: incompleteAcknowledgementBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "hold",
      rationale:
        "Automated smoke verification should reject release holds that do not acknowledge every current blocked item.",
      acknowledgedBlockedItemIds: incompleteAcknowledgedBlockedItemIds,
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        "Smoke confirms that hold decisions must explicitly cover every blocked release item.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    incompleteAcknowledgementResponse.status,
    409,
    "Expected ops release decision API to reject incomplete blocked-item acknowledgement",
  );
  assert.equal(
    incompleteAcknowledgementBody.error,
    "The release decision must acknowledge every currently blocked release item before it can be recorded.",
  );

  const {
    response: missingHandoffDecisionResponse,
    body: missingHandoffDecisionBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "hold",
      rationale:
        "Automated smoke verification should reject release decisions until the current blocker handoff has been recorded.",
      acknowledgedBlockedItemIds: blockedItemIds,
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        "Smoke confirms that a current blocker handoff is required before a protected decision can be published.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    missingHandoffDecisionResponse.status,
    409,
    "Expected ops release decision API to reject decisions before a current blocker handoff exists",
  );
  assert.equal(
    missingHandoffDecisionBody.error,
    "The release decision must be based on a current blocker handoff for the latest executive packet.",
  );

  const {
    response: staleHandoffResponse,
    body: staleHandoffBody,
  } = await sendJson("POST", "/api/ops/release/handoffs", {
    releaseHandoff: {
      rationale:
        "Automated smoke verification should reject blocker handoffs that are not based on the latest packet token.",
      handedOffOwnerIds: activeOwnerIds,
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: "stale-release-packet-token",
      notes: [
        "Smoke confirms that blocker handoffs are bound to the latest executive packet.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    staleHandoffResponse.status,
    409,
    "Expected ops release handoff API to reject stale packet review tokens",
  );
  assert.equal(
    staleHandoffBody.error,
    "The blocker handoff must be based on the latest executive release packet.",
  );

  const {
    response: staleHandoffAgeResponse,
    body: staleHandoffAgeBody,
  } = await sendJson("POST", "/api/ops/release/handoffs", {
    releaseHandoff: {
      rationale:
        "Automated smoke verification should reject blocker handoffs that reference an expired executive review packet.",
      handedOffOwnerIds: activeOwnerIds,
      releasePacketGeneratedAt: stalePacketGeneratedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        "Smoke confirms that executive packet age is enforced for blocker handoffs as well.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    staleHandoffAgeResponse.status,
    409,
    "Expected ops release handoff API to reject stale executive packet age",
  );
  assert.equal(
    staleHandoffAgeBody.error,
    "The executive release packet is stale and must be refreshed before a blocker handoff can be recorded.",
  );

  const incompleteHandoffOwnerIds =
    activeOwnerIds.length > 1 ? activeOwnerIds.slice(0, activeOwnerIds.length - 1) : [];

  const {
    response: incompleteHandoffResponse,
    body: incompleteHandoffBody,
  } = await sendJson("POST", "/api/ops/release/handoffs", {
    releaseHandoff: {
      rationale:
        "Automated smoke verification should reject blocker handoffs that do not cover every active owner lane.",
      handedOffOwnerIds: incompleteHandoffOwnerIds,
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        "Smoke confirms that every active owner lane must be explicitly handed off.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    incompleteHandoffResponse.status,
    409,
    "Expected ops release handoff API to reject incomplete owner-lane coverage",
  );
  assert.equal(
    incompleteHandoffBody.error,
    "The blocker handoff must cover every active owner lane in the current executive packet.",
  );

  const {
    response: publishReleaseHandoffResponse,
    body: publishReleaseHandoffBody,
  } = await sendJson("POST", "/api/ops/release/handoffs", {
    releaseHandoff: {
      rationale:
        "Automated smoke verification hands the remaining launch blockers to the active owner lanes before recording the protected hold decision.",
      handedOffOwnerIds: activeOwnerIds,
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        `Owner lanes: ${activeOwnerIds.join(", ")}.`,
        `Current blocked items: ${blockedItemIds.join(", ")}.`,
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    publishReleaseHandoffResponse.status,
    201,
    "Expected ops release handoff API to record a handoff for the current executive packet",
  );
  assert.deepEqual(
    publishReleaseHandoffBody.releaseHandoffRecord.handedOffOwnerIds,
    activeOwnerIds,
  );

  const {
    response: releaseHandoffResponse,
    body: releaseHandoffBody,
  } = await fetchJson("/api/ops/release/handoffs", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseHandoffResponse.status,
    200,
    "Expected ops release handoffs API to return 200 for manager role",
  );
  const publishedReleaseHandoff = releaseHandoffBody.releaseHandoffs.find(
    (record) => record.id === publishReleaseHandoffBody.releaseHandoffRecord.id,
  );
  assert.ok(
    publishedReleaseHandoff,
    "Expected ops release handoffs API to include the newly recorded handoff",
  );
  assert.equal(
    publishedReleaseHandoff.releasePacketReviewToken,
    preDecisionPacketBody.releasePacket.reviewToken,
  );
  writeReleaseHandoffArtifacts(releaseHandoffBody.releaseHandoffs);

  const {
    response: handoffCurrentPacketResponse,
    body: handoffCurrentPacketBody,
  } = await fetchJson("/api/ops/release/packet", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    handoffCurrentPacketResponse.status,
    200,
    "Expected ops release packet API to return 200 after handoff publication",
  );
  assert.equal(
    handoffCurrentPacketBody.releasePacket.latestHandoff?.id,
    publishReleaseHandoffBody.releaseHandoffRecord.id,
  );
  assert.equal(
    handoffCurrentPacketBody.releasePacket.latestHandoffReview.status,
    "current",
    "Expected the executive release packet to report the latest handoff as current after publication",
  );

  const {
    response: rejectedApprovalResponse,
    body: rejectedApprovalBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "approve",
      rationale:
        "Automated smoke verification should reject approvals while blocked launch gates still remain.",
      acknowledgedBlockedItemIds: blockedItemIds,
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        "Smoke confirms that approvals fail closed until the protected runtime is honestly ready.",
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    rejectedApprovalResponse.status,
    409,
    "Expected ops release decision API to reject approvals while blocked launch gates remain",
  );
  assert.equal(
    rejectedApprovalBody.error,
    "A blocked runtime package cannot be approved.",
  );

  const {
    response: publishReleaseDecisionResponse,
    body: publishReleaseDecisionBody,
  } = await sendJson("POST", "/api/ops/release/decisions", {
    releaseDecision: {
      verdict: "hold",
      rationale:
        "Automated smoke verification keeps the release on hold because protected runtime blockers still remain outside the repository.",
      acknowledgedBlockedItemIds: blockedItemIds,
      releasePacketGeneratedAt: preDecisionPacketBody.releasePacket.generatedAt,
      reviewToken: preDecisionPacketBody.releasePacket.reviewToken,
      notes: [
        `Latest compare status: ${releaseCompareBody.releaseComparison.status}.`,
        `Blocked issue IDs: ${publishedReleaseRecord.artifact.blockedItems.map((item) => item.id).join(", ")}.`,
      ],
    },
  }, {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    publishReleaseDecisionResponse.status,
    201,
    "Expected ops release decision API to record a hold verdict for the latest protected package",
  );
  assert.equal(
    publishReleaseDecisionBody.releaseDecisionRecord.verdict,
    "hold",
  );
  assert.equal(
    publishReleaseDecisionBody.releaseDecisionRecord.releasePackageRecordId,
    publishReleasePackageBody.releasePackageRecord.id,
  );

  const {
    response: releaseDecisionResponse,
    body: releaseDecisionBody,
  } = await fetchJson("/api/ops/release/decisions", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releaseDecisionResponse.status,
    200,
    "Expected ops release decisions API to return 200 for manager role",
  );
  const publishedReleaseDecision = releaseDecisionBody.releaseDecisions.find(
    (record) => record.id === publishReleaseDecisionBody.releaseDecisionRecord.id,
  );
  assert.ok(
    publishedReleaseDecision,
    "Expected ops release decisions API to include the newly recorded release decision",
  );
  assert.equal(
    publishedReleaseDecision.compareStatus,
    "unchanged",
  );
  assert.equal(
    publishedReleaseDecision.releasePacketReviewToken,
    preDecisionPacketBody.releasePacket.reviewToken,
  );
  assert.equal(
    publishedReleaseDecision.releasePacketReviewWindowMinutes,
    preDecisionPacketBody.releasePacket.reviewWindowMinutes,
  );
  assert.deepEqual(
    publishedReleaseDecision.acknowledgedBlockedItemIds,
    blockedItemIds,
  );
  writeReleaseDecisionArtifacts(releaseDecisionBody.releaseDecisions);

  const {
    response: releasePacketResponse,
    body: releasePacketBody,
  } = await fetchJson("/api/ops/release/packet", {
    headers: {
      Cookie: opsCookie,
    },
  });
  assert.equal(
    releasePacketResponse.status,
    200,
    "Expected ops release packet API to return 200 for manager role",
  );
  assert.equal(
    releasePacketBody.releasePacket.latestPublishedRecord?.id,
    publishReleasePackageBody.releasePackageRecord.id,
  );
  assert.equal(
    releasePacketBody.releasePacket.latestHandoff?.id,
    publishReleaseHandoffBody.releaseHandoffRecord.id,
  );
  assert.equal(
    releasePacketBody.releasePacket.latestHandoffReview.status,
    "current",
    "Expected the executive release packet to retain a current handoff after decision publication",
  );
  assert.equal(
    releasePacketBody.releasePacket.latestDecision?.id,
    publishReleaseDecisionBody.releaseDecisionRecord.id,
  );
  assert.equal(
    releasePacketBody.releasePacket.latestDecisionReview.status,
    "current",
    "Expected the executive release packet to report the latest decision as current after publication",
  );
  assert.equal(
    releasePacketBody.releasePacket.latestDecisionReview.latestDecisionId,
    publishReleaseDecisionBody.releaseDecisionRecord.id,
  );
  assert.equal(
    releasePacketBody.releasePacket.latestDecisionDelta.status,
    "unchanged",
    "Expected the executive release packet to report no drift against the latest recorded decision immediately after publication",
  );
  assert.equal(
    releasePacketBody.releasePacket.latestDecisionDelta.decisionPackageRecordId,
    publishReleaseDecisionBody.releaseDecisionRecord.releasePackageRecordId,
  );
  assert.equal(
    releasePacketBody.releasePacket.comparison.status,
    "unchanged",
  );
  assert.equal(
    releasePacketBody.releasePacket.currentArtifact.releaseEvidence?.summary.apiChecks,
    29,
  );
  assert.ok(
    releasePacketBody.releasePacket.contentGovernance.launchBlocked > 0,
    "Expected executive release packet to surface unresolved content blockers",
  );
  assert.ok(
    releasePacketBody.releasePacket.currentArtifact.releaseReadiness.ownerSummaries.some(
      (summary) => summary.ownerId === "platform-runtime",
    ),
    "Expected executive release packet to retain owner summaries through publication and decision flows",
  );
  assert.ok(
    releasePacketBody.releasePacket.currentArtifact.releaseReadiness.ownerSummaries.some(
      (summary) =>
        summary.ownerId === "commerce-backend" &&
        summary.itemIds.includes("payment_routing"),
    ),
    "Expected published executive release packet to retain provider ownership in release readiness summaries",
  );
  assert.equal(
    releasePacketBody.releasePacket.integrationContract.overallStatus,
    "warning",
    "Expected the published executive release packet to retain the warning integration contract",
  );
  assert.equal(
    releasePacketBody.releasePacket.runtimeMonitoring.stage,
    "local",
    "Expected the executive release packet to expose the local runtime stage in smoke mode",
  );
  assert.equal(
    releasePacketBody.releasePacket.runtimeMonitoring.searchIndexingEnabled,
    false,
    "Expected the executive release packet to keep local smoke runtimes fenced from search indexing",
  );
  assert.equal(
    releasePacketBody.releasePacket.runtimeMonitoring.status,
    "ready",
    "Expected the executive release packet to treat local noindex posture as a valid runtime-monitoring state",
  );
  assert.equal(
    releasePacketBody.releasePacket.rollbackBaseline.status,
    "blocked",
    "Expected rollback to remain blocked in smoke mode until an approved protected package exists",
  );
  assert.equal(
    releasePacketBody.releasePacket.rollbackBaseline.packageRecordId,
    null,
  );
  assert.equal(
    releasePacketBody.releasePacket.rollbackBaseline.decisionVerdict,
    null,
  );
  assert.match(
    releasePacketBody.releasePacket.rollbackBaseline.summary,
    /No approved protected release package exists yet/i,
    "Expected rollback baseline summary to explain that approvals are still missing in smoke mode",
  );
  assert.deepEqual(
    releasePacketBody.releasePacket.integrationContract.lanes.map((lane) => lane.id),
    [
      "ops_auth",
      "customer_order_access",
      "payment_routing",
      "shipping_execution",
      "notification_delivery",
    ],
    "Expected the published executive release packet to retain the integration contract lanes",
  );
  assert.equal(
    releasePacketBody.releasePacket.currentArtifact.warningItems.find(
      (item) => item.id === "shipping_execution",
    )?.source,
    "provider_contract",
    "Expected published executive release packet warnings to retain provider-contract shipping execution ownership",
  );
  writeReleasePacketArtifacts(releasePacketBody.releasePacket);

  const { response: releaseAuditResponse, body: releaseAuditBody } = await fetchJson(
    "/api/ops/audit",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(
    releaseAuditResponse.status,
    200,
    "Expected ops audit API to return 200 after release publication flows",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some((entry) => entry.action === "ops_login_success"),
    "Expected audit API to include a login success entry",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_order_status_update" &&
        entry.entityId === createOrderBody.order.orderNumber,
    ),
    "Expected audit API to include the smoke order status update",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_order_provider_update" &&
        entry.entityId === createOrderBody.order.orderNumber,
    ),
    "Expected audit API to include provider-binding updates for the smoke order",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_notification_status_update" &&
        entry.entityId === smokeNotification.id,
    ),
    "Expected audit API to include the smoke notification status update",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_release_evidence_publish" &&
        entry.metadata.verification_mode === "local_smoke",
    ),
    "Expected audit API to include the local smoke release evidence publication",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_release_package_publish" &&
        entry.entityId === publishReleasePackageBody.releasePackageRecord.id,
    ),
    "Expected audit API to include the release package publication entry",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_release_handoff_publish" &&
        entry.entityId === publishReleaseHandoffBody.releaseHandoffRecord.id,
    ),
    "Expected audit API to include the release handoff publication entry",
  );
  assert.ok(
    releaseAuditBody.auditEntries.some(
      (entry) =>
        entry.action === "ops_release_decision_publish" &&
        entry.entityId === publishReleaseDecisionBody.releaseDecisionRecord.id,
    ),
    "Expected audit API to include the release decision publication entry",
  );

  const throttledIp = "198.51.100.42";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { response: failedLoginResponse } = await sendJson(
      "POST",
      "/api/ops-access/login",
      {
        username: "blocked.user",
        password: "WrongPassword!123",
        nextPath: "/ops",
      },
      {
        headers: {
          "X-Forwarded-For": throttledIp,
        },
      },
    );

    assert.equal(
      failedLoginResponse.status,
      401,
      "Expected invalid identity login attempts to fail before throttling kicks in",
    );
  }

  const { response: throttledLoginResponse, body: throttledLoginBody } = await sendJson(
    "POST",
    "/api/ops-access/login",
    {
      username: "blocked.user",
      password: "WrongPassword!123",
      nextPath: "/ops",
    },
    {
      headers: {
        "X-Forwarded-For": throttledIp,
      },
    },
  );
  assert.equal(throttledLoginResponse.status, 429);
  assert.equal(typeof throttledLoginBody.retryAfterSeconds, "number");
  assert.ok(
    throttledLoginBody.retryAfterSeconds > 0,
    "Expected throttled login response to include retryAfterSeconds",
  );

  const logoutResponse = await fetch(`${baseUrl}/api/ops-access/logout`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...trustedMutationHeaders,
      Cookie: opsCookie,
    },
  });
  assert.equal(
    logoutResponse.status,
    200,
    "Expected trusted-origin logout request to return 200",
  );
  assert.match(
    logoutResponse.headers.get("set-cookie") ?? "",
    /Max-Age=0/i,
    "Expected logout response to clear the ops session cookie",
  );

  console.log(`Smoke checks passed against ${baseUrl}`);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Unknown smoke-check failure";
  console.error(message);

  const recentLogs = formatRecentLogs();
  if (recentLogs) {
    console.error("\nRecent smoke server logs:\n");
    console.error(recentLogs);
  }

  process.exitCode = 1;
} finally {
  await shutdownServer();
  safeCleanupAuthorityState();
}
