import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  getTrustPolicyBySlug,
  trustPolicies,
} from "@/lib/site-content";
import styles from "../trust-detail.module.css";

type TrustPolicyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return trustPolicies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: TrustPolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = getTrustPolicyBySlug(slug);

  if (!policy) {
    return {};
  }

  return {
    title: `${policy.title} | الثقة والسياسات`,
    description: policy.summary,
    alternates: {
      canonical: `/trust/${policy.slug}`,
    },
  };
}

export default async function TrustPolicyPage({ params }: TrustPolicyPageProps) {
  const { slug } = await params;
  const policy = getTrustPolicyBySlug(slug);

  if (!policy) {
    notFound();
  }

  const siblingPolicies = trustPolicies.filter((entry) => entry.slug !== policy.slug);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: policy.title,
        description: policy.summary,
        inLanguage: "ar-SA",
        url: absoluteUrl(`/trust/${policy.slug}`),
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
          {
            "@type": "ListItem",
            position: 3,
            name: policy.title,
            item: absoluteUrl(`/trust/${policy.slug}`),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: policy.faq.map((item) => ({
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
      <StorefrontShell activeHref="/trust">
        <div className={styles.page}>
          <section className={styles.hero}>
            <article className={styles.heroPanel}>
              <p className={styles.eyebrow}>Trust policy</p>
              <h1>{policy.title}</h1>
              <p className={styles.summary}>{policy.summary}</p>
            </article>

            <aside className={styles.statusCard}>
              <p className={styles.eyebrow}>Publication note</p>
              <h2>صياغة جاهزة للنشر بعد اعتماد البيانات الفعلية</h2>
              <ul className={styles.statusList}>
                <li>لا تُنشر أي بيانات نظامية أو تشغيلية غير معتمدة.</li>
                <li>تتطابق هذه الصفحة مع ما يظهر في الفوتر ونقاط الشراء.</li>
                <li>التحديثات النهائية يجب أن تعتمد على نشاط حقيقي لا على افتراضات تصميمية.</li>
              </ul>
            </aside>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.eyebrow}>Policy summary</p>
                <h2>المبادئ الأساسية لهذه الصفحة</h2>
                <p className={styles.bodyCopy}>{policy.body}</p>
                <ul className={styles.pointList}>
                  {policy.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.eyebrow}>What this policy covers</p>
                <h2>كيف تُترجم الثقة إلى محتوى وتشغيل واضح</h2>
                <div className={styles.sectionList}>
                  {policy.sections.map((section) => (
                    <section key={section.heading} className={styles.sectionBlock}>
                      <h3>{section.heading}</h3>
                      <p>{section.body}</p>
                    </section>
                  ))}
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.linkCard}>
                <p className={styles.eyebrow}>Policy navigation</p>
                <h2>روابط تساعد على مراجعة الثقة كاملة</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/trust"
                    analyticsLabel={`trust_policy_hub_${policy.slug}`}
                    analyticsSurface="trust_policy_sidebar"
                    analyticsDestinationType="trust"
                  >
                    <span>العودة إلى مركز الثقة</span>
                    <span>المركز الرئيسي</span>
                  </TrackedLink>
                  {siblingPolicies.map((item) => (
                    <TrackedLink
                      key={item.slug}
                      href={`/trust/${item.slug}`}
                      analyticsLabel={`trust_policy_related_${policy.slug}_${item.slug}`}
                      analyticsSurface="trust_policy_sidebar"
                      analyticsDestinationType="trust_policy"
                    >
                      <span>{item.title}</span>
                      <span>سياسة مرتبطة</span>
                    </TrackedLink>
                  ))}
                </div>
              </article>

              <article className={styles.linkCard}>
                <p className={styles.eyebrow}>Commerce bridge</p>
                <h2>ربط الثقة بمسار الشراء</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/shop/skincare"
                    analyticsLabel={`trust_policy_to_collection_${policy.slug}`}
                    analyticsSurface="trust_policy_sidebar"
                    analyticsDestinationType="collection"
                  >
                    <span>العودة إلى صفحات الاكتشاف الشرائي</span>
                    <span>فئة العناية بالبشرة</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/journal"
                    analyticsLabel={`trust_policy_to_journal_${policy.slug}`}
                    analyticsSurface="trust_policy_sidebar"
                    analyticsDestinationType="journal_index"
                  >
                    <span>استعراض المجلة التحريرية</span>
                    <span>محتوى يدعم القرار</span>
                  </TrackedLink>
                </div>
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2>أسئلة متوقعة قبل اعتماد الصياغة النهائية</h2>
            <div className={styles.faqList}>
              {policy.faq.map((item) => (
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
