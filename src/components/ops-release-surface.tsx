"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import styles from "./order-flow.module.css";

type ReleaseReadinessStatus = "ready" | "warning" | "blocked";

type ReleaseActionOwner = {
  id: string;
  label: string;
  lane: string;
  defaultPath: string;
  summary: string;
};

type ReleaseReadinessGate = {
  id: string;
  title: string;
  status: ReleaseReadinessStatus;
  summary: string;
  details: string[];
  owner: ReleaseActionOwner;
  resolutionAction: string;
};

type ReleaseRuntimePreflightCheck = {
  id: string;
  title: string;
  status: ReleaseReadinessStatus;
  summary: string;
  details: string[];
  owner: ReleaseActionOwner;
  resolutionAction: string;
};

type ReleaseReadinessOwnerSummary = {
  ownerId: string;
  ownerLabel: string;
  lane: string;
  defaultPath: string;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  itemIds: string[];
  itemTitles: string[];
  nextStep: string;
};

type ReleaseRuntimePreflightSnapshot = {
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  checks: ReleaseRuntimePreflightCheck[];
};

type ReleaseReadinessSnapshot = {
  overallStatus: ReleaseReadinessStatus;
  blockedCount: number;
  warningCount: number;
  readyCount: number;
  runtimeEnvironment: string;
  canonicalUrl: string;
  gates: ReleaseReadinessGate[];
  runtimePreflight: ReleaseRuntimePreflightSnapshot;
  ownerSummaries: ReleaseReadinessOwnerSummary[];
  nextActions: string[];
};

type ReleaseEvidence = {
  id: string;
  verificationMode: string;
  targetBaseUrl: string;
  generatedAt: string;
  summary: {
    apiChecks: number;
    protectedRouteChecks: number;
    checkPassRate: number;
  };
  routes: Array<{
    path: string;
    status: number;
    method: string;
  }>;
};

type ReleasePackageRecord = {
  id: string;
  version: number;
  createdAt: string;
  publishedBy: string;
  snapshotSummary: string;
  gateSummary: string;
};

type ReleaseDecisionRecord = {
  id: string;
  decision: "approved" | "rejected" | "deferred";
  recordedBy: string;
  recordedAt: string;
  summary: string;
  approvalRef: string;
};

type ReleaseHandoffRecord = {
  id: string;
  gateId: string;
  handoffTo: string;
  recordedBy: string;
  recordedAt: string;
  summary: string;
};

type TabKey = "overview" | "evidence" | "packages" | "decisions" | "handoffs";

const tabLabels: Record<TabKey, string> = {
  overview: "نظرة عامة",
  evidence: "أدلة التحقق",
  packages: "حزم الإطلاق",
  decisions: "قرارات الإطلاق",
  handoffs: "التسليم بين الفرق",
};

const statusLabels: Record<ReleaseReadinessStatus, string> = {
  ready: "جاهز",
  warning: "يحتاج متابعة",
  blocked: "محجوب",
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—";
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
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [snapshot, setSnapshot] = useState<ReleaseReadinessSnapshot | null>(null);
  const [evidence, setEvidence] = useState<ReleaseEvidence | null>(null);
  const [packages, setPackages] = useState<ReleasePackageRecord[]>([]);
  const [decisions, setDecisions] = useState<ReleaseDecisionRecord[]>([]);
  const [handoffs, setHandoffs] = useState<ReleaseHandoffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/ops/release", {
      cache: "no-store",
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("تعذر تحميل حالة الجاهزية.");
        const body = (await response.json()) as { releaseReadiness?: ReleaseReadinessSnapshot; error?: string };
        if (!body.releaseReadiness) throw new Error(body.error ?? "تعذر تحميل حالة الجاهزية.");
        setSnapshot(body.releaseReadiness);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات الجاهزية.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const loadEvidence = useCallback(async () => {
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/ops/release/evidence", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (response.status === 404) {
        setEvidence(null);
        setNotice("لا يوجد تقرير أدلة تحقق بعد.");
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "تعذر تحميل أدلة التحقق.");
      }
      const body = (await response.json()) as { releaseEvidence?: ReleaseEvidence };
      setEvidence(body.releaseEvidence ?? null);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل أدلة التحقق.");
    }
  }, []);

  const loadPackages = useCallback(async () => {
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/ops/release/history", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "تعذر تحميل سجل الحزم.");
      }
      const body = (await response.json()) as { releasePackages?: ReleasePackageRecord[] };
      setPackages(body.releasePackages ?? []);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل سجل الحزم.");
    }
  }, []);

  const loadDecisions = useCallback(async () => {
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/ops/release/decisions", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "تعذر تحميل قرارات الإطلاق.");
      }
      const body = (await response.json()) as { releaseDecisions?: ReleaseDecisionRecord[] };
      setDecisions(body.releaseDecisions ?? []);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل قرارات الإطلاق.");
    }
  }, []);

  const loadHandoffs = useCallback(async () => {
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/ops/release/handoffs", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "تعذر تحميل سجل التسليم.");
      }
      const body = (await response.json()) as { releaseHandoffs?: ReleaseHandoffRecord[] };
      setHandoffs(body.releaseHandoffs ?? []);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل سجل التسليم.");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "evidence") void loadEvidence();
    if (activeTab === "packages") void loadPackages();
    if (activeTab === "decisions") void loadDecisions();
    if (activeTab === "handoffs") void loadHandoffs();
  }, [activeTab, loadEvidence, loadPackages, loadDecisions, loadHandoffs]);

  const ownerLanes = useMemo(() => {
    if (!snapshot) return [];
    const laneLabels: Record<string, string> = {
      delivery: "التوصيل",
      platform: "المنصة",
      security: "الأمان",
      commerce: "التجارة",
      content: "المحتوى",
    };
    return snapshot.ownerSummaries.map((owner) => ({
      ...owner,
      laneLabel: laneLabels[owner.lane] ?? owner.lane,
    }));
  }, [snapshot]);

  if (error && !snapshot) {
    return (
      <div className={`${styles.page} ${styles.opsDashboard}`}>
        <OpsNav activeHref="/ops/release" />
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>مركز جاهزية الإطلاق</p>
            <h1>تعذر تحميل بيانات الجاهزية</h1>
            <p className={styles.inlineError}>{error}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${styles.opsDashboard} ${styles.opsRelease}`}>
      <OpsNav activeHref="/ops/release" />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>مركز جاهزية الإطلاق</p>
          <h1>قرار إطلاق مبني على أدلة واضحة.</h1>
          <p className={styles.summary}>
            راقب بوابات التشغيل والحماية والمحتوى والتجارة من مكان واحد، واعرف
            صاحب كل خطوة وما المطلوب قبل الانتقال إلى الإنتاج.
          </p>
        </div>
        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>الحالة العامة</p>
            <strong>{isLoading ? "..." : snapshot ? statusLabels[snapshot.overallStatus] : "—"}</strong>
            <span>{snapshot ? `${snapshot.runtimeEnvironment} · ${snapshot.canonicalUrl}` : "جارٍ التحميل…"}</span>
          </div>
          <div className={styles.metricCard}>
            <p>المسؤولون</p>
            <strong>{snapshot ? snapshot.ownerSummaries.length : "..."}</strong>
            <span>فرق مسؤولة عن بوابات الإطلاق.</span>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid} aria-label="ملخص الجاهزية">
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>محجوب</p>
          <strong>{snapshot?.blockedCount ?? "..."}</strong>
          <span>عناصر تمنع اعتماد الإطلاق الآن.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>متابعة</p>
          <strong>{snapshot?.warningCount ?? "..."}</strong>
          <span>عناصر تحتاج مالكًا أو توثيقًا نهائيًا.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>جاهز</p>
          <strong>{snapshot?.readyCount ?? "..."}</strong>
          <span>بوابات اجتازت المتطلبات الحالية.</span>
        </article>
        <article className={styles.statusSummaryCard}>
          <p className={styles.sectionTitle}>عدد البوابات</p>
          <strong>{snapshot?.gates.length ?? "..."}</strong>
          <span>إجمالي بوابات الإطلاق النشطة.</span>
        </article>
      </section>

      <div className={styles.filterChipRow} role="tablist" aria-label="أقسام الإطلاق">
        {(Object.keys(tabLabels) as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`${styles.filterChip} ${activeTab === tab ? styles.filterChipActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {error ? <div className={styles.inlineError} role="alert">{error}</div> : null}
      {notice ? <div className={styles.inlineNotice} role="status">{notice}</div> : null}

      {activeTab === "overview" && snapshot ? (
        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>بوابات الإطلاق</p>
            <h2>الحالة الحالية لكل بوابة</h2>
            <div className={styles.ordersGrid}>
              {snapshot.gates.map((gate) => (
                <article key={gate.id} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div><h3>{gate.title}</h3><p className={styles.lineMeta}>{gate.owner.label}</p></div>
                    <span className={styles.linePrice}>{statusLabels[gate.status]}</span>
                  </div>
                  <p>{gate.summary}</p>
                  {gate.details.map((detail, index) => (
                    <div key={index} className={styles.infoBullet}>{detail}</div>
                  ))}
                  <div className={styles.inlineNotice}>{gate.resolutionAction}</div>
                  <TrackedLink href={gate.owner.defaultPath} analyticsLabel={`ops_release_owner_${gate.id}`} analyticsSurface="ops_release" className={styles.secondaryLink}>
                    فتح مساحة المسؤول
                  </TrackedLink>
                </article>
              ))}
            </div>
          </article>
          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>الخطوات التالية</p>
            <h2>ترتيب التنفيذ المقترح</h2>
            <div className={styles.summaryList}>
              {snapshot.nextActions.map((action, index) => (
                <div key={index} className={styles.infoBullet}>{action}</div>
              ))}
            </div>

            <p className={styles.sectionTitle}>حسب المسؤول</p>
            <h2>الفرق وعدد المهام</h2>
            <div className={styles.summaryList}>
              {ownerLanes.map((owner) => (
                <div key={owner.ownerId} className={styles.referenceCard}>
                  <div className={styles.referenceRow}>
                    <span>{owner.ownerLabel}</span>
                    <strong className={styles.referenceValue}>
                      {owner.laneLabel}
                    </strong>
                  </div>
                  <div className={styles.badgeRow}>
                    <span>{owner.blockedCount} محجوب</span>
                    <span>{owner.warningCount} متابعة</span>
                    <span>{owner.readyCount} جاهز</span>
                  </div>
                  <p className={styles.helperText}>{owner.nextStep}</p>
                  <TrackedLink href={owner.defaultPath} analyticsLabel={`ops_release_owner_lane_${owner.ownerId}`} analyticsSurface="ops_release" className={styles.secondaryLink}>
                    فتح المسار
                  </TrackedLink>
                </div>
              ))}
            </div>
          </aside>
        </section>
      ) : null}

      {activeTab === "overview" && !snapshot && !isLoading ? (
        <div className={styles.emptyCard}>
          <h2>لا توجد بيانات جاهزية متاحة</h2>
          <p>تعذر تحميل حالة بوابات الإطلاق من بيئة التشغيل الحالية.</p>
        </div>
      ) : null}

      {activeTab === "evidence" ? (
        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>تقرير التحقق</p>
            <h2>أدلة اجتياز الاختبارات التشغيلية</h2>
            <p>يعرض هذا القسم تقرير التحقق التنفيذي الذي يوثق حالة المسارات والواجهات الداخلية قبل الإطلاق.</p>
            {evidence ? (
              <div className={styles.ordersGrid}>
                <article className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>تقرير {evidence.verificationMode}</h3>
                      <p className={styles.lineMeta}>{evidence.targetBaseUrl}</p>
                    </div>
                    <div className={styles.linePrice}>
                      {formatTimestamp(evidence.generatedAt)}
                    </div>
                  </div>
                  <div className={styles.referenceCard}>
                    <div className={styles.referenceRow}>
                      <span>فحوص API</span>
                      <strong className={styles.referenceValue}>{evidence.summary.apiChecks}</strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>فحوص المسارات المحمية</span>
                      <strong className={styles.referenceValue}>{evidence.summary.protectedRouteChecks}</strong>
                    </div>
                    <div className={styles.referenceRow}>
                      <span>معدل النجاح</span>
                      <strong className={styles.referenceValue}>
                        {`${(evidence.summary.checkPassRate * 100).toFixed(1)}٪`}
                      </strong>
                    </div>
                  </div>
                  <details>
                    <summary>عرض تفاصيل المسارات ({evidence.routes.length})</summary>
                    <div className={styles.summaryList}>
                      {evidence.routes.map((route) => (
                        <div key={route.path} className={styles.referenceRow}>
                          <span>{route.method} {route.path}</span>
                          <strong className={styles.referenceValue}>{route.status}</strong>
                        </div>
                      ))}
                    </div>
                  </details>
                </article>
              </div>
            ) : (
              <div className={styles.inlineNotice}>لا يوجد تقرير أدلة تحقق منشور بعد. يمكن إنشاؤه عبر واجهة التحقق المستقلة.</div>
            )}
          </article>
          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>ماذا تعني الأدلة؟</p>
            <h2>دليل على اجتياز الفحوص</h2>
            <div className={styles.summaryList}>
              <div className={styles.infoBullet}>
                الأدلة تُنشر من أداة التحقق المستقلة وتوثق حالة كل مسار في وقت محدد.
              </div>
              <div className={styles.infoBullet}>
                لا يمكن تحرير الأدلة بعد نشرها - السجل غير قابل للتعديل.
              </div>
              <div className={styles.infoBullet}>
                الأدلة شرط أساسي قبل أي قرار إطلاق نهائي.
              </div>
            </div>
          </aside>
        </section>
      ) : null}

      {activeTab === "packages" ? (
        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>حزم الإطلاق</p>
            <h2>سجل حزم الجاهزية المنشورة</h2>
            <p>كل حزمة توثق حالة بوابات الإطلاق في وقت معين للمقارنة والمراجعة.</p>
            <div className={styles.ordersGrid}>
              {packages.length > 0 ? packages.map((pkg) => (
                <article key={pkg.id} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>حزمة v{pkg.version}</h3>
                      <p className={styles.lineMeta}>نشرها {pkg.publishedBy}</p>
                    </div>
                    <div className={styles.linePrice}>{formatTimestamp(pkg.createdAt)}</div>
                  </div>
                  <p>{pkg.snapshotSummary}</p>
                  <div className={styles.inlineNotice}>{pkg.gateSummary}</div>
                </article>
              )) : (
                <div className={styles.inlineNotice}>لا توجد حزم إطلاق منشورة بعد.</div>
              )}
            </div>
          </article>
          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>فائدة الحزم</p>
            <h2>لماذا ننشر حزم الإطلاق؟</h2>
            <div className={styles.summaryList}>
              <div className={styles.infoBullet}>
                كل حزمة تمثل snapshot زمني لحالة الجاهزية.
              </div>
              <div className={styles.infoBullet}>
                الفرق بين الحزم يظهر ما تغير بين إصدار وآخر.
              </div>
              <div className={styles.infoBullet}>
                الحزم شرط أساسي قبل تسجيل قرار الإطلاق.
              </div>
            </div>
          </aside>
        </section>
      ) : null}

      {activeTab === "decisions" ? (
        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>قرارات الإطلاق</p>
            <h2>سجل موافقات ورفض الإطلاق</h2>
            <p>كل قرار موثق بمرجع الموافقة وهوية المسؤول.</p>
            <div className={styles.ordersGrid}>
              {decisions.length > 0 ? decisions.map((decision) => {
                const decisionLabel = decision.decision === "approved" ? "موافقة" : decision.decision === "rejected" ? "رفض" : "تأجيل";
                const decisionClass = decision.decision === "approved" ? "مفعّل" : decision.decision === "rejected" ? "ملغي" : "معلق";
                return (
                  <article key={decision.id} className={styles.lineItem}>
                    <div className={styles.lineHead}>
                      <div>
                        <h3>{decisionLabel}</h3>
                        <p className={styles.lineMeta}>سجله {decision.recordedBy}</p>
                      </div>
                      <div className={styles.badgeRow}>
                        <span>{decisionClass}</span>
                        <span>{formatTimestamp(decision.recordedAt)}</span>
                      </div>
                    </div>
                    <p>{decision.summary}</p>
                    <div className={styles.referenceCard}>
                      <div className={styles.referenceRow}>
                        <span>مرجع الموافقة</span>
                        <strong className={styles.referenceValue}>{decision.approvalRef}</strong>
                      </div>
                    </div>
                  </article>
                );
              }) : (
                <div className={styles.inlineNotice}>لا توجد قرارات إطلاق مسجلة بعد.</div>
              )}
            </div>
          </article>
          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>صلاحيات القرار</p>
            <h2>من يمكنه تسجيل القرارات؟</h2>
            <div className={styles.summaryList}>
              <div className={styles.infoBullet}>
                فقط مدير النظام (manager) يمكنه تسجيل قرار الإطلاق.
              </div>
              <div className={styles.infoBullet}>
                القرار يتطلب توثيق مرجع موافقة خارجي (تذكرة أو بريد).
              </div>
              <div className={styles.infoBullet}>
                السجل غير قابل للتعديل بعد النشر.
              </div>
            </div>
          </aside>
        </section>
      ) : null}

      {activeTab === "handoffs" ? (
        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>التسليم بين الفرق</p>
            <h2>سجل تسليم الموانع والمسؤوليات</h2>
            <p>كل تسليم يوثق انتقال مسؤولية بوابة من فريق إلى آخر مع سياق واضح.</p>
            <div className={styles.ordersGrid}>
              {handoffs.length > 0 ? handoffs.map((handoff) => (
                <article key={handoff.id} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{handoff.gateId}</h3>
                      <p className={styles.lineMeta}>إلى {handoff.handoffTo}</p>
                    </div>
                    <div className={styles.linePrice}>{formatTimestamp(handoff.recordedAt)}</div>
                  </div>
                  <p>{handoff.summary}</p>
                  <div className={styles.referenceCard}>
                    <div className={styles.referenceRow}>
                      <span>سجله</span>
                      <strong className={styles.referenceValue}>{handoff.recordedBy}</strong>
                    </div>
                  </div>
                </article>
              )) : (
                <div className={styles.inlineNotice}>لا توجد تسليمات مسجلة بعد.</div>
              )}
            </div>
          </article>
          <aside className={styles.summaryCard}>
            <p className={styles.sectionTitle}>قاعدة التسليم</p>
            <h2>لماذا نوثق التسليم؟</h2>
            <div className={styles.summaryList}>
              <div className={styles.infoBullet}>
                يمنع الجمود عندما تكون البوابة محجوبة ولا يعرف الفريق التالي.
              </div>
              <div className={styles.infoBullet}>
                كل تسليم يحدد المسؤول الجديد بوضوح.
              </div>
              <div className={styles.infoBullet}>
                فقط مدير النظام يمكنه تسجيل التسليم.
              </div>
            </div>
          </aside>
        </section>
      ) : null}

      {isLoading ? (
        <section className={styles.hero}>
          <div className={styles.metricCard}>
            <p>جارٍ تحميل بيانات جاهزية الإطلاق...</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
