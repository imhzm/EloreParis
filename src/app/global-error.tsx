"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./fallback.module.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className={styles.page}>
          <div className={styles.card}>
            <p className={styles.eyebrow}>Unexpected runtime issue</p>
            <h1 className={styles.title}>حدث خطأ غير متوقع داخل الواجهة الحالية.</h1>
            <p className={styles.summary}>
              تم إيقاف هذه الشاشة بدل عرض حالة مكسورة. يمكنك إعادة المحاولة مباشرة، أو
              الرجوع إلى الصفحة الرئيسية ومسار الثقة إذا استمرت المشكلة.
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.button}
                onClick={() => reset()}
              >
                إعادة المحاولة
              </button>
              <Link href="/ar" className={styles.secondaryAction}>
                العودة إلى الرئيسية
              </Link>
              <Link href="/ar/trust" className={styles.secondaryAction}>
                مركز الثقة
              </Link>
            </div>

            <div className={styles.layout}>
              <div>
                <p className={styles.meta}>ماذا يعني هذا؟</p>
                <ul className={styles.list}>
                  <li>هذه شاشة حماية عامة لأي خطأ runtime غير متوقع.</li>
                  <li>لا يتم عرض تفاصيل حساسة للمستخدم داخل الواجهة العامة.</li>
                  <li>وجودها يقلل احتمال بقاء الزائر على شاشة مكسورة أثناء الإطلاق.</li>
                </ul>
              </div>

              <div className={styles.metaList}>
                <div className={styles.metaCard}>
                  <p className={styles.meta}>Digest</p>
                  <strong className={styles.metaValue}>
                    {error.digest ?? "not-provided"}
                  </strong>
                  <p>هذا المعرّف مفيد عند ربط logging ومراقبة أعطال الإنتاج لاحقًا.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
