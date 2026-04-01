import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl } from "@/lib/site-content";
import {
  termsFaq,
  termsPrinciples,
  termsSections,
} from "@/lib/support-content";
import styles from "../trust/trust-detail.module.css";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description:
    "صفحة شروط وأحكام قابلة للقراءة تربط بين استخدام الواجهة، الشراء، والسياسات المرجعية دون ادعاء اعتماد قانوني نهائي قبل المراجعة.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "الشروط والأحكام",
        description:
          "صفحة توضح الإطار العام لاستخدام واجهة Cozmateks والشراء عبرها بلغة مفهومة وقابلة للربط مع سياسات الثقة.",
        inLanguage: "ar-SA",
        url: absoluteUrl("/terms"),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "الرئيسية",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "الشروط والأحكام",
            item: absoluteUrl("/terms"),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: termsFaq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StorefrontShell activeHref="/terms">
        <div className={styles.page}>
          <section className={styles.hero}>
            <article className={styles.heroPanel}>
              <p className={styles.eyebrow}>Terms</p>
              <h1>الشروط الجيدة يجب أن تُفهم بسهولة قبل أن تُعتمد قانونيًا</h1>
              <p className={styles.summary}>
                هذه الصفحة تضع إطارًا مهنيًا قابلًا للنشر والربط داخل الواجهة، مع
                الحفاظ على الصدق: أي اعتماد قانوني نهائي أو بيانات منشأة فعلية ما
                زال يحتاج مراجعة واعتمادًا قبل الإطلاق.
              </p>
            </article>

            <aside className={styles.statusCard}>
              <p className={styles.eyebrow}>Publication note</p>
              <h2>صفحة جاهزة معماريًا لكنها لا تستبدل المراجعة القانونية النهائية</h2>
              <ul className={styles.statusList}>
                {termsPrinciples.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.eyebrow}>Terms sections</p>
                <h2>الأقسام الأساسية التي يجب أن يراها المستخدم قبل الاعتماد النهائي</h2>
                <div className={styles.sectionList}>
                  {termsSections.map((section) => (
                    <section
                      key={section.heading}
                      className={styles.sectionBlock}
                    >
                      <h3>{section.heading}</h3>
                      <p>{section.body}</p>
                    </section>
                  ))}
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.linkCard}>
                <p className={styles.eyebrow}>Reference pages</p>
                <h2>الصفحات التي يجب أن تبقى متسقة مع الشروط</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/trust/privacy"
                    analyticsLabel="terms_to_privacy"
                    analyticsSurface="terms_sidebar"
                    analyticsDestinationType="trust_policy"
                  >
                    <span>سياسة الخصوصية</span>
                    <span>لنطاق البيانات والموافقات</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/trust/shipping"
                    analyticsLabel="terms_to_shipping"
                    analyticsSurface="terms_sidebar"
                    analyticsDestinationType="trust_policy"
                  >
                    <span>سياسة الشحن والتوصيل</span>
                    <span>للرسوم والنوافذ التشغيلية</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/trust/returns"
                    analyticsLabel="terms_to_returns"
                    analyticsSurface="terms_sidebar"
                    analyticsDestinationType="trust_policy"
                  >
                    <span>سياسة الاستبدال والاسترجاع</span>
                    <span>للشروط والاستثناءات بعد الشراء</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/contact"
                    analyticsLabel="terms_to_contact"
                    analyticsSurface="terms_sidebar"
                    analyticsDestinationType="contact"
                  >
                    <span>تواصل معنا</span>
                    <span>عند وجود استفسار لا تغطيه الصفحات المرجعية</span>
                  </TrackedLink>
                </div>
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>Terms FAQ</p>
            <h2>أسئلة متكررة حول صفحة الشروط وحدود اعتمادها الحالي</h2>
            <div className={styles.faqList}>
              {termsFaq.map((item) => (
                <article key={item.question} className={styles.faqItem}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
