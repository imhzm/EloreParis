import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  collectionDirectory,
  getProductByHref,
  getRoutineBySlug,
  journalArticles,
  routines,
} from "@/lib/site-content";
import styles from "../../discovery-page.module.css";

type RoutinePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return routines.map((routine) => ({ slug: routine.slug }));
}

export async function generateMetadata({
  params,
}: RoutinePageProps): Promise<Metadata> {
  const { slug } = await params;
  const routine = getRoutineBySlug(slug);

  if (!routine) {
    return {};
  }

  return {
    title: `${routine.title} | الروتينات`,
    description: routine.summary,
    alternates: {
      canonical: `/routines/${routine.slug}`,
    },
  };
}

export default async function RoutinePage({ params }: RoutinePageProps) {
  const { slug } = await params;
  const routine = getRoutineBySlug(slug);

  if (!routine) {
    notFound();
  }

  const relatedArticles = journalArticles.filter(
    (article) => article.relatedRoutine === `/routines/${routine.slug}`,
  );
  const collectionEntry = collectionDirectory[routine.collection];

  const linkedProducts = [
    ...routine.steps.map((step) => (step.href ? getProductByHref(step.href) : undefined)),
    ...routine.pairings.map((item) => getProductByHref(item.href)),
  ].filter(
    (
      product,
    ): product is NonNullable<ReturnType<typeof getProductByHref>> => Boolean(product),
  );

  const relatedProducts = Array.from(
    new Map(linkedProducts.map((product) => [product.slug, product])).values(),
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: routine.title,
        description: routine.summary,
        url: absoluteUrl(`/routines/${routine.slug}`),
        inLanguage: "ar-SA",
        step: routine.steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.label,
          text: step.description,
          url: step.href ? absoluteUrl(step.href) : undefined,
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
            name: "الروتينات",
            item: absoluteUrl("/routines"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: routine.title,
            item: absoluteUrl(`/routines/${routine.slug}`),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: routine.faqs.map((item) => ({
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
      <StorefrontShell activeHref={collectionEntry.href}>
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>{routine.subtitle}</p>
              <h1>{routine.title}</h1>
              <p className={styles.summary}>{routine.summary}</p>

              <div className={styles.chipList}>
                {routine.audience.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>

              <div className={styles.actionRow}>
                <TrackedLink
                  className={styles.primaryLink}
                  href="/routines"
                  analyticsLabel={`routine_back_to_hub_${routine.slug}`}
                  analyticsSurface="routine_hero"
                  analyticsDestinationType="routine_index"
                >
                  العودة إلى جميع الروتينات
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryLink}
                  href={collectionEntry.href}
                  analyticsLabel={`routine_back_to_collection_${routine.slug}`}
                  analyticsSurface="routine_hero"
                  analyticsDestinationType="collection"
                >
                  {`العودة إلى ${collectionEntry.title}`}
                </TrackedLink>
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Routine logic</p>
                <div className={styles.metricList}>
                  <div className={styles.statRow}>
                    <strong>{routine.steps.length} خطوات واضحة</strong>
                    <span>تسلسل مفهوم بدل تكديس المنتجات</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>{relatedProducts.length} منتجات قابلة للربط</strong>
                    <span>رفع AOV عبر Routine مفهوم لا cross-sell عشوائي</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>{relatedArticles.length} مقالات مساندة</strong>
                    <span>محتوى يشرح السياق ويقوي الاكتشاف</span>
                  </div>
                </div>
              </div>

              <div className={styles.asideCard}>
                <p className={styles.eyebrow}>Audience</p>
                <h2>لمن هذا الروتين؟</h2>
                <ul className={styles.list}>
                  {routine.audience.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Routine steps</p>
                <h2>خطوات مرتبة تقود من الشرح إلى المنتج</h2>
                <div className={styles.stepGrid}>
                  {routine.steps.map((step) => (
                    <article key={step.step} className={styles.stepCard}>
                      <span className={styles.stepNumber}>Step {step.step}</span>
                      <h3>{step.label}</h3>
                      <p>{step.description}</p>
                      {step.href ? (
                        <TrackedLink
                          className={styles.stepLink}
                          href={step.href}
                          analyticsLabel={`routine_step_${routine.slug}_${step.step}`}
                          analyticsSurface="routine_steps"
                          analyticsDestinationType="product"
                        >
                          الانتقال إلى المنتج المرتبط
                        </TrackedLink>
                      ) : null}
                    </article>
                  ))}
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Related products</p>
                <h2>منتجات تدخل الروتين بشكل منطقي</h2>
                <div className={styles.cardGrid}>
                  {relatedProducts.map((product) => (
                    <article key={product.slug} className={styles.relatedCard}>
                      <p className={styles.eyebrow}>{product.category}</p>
                      <h3>{product.name}</h3>
                      <p>{product.subtitle}</p>
                      <TrackedLink
                        className={styles.stepLink}
                        href={`/products/${product.slug}`}
                        analyticsLabel={`routine_product_${routine.slug}_${product.slug}`}
                        analyticsSurface="routine_products"
                        analyticsDestinationType="product"
                      >
                        استعراض صفحة المنتج
                      </TrackedLink>
                    </article>
                  ))}
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Editorial support</p>
                <h2>محتوى يشرح لماذا هذا الروتين مناسب</h2>
                <div className={styles.cardGrid}>
                  {relatedArticles.map((article) => (
                    <article key={article.slug} className={styles.relatedCard}>
                      <p className={styles.eyebrow}>{article.category}</p>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                      <TrackedLink
                        className={styles.stepLink}
                        href={`/journal/${article.slug}`}
                        analyticsLabel={`routine_article_${routine.slug}_${article.slug}`}
                        analyticsSurface="routine_editorial"
                        analyticsDestinationType="article"
                      >
                        قراءة المقال
                      </TrackedLink>
                    </article>
                  ))}
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Pairings</p>
                <h2>روابط داخلية تقوّي الاكتشاف</h2>
                <div className={styles.linkList}>
                  {routine.pairings.map((item) => (
                  <TrackedLink
                    key={item.href}
                    href={item.href}
                      analyticsLabel={`routine_pairing_${routine.slug}_${item.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                      analyticsSurface="routine_sidebar"
                    >
                      <span>{item.label}</span>
                      <span>Linked surface</span>
                    </TrackedLink>
                  ))}
                </div>
              </article>

              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Commerce note</p>
                <h2>لماذا صفحة الروتين مهمة؟</h2>
                <ul className={styles.list}>
                  <li>تجمع بين الشرح ورفع متوسط السلة في سياق مفهوم.</li>
                  <li>
                    تدعم نيات بحث قوية مثل &quot;روتين صباحي&quot; و&quot;روتين
                    للمبتدئات&quot;.
                  </li>
                  <li>تسهّل تحويل المقالات والـ PDP إلى شبكة قرار مترابطة.</li>
                </ul>
                <div className={styles.linkList}>
                  <TrackedLink
                    href={collectionEntry.href}
                    analyticsLabel={`routine_sidebar_collection_${routine.slug}`}
                    analyticsSurface="routine_sidebar"
                    analyticsDestinationType="collection"
                  >
                    <span>{`الانتقال إلى ${collectionEntry.title}`}</span>
                    <span>Collection</span>
                  </TrackedLink>
                </div>
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2>أسئلة شائعة قبل اختيار الروتين</h2>
            <div className={styles.faqList}>
              {routine.faqs.map((item) => (
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
