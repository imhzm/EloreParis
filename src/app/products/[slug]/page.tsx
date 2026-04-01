import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  collectionDirectory,
  getIngredientByName,
  getProductBySlug,
  journalArticles,
  products,
} from "@/lib/site-content";
import styles from "../../discovery-page.module.css";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {};
  }

  return {
    title: `${product.name} | ${product.category}`,
    description: product.description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedArticles = journalArticles.filter(
    (article) => article.relatedProduct === `/products/${product.slug}`,
  );
  const collectionEntry = collectionDirectory[product.collection];
  const linkedIngredient = getIngredientByName(product.ingredient);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description,
        category: product.category,
        url: absoluteUrl(`/products/${product.slug}`),
        sku: product.variants[0]?.sku,
        brand: {
          "@type": "Brand",
          name: product.brand,
        },
        inLanguage: "ar-SA",
        offers: product.variants.map((variant) => ({
          "@type": "Offer",
          sku: variant.sku,
          url: absoluteUrl(`/products/${product.slug}`),
          priceCurrency: "SAR",
          price: variant.price,
          availability: `https://schema.org/${variant.availability}`,
          itemCondition: "https://schema.org/NewCondition",
        })),
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Texture",
            value: product.texture,
          },
          {
            "@type": "PropertyValue",
            name: "Finish",
            value: product.finish,
          },
          {
            "@type": "PropertyValue",
            name: "Usage timing",
            value: product.usageTiming,
          },
        ],
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
            name: collectionEntry.title,
            item: absoluteUrl(collectionEntry.href),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: absoluteUrl(`/products/${product.slug}`),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: product.questions.map((item) => ({
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
              <p className={styles.eyebrow}>{product.category}</p>
              <h1>{product.name}</h1>
              <p className={styles.summary}>{product.subtitle}</p>
              <p className={styles.summary}>{product.description}</p>

              <div className={styles.badgeList}>
                {product.badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>

              <div className={styles.actionRow}>
                <TrackedLink
                  className={styles.primaryLink}
                  href={collectionEntry.href}
                  analyticsLabel={`product_back_to_collection_${product.slug}`}
                  analyticsSurface="product_hero"
                  analyticsDestinationType="collection"
                >
                  {`العودة إلى ${collectionEntry.title}`}
                </TrackedLink>
                <TrackedLink
                  className={styles.secondaryLink}
                  href={product.pairings[0]?.href ?? "/journal"}
                  analyticsLabel={`product_primary_pairing_${product.slug}`}
                  analyticsSurface="product_hero"
                >
                  استعراض المسار المرتبط
                </TrackedLink>
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Starting price</p>
                <div className={styles.priceRow}>
                  <strong className={styles.price}>{product.priceFrom} ر.س</strong>
                </div>
                <div className={styles.metricList}>
                  <div className={styles.statRow}>
                    <strong>{product.usageTiming}</strong>
                    <span>التوقيت الأنسب داخل الروتين</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>{product.finish}</strong>
                    <span>النتيجة النهائية المتوقعة على البشرة</span>
                  </div>
                  <div className={styles.statRow}>
                    <strong>{product.shippingNote}</strong>
                    <span>وعد تشغيلي أولي قبل ربط محرك التجارة</span>
                  </div>
                </div>
              </div>

              <div className={styles.asideCard}>
                <ProductPurchasePanel
                  productSlug={product.slug}
                  productName={product.name}
                  variants={product.variants}
                  shippingNote={product.shippingNote}
                />
              </div>

              <div className={styles.asideCard}>
                <p className={styles.eyebrow}>Fit summary</p>
                <h2>ملف المنتج بسرعة</h2>
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <strong>المشكلة</strong>
                    <span className={styles.metaValue}>{product.concern}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <strong>المكوّن البارز</strong>
                    <span className={styles.metaValue}>{product.ingredient}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <strong>الملمس</strong>
                    <span className={styles.metaValue}>{product.texture}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <strong>خطوة الروتين</strong>
                    <span className={styles.metaValue}>{product.routineStep}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.mainColumn}>
              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Variants</p>
                <h2>هيكل واضح للأحجام والسعر والتوفر</h2>
                <div className={styles.variantGrid}>
                  {product.variants.map((variant) => (
                    <article key={variant.sku} className={styles.variantCard}>
                      <div className={styles.variantTop}>
                        <div>
                          <p className={styles.eyebrow}>{variant.label}</p>
                          <h3>{variant.size}</h3>
                        </div>
                        <span
                          className={`${styles.availability} ${
                            variant.availability === "PreOrder"
                              ? styles.availabilityPending
                              : ""
                          }`}
                        >
                          {variant.availability === "InStock" ? "متاح" : "طلب مسبق"}
                        </span>
                      </div>
                      <div className={styles.priceRow}>
                        <strong className={styles.price}>{variant.price} ر.س</strong>
                        {variant.compareAtPrice ? (
                          <span className={styles.comparePrice}>
                            {variant.compareAtPrice} ر.س
                          </span>
                        ) : null}
                      </div>
                      <p>
                        SKU: {variant.sku}. هذا العرض يجهز الصفحة لربط الكتالوج
                        الحقيقي والسلة لاحقًا من دون تغيير معماري كبير.
                      </p>
                    </article>
                  ))}
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Why it fits</p>
                <h2>فوائد واضحة وطريقة استخدام لا تربك العميلة</h2>
                <div className={styles.infoGrid}>
                  <article className={styles.infoCard}>
                    <strong>ما الذي تقدمه الصفحة؟</strong>
                    <ul className={styles.list}>
                      {product.benefits.map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                      ))}
                    </ul>
                  </article>

                  <article className={styles.infoCard}>
                    <strong>كيف يندمج داخل الروتين؟</strong>
                    <ul className={styles.list}>
                      {product.usage.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </article>

              <article className={styles.sectionCard}>
                <p className={styles.sectionTitle}>Ingredient story</p>
                <h2>مكوّنات بارزة، INCI، وتحذيرات استخدام</h2>
                <div className={styles.infoGrid}>
                  <article className={styles.infoCard}>
                    <strong>التركيز التحريري</strong>
                    <ul className={styles.list}>
                      {product.ingredientsHighlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className={styles.infoCard}>
                    <strong>تحذيرات الاستخدام</strong>
                    <ul className={styles.list}>
                      {product.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </article>
                </div>

                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <strong>INCI</strong>
                    <span className={styles.metaValue}>{product.inciList}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <strong>بلد المنشأ</strong>
                    <span className={styles.metaValue}>{product.origin}</span>
                  </div>
                </div>
                {linkedIngredient ? (
                  <div className={styles.linkList}>
                    <TrackedLink
                      href={`/ingredients/${linkedIngredient.slug}`}
                      analyticsLabel={`product_ingredient_${product.slug}_${linkedIngredient.slug}`}
                      analyticsSurface="product_ingredient_story"
                      analyticsDestinationType="ingredient"
                    >
                      <span>{`الانتقال إلى صفحة ${linkedIngredient.title}`}</span>
                      <span>Ingredient page</span>
                    </TrackedLink>
                  </div>
                ) : null}
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Skin fit</p>
                <h2>لمن صُممت هذه الصفحة؟</h2>
                <div className={styles.chipList}>
                  {product.skinTypes.map((type) => (
                    <span key={type}>{type}</span>
                  ))}
                </div>
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <strong>البراند</strong>
                    <span className={styles.metaValue}>{product.brand}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <strong>التوقيت</strong>
                    <span className={styles.metaValue}>{product.usageTiming}</span>
                  </div>
                </div>
              </article>

              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Pairings</p>
                <h2>روابط تقرّب القرار من السلة</h2>
                <div className={styles.linkList}>
                  {product.pairings.map((item) => (
                    <TrackedLink
                      key={item.href}
                      href={item.href}
                      analyticsLabel={`product_pairing_${product.slug}_${item.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                      analyticsSurface="product_pairings"
                    >
                      <span>{item.label}</span>
                      <span>مسار مرتبط</span>
                    </TrackedLink>
                  ))}
                </div>
              </article>

              <article className={styles.asideCard}>
                <p className={styles.eyebrow}>Editorial support</p>
                <h2>مقالات تدعم نفس النية</h2>
                {relatedArticles.length ? (
                  <div className={styles.linkList}>
                    {relatedArticles.map((article) => (
                      <TrackedLink
                        key={article.slug}
                        href={`/journal/${article.slug}`}
                        analyticsLabel={`product_article_${product.slug}_${article.slug}`}
                        analyticsSurface="product_editorial_support"
                        analyticsDestinationType="article"
                      >
                        <span>{article.title}</span>
                        <span>{article.readingTime}</span>
                      </TrackedLink>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyCopy}>
                    سيتم ربط هذه الصفحة بمقالات إضافية فور اتساع مخطط المجلة
                    التحريري.
                  </p>
                )}
              </article>
            </aside>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2>أسئلة متوقعة قبل تفعيل الشراء الفعلي</h2>
            <div className={styles.faqList}>
              {product.questions.map((item) => (
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
