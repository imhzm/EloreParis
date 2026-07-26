import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const policySource = readFileSync("src/lib/release-evidence-policy.ts", "utf8");
const transpiledPolicy = ts.transpileModule(policySource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const policy = await import(
  "data:text/javascript;base64," + Buffer.from(transpiledPolicy).toString("base64")
);

const NOW = new Date("2026-07-26T12:00:00.000Z");
const COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567";

function buildEvidence(overrides = {}) {
  return {
    generatedAt: "2026-07-26T11:30:00.000Z",
    verificationMode: "live_postdeploy",
    targetBaseUrl: "https://elore-paris.com",
    environment: "production",
    commitReference: COMMIT_SHA,
    authorityStorage: {
      engine: "sqlite",
      durability: "sqlite_file",
    },
    summary: {
      publicRouteChecks: 12,
      protectedRouteChecks: 8,
      assetChecks: 4,
      apiChecks: 31,
    },
    checks: [
      {
        id: "public-routes",
        title: "Public route rendering",
        count: 12,
        status: "passed",
      },
      {
        id: "api-contracts",
        title: "API contract checks",
        count: 31,
        status: "passed",
      },
    ],
    notes: ["Captured from the deployed production runtime."],
    ...overrides,
  };
}

function approvalContext(overrides = {}) {
  return {
    canonicalUrl: "https://elore-paris.com/",
    runtimeCommitReference: COMMIT_SHA,
    now: NOW,
    ...overrides,
  };
}

const validEvidence = policy.normalizeReleaseEvidenceReport(buildEvidence());
assert.ok(validEvidence, "A complete bounded evidence report should normalize");
assert.equal(validEvidence.targetBaseUrl, "https://elore-paris.com");
assert.equal(validEvidence.commitReference, COMMIT_SHA);

for (const invalidMode of [undefined, "runtime_snapshot", "unknown"]) {
  assert.equal(
    policy.normalizeReleaseEvidenceReport(
      buildEvidence({ verificationMode: invalidMode }),
    ),
    null,
    `Verification mode ${String(invalidMode)} must fail closed`,
  );
}

for (const invalidCount of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 10_001]) {
  assert.equal(
    policy.normalizeReleaseEvidenceReport({
      ...buildEvidence(),
      summary: {
        ...buildEvidence().summary,
        apiChecks: invalidCount,
      },
    }),
    null,
    `Summary count ${String(invalidCount)} must be rejected`,
  );
  assert.equal(
    policy.normalizeReleaseEvidenceReport({
      ...buildEvidence(),
      checks: [
        {
          ...buildEvidence().checks[0],
          count: invalidCount,
        },
      ],
    }),
    null,
    `Check count ${String(invalidCount)} must be rejected`,
  );
}

assert.equal(
  policy.normalizeReleaseEvidenceReport({
    ...buildEvidence(),
    checks: [{ ...buildEvidence().checks[0], status: "unknown" }],
  }),
  null,
  "Every evidence check must carry an explicit passed or failed status",
);
assert.equal(
  policy.normalizeReleaseEvidenceReport({
    ...buildEvidence(),
    checks: [buildEvidence().checks[0], buildEvidence().checks[0]],
  }),
  null,
  "Evidence check identifiers must be unique",
);
assert.equal(
  policy.normalizeReleaseEvidenceReport({ ...buildEvidence(), checks: [] }),
  null,
  "An empty check list cannot prove a release",
);

assert.deepEqual(
  policy.validateReleaseEvidenceForApproval(validEvidence, approvalContext()),
  { ready: true, blockers: [] },
  "Fresh live evidence for the canonical URL and runtime SHA should be approval-ready",
);

const approvalBlockerCases = [
  {
    label: "local smoke evidence",
    report: buildEvidence({ verificationMode: "local_smoke" }),
    context: approvalContext(),
    blocker: "verification_mode_not_live",
  },
  {
    label: "stale evidence",
    report: buildEvidence({ generatedAt: "2026-07-26T09:59:59.000Z" }),
    context: approvalContext(),
    blocker: "evidence_stale",
  },
  {
    label: "future-dated evidence",
    report: buildEvidence({ generatedAt: "2026-07-26T12:01:01.000Z" }),
    context: approvalContext(),
    blocker: "evidence_timestamp_in_future",
  },
  {
    label: "non-canonical target",
    report: buildEvidence({ targetBaseUrl: "https://www.elore-paris.com" }),
    context: approvalContext(),
    blocker: "target_url_not_canonical",
  },
  {
    label: "unsafe canonical URL",
    report: buildEvidence(),
    context: approvalContext({ canonicalUrl: "http://elore-paris.com" }),
    blocker: "canonical_url_invalid",
  },
  {
    label: "missing runtime SHA",
    report: buildEvidence(),
    context: approvalContext({ runtimeCommitReference: null }),
    blocker: "runtime_commit_invalid",
  },
  {
    label: "mismatched evidence SHA",
    report: buildEvidence({
      commitReference: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    }),
    context: approvalContext(),
    blocker: "commit_mismatch",
  },
  {
    label: "failed check",
    report: buildEvidence({
      checks: [{ ...buildEvidence().checks[0], status: "failed" }],
    }),
    context: approvalContext(),
    blocker: "checks_not_all_passed",
  },
];

for (const testCase of approvalBlockerCases) {
  const normalized = policy.normalizeReleaseEvidenceReport(testCase.report);
  assert.ok(normalized, `${testCase.label} should remain storable for audit`);
  const result = policy.validateReleaseEvidenceForApproval(
    normalized,
    testCase.context,
  );
  assert.equal(result.ready, false, `${testCase.label} must block approval`);
  assert.ok(
    result.blockers.includes(testCase.blocker),
    `${testCase.label} should report ${testCase.blocker}`,
  );
}

const decisionSource = readFileSync("src/lib/release-decision-history.ts", "utf8");
assert.match(
  decisionSource,
  /validateReleaseEvidenceForApproval/,
  "Release approval must invoke the evidence approval policy",
);
assert.match(
  decisionSource,
  /getRuntimeDeploymentCommitReference/,
  "Release approval must bind evidence to the shared running deployment identity",
);
assert.doesNotMatch(
  decisionSource,
  /process\.env\.DEPLOYMENT_COMMIT_SHA/,
  "Release approval must not drift from the health endpoint deployment identity",
);

console.log("Release evidence approval policy checks passed.");
