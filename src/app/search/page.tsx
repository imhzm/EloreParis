import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { StorefrontShell } from "@/components/storefront-shell";
import { SearchForm } from "@/components/search-form";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl } from "@/lib/site-content";
import { popularSearchQueries, searchSiteContent } from "@/lib/search";
import styles from "./search.module.css";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function getSingleQuery(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const query = getSingleQuery((await searchParams).q).trim();

  return {
    title: query ? `البحث: ${query}` : "البحث الداخلي",
    description: query
      ? "نتائج البحث داخل ÉLORÉ PARIS حسب المنتج أو المكوّن أو المشكلة أو الروتين."
      : "صفحة البحث لاكتشاف المنتجات والمشاكل والروتينات والمحتوى داخل ÉLORÉ PARIS.",
    alternates: {
      canonical: "/search",
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = getSingleQuery((await searchParams).q).trim();
  const results = searchSiteContent(query);

  const resultSections = [
    {
      key: "collection",
      title: "الفئات",
      description: "بوابة سريعة للوصول إلى صفحات الفئة الأساسية بدل البدء من منتج منفرد.",
      items: results.groups.collection,
      destinationType: "collection",
    },
    {
      key: "product",
      title: "المنتجات",
      description: "نتائج مباشرة عندما تكون نية البحث أقرب إلى قرار شراء محدد.",
      items: results.groups.product,
      destinationType: "product",
    },
    {
      key: "concern",
      title: "حسب المشكلة",
      description: "مسارات قرار تبدأ من الحاجة أو الحيرة قبل اسم المنتج.",
      items: results.groups.concern,
      destinationType: "concern",
    },
    {
      key: "ingredient",
      title: "حسب المكوّن",
      description:
        "نتائج تحول اسم المكوّن إلى مسار قرار يربط بين المشكلة والروتين والمنتج.",
      items: results.groups.ingredient,
      destinationType: "ingredient",
    },
    {
      key: "routine",
      title: "الروتينات",
      description: "نتائج تربط بين الخطوات والمنتجات والمحتوى بدل التصفح المشتت.",
      items: results.groups.routine,
      destinationType: "routine",
    },
    {
      key: "article",
      title: "المجلة",
      description: "مقالات داعمة للقرار تساعد على الفهم قبل الانتقال إلى الشراء.",
      items: results.groups.article,
      destinationType: "article",
    },
  ].filter((section) => section.items.length > 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: query ? `نتائج البحث عن ${query}` : "البحث الداخلي",
        description:
          "صفحة بحث لاكتشاف المنتجات والروتينات والمشاكل والمحتوى داخل ÉLORÉ PARIS.",
        url: absoluteUrl(query ? `/search?q=${encodeURIComponent(query)}` : "/search"),
        inLanguage: "ar-SA",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
      />
      <StorefrontShell activeHref="/search">
        <div className={styles.page}>
          <section className={styles.hero}>
            <Breadcrumb
              items={[
                { label: "الرئيسية", href: "/" },
                { label: "البحث" },
              ]}
            />
            <div className={styles.heroPanel}>
              <p className={styles.eyebrow}>Internal search</p>
              <h1>ابحثي حسب المنتج أو المكوّن أو النية الشرائية بدل التصفح الأعمى.</h1>
              <p className={styles.summary}>
                هذه الصفحة تغلق الفجوة بين `SearchAction` في الـ schema وتجربة فعلية داخل
                الموقع، مع نتائج موزعة حسب النوع حتى لا تختلط الفئات بالمنتجات بالمحتوى.
              </p>
              <SearchForm
                analyticsSurface="search_page_hero"
                buttonLabel="عرض النتائج"
                initialQuery={query}
              />
            </div>

            <aside className={styles.statusCard}>
              <p className={styles.eyebrow}>Search rules</p>
              <h2>بحث عربي/إنجليزي بمصطلحات السوق لا بأسماء الملفات</h2>
              <ul className={styles.statusList}>
                <li>يدعم البحث بالعربية والإنجليزية والمصطلحات الشائعة مثل فاونديشن ونياسيناميد.</li>
                <li>يعرض نتائج موزعة حسب النوع: فئة، منتج، مشكلة، مكوّن، روتين، أو مقال.</li>
                <li>القياس لا يسجل نص البحث نفسه، بل خصائص آمنة مثل طول الاستعلام وعدد الكلمات.</li>
              </ul>
            </aside>
          </section>

          <section className={styles.discoveryGrid}>
            <article className={styles.infoCard}>
              <p className={styles.eyebrow}>Popular searches</p>
              <h2>مداخل شائعة للبحث الداخلي</h2>
              <div className={styles.chipList}>
                {popularSearchQueries.map((item) => (
                  <TrackedLink
                    key={item.query}
                    href={`/search?q=${encodeURIComponent(item.query)}`}
                    analyticsLabel={`search_popular_${item.slug}`}
                    analyticsSurface="search_popular_queries"
                    analyticsDestinationType="search"
                  >
                    {item.label}
                  </TrackedLink>
                ))}
              </div>
            </article>

            <article className={styles.infoCard}>
              <p className={styles.eyebrow}>What search supports</p>
              <h2>أنماط نية نغطيها الآن</h2>
              <ul className={styles.statusList}>
                <li>اسم منتج أو فئة مثل فاونديشن أو سيروم أو عناية بالشعر.</li>
                <li>مكوّن مثل فيتامين C أو نياسيناميد.</li>
                <li>مشكلة مثل التصبغات أو ثبات المكياج.</li>
                <li>روتين مثل روتين صباحي أو روتين مناسبة أو مسار هدية جاهز.</li>
              </ul>
            </article>
          </section>

          {query ? (
            results.total ? (
              <>
                <section className={styles.summaryCard}>
                  <p className={styles.eyebrow}>Search results</p>
                  <h2>نتائج البحث عن: {query}</h2>
                  <p>
                    تم العثور على <strong>{results.total}</strong> نتيجة موزعة حسب السطح الأنسب
                    للقرار، حتى تبدأي من الفئة أو المكوّن أو الروتين أو المنتج أو المقال بحسب نية البحث.
                  </p>
                </section>

                {resultSections.map((section) => (
                  <section key={section.key} className={styles.resultsSection}>
                    <div className={styles.sectionHead}>
                      <p className={styles.eyebrow}>{section.key}</p>
                      <h2>{section.title}</h2>
                      <p>{section.description}</p>
                    </div>

                    <div className={styles.resultGrid}>
                      {section.items.map((item, index) => (
                        <TrackedLink
                          key={`${section.key}-${item.slug}`}
                          href={item.href}
                          className={styles.resultCard}
                          analyticsEvent="search_result_click"
                          analyticsLabel={`search_result_${item.kind}_${item.slug}`}
                          analyticsSurface={`search_results_${section.key}`}
                          analyticsDestinationType={section.destinationType}
                          analyticsProperties={{
                            result_kind: item.kind,
                            result_rank: index + 1,
                          }}
                        >
                          <span className={styles.resultEyebrow}>{item.eyebrow}</span>
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                          <strong>{item.metadata}</strong>
                        </TrackedLink>
                      ))}
                    </div>
                  </section>
                ))}
              </>
            ) : (
              <section className={styles.emptyCard}>
                <p className={styles.eyebrow}>Zero results</p>
                <h2>لا توجد نتيجة مباشرة لهذا الاستعلام حتى الآن</h2>
                <p>
                  جرّبي مصطلحًا أقصر، اسم فئة، مكوّنًا معروفًا، أو أحد الاستعلامات الشائعة
                  التالية لتصلي إلى أقرب سطح مناسب.
                </p>
                <div className={styles.chipList}>
                  {popularSearchQueries.map((item) => (
                    <TrackedLink
                      key={item.query}
                      href={`/search?q=${encodeURIComponent(item.query)}`}
                      analyticsLabel={`search_empty_${item.slug}`}
                      analyticsSurface="search_zero_state"
                      analyticsDestinationType="search"
                    >
                      {item.label}
                    </TrackedLink>
                  ))}
                </div>
              </section>
            )
          ) : (
            <section className={styles.emptyCard}>
              <p className={styles.eyebrow}>Start with a query</p>
              <h2>اكتبي ما تبحثين عنه لنوزع النتائج حسب النوع الأنسب</h2>
              <p>
                المثال الأفضل: اسم فئة، مكوّن، مشكلة، أو روتين. بهذه الطريقة تظهر لك النتائج
                التجارية والتحريرية في بنية أوضح من التصفح اليدوي.
              </p>
            </section>
          )}
        </div>
      </StorefrontShell>
    </>
  );
}
