import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  getConcernByHref,
  getIngredientBySlug,
  getProductsBySlugs,
  getRoutineByHref,
  ingredients,
  journalArticles,
} from "@/lib/site-content";
import styles from "../../discovery-page.module.css";

type IngredientPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return ingredients.map((ingredient) => ({ slug: ingredient.slug }));
}

export async function generateMetadata({
  params,
}: IngredientPageProps): Promise<Metadata> {
  const { slug } = await params;
  const ingredient = getIngredientBySlug(slug);

  if (!ingredient) {
    return {};
  }

  return {
    title: `${ingredient.title} | حسب المكوّن`,
    description: ingredient.answer,
    alternates: {
      canonical: `/ingredients/${ingredient.slug}`,
    },
  };
}

export default async function IngredientPage({ params }: IngredientPageProps) {
  const { slug } = await params;
  const ingredient = getIngredientBySlug(slug);

  if (!ingredient) {
    notFound();
  }

  const relatedProducts = getProductsBySlugs(ingredient.productSlugs);
  const relatedArticles = journalArticles.filter((article) =>
    ingredient.articleSlugs.includes(article.slug),
  );
  const relatedConcerns = ingredient.relatedConcernHrefs
    .map((href) => getConcernByHref(href))
    .filter((item): item is NonNullable<ReturnType<typeof getConcernByHref>> =>
      Boolean(item),
    );
  const relatedRoutines = ingredient.relatedRoutineHrefs
    .map((href) => getRoutineByHref(href))
    .filter((item): item is NonNullable<ReturnType<typeof getRoutineByHref>> =>
      Boolean(item),
    );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: ingredient.title,
        description: ingredient.summary,
        url: absoluteUrl(`/ingredients/${ingredient.slug}`),
        inLanguage: "ar-SA",
      },
      {
        "@type": "ItemList",
        itemListElement: relatedProducts.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/products/${product.slug}`),
          name: product.name,
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
            name: "حسب المكوّن",
            item: absoluteUrl("/ingredients"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: ingredient.title,
            item: absoluteUrl(`/ingredients/${ingredient.slug}`),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: ingredient.faqs.map((item) => ({
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
      <StorefrontShell activeHref="/ingredients">
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>{ingredient.subtitle}</p>
              <h1>{ingredient.title}</h1>
              <p className={styles.summary}>{ingredient.answer}</p>
              <p className={styles.summary}>{ingredient.summary}</p>

              <div className={styles.actionRow}>
                <TrackedLink
                  className={styles.primaryLink}
                  href="/ingredients"
                  analyticsLabel={`ingredient_back_to_hub_${ingredient.slug}`}
                  analyticsSurface="ingredient_hero"
                  analyticsDestinationType="ingredient_index"
                >
                  العودة إلى جميع المكوّنات
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryLink}
                  href={relatedProducts[0] ? `/products/${relatedProducts[0].slug}` : "/search"}
                  analyticsLabel={`ingredient_primary_product_${ingredient.slug}`}
                  analyticsSurface="ingredient_hero"
                  analyticsDestinationType={relatedProducts[0] ? "product" : "search"}
                >
                  الانتقال إلى المنتج المرتبط
                </TrackedLink>
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Ingredient graph</p>
                <div className={styles.metricList}>
                  <div className={styles.statRow}>
                    <strong>{relatedProducts.length} منتجات مرتبطة</strong>
                    <span>نقاط شراء فعلية مرتبطة بنفس نية البحث.</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>{relatedRoutines.length} روتينات</strong>
                    <span>خطوات استخدام وسياقات توضح أين يدخل المكوّن في القرار.</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>{relatedArticles.length} مقالات داعمة</strong>
                    <span>محتوى يشرح قبل أن يدفع إلى الشراء.</span>
                  </div>
                </div>
              </div>

              <div className={styles.asideCard}>
                <p className={styles.eyebrow}>Why it fits</p>
                <h2>متى يخدم هذا المكوّن القرار بشكل أفضل؟</h2>
                <ul className={styles.list}>
                  {ingredient.fitNotes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Use with context</p>
                <h2>حدود الاستخدام الجيد داخل التجربة</h2>
                <ul className={styles.list}>
                  {ingredient.watchouts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Product matches</p>
                <h2>منتجات مرتبطة بنفس منطق المكوّن</h2>
                <div className={styles.cardGrid}>
                  {relatedProducts.map((product) => (
                    <article key={product.slug} className={styles.relatedCard}>
                      <p className={styles.eyebrow}>{product.category}</p>
                      <h3>{product.name}</h3>
                      <p>{product.subtitle}</p>
                      <TrackedLink
                        className={styles.stepLink}
                        href={`/products/${product.slug}`}
                        analyticsLabel={`ingredient_product_${ingredient.slug}_${product.slug}`}
                        analyticsSurface="ingredient_products"
                        analyticsDestinationType="product"
                      >
                        استعراض صفحة المنتج
                      </TrackedLink>
                    </article>
                  ))}
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Concern and routine routes</p>
                <h2>مشاكل وروتينات مرتبطة بنفس النية</h2>
                <div className={styles.infoGrid}>
                  <article className={styles.infoCard}>
                    <strong>مشاكل مرتبطة</strong>
                    <div className={styles.linkList}>
                      {relatedConcerns.map((concern) => (
                        <TrackedLink
                          key={concern.slug}
                          href={`/concerns/${concern.slug}`}
                          analyticsLabel={`ingredient_concern_${ingredient.slug}_${concern.slug}`}
                          analyticsSurface="ingredient_related_concerns"
                          analyticsDestinationType="concern"
                        >
                          <span>{concern.title}</span>
                          <span>Concern</span>
                        </TrackedLink>
                      ))}
                    </div>
                  </article>

                  <article className={styles.infoCard}>
                    <strong>روتينات مرتبطة</strong>
                    <div className={styles.linkList}>
                      {relatedRoutines.map((routine) => (
                        <TrackedLink
                          key={routine.slug}
                          href={`/routines/${routine.slug}`}
                          analyticsLabel={`ingredient_routine_${ingredient.slug}_${routine.slug}`}
                          analyticsSurface="ingredient_related_routines"
                          analyticsDestinationType="routine"
                        >
                          <span>{routine.title}</span>
                          <span>Routine</span>
                        </TrackedLink>
                      ))}
                    </div>
                  </article>
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Editorial support</p>
                <h2>مقالات تدعم نفس نية البحث</h2>
                <div className={styles.cardGrid}>
                  {relatedArticles.map((article) => (
                    <article key={article.slug} className={styles.relatedCard}>
                      <p className={styles.eyebrow}>{article.category}</p>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                      <TrackedLink
                        className={styles.stepLink}
                        href={`/journal/${article.slug}`}
                        analyticsLabel={`ingredient_article_${ingredient.slug}_${article.slug}`}
                        analyticsSurface="ingredient_editorial"
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
                <p className={styles.eyebrow}>Next paths</p>
                <h2>أسطح توسع القرار بدل عزله</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href="/search"
                    analyticsLabel={`ingredient_to_search_${ingredient.slug}`}
                    analyticsSurface="ingredient_sidebar"
                    analyticsDestinationType="search"
                  >
                    <span>البحث الداخلي</span>
                    <span>Search</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/concerns"
                    analyticsLabel={`ingredient_to_concerns_${ingredient.slug}`}
                    analyticsSurface="ingredient_sidebar"
                    analyticsDestinationType="concern_index"
                  >
                    <span>Hub المشاكل</span>
                    <span>Concern-led</span>
                  </TrackedLink>
                  <TrackedLink
                    href="/journal"
                    analyticsLabel={`ingredient_to_journal_${ingredient.slug}`}
                    analyticsSurface="ingredient_sidebar"
                    analyticsDestinationType="journal_index"
                  >
                    <span>المجلة</span>
                    <span>Editorial</span>
                  </TrackedLink>
                </div>
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2>أسئلة متكررة قبل استخدام المكوّن كنقطة قرار</h2>
            <div className={styles.faqList}>
              {ingredient.faqs.map((item) => (
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
