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
  concerns,
  journalArticles,
  makeupCategory,
  products,
  routines,
  skincareCategory,
} from "@/lib/site-content";
import styles from "../category.module.css";

type SkincarePageProps = {
  searchParams: Promise<CollectionFilterSearchParams>;
};

function getSlugFromHref(href: string) {
  return href.split("/").filter(Boolean).at(-1) ?? "";
}

export async function generateMetadata({
  searchParams,
}: SkincarePageProps): Promise<Metadata> {
  const collectionProducts = products.filter(
    (product) => product.collection === "skincare",
  );
  const resolvedSearchParams = await searchParams;
  const filterState = getCollectionFilterState(
    "/shop/skincare",
    collectionProducts,
    resolvedSearchParams,
  );
  const activeFilterSummary = filterState.activeFilters
    .map((filter) => filter.value)
    .join(" | ");

  return {
    title: activeFilterSummary
      ? `${skincareCategory.title} | ${activeFilterSummary}`
      : skincareCategory.title,
    description: activeFilterSummary
      ? `${skincareCategory.description} الفلاتر النشطة: ${activeFilterSummary}.`
      : skincareCategory.description,
    alternates: {
      canonical: "/shop/skincare",
    },
    robots: hasActiveCollectionFilters(resolvedSearchParams)
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  };
}

export default async function SkincarePage({ searchParams }: SkincarePageProps) {
  const collectionConcerns = concerns.filter(
    (concern) => concern.collection === "skincare",
  );
  const collectionRoutines = routines.filter(
    (routine) => routine.collection === "skincare",
  );
  const collectionProducts = products.filter(
    (product) => product.collection === "skincare",
  );
  const collectionArticles = journalArticles.filter(
    (article) => article.collection === "skincare",
  );
  const resolvedSearchParams = await searchParams;
  const filterState = getCollectionFilterState(
    "/shop/skincare",
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
        name: skincareCategory.title,
        url: absoluteUrl("/shop/skincare"),
        description: skincareCategory.description,
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
            name: "العناية بالبشرة",
            item: absoluteUrl("/shop/skincare"),
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
      <StorefrontShell activeHref="/shop/skincare">
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>{skincareCategory.subtitle}</p>
              <h1>{skincareCategory.title}</h1>
              <p className={styles.heroIntro}>{skincareCategory.description}</p>
              <p className={styles.heroIntro}>{skincareCategory.introduction}</p>
            </div>

            <div className={styles.heroSide}>
              <div className={styles.statCard}>
                <span className={styles.eyebrow}>Filter logic</span>
                <strong>فلترة مرتبطة بالبيانات لا بالزينة</strong>
                <p>
                  الفلاتر هنا تبني قرارًا حقيقيًا داخل صفحة الفئة، وتظهر فقط عندما يكون
                  لها أثر على النتائج بدل واجهة شكلية لا تغيّر شيئًا.
                </p>
              </div>
              <div className={styles.statCard}>
                <span className={styles.eyebrow}>Commercial SEO</span>
                <strong>صفحة فئة تخدم التصفح والبحث والبيع</strong>
                <p>
                  هذه البنية تبقي التصفح التجاري منظمًا، وتربط بين المشكلة والمنتج
                  والروتين والمقال من دون كسر الفئة إلى صفحات منعزلة.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.grid}>
            <article className={styles.contentCard}>
              <p className={styles.sectionTitle}>فلترة عملية</p>
              <h2>اختاري منطق القرار قبل الغرق في بطاقات متشابهة</h2>

              {filterState.groups.map((group) => (
                <div key={group.key} className={styles.filterGroup}>
                  <p className={styles.sectionTitle}>{group.label}</p>
                  <div className={styles.chipList}>
                    {group.options.map((option, index) => (
                      <TrackedLink
                        key={`${group.key}-${option.value}`}
                        href={option.href}
                        analyticsEvent="filter_apply"
                        analyticsLabel={`skincare_filter_${group.key}_${index + 1}`}
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
                      analyticsLabel={`skincare_filter_clear_${filter.key}`}
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
                    analyticsLabel="skincare_filter_clear_all"
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
                  : "ابدئي من المشكلة أو نوع البشرة أو التوقيت إذا كانت نيتك أوضح من التصفح العام."}
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
              <h2>مداخل جاهزة للنية الشرائية</h2>
              {visibleConcerns.length ? (
                <ul className={styles.checkList}>
                  {visibleConcerns.map((concern) => (
                    <li key={concern.slug}>
                      <TrackedLink
                        href={`/concerns/${concern.slug}`}
                        analyticsLabel={`collection_concern_${concern.slug}`}
                        analyticsSurface="collection_concern_list"
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
                هذه الحالة تمنع عرض نتائج مضللة. أزيلي بعض الفلاتر أو انتقلي إلى البحث
                الداخلي إذا كانت نيتك أدق من الخيارات المتاحة على صفحة الفئة.
              </p>
              <div className={styles.chipList}>
                <TrackedLink
                  href={filterState.clearHref}
                  analyticsEvent="filter_apply"
                  analyticsLabel="skincare_zero_clear_filters"
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
                  href={`/search?q=${encodeURIComponent(filterState.activeFilters[0]?.value ?? skincareCategory.title)}`}
                  analyticsLabel="skincare_zero_to_search"
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
                <h2>ثلاث طبقات بيع: الراحة، الوضوح، وربط الروتين</h2>
                <div className={styles.cardGrid}>
                  {skincareCategory.featuredCards.map((card) => (
                    <article key={card.title} className={styles.guideCard}>
                      <span className={styles.eyebrow}>{card.label}</span>
                      <h3>{card.title}</h3>
                      <p>{card.body}</p>
                      <TrackedLink
                        href="/journal"
                        analyticsLabel={`collection_featured_card_${card.title.toLowerCase().replaceAll(" ", "_")}`}
                        analyticsSurface="collection_featured_cards"
                        analyticsDestinationType="journal_index"
                      >
                        الانتقال إلى المجلة
                      </TrackedLink>
                    </article>
                  ))}
                </div>
              </section>

              {visibleRoutines.length || !filterState.isFiltered ? (
                <section className={styles.grid}>
                  <article className={styles.contentCard}>
                    <p className={styles.sectionTitle}>روتينات مقترحة</p>
                    <h2>روتينات توصل من البحث إلى السلة بخطوات أقل</h2>
                    <div className={styles.chipList}>
                      {visibleRoutines.map((routine) => (
                        <TrackedLink
                          key={routine.slug}
                          href={`/routines/${routine.slug}`}
                          analyticsLabel={`collection_routine_${routine.slug}`}
                          analyticsSurface="collection_routines"
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
                      <li>الفئة ← المشكلة</li>
                      <li>الفئة ← المكوّن</li>
                      <li>الفئة ← المقالات التعليمية</li>
                      <li>الفئة ← الروتين ← المنتج</li>
                    </ul>
                  </article>
                </section>
              ) : null}

              {filterState.filteredProducts.length || !filterState.isFiltered ? (
                <section className={styles.contentCard}>
                  <p className={styles.sectionTitle}>Product architecture</p>
                  <h2>صفحات منتج مرتبطة بالفعل بالفئة والمشكلة والروتين</h2>
                  <div className={styles.cardGrid}>
                    {filterState.filteredProducts.map((product) => (
                      <article key={product.slug} className={styles.guideCard}>
                        <span className={styles.eyebrow}>{product.category}</span>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <TrackedLink
                          href={`/products/${product.slug}`}
                          analyticsLabel={`collection_product_${product.slug}`}
                          analyticsSurface="collection_products"
                          analyticsDestinationType="product"
                        >
                          استعراض صفحة المنتج
                        </TrackedLink>
                      </article>
                    ))}
                    {!filterState.isFiltered ? (
                      <article className={styles.guideCard}>
                        <span className={styles.eyebrow}>{makeupCategory.subtitle}</span>
                        <h3>{makeupCategory.title}</h3>
                        <p>
                          فئة موازية للمكياج داخل نفس البنية العامة حتى تتوسع رحلة
                          الاكتشاف من العناية إلى القاعدة والدرجات من دون كسر المسار.
                        </p>
                        <TrackedLink
                          href="/shop/makeup"
                          analyticsLabel="collection_cross_sell_makeup"
                          analyticsSurface="collection_products"
                          analyticsDestinationType="collection"
                        >
                          الانتقال إلى فئة المكياج
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
                    <h2>مقالات مرتبطة لتغذية الـ SEO والقرار الشرائي</h2>
                    <div className={styles.cardGrid}>
                      {visibleArticles.slice(0, 3).map((article) => (
                        <article key={article.slug} className={styles.guideCard}>
                          <span className={styles.eyebrow}>{article.category}</span>
                          <h3>{article.title}</h3>
                          <p>{article.excerpt}</p>
                          <TrackedLink
                            href={`/journal/${article.slug}`}
                            analyticsLabel={`collection_article_${article.slug}`}
                            analyticsSurface="collection_articles"
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
                      {skincareCategory.faqs.map((faq) => (
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
