"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TrackedLink } from "@/components/tracked-link";
import type { OpsAccessMode, OpsAuthMethod } from "@/lib/ops-types";
import styles from "./order-flow.module.css";

type OpsAccessSurfaceProps = {
  accessMode: OpsAccessMode;
  primaryAuthMethod: OpsAuthMethod;
  supportsAccessCodeAuth: boolean;
  supportsIdentityAuth: boolean;
  deniedPath?: string;
  nextPath: string;
};

type LoginPayload = {
  accessCode?: string;
  username?: string;
  password?: string;
  nextPath: string;
};

export function OpsAccessSurface({
  accessMode,
  primaryAuthMethod,
  supportsAccessCodeAuth,
  supportsIdentityAuth,
  deniedPath,
  nextPath,
}: OpsAccessSurfaceProps) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  async function submitLogin(payload: LoginPayload) {
    setError(null);

    try {
      const response = await fetch("/api/ops-access/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(
          responsePayload.error ??
            "تعذر التحقق من بيانات الدخول التشغيلية في هذه اللحظة.",
        );
        return;
      }

      startTransition(() => {
        router.push(responsePayload.redirectTo ?? nextPath);
        router.refresh();
      });
    } catch {
      setError(
        "تعذر الوصول إلى بوابة التحقق الداخلية الآن. أعيدي المحاولة بعد لحظات.",
      );
    }
  }

  async function handleIdentitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (accessMode !== "protected") {
      return;
    }

    await submitLogin({
      username,
      password,
      nextPath,
    });
  }

  async function handleAccessCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (accessMode !== "protected") {
      return;
    }

    await submitLogin({
      accessCode,
      nextPath,
    });
  }

  const showIdentityCard = supportsIdentityAuth;
  const showAccessCodeCard = supportsAccessCodeAuth;
  const prefersIdentity = primaryAuthMethod === "identity_password";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Ops access gate</p>
          <h1>بوابة آمنة لفريق التشغيل وإدارة الطلبات.</h1>
          <p className={styles.summary}>
            سجّلي الدخول بالهوية المخصصة لك للوصول إلى الأدوات المسموح بها فقط.
            كل جلسة مرتبطة بدور واضح، مع فصل كامل بين لوحة التشغيل وواجهة المتجر العامة.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Protected routes</p>
            <strong>/ops/*</strong>
            <span>
              وصول منظم إلى الطلبات والكتالوج والشحن والإشعارات وسجل المراجعة.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Next destination</p>
            <h2>{nextPath}</h2>
            <p>
              بعد التحقق ستنتقلين مباشرة إلى الوجهة المطلوبة، أو إلى الصفحة الرئيسية
              المناسبة لدورك إذا لم تكن الوجهة ضمن صلاحياتك.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <article className={styles.mainCard}>
          <p className={styles.sectionTitle}>Access mode</p>
          <h2>وضع الوصول الحالي</h2>

          {accessMode === "protected" ? (
            <>
              {deniedPath ? (
                <div className={styles.inlineError}>
                  الجلسة الحالية لا تملك صلاحية الدخول إلى `{deniedPath}`.
                  استخدمي بيانات الدور المناسب أو ارجعي إلى المسار الداخلي
                  المسموح.
                </div>
              ) : null}

              <p>
                الحماية مفعلة الآن. البوابة الحالية تدعم{" "}
                {showIdentityCard ? "هوية داخلية باسم مستخدم وكلمة مرور" : "رموز وصول داخلية"}{" "}
                {showIdentityCard && showAccessCodeCard
                  ? "مع fallback access code للحالات الانتقالية."
                  : "."}
              </p>

              {error ? <div className={styles.inlineError}>{error}</div> : null}

              <div className={styles.authMethodsGrid}>
                {showIdentityCard ? (
                  <form
                    className={`${styles.authMethodCard} ${prefersIdentity ? styles.authMethodCardPrimary : ""}`}
                    onSubmit={handleIdentitySubmit}
                  >
                    <div className={styles.authMethodHeader}>
                      <p className={styles.sectionTitle}>Identity login</p>
                      <h3>الدخول ببيانات المشغل</h3>
                      <p>
                        هذا هو المسار المفضل الآن لأنه يفصل بين المستخدمين
                        والأدوار بدل الاعتماد على رمز واحد مشترك.
                      </p>
                    </div>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>اسم المستخدم</span>
                      <input
                        className={styles.textInput}
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.currentTarget.value)}
                        autoComplete="username"
                        dir="ltr"
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>كلمة المرور</span>
                      <input
                        className={styles.textInput}
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.currentTarget.value)}
                        autoComplete="current-password"
                        dir="ltr"
                      />
                    </label>

                    <div className={styles.actionColumn}>
                      <button
                        className={styles.primaryButton}
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "جارٍ التحقق..." : "الدخول ببيانات المشغل"}
                      </button>
                    </div>
                  </form>
                ) : null}

                {showAccessCodeCard ? (
                  <form
                    className={`${styles.authMethodCard} ${!showIdentityCard ? styles.authMethodCardPrimary : ""}`}
                    onSubmit={handleAccessCodeSubmit}
                  >
                    <div className={styles.authMethodHeader}>
                      <p className={styles.sectionTitle}>Access code</p>
                      <h3>الدخول برمز الوصول</h3>
                      <p>
                        هذا المسار موجود للحفاظ على التوافق الانتقالي أو للبيئات
                        التي لم تنتقل بعد إلى identity login.
                      </p>
                    </div>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>رمز الوصول الداخلي</span>
                      <input
                        className={styles.textInput}
                        type="password"
                        value={accessCode}
                        onChange={(event) => setAccessCode(event.currentTarget.value)}
                        autoComplete="current-password"
                        dir="ltr"
                      />
                    </label>

                    <div className={styles.actionColumn}>
                      <button
                        className={showIdentityCard ? styles.secondaryButton : styles.primaryButton}
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "جارٍ التحقق..." : "الدخول برمز الوصول"}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </>
          ) : accessMode === "setup_required" ? (
            <>
              <div className={styles.inlineError}>
                الحماية مفعلة، لكن لا توجد هوية داخلية مضبوطة بعد. أضيفي
                `OPS_AUTH_USERS_JSON` أو استخدمي fallback legacy عبر
                `OPS_ACCESS_USERS_JSON` أو `OPS_ACCESS_CODE`.
              </div>
              <p>
                إذا كان الهدف هو بيئة أقرب للإطلاق، فالأولوية الآن هي إعداد
                مستخدمين داخليين role-aware بدل الاكتفاء access code واحدة.
              </p>
            </>
          ) : (
            <>
              <div className={styles.inlineNotice}>
                بيئة التطوير الحالية تعمل بوضع open local rehearsal. أسطح `/ops`
                متاحة محليًا لتسريع البناء، بينما الحماية تصبح فعلية عند تفعيل
                `ENFORCE_OPS_ACCESS=true` أو عند التشغيل الإنتاجي.
              </div>
              <div className={styles.actionColumn}>
                <TrackedLink
                  href={nextPath}
                  className={styles.primaryLink}
                  analyticsLabel="ops_access_open_to_ops"
                  analyticsSurface="ops_access_open"
                  analyticsDestinationType="ops_dashboard"
                >
                  فتح ops الآن
                </TrackedLink>
              </div>
            </>
          )}
        </article>

        <aside className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Boundary notes</p>
          <h2>ما الذي تم تجميده الآن؟</h2>

          <div className={styles.summaryList}>
            <div className={styles.infoBullet}>
              أسطح `/ops` أصبحت داخلية صراحة، وليست امتدادًا عامًا للواجهة
              التجارية.
            </div>
            <div className={styles.infoBullet}>
              المسار الحالي يميّز بين هوية المشغل ودوره، حتى لو بقيت الجلسة
              Signed-cookie session وليست provider-backed auth كاملة بعد.
            </div>
            <div className={styles.infoBullet}>
              هذا gate ليس النهاية؛ لكنه يرفع المشروع من shared access code إلى
              login أقرب للـ RBAC قبل backend ownership الحقيقية.
            </div>
          </div>

          <div className={styles.linkList}>
            <TrackedLink
              href="/ops"
              analyticsLabel="ops_access_to_dashboard"
              analyticsSurface="ops_access_links"
              analyticsDestinationType="ops_dashboard"
            >
              <span>لوحة التشغيل</span>
              <span>Dashboard</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/orders"
              analyticsLabel="ops_access_to_orders"
              analyticsSurface="ops_access_links"
              analyticsDestinationType="ops_orders"
            >
              <span>إدارة الطلبات</span>
              <span>Orders</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/catalog"
              analyticsLabel="ops_access_to_catalog"
              analyticsSurface="ops_access_links"
              analyticsDestinationType="ops_catalog"
            >
              <span>إدارة الكتالوج</span>
              <span>Catalog</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/fulfillment"
              analyticsLabel="ops_access_to_fulfillment"
              analyticsSurface="ops_access_links"
              analyticsDestinationType="ops_fulfillment"
            >
              <span>إدارة fulfillment</span>
              <span>Routing</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/content"
              analyticsLabel="ops_access_to_content"
              analyticsSurface="ops_access_links"
              analyticsDestinationType="ops_content"
            >
              <span>حوكمة المحتوى</span>
              <span>Content</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/release"
              analyticsLabel="ops_access_to_release"
              analyticsSurface="ops_access_links"
              analyticsDestinationType="ops_release"
            >
              <span>جاهزية الإطلاق</span>
              <span>Release</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/notifications"
              analyticsLabel="ops_access_to_notifications"
              analyticsSurface="ops_access_links"
              analyticsDestinationType="ops_notifications"
            >
              <span>إدارة الإشعارات</span>
              <span>Notifications</span>
            </TrackedLink>
            <TrackedLink
              href="/ops/audit"
              analyticsLabel="ops_access_to_audit"
              analyticsSurface="ops_access_links"
              analyticsDestinationType="ops_audit"
            >
              <span>سجل المراجعة</span>
              <span>Audit</span>
            </TrackedLink>
          </div>
        </aside>
      </section>
    </div>
  );
}
