"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import {
  fetchOpsReleaseEvidence,
  fetchOpsReleaseReadiness,
} from "@/lib/ops-control-client";
import type { ReleaseEvidenceReport } from "@/lib/release-evidence-types";
import type {
  ReleaseReadinessGate,
  ReleaseReadinessSnapshot,
} from "@/lib/release-readiness-types";
import styles from "./order-flow.module.css";

function getStatusLabel(status: ReleaseReadinessGate["status"]) {
  switch (status) {
    case "ready":
      return "جاهز";
    case "warning":
      return "تحذير";
    case "blocked":
      return "محجوب";
  }
}

function getVerificationModeLabel(mode: ReleaseEvidenceReport["verificationMode"]) {
  switch (mode) {
    case "live_postdeploy":
      return "Live post-deploy";
    case "local_smoke":
      return "Local smoke";
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

export function OpsReleaseSurface() {
  const [snapshot, setSnapshot] = useState<ReleaseReadinessSnapshot | null>(null);
  const [evidence, setEvidence] = useState<ReleaseEvidenceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.allSettled([
      fetchOpsReleaseReadiness(),
      fetchOpsReleaseEvidence(),
    ])
      .then(([readinessResult, evidenceResult]) => {
        if (readinessResult.status === "fulfilled") {
          setSnapshot(readinessResult.value.releaseReadiness);
          setError(null);
        } else {
          setSnapshot(null);
          setError(
            readinessResult.reason instanceof Error
              ? readinessResult.reason.message
              : "تعذر تحميل blockers الإطلاق الحية من سطح ops الداخلي.",
          );
        }

        if (evidenceResult.status === "fulfilled") {
          setEvidence(evidenceResult.value.releaseEvidence);
        } else {
          setEvidence(null);
        }
      })
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

  return (
    <div className={styles.page}>
      <OpsNav activeHref="/ops/release" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Internal release readiness</p>
          <h1>سطح حي يكشف blockers الإطلاق من runtime نفسها بدل إبقائها في docs فقط.</h1>
          <p className={styles.summary}>
            هذا السطح لا يدّعي أن الإطلاق مكتمل. بل يجمع ما تبقى من blockers
            الحقيقية: الاستضافة، authority التشغيلية، auth الداخلية، موافقات
            المحتوى العامة، وآخر evidence تحقق محفوظة قبل أي claim عن launch readiness.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Overall status</p>
            <strong>{isLoading ? "..." : getStatusLabel(metrics.overallStatus)}</strong>
            <span>
              {isLoading
                ? "جارٍ تحميل حالة الإطلاق الحالية."
                : `${metrics.blockedCount} blocked, ${metrics.warningCount} warning, ${metrics.readyCount} ready.`}
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Runtime context</p>
            <h2>{snapshot?.runtimeEnvironment ?? "loading..."}</h2>
            <p>{snapshot?.canonicalUrl ?? "جارٍ تحديد canonical URL الحالية."}</p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Blocked gates</p>
          <strong>{metrics.blockedCount}</strong>
          <span>عدد البوابات التي تمنع claim الإطلاق الآن.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Warnings</p>
          <strong>{metrics.warningCount}</strong>
          <span>بوابات تحسنت لكنها لم تصل بعد إلى production ownership نهائية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Ready</p>
          <strong>{metrics.readyCount}</strong>
          <span>بوابات release الأساسية التي أصبحت مغطاة بالفعل داخل المشروع.</span>
        </article>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Release gates</p>
          <h2>الحالة الحالية لكل gate</h2>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <div className={styles.ordersGrid}>
            {isLoading ? (
              <article className={styles.emptyCard}>
                <p className={styles.eyebrow}>Release</p>
                <h1>جارٍ تحميل blockers الإطلاق</h1>
                <p>يتم الآن جمع المؤشرات الحية من authorities والبيئة الحالية.</p>
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
                <h1>تعذر إنشاء snapshot الجاهزية الحالية</h1>
                <p>تحقق من APIs الداخلية أو من تهيئة بيئة التشغيل الحالية.</p>
              </article>
            )}
          </div>
        </article>

        <aside className={styles.summaryList}>
          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Latest evidence</p>
            <h2>آخر verification محفوظة</h2>
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
                لا يوجد evidence محفوظة بعد في هذه البيئة. شغّل smoke verification محليًا
                أو نفّذ مسار الـ Render live verification بعد أول deploy.
              </div>
            )}
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.sectionTitle}>Next actions</p>
            <h2>ما الذي يغلق blockers المتبقية؟</h2>
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
            <h2>مسارات مرتبطة بالإطلاق</h2>
            <div className={styles.linkList}>
              <TrackedLink
                href="/api/health"
                analyticsLabel="ops_release_to_health"
                analyticsSurface="ops_release_links"
                analyticsDestinationType="other"
              >
                <span>Health endpoint</span>
                <span>Runtime health + authority mode</span>
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
                <span>Sessions + protected mutations</span>
              </TrackedLink>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
