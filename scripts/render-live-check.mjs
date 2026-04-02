import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

function normalizeBaseUrl(value) {
  if (!value || !value.trim()) {
    return null;
  }

  return value.trim().replace(/\/+$/, "");
}

const baseUrl = normalizeBaseUrl(
  process.env.RENDER_SERVICE_BASE_URL ?? process.env.LIVE_BASE_URL,
);
const username =
  process.env.RENDER_OPS_MANAGER_USERNAME ?? process.env.LIVE_OPS_USERNAME;
const password =
  process.env.RENDER_OPS_MANAGER_PASSWORD ?? process.env.LIVE_OPS_PASSWORD;
const timeoutSeconds = Number(process.env.LIVE_CHECK_TIMEOUT_SECONDS ?? 900);
const releaseEvidenceArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_EVIDENCE_ARTIFACT_PATH ??
    ".artifacts/render-live-evidence.json",
);
const releasePackageArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_PACKAGE_ARTIFACT_PATH ??
    ".artifacts/render-live-release-package.json",
);
const releasePackageMarkdownArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_PACKAGE_MARKDOWN_PATH ??
    ".artifacts/render-live-release-package.md",
);
const releaseHistoryArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_HISTORY_ARTIFACT_PATH ??
    ".artifacts/render-live-release-history.json",
);
const releaseHistoryMarkdownArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_HISTORY_MARKDOWN_PATH ??
    ".artifacts/render-live-release-history.md",
);
const releaseDiffArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_DIFF_ARTIFACT_PATH ??
    ".artifacts/render-live-release-diff.json",
);
const releaseDiffMarkdownArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_DIFF_MARKDOWN_PATH ??
    ".artifacts/render-live-release-diff.md",
);
const releaseDecisionArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_DECISION_ARTIFACT_PATH ??
    ".artifacts/render-live-release-decision.json",
);
const releaseDecisionMarkdownArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_DECISION_MARKDOWN_PATH ??
    ".artifacts/render-live-release-decision.md",
);
const releasePacketArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_PACKET_ARTIFACT_PATH ??
    ".artifacts/render-live-release-packet.json",
);
const releasePacketMarkdownArtifactPath = path.resolve(
  process.cwd(),
  process.env.LIVE_RELEASE_PACKET_MARKDOWN_PATH ??
    ".artifacts/render-live-release-packet.md",
);

if (!baseUrl) {
  throw new Error(
    "RENDER_SERVICE_BASE_URL or LIVE_BASE_URL must be set before running the live Render check.",
  );
}

if (!username || !password) {
  throw new Error(
    "RENDER_OPS_MANAGER_USERNAME and RENDER_OPS_MANAGER_PASSWORD are required for live ops verification.",
  );
}

if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
  throw new Error("LIVE_CHECK_TIMEOUT_SECONDS must be a positive number.");
}

const trustedMutationHeaders = {
  Origin: baseUrl,
};

function writeReleaseEvidenceArtifact(report) {
  mkdirSync(path.dirname(releaseEvidenceArtifactPath), { recursive: true });
  writeFileSync(releaseEvidenceArtifactPath, JSON.stringify(report, null, 2));
}

function renderReleasePackageMarkdown(releasePackage) {
  const blockedItems = releasePackage.blockedItems
    .map(
      (item) =>
        `- ${item.title} (${item.source})\n  ${item.summary}\n  ${item.details
          .map((detail) => `  - ${detail}`)
          .join("\n")}`,
    )
    .join("\n");
  const warningItems = releasePackage.warningItems
    .map(
      (item) =>
        `- ${item.title} (${item.source})\n  ${item.summary}\n  ${item.details
          .map((detail) => `  - ${detail}`)
          .join("\n")}`,
    )
    .join("\n");
  const nextActions = releasePackage.nextActions
    .map((action) => `- ${action}`)
    .join("\n");
  const evidenceNotes =
    releasePackage.releaseEvidence?.notes.map((note) => `- ${note}`).join("\n") ??
    "- No stored release evidence is available yet.";

  return [
    "# Live Release Package",
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
    "## Next Actions",
    nextActions || "- None.",
    "",
    "## Latest Evidence Notes",
    evidenceNotes,
    "",
  ].join("\n");
}

function writeReleasePackageArtifacts(releasePackage) {
  mkdirSync(path.dirname(releasePackageArtifactPath), { recursive: true });
  writeFileSync(releasePackageArtifactPath, JSON.stringify(releasePackage, null, 2));
  writeFileSync(
    releasePackageMarkdownArtifactPath,
    renderReleasePackageMarkdown(releasePackage),
  );
}

function renderReleaseHistoryMarkdown(releasePackages) {
  if (!releasePackages.length) {
    return "# Live Release History\n\n- No published release packages are stored yet.\n";
  }

  return [
    "# Live Release History",
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
      "",
    ]),
  ].join("\n");
}

function writeReleaseHistoryArtifacts(releasePackages) {
  mkdirSync(path.dirname(releaseHistoryArtifactPath), { recursive: true });
  writeFileSync(releaseHistoryArtifactPath, JSON.stringify(releasePackages, null, 2));
  writeFileSync(
    releaseHistoryMarkdownArtifactPath,
    renderReleaseHistoryMarkdown(releasePackages),
  );
}

function renderReleaseDiffMarkdown(releaseComparison) {
  return [
    "# Live Release Drift",
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
  mkdirSync(path.dirname(releaseDiffArtifactPath), { recursive: true });
  writeFileSync(releaseDiffArtifactPath, JSON.stringify(releaseComparison, null, 2));
  writeFileSync(
    releaseDiffMarkdownArtifactPath,
    renderReleaseDiffMarkdown(releaseComparison),
  );
}

function renderReleaseDecisionMarkdown(releaseDecisions) {
  if (!releaseDecisions.length) {
    return "# Live Release Decisions\n\n- No release decisions are stored yet.\n";
  }

  return [
    "# Live Release Decisions",
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
  mkdirSync(path.dirname(releaseDecisionArtifactPath), { recursive: true });
  writeFileSync(releaseDecisionArtifactPath, JSON.stringify(releaseDecisions, null, 2));
  writeFileSync(
    releaseDecisionMarkdownArtifactPath,
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

  return [
    "# Live Release Packet",
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
    `- Latest decision: ${releasePacket.latestDecision?.verdict ?? "none"}`,
    `- Comparison status: ${releasePacket.comparison.status}`,
    `- Content launch blockers: ${releasePacket.contentGovernance.launchBlocked}`,
    "",
    "## Executive Summary",
    executiveSummary || "- None.",
    "",
    "## Blocker Highlights",
    blockerHighlights || "- None.",
    "",
    "## Next Actions",
    nextActions || "- None.",
    "",
  ].join("\n");
}

function writeReleasePacketArtifacts(releasePacket) {
  mkdirSync(path.dirname(releasePacketArtifactPath), { recursive: true });
  writeFileSync(releasePacketArtifactPath, JSON.stringify(releasePacket, null, 2));
  writeFileSync(
    releasePacketMarkdownArtifactPath,
    renderReleasePacketMarkdown(releasePacket),
  );
}

function extractCookie(response, cookieName) {
  const setCookieHeader = response.headers.get("set-cookie");
  assert.ok(setCookieHeader, `Expected ${cookieName} cookie to be returned.`);

  const cookieMatch = setCookieHeader.match(new RegExp(`${cookieName}=[^;]+`));
  assert.ok(cookieMatch, `Expected ${cookieName} in the Set-Cookie header.`);
  return cookieMatch[0];
}

async function fetchJson(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    cache: "no-store",
    ...init,
  });
  const responseText = await response.text();

  try {
    return {
      response,
      body: responseText ? JSON.parse(responseText) : null,
      rawBody: responseText,
    };
  } catch {
    return {
      response,
      body: null,
      rawBody: responseText,
    };
  }
}

async function waitForHealth() {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastFailureMessage = "Health endpoint has not responded yet.";

  while (Date.now() < deadline) {
    try {
      const { response, body } = await fetchJson("/api/health");

      if (response.ok && body?.status === "ok") {
        return body;
      }

      lastFailureMessage = `Health endpoint returned ${response.status}.`;
    } catch (error) {
      lastFailureMessage =
        error instanceof Error
          ? error.message
          : "Health endpoint request failed.";
    }

    await delay(5000);
  }

  throw new Error(
    `Timed out waiting for the live Render health check at ${baseUrl}/api/health. Last failure: ${lastFailureMessage}`,
  );
}

function requireGate(snapshot, gateId) {
  const gate = snapshot.gates.find((candidate) => candidate.id === gateId);
  assert.ok(gate, `Expected release gate ${gateId} to exist.`);
  return gate;
}

function requirePreflightCheck(snapshot, checkId) {
  const check = snapshot.runtimePreflight?.checks.find(
    (candidate) => candidate.id === checkId,
  );
  assert.ok(check, `Expected runtime preflight check ${checkId} to exist.`);
  return check;
}

try {
  const health = await waitForHealth();
  assert.equal(health.status, "ok");

  const unauthenticatedOpsResponse = await fetch(`${baseUrl}/ops`, {
    cache: "no-store",
    redirect: "manual",
  });
  assert.equal(
    unauthenticatedOpsResponse.status,
    307,
    "Expected /ops to redirect into /ops-access before authentication.",
  );
  assert.ok(
    (unauthenticatedOpsResponse.headers.get("location") ?? "").includes(
      "/ops-access",
    ),
    "Expected the live /ops redirect to point to /ops-access.",
  );

  const { response: loginResponse, body: loginBody } = await fetchJson(
    "/api/ops-access/login",
    {
      method: "POST",
      headers: {
        ...trustedMutationHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        nextPath: "/ops/release",
      }),
    },
  );

  assert.equal(loginResponse.status, 200, "Expected live ops login to succeed.");
  assert.equal(loginBody?.ok, true);
  assert.equal(loginBody?.redirectTo, "/ops/release");

  const opsCookie = extractCookie(loginResponse, "cozmateks-ops-session");

  const { response: sessionResponse, body: sessionBody } = await fetchJson(
    "/api/ops/session",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(sessionResponse.status, 200);
  assert.equal(sessionBody?.session?.username, username);

  const { response: releaseResponse, body: releaseBody } = await fetchJson(
    "/api/ops/release",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.equal(releaseResponse.status, 200);

  const releaseSnapshot = releaseBody?.releaseReadiness;
  assert.ok(releaseSnapshot, "Expected live release readiness payload.");

  const hostingDirectionGate = requireGate(releaseSnapshot, "hosting-direction");
  const hostingRuntimeGate = requireGate(releaseSnapshot, "hosting-runtime");
  const opsAuthGate = requireGate(releaseSnapshot, "ops-auth");
  const contentApprovalGate = requireGate(releaseSnapshot, "content-approval");
  const publicSiteUrlPreflight = requirePreflightCheck(
    releaseSnapshot,
    "public-site-url",
  );
  const persistentPathsPreflight = requirePreflightCheck(
    releaseSnapshot,
    "persistent-runtime-paths",
  );
  const signingSecretsPreflight = requirePreflightCheck(
    releaseSnapshot,
    "signing-secrets",
  );
  const opsBootstrapPreflight = requirePreflightCheck(
    releaseSnapshot,
    "ops-bootstrap-identities",
  );

  assert.equal(
    hostingDirectionGate.status,
    "ready",
    "Expected hosting-direction gate to be ready on the deployed runtime.",
  );
  assert.equal(
    hostingRuntimeGate.status,
    "ready",
    "Expected hosting-runtime gate to be ready on the deployed runtime.",
  );
  assert.equal(
    publicSiteUrlPreflight.status,
    "ready",
    "Expected public-site-url preflight to be ready on the deployed runtime.",
  );
  assert.equal(
    signingSecretsPreflight.status,
    "ready",
    "Expected signing-secrets preflight to be ready on the deployed runtime.",
  );
  assert.equal(
    opsBootstrapPreflight.status,
    "ready",
    "Expected ops-bootstrap-identities preflight to be ready on the deployed runtime.",
  );
  assert.ok(
    persistentPathsPreflight.status === "ready" ||
      persistentPathsPreflight.status === "warning",
    "Expected persistent-runtime-paths preflight to avoid a blocked state.",
  );

  const { response: prePublishEvidenceResponse } = await fetchJson(
    "/api/ops/release/evidence",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );
  assert.ok(
    prePublishEvidenceResponse.status === 200 ||
      prePublishEvidenceResponse.status === 404,
    "Expected the live evidence endpoint to return 200 or 404 before publishing the new report.",
  );

  const releaseEvidence = {
    generatedAt: new Date().toISOString(),
    verificationMode: "live_postdeploy",
    targetBaseUrl: baseUrl,
    environment: health.environment,
    commitReference: health.commitReference ?? null,
    authorityStorage: {
      engine: health.authorityStorage.engine,
      durability: health.authorityStorage.durability,
    },
    summary: {
      publicRouteChecks: 1,
      protectedRouteChecks: 2,
      assetChecks: 0,
      apiChecks: 17,
    },
    checks: [
      {
        id: "live-health",
        title: "Live health endpoint and authority mode",
        count: 1,
      },
      {
        id: "live-ops-gate",
        title: "Protected ops redirect and authenticated session path",
        count: 2,
      },
      {
        id: "live-release-gates",
        title: "Hosted release gates on the deployed runtime",
        count: 3,
      },
      {
        id: "live-release-evidence",
        title: "Release evidence publish and readback",
        count: 2,
      },
      {
        id: "live-release-package",
        title: "Release package publication and readback from the deployed runtime",
        count: 2,
      },
      {
        id: "live-release-history",
        title: "Release history readback from the deployed runtime",
        count: 1,
      },
      {
        id: "live-release-compare",
        title: "Release compare readback from the deployed runtime",
        count: 1,
      },
      {
        id: "live-release-decision",
        title: "Release decision stale-token rejection, stale-age rejection, approval rejection, publication, and readback from the deployed runtime",
        count: 5,
      },
      {
        id: "live-release-packet",
        title: "Executive release packet readback from the deployed runtime",
        count: 1,
      },
    ],
    notes: [
      `Hosting runtime gate: ${hostingRuntimeGate.status}.`,
      `Runtime preflight: ${releaseSnapshot.runtimePreflight.overallStatus}.`,
      `Persistent runtime paths preflight: ${persistentPathsPreflight.status}.`,
      `Ops auth gate: ${opsAuthGate.status}.`,
      `Content approval gate: ${contentApprovalGate.status}.`,
      `Pre-publish evidence status: ${prePublishEvidenceResponse.status}.`,
    ],
  };

  writeReleaseEvidenceArtifact(releaseEvidence);

  const { response: publishEvidenceResponse, body: publishEvidenceBody } =
    await fetchJson("/api/ops/release/evidence", {
      method: "POST",
      headers: {
        ...trustedMutationHeaders,
        Cookie: opsCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        releaseEvidence,
      }),
    });

  assert.equal(
    publishEvidenceResponse.status,
    201,
    "Expected live release evidence publication to return 201.",
  );
  assert.equal(
    publishEvidenceBody?.releaseEvidence?.verificationMode,
    "live_postdeploy",
  );

  const { response: storedEvidenceResponse, body: storedEvidenceBody } =
    await fetchJson("/api/ops/release/evidence", {
      headers: {
        Cookie: opsCookie,
      },
    });

  assert.equal(
    storedEvidenceResponse.status,
    200,
    "Expected live release evidence readback to return 200.",
  );
  assert.equal(
    storedEvidenceBody?.releaseEvidence?.targetBaseUrl,
    baseUrl,
    "Expected the stored live evidence to point to the deployed runtime.",
  );
  assert.equal(
    storedEvidenceBody?.releaseEvidence?.verificationMode,
    "live_postdeploy",
  );

  const { response: publishReleasePackageResponse, body: publishReleasePackageBody } =
    await fetchJson("/api/ops/release/package", {
      method: "POST",
      headers: {
        ...trustedMutationHeaders,
        Cookie: opsCookie,
      },
    });

  assert.equal(
    publishReleasePackageResponse.status,
    201,
    "Expected live release package publication to return 201.",
  );
  assert.equal(
    publishReleasePackageBody?.releasePackageRecord?.verificationMode,
    "live_postdeploy",
  );

  const { response: releasePackageResponse, body: releasePackageBody } =
    await fetchJson("/api/ops/release/package", {
      headers: {
        Cookie: opsCookie,
      },
    });

  assert.equal(
    releasePackageResponse.status,
    200,
    "Expected live release package readback to return 200.",
  );
  assert.equal(
    releasePackageBody?.releasePackage?.releaseEvidence?.verificationMode,
    "live_postdeploy",
    "Expected the live release package to expose the stored post-deploy evidence.",
  );
  assert.ok(
    releasePackageBody?.releasePackage?.blockedItems.some(
      (item) => item.id === "content-approval",
    ),
    "Expected the live release package to keep surfacing the remaining content blocker honestly.",
  );
  assert.equal(
    releasePackageBody?.releasePackage?.releaseEvidence?.summary.apiChecks,
    17,
  );

  const { response: releaseHistoryResponse, body: releaseHistoryBody } =
    await fetchJson("/api/ops/release/history", {
      headers: {
        Cookie: opsCookie,
      },
    });

  assert.equal(
    releaseHistoryResponse.status,
    200,
    "Expected live release history readback to return 200.",
  );
  const livePublishedReleaseRecord = releaseHistoryBody?.releasePackages?.find(
    (record) => record.id === publishReleasePackageBody?.releasePackageRecord?.id,
  );
  assert.ok(
    livePublishedReleaseRecord,
    "Expected live release history to include the newly published release package.",
  );
  assert.equal(
    livePublishedReleaseRecord?.artifact?.releaseEvidence?.verificationMode,
    "live_postdeploy",
  );
  writeReleasePackageArtifacts(livePublishedReleaseRecord.artifact);
  writeReleaseHistoryArtifacts(releaseHistoryBody.releasePackages);

  const { response: releaseCompareResponse, body: releaseCompareBody } =
    await fetchJson("/api/ops/release/compare", {
      headers: {
        Cookie: opsCookie,
      },
    });

  assert.equal(
    releaseCompareResponse.status,
    200,
    "Expected live release compare readback to return 200.",
  );
  assert.equal(releaseCompareBody?.releaseComparison?.status, "unchanged");
  assert.equal(
    releaseCompareBody?.releaseComparison?.latestPublishedRecord?.id,
    publishReleasePackageBody?.releasePackageRecord?.id,
  );
  writeReleaseDiffArtifacts(releaseCompareBody.releaseComparison);

  const { response: preDecisionPacketResponse, body: preDecisionPacketBody } =
    await fetchJson("/api/ops/release/packet", {
      headers: {
        Cookie: opsCookie,
      },
    });

  assert.equal(
    preDecisionPacketResponse.status,
    200,
    "Expected live release packet to be available before decision publication.",
  );

  const { response: staleDecisionResponse, body: staleDecisionBody } =
    await fetchJson("/api/ops/release/decisions", {
      method: "POST",
      headers: {
        ...trustedMutationHeaders,
        Cookie: opsCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        releaseDecision: {
          verdict: "hold",
          rationale:
            "Live verification should reject stale release decisions that are not based on the latest packet token.",
          releasePacketGeneratedAt: preDecisionPacketBody?.releasePacket?.generatedAt,
          reviewToken: "stale-release-packet-token",
          notes: [
            "Live verification confirms that release decisions are bound to the latest executive packet.",
          ],
        },
      }),
    });

  assert.equal(
    staleDecisionResponse.status,
    409,
    "Expected live release decision API to reject stale packet review tokens.",
  );
  assert.equal(
    staleDecisionBody?.error,
    "The release decision must be based on the latest executive release packet.",
  );

  const stalePacketGeneratedAt = new Date(
    Date.parse(preDecisionPacketBody?.releasePacket?.generatedAt) -
      (preDecisionPacketBody?.releasePacket?.reviewWindowMinutes + 5) * 60_000,
  ).toISOString();

  const { response: stalePacketAgeResponse, body: stalePacketAgeBody } =
    await fetchJson("/api/ops/release/decisions", {
      method: "POST",
      headers: {
        ...trustedMutationHeaders,
        Cookie: opsCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        releaseDecision: {
          verdict: "hold",
          rationale:
            "Live verification should reject release decisions that reference an expired executive review packet.",
          releasePacketGeneratedAt: stalePacketGeneratedAt,
          reviewToken: preDecisionPacketBody?.releasePacket?.reviewToken,
          notes: [
            "Live verification confirms that executive packet age is enforced alongside token matching.",
          ],
        },
      }),
    });

  assert.equal(
    stalePacketAgeResponse.status,
    409,
    "Expected live release decision API to reject stale executive packet age.",
  );
  assert.equal(
    stalePacketAgeBody?.error,
    "The executive release packet is stale and must be refreshed before a release decision can be recorded.",
  );

  const { response: rejectedApprovalResponse, body: rejectedApprovalBody } =
    await fetchJson("/api/ops/release/decisions", {
      method: "POST",
      headers: {
        ...trustedMutationHeaders,
        Cookie: opsCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        releaseDecision: {
          verdict: "approve",
          rationale:
            "Live verification should reject approvals while protected blockers still remain on the deployed runtime.",
          releasePacketGeneratedAt: preDecisionPacketBody?.releasePacket?.generatedAt,
          reviewToken: preDecisionPacketBody?.releasePacket?.reviewToken,
          notes: [
            "Live verification confirms that approvals fail closed until launch blockers are honestly cleared.",
          ],
        },
      }),
    });

  assert.equal(
    rejectedApprovalResponse.status,
    409,
    "Expected live release decision approvals to be rejected while blocked gates remain.",
  );
  assert.equal(
    rejectedApprovalBody?.error,
    "A blocked runtime package cannot be approved.",
  );

  const { response: publishReleaseDecisionResponse, body: publishReleaseDecisionBody } =
    await fetchJson("/api/ops/release/decisions", {
      method: "POST",
      headers: {
        ...trustedMutationHeaders,
        Cookie: opsCookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        releaseDecision: {
          verdict: "hold",
          rationale:
            "Live verification keeps the release on hold because the deployed runtime still exposes honest external launch blockers.",
          releasePacketGeneratedAt: preDecisionPacketBody?.releasePacket?.generatedAt,
          reviewToken: preDecisionPacketBody?.releasePacket?.reviewToken,
          notes: [
            `Latest compare status: ${releaseCompareBody.releaseComparison.status}.`,
            `Blocked issue IDs: ${livePublishedReleaseRecord.artifact.blockedItems.map((item) => item.id).join(", ")}.`,
          ],
        },
      }),
    });

  assert.equal(
    publishReleaseDecisionResponse.status,
    201,
    "Expected live release decision publication to return 201.",
  );
  assert.equal(
    publishReleaseDecisionBody?.releaseDecisionRecord?.verdict,
    "hold",
  );
  assert.equal(
    publishReleaseDecisionBody?.releaseDecisionRecord?.releasePackageRecordId,
    publishReleasePackageBody?.releasePackageRecord?.id,
  );

  const { response: releaseDecisionResponse, body: releaseDecisionBody } =
    await fetchJson("/api/ops/release/decisions", {
      headers: {
        Cookie: opsCookie,
      },
    });

  assert.equal(
    releaseDecisionResponse.status,
    200,
    "Expected live release decisions readback to return 200.",
  );
  const livePublishedReleaseDecision = releaseDecisionBody?.releaseDecisions?.find(
    (record) => record.id === publishReleaseDecisionBody?.releaseDecisionRecord?.id,
  );
  assert.ok(
    livePublishedReleaseDecision,
    "Expected live release decisions to include the newly recorded release decision.",
  );
  assert.equal(livePublishedReleaseDecision?.compareStatus, "unchanged");
  assert.equal(
    livePublishedReleaseDecision?.releasePacketReviewToken,
    preDecisionPacketBody?.releasePacket?.reviewToken,
  );
  assert.equal(
    livePublishedReleaseDecision?.releasePacketReviewWindowMinutes,
    preDecisionPacketBody?.releasePacket?.reviewWindowMinutes,
  );
  writeReleaseDecisionArtifacts(releaseDecisionBody.releaseDecisions);

  const { response: releasePacketResponse, body: releasePacketBody } =
    await fetchJson("/api/ops/release/packet", {
      headers: {
        Cookie: opsCookie,
      },
    });

  assert.equal(
    releasePacketResponse.status,
    200,
    "Expected live release packet readback to return 200.",
  );
  assert.equal(
    releasePacketBody?.releasePacket?.latestPublishedRecord?.id,
    publishReleasePackageBody?.releasePackageRecord?.id,
  );
  assert.equal(
    releasePacketBody?.releasePacket?.latestDecision?.id,
    publishReleaseDecisionBody?.releaseDecisionRecord?.id,
  );
  assert.equal(releasePacketBody?.releasePacket?.comparison?.status, "unchanged");
  assert.equal(
    releasePacketBody?.releasePacket?.currentArtifact?.releaseEvidence?.summary?.apiChecks,
    17,
  );
  assert.ok(
    releasePacketBody?.releasePacket?.contentGovernance?.launchBlocked > 0,
    "Expected live release packet to surface unresolved content blockers honestly.",
  );
  writeReleasePacketArtifacts(releasePacketBody.releasePacket);

  const { response: auditResponse, body: auditBody } = await fetchJson(
    "/api/ops/audit",
    {
      headers: {
        Cookie: opsCookie,
      },
    },
  );

  assert.equal(auditResponse.status, 200);
  assert.ok(
    auditBody?.auditEntries?.some(
      (entry) =>
        entry.action === "ops_release_evidence_publish" &&
        entry.metadata.verification_mode === "live_postdeploy",
    ),
    "Expected the live audit trail to include the post-deploy evidence publication.",
  );
  assert.ok(
    auditBody?.auditEntries?.some(
      (entry) =>
        entry.action === "ops_release_package_publish" &&
        entry.entityId === publishReleasePackageBody?.releasePackageRecord?.id,
    ),
    "Expected the live audit trail to include the release package publication.",
  );
  assert.ok(
    auditBody?.auditEntries?.some(
      (entry) =>
        entry.action === "ops_release_decision_publish" &&
        entry.entityId === publishReleaseDecisionBody?.releaseDecisionRecord?.id,
    ),
    "Expected the live audit trail to include the release decision publication.",
  );

  const logoutResponse = await fetch(`${baseUrl}/api/ops-access/logout`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...trustedMutationHeaders,
      Cookie: opsCookie,
    },
  });

  assert.equal(logoutResponse.status, 200);
  assert.match(
    logoutResponse.headers.get("set-cookie") ?? "",
    /Max-Age=0/i,
    "Expected logout to clear the live ops session cookie.",
  );

  console.log(`Live Render verification passed for ${baseUrl}`);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Unknown live Render verification failure.";
  console.error(message);
  process.exitCode = 1;
}
