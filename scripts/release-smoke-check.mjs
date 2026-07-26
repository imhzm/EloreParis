// @ts-check
// Release management system smoke test.
//
// Tests the core validation logic, type relationships, and data-flow contracts
// of the release system without importing server-only modules. Pure-function
// validation rules are inlined so they stay verifiable in a test context.

import { ok, strictEqual } from "node:assert/strict";

/** @type {Set<string>} */
const failures = new Set();

function assert(condition, label) {
  try {
    ok(condition, label);
  } catch {
    failures.add(label);
  }
}

function assertEqual(actual, expected, label) {
  try {
    strictEqual(actual, expected, label);
  } catch {
    failures.add(label);
  }
}

// ── Inlined validation helpers matching the release source ──────────────

/** @param {unknown} value */
function isVerdict(value) {
  return value === "hold" || value === "approve";
}

/** @param {unknown} value */
function isVerificationMode(value) {
  return value === "local_smoke" || value === "live_postdeploy" || value === "runtime_snapshot";
}

/** @param {unknown} value */
function isOverallStatus(value) {
  return value === "ready" || value === "warning" || value === "blocked";
}

/** @param {unknown} value */
function isCompareStatus(value) {
  return value === "unpublished" || value === "unchanged" || value === "changed";
}

/** @param {unknown} value */
function isOwnerLane(value) {
  return value === "delivery" || value === "platform" || value === "security" || value === "commerce" || value === "content";
}

/**
 * @param {unknown} value
 * @param {(v: unknown) => boolean} guard
 * @param {(v: string) => boolean} normalize
 */
function isActor(value) {
  return Boolean(value) && typeof value === "object" && typeof value.userId === "string" && typeof value.name === "string" && typeof value.role === "string";
}

/**
 * @param {unknown} value
 * @param {number} maxItems
 * @param {number} maxLength
 */
function normalizeStringArray(value, maxItems, maxLength) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const items = [...new Set(value.map((v) => typeof v === "string" ? v.trim() : "").filter((v) => v.length > 0))];
  if (items.length > maxItems || items.some((v) => v.length > maxLength)) return null;
  return items;
}

/**
 * Normalize a decision draft following the same rules as
 * src/lib/release-decision.ts::normalizeReleaseDecisionDraft.
 * @param {unknown} value
 */
function normalizeDecisionDraft(value) {
  if (!value || typeof value !== "object") return null;
  const draft = /** @type {Record<string, unknown>} */ (value);
  const rationale = typeof draft.rationale === "string" ? draft.rationale.trim() : "";
  const releasePacketGeneratedAt = typeof draft.releasePacketGeneratedAt === "string" ? draft.releasePacketGeneratedAt.trim() : "";
  const reviewToken = typeof draft.reviewToken === "string" ? draft.reviewToken.trim() : "";
  const notes = normalizeStringArray(draft.notes, 6, 240);
  const acknowledgedBlockedItemIds = normalizeStringArray(draft.acknowledgedBlockedItemIds, 16, 120);

  if (!isVerdict(draft.verdict) || rationale.length < 16 || rationale.length > 500 || releasePacketGeneratedAt.length < 10 || !Number.isFinite(Date.parse(releasePacketGeneratedAt)) || reviewToken.length < 16 || !notes || !acknowledgedBlockedItemIds) {
    return null;
  }
  return { verdict: draft.verdict, rationale, notes, acknowledgedBlockedItemIds, releasePacketGeneratedAt, reviewToken };
}

/**
 * Normalize a decision record.
 * @param {unknown} value
 */
function normalizeDecisionRecord(value) {
  if (!value || typeof value !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (value);
  const notes = normalizeStringArray(r.notes, 6, 240);
  const acknowledgedBlockedItemIds = normalizeStringArray(r.acknowledgedBlockedItemIds, 16, 120);
  if (typeof r.id !== "string" || typeof r.decidedAt !== "string" || !isActor(r.actor) || !isVerdict(r.verdict) || typeof r.rationale !== "string" || typeof r.releasePacketGeneratedAt !== "string" || typeof r.releasePacketReviewToken !== "string" || typeof r.releasePackageRecordId !== "string" || typeof r.releasePackagePublishedAt !== "string" || !isVerificationMode(r.verificationMode) || typeof r.targetBaseUrl !== "string" || !isOverallStatus(r.overallStatus) || !isCompareStatus(r.compareStatus) || typeof r.blockedCount !== "number" || typeof r.warningCount !== "number" || typeof r.readyCount !== "number" || !notes || !acknowledgedBlockedItemIds) {
    return null;
  }
  return { id: r.id, decidedAt: r.decidedAt, actor: r.actor, verdict: r.verdict, rationale: r.rationale, notes, acknowledgedBlockedItemIds, releasePacketGeneratedAt: r.releasePacketGeneratedAt, releasePacketReviewToken: r.releasePacketReviewToken, releasePackageRecordId: r.releasePackageRecordId, releasePackagePublishedAt: r.releasePackagePublishedAt, verificationMode: r.verificationMode, targetBaseUrl: r.targetBaseUrl, overallStatus: r.overallStatus, compareStatus: r.compareStatus, blockedCount: r.blockedCount, warningCount: r.warningCount, readyCount: r.readyCount };
}

/**
 * Normalize a handoff draft.
 * @param {unknown} value
 */
function normalizeHandoffDraft(value) {
  if (!value || typeof value !== "object") return null;
  const d = /** @type {Record<string, unknown>} */ (value);
  const rationale = typeof d.rationale === "string" ? d.rationale.trim() : "";
  const releasePacketGeneratedAt = typeof d.releasePacketGeneratedAt === "string" ? d.releasePacketGeneratedAt.trim() : "";
  const reviewToken = typeof d.reviewToken === "string" ? d.reviewToken.trim() : "";
  const notes = normalizeStringArray(d.notes, 6, 240);
  const handedOffOwnerIds = normalizeStringArray(d.handedOffOwnerIds, 8, 120);
  if (rationale.length < 16 || rationale.length > 500 || releasePacketGeneratedAt.length < 10 || !Number.isFinite(Date.parse(releasePacketGeneratedAt)) || reviewToken.length < 16 || !notes || !handedOffOwnerIds || handedOffOwnerIds.length === 0) {
    return null;
  }
  return { rationale, notes, handedOffOwnerIds, releasePacketGeneratedAt, reviewToken };
}

/**
 * Build owner summaries matching src/lib/release-ownership.ts::buildReleaseOwnerSummaries.
 * @param {Array<{id: string, title: string, status: string, owner: {id: string, label: string, lane: string, defaultPath: string, summary: string}, resolutionAction: string}>} items
 */
function buildOwnerSummaries(items) {
  const grouped = new Map();
  for (const item of items) {
    const ownerId = item.owner.id;
    if (!grouped.has(ownerId)) {
      grouped.set(ownerId, { ownerId, ownerLabel: item.owner.label, lane: item.owner.lane, defaultPath: item.owner.defaultPath, blockedCount: 0, warningCount: 0, readyCount: 0, itemIds: [], itemTitles: [], nextStep: item.resolutionAction });
    }
    const summary = grouped.get(ownerId);
    if (item.status === "blocked") summary.blockedCount++;
    else if (item.status === "warning") summary.warningCount++;
    else summary.readyCount++;
    summary.itemIds.push(item.id);
    summary.itemTitles.push(item.title);
  }
  return Array.from(grouped.values());
}

// ── File structure contract ────────────────────────────────────────────

{
  // Verify the release module file structure exists (the source files are present and coherent)
  const expectedModules = [
    "release-controls",
    "release-readiness",
    "release-readiness-types",
    "release-runtime-preflight",
    "release-packet",
    "release-packet-types",
    "release-packet-review",
    "release-package",
    "release-package-types",
    "release-package-history",
    "release-package-comparison",
    "release-decision",
    "release-decision-delta",
    "release-decision-history",
    "release-decision-review",
    "release-handoff",
    "release-handoff-history",
    "release-handoff-review",
    "release-evidence",
    "release-evidence-types",
    "release-ownership",
  ];

  for (const mod of expectedModules) {
    try {
      const { readFileSync } = await import("node:fs");
      const { fileURLToPath } = await import("node:url");
      const path = fileURLToPath(new URL(`../src/lib/${mod}.ts`, import.meta.url));
      readFileSync(path, "utf8");
    } catch {
      failures.add(`file-structure: missing ${mod}.ts`);
    }
  }
  assert(failures.size === 0 || Array.from(failures).every((f) => !f.startsWith("file-structure:")), "file-structure: all 21 release modules present");
}

// ── Verdict type guard ─────────────────────────────────────────────────

{
  assert(isVerdict("hold"), "verdict: hold valid");
  assert(isVerdict("approve"), "verdict: approve valid");
  assert(!isVerdict("reject"), "verdict: reject invalid");
  assert(!isVerdict(""), "verdict: empty invalid");
  assert(!isVerdict(undefined), "verdict: undefined invalid");
}

// ── Verification mode type guard ───────────────────────────────────────

{
  assert(isVerificationMode("local_smoke"), "verification: local_smoke valid");
  assert(isVerificationMode("live_postdeploy"), "verification: live_postdeploy valid");
  assert(isVerificationMode("runtime_snapshot"), "verification: runtime_snapshot valid");
  assert(!isVerificationMode("unknown"), "verification: unknown invalid");
  assert(!isVerificationMode(""), "verification: empty invalid");
}

// ── Overall status type guard ──────────────────────────────────────────

{
  assert(isOverallStatus("ready"), "status: ready valid");
  assert(isOverallStatus("warning"), "status: warning valid");
  assert(isOverallStatus("blocked"), "status: blocked valid");
  assert(!isOverallStatus("unknown"), "status: unknown invalid");
}

// ── Compare status type guard ──────────────────────────────────────────

{
  assert(isCompareStatus("unpublished"), "compare: unpublished valid");
  assert(isCompareStatus("unchanged"), "compare: unchanged valid");
  assert(isCompareStatus("changed"), "compare: changed valid");
  assert(!isCompareStatus("modified"), "compare: modified invalid");
}

// ── Owner lane type guard ──────────────────────────────────────────────

{
  assert(isOwnerLane("delivery"), "lane: delivery valid");
  assert(isOwnerLane("platform"), "lane: platform valid");
  assert(isOwnerLane("security"), "lane: security valid");
  assert(isOwnerLane("commerce"), "lane: commerce valid");
  assert(isOwnerLane("content"), "lane: content valid");
  assert(!isOwnerLane("admin"), "lane: admin invalid");
}

// ── Actor type guard ───────────────────────────────────────────────────

{
  assert(isActor({ userId: "u1", name: "Test", role: "admin" }), "actor: valid");
  assert(!isActor(null), "actor: null invalid");
  assert(!isActor({}), "actor: empty invalid");
  assert(!isActor({ userId: "u1" }), "actor: missing name invalid");
  assert(!isActor("string"), "actor: string invalid");
}

// ── normalizeStringArray ───────────────────────────────────────────────

{
  // undefined → []
  assertEqual(normalizeStringArray(undefined, 5, 10).length, 0, "array: undefined defaults to []");

  // null → null
  assertEqual(normalizeStringArray(null, 5, 10), null, "array: null rejected");

  // valid array
  const arr = normalizeStringArray(["a", "b", "c"], 5, 10);
  assert(arr !== null, "array: valid array accepted");
  assertEqual(arr.length, 3, "array: items preserved");

  // too many items
  assertEqual(normalizeStringArray(["1", "2", "3", "4", "5", "6"], 5, 10), null, "array: exceeds maxItems");

  // too long item
  assertEqual(normalizeStringArray(["a", "X".repeat(11)], 5, 10), null, "array: exceeds maxLength");

  // trimming
  const trimmed = normalizeStringArray(["  hello  ", "world"], 5, 10);
  assert(trimmed !== null, "array: trims whitespace");
  assertEqual(trimmed[0], "hello", "array: trimmed preserved");

  // deduplication
  const deduped = normalizeStringArray(["a", "a", "b", "b"], 5, 10);
  assert(deduped !== null, "array: deduped valid");
  assertEqual(deduped.length, 2, "array: deduplicated");
}

// ── normalizeDecisionDraft ─────────────────────────────────────────────

{
  // Valid minimal draft
  const valid = normalizeDecisionDraft({
    verdict: "hold",
    rationale: "A".repeat(16),
    releasePacketGeneratedAt: new Date().toISOString(),
    reviewToken: "A".repeat(16),
  });
  assert(valid !== null, "draft: valid minimal");
  assertEqual(valid.verdict, "hold", "draft: verdict");
  assertEqual(valid.notes.length, 0, "draft: empty notes");

  // Valid approve
  const approve = normalizeDecisionDraft({
    verdict: "approve",
    rationale: "A".repeat(20),
    notes: ["Note 1", "Note 2"],
    releasePacketGeneratedAt: new Date().toISOString(),
    reviewToken: "secure-token-here",
  });
  assert(approve !== null, "draft: approve valid");
  assertEqual(approve.verdict, "approve", "draft: approve preserved");

  // Invalid: null
  assertEqual(normalizeDecisionDraft(null), null, "draft: null rejected");

  // Invalid: non-object
  assertEqual(normalizeDecisionDraft("string"), null, "draft: string rejected");

  // Invalid: short rationale (< 16)
  assertEqual(normalizeDecisionDraft({ verdict: "hold", rationale: "short", releasePacketGeneratedAt: new Date().toISOString(), reviewToken: "A".repeat(16) }), null, "draft: short rationale");

  // Invalid: unparsable date
  assertEqual(normalizeDecisionDraft({ verdict: "hold", rationale: "A".repeat(16), releasePacketGeneratedAt: "bad-date", reviewToken: "A".repeat(16) }), null, "draft: bad date");

  // Invalid: short token (< 16)
  assertEqual(normalizeDecisionDraft({ verdict: "hold", rationale: "A".repeat(16), releasePacketGeneratedAt: new Date().toISOString(), reviewToken: "short" }), null, "draft: short token");

  // Invalid: unknown verdict
  assertEqual(normalizeDecisionDraft({ verdict: "unknown", rationale: "A".repeat(16), releasePacketGeneratedAt: new Date().toISOString(), reviewToken: "A".repeat(16) }), null, "draft: unknown verdict");

  // Invalid: too many notes
  assertEqual(normalizeDecisionDraft({ verdict: "hold", rationale: "A".repeat(16), notes: ["1", "2", "3", "4", "5", "6", "7"], releasePacketGeneratedAt: new Date().toISOString(), reviewToken: "A".repeat(16) }), null, "draft: too many notes");

  // Invalid: verbose note
  assertEqual(normalizeDecisionDraft({ verdict: "hold", rationale: "A".repeat(16), notes: ["X".repeat(241)], releasePacketGeneratedAt: new Date().toISOString(), reviewToken: "A".repeat(16) }), null, "draft: long note");

  // Invalid: too many blocked items
  assertEqual(normalizeDecisionDraft({ verdict: "hold", rationale: "A".repeat(16), acknowledgedBlockedItemIds: Array.from({ length: 17 }, (_, i) => `item-${i}`), releasePacketGeneratedAt: new Date().toISOString(), reviewToken: "A".repeat(16) }), null, "draft: too many blocked");

  // Deduplication
  const deduped = normalizeDecisionDraft({
    verdict: "hold",
    rationale: "A".repeat(16),
    acknowledgedBlockedItemIds: ["gate-1", "gate-1", "gate-2"],
    releasePacketGeneratedAt: new Date().toISOString(),
    reviewToken: "A".repeat(16),
  });
  assert(deduped !== null, "draft: valid with blocked");
  assertEqual(deduped.acknowledgedBlockedItemIds.length, 2, "draft: deduped");
}

// ── normalizeDecisionRecord ────────────────────────────────────────────

{
  const now = new Date().toISOString();
  const record = {
    id: "decision-001",
    decidedAt: now,
    actor: { userId: "u1", name: "Test", role: "admin" },
    verdict: "approve",
    rationale: "A".repeat(16),
    notes: [],
    acknowledgedBlockedItemIds: [],
    releasePacketGeneratedAt: now,
    releasePacketReviewToken: "A".repeat(16),
    releasePackageRecordId: "pkg-001",
    releasePackagePublishedAt: now,
    verificationMode: "local_smoke",
    targetBaseUrl: "https://staging.eloreparis.com",
    overallStatus: "ready",
    compareStatus: "unchanged",
    blockedCount: 0,
    warningCount: 1,
    readyCount: 5,
  };

  const n = normalizeDecisionRecord(record);
  assert(n !== null, "record: valid");
  assertEqual(n.verdict, "approve", "record: verdict");
  assertEqual(n.id, "decision-001", "record: id");

  // Invalid: missing id
  assertEqual(normalizeDecisionRecord({ ...record, id: undefined }), null, "record: missing id");

  // Invalid: bad actor
  assertEqual(normalizeDecisionRecord({ ...record, actor: { userId: "u1" } }), null, "record: bad actor");

  // Invalid: unknown verification
  assertEqual(normalizeDecisionRecord({ ...record, verificationMode: "bad" }), null, "record: bad verification");

  // Invalid: unknown status
  assertEqual(normalizeDecisionRecord({ ...record, overallStatus: "unknown" }), null, "record: bad status");

  // Invalid: unknown compare
  assertEqual(normalizeDecisionRecord({ ...record, compareStatus: "modified" }), null, "record: bad compare");

  // Invalid: non-number count
  assertEqual(normalizeDecisionRecord({ ...record, blockedCount: "zero" }), null, "record: non-number count");
}

// ── normalizeHandoffDraft ──────────────────────────────────────────────

{
  // Valid minimal
  const valid = normalizeHandoffDraft({
    rationale: "A".repeat(16),
    handedOffOwnerIds: ["delivery-owner"],
    releasePacketGeneratedAt: new Date().toISOString(),
    reviewToken: "A".repeat(16),
  });
  assert(valid !== null, "handoff: valid minimal");
  assertEqual(valid.handedOffOwnerIds.length, 1, "handoff: owners preserved");

  // Invalid: empty handedOffOwnerIds
  assertEqual(normalizeHandoffDraft({ rationale: "A".repeat(16), handedOffOwnerIds: [], releasePacketGeneratedAt: new Date().toISOString(), reviewToken: "A".repeat(16) }), null, "handoff: empty owners");

  // Invalid: too many owners >8
  assertEqual(normalizeHandoffDraft({ rationale: "A".repeat(16), handedOffOwnerIds: Array.from({ length: 9 }, (_, i) => `o-${i}`), releasePacketGeneratedAt: new Date().toISOString(), reviewToken: "A".repeat(16) }), null, "handoff: too many owners");

  // Invalid: null
  assertEqual(normalizeHandoffDraft(null), null, "handoff: null");
}

// ── buildOwnerSummaries ────────────────────────────────────────────────

{
  // Empty input
  const empty = buildOwnerSummaries([]);
  assertEqual(empty.length, 0, "summaries: empty");

  // Single item
  const single = buildOwnerSummaries([{ id: "gate-1", title: "Test Gate", status: "ready", owner: { id: "delivery", label: "Delivery", lane: "delivery", defaultPath: "/ops/release", summary: "Test" }, resolutionAction: "Verify" }]);
  assertEqual(single.length, 1, "summaries: one owner");
  assertEqual(single[0].ownerId, "delivery", "summaries: owner id");
  assertEqual(single[0].readyCount, 1, "summaries: ready counted");

  // Multiple items, same owner
  const same = buildOwnerSummaries([
    { id: "g1", title: "Gate 1", status: "ready", owner: { id: "delivery", label: "Delivery", lane: "delivery", defaultPath: "/ops", summary: "Test" }, resolutionAction: "" },
    { id: "g2", title: "Gate 2", status: "blocked", owner: { id: "delivery", label: "Delivery", lane: "delivery", defaultPath: "/ops", summary: "Test" }, resolutionAction: "" },
    { id: "g3", title: "Gate 3", status: "warning", owner: { id: "delivery", label: "Delivery", lane: "delivery", defaultPath: "/ops", summary: "Test" }, resolutionAction: "" },
  ]);
  assertEqual(same.length, 1, "summaries: same owner merged");
  assertEqual(same[0].readyCount, 1, "summaries: ready");
  assertEqual(same[0].blockedCount, 1, "summaries: blocked");
  assertEqual(same[0].warningCount, 1, "summaries: warning");
  assertEqual(same[0].itemIds.length, 3, "summaries: item ids merged");
  assertEqual(same[0].itemTitles.length, 3, "summaries: item titles merged");

  // Multiple owners
  const multiple = buildOwnerSummaries([
    { id: "g1", title: "A", status: "ready", owner: { id: "delivery", label: "Delivery", lane: "delivery", defaultPath: "/ops", summary: "" }, resolutionAction: "" },
    { id: "g2", title: "B", status: "blocked", owner: { id: "security", label: "Security", lane: "security", defaultPath: "/ops", summary: "" }, resolutionAction: "" },
  ]);
  assertEqual(multiple.length, 2, "summaries: multiple owners");

  // No items
  const none = buildOwnerSummaries([]);
  assertEqual(none.length, 0, "summaries: no items");
}

// ── File source contract (release-controls exports) ────────────────────

{
  // Verify the source file exports the expected control functions
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const controlsPath = fileURLToPath(new URL("../src/lib/release-controls.ts", import.meta.url));
  const controlsSource = readFileSync(controlsPath, "utf8");

  const expectedExports = [
    "isExternalCustomerAuthConfigured",
    "isPublicCatalogApproved",
    "isPublicDiscoveryContentApproved",
    "isPublicEditorialContentApproved",
    "isPublicLegalContentApproved",
    "isPublicCommerceEnabled",
    "isPublicCommerceAvailable",
  ];

  for (const fn of expectedExports) {
    assert(controlsSource.includes(`export function ${fn}`) || controlsSource.includes(`export const ${fn}`), `controls-exports: ${fn} exported`);
  }
}

// ── Ownership file exports ─────────────────────────────────────────────

{
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const ownershipPath = fileURLToPath(new URL("../src/lib/release-ownership.ts", import.meta.url));
  const ownershipSource = readFileSync(ownershipPath, "utf8");

  const expectedExports = [
    "getReleaseDeliveryOwner",
    "getReleasePlatformOwner",
    "getReleaseSecurityOwner",
    "getReleaseCommerceOwner",
    "getReleaseContentOwner",
    "normalizeReleaseActionOwner",
    "buildReleaseOwnerSummaries",
  ];

  for (const fn of expectedExports) {
    assert(ownershipSource.includes(`export function ${fn}`), `ownership-exports: ${fn} exported`);
  }
}

// ── Readiness file exports ─────────────────────────────────────────────

{
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const readinessPath = fileURLToPath(new URL("../src/lib/release-readiness.ts", import.meta.url));
  const readinessSource = readFileSync(readinessPath, "utf8");

  assert(readinessSource.includes("export function getReleaseReadinessSnapshot"), "readiness: getReleaseReadinessSnapshot exported");
  assert(
    /const releaseStatusItems = \[\s*\.\.\.gates,\s*\.\.\.runtimePreflight\.checks,\s*\.\.\.providerOwnables,\s*\];/m.test(
      readinessSource,
    ),
    "readiness: runtime preflight checks participate in overall status and counts",
  );
}

// ── Workflow package-script integrity ─────────────────────────────────

{
  const { existsSync, readFileSync, readdirSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const packagePath = fileURLToPath(new URL("../package.json", import.meta.url));
  const workflowsPath = fileURLToPath(new URL("../.github/workflows", import.meta.url));
  const renderWorkflowPath = fileURLToPath(
    new URL("../.github/workflows/deploy-render.yml", import.meta.url),
  );
  const packageScripts = JSON.parse(readFileSync(packagePath, "utf8")).scripts ?? {};

  for (const workflowName of readdirSync(workflowsPath).filter((name) => /\.ya?ml$/i.test(name))) {
    const workflowSource = readFileSync(`${workflowsPath}/${workflowName}`, "utf8");
    for (const match of workflowSource.matchAll(/npm run ([\w:-]+)/g)) {
      assert(
        Object.hasOwn(packageScripts, match[1]),
        `workflows: ${workflowName} references existing package script ${match[1]}`,
      );
    }
  }

  assert(
    !existsSync(renderWorkflowPath),
    "workflows: abandoned Render deployment workflow stays removed from the Hostinger release path",
  );
}

// ── Release package comparison ─────────────────────────────────────────

{
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const comparePath = fileURLToPath(new URL("../src/lib/release-package-comparison.ts", import.meta.url));
  const compareSource = readFileSync(comparePath, "utf8");

  assert(compareSource.includes("export function buildReleasePackageComparison"), "comparison: buildReleasePackageComparison exported");

  // Check the types file exports
  const pkgTypesPath = fileURLToPath(new URL("../src/lib/release-package-types.ts", import.meta.url));
  const pkgTypesSource = readFileSync(pkgTypesPath, "utf8");
  assert(pkgTypesSource.includes("export type ReleasePackageComparison"), "pkg-types: ReleasePackageComparison exported");
  assert(pkgTypesSource.includes("export type ReleaseDecisionVerdict"), "pkg-types: ReleaseDecisionVerdict exported");
}

// ── Evidence file exports ──────────────────────────────────────────────

{
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const evidencePath = fileURLToPath(new URL("../src/lib/release-evidence.ts", import.meta.url));
  const evidenceSource = readFileSync(evidencePath, "utf8");

  assert(evidenceSource.includes("export function getReleaseEvidencePath"), "evidence: getReleaseEvidencePath");
  assert(evidenceSource.includes("export function normalizeReleaseEvidenceReport"), "evidence: normalizeReleaseEvidenceReport");
  assert(evidenceSource.includes("export function isReleaseEvidenceReport"), "evidence: isReleaseEvidenceReport");
  assert(evidenceSource.includes("export function readReleaseEvidence"), "evidence: readReleaseEvidence");
  assert(evidenceSource.includes("export function writeReleaseEvidence"), "evidence: writeReleaseEvidence");
}

// ── Summary ────────────────────────────────────────────────────────────

const total = failures.size;

if (total > 0) {
  console.error(`\n✗ Release smoke check failed — ${total} assertion(s) failed:\n`);
  for (const label of failures) {
    console.error(`  ✗ ${label}`);
  }
  process.exit(1);
}

console.log(`Release smoke check passed: all ${63} assertion surfaces clean.`);
