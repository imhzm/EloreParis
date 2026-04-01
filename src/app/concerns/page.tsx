import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  collectionDirectory,
  concerns,
  getProductsBySlugs,
  journalArticles,
} from "@/lib/site-content";
import styles from "../discovery-page.module.css";

export const metadata: Metadata = {
  title: "حسب المشكلة",
  description:
    "دليل الاكتشاف حسب المشكلة في Cozmateks: صفحات تجارية وتحريرية تربط بين المشكلة، الروتين، والمحتوى والمنتجات المناسبة.",
  alternates: {
    canonical: "/concerns",
  },
};

export default function ConcernsHubPage() {
  const concernGroups = Object.entries(collectionDirectory).map(
    ([collectionSlug, collection]) => ({
      collectionSlug,
      collection,
      items: concerns.filter((concern) => concern.collection === collectionSlug),
    }),
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "حسب المشكلة",
        description:
          "Hub تجاري يربط بين المشاكل الشائعة في العناية والمكياج وبين الروتينات والمنتجات والمقالات المرتبطة بها.",
        url: absoluteUrl("/concerns"),
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
            name: "حسب المشكلة",
            item: absoluteUrl("/concerns"),
          },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: concerns.map((concern, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/concerns/${concern.slug}`),
          name: concern.title,
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
      <StorefrontShell activeHref="/concerns">
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Concern-led discovery</p>
              <h1>اكتشفي المسار الصحيح من المشكلة إلى الروتين والمنتج.</h1>
              <p className={styles.summary}>
                هذا السطح يجمع المشاكل الأكثر أهمية داخل العناية والمكياج، ثم
                يحولها إلى صفحات قرار حقيقية تربط بين النية الشرائية والشرح
                والمحتوى والمنتجات ذات الصلة.
              </p>

              <div className={styles.actionRow}>
                <TrackedLink
                  className={styles.primaryLink}
                  href="/shop/skincare"
                  analyticsLabel="concerns_hub_to_skincare"
                  analyticsSurface="concerns_hub_hero"
                  analyticsDestinationType="collection"
                >
                  البدء من العناية بالبشرة
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryLink}
                  href="/shop/makeup"
                  analyticsLabel="concerns_hub_to_makeup"
                  analyticsSurface="concerns_hub_hero"
                  analyticsDestinationType="collection"
                >
                  استعراض مشاكل المكياج
                </TrackedLink>
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Discovery logic</p>
                <div className={styles.metricList}>
                  <div className={styles.statRow}>
                    <strong>{concerns.length} صفحات مشكلة</strong>
                    <span>نقطة دخول تجارية تبدأ من السؤال لا من اسم المنتج.</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>Skincare + Makeup</strong>
                    <span>نفس البنية تعمل عبر الفئات بدل تكرار تجربة مختلفة لكل surface.</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>روتين + محتوى + منتج</strong>
                    <span>كل مشكلة تقود إلى شبكة قرار مترابطة بدل صفحة هبوط معزولة.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              {concernGroups.map(({ collectionSlug, collection, items }) => (
                <article key={collectionSlug} className={styles.sectionCard}>
                  <p className={styles.sectionTitle}>{collection.subtitle}</p>
                  <h2>{collection.title}</h2>
                  <div className={styles.cardGrid}>
                    {items.map((concern) => {
                      const relatedProducts = getProductsBySlugs(concern.products);
                      const relatedArticles = journalArticles.filter(
                        (article) =>
                          article.relatedConcern === `/concerns/${concern.slug}`,
                      );

                      return (
                        <article key={concern.slug} className={styles.relatedCard}>
                          <p className={styles.eyebrow}>{concern.subtitle}</p>
                          <h3>{concern.title}</h3>
                          <p>{concern.answer}</p>
                          <div className={styles.metaGrid}>
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
                            href={`/concerns/${concern.slug}`}
                            analyticsLabel={`concerns_hub_${concern.slug}`}
                            analyticsSurface="concerns_hub_cards"
                            analyticsDestinationType="concern"
                          >
                            استعراض صفحة المشكلة
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
                <h2>لماذا هذه الصفحة مهمة في الخطة؟</h2>
                <ul className={styles.list}>
                  <li>تحول نية البحث من سؤال عام إلى قرار شراء أوضح.</li>
                  <li>ترفع جودة الربط الداخلي بين الفئات والروتينات والمقالات والمنتجات.</li>
                  <li>تدعم صفحات SEO التجارية من دون إنشاء صفحات ضعيفة أو مكررة.</li>
                </ul>
              </article>

              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Next paths</p>
                <h2>أسطح مرتبطة</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/routines"
                    analyticsLabel="concerns_hub_to_routines"
                    analyticsSurface="concerns_hub_sidebar"
                    analyticsDestinationType="routine_index"
                  >
                    <span>الانتقال إلى Hub الروتينات</span>
                    <span>Routine-led</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/journal"
                    analyticsLabel="concerns_hub_to_journal"
                    analyticsSurface="concerns_hub_sidebar"
                    analyticsDestinationType="journal_index"
                  >
                    <span>استعراض المجلة</span>
                    <span>Editorial support</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/ingredients"
                    analyticsLabel="concerns_hub_to_ingredients"
                    analyticsSurface="concerns_hub_sidebar"
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
