"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import {
  fetchOpsReleaseComparison,
  fetchOpsReleaseDecisions,
  fetchOpsReleaseEvidence,
  fetchOpsReleaseHistory,
  fetchOpsReleaseReadiness,
} from "@/lib/ops-control-client";
import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import type {
  ReleaseDecisionRecord,
  ReleasePackageComparison,
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import type {
  ReleaseReadinessGate,
  ReleaseReadinessSnapshot,
} from "@/lib/release-readiness-types";
import styles from "./order-flow.module.css";

function getStatusLabel(status: ReleaseReadinessGate["status"]) {
  switch (status) {
    case "ready":
      return "Ready";
    case "warning":
      return "Warning";
    case "blocked":
      return "Blocked";
  }
}

function getVerificationModeLabel(
  mode: ReleaseEvidenceReport["verificationMode"] | ReleasePackageRecord["verificationMode"],
) {
  switch (mode) {
    case "live_postdeploy":
      return "Live post-deploy";
    case "local_smoke":
      return "Local smoke";
    case "runtime_snapshot":
      return "Runtime snapshot";
  }
}

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getComparisonStatusLabel(status: ReleasePackageComparison["status"]) {
  switch (status) {
    case "unchanged":
      return "In sync";
    case "changed":
      return "Drift detected";
    case "unpublished":
      return "Not published";
  }
}

function formatDelta(delta: number) {
  if (delta > 0) {
    return `+${delta}`;
  }

  return String(delta);
}

function getDecisionVerdictLabel(verdict: ReleaseDecisionRecord["verdict"]) {
  switch (verdict) {
    case "hold":
      return "Hold";
    case "approve":
      return "Approved";
  }
}

export function OpsReleaseSurface() {
  const [snapshot, setSnapshot] = useState<ReleaseReadinessSnapshot | null>(null);
  const [evidence, setEvidence] = useState<ReleaseEvidenceReport | null>(null);
  const [releaseHistory, setReleaseHistory] = useState<ReleasePackageRecord[]>([]);
  const [releaseComparison, setReleaseComparison] =
    useState<ReleasePackageComparison | null>(null);
  const [releaseDecisions, setReleaseDecisions] = useState<ReleaseDecisionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.allSettled([
      fetchOpsReleaseReadiness(),
      fetchOpsReleaseEvidence(),
      fetchOpsReleaseHistory(),
      fetchOpsReleaseComparison(),
      fetchOpsReleaseDecisions(),
    ])
      .then(
        ([
          readinessResult,
          evidenceResult,
          historyResult,
          comparisonResult,
          decisionsResult,
        ]) => {
        if (readinessResult.status === "fulfilled") {
          setSnapshot(readinessResult.value.releaseReadiness);
          setError(null);
        } else {
          setSnapshot(null);
          setError(
            readinessResult.reason instanceof Error
              ? readinessResult.reason.message
              : "Unable to load the current release blockers from the protected runtime.",
          );
        }

        if (evidenceResult.status === "fulfilled") {
          setEvidence(evidenceResult.value.releaseEvidence);
        } else {
          setEvidence(null);
        }

        if (historyResult.status === "fulfilled") {
          setReleaseHistory(historyResult.value.releasePackages);
        } else {
          setReleaseHistory([]);
        }

        if (comparisonResult.status === "fulfilled") {
          setReleaseComparison(comparisonResult.value.releaseComparison);
        } else {
          setReleaseComparison(null);
        }
        
        if (decisionsResult.status === "fulfilled") {
          setReleaseDecisions(decisionsResult.value.releaseDecisions);
        } else {
          setReleaseDecisions([]);
        }
      },
      )
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const metrics = useMemo(
    () => ({
      overallStatus: snapshot?.overallStatus ?? "blocked",
      blockedCount: snapshot?.blockedCount ?? 0,
      warningCount: snapshot?.warningCount ?? 0,
      readyCount: snapshot?.readyCount ?? 0,
    }),
    [snapshot],
  );

  const preflightMetrics = useMemo(
    () => ({
      overallStatus: snapshot?.runtimePreflight.overallStatus ?? "blocked",
      blockedCount: snapshot?.runtimePreflight.blockedCount ?? 0,
      warningCount: snapshot?.runtimePreflight.warningCount ?? 0,
      readyCount: snapshot?.runtimePreflight.readyCount ?? 0,
    }),
    [snapshot],
  );

  return (
    <div className={styles.page}>
      <OpsNav activeHref="/ops/release" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Internal release readiness</p>
          <h1>A protected runtime surface for blockers, evidence, preflight, and release history.</h1>
          <p className={styles.summary}>
            This surface does not claim that launch is complete. It keeps the remaining blockers
            visible: hosting, transactional authority, protected ops access, public-content
            approval, runtime preflight, latest verification evidence, the durable release
            package trail, and the release decision trail inside the application authority.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Overall status</p>
            <strong>{isLoading ? "..." : getStatusLabel(metrics.overallStatus)}</strong>
            <span>
              {isLoading
                ? "Loading the current release status."
                : `${metrics.blockedCount} blocked, ${metrics.warningCount} warnings, ${metrics.readyCount} ready.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Runtime context</p>
            <h2>{snapshot?.runtimeEnvironment ?? "loading..."}</h2>
            <p>{snapshot?.canonicalUrl ?? "Resolving the current canonical URL."}</p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Blocked gates</p>
          <strong>{metrics.blockedCount}</strong>
          <span>Current blockers that still prevent an honest launch claim.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Warnings</p>
          <strong>{metrics.warningCount}</strong>
          <span>Areas that work now but still miss final production ownership.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Ready</p>
          <strong>{metrics.readyCount}</strong>
          <span>Release gates already covered inside the repository and runtime.</span>
        </article>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Release gates</p>
          <h2>Current gate status</h2>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <div className={styles.ordersGrid}>
            {isLoading ? (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Release</p>
                <h1>Loading current blockers</h1>
                <p>Collecting live release signals from the protected runtime.</p>
              </article>
            ) : snapshot ? (
              snapshot.gates.map((gate) => (
                <article key={gate.id} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{gate.title}</h3>
                      <p className={styles.lineMeta}>{gate.id}</p>
                    </div>
                    <div className={styles.linePrice}>{getStatusLabel(gate.status)}</div>
                  </div>

                  <p>{gate.summary}</p>

                  <div className={styles.summaryList}>
                    {gate.details.map((detail) => (
                      <div key={detail} className={styles.infoBullet}>
                        {detail}
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Release</p>
                <h1>Release snapshot is unavailable</h1>
                <p>Recheck the protected runtime APIs and current environment contract.</p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Latest evidence</p>
            <h2>Current verification report</h2>
            {evidence ? (
              <div className={styles.summaryList}>
                <div className={styles.infoBullet}>
                  <strong>{formatTimestamp(evidence.generatedAt)}</strong>
                  <br />
                  {getVerificationModeLabel(evidence.verificationMode)} verification against{" "}
                  {evidence.targetBaseUrl}.
                </div>
                <div className={styles.referenceCard}>
                  {evidence.checks.map((check) => (
                    <div key={check.id} className={styles.referenceRow}>
                      <span>{check.title}</span>
                      <strong className={styles.referenceValue}>{check.count}</strong>
                    </div>
                  ))}
                </div>
                {evidence.notes.length ? (
                  <div className={styles.summaryList}>
                    {evidence.notes.map((note) => (
                      <div key={note} className={styles.infoBullet}>
                        {note}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={styles.infoBullet}>
                No release evidence is stored yet in this runtime. Run the smoke suite locally or
                execute the live Render verification flow after the first deploy.
              </div>
            )}
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Next actions</p>
            <h2>What closes the remaining blockers?</h2>
            <div className={styles.summaryList}>
              {(snapshot?.nextActions ?? []).map((action) => (
                <div key={action} className={styles.infoBullet}>
                  {action}
                </div>
              ))}
            </div>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Related surfaces</p>
            <h2>Release-adjacent paths</h2>
            <div className={styles.linkList}>
              <TrackedLink
                href="/api/health"
                analyticsLabel="ops_release_to_health"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="other"
              >
                <span>Health endpoint</span>
                <span>Runtime health and authority mode</span>
              </TrackedLink>
              <TrackedLink
                href="/api/ops/release/evidence"
                analyticsLabel="ops_release_to_evidence"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="other"
              >
                <span>Evidence API</span>
                <span>Latest stored release evidence</span>
              </TrackedLink>
              <TrackedLink
                href="/api/ops/release/package"
                analyticsLabel="ops_release_to_package"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="other"
              >
                <span>Release package API</span>
                <span>Combined blockers, preflight, and latest evidence</span>
              </TrackedLink>
              <TrackedLink
                href="/api/ops/release/history"
                analyticsLabel="ops_release_to_history"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="other"
              >
                <span>Release history API</span>
                <span>Published release-package trail</span>
              </TrackedLink>
              <TrackedLink
                href="/api/ops/release/compare"
                analyticsLabel="ops_release_to_compare"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="other"
              >
                <span>Release compare API</span>
                <span>Runtime drift versus the latest published package</span>
              </TrackedLink>
              <TrackedLink
                href="/api/ops/release/decisions"
                analyticsLabel="ops_release_to_decisions"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="other"
              >
                <span>Release decisions API</span>
                <span>Protected verdict trail for hold versus approval decisions</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/content"
                analyticsLabel="ops_release_to_content"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="ops_content"
              >
                <span>Content governance</span>
                <span>Sample and legal blockers</span>
              </TrackedLink>
              <TrackedLink
                href="/ops/audit"
                analyticsLabel="ops_release_to_audit"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="ops_audit"
              >
                <span>Audit trace</span>
                <span>Sessions and protected mutations</span>
              </TrackedLink>
            </div>
          </article>
        </aside>
      </section>

      <section className={styles.mainCard}>
        <p className={styles.sectionTitle}>Runtime preflight</p>
        <h2>Live runtime contracts before the first real deploy</h2>
        <p className={styles.summary}>
          This preflight layer shows whether the current runtime is aligned with the frozen
          release path: public site URL, persistent writable paths, signing-secret quality, and
          protected internal ops identities.
        </p>

        <div className={styles.statusSummaryGrid}>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Preflight status</p>
            <strong>{isLoading ? "..." : getStatusLabel(preflightMetrics.overallStatus)}</strong>
            <span>Fast view of the current runtime preflight contract.</span>
          </article>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Blocked</p>
            <strong>{preflightMetrics.blockedCount}</strong>
            <span>Environment items that still block the first honest live deploy.</span>
          </article>
          <article className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>Warnings</p>
            <strong>{preflightMetrics.warningCount}</strong>
            <span>Items that work now but still miss the frozen launch contract.</span>
          </article>
        </div>

        <div className={styles.ordersGrid}>
          {isLoading ? (
            <article className={styles.emptyCard}>
              <p className={styles.eyebrow}>Preflight</p>
              <h1>Loading runtime preflight snapshot</h1>
              <p>Checking the environment contract that governs the first live deploy.</p>
            </article>
          ) : snapshot ? (
            snapshot.runtimePreflight.checks.map((check) => (
              <article key={check.id} className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <h3>{check.title}</h3>
                    <p className={styles.lineMeta}>{check.id}</p>
                  </div>
                  <div className={styles.linePrice}>{getStatusLabel(check.status)}</div>
                </div>

                <p>{check.summary}</p>

                <div className={styles.summaryList}>
                  {check.details.map((detail) => (
                    <div key={detail} className={styles.infoBullet}>
                      {detail}
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <article className={styles.emptyCard}>
              <p className={styles.eyebrow}>Preflight</p>
              <h1>Runtime preflight snapshot is unavailable</h1>
              <p>Recheck environment values, then reload the protected release surface.</p>
            </article>
          )}
        </div>
      </section>

      <section className={styles.mainCard}>
        <p className={styles.sectionTitle}>Runtime drift</p>
        <h2>Current runtime versus the latest published package</h2>
        <p className={styles.summary}>
          This comparison answers a narrower release question than raw history: does the current
          runtime still match the latest published package, or has drift appeared since the last
          protected publication?
        </p>

        <div className={styles.ordersGrid}>
          {isLoading ? (
            <article className={styles.emptyCard}>
              <p className={styles.eyebrow}>Release compare</p>
              <h1>Loading runtime drift summary</h1>
              <p>Comparing the current runtime package with the latest protected publication.</p>
            </article>
          ) : releaseComparison ? (
            <>
              <article className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <h3>{getComparisonStatusLabel(releaseComparison.status)}</h3>
                    <p className={styles.lineMeta}>
                      Compared at {formatTimestamp(releaseComparison.comparedAt)}
                    </p>
                  </div>
                  <div className={styles.linePrice}>
                    {releaseComparison.latestPublishedRecord
                      ? releaseComparison.latestPublishedRecord.id
                      : "none"}
                  </div>
                </div>

                <p>
                  {releaseComparison.latestPublishedRecord
                    ? `Current runtime is being compared against ${getVerificationModeLabel(
                        releaseComparison.latestPublishedRecord.verificationMode,
                      )} for ${releaseComparison.latestPublishedRecord.targetBaseUrl}.`
                    : "No published package exists yet, so the current runtime is still ahead of the protected trail."}
                </p>

                <div className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>Blocked delta</span>
                    <strong className={styles.referenceValue}>
                      {formatDelta(releaseComparison.countDeltas.blocked.delta)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Warning delta</span>
                    <strong className={styles.referenceValue}>
                      {formatDelta(releaseComparison.countDeltas.warning.delta)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Ready delta</span>
                    <strong className={styles.referenceValue}>
                      {formatDelta(releaseComparison.countDeltas.ready.delta)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Current mode</span>
                    <strong className={styles.referenceValue}>
                      {getVerificationModeLabel(
                        releaseComparison.currentArtifact.verificationMode,
                      )}
                    </strong>
                  </div>
                </div>

                <div className={styles.summaryList}>
                  {releaseComparison.summary.map((item) => (
                    <div key={item} className={styles.infoBullet}>
                      {item}
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <h3>Changed fields</h3>
                    <p className={styles.lineMeta}>
                      Published package contract versus current runtime
                    </p>
                  </div>
                </div>

                <div className={styles.badgeRow}>
                  <span>
                    Overall status: {releaseComparison.changedFields.overallStatus ? "changed" : "stable"}
                  </span>
                  <span>
                    Verification mode: {releaseComparison.changedFields.verificationMode ? "changed" : "stable"}
                  </span>
                  <span>
                    Target URL: {releaseComparison.changedFields.targetBaseUrl ? "changed" : "stable"}
                  </span>
                  <span>
                    Runtime environment: {releaseComparison.changedFields.runtimeEnvironment ? "changed" : "stable"}
                  </span>
                  <span>
                    Next actions: {releaseComparison.changedFields.nextActions ? "changed" : "stable"}
                  </span>
                </div>

                <div className={styles.summaryList}>
                  <div className={styles.infoBullet}>
                    Blocked items added:{" "}
                    {releaseComparison.blockedItems.added.length
                      ? releaseComparison.blockedItems.added.join(", ")
                      : "none"}
                  </div>
                  <div className={styles.infoBullet}>
                    Blocked items cleared:{" "}
                    {releaseComparison.blockedItems.cleared.length
                      ? releaseComparison.blockedItems.cleared.join(", ")
                      : "none"}
                  </div>
                  <div className={styles.infoBullet}>
                    Warning items added:{" "}
                    {releaseComparison.warningItems.added.length
                      ? releaseComparison.warningItems.added.join(", ")
                      : "none"}
                  </div>
                  <div className={styles.infoBullet}>
                    Warning items cleared:{" "}
                    {releaseComparison.warningItems.cleared.length
                      ? releaseComparison.warningItems.cleared.join(", ")
                      : "none"}
                  </div>
                </div>
              </article>
            </>
          ) : (
            <article className={styles.emptyCard}>
              <p className={styles.eyebrow}>Release compare</p>
              <h1>Runtime drift summary is unavailable</h1>
              <p>Recheck the protected compare API and the current release-package trail.</p>
            </article>
          )}
        </div>
      </section>

      <section className={styles.mainCard}>
        <p className={styles.sectionTitle}>Release decisions</p>
        <h2>Protected verdict trail for the latest published packages</h2>
        <p className={styles.summary}>
          Packages and drift explain what changed. The decision trail explains whether the latest
          protected package was left on hold or explicitly approved, and why.
        </p>

        <div className={styles.ordersGrid}>
          {isLoading ? (
            <article className={styles.emptyCard}>
              <p className={styles.eyebrow}>Release decisions</p>
              <h1>Loading release decision trail</h1>
              <p>Reading the protected verdict history from the shared authority store.</p>
            </article>
          ) : releaseDecisions.length ? (
            releaseDecisions.map((decision) => (
              <article key={decision.id} className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <h3>{getDecisionVerdictLabel(decision.verdict)}</h3>
                    <p className={styles.lineMeta}>
                      {formatTimestamp(decision.decidedAt)} by {decision.actor.name}
                    </p>
                  </div>
                  <div className={styles.linePrice}>{decision.releasePackageRecordId}</div>
                </div>

                <div className={styles.badgeRow}>
                  <span>{decision.actor.role}</span>
                  <span>{decision.compareStatus}</span>
                  <span>{getVerificationModeLabel(decision.verificationMode)}</span>
                </div>

                <p>{decision.rationale}</p>

                <div className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>Published package</span>
                    <strong className={styles.referenceValue}>
                      {decision.releasePackageRecordId}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Target base URL</span>
                    <strong className={styles.referenceValue}>{decision.targetBaseUrl}</strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Overall status</span>
                    <strong className={styles.referenceValue}>{decision.overallStatus}</strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Blocked / warning / ready</span>
                    <strong className={styles.referenceValue}>
                      {decision.blockedCount} / {decision.warningCount} / {decision.readyCount}
                    </strong>
                  </div>
                </div>

                {decision.notes.length ? (
                  <div className={styles.summaryList}>
                    {decision.notes.map((note) => (
                      <div key={note} className={styles.infoBullet}>
                        {note}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <article className={styles.emptyCard}>
              <p className={styles.eyebrow}>No decisions</p>
              <h1>No release decision has been recorded yet</h1>
              <p>
                Run the smoke suite or the live Render verification path again after this slice to
                publish the current hold-versus-approve verdict trail.
              </p>
            </article>
          )}
        </div>
      </section>

      <section className={styles.mainCard}>
        <p className={styles.sectionTitle}>Release history</p>
        <h2>Published release packages</h2>
        <p className={styles.summary}>
          This stream keeps the last published release packages from the protected runtime so the
          team can compare local smoke and live post-deploy states without relying on a single latest
          file only.
        </p>

        <div className={styles.ordersGrid}>
          {isLoading ? (
            <article className={styles.emptyCard}>
              <p className={styles.eyebrow}>Release history</p>
              <h1>Loading published release packages</h1>
              <p>Reading the durable release trail from the shared authority store.</p>
            </article>
          ) : releaseHistory.length ? (
            releaseHistory.map((record) => (
              <article key={record.id} className={styles.lineItem}>
                <div className={styles.lineHead}>
                  <div>
                    <h3>{getVerificationModeLabel(record.verificationMode)}</h3>
                    <p className={styles.lineMeta}>
                      {formatTimestamp(record.publishedAt)} by {record.actor.name}
                    </p>
                  </div>
                  <div className={styles.linePrice}>{getStatusLabel(record.overallStatus)}</div>
                </div>

                <p>
                  {record.targetBaseUrl} with {record.blockedCount} blocked, {record.warningCount}{" "}
                  warnings, and {record.readyCount} ready items.
                </p>

                <div className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>Record ID</span>
                    <strong className={styles.referenceValue}>{record.id}</strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Actor role</span>
                    <strong className={styles.referenceValue}>{record.actor.role}</strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Canonical URL</span>
                    <strong className={styles.referenceValue}>
                      {record.artifact.canonicalUrl}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Evidence mode</span>
                    <strong className={styles.referenceValue}>
                      {record.artifact.releaseEvidence?.verificationMode ?? "runtime_snapshot"}
                    </strong>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className={styles.emptyCard}>
              <p className={styles.eyebrow}>No release packages</p>
              <h1>No package has been published to the durable runtime trail yet</h1>
              <p>
                Run the smoke suite or the live Render verification path again after this slice to
                populate the release history stream.
              </p>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
