import type {
  ReleaseEvidenceCheck,
  ReleaseEvidenceReport,
  ReleaseEvidenceVerificationMode,
} from "@/lib/release-evidence-types";

export const RELEASE_EVIDENCE_MAX_COUNT = 10_000;
export const RELEASE_EVIDENCE_MAX_CHECKS = 100;
export const RELEASE_EVIDENCE_MAX_AGE_MS = 120 * 60_000;
export const RELEASE_EVIDENCE_MAX_FUTURE_SKEW_MS = 60_000;

export type ReleaseEvidenceApprovalBlocker =
  | "evidence_missing"
  | "verification_mode_not_live"
  | "environment_not_production"
  | "evidence_timestamp_invalid"
  | "evidence_timestamp_in_future"
  | "evidence_stale"
  | "canonical_url_invalid"
  | "target_url_not_canonical"
  | "runtime_commit_invalid"
  | "evidence_commit_invalid"
  | "commit_mismatch"
  | "counts_out_of_bounds"
  | "checks_not_all_passed";

export type ReleaseEvidenceApprovalContext = {
  canonicalUrl: string;
  runtimeCommitReference: string | null;
  now?: Date;
};

export type ReleaseEvidenceApprovalResult = {
  ready: boolean;
  blockers: ReleaseEvidenceApprovalBlocker[];
};

function isReleaseEvidenceVerificationMode(
  value: unknown,
): value is ReleaseEvidenceVerificationMode {
  return value === "local_smoke" || value === "live_postdeploy";
}

function normalizeBoundedString(value: unknown, maximumLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximumLength
    ? normalized
    : null;
}

function isBoundedCount(value: unknown, minimum = 0): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= RELEASE_EVIDENCE_MAX_COUNT
  );
}

function normalizeCommitReference(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

function normalizeEvidenceBaseUrl(value: unknown) {
  const normalized = normalizeBoundedString(value, 2_048);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== "" && url.pathname !== "/")
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function normalizeCanonicalProductionUrl(value: unknown) {
  const normalized = normalizeEvidenceBaseUrl(value);

  if (!normalized) {
    return null;
  }

  const url = new URL(normalized);
  return url.protocol === "https:" && !url.port ? url.origin : null;
}

function normalizeReleaseEvidenceCheck(value: unknown): ReleaseEvidenceCheck | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const evidenceCheck = value as Record<string, unknown>;
  const id = normalizeBoundedString(evidenceCheck.id, 100);
  const title = normalizeBoundedString(evidenceCheck.title, 240);

  if (
    !id ||
    !/^[a-z0-9]+(?:[-_:][a-z0-9]+)*$/.test(id) ||
    !title ||
    !isBoundedCount(evidenceCheck.count, 1) ||
    (evidenceCheck.status !== "passed" && evidenceCheck.status !== "failed")
  ) {
    return null;
  }

  return {
    id,
    title,
    count: evidenceCheck.count,
    status: evidenceCheck.status,
  };
}

export function normalizeReleaseEvidenceReport(
  value: unknown,
): ReleaseEvidenceReport | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const report = value as Record<string, unknown>;
  const authorityStorage =
    report.authorityStorage && typeof report.authorityStorage === "object"
      ? (report.authorityStorage as Record<string, unknown>)
      : null;
  const summary =
    report.summary && typeof report.summary === "object"
      ? (report.summary as Record<string, unknown>)
      : null;
  const generatedAt = normalizeBoundedString(report.generatedAt, 64);
  const targetBaseUrl = normalizeEvidenceBaseUrl(report.targetBaseUrl);
  const environment = normalizeBoundedString(report.environment, 64);
  const engine = normalizeBoundedString(authorityStorage?.engine, 100);
  const durability = normalizeBoundedString(authorityStorage?.durability, 100);

  if (
    !generatedAt ||
    !Number.isFinite(Date.parse(generatedAt)) ||
    !isReleaseEvidenceVerificationMode(report.verificationMode) ||
    !targetBaseUrl ||
    !environment ||
    (report.commitReference !== null &&
      !normalizeCommitReference(report.commitReference)) ||
    !engine ||
    !durability ||
    !summary ||
    !isBoundedCount(summary.publicRouteChecks) ||
    !isBoundedCount(summary.protectedRouteChecks) ||
    !isBoundedCount(summary.assetChecks) ||
    !isBoundedCount(summary.apiChecks) ||
    summary.publicRouteChecks +
      summary.protectedRouteChecks +
      summary.assetChecks +
      summary.apiChecks ===
      0 ||
    !Array.isArray(report.checks) ||
    report.checks.length === 0 ||
    report.checks.length > RELEASE_EVIDENCE_MAX_CHECKS ||
    !Array.isArray(report.notes) ||
    report.notes.length > RELEASE_EVIDENCE_MAX_CHECKS
  ) {
    return null;
  }

  const checks = report.checks.map(normalizeReleaseEvidenceCheck);

  if (
    checks.some((check) => check === null) ||
    new Set(checks.map((check) => check?.id)).size !== checks.length
  ) {
    return null;
  }

  const notes = report.notes.map((note) => normalizeBoundedString(note, 1_000));

  if (notes.some((note) => note === null)) {
    return null;
  }

  return {
    generatedAt: new Date(generatedAt).toISOString(),
    verificationMode: report.verificationMode,
    targetBaseUrl,
    environment,
    commitReference:
      report.commitReference === null
        ? null
        : normalizeCommitReference(report.commitReference),
    authorityStorage: {
      engine,
      durability,
    },
    summary: {
      publicRouteChecks: summary.publicRouteChecks,
      protectedRouteChecks: summary.protectedRouteChecks,
      assetChecks: summary.assetChecks,
      apiChecks: summary.apiChecks,
    },
    checks: checks as ReleaseEvidenceCheck[],
    notes: notes as string[],
  };
}

export function validateReleaseEvidenceForApproval(
  report: ReleaseEvidenceReport | null,
  context: ReleaseEvidenceApprovalContext,
): ReleaseEvidenceApprovalResult {
  const blockers: ReleaseEvidenceApprovalBlocker[] = [];

  if (!report) {
    return { ready: false, blockers: ["evidence_missing"] };
  }

  if (report.verificationMode !== "live_postdeploy") {
    blockers.push("verification_mode_not_live");
  }

  if (report.environment.trim().toLowerCase() !== "production") {
    blockers.push("environment_not_production");
  }

  const nowTime = (context.now ?? new Date()).getTime();
  const generatedAtTime = Date.parse(report.generatedAt);

  if (!Number.isFinite(generatedAtTime) || !Number.isFinite(nowTime)) {
    blockers.push("evidence_timestamp_invalid");
  } else if (generatedAtTime - nowTime > RELEASE_EVIDENCE_MAX_FUTURE_SKEW_MS) {
    blockers.push("evidence_timestamp_in_future");
  } else if (nowTime - generatedAtTime > RELEASE_EVIDENCE_MAX_AGE_MS) {
    blockers.push("evidence_stale");
  }

  const canonicalUrl = normalizeCanonicalProductionUrl(context.canonicalUrl);
  const evidenceTargetUrl = normalizeCanonicalProductionUrl(report.targetBaseUrl);

  if (!canonicalUrl) {
    blockers.push("canonical_url_invalid");
  } else if (!evidenceTargetUrl || evidenceTargetUrl !== canonicalUrl) {
    blockers.push("target_url_not_canonical");
  }

  const runtimeCommitReference = normalizeCommitReference(
    context.runtimeCommitReference,
  );
  const evidenceCommitReference = normalizeCommitReference(report.commitReference);

  if (!runtimeCommitReference) {
    blockers.push("runtime_commit_invalid");
  }

  if (!evidenceCommitReference) {
    blockers.push("evidence_commit_invalid");
  } else if (
    runtimeCommitReference &&
    evidenceCommitReference !== runtimeCommitReference
  ) {
    blockers.push("commit_mismatch");
  }

  const summaryCounts = Object.values(report.summary);

  if (
    summaryCounts.some((count) => !isBoundedCount(count)) ||
    summaryCounts.reduce((total, count) => total + count, 0) === 0 ||
    report.checks.length === 0 ||
    report.checks.length > RELEASE_EVIDENCE_MAX_CHECKS ||
    report.checks.some((check) => !isBoundedCount(check.count, 1))
  ) {
    blockers.push("counts_out_of_bounds");
  }

  if (
    report.checks.length === 0 ||
    report.checks.some((check) => check.status !== "passed")
  ) {
    blockers.push("checks_not_all_passed");
  }

  return { ready: blockers.length === 0, blockers };
}
