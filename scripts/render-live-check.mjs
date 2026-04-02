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
      apiChecks: 4,
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
        count: 2,
      },
      {
        id: "live-release-evidence",
        title: "Release evidence publish and readback",
        count: 2,
      },
    ],
    notes: [
      `Hosting runtime gate: ${hostingRuntimeGate.status}.`,
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
