"use client";

import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import {
  contentApprovalRules,
  contentGovernanceEntries,
  contentSamplePackChecklist,
  getContentGovernanceAreaLabel,
  getContentGovernanceStatusLabel,
  getContentGovernanceSummary,
} from "@/lib/content-governance";
import styles from "./order-flow.module.css";

export function OpsContentSurface() {
  const summary = getContentGovernanceSummary();

  return (
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsContent}`}>
      <OpsNav activeHref="/ops/content" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>حوكمة المحتوى</p>
          <h1>كل صفحة لها مسؤول، وكل نشر له شرط واضح.</h1>
          <p className={styles.summary}>
            راجعي ملكية صفحات الموقع، الموافقات المطلوبة، والبيانات أو عينات الأسلوب
            التي ما زالت تمنع اعتماد المحتوى بصورته النهائية.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>حالة تجميد المحتوى</p>
            <strong>{summary.totalSurfaces}</strong>
            <span>
              {summary.ownersMapped} named owners across {summary.totalRoutes} mapped public
              routes, with {summary.sampleBased} sample-based group, {summary.awaitingStyleSamples} sample-blocked groups and{" "}
              {summary.awaitingBusinessInputs} business-data-blocked groups.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>بوابة الإطلاق</p>
            <h2>البنية جاهزة، والصوت النهائي ينتظر الاعتماد</h2>
            <p>
              يمكن مراجعة الموقع كنظام متكامل، لكن اعتماد النصوص العامة يظل مرتبطًا
              بعينات حقيقية وبيانات تشغيلية موثقة.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid}>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>Brand samples received</p>
          <strong>{summary.sampleBased}</strong>
          <span>Surface groups grounded in the dated ÉLORÉ PARIS brand handoff.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>مجموعات الصفحات</p>
          <strong>{summary.totalSurfaces}</strong>
          <span>Route clusters with explicit ownership, approver, and launch blocker.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>المسارات العامة</p>
          <strong>{summary.totalRoutes}</strong>
          <span>Public-facing routes covered by the current ownership freeze.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>تنتظر عينات الأسلوب</p>
          <strong>{summary.awaitingStyleSamples}</strong>
          <span>Surface groups blocked on real brand or editorial examples.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>تنتظر بيانات العمل</p>
          <strong>{summary.awaitingBusinessInputs}</strong>
          <span>Surface groups blocked on legal, support, or company operating data.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>المسؤولون المحددون</p>
          <strong>{summary.ownersMapped}</strong>
          <span>Owner assignments are no longer implicit or scattered across notes.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>عناصر تمنع الإطلاق</p>
          <strong>{summary.launchBlocked}</strong>
          <span>No public content area is treated as final until its gate is actually cleared.</span>
        </article>
      </section>

      <section className={styles.layout}>
        <div className={styles.summaryList}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>مصفوفة المسؤوليات</p>
            <h2>من يملك كل صفحة، وما الذي يمنع اعتمادها؟</h2>

            <div className={styles.ordersGrid}>
              {contentGovernanceEntries.map((entry) => (
                <article key={entry.id} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{entry.title}</h3>
                      <p className={styles.lineMeta}>
                        Owner: {entry.owner} · Approver: {entry.approver}
                      </p>
                    </div>
                    <div className={styles.linePrice}>{getContentGovernanceAreaLabel(entry.area)}</div>
                  </div>

                  <div className={styles.badgeRow}>
                    <span>{getContentGovernanceStatusLabel(entry.status)}</span>
                    <span>{entry.routes.length} routes</span>
                    <span>{entry.id}</span>
                  </div>

                  <p>{entry.freezeDecision}</p>

                  <div className={styles.referenceCard}>
                    <div className={styles.referenceRow}>
                      <span>عائق الإطلاق</span>
                      <strong className={styles.referenceValue}>{entry.launchBlocker}</strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>الموافقة التالية</span>
                      <strong className={styles.referenceValue}>{entry.nextApproval}</strong>
                    </div>
                  </div>

                  <div className={styles.summaryList}>
                    {entry.requiredInputs.map((input) => (
                      <div key={input} className={styles.infoBullet}>
                        {input}
                      </div>
                    ))}
                  </div>

                  <div className={styles.linkList}>
                    <TrackedLink
                      href={entry.routes[0] ?? "/"}
                      analyticsLabel={`ops_content_surface_${entry.id}`}
                      analyticsSurface="ops_content_routes"
                      analyticsDestinationType="other"
                    >
                      <span>فتح المسار الأساسي</span>
                      <span>{entry.routes[0] ?? "/"}</span>
                    </TrackedLink>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>العينات والموافقات</p>
            <h2>الحد الأدنى المطلوب قبل اعتماد صوت العلامة</h2>

            <div className={styles.catalogPanelGrid}>
              <div className={styles.referenceCard}>
                <strong>Sample pack checklist</strong>
                <div className={styles.summaryList}>
                  {contentSamplePackChecklist.map((item) => (
                    <div key={item} className={styles.infoBullet}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.referenceCard}>
                <strong>Approval rules</strong>
                <div className={styles.summaryList}>
                  {contentApprovalRules.map((rule) => (
                    <div key={rule} className={styles.infoBullet}>
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Related surfaces</p>
          <h2>راجعي المسارات الحية التي تغطيها الحوكمة</h2>
          <div className={styles.linkList}>
            <TrackedLink
              href="/"
              analyticsLabel="ops_content_to_home"
              analyticsSurface="ops_content_links"
              analyticsDestinationType="home"
            >
              <span>Homepage and shop promise</span>
              <span>Hero + IA</span>
            </TrackedLink>
            <TrackedLink
              href="/journal"
              analyticsLabel="ops_content_to_journal"
              analyticsSurface="ops_content_links"
              analyticsDestinationType="journal_index"
            >
              <span>Journal system</span>
              <span>Editorial voice</span>
            </TrackedLink>
            <TrackedLink
              href="/trust"
              analyticsLabel="ops_content_to_trust"
              analyticsSurface="ops_content_links"
              analyticsDestinationType="trust"
            >
              <span>Trust and legal surfaces</span>
              <span>Business-data gate</span>
            </TrackedLink>
            <TrackedLink
              href="/contact"
              analyticsLabel="ops_content_to_contact"
              analyticsSurface="ops_content_links"
              analyticsDestinationType="contact"
            >
              <span>Support and contact</span>
              <span>Channel ownership</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/audit"
              analyticsLabel="ops_content_to_audit"
              analyticsSurface="ops_content_links"
              analyticsDestinationType="ops_audit"
            >
              <span>Audit trail</span>
              <span>Session and ops trace</span>
            </TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
