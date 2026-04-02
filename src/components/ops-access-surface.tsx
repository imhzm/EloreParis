"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TrackedLink } from "@/components/tracked-link";
import type { OpsAccessMode } from "@/lib/ops-types";
import styles from "./order-flow.module.css";

type OpsAccessSurfaceProps = {
  accessMode: OpsAccessMode;
  deniedPath?: string;
  nextPath: string;
};

export function OpsAccessSurface({
  accessMode,
  deniedPath,
  nextPath,
}: OpsAccessSurfaceProps) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (accessMode !== "protected") {
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/ops-access/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessCode,
          nextPath,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(
          payload.error ??
            "تعذر التحقق من رمز الوصول التشغيلي في هذه اللحظة.",
        );
        return;
      }

      startTransition(() => {
        router.push(payload.redirectTo ?? nextPath);
        router.refresh();
      });
    } catch {
      setError(
        "تعذر الوصول إلى بوابة التحقق الداخلية الآن. أعيدي المحاولة بعد لحظات.",
      );
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Ops access gate</p>
          <h1>دخول داخلي مضبوط إلى أسطح التشغيل بدل تركها مكشوفة على المسارات العامة.</h1>
          <p className={styles.summary}>
            هذه الصفحة تفصل بين storefront العام وطبقة `/ops` الداخلية. الهدف ليس بناء auth
            نهائي، بل فرض boundary صريحة على dashboard والطلبات والكتالوج والـ fulfillment
            قبل ربط backoffice حقيقي.
          </p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>Protected routes</p>
            <strong>/ops/*</strong>
            <span>
              يغطي هذا gate حاليًا: dashboard, orders, catalog, وfulfillment.
            </span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Next destination</p>
            <h2>{nextPath}</h2>
            <p>
              بعد السماح بالدخول سيتم تحويلك مباشرة إلى هذا المسار بدل بدء session عائمة بلا
              سياق.
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
                  الجلسة الحالية لا تملك صلاحية الدخول إلى `{deniedPath}`. استخدم
                  رمزًا مناسبًا للدور المطلوب أو ارجع إلى المسار الداخلي المسموح.
                </div>
              ) : null}

              <p>
                الحماية مفعلة الآن. أدخل رمز الوصول الداخلي لمتابعة العمل على الأسطح التشغيلية.
              </p>

              <form className={styles.summaryList} onSubmit={handleSubmit}>
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

                {error ? <div className={styles.inlineError}>{error}</div> : null}

                <div className={styles.actionColumn}>
                  <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "جارٍ التحقق..." : "الدخول إلى ops"}
                  </button>
                </div>
              </form>
            </>
          ) : accessMode === "setup_required" ? (
            <>
              <div className={styles.inlineError}>
                الحماية مفعلة، لكن `OPS_ACCESS_USERS_JSON` أو `OPS_ACCESS_CODE`
                غير مضبوط بعد في البيئة الحالية. لذلك بقيت أسطح `/ops` مغلقة
                افتراضيًا بدل السماح بدخول غير محمي.
              </div>
              <p>
                أضف مجموعة مستخدمين داخل `OPS_ACCESS_USERS_JSON` أو فعّل fallback
                البسيط عبر `OPS_ACCESS_CODE`، ثم أعد التشغيل أو أعد النشر حتى تصبح
                البوابة قابلة للاستخدام.
              </p>
            </>
          ) : (
            <>
              <div className={styles.inlineNotice}>
                بيئة التطوير الحالية تعمل بوضع open local rehearsal. أسطح `/ops` متاحة محليًا
                لتسريع البناء، بينما الحماية تصبح فعلية عند تفعيل `ENFORCE_OPS_ACCESS=true` أو
                عند التشغيل الإنتاجي.
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
              أسطح `/ops` أصبحت داخلية صراحة، وليست امتدادًا عامًا للـ storefront.
            </div>
            <div className={styles.infoBullet}>
              الـ transactional MVP الحالي يظل متمركزًا حول `skincare` و`makeup`، بينما
              المجموعات الأخرى تبقى IA/SEO surfaces حتى يُحسم catalog authority الحقيقي.
            </div>
            <div className={styles.infoBullet}>
              هذا gate ليس بديلًا عن auth/accounts لاحقًا، لكنه يمنع بقاء surfaces التشغيلية
              مكشوفة قبل backend ownership الفعلية.
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
