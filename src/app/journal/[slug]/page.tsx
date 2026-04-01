import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  collectionDirectory,
  getConcernByHref,
  getIngredientByName,
  getProductByHref,
  getRoutineByHref,
  journalArticles,
} from "@/lib/site-content";
import styles from "../journal.module.css";

type JournalArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return journalArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: JournalArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = journalArticles.find((entry) => entry.slug === slug);

  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `/journal/${article.slug}`,
    },
  };
}

export default async function JournalArticlePage({
  params,
}: JournalArticlePageProps) {
  const { slug } = await params;
  const article = journalArticles.find((entry) => entry.slug === slug);

  if (!article) {
    notFound();
  }

  const collectionEntry = collectionDirectory[article.collection];
  const relatedConcern = getConcernByHref(article.relatedConcern);
  const relatedRoutine = getRoutineByHref(article.relatedRoutine);
  const relatedProduct = getProductByHref(article.relatedProduct);
  const relatedIngredient = relatedProduct
    ? getIngredientByName(relatedProduct.ingredient)
    : undefined;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        inLanguage: "ar-SA",
        url: absoluteUrl(`/journal/${article.slug}`),
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
            name: "المجلة",
            item: absoluteUrl("/journal"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: absoluteUrl(`/journal/${article.slug}`),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
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
      <StorefrontShell activeHref="/journal">
        <div className={styles.page}>
          <section className={styles.articleShell}>
            <article className={styles.articleLayout}>
              <p className={styles.eyebrow}>{article.category}</p>
              <h1 className={styles.articleTitle}>{article.title}</h1>
              <div className={styles.meta}>
                <span>{article.readingTime}</span>
                <span>آخر تحديث: {article.updatedAt}</span>
              </div>
              <div className={styles.articleBody}>
                <section className={styles.articleSection}>
                  <h2>الإجابة السريعة</h2>
                  <p>{article.answer}</p>
                </section>

                {article.sections.map((section) => (
                  <section key={section.heading} className={styles.articleSection}>
                    <h2 id={section.heading}>{section.heading}</h2>
                    <p>{section.body}</p>
                  </section>
                ))}
              </div>
            </article>

            <aside className={styles.sidebar}>
              <div>
                <p className={styles.eyebrow}>المحتوى</p>
                <h2>خريطة المقال</h2>
                <div className={styles.toc}>
                  {article.sections.map((section) => (
                    <a key={section.heading} href={`#${section.heading}`}>
                      {section.heading}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className={styles.eyebrow}>روابط ذات صلة</p>
                <h2>المسار التجاري</h2>
                <div className={styles.toc}>
                  {relatedConcern ? (
                    <TrackedLink
                      href={article.relatedConcern}
                      analyticsLabel={`article_related_concern_${article.slug}`}
                      analyticsSurface="article_sidebar"
                      analyticsDestinationType="concern"
                    >
                      {relatedConcern.title}
                    </TrackedLink>
                  ) : null}
                  {relatedRoutine ? (
                    <TrackedLink
                      href={article.relatedRoutine}
                      analyticsLabel={`article_related_routine_${article.slug}`}
                      analyticsSurface="article_sidebar"
                      analyticsDestinationType="routine"
                    >
                      {relatedRoutine.title}
                    </TrackedLink>
                  ) : null}
                  {relatedProduct ? (
                    <TrackedLink
                      href={article.relatedProduct}
                      analyticsLabel={`article_related_product_${article.slug}`}
                      analyticsSurface="article_sidebar"
                      analyticsDestinationType="product"
                    >
                      {relatedProduct.name}
                    </TrackedLink>
                  ) : null}
                  {relatedIngredient ? (
                    <TrackedLink
                      href={`/ingredients/${relatedIngredient.slug}`}
                      analyticsLabel={`article_related_ingredient_${article.slug}_${relatedIngredient.slug}`}
                      analyticsSurface="article_sidebar"
                      analyticsDestinationType="ingredient"
                    >
                      {relatedIngredient.title}
                    </TrackedLink>
                  ) : null}
                  <TrackedLink
                    href={collectionEntry.href}
                    analyticsLabel={`article_to_collection_${article.slug}`}
                    analyticsSurface="article_sidebar"
                    analyticsDestinationType="collection"
                  >
                    {`الانتقال إلى فئة ${collectionEntry.title}`}
                  </TrackedLink>
                  <TrackedLink
                    href="/trust"
                    analyticsLabel={`article_to_trust_${article.slug}`}
                    analyticsSurface="article_sidebar"
                    analyticsDestinationType="trust"
                  >
                    استعراض مركز الثقة
                  </TrackedLink>
                  <TrackedLink
                    href="/journal"
                    analyticsLabel={`article_back_to_journal_${article.slug}`}
                    analyticsSurface="article_sidebar"
                    analyticsDestinationType="journal_index"
                  >
                    العودة إلى المجلة
                  </TrackedLink>
                </div>
              </div>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2>أسئلة مرتبطة بنفس نية البحث</h2>
            <div className={styles.faqList}>
              {article.faq.map((item) => (
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
