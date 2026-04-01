import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  featuredProducts,
  homeEntryPoints,
  ingredients,
  journalArticles,
} from "@/lib/site-content";
import styles from "./page.module.css";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Cozmateks",
        url: absoluteUrl("/"),
        description:
          "Saudi premium beauty house with curated skincare, makeup, haircare, bodycare, tools, sets, and editorial commerce.",
      },
      {
        "@type": "WebSite",
        name: "Cozmateks",
        inLanguage: "ar-SA",
        potentialAction: {
          "@type": "SearchAction",
          target: absoluteUrl("/search?q={search_term_string}"),
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StorefrontShell activeHref="/">
        <div className={styles.page}>
          <section className={styles.hero} id="top">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>واجهة تأسيسية لمتجر تجميل سعودي فاخر</p>
              <h1>جمالك يبدأ من اختيار أذكى، لا من ازدحام الخيارات.</h1>
              <p className={styles.heroText}>
                نؤسس تجربة شراء عربية راقية تجمع بين الاكتشاف الذكي، صفحات بيع
                مقنعة، وتوسعة واضحة إلى haircare وbodycare والأدوات والمجموعات،
                مع بنية SEO وSchema جاهزة من أول يوم.
              </p>
              <div className={styles.heroActions}>
                <TrackedLink
                  className={styles.primaryAction}
                  href="/shop"
                  analyticsLabel="hero_shop_hub"
                  analyticsSurface="home_hero"
                  analyticsDestinationType="shop_index"
                >
                  اكتشفي المتجر
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryAction}
                  href="/journal"
                  analyticsLabel="hero_journal"
                  analyticsSurface="home_hero"
                  analyticsDestinationType="journal_index"
                >
                  ابدئي من المجلة
                </TrackedLink>
              </div>
              <ul className={styles.metricList} aria-label="مؤشرات التجربة">
                <li>
                  <strong>Concern-led</strong>
                  <span>صفحات حسب المشكلة والمكوّن والروتين.</span>
                </li>
                <li>
                  <strong>Mobile-first</strong>
                  <span>بنية مرنة للجوال قبل أي اتساع بصري على الديسكتوب.</span>
                </li>
                <li>
                  <strong>SEO-ready</strong>
                  <span>Metadata وStructured Data من البداية، لا كإضافة لاحقة.</span>
                </li>
              </ul>
            </div>

            <aside className={styles.heroPanel} aria-label="ملخص التشغيل">
              <div className={styles.panelBadge}>MVP Foundation</div>
              <div className={styles.panelCard}>
                <p>اتجاه بصري</p>
                <h2>Pearl Veil Atelier</h2>
                <span>
                  فخامة هادئة، مواد ناعمة، وتحرير بصري يناسب السوق السعودي بدل
                  كليشيهات متاجر الجمال المعتادة.
                </span>
              </div>
              <div className={styles.panelStack}>
                <div>
                  <p>التأسيس الحالي</p>
                  <strong>Next.js + App Router</strong>
                </div>
                <div>
                  <p>نواة التحويل</p>
                  <strong>Home + Shop hub + Collections + Journal + Trust</strong>
                </div>
              </div>
            </aside>
          </section>

          <section className={styles.section} id="categories">
            <div className={styles.sectionHead}>
              <p>Shop architecture</p>
              <h2>أطلس متجر أوضح يوسّع الفئات من دون كسر منطق القرار أو الـ SEO.</h2>
            </div>
            <div className={styles.entryGrid}>
              {homeEntryPoints.map((entry) => (
                <TrackedLink
                  key={entry.title}
                  href={entry.href}
                  className={styles.entryCard}
                  analyticsLabel={`home_entry_${entry.subtitle.toLowerCase().replaceAll(" ", "_").replaceAll("-", "_")}`}
                  analyticsSurface="home_entry_points"
                  analyticsDestinationType={entry.destinationType}
                >
                  <span>{entry.subtitle}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                </TrackedLink>
              ))}
            </div>
          </section>

          <section className={styles.featuredSection} id="bestsellers">
            <div className={styles.sectionHead}>
              <p>Curated commerce</p>
              <h2>مختارات تأسيسية لصفحات منتج تقنع وتبيع من دون ضجيج بصري.</h2>
            </div>
            <div className={styles.productGrid}>
              {featuredProducts.map((product) => (
                <article key={product.name} className={styles.productCard}>
                  <div className={styles.productGlow} />
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.note}</p>
                  <TrackedLink
                    href={product.href}
                    analyticsLabel={`featured_${product.name.toLowerCase().replaceAll(" ", "_")}`}
                    analyticsSurface="home_featured_products"
                  >
                    استعراض المسار المرتبط
                  </TrackedLink>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.splitSection}>
            <div className={styles.splitBlock}>
              <p>Ingredient stories</p>
              <h2>المحتوى التجاري هنا يشرح قبل أن يبيع.</h2>
              <div className={styles.ingredientList}>
                {ingredients.map((ingredient) => (
                  <TrackedLink
                    key={ingredient.slug}
                    href={`/ingredients/${ingredient.slug}`}
                    className={styles.ingredientLink}
                    analyticsLabel={`home_ingredient_${ingredient.slug}`}
                    analyticsSurface="home_ingredient_stories"
                    analyticsDestinationType="ingredient"
                  >
                    <h3>{ingredient.title}</h3>
                    <p>{ingredient.role}</p>
                  </TrackedLink>
                ))}
              </div>
              <TrackedLink
                className={styles.secondaryAction}
                href="/ingredients"
                analyticsLabel="home_ingredients_hub"
                analyticsSurface="home_ingredient_stories"
                analyticsDestinationType="ingredient_index"
              >
                استعراض Hub المكوّنات
              </TrackedLink>
            </div>

            <div className={styles.splitBlock}>
              <p>Conversion logic</p>
              <h2>التحويل مبني على الثقة والوضوح، لا على ازدحام العروض.</h2>
              <ul className={styles.signalList}>
                <li>Sticky actions على الجوال مع توضيح الشحن والتوصيل.</li>
                <li>ربط المنتجات بروتينات ومشاكل ومكوّنات لرفع AOV بطريقة منطقية.</li>
                <li>نسخ عربية أنيقة تتجنب أي ادعاءات علاجية أو شبه طبية.</li>
              </ul>
            </div>
          </section>

          <section className={styles.section} id="journal">
            <div className={styles.sectionHead}>
              <p>Beauty journal</p>
              <h2>المجلة ليست إضافة شكلية، بل ذراع ثقة وSEO وAEO وبيع.</h2>
            </div>
            <div className={styles.journalGrid}>
              {journalArticles.map((entry) => (
                <article key={entry.slug} className={styles.journalCard}>
                  <span>{entry.category}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.excerpt}</p>
                  <TrackedLink
                    href={`/journal/${entry.slug}`}
                    analyticsLabel={`journal_card_${entry.slug}`}
                    analyticsSurface="home_journal"
                    analyticsDestinationType="article"
                  >
                    قراءة المقال
                  </TrackedLink>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.foundationSection} id="trust">
            <div className={styles.foundationCard}>
              <p>Legal and trust</p>
              <h2>الثقة النظامية جزء من التصميم، وليست فوتر مهمل.</h2>
              <span>
                صفحات السياسات، بيانات المنشأة، ووضوح التوصيل والاسترجاع يجب أن
                تظهر داخل التجربة الأساسية من أول نسخة إطلاق.
              </span>
              <TrackedLink
                href="/trust"
                analyticsLabel="trust_center"
                analyticsSurface="home_trust"
                analyticsDestinationType="trust"
              >
                استعراض مركز الثقة
              </TrackedLink>
            </div>
            <div className={styles.foundationCard}>
              <p>Search and schema</p>
              <h2>الصفحة التأسيسية جاهزة لتوسيع metadata وschema والربط الداخلي.</h2>
              <span>
                هذه البداية تربط الواجهة من الآن بهيكل `CollectionPage` و`Product`
                و`WebSite` بدل تأجيلها حتى تتراكم الديون التقنية.
              </span>
              <TrackedLink
                href="/shop/skincare"
                analyticsLabel="schema_collection_entry"
                analyticsSurface="home_schema"
                analyticsDestinationType="collection"
              >
                الانتقال إلى صفحة الفئة
              </TrackedLink>
            </div>
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
