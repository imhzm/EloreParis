"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import {
  fetchOpsSessionSummary,
  fetchOpsReleaseComparison,
  fetchOpsReleaseDecisions,
  fetchOpsReleaseEvidence,
  fetchOpsReleaseHistory,
  fetchOpsReleasePacket,
  fetchOpsReleaseReadiness,
  publishOpsReleaseDecision,
} from "@/lib/ops-control-client";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import type {
  ReleaseDecisionRecord,
  ReleasePackageComparison,
  ReleasePackageRecord,
} from "@/lib/release-package-types";
import type { ReleasePacketArtifact } from "@/lib/release-packet-types";
import type {
  ReleaseReadinessGate,
  ReleaseReadinessOwnerSummary,
  ReleaseReadinessSnapshot,
} from "@/lib/release-readiness-types";
import type { OpsSessionSummary } from "@/lib/ops-types";
import styles from "./order-flow.module.css";

type ReleaseSurfaceData = {
  snapshot: ReleaseReadinessSnapshot | null;
  evidence: ReleaseEvidenceReport | null;
  releaseHistory: ReleasePackageRecord[];
  releaseComparison: ReleasePackageComparison | null;
  releaseDecisions: ReleaseDecisionRecord[];
  releasePacket: ReleasePacketArtifact | null;
  opsSession: OpsSessionSummary | null;
  error: string | null;
};

const RELEASE_SURFACE_PATH = "/ops/release";

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

function getOwnerLaneLabel(
  lane: ReleaseReadinessOwnerSummary["lane"],
) {
  switch (lane) {
    case "delivery":
      return "Delivery";
    case "platform":
      return "Platform";
    case "security":
      return "Security";
    case "commerce":
      return "Commerce";
    case "content":
      return "Content";
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

function getDecisionReviewStatusLabel(
  status: ReleasePacketArtifact["latestDecisionReview"]["status"],
) {
  switch (status) {
    case "unpublished":
      return "Package missing";
    case "missing":
      return "Decision missing";
    case "stale_package":
      return "Package changed";
    case "stale_packet":
      return "Packet changed";
    case "expired_review":
      return "Review expired";
    case "current":
      return "Current";
  }
}

function getDecisionDeltaStatusLabel(
  status: ReleasePacketArtifact["latestDecisionDelta"]["status"],
) {
  switch (status) {
    case "unpublished":
      return "No package";
    case "missing":
      return "No decision";
    case "package_missing":
      return "History missing";
    case "unchanged":
      return "No drift";
    case "changed":
      return "Drifted";
  }
}

function formatToken(value: string) {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 14)}...`;
}

function parseDecisionNotes(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/u)
        .map((note) => note.trim())
        .filter((note) => note.length > 0),
    ),
  );
}

async function loadReleaseSurfaceData(): Promise<ReleaseSurfaceData> {
  const [
    readinessResult,
    evidenceResult,
    historyResult,
    comparisonResult,
    decisionsResult,
    packetResult,
    sessionResult,
  ] = await Promise.allSettled([
    fetchOpsReleaseReadiness(),
    fetchOpsReleaseEvidence(),
    fetchOpsReleaseHistory(),
    fetchOpsReleaseComparison(),
    fetchOpsReleaseDecisions(),
    fetchOpsReleasePacket(),
    fetchOpsSessionSummary(),
  ]);

  return {
    snapshot:
      readinessResult.status === "fulfilled"
        ? readinessResult.value.releaseReadiness
        : null,
    evidence:
      evidenceResult.status === "fulfilled"
        ? evidenceResult.value.releaseEvidence
        : null,
    releaseHistory:
      historyResult.status === "fulfilled"
        ? historyResult.value.releasePackages
        : [],
    releaseComparison:
      comparisonResult.status === "fulfilled"
        ? comparisonResult.value.releaseComparison
        : null,
    releaseDecisions:
      decisionsResult.status === "fulfilled"
        ? decisionsResult.value.releaseDecisions
        : [],
    releasePacket:
      packetResult.status === "fulfilled" ? packetResult.value.releasePacket : null,
    opsSession:
      sessionResult.status === "fulfilled" ? sessionResult.value.session : null,
    error:
      readinessResult.status === "fulfilled"
        ? null
        : readinessResult.reason instanceof Error
          ? readinessResult.reason.message
          : "Unable to load the current release blockers from the protected runtime.",
  };
}

export function OpsReleaseSurface() {
  const [snapshot, setSnapshot] = useState<ReleaseReadinessSnapshot | null>(null);
  const [evidence, setEvidence] = useState<ReleaseEvidenceReport | null>(null);
  const [releaseHistory, setReleaseHistory] = useState<ReleasePackageRecord[]>([]);
  const [releaseComparison, setReleaseComparison] =
    useState<ReleasePackageComparison | null>(null);
  const [releaseDecisions, setReleaseDecisions] = useState<ReleaseDecisionRecord[]>([]);
  const [releasePacket, setReleasePacket] = useState<ReleasePacketArtifact | null>(null);
  const [opsSession, setOpsSession] = useState<OpsSessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerdict, setSelectedVerdict] =
    useState<ReleaseDecisionRecord["verdict"]>("hold");
  const [rationale, setRationale] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [acknowledgedBlockedItemIds, setAcknowledgedBlockedItemIds] = useState<string[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    if (reloadKey === 0) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    void loadReleaseSurfaceData()
      .then((data) => {
        if (!isActive) {
          return;
        }

        setSnapshot(data.snapshot);
        setEvidence(data.evidence);
        setReleaseHistory(data.releaseHistory);
        setReleaseComparison(data.releaseComparison);
        setReleaseDecisions(data.releaseDecisions);
        setReleasePacket(data.releasePacket);
        setOpsSession(data.opsSession);
        setError(data.error);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const currentBlockedItemIds = new Set(
      (releasePacket?.currentArtifact.blockedItems ?? []).map((item) => item.id),
    );

    setAcknowledgedBlockedItemIds((currentValue) =>
      currentValue.filter((itemId) => currentBlockedItemIds.has(itemId)),
    );
  }, [releasePacket]);

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

  const decisionNotes = useMemo(() => parseDecisionNotes(notesInput), [notesInput]);
  const blockedItems = releasePacket?.currentArtifact.blockedItems ?? [];
  const ownerSummaries =
    releasePacket?.currentArtifact.releaseReadiness.ownerSummaries ??
    snapshot?.ownerSummaries ??
    [];
  const activeOwnerSummaries = ownerSummaries.filter(
    (summary) => summary.blockedCount > 0 || summary.warningCount > 0,
  );
  const displayedOwnerSummaries =
    activeOwnerSummaries.length > 0 ? activeOwnerSummaries : ownerSummaries;
  const isManagerSession = opsSession?.role === "manager";
  const packetExpired = releasePacket
    ? Date.parse(releasePacket.reviewExpiresAt) <= Date.now()
    : false;
  const approvalDisabledReason =
    !releasePacket?.latestPublishedRecord
      ? "Publish a protected release package before recording an approval."
      : packetExpired
        ? "Refresh the executive release packet before recording an approval."
        : releasePacket.overallStatus === "blocked"
          ? "Approval stays disabled while the current executive packet is still blocked."
          : releaseComparison?.status !== "unchanged"
            ? "Approval stays disabled until runtime drift returns to unchanged."
            : !releasePacket.currentArtifact.releaseEvidence
              ? "Approval stays disabled until executable release evidence exists in the current runtime."
              : null;

  useEffect(() => {
    if (selectedVerdict === "approve" && approvalDisabledReason) {
      setSelectedVerdict("hold");
    }
  }, [approvalDisabledReason, selectedVerdict]);

  function handleBlockedItemToggle(itemId: string) {
    setAcknowledgedBlockedItemIds((currentValue) =>
      currentValue.includes(itemId)
        ? currentValue.filter((value) => value !== itemId)
        : [...currentValue, itemId],
    );
  }

  async function handleReleaseDecisionSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setPublishError(null);
    setPublishNotice(null);

    if (!opsSession) {
      setPublishError(
        "The current ops session is still loading. Refresh the release surface and try again.",
      );
      return;
    }

    if (!isManagerSession) {
      setPublishError(
        "Only manager sessions can record protected release decisions from this surface.",
      );
      return;
    }

    if (!releasePacket) {
      setPublishError(
        "The latest executive release packet is unavailable. Reload the page before recording a decision.",
      );
      return;
    }

    if (!releasePacket.latestPublishedRecord) {
      setPublishError(
        "A protected release package must be published before a release decision can be recorded.",
      );
      return;
    }

    if (packetExpired) {
      setPublishError(
        "The executive release packet has expired. Refresh the release surface before recording a decision.",
      );
      return;
    }

    const normalizedRationale = rationale.trim();

    if (normalizedRationale.length < 16 || normalizedRationale.length > 500) {
      setPublishError(
        "Rationale must be between 16 and 500 characters before the decision can be recorded.",
      );
      return;
    }

    if (decisionNotes.length > 6 || decisionNotes.some((note) => note.length > 240)) {
      setPublishError(
        "Notes must stay within 6 lines and each note must stay under 240 characters.",
      );
      return;
    }

    const missingAcknowledgements = blockedItems.filter(
      (item) => !acknowledgedBlockedItemIds.includes(item.id),
    );

    if (missingAcknowledgements.length > 0) {
      setPublishError(
        "Acknowledge every current blocked release item before recording the decision from the release surface.",
      );
      return;
    }

    if (selectedVerdict === "approve" && approvalDisabledReason) {
      setPublishError(approvalDisabledReason);
      return;
    }

    setIsPublishing(true);

    try {
      const { releaseDecisionRecord } = await publishOpsReleaseDecision({
        verdict: selectedVerdict,
        rationale: normalizedRationale,
        notes: decisionNotes,
        acknowledgedBlockedItemIds,
        releasePacketGeneratedAt: releasePacket.generatedAt,
        reviewToken: releasePacket.reviewToken,
      });

      trackAnalyticsEvent("ops_release_decision_submit", {
        source_path: RELEASE_SURFACE_PATH,
        source_page_type: getPageType(RELEASE_SURFACE_PATH),
        verdict: releaseDecisionRecord.verdict,
        compare_status: releaseDecisionRecord.compareStatus,
        overall_status: releaseDecisionRecord.overallStatus,
        blocked_count: releaseDecisionRecord.blockedCount,
        warning_count: releaseDecisionRecord.warningCount,
        ready_count: releaseDecisionRecord.readyCount,
        acknowledged_blocked_item_count:
          releaseDecisionRecord.acknowledgedBlockedItemIds.length,
        target_base_url: releaseDecisionRecord.targetBaseUrl,
      });

      setPublishNotice(
        `Recorded a ${releaseDecisionRecord.verdict} decision against ${releaseDecisionRecord.releasePackageRecordId} using the latest executive packet.`,
      );
      setRationale("");
      setNotesInput("");
      setAcknowledgedBlockedItemIds([]);
      setSelectedVerdict("hold");
      setReloadKey((currentValue) => currentValue + 1);
    } catch (submissionError) {
      setPublishError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to record the protected release decision in the current runtime.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

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
            package trail, the release decision trail, and an executive packet inside the
            application authority.
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

                  <div className={styles.badgeRow}>
                    <span>{getOwnerLaneLabel(gate.owner.lane)}</span>
                    <span>{gate.owner.label}</span>
                  </div>

                  <p>{gate.summary}</p>

                  <div className={styles.referenceCard}>
                    <div className={styles.referenceRow}>
                      <span>Owner route</span>
                      <strong className={styles.referenceValue}>{gate.owner.defaultPath}</strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>Resolution action</span>
                      <strong className={styles.referenceValue}>{gate.resolutionAction}</strong>
                    </div>
                  </div>

                  <div className={styles.summaryList}>
                    <div className={styles.infoBullet}>{gate.owner.summary}</div>
                    {gate.details.map((detail) => (
                      <div key={detail} className={styles.infoBullet}>
                        {detail}
                      </div>
                    ))}
                  </div>

                  <div className={styles.linkList}>
                    <TrackedLink
                      href={gate.owner.defaultPath}
                      analyticsLabel={`ops_release_gate_owner_${gate.id}`}
                      analyticsSurface="ops_release_gate_owner"
                      analyticsDestinationType="ops_route"
                    >
                      <span>{gate.owner.label}</span>
                      <span>{gate.resolutionAction}</span>
                    </TrackedLink>
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
            <p className={styles.sectionTitle}>Release packet</p>
            <h2>Executive release packet</h2>
            {releasePacket ? (
              <div className={styles.summaryList}>
                <div className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>Overall status</span>
                    <strong className={styles.referenceValue}>
                      {getStatusLabel(releasePacket.overallStatus)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Latest package</span>
                    <strong className={styles.referenceValue}>
                      {releasePacket.latestPublishedRecord?.id ?? "none"}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Latest decision</span>
                    <strong className={styles.referenceValue}>
                      {releasePacket.latestDecision
                        ? getDecisionVerdictLabel(releasePacket.latestDecision.verdict)
                        : "none"}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Decision review</span>
                    <strong className={styles.referenceValue}>
                      {getDecisionReviewStatusLabel(releasePacket.latestDecisionReview.status)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Decision delta</span>
                    <strong className={styles.referenceValue}>
                      {getDecisionDeltaStatusLabel(releasePacket.latestDecisionDelta.status)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Runtime drift</span>
                    <strong className={styles.referenceValue}>
                      {getComparisonStatusLabel(releasePacket.comparison.status)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Content blockers</span>
                    <strong className={styles.referenceValue}>
                      {releasePacket.contentGovernance.launchBlocked}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Owner lanes with blocked work</span>
                    <strong className={styles.referenceValue}>
                      {
                        releasePacket.currentArtifact.releaseReadiness.ownerSummaries.filter(
                          (summary) => summary.blockedCount > 0,
                        ).length
                      }
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Review token</span>
                    <strong className={styles.referenceValue}>
                      {formatToken(releasePacket.reviewToken)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Review window</span>
                    <strong className={styles.referenceValue}>
                      {releasePacket.reviewWindowMinutes} min
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Refresh by</span>
                    <strong className={styles.referenceValue}>
                      {formatTimestamp(releasePacket.reviewExpiresAt)}
                    </strong>
                  </div>
                </div>

                <div className={styles.summaryList}>
                  {releasePacket.executiveSummary.map((item) => (
                    <div key={item} className={styles.infoBullet}>
                      {item}
                    </div>
                  ))}
                </div>

                <div className={styles.summaryList}>
                  <div className={styles.infoBullet}>
                    {releasePacket.latestDecisionReview.summary}
                  </div>
                  {releasePacket.latestDecisionReview.details.map((item) => (
                    <div key={item} className={styles.infoBullet}>
                      {item}
                    </div>
                  ))}
                </div>

                <div className={styles.summaryList}>
                  {releasePacket.latestDecisionDelta.summary.map((item) => (
                    <div key={item} className={styles.infoBullet}>
                      {item}
                    </div>
                  ))}
                  {releasePacket.latestDecisionDelta.countDeltas ? (
                    <>
                      <div className={styles.infoBullet}>
                        Decision baseline deltas: blocked{" "}
                        {formatDelta(releasePacket.latestDecisionDelta.countDeltas.blocked.delta)},
                        warning{" "}
                        {formatDelta(releasePacket.latestDecisionDelta.countDeltas.warning.delta)},
                        ready {formatDelta(releasePacket.latestDecisionDelta.countDeltas.ready.delta)}
                      </div>
                      <div className={styles.infoBullet}>
                        Blocked items added since latest decision:{" "}
                        {releasePacket.latestDecisionDelta.blockedItems?.added.length
                          ? releasePacket.latestDecisionDelta.blockedItems.added.join(", ")
                          : "none"}
                      </div>
                      <div className={styles.infoBullet}>
                        Blocked items cleared since latest decision:{" "}
                        {releasePacket.latestDecisionDelta.blockedItems?.cleared.length
                          ? releasePacket.latestDecisionDelta.blockedItems.cleared.join(", ")
                          : "none"}
                      </div>
                      <div className={styles.infoBullet}>
                        Warning items added since latest decision:{" "}
                        {releasePacket.latestDecisionDelta.warningItems?.added.length
                          ? releasePacket.latestDecisionDelta.warningItems.added.join(", ")
                          : "none"}
                      </div>
                      <div className={styles.infoBullet}>
                        Warning items cleared since latest decision:{" "}
                        {releasePacket.latestDecisionDelta.warningItems?.cleared.length
                          ? releasePacket.latestDecisionDelta.warningItems.cleared.join(", ")
                          : "none"}
                      </div>
                    </>
                  ) : null}
                </div>

                <div className={styles.summaryList}>
                  {releasePacket.blockerHighlights.map((item) => (
                    <div key={item} className={styles.infoBullet}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.infoBullet}>
                The executive release packet is not available yet from the protected runtime.
              </div>
            )}
          </article>

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
            <p className={styles.sectionTitle}>Blocker ownership</p>
            <h2>Who closes the remaining work?</h2>
            <div className={styles.summaryList}>
              {displayedOwnerSummaries.length ? (
                displayedOwnerSummaries.map((summary) => (
                  <TrackedLink
                    key={summary.ownerId}
                    href={summary.defaultPath}
                    analyticsLabel={`ops_release_owner_${summary.ownerId}`}
                    analyticsSurface="ops_release_owner_summary"
                    analyticsDestinationType="ops_route"
                  >
                    <span>
                      {summary.ownerLabel} ({getOwnerLaneLabel(summary.lane)})
                    </span>
                    <span>
                      {summary.blockedCount} blocked, {summary.warningCount} warnings,{" "}
                      {summary.readyCount} ready. {summary.nextStep}
                    </span>
                  </TrackedLink>
                ))
              ) : (
                <div className={styles.infoBullet}>
                  Owner lanes will appear here after the release snapshot becomes available.
                </div>
              )}
            </div>
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
                href="/api/ops/release/packet"
                analyticsLabel="ops_release_to_packet"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="other"
              >
                <span>Release packet API</span>
                <span>Executive packet for blockers, drift, decisions, and governance</span>
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

                <div className={styles.badgeRow}>
                  <span>{getOwnerLaneLabel(check.owner.lane)}</span>
                  <span>{check.owner.label}</span>
                </div>

                <p>{check.summary}</p>

                <div className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>Owner route</span>
                    <strong className={styles.referenceValue}>{check.owner.defaultPath}</strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Resolution action</span>
                    <strong className={styles.referenceValue}>{check.resolutionAction}</strong>
                  </div>
                </div>

                <div className={styles.summaryList}>
                  <div className={styles.infoBullet}>{check.owner.summary}</div>
                  {check.details.map((detail) => (
                    <div key={detail} className={styles.infoBullet}>
                      {detail}
                    </div>
                  ))}
                </div>

                <div className={styles.linkList}>
                  <TrackedLink
                    href={check.owner.defaultPath}
                    analyticsLabel={`ops_release_preflight_owner_${check.id}`}
                    analyticsSurface="ops_release_preflight_owner"
                    analyticsDestinationType="ops_route"
                  >
                    <span>{check.owner.label}</span>
                    <span>{check.resolutionAction}</span>
                  </TrackedLink>
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

        <article className={styles.lineItem}>
          <div className={styles.lineHead}>
            <div>
              <h3>Record a protected release decision</h3>
              <p className={styles.lineMeta}>
                Manager-authored decisions stay bound to the latest executive packet, review window,
                and blocker acknowledgement trail.
              </p>
            </div>
            <div className={styles.linePrice}>{opsSession?.role ?? "loading..."}</div>
          </div>

          <p className={styles.summary}>
            Current blocked items requiring acknowledgement are always taken from the latest
            executive packet before a protected release decision can be recorded.
          </p>

          {publishError ? <div className={styles.inlineError}>{publishError}</div> : null}
          {publishNotice ? <div className={styles.inlineNotice}>{publishNotice}</div> : null}
          {isRefreshing ? (
            <div className={styles.inlineNotice}>
              Refreshing the executive packet and decision trail after the latest protected action.
            </div>
          ) : null}

          {!opsSession ? (
            <div className={styles.inlineNotice}>
              Loading the current ops session before enabling decision publication.
            </div>
          ) : !isManagerSession ? (
            <div className={styles.inlineNotice}>
              This session is <strong>{opsSession.role}</strong>. Review remains visible here, but
              only manager sessions can record protected hold or approve decisions.
            </div>
          ) : !releasePacket ? (
            <div className={styles.inlineNotice}>
              The executive packet is unavailable right now, so the decision composer cannot be
              armed yet.
            </div>
          ) : (
            <>
              <div className={styles.referenceCard}>
                <div className={styles.referenceRow}>
                  <span>Manager session</span>
                  <strong className={styles.referenceValue}>{opsSession.name}</strong>
                </div>
                <div className={styles.referenceRow}>
                  <span>Latest package</span>
                  <strong className={styles.referenceValue}>
                    {releasePacket.latestPublishedRecord?.id ?? "none"}
                  </strong>
                </div>
                <div className={styles.referenceRow}>
                  <span>Review token</span>
                  <strong className={styles.referenceValue}>
                    {formatToken(releasePacket.reviewToken)}
                  </strong>
                </div>
                <div className={styles.referenceRow}>
                  <span>Review window</span>
                  <strong className={styles.referenceValue}>
                    {releasePacket.reviewWindowMinutes} min
                  </strong>
                </div>
                <div className={styles.referenceRow}>
                  <span>Refresh by</span>
                  <strong className={styles.referenceValue}>
                    {formatTimestamp(releasePacket.reviewExpiresAt)}
                  </strong>
                </div>
                <div className={styles.referenceRow}>
                  <span>Runtime drift</span>
                  <strong className={styles.referenceValue}>
                    {getComparisonStatusLabel(releasePacket.comparison.status)}
                  </strong>
                </div>
              </div>

              <div className={styles.inlineNotice}>
                {releasePacket.latestDecisionReview.summary}
              </div>

              <div className={styles.inlineNotice}>
                {releasePacket.latestDecisionDelta.summary[0]}
              </div>

              {approvalDisabledReason ? (
                <div className={styles.inlineNotice}>{approvalDisabledReason}</div>
              ) : null}

              <form className={styles.actionColumn} onSubmit={handleReleaseDecisionSubmit}>
                <div className={styles.fieldFull}>
                  <span className={styles.fieldLabel}>Decision verdict</span>
                  <div className={styles.radioGrid}>
                    <label
                      className={`${styles.optionCard} ${
                        selectedVerdict === "hold" ? styles.optionCardActive : ""
                      }`}
                    >
                      <div className={styles.optionHead}>
                        <div>
                          <strong>Hold</strong>
                          <p className={styles.optionNote}>
                            Record an honest hold while external deployment or approval blockers
                            still remain.
                          </p>
                        </div>
                        <input
                          className={styles.optionRadio}
                          type="radio"
                          name="release-decision-verdict"
                          checked={selectedVerdict === "hold"}
                          onChange={() => setSelectedVerdict("hold")}
                        />
                      </div>
                    </label>

                    <label
                      className={`${styles.optionCard} ${
                        selectedVerdict === "approve" ? styles.optionCardActive : ""
                      } ${approvalDisabledReason ? styles.optionCardDisabled : ""}`}
                    >
                      <div className={styles.optionHead}>
                        <div>
                          <strong>Approve</strong>
                          <p className={styles.optionNote}>
                            Available only when the latest protected package is in sync, unblocked,
                            and backed by executable evidence.
                          </p>
                        </div>
                        <input
                          className={styles.optionRadio}
                          type="radio"
                          name="release-decision-verdict"
                          checked={selectedVerdict === "approve"}
                          disabled={Boolean(approvalDisabledReason)}
                          onChange={() => setSelectedVerdict("approve")}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <label className={styles.fieldFull}>
                  <span className={styles.fieldLabel}>Decision rationale</span>
                  <textarea
                    className={styles.textArea}
                    value={rationale}
                    onChange={(event) => setRationale(event.currentTarget.value)}
                    placeholder="Explain why this package should stay on hold or can be approved."
                  />
                  <span className={styles.helperText}>
                    Use a concrete rationale between 16 and 500 characters.
                  </span>
                </label>

                <label className={styles.fieldFull}>
                  <span className={styles.fieldLabel}>Decision notes</span>
                  <textarea
                    className={styles.textArea}
                    value={notesInput}
                    onChange={(event) => setNotesInput(event.currentTarget.value)}
                    placeholder="One supporting note per line. Keep the notes short and operational."
                  />
                  <span className={styles.helperText}>
                    One note per line, up to 6 notes total.
                  </span>
                </label>

                <div className={styles.fieldFull}>
                  <span className={styles.fieldLabel}>
                    Current blocked items requiring acknowledgement
                  </span>
                  {blockedItems.length ? (
                    <div className={styles.summaryList}>
                      {blockedItems.map((item) => {
                        const isChecked = acknowledgedBlockedItemIds.includes(item.id);

                        return (
                          <label key={item.id} className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleBlockedItemToggle(item.id)}
                            />
                            <span>
                              <strong>{item.title}</strong>
                              <br />
                              {item.summary}
                              <br />
                              Owner: {item.owner.label} ({getOwnerLaneLabel(item.owner.lane)})
                              <br />
                              Next step: {item.resolutionAction}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.inlineNotice}>
                      No blocked items remain in this packet, so no blocker acknowledgement is
                      required for the current decision.
                    </div>
                  )}
                </div>

                <div className={styles.actionColumn}>
                  <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={
                      isPublishing ||
                      isRefreshing ||
                      !releasePacket.latestPublishedRecord ||
                      packetExpired
                    }
                  >
                    {isPublishing
                      ? "Recording protected decision..."
                      : selectedVerdict === "approve"
                        ? "Record approval decision"
                        : "Record hold decision"}
                  </button>
                </div>
              </form>
            </>
          )}
        </article>

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
                    <span>Reviewed packet</span>
                    <strong className={styles.referenceValue}>
                      {formatTimestamp(decision.releasePacketGeneratedAt)}
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
                  <div className={styles.referenceRow}>
                    <span>Review token</span>
                    <strong className={styles.referenceValue}>
                      {formatToken(decision.releasePacketReviewToken)}
                    </strong>
                  </div>
                  <div className={styles.referenceRow}>
                    <span>Review window</span>
                    <strong className={styles.referenceValue}>
                      {decision.releasePacketReviewWindowMinutes} min
                    </strong>
                  </div>
                </div>

                {decision.acknowledgedBlockedItemIds.length ? (
                  <div className={styles.summaryList}>
                    <div className={styles.infoBullet}>
                      Acknowledged blockers: {decision.acknowledgedBlockedItemIds.join(", ")}
                    </div>
                  </div>
                ) : null}

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
                  <div className={styles.referenceRow}>
                    <span>Owner lanes with blocked work</span>
                    <strong className={styles.referenceValue}>
                      {
                        record.artifact.releaseReadiness.ownerSummaries.filter(
                          (summary) => summary.blockedCount > 0,
                        ).length
                      }
                    </strong>
                  </div>
                </div>

                <div className={styles.summaryList}>
                  {record.artifact.releaseReadiness.ownerSummaries
                    .filter(
                      (summary) => summary.blockedCount > 0 || summary.warningCount > 0,
                    )
                    .slice(0, 3)
                    .map((summary) => (
                      <div
                        key={`${record.id}-${summary.ownerId}`}
                        className={styles.infoBullet}
                      >
                        {summary.ownerLabel} ({getOwnerLaneLabel(summary.lane)}):{" "}
                        {summary.blockedCount} blocked, {summary.warningCount} warnings.{" "}
                        {summary.nextStep}
                      </div>
                    ))}
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
