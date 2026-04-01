import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl, journalArticles } from "@/lib/site-content";
import styles from "./journal.module.css";

export const metadata: Metadata = {
  title: "المجلة",
  description:
    "مجلة الجمال الخاصة بـ Cozmateks: أدلة، مقارنات، روتينات، ومحتوى عربي مصمم ليدعم الثقة والتحويل معًا.",
  alternates: {
    canonical: "/journal",
  },
};

export default function JournalPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "مجلة الجمال",
        url: absoluteUrl("/journal"),
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
      <StorefrontShell activeHref="/journal">
        <div className={styles.page}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Beauty Journal</p>
            <h1>المجلة هنا لتشرح، ترتب القرار، ثم تقود إلى شراء أذكى.</h1>
            <p>
              هذه ليست مدونة شكلية. هي ذراع SEO وAEO وثقة، تربط المقالات
              التعليمية بصفحات الفئة والروتين والمنتج بدل ترك المحتوى منفصلًا عن
              التجارة.
            </p>
          </section>

          <section className={styles.articleGrid}>
            {journalArticles.map((article) => (
              <article key={article.slug} className={styles.articleCard}>
                <span>{article.category}</span>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <div className={styles.meta}>
                  <span>{article.readingTime}</span>
                  <span>{article.updatedAt}</span>
                </div>
                <TrackedLink
                  href={`/journal/${article.slug}`}
                  analyticsLabel={`journal_index_${article.slug}`}
                  analyticsSurface="journal_index"
                  analyticsDestinationType="article"
                >
                  قراءة المقال
                </TrackedLink>
              </article>
            ))}
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
