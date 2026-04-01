import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl, shopCollections } from "@/lib/site-content";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "المتجر",
  description:
    "دليل التصفح الرئيسي في Cozmateks: skincare, makeup, haircare, bodycare, tools, and beauty sets ضمن بنية واضحة تدعم الاكتشاف والبحث والتحويل.",
  alternates: {
    canonical: "/shop",
  },
};

export default function ShopHubPage() {
  const filteredCollections = shopCollections.filter(
    (collection) => collection.mode === "filtered",
  );
  const editorialCollections = shopCollections.filter(
    (collection) => collection.mode === "editorial",
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "المتجر",
        description:
          "سطح تصفح رئيسي يجمع فئات Cozmateks الأساسية والتحريرية في خريطة تسوق واحدة قابلة للفهرسة والربط الداخلي.",
        url: absoluteUrl("/shop"),
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
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: shopCollections.map((collection, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: collection.title,
          url: absoluteUrl(collection.href),
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
      <StorefrontShell activeHref="/shop">
        <div className={styles.page}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Shop atlas</p>
              <h1>خريطة متجر أوضح تبني القرار قبل أن تدفع الزائرة إلى التشتت.</h1>
              <p className={styles.heroText}>
                هذا السطح يجمع الفئات الأساسية والتحريرية داخل Cozmateks في
                route graph واحد: skincare وmakeup كمسارات بيع مفلترة، ثم
                haircare وbodycare وtools وbeauty sets كفئات قابلة للفهرسة
                والتوسع حتى تظل IA التجارية أقرب إلى رؤية roadmap الكاملة.
              </p>
              <div className={styles.heroActions}>
                <TrackedLink
                  className={styles.primaryAction}
                  href="/search"
                  analyticsLabel="shop_hub_to_search"
                  analyticsSurface="shop_hub_hero"
                  analyticsDestinationType="search"
                >
                  ابدئي من البحث
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryAction}
                  href="/journal"
                  analyticsLabel="shop_hub_to_journal"
                  analyticsSurface="shop_hub_hero"
                  analyticsDestinationType="journal_index"
                >
                  انتقلي إلى المجلة
                </TrackedLink>
              </div>
              <ul className={styles.metricList} aria-label="منطق التصفح التجاري">
                <li>
                  <strong>{shopCollections.length} فئات رئيسية</strong>
                  <span>فئات مبنية حول نية الشراء، لا مجرد تجميع أسماء أقسام.</span>
                </li>
                <li>
                  <strong>{filteredCollections.length} مسارات بيع حية</strong>
                  <span>صفحات مفلترة قابلة للتوسع تربط التصفح بالتحويل مباشرة.</span>
                </li>
                <li>
                  <strong>{editorialCollections.length} فئات تمهيدية</strong>
                  <span>أسطح قابلة للفهرسة والربط الداخلي لحين اكتمال الكتالوج الأوسع.</span>
                </li>
              </ul>
            </div>

            <aside className={styles.heroPanel} aria-label="ملخص بنية المتجر">
              <div className={styles.panelBadge}>Commerce architecture</div>
              <div className={styles.panelCard}>
                <p>منطق التوسعة</p>
                <h2>Curated Beauty Atlas</h2>
                <span>
                  التصفح هنا يبدأ من الفئة المناسبة ثم يتفرع إلى المشكلة أو
                  الروتين أو المحتوى أو البحث بدل بقاء كل surface منفصلًا عن
                  الآخر.
                </span>
              </div>
              <div className={styles.panelStack}>
                <div>
                  <p>Ready now</p>
                  <strong>Skincare + Makeup + search + journal + trust</strong>
                </div>
                <div>
                  <p>Expansion path</p>
                  <strong>Haircare + Bodycare + Tools + Beauty Sets</strong>
                </div>
              </div>
            </aside>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <p>Collection atlas</p>
              <h2>كل فئة هنا تقود إلى surface مفهومة بدل أن تكون اسمًا فقط في القائمة.</h2>
            </div>
            <div className={styles.entryGrid}>
              {shopCollections.map((collection) => (
                <TrackedLink
                  key={collection.slug}
                  href={collection.href}
                  className={styles.entryCard}
                  analyticsLabel={`shop_hub_collection_${collection.slug}`}
                  analyticsSurface="shop_hub_collections"
                  analyticsDestinationType="collection"
                >
                  <span>{collection.subtitle}</span>
                  <h3>{collection.title}</h3>
                  <p>{collection.entryDescription}</p>
                </TrackedLink>
              ))}
            </div>
          </section>

          <section className={styles.splitSection}>
            <div className={styles.splitBlock}>
              <p>Filtered commerce</p>
              <h2>المسارات الجاهزة للبيع الآن تبدأ من collections قابلة للفلترة.</h2>
              <div className={styles.ingredientList}>
                {filteredCollections.map((collection) => (
                  <TrackedLink
                    key={collection.slug}
                    href={collection.href}
                    className={styles.ingredientLink}
                    analyticsLabel={`shop_hub_filtered_${collection.slug}`}
                    analyticsSurface="shop_hub_filtered"
                    analyticsDestinationType="collection"
                  >
                    <h3>{collection.title}</h3>
                    <p>{collection.introduction}</p>
                  </TrackedLink>
                ))}
              </div>
            </div>

            <div className={styles.splitBlock}>
              <p>Editorial expansion</p>
              <h2>الفئات الأوسع أصبحت الآن جزءًا من route graph بدل أن تبقى مؤجلة خارج الهيكل.</h2>
              <ul className={styles.signalList}>
                {editorialCollections.map((collection) => (
                  <li key={collection.slug}>
                    <strong>{collection.title}</strong>
                    <br />
                    {collection.entryDescription}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.foundationSection}>
            <div className={styles.foundationCard}>
              <p>Trust and support</p>
              <h2>الفئات الجديدة لا تعيش بمعزل عن طبقة الثقة أو الدعم.</h2>
              <span>
                حتى surfaces التمهيدية ترتبط بمركز الثقة والاتصال والبحث حتى تبقى
                التجربة صادقة وقابلة للتوسع بدل ادعاء اكتمال تشغيلي غير موجود.
              </span>
              <TrackedLink
                href="/trust"
                analyticsLabel="shop_hub_to_trust"
                analyticsSurface="shop_hub_foundation"
                analyticsDestinationType="trust"
              >
                استعراض مركز الثقة
              </TrackedLink>
            </div>

            <div className={styles.foundationCard}>
              <p>Discovery loops</p>
              <h2>البحث والمجلة والـ hubs تبقى جزءًا من التصفح التجاري من أول خطوة.</h2>
              <span>
                بنية المتجر الآن أوضح: collection ثم concern أو routine أو article
                أو search بحسب نية الشراء، بدل أن يبدأ كل surface من الصفر.
              </span>
              <TrackedLink
                href="/concerns"
                analyticsLabel="shop_hub_to_concerns"
                analyticsSurface="shop_hub_foundation"
                analyticsDestinationType="concern_index"
              >
                الانتقال إلى Hub المشاكل
              </TrackedLink>
            </div>
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
