import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl, trustPolicies } from "@/lib/site-content";
import { supportRouteLinks } from "@/lib/support-content";
import styles from "./trust.module.css";

export const metadata: Metadata = {
  title: "الثقة والسياسات",
  description:
    "مركز الثقة والسياسات لمتجر Cozmateks: بيانات المنشأة، الخصوصية، الشحن، الاسترجاع، والأصالة بصياغة واضحة ومهيكلة.",
  alternates: {
    canonical: "/trust",
  },
};

export default function TrustPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "مركز الثقة والسياسات",
        url: absoluteUrl("/trust"),
      },
      {
        "@type": "Organization",
        name: "Cozmateks",
        url: absoluteUrl("/"),
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
            name: "الثقة",
            item: absoluteUrl("/trust"),
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
      <StorefrontShell activeHref="/trust">
        <div className={styles.page}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Trust center</p>
            <h1>الثقة النظامية والتجارية جزء من التجربة، لا طبقة لاحقة.</h1>
            <p>
              هذا المركز يثبت كيف ستظهر بيانات المنشأة والسياسات ووضوح الشحن
              والاسترجاع داخل الواجهة العامة. الأرقام الرسمية نفسها لا تُدرج هنا
              إلا بعد اعتمادها من النشاط الفعلي.
            </p>
          </section>

          <section className={styles.notice}>
            <p className={styles.eyebrow}>Operational note</p>
            <h2>محتوى احترافي، لكن دون اختلاق بيانات نظامية</h2>
            <p>
              لأن المشروع ما زال في التأسيس، فهذه الصفحة تضع الهيكل وصياغة
              الظهور المهني الصحيح، مع الحفاظ على الصراحة الكاملة في أي معلومة
              تتطلب بيانات منشأة حقيقية قبل الإطلاق.
            </p>
            <TrackedLink
              href="/shop/skincare"
              analyticsLabel="trust_back_to_collection"
              analyticsSurface="trust_notice"
              analyticsDestinationType="collection"
            >
              العودة إلى صفحات الاكتشاف الشرائي
            </TrackedLink>
          </section>

          <section className={styles.grid}>
            {trustPolicies.map((policy) => (
              <TrackedLink
                key={policy.slug}
                href={`/trust/${policy.slug}`}
                className={`${styles.sectionCard} ${styles.sectionCardLink}`}
                analyticsLabel={`trust_policy_${policy.slug}`}
                analyticsSurface="trust_grid"
                analyticsDestinationType="trust_policy"
              >
                <p className={styles.eyebrow}>Policy layer</p>
                <h2>{policy.title}</h2>
                <p>{policy.body}</p>
                <ul>
                  {policy.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <span className={styles.sectionCardAction}>
                  استعراض السياسة كاملة
                </span>
              </TrackedLink>
            ))}
          </section>

          <section className={styles.grid}>
            {supportRouteLinks.map((entry) => (
              <TrackedLink
                key={entry.href}
                href={entry.href}
                className={`${styles.sectionCard} ${styles.sectionCardLink}`}
                analyticsLabel={`trust_support_${entry.href.replace("/", "")}`}
                analyticsSurface="trust_support_grid"
                analyticsDestinationType={entry.destinationType}
              >
                <p className={styles.eyebrow}>Support surface</p>
                <h2>{entry.label}</h2>
                <p>{entry.description}</p>
                <span className={styles.sectionCardAction}>الانتقال إلى الصفحة</span>
              </TrackedLink>
            ))}
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
