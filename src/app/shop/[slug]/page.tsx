import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  editorialCollectionSlugs,
  getShopCollectionBySlug,
} from "@/lib/site-content";
import styles from "../../discovery-page.module.css";

type EditorialCollectionPageProps = {
  params: Promise<{ slug: string }>;
};

function getEditorialCollection(slug: string) {
  const collection = getShopCollectionBySlug(slug);

  if (!collection || collection.mode !== "editorial") {
    return null;
  }

  return collection;
}

export function generateStaticParams() {
  return editorialCollectionSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: EditorialCollectionPageProps): Promise<Metadata> {
  const collection = getEditorialCollection((await params).slug);

  if (!collection) {
    return {};
  }

  return {
    title: collection.title,
    description: collection.description,
    alternates: {
      canonical: collection.href,
    },
  };
}

export default async function EditorialCollectionPage({
  params,
}: EditorialCollectionPageProps) {
  const collection = getEditorialCollection((await params).slug);

  if (!collection) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: collection.title,
        description: collection.description,
        url: absoluteUrl(collection.href),
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
            name: "المتجر",
            item: absoluteUrl("/shop"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: collection.title,
            item: absoluteUrl(collection.href),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: collection.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "ItemList",
        itemListElement: collection.discoveryLinks.map((link, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: link.title,
          url: absoluteUrl(link.href),
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
      <StorefrontShell activeHref={collection.href}>
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>{collection.subtitle}</p>
              <h1>{collection.title}</h1>
              <p className={styles.summary}>{collection.description}</p>
              <p className={styles.summary}>{collection.introduction}</p>

              <div className={styles.badgeList}>
                {collection.searchTerms.map((term) => (
                  <span key={term}>{term}</span>
                ))}
              </div>

              <div className={styles.actionRow}>
                <TrackedLink
                  className={styles.primaryLink}
                  href={collection.discoveryLinks[0]?.href ?? "/search"}
                  analyticsLabel={`collection_${collection.slug}_to_primary`}
                  analyticsSurface="editorial_collection_hero"
                  analyticsDestinationType={
                    collection.discoveryLinks[0]?.destinationType ?? "search"
                  }
                >
                  {collection.discoveryLinks[0]?.title ?? "ابدئي من البحث"}
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryLink}
                  href="/shop"
                  analyticsLabel={`collection_${collection.slug}_to_shop_hub`}
                  analyticsSurface="editorial_collection_hero"
                  analyticsDestinationType="shop_index"
                >
                  العودة إلى Atlas المتجر
                </TrackedLink>
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Collection mode</p>
                <div className={styles.metricList}>
                  <div className={styles.statRow}>
                    <strong>Editorial collection surface</strong>
                    <span>
                      صفحة قابلة للفهرسة والربط الداخلي تمهّد الفئة بشكل صادق إلى أن
                      يكتمل الكتالوج المرتبط بها.
                    </span>
                  </div>
                  {collection.shoppingSignals.map((signal) => (
                    <div key={signal} className={styles.statRow}>
                      <strong>Shopping signal</strong>
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Collection framing</p>
                <h2>كيف تُستخدم هذه الفئة داخل الرحلة التجارية الحالية؟</h2>
                <div className={styles.cardGrid}>
                  {collection.focusCards.map((card) => (
                    <article key={card.title} className={styles.relatedCard}>
                      <p className={styles.eyebrow}>{card.label}</p>
                      <h3>{card.title}</h3>
                      <p>{card.body}</p>
                    </article>
                  ))}
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Linked paths</p>
                <h2>المسارات التي ترتبط بهذه الفئة داخل MVP الحالي</h2>
                <div className={styles.linkList}>
                  {collection.discoveryLinks.map((link) => (
                    <TrackedLink
                      key={link.href}
                      href={link.href}
                      analyticsLabel={`collection_${collection.slug}_${link.destinationType}_${link.href.replaceAll("/", "_").replace(/^_+/, "")}`}
                      analyticsSurface="editorial_collection_links"
                      analyticsDestinationType={link.destinationType}
                    >
                      <span>{link.title}</span>
                      <span>{link.label}</span>
                    </TrackedLink>
                  ))}
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Why this page exists</p>
                <h2>لماذا أُضيفت هذه الفئة الآن؟</h2>
                <ul className={styles.list}>
                  <li>{collection.entryDescription}</li>
                  <li>
                    الهدف ليس الادعاء بأن كل منتجات الفئة جاهزة، بل جعل الـ route
                    graph أقرب إلى roadmap الحقيقية.
                  </li>
                  <li>
                    هذا السطح يسهّل لاحقًا إضافة المنتجات أو الفلاتر أو المقالات
                    الخاصة بالفئة دون كسر البنية العامة.
                  </li>
                </ul>
              </article>

              <article className={styles.faqCard}>
                <p className={styles.eyebrow}>FAQ</p>
                <h2>أسئلة شائعة حول هذه الفئة</h2>
                <div className={styles.faqList}>
                  {collection.faqs.map((faq) => (
                    <div key={faq.question} className={styles.faqItem}>
                      <h3>{faq.question}</h3>
                      <p>{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </article>
            </aside>
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
