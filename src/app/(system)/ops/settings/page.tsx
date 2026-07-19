import type { Metadata } from "next";
import Link from "next/link";
import { OpsNav } from "@/components/ops-nav";
import styles from "@/components/ops-settings.module.css";
import { StorefrontShell } from "@/components/storefront-shell";
import {
  getOpsAccessConfig,
  getOpsRoleLabel,
} from "@/lib/ops-access";
import { buildProviderIntegrationContract } from "@/lib/provider-integration-contract";
import {
  isPublicCatalogApproved,
  isPublicCommerceEnabled,
  isPublicDiscoveryContentApproved,
  isPublicEditorialContentApproved,
  isPublicLegalContentApproved,
} from "@/lib/release-controls";
import { getReleaseRuntimePreflightSnapshot } from "@/lib/release-runtime-preflight";
import { isPublicReleaseApproved } from "@/lib/search-visibility";

export const metadata: Metadata = {
  title: "إعدادات لوحة التحكم",
  description:
    "مركز محمي لمراجعة الوصول والمزوّدين وبوابات تشغيل ÉLORÉ PARIS.",
  robots: { index: false, follow: false },
};

const statusLabels = {
  ready: "جاهز",
  warning: "يحتاج مراجعة",
  blocked: "غير مكتمل",
};

export default function OpsSettingsPage() {
  let access: ReturnType<typeof getOpsAccessConfig>;
  let providers: ReturnType<typeof buildProviderIntegrationContract>;
  let runtime: ReturnType<typeof getReleaseRuntimePreflightSnapshot>;

  try {
    access = getOpsAccessConfig();
    providers = buildProviderIntegrationContract();
    runtime = getReleaseRuntimePreflightSnapshot();
  } catch (error) {
    return (
      <StorefrontShell activeHref="/ops/settings">
        <OpsNav activeHref="/ops/settings" />
        <div className={styles.page}>
          <div className={styles.hero}>
            <div>
              <span className={styles.eyebrow}>SETTINGS</span>
              <h1>تعذر تحميل الإعدادات</h1>
              <p>{error instanceof Error ? error.message : "حدث خطأ غير متوقع."}</p>
            </div>
          </div>
        </div>
      </StorefrontShell>
    );
  }

  const publicGates = [
    { label: "اعتماد الإصدار العام", key: "PUBLIC_RELEASE_APPROVED", enabled: isPublicReleaseApproved() },
    { label: "اعتماد الكتالوج", key: "PUBLIC_CATALOG_APPROVED", enabled: isPublicCatalogApproved() },
    { label: "اعتماد محتوى الاكتشاف", key: "PUBLIC_DISCOVERY_CONTENT_APPROVED", enabled: isPublicDiscoveryContentApproved() },
    { label: "اعتماد المحتوى التحريري", key: "PUBLIC_EDITORIAL_CONTENT_APPROVED", enabled: isPublicEditorialContentApproved() },
    { label: "اعتماد المحتوى القانوني", key: "PUBLIC_LEGAL_CONTENT_APPROVED", enabled: isPublicLegalContentApproved() },
    { label: "تفعيل التجارة العامة", key: "PUBLIC_COMMERCE_ENABLED", enabled: isPublicCommerceEnabled() },
  ];

  return (
    <StorefrontShell activeHref="/ops/settings">
      <OpsNav activeHref="/ops/settings" />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span>CONTROL PLANE</span>
            <h1>الإعدادات</h1>
            <p>
              قراءة آمنة لحالة الوصول والمزوّدين وبوابات التشغيل. لا تظهر هذه
              الشاشة الأسرار ولا تسمح بتعديل بيئة الإنتاج من المتصفح.
            </p>
          </div>
          <div className={`${styles.overallStatus} ${styles[providers.overallStatus]}`}>
            <span>حالة التكاملات</span>
            <strong>{statusLabels[providers.overallStatus]}</strong>
          </div>
        </header>

        <section className={styles.summaryGrid} aria-label="ملخص الإعدادات">
          <article>
            <span>وضع الوصول</span>
            <strong>{access.mode === "protected" ? "محمي" : access.mode === "development_open" ? "تطوير مفتوح" : "يحتاج إعداد"}</strong>
            <p>{access.users.length.toLocaleString("ar-SA")} مستخدم داخلي مهيأ</p>
          </article>
          <article>
            <span>التكاملات الجاهزة</span>
            <strong>{providers.readyCount.toLocaleString("ar-SA")}</strong>
            <p>{providers.warningCount.toLocaleString("ar-SA")} تحذير · {providers.blockedCount.toLocaleString("ar-SA")} عائق</p>
          </article>
          <article>
            <span>فحوص بيئة التشغيل</span>
            <strong>{runtime.readyCount.toLocaleString("ar-SA")}</strong>
            <p>{runtime.warningCount.toLocaleString("ar-SA")} تحذير · {runtime.blockedCount.toLocaleString("ar-SA")} عائق</p>
          </article>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>IDENTITIES</span><h2>المستخدمون والأدوار</h2></div>
              <span>{access.users.length.toLocaleString("ar-SA")} مستخدم</span>
            </div>
            {access.users.length > 0 ? (
              <ul className={styles.identityList}>
                {access.users.map((user) => (
                  <li key={user.id}>
                    <span className={styles.avatar} aria-hidden="true">{user.name.trim().charAt(0).toUpperCase() || "É"}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <span>{getOpsRoleLabel(user.role)}</span>
                    </div>
                    <em>{user.username && user.passwordHash ? "هوية وكلمة مرور" : "رمز وصول"}</em>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>لا توجد هويات تشغيلية صالحة في هذه البيئة.</div>
            )}
            <p className={styles.securityNote}>
              كلمات المرور المشفّرة ورموز الوصول وأسرار التوقيع لا تُرسل إلى
              المتصفح ولا تظهر في هذه الصفحة.
            </p>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>PUBLIC GATES</span><h2>بوابات النشر والتجارة</h2></div>
              <Link href="/ops/release">فتح جاهزية الإطلاق</Link>
            </div>
            <ul className={styles.gateList}>
              {publicGates.map((gate) => (
                <li key={gate.key}>
                  <div><strong>{gate.label}</strong><code>{gate.key}</code></div>
                  <span className={gate.enabled ? styles.gateOn : styles.gateOff}>
                    {gate.enabled ? "مفعّل" : "مغلق"}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div><span>INTEGRATIONS</span><h2>المزوّدون ومسارات التنفيذ</h2></div>
            <span>بدون عرض أي credentials</span>
          </div>
          <div className={styles.integrationGrid}>
            {providers.lanes.map((lane) => (
              <article key={lane.id}>
                <div>
                  <span className={`${styles.statusBadge} ${styles[lane.status]}`}>
                    {statusLabels[lane.status]}
                  </span>
                  <h3>{lane.title}</h3>
                </div>
                <p>{lane.currentMode}</p>
                <dl>
                  <div><dt>الدليل الحالي</dt><dd>{lane.evidence}</dd></div>
                  <div><dt>الإجراء التالي</dt><dd>{lane.nextAction}</dd></div>
                </dl>
                <Link href={lane.ownerPath}>فتح المسار المسؤول</Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div><span>RUNTIME</span><h2>سلامة بيئة التشغيل</h2></div>
          </div>
          <div className={styles.runtimeGrid}>
            {runtime.checks.map((check) => (
              <article key={check.id}>
                <span className={`${styles.statusBadge} ${styles[check.status]}`}>
                  {statusLabels[check.status]}
                </span>
                <h3>{check.title}</h3>
                <p>{check.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className={styles.boundaryNote}>
          <strong>لماذا لا توجد مفاتيح تعديل هنا؟</strong>
          <p>
            إعدادات الإنتاج والأسرار تُدار من بيئة الاستضافة مع سجل تغيير
            واسترجاع واضح. تحويلها إلى نموذج ويب بلا secret manager وموافقة
            مزدوجة سيضيف خطرًا أمنيًا أكبر من فائدته.
          </p>
        </aside>
      </div>
    </StorefrontShell>
  );
}
