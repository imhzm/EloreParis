import { OpsNav } from "@/components/ops-nav";
import { TrackedLink } from "@/components/tracked-link";
import { getReleaseReadinessSnapshot } from "@/lib/release-readiness";
import type { ReleaseReadinessStatus } from "@/lib/release-readiness-types";
import styles from "./order-flow.module.css";

const statusLabels: Record<ReleaseReadinessStatus, string> = {
  ready: "جاهز",
  warning: "يحتاج متابعة",
  blocked: "محجوب",
};

export function OpsReleaseSurface() {
  const snapshot = getReleaseReadinessSnapshot();

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
            <strong>{statusLabels[snapshot.overallStatus]}</strong>
            <span>{snapshot.runtimeEnvironment} · {snapshot.canonicalUrl}</span>
          </div>
        </div>
      </section>

      <section className={styles.statusSummaryGrid} aria-label="ملخص الجاهزية">
        {([
          ["محجوب", snapshot.blockedCount, "عناصر تمنع اعتماد الإطلاق الآن."],
          ["متابعة", snapshot.warningCount, "عناصر تحتاج مالكًا أو توثيقًا نهائيًا."],
          ["جاهز", snapshot.readyCount, "بوابات اجتازت المتطلبات الحالية."],
        ] as const).map(([label, value, description]) => (
          <article key={label} className={styles.statusSummaryCard}>
            <p className={styles.sectionTitle}>{label}</p>
            <strong>{value}</strong>
            <span>{description}</span>
          </article>
        ))}
      </section>

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
                <div className={styles.infoBullet}>{gate.resolutionAction}</div>
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
              <div key={`${index}-${action}`} className={styles.infoBullet}>{action}</div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
