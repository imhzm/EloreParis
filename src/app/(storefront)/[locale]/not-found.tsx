import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import styles from "../../fallback.module.css";

export default function NotFound() {
  return (
    <StorefrontShell activeHref="/">
      <section className={styles.page}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>404 | Not Found</p>
          <h1 className={styles.title}>الصفحة المطلوبة غير موجودة داخل المسار الحالي.</h1>
          <p className={styles.summary}>
            قد يكون الرابط قديمًا، أو تم نقله داخل بنية الاكتشاف الجديدة، أو أنك وصلت
            إلى مسار غير متاح في هذه النسخة. الأفضل هنا هو الرجوع إلى مسار واضح بدل
            البقاء في صفحة ميتة.
          </p>

          <div className={styles.actions}>
            <TrackedLink
              href="/"
              className={styles.primaryAction}
              analyticsLabel="not_found_to_home"
              analyticsSurface="not_found"
              analyticsDestinationType="home"
            >
              العودة إلى الرئيسية
            </TrackedLink>
            <TrackedLink
              href="/search"
              className={styles.secondaryAction}
              analyticsLabel="not_found_to_search"
              analyticsSurface="not_found"
              analyticsDestinationType="search"
            >
              البحث داخل المتجر
            </TrackedLink>
            <TrackedLink
              href="/trust"
              className={styles.secondaryAction}
              analyticsLabel="not_found_to_trust"
              analyticsSurface="not_found"
              analyticsDestinationType="trust"
            >
              مركز الثقة
            </TrackedLink>
          </div>

          <div className={styles.layout}>
            <div>
              <p className={styles.meta}>اقتراحات سريعة</p>
              <ul className={styles.list}>
                <li>راجعي مسارات العناية بالبشرة أو المكياج من التنقل الرئيسي.</li>
                <li>استخدمي صفحة البحث إذا كنت تبحثين عن منتج أو مكوّن بعينه.</li>
                <li>ارجعي إلى مركز الثقة إذا كان الرابط متعلقًا بالشحن أو السياسات.</li>
              </ul>
            </div>

            <div className={styles.metaList}>
              <div className={styles.metaCard}>
                <p className={styles.meta}>Fallback quality</p>
                <strong className={styles.metaValue}>لا صفحات ميتة بلا توجيه</strong>
                <p>تم تخصيص 404 لتبقى متسقة مع الهوية والربط الداخلي بدل fallback افتراضي.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
