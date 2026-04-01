import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl } from "@/lib/site-content";
import { faqCollections, faqPrinciples } from "@/lib/support-content";
import styles from "../trust/trust-detail.module.css";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description:
    "إجابات واضحة على الأسئلة الأكثر تكرارًا حول الطلب، الشحن، السياسات، والخصوصية داخل متجر Cozmateks.",
  alternates: {
    canonical: "/faq",
  },
};

export default function FaqPage() {
  const flatQuestions = faqCollections.flatMap((group) => group.items);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        name: "الأسئلة الشائعة",
        inLanguage: "ar-SA",
        url: absoluteUrl("/faq"),
        mainEntity: flatQuestions.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
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
            name: "الأسئلة الشائعة",
            item: absoluteUrl("/faq"),
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StorefrontShell activeHref="/faq">
        <div className={styles.page}>
          <section className={styles.hero}>
            <article className={styles.heroPanel}>
              <p className={styles.eyebrow}>FAQ</p>
              <h1>إجابات مباشرة تقلل الحيرة قبل أن تتحول إلى تواصل غير لازم</h1>
              <p className={styles.summary}>
                هذه الصفحة تجمع الأسئلة التي تتكرر غالبًا قبل الشراء وبعد تثبيت الطلب،
                بحيث تصبح صفحات السياسات والتتبع والاكتشاف جزءًا من الحل بدل أن تبقى منفصلة.
              </p>
            </article>

            <aside className={styles.statusCard}>
              <p className={styles.eyebrow}>FAQ principles</p>
              <h2>كيف تُبنى صفحة أسئلة شائعة مفيدة فعلًا</h2>
              <ul className={styles.statusList}>
                {faqPrinciples.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </aside>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.eyebrow}>FAQ clusters</p>
                <h2>الموضوعات الأساسية التي تحتاجها الزائرة قبل التصعيد إلى الدعم</h2>
                <div className={styles.sectionList}>
                  {faqCollections.map((group) => (
                    <section key={group.title} className={styles.sectionBlock}>
                      <h3>{group.title}</h3>
                      <ul className={styles.pointList}>
                        {group.items.map((item) => (
                          <li key={item.question}>{item.question}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.linkCard}>
                <p className={styles.eyebrow}>Useful routes</p>
                <h2>إذا كان السؤال محددًا، فهذه الصفحات قد تكون أسرع من الدعم</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/track-order"
                    analyticsLabel="faq_to_track_order"
                    analyticsSurface="faq_sidebar"
                    analyticsDestinationType="order_tracking"
                  >
                    <span>تتبع الطلب</span>
                    <span>للحالات المرتبطة بمرجع طلب قائم</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/trust/shipping"
                    analyticsLabel="faq_to_shipping_policy"
                    analyticsSurface="faq_sidebar"
                    analyticsDestinationType="trust_policy"
                  >
                    <span>سياسة الشحن والتوصيل</span>
                    <span>للرسوم والنوافذ المتوقعة</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/trust/returns"
                    analyticsLabel="faq_to_returns_policy"
                    analyticsSurface="faq_sidebar"
                    analyticsDestinationType="trust_policy"
                  >
                    <span>سياسة الاستبدال والاسترجاع</span>
                    <span>للشروط والاستثناءات</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/contact"
                    analyticsLabel="faq_to_contact"
                    analyticsSurface="faq_sidebar"
                    analyticsDestinationType="contact"
                  >
                    <span>تواصل معنا</span>
                    <span>عندما لا تكفي هذه الإجابات</span>
                  </TrackedLink>
                </div>
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>Questions and answers</p>
            <h2>الأسئلة الشائعة بصياغة قابلة للقراءة والاقتباس داخل الواجهة</h2>
            <div className={styles.faqList}>
              {flatQuestions.map((item) => (
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
