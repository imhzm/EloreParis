import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  collectionDirectory,
  getProductByHref,
  journalArticles,
  routines,
} from "@/lib/site-content";
import styles from "../discovery-page.module.css";

export const metadata: Metadata = {
  title: "الروتينات",
  description:
    "Hub الروتينات في Cozmateks: مسارات واضحة تربط الخطوات اليومية أو الموسمية بالمنتجات والمحتوى المناسبين.",
  alternates: {
    canonical: "/routines",
  },
};

export default function RoutinesHubPage() {
  const routineGroups = Object.entries(collectionDirectory).map(
    ([collectionSlug, collection]) => ({
      collectionSlug,
      collection,
      items: routines.filter((routine) => routine.collection === collectionSlug),
    }),
  ).filter(({ items }) => items.length);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "الروتينات",
        description:
          "Hub يربط بين الروتينات اليومية أو المناسبة وبين المنتجات والمقالات ومسارات الاكتشاف المرتبطة بها.",
        url: absoluteUrl("/routines"),
        inLanguage: "ar-SA",
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
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: routines.map((routine, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/routines/${routine.slug}`),
          name: routine.title,
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
      <StorefrontShell activeHref="/routines">
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Routine-led discovery</p>
              <h1>روتينات تبني القرار خطوة بخطوة بدل تكديس المنتجات.</h1>
              <p className={styles.summary}>
                هذا السطح يجمع الروتينات الأساسية في العناية والمكياج، ويحوّلها
                إلى مسارات شراء وتعلّم مفهومة: ما الخطوة، لماذا توجد، وأين
                تقودك بعد ذلك داخل التجربة.
              </p>

              <div className={styles.actionRow}>
                <TrackedLink
                  className={styles.primaryLink}
                  href="/shop/skincare"
                  analyticsLabel="routines_hub_to_skincare"
                  analyticsSurface="routines_hub_hero"
                  analyticsDestinationType="collection"
                >
                  اكتشفي روتينات العناية
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryLink}
                  href="/shop/makeup"
                  analyticsLabel="routines_hub_to_makeup"
                  analyticsSurface="routines_hub_hero"
                  analyticsDestinationType="collection"
                >
                  استعراض روتينات المكياج
                </TrackedLink>
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Routine layer</p>
                <div className={styles.metricList}>
                  <div className={styles.statRow}>
                    <strong>{routines.length} روتينات أساسية</strong>
                    <span>أسطح قابلة للتوسع بدل صفحات ثابتة غير مترابطة.</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>Decision-first structure</strong>
                    <span>كل روتين يشرح الترتيب والدور قبل أن يقود إلى المنتج.</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>Editorial support</strong>
                    <span>المقال والروتين يعملان معًا بدل تكرار المحتوى بصيغ مختلفة.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              {routineGroups.map(({ collectionSlug, collection, items }) => (
                <article key={collectionSlug} className={styles.sectionCard}>
                  <p className={styles.sectionTitle}>{collection.subtitle}</p>
                  <h2>{collection.title}</h2>
                  <div className={styles.cardGrid}>
                    {items.map((routine) => {
                      const linkedProducts = [
                        ...routine.steps.map((step) =>
                          step.href ? getProductByHref(step.href) : undefined,
                        ),
                        ...routine.pairings.map((pairing) =>
                          getProductByHref(pairing.href),
                        ),
                      ].filter(
                        (
                          product,
                        ): product is NonNullable<
                          ReturnType<typeof getProductByHref>
                        > => Boolean(product),
                      );

                      const relatedProducts = Array.from(
                        new Map(
                          linkedProducts.map((product) => [product.slug, product]),
                        ).values(),
                      );

                      const relatedArticles = journalArticles.filter(
                        (article) =>
                          article.relatedRoutine === `/routines/${routine.slug}`,
                      );

                      return (
                        <article key={routine.slug} className={styles.relatedCard}>
                          <p className={styles.eyebrow}>{routine.subtitle}</p>
                          <h3>{routine.title}</h3>
                          <p>{routine.summary}</p>
                          <div className={styles.metaGrid}>
                            <div className={styles.metaItem}>
                              <strong>خطوات</strong>
                              <span className={styles.metaValue}>
                                {routine.steps.length}
                              </span>
                            </div>
                            <div className={styles.metaItem}>
                              <strong>منتجات مرتبطة</strong>
                              <span className={styles.metaValue}>
                                {relatedProducts.length}
                              </span>
                            </div>
                            <div className={styles.metaItem}>
                              <strong>مقالات داعمة</strong>
                              <span className={styles.metaValue}>
                                {relatedArticles.length}
                              </span>
                            </div>
                          </div>
                          <TrackedLink
                            className={styles.stepLink}
                            href={`/routines/${routine.slug}`}
                            analyticsLabel={`routines_hub_${routine.slug}`}
                            analyticsSurface="routines_hub_cards"
                            analyticsDestinationType="routine"
                          >
                            استعراض صفحة الروتين
                          </TrackedLink>
                        </article>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Why this hub matters</p>
                <h2>لماذا هذا السطح مهم في MVP؟</h2>
                <ul className={styles.list}>
                  <li>يسهّل الانتقال من المقال أو المشكلة إلى خطوات شراء واضحة.</li>
                  <li>يدعم نيات بحث قوية مثل الروتين الصباحي وروتين المناسبات.</li>
                  <li>يرفع قيمة السلة بطريقة منطقية عبر pairings وcross-sell مفسّر.</li>
                </ul>
              </article>

              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Next paths</p>
                <h2>أسطح مرتبطة</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/concerns"
                    analyticsLabel="routines_hub_to_concerns"
                    analyticsSurface="routines_hub_sidebar"
                    analyticsDestinationType="concern_index"
                  >
                    <span>الانتقال إلى Hub المشاكل</span>
                    <span>Concern-led</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/journal"
                    analyticsLabel="routines_hub_to_journal"
                    analyticsSurface="routines_hub_sidebar"
                    analyticsDestinationType="journal_index"
                  >
                    <span>استعراض المجلة</span>
                    <span>Editorial support</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/ingredients"
                    analyticsLabel="routines_hub_to_ingredients"
                    analyticsSurface="routines_hub_sidebar"
                    analyticsDestinationType="ingredient_index"
                  >
                    <span>Hub المكوّنات</span>
                    <span>Ingredient-led</span>
                  </TrackedLink>
                </div>
              </article>
            </aside>
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
