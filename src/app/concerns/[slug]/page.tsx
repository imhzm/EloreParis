import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  collectionDirectory,
  concerns,
  getConcernBySlug,
  getIngredientByName,
  getProductsBySlugs,
  journalArticles,
} from "@/lib/site-content";
import styles from "../../discovery-page.module.css";

type ConcernPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return concerns.map((concern) => ({ slug: concern.slug }));
}

export async function generateMetadata({
  params,
}: ConcernPageProps): Promise<Metadata> {
  const { slug } = await params;
  const concern = getConcernBySlug(slug);

  if (!concern) {
    return {};
  }

  return {
    title: `${concern.title} | حسب المشكلة`,
    description: concern.answer,
    alternates: {
      canonical: `/concerns/${concern.slug}`,
    },
  };
}

export default async function ConcernPage({ params }: ConcernPageProps) {
  const { slug } = await params;
  const concern = getConcernBySlug(slug);

  if (!concern) {
    notFound();
  }

  const relatedProducts = getProductsBySlugs(concern.products);
  const relatedArticles = journalArticles.filter(
    (article) => article.relatedConcern === `/concerns/${concern.slug}`,
  );
  const collectionEntry = collectionDirectory[concern.collection];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: concern.title,
        description: concern.summary,
        url: absoluteUrl(`/concerns/${concern.slug}`),
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
            name: "حسب المشكلة",
            item: absoluteUrl("/concerns"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: concern.title,
            item: absoluteUrl(`/concerns/${concern.slug}`),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: concern.faqs.map((item) => ({
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
              <p className={styles.eyebrow}>{concern.subtitle}</p>
              <h1>{concern.title}</h1>
              <p className={styles.summary}>{concern.answer}</p>
              <p className={styles.summary}>{concern.summary}</p>

              <div className={styles.actionRow}>
                <TrackedLink
                  className={styles.primaryLink}
                  href={concern.routineHref}
                  analyticsLabel={`concern_primary_routine_${concern.slug}`}
                  analyticsSurface="concern_hero"
                  analyticsDestinationType="routine"
                >
                  الانتقال إلى الروتين المقترح
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryLink}
                  href="/concerns"
                  analyticsLabel={`concern_back_to_hub_${concern.slug}`}
                  analyticsSurface="concern_hero"
                  analyticsDestinationType="concern_index"
                >
                  العودة إلى جميع المشاكل
                </TrackedLink>
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Decision layer</p>
                <div className={styles.metricList}>
                  <div className={styles.statRow}>
                    <strong>{relatedProducts.length} منتج مرتبط</strong>
                    <span>عرض تجاري مرتبط بنفس نية البحث</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>{relatedArticles.length} مقالات داعمة</strong>
                    <span>محتوى يشرح قبل أن يدفع إلى الشراء</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>{concern.routineLabel}</strong>
                    <span>جسر واضح من الحيرة إلى الروتين</span>
                  </div>
                </div>
              </div>

              <div className={styles.asideCard}>
                <p className={styles.eyebrow}>Key ingredients</p>
                <h2>المكوّنات الأكثر ارتباطًا</h2>
                <div className={styles.chipList}>
                  {concern.keyIngredients.map((item) => {
                    const ingredient = getIngredientByName(item);

                    return ingredient ? (
                      <TrackedLink
                        key={item}
                        href={`/ingredients/${ingredient.slug}`}
                        analyticsLabel={`concern_ingredient_${concern.slug}_${ingredient.slug}`}
                        analyticsSurface="concern_key_ingredients"
                        analyticsDestinationType="ingredient"
                      >
                        {item}
                      </TrackedLink>
                    ) : (
                      <span key={item}>{item}</span>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Product matches</p>
                <h2>منتجات مرتبطة بالمشكلة لا معزولة عنها</h2>
                <div className={styles.cardGrid}>
                  {relatedProducts.map((product) => (
                    <article key={product.slug} className={styles.relatedCard}>
                      <p className={styles.eyebrow}>{product.category}</p>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <TrackedLink
                        className={styles.stepLink}
                        href={`/products/${product.slug}`}
                        analyticsLabel={`concern_product_${concern.slug}_${product.slug}`}
                        analyticsSurface="concern_products"
                        analyticsDestinationType="product"
                      >
                        استعراض صفحة المنتج
                      </TrackedLink>
                    </article>
                  ))}
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Routing logic</p>
                <h2>كيف تخدم هذه الصفحة الـ SEO والتحويل معًا؟</h2>
                <div className={styles.infoGrid}>
                  <article className={styles.infoCard}>
                    <strong>تبدأ من السؤال</strong>
                    <p>
                      الصفحة تجيب بسرعة على نية البحث، ثم تمنح مسارًا أوضح
                      للمكوّن والمنتج والروتين بدل إغراق العميلة بكتالوج واسع.
                    </p>
                  </article>
                  <article className={styles.infoCard}>
                    <strong>تربط الأسطح ببعضها</strong>
                    <p>
                      كل صفحة مشكلة يجب أن تقود إلى منتجات حقيقية، Routine مناسب،
                      ومقالات تشرح القرار بلغته التجارية والتحريرية الصحيحة.
                    </p>
                  </article>
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Editorial support</p>
                <h2>مقالات مرتبطة بنفس النية</h2>
                <div className={styles.cardGrid}>
                  {relatedArticles.map((article) => (
                    <article key={article.slug} className={styles.relatedCard}>
                      <p className={styles.eyebrow}>{article.category}</p>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                      <TrackedLink
                        className={styles.stepLink}
                        href={`/journal/${article.slug}`}
                        analyticsLabel={`concern_article_${concern.slug}_${article.slug}`}
                        analyticsSurface="concern_editorial"
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
                <p className={styles.eyebrow}>Suggested path</p>
                <h2>المسار الأقرب للقرار</h2>
                <div className={styles.linkList}>
                  <TrackedLink
                    href={concern.routineHref}
                    analyticsLabel={`concern_sidebar_routine_${concern.slug}`}
                    analyticsSurface="concern_sidebar"
                    analyticsDestinationType="routine"
                  >
                    <span>{concern.routineLabel}</span>
                    <span>Routine</span>
                  </TrackedLink>
                  <TrackedLink
                    href={collectionEntry.href}
                    analyticsLabel={`concern_sidebar_collection_${concern.slug}`}
                    analyticsSurface="concern_sidebar"
                    analyticsDestinationType="collection"
                  >
                    <span>{`الانتقال إلى ${collectionEntry.title}`}</span>
                    <span>PLP</span>
                  </TrackedLink>
                </div>
              </article>

              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Why this page exists</p>
                <h2>طبقة قرار قبل صفحة المنتج</h2>
                <ul className={styles.list}>
                  <li>تقلل الحيرة عندما تبدأ النية من المشكلة نفسها.</li>
                  <li>ترفع جودة الربط الداخلي بين الفئة والروتين والمنتج.</li>
                  <li>تدعم نية البحث التجارية من دون ادعاءات علاجية.</li>
                </ul>
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2>أسئلة مرتبطة بنية البحث نفسها</h2>
            <div className={styles.faqList}>
              {concern.faqs.map((item) => (
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
