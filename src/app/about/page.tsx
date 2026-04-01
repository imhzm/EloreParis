import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl } from "@/lib/site-content";
import {
  aboutFaq,
  aboutHighlights,
  aboutSections,
} from "@/lib/support-content";
import styles from "../trust/trust-detail.module.css";

export const metadata: Metadata = {
  title: "من نحن",
  description:
    "صفحة تعريف توضح منهج Cozmateks كبيت جمال سعودي مختار بعناية، وكيف تُترجم الهوية التحريرية والتجارية إلى تجربة شراء موثوقة.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        name: "من نحن",
        description:
          "صفحة تعريف تشرح منهج Cozmateks في الاختيار والتحرير وبناء الثقة داخل تجربة شراء عربية موجهة للسوق السعودي.",
        inLanguage: "ar-SA",
        url: absoluteUrl("/about"),
      },
      {
        "@type": "Organization",
        name: "Cozmateks",
        url: absoluteUrl("/"),
        description:
          "بيت جمال سعودي مختار بعناية يربط بين الاكتشاف، المحتوى، والثقة التشغيلية داخل واجهة شراء عربية واضحة.",
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
            name: "من نحن",
            item: absoluteUrl("/about"),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: aboutFaq.map((item) => ({
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
      <StorefrontShell activeHref="/about">
        <div className={styles.page}>
          <section className={styles.hero}>
            <article className={styles.heroPanel}>
              <p className={styles.eyebrow}>About Cozmateks</p>
              <h1>منهج الاختيار والتحرير مهم بقدر أهمية المنتج نفسه</h1>
              <p className={styles.summary}>
                هذه الصفحة لا تحاول تجميل الهوية عبر شعارات عامة، بل توضح لماذا
                بُنيت الواجهة على الاكتشاف الموجه والثقة التشغيلية والمحتوى العربي
                القابل للفهم قبل الشراء وبعده.
              </p>
            </article>

            <aside className={styles.statusCard}>
              <p className={styles.eyebrow}>Identity signals</p>
              <h2>المبادئ التي تجعل التجربة مختلفة عن متجر تجميل تقليدي</h2>
              <ul className={styles.statusList}>
                {aboutHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.eyebrow}>Operating model</p>
                <h2>كيف تُترجم الرؤية إلى صفحات شراء وثقة قابلة للاستخدام؟</h2>
                <div className={styles.sectionList}>
                  {aboutSections.map((section) => (
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
                <p className={styles.eyebrow}>Related routes</p>
                <h2>صفحات تكمل الصورة من زاوية الثقة والدعم والاكتشاف</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/trust"
                    analyticsLabel="about_to_trust"
                    analyticsSurface="about_sidebar"
                    analyticsDestinationType="trust"
                  >
                    <span>مركز الثقة والسياسات</span>
                    <span>للسياسات والبيانات المرجعية</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/terms"
                    analyticsLabel="about_to_terms"
                    analyticsSurface="about_sidebar"
                    analyticsDestinationType="terms"
                  >
                    <span>الشروط والأحكام</span>
                    <span>للإطار القانوني القابل للقراءة</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/contact"
                    analyticsLabel="about_to_contact"
                    analyticsSurface="about_sidebar"
                    analyticsDestinationType="contact"
                  >
                    <span>تواصل معنا</span>
                    <span>عندما تحتاج الحالة إلى متابعة بشرية</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/shop/skincare"
                    analyticsLabel="about_to_skincare"
                    analyticsSurface="about_sidebar"
                    analyticsDestinationType="collection"
                  >
                    <span>بدء الاكتشاف الشرائي</span>
                    <span>للعودة إلى تجربة الفئة والمسارات الشرائية</span>
                  </TrackedLink>
                </div>
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>About FAQ</p>
            <h2>أسئلة متكررة حول الهوية والمنهج وحدود النشر الحالي</h2>
            <div className={styles.faqList}>
              {aboutFaq.map((item) => (
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
