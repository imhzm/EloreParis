import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  collectionDirectory,
  getProductsBySlugs,
  ingredients,
  journalArticles,
} from "@/lib/site-content";
import styles from "../discovery-page.module.css";

export const metadata: Metadata = {
  title: "حسب المكوّن",
  description:
    "Hub لاكتشاف Cozmateks حسب المكوّن: صفحات تربط بين المكوّن، المشكلة، الروتين، المنتج، والمحتوى بدل ترك البحث عالقًا على الاسم فقط.",
  alternates: {
    canonical: "/ingredients",
  },
};

export default function IngredientsHubPage() {
  const ingredientGroups = Object.entries(collectionDirectory).map(
    ([collectionSlug, collection]) => ({
      collectionSlug,
      collection,
      items: ingredients.filter(
        (ingredient) => ingredient.collection === collectionSlug,
      ),
    }),
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "حسب المكوّن",
        description:
          "Hub اكتشاف يربط بين المكوّنات البارزة في Cozmateks وبين المنتجات والروتينات والمقالات ذات الصلة.",
        url: absoluteUrl("/ingredients"),
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
            name: "حسب المكوّن",
            item: absoluteUrl("/ingredients"),
          },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: ingredients.map((ingredient, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/ingredients/${ingredient.slug}`),
          name: ingredient.title,
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
      <StorefrontShell activeHref="/ingredients">
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Ingredient-led discovery</p>
              <h1>ابدئي من المكوّن عندما تكون نية البحث أوضح من اسم المنتج.</h1>
              <p className={styles.summary}>
                هذا السطح يحول المكوّن من كلمة بحث معزولة إلى مسار قرار حقيقي يربط
                بين المشكلة والروتين والمنتج والمحتوى، بحيث يصبح الاكتشاف أكثر
                وضوحًا وأقل تشتتًا.
              </p>

              <div className={styles.actionRow}>
                <TrackedLink
                  className={styles.primaryLink}
                  href="/search?q=فيتامين%20C"
                  analyticsLabel="ingredients_hub_to_search_vitamin_c"
                  analyticsSurface="ingredients_hub_hero"
                  analyticsDestinationType="search"
                >
                  البدء من بحث شائع
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryLink}
                  href="/concerns"
                  analyticsLabel="ingredients_hub_to_concerns"
                  analyticsSurface="ingredients_hub_hero"
                  analyticsDestinationType="concern_index"
                >
                  الانتقال إلى Hub المشاكل
                </TrackedLink>
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Ingredient layer</p>
                <div className={styles.metricList}>
                  <div className={styles.statRow}>
                    <strong>{ingredients.length} صفحات مكوّن</strong>
                    <span>نقاط دخول SEO وتجارية تبدأ من نية البحث نفسها.</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>Concern + routine + product</strong>
                    <span>كل مكوّن يقود إلى شبكة قرار مترابطة بدل صفحة تعريف معزولة.</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>Cross-category discovery</strong>
                    <span>بعض المكوّنات تخدم العناية والمكياج معًا عندما تكون النية واحدة.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              {ingredientGroups.map(({ collectionSlug, collection, items }) =>
                items.length ? (
                  <article key={collectionSlug} className={styles.sectionCard}>
                    <p className={styles.sectionTitle}>{collection.subtitle}</p>
                    <h2>{collection.title}</h2>
                    <div className={styles.cardGrid}>
                      {items.map((ingredient) => {
                        const relatedProducts = getProductsBySlugs(
                          ingredient.productSlugs,
                        );
                        const relatedArticles = journalArticles.filter((article) =>
                          ingredient.articleSlugs.includes(article.slug),
                        );

                        return (
                          <article
                            key={ingredient.slug}
                            className={styles.relatedCard}
                          >
                            <p className={styles.eyebrow}>{ingredient.subtitle}</p>
                            <h3>{ingredient.title}</h3>
                            <p>{ingredient.answer}</p>
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
                              href={`/ingredients/${ingredient.slug}`}
                              analyticsLabel={`ingredients_hub_${ingredient.slug}`}
                              analyticsSurface="ingredients_hub_cards"
                              analyticsDestinationType="ingredient"
                            >
                              استعراض صفحة المكوّن
                            </TrackedLink>
                          </article>
                        );
                      })}
                    </div>
                  </article>
                ) : null,
              )}
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Why this hub matters</p>
                <h2>لماذا هذا السطح مهم في الخطة؟</h2>
                <ul className={styles.list}>
                  <li>يدعم نيات بحث قوية تبدأ من اسم المكوّن بدل اسم المنتج.</li>
                  <li>يرفع جودة الربط الداخلي بين المنتج والروتين والمشكلة والمقال.</li>
                  <li>يغلق فجوة بين المحتوى التحريري والبحث التجاري داخل المتجر.</li>
                </ul>
              </article>

              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Next paths</p>
                <h2>أسطح مرتبطة</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/routines"
                    analyticsLabel="ingredients_hub_to_routines"
                    analyticsSurface="ingredients_hub_sidebar"
                    analyticsDestinationType="routine_index"
                  >
                    <span>Hub الروتينات</span>
                    <span>Routine-led</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/journal"
                    analyticsLabel="ingredients_hub_to_journal"
                    analyticsSurface="ingredients_hub_sidebar"
                    analyticsDestinationType="journal_index"
                  >
                    <span>المجلة</span>
                    <span>Editorial support</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/search"
                    analyticsLabel="ingredients_hub_to_search"
                    analyticsSurface="ingredients_hub_sidebar"
                    analyticsDestinationType="search"
                  >
                    <span>البحث الداخلي</span>
                    <span>Search-led discovery</span>
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
