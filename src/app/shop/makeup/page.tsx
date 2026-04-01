import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  getCollectionFilterState,
  hasActiveCollectionFilters,
  type CollectionFilterSearchParams,
} from "@/lib/collection-filters";
import {
  absoluteUrl,
  journalArticles,
  makeupCategory,
  products,
  routines,
  skincareCategory,
  concerns,
} from "@/lib/site-content";
import styles from "../category.module.css";

type MakeupPageProps = {
  searchParams: Promise<CollectionFilterSearchParams>;
};

function getSlugFromHref(href: string) {
  return href.split("/").filter(Boolean).at(-1) ?? "";
}

export async function generateMetadata({
  searchParams,
}: MakeupPageProps): Promise<Metadata> {
  const collectionProducts = products.filter(
    (product) => product.collection === "makeup",
  );
  const resolvedSearchParams = await searchParams;
  const filterState = getCollectionFilterState(
    "/shop/makeup",
    collectionProducts,
    resolvedSearchParams,
  );
  const activeFilterSummary = filterState.activeFilters
    .map((filter) => filter.value)
    .join(" | ");

  return {
    title: activeFilterSummary
      ? `${makeupCategory.title} | ${activeFilterSummary}`
      : makeupCategory.title,
    description: activeFilterSummary
      ? `${makeupCategory.description} الفلاتر النشطة: ${activeFilterSummary}.`
      : makeupCategory.description,
    alternates: {
      canonical: "/shop/makeup",
    },
    robots: hasActiveCollectionFilters(resolvedSearchParams)
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  };
}

export default async function MakeupPage({ searchParams }: MakeupPageProps) {
  const collectionConcerns = concerns.filter(
    (concern) => concern.collection === "makeup",
  );
  const collectionRoutines = routines.filter(
    (routine) => routine.collection === "makeup",
  );
  const collectionProducts = products.filter(
    (product) => product.collection === "makeup",
  );
  const collectionArticles = journalArticles.filter(
    (article) => article.collection === "makeup",
  );
  const resolvedSearchParams = await searchParams;
  const filterState = getCollectionFilterState(
    "/shop/makeup",
    collectionProducts,
    resolvedSearchParams,
  );

  const visibleProductSlugs = new Set(
    filterState.filteredProducts.map((product) => product.slug),
  );
  const visibleConcerns = filterState.isFiltered
    ? collectionConcerns.filter(
        (concern) =>
          concern.products.some((slug) => visibleProductSlugs.has(slug)) ||
          filterState.filteredProducts.some(
            (product) => product.concern === concern.title,
          ),
      )
    : collectionConcerns;
  const visibleConcernSlugs = new Set(
    visibleConcerns.map((concern) => concern.slug),
  );
  const visibleRoutines = filterState.isFiltered
    ? collectionRoutines.filter(
        (routine) =>
          routine.steps.some((step) =>
            step.href
              ? visibleProductSlugs.has(getSlugFromHref(step.href))
              : false,
          ) ||
          routine.pairings.some((pairing) =>
            visibleProductSlugs.has(getSlugFromHref(pairing.href)),
          ),
      )
    : collectionRoutines;
  const visibleRoutineSlugs = new Set(
    visibleRoutines.map((routine) => routine.slug),
  );
  const visibleArticles = filterState.isFiltered
    ? collectionArticles.filter(
        (article) =>
          visibleProductSlugs.has(getSlugFromHref(article.relatedProduct)) ||
          visibleConcernSlugs.has(getSlugFromHref(article.relatedConcern)) ||
          visibleRoutineSlugs.has(getSlugFromHref(article.relatedRoutine)),
      )
    : collectionArticles;

  const showZeroState =
    filterState.isFiltered && filterState.filteredProducts.length === 0;
  const activeFilterSummary = filterState.activeFilters
    .map((filter) => `${filter.label}: ${filter.value}`)
    .join(" | ");

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: makeupCategory.title,
        url: absoluteUrl("/shop/makeup"),
        description: makeupCategory.description,
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
            name: "المكياج",
            item: absoluteUrl("/shop/makeup"),
          },
        ],
      },
      ...(filterState.filteredProducts.length
        ? [
            {
              "@type": "ItemList",
              itemListElement: filterState.filteredProducts.map(
                (product, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: product.name,
                  url: absoluteUrl(`/products/${product.slug}`),
                }),
              ),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StorefrontShell activeHref="/shop/makeup">
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>{makeupCategory.subtitle}</p>
              <h1>{makeupCategory.title}</h1>
              <p className={styles.heroIntro}>{makeupCategory.description}</p>
              <p className={styles.heroIntro}>{makeupCategory.introduction}</p>
            </div>

            <div className={styles.heroSide}>
              <div className={styles.statCard}>
                <span className={styles.eyebrow}>Filter logic</span>
                <strong>القرار يبدأ من النتيجة لا من التشتيت</strong>
                <p>
                  الفلاتر هنا ترتب قرار القاعدة والثبات والمناسبة بشكل قابل للاستخدام،
                  لا كواجهات شكلية تترك الزائرة أمام نفس الازدحام القديم.
                </p>
              </div>
              <div className={styles.statCard}>
                <span className={styles.eyebrow}>Cross-category discovery</span>
                <strong>المكياج متصل بالعناية لا منفصل عنها</strong>
                <p>
                  يتم ربط القاعدة والتهيئة والمقالات والروتينات وصفحات المنتج داخل نفس
                  الرحلة حتى يبقى القرار التجاري أكثر وضوحًا.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.grid}>
            <article className={styles.contentCard}>
              <p className={styles.sectionTitle}>فلترة عملية</p>
              <h2>اختاري سياق الاستخدام قبل اسم المنتج فقط</h2>

              {filterState.groups.map((group) => (
                <div key={group.key} className={styles.filterGroup}>
                  <p className={styles.sectionTitle}>{group.label}</p>
                  <div className={styles.chipList}>
                    {group.options.map((option, index) => (
                      <TrackedLink
                        key={`${group.key}-${option.value}`}
                        href={option.href}
                        analyticsEvent="filter_apply"
                        analyticsLabel={`makeup_filter_${group.key}_${index + 1}`}
                        analyticsSurface="collection_filters"
                        analyticsDestinationType="collection"
                        analyticsProperties={{
                          filter_key: group.key,
                          filter_value: option.value,
                          filter_state: option.isActive ? "clear" : "apply",
                          result_count: option.count,
                        }}
                        aria-current={option.isActive ? "true" : undefined}
                      >
                        {option.label} ({option.count})
                      </TrackedLink>
                    ))}
                  </div>
                </div>
              ))}

              {filterState.activeFilters.length ? (
                <div className={styles.chipList}>
                  {filterState.activeFilters.map((filter) => (
                    <TrackedLink
                      key={`${filter.key}-${filter.value}`}
                      href={filter.clearHref}
                      analyticsEvent="filter_apply"
                      analyticsLabel={`makeup_filter_clear_${filter.key}`}
                      analyticsSurface="collection_active_filters"
                      analyticsDestinationType="collection"
                      analyticsProperties={{
                        filter_key: filter.key,
                        filter_value: filter.value,
                        filter_state: "clear",
                        result_count: filter.resultCount,
                      }}
                    >
                      إزالة {filter.label}: {filter.value}
                    </TrackedLink>
                  ))}
                  <TrackedLink
                    href={filterState.clearHref}
                    analyticsEvent="filter_apply"
                    analyticsLabel="makeup_filter_clear_all"
                    analyticsSurface="collection_active_filters"
                    analyticsDestinationType="collection"
                    analyticsProperties={{
                      filter_key: "all",
                      filter_value: "all",
                      filter_state: "clear_all",
                      result_count: filterState.totalProducts,
                    }}
                  >
                    إزالة كل الفلاتر
                  </TrackedLink>
                </div>
              ) : null}

              <p className={styles.filterDescription}>
                {filterState.isFiltered
                  ? `النتائج الحالية مضبوطة على: ${activeFilterSummary}.`
                  : "ابدئي بالنتيجة النهائية أو الثبات أو نوع البشرة إذا كانت نية الاختيار أوضح من التصفح العام."}
              </p>
              <div className={styles.filterSummary}>
                <span>
                  {filterState.filteredProducts.length} من {filterState.totalProducts} منتجات
                  ظاهرة
                </span>
                <span>{visibleConcerns.length} صفحة مشكلة مرتبطة</span>
                <span>{visibleRoutines.length} روتين مرتبط</span>
                <span>{visibleArticles.length} مقال مرتبط</span>
              </div>
            </article>

            <aside className={styles.faqCard}>
              <p className={styles.sectionTitle}>حسب المشكلة</p>
              <h2>مداخل جاهزة لنية شراء المكياج</h2>
              {visibleConcerns.length ? (
                <ul className={styles.checkList}>
                  {visibleConcerns.map((concern) => (
                    <li key={concern.slug}>
                      <TrackedLink
                        href={`/concerns/${concern.slug}`}
                        analyticsLabel={`makeup_concern_${concern.slug}`}
                        analyticsSurface="makeup_concern_list"
                        analyticsDestinationType="concern"
                      >
                        {concern.title}
                      </TrackedLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.filterDescription}>
                  لا توجد صفحة مشكلة مرتبطة مباشرة بهذه الفلاتر الآن، لذلك يبقى أفضل
                  مسار هو الروتين أو صفحة المنتج الظاهرة.
                </p>
              )}
            </aside>
          </section>

          {showZeroState ? (
            <section className={styles.emptyState}>
              <p className={styles.sectionTitle}>Zero results</p>
              <h2>لا توجد مطابقة مباشرة لهذه التوليفة من الفلاتر</h2>
              <p>
                هذه الحالة تمنع إظهار نتائج شكلية. أزيلي بعض الفلاتر أو انتقلي إلى البحث
                الداخلي إذا كانت نيتك أكثر تحديدًا من الخيارات الحالية.
              </p>
              <div className={styles.chipList}>
                <TrackedLink
                  href={filterState.clearHref}
                  analyticsEvent="filter_apply"
                  analyticsLabel="makeup_zero_clear_filters"
                  analyticsSurface="collection_zero_state"
                  analyticsDestinationType="collection"
                  analyticsProperties={{
                    filter_key: "all",
                    filter_value: "all",
                    filter_state: "clear_all",
                    result_count: filterState.totalProducts,
                  }}
                >
                  العودة إلى كل النتائج
                </TrackedLink>
                <TrackedLink
                  href={`/search?q=${encodeURIComponent(filterState.activeFilters[0]?.value ?? makeupCategory.title)}`}
                  analyticsLabel="makeup_zero_to_search"
                  analyticsSurface="collection_zero_state"
                  analyticsDestinationType="search"
                >
                  المتابعة عبر البحث الداخلي
                </TrackedLink>
              </div>
            </section>
          ) : (
            <>
              <section className={styles.contentCard}>
                <p className={styles.sectionTitle}>Curated cards</p>
                <h2>ثلاث طبقات بيع: الدرجة، النتيجة، والثبات العملي</h2>
                <div className={styles.cardGrid}>
                  {makeupCategory.featuredCards.map((card) => (
                    <article key={card.title} className={styles.guideCard}>
                      <span className={styles.eyebrow}>{card.label}</span>
                      <h3>{card.title}</h3>
                      <p>{card.body}</p>
                      <TrackedLink
                        href="/journal/how-to-choose-foundation-finish-for-events"
                        analyticsLabel={`makeup_featured_card_${card.title.toLowerCase().replaceAll(" ", "_")}`}
                        analyticsSurface="makeup_featured_cards"
                        analyticsDestinationType="article"
                      >
                        قراءة الدليل المرتبط
                      </TrackedLink>
                    </article>
                  ))}
                </div>
              </section>

              {visibleRoutines.length || !filterState.isFiltered ? (
                <section className={styles.grid}>
                  <article className={styles.contentCard}>
                    <p className={styles.sectionTitle}>روتينات مقترحة</p>
                    <h2>روتينات تبني القاعدة قبل المناسبة أو اليوم الطويل</h2>
                    <div className={styles.chipList}>
                      {visibleRoutines.map((routine) => (
                        <TrackedLink
                          key={routine.slug}
                          href={`/routines/${routine.slug}`}
                          analyticsLabel={`makeup_routine_${routine.slug}`}
                          analyticsSurface="makeup_routines"
                          analyticsDestinationType="routine"
                        >
                          {routine.title}
                        </TrackedLink>
                      ))}
                    </div>
                  </article>

                  <article className={styles.faqCard}>
                    <p className={styles.sectionTitle}>روابط داخلية</p>
                    <h2>Cluster logic</h2>
                    <ul className={styles.checkList}>
                      <li>المكياج ← المشكلة</li>
                      <li>المكياج ← الروتين</li>
                      <li>المكياج ← المقالات التعليمية</li>
                      <li>المكياج ← المنتج ← صفحة الثقة</li>
                    </ul>
                  </article>
                </section>
              ) : null}

              {filterState.filteredProducts.length || !filterState.isFiltered ? (
                <section className={styles.contentCard}>
                  <p className={styles.sectionTitle}>Product architecture</p>
                  <h2>صفحات منتج تربط بين الدرجات والثبات وسياق الاستخدام</h2>
                  <div className={styles.cardGrid}>
                    {filterState.filteredProducts.map((product) => (
                      <article key={product.slug} className={styles.guideCard}>
                        <span className={styles.eyebrow}>{product.category}</span>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <TrackedLink
                          href={`/products/${product.slug}`}
                          analyticsLabel={`makeup_product_${product.slug}`}
                          analyticsSurface="makeup_products"
                          analyticsDestinationType="product"
                        >
                          استعراض صفحة المنتج
                        </TrackedLink>
                      </article>
                    ))}
                    {!filterState.isFiltered ? (
                      <article className={styles.guideCard}>
                        <span className={styles.eyebrow}>{skincareCategory.subtitle}</span>
                        <h3>{skincareCategory.title}</h3>
                        <p>
                          التهيئة الجيدة جزء من قرار المكياج، لذلك تبقى فئة العناية
                          بالبشرة متصلة بهذه الرحلة داخل التجربة نفسها.
                        </p>
                        <TrackedLink
                          href="/shop/skincare"
                          analyticsLabel="makeup_cross_sell_skincare"
                          analyticsSurface="makeup_products"
                          analyticsDestinationType="collection"
                        >
                          الانتقال إلى العناية بالبشرة
                        </TrackedLink>
                      </article>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {visibleArticles.length || !filterState.isFiltered ? (
                <section className={styles.grid}>
                  <article className={styles.contentCard}>
                    <p className={styles.sectionTitle}>Guides</p>
                    <h2>مقالات مرتبطة لتغذية القرار الشرائي والـ SEO</h2>
                    <div className={styles.cardGrid}>
                      {visibleArticles.map((article) => (
                        <article key={article.slug} className={styles.guideCard}>
                          <span className={styles.eyebrow}>{article.category}</span>
                          <h3>{article.title}</h3>
                          <p>{article.excerpt}</p>
                          <TrackedLink
                            href={`/journal/${article.slug}`}
                            analyticsLabel={`makeup_article_${article.slug}`}
                            analyticsSurface="makeup_articles"
                            analyticsDestinationType="article"
                          >
                            قراءة المقال
                          </TrackedLink>
                        </article>
                      ))}
                    </div>
                  </article>

                  <aside className={styles.faqCard}>
                    <p className={styles.sectionTitle}>FAQ</p>
                    <h2>أسئلة تقلل الحيرة قبل الدخول إلى المنتج</h2>
                    <div className={styles.faqList}>
                      {makeupCategory.faqs.map((faq) => (
                        <article key={faq.question} className={styles.faqItem}>
                          <h3>{faq.question}</h3>
                          <p>{faq.answer}</p>
                        </article>
                      ))}
                    </div>
                  </aside>
                </section>
              ) : null}
            </>
          )}
        </div>
      </StorefrontShell>
    </>
  );
}
