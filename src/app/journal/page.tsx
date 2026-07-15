import type { Metadata } from "next";
import { CinematicDetailStage } from "@/components/cinematic-detail-stage";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import { absoluteUrl, journalArticles } from "@/lib/site-content";
import styles from "./journal.module.css";

export const metadata: Metadata = {
  title: "المجلة",
  description:
    "مجلة جمال ÉLORÉ PARIS: أدلة درجات وروتينات ومحتوى عربي واضح يساعدك على الاختيار من دون ضجيج.",
  alternates: {
    canonical: "/journal",
  },
};

const pillarDirectory: Record<
  string,
  { description: string; href: string; label: string; destinationType: string }
> = {
  "المشكلة والقرار الأول": {
    description:
      "مقالات تبدأ من ارتباك المشكلة نفسها وتعيد ترتيب السؤال قبل الانتقال إلى المنتج أو الروتين أو المكوّن.",
    href: "/concerns",
    label: "البدء من صفحات المشكلة",
    destinationType: "concern_index",
  },
  "اختيار المنتج والشراء": {
    description:
      "مقالات تقلل الحيرة قبل الانتقال إلى الفئة أو المنتج وتشرح كيف يتحول السؤال التجاري إلى قرار واضح.",
    href: "/shop",
    label: "الانتقال إلى المتجر",
    destinationType: "collection",
  },
  "المكوّنات بلا تعقيد": {
    description:
      "شرح للمكوّنات بلغة تقود إلى الفهم ثم إلى صفحات المكوّنات والمنتجات بدل إبقاء البحث نظريًا.",
    href: "/ingredients",
    label: "استكشاف المكوّنات",
    destinationType: "ingredient_index",
  },
  "الروتينات العملية": {
    description:
      "روتينات تبني الترتيب اليومي وتربط بين الخطوات والملمس وسبب وجود كل خطوة داخل الاستخدام الفعلي.",
    href: "/routines",
    label: "بناء روتين أوضح",
    destinationType: "routine_index",
  },
  "أدلة السياق اليومي": {
    description:
      "أدلة تربط المناخ والاستخدام اليومي ونية البحث بصفحات المشكلة والمنتج والروتين داخل المتجر.",
    href: "/concerns",
    label: "البدء من المشكلة",
    destinationType: "concern_index",
  },
};

const issueDirectory: Record<
  string,
  { description: string; focus: string[] }
> = {
  "Issue 01": {
    description:
      "الدفعة الافتتاحية التي ثبّتت pillars المجلة وربطت skincare وmakeup بالمنتجات والمكونات والروتينات الأساسية.",
    focus: ["Skincare", "Makeup", "Ingredients", "Routines"],
  },
  "Issue 02": {
    description:
      "دفعة توسّع تربط السياق السعودي وجماليات الترحال والاستخدام اليومي بمسارات beauty-sets وtools وhaircare وbodycare.",
    focus: ["Beauty Sets", "Tools", "Haircare", "Bodycare"],
  },
  "Issue 03": {
    description:
      "دفعة قرار تُغلق الفجوات بين نية البحث والشراء: تهدئة البشرة الحساسة، فهم فيتامين C صباحًا، اقتصاديات beauty-sets، وهدايا أكثر اتساقًا مع المناسبة.",
    focus: ["Sensitive Skin", "Vitamin C", "Beauty Sets", "Gifting"],
  },
  "Issue 04": {
    description:
      "دفعة ترسيخ تركز على العمق التطبيقي: روتين مسائي أبسط، ثبات المكياج بدون ثقل، فهم أدق للهيالورونيك أسيد في الأجواء الحارة والجافة، وبداية أوضح للمشتري الجديد في beauty-sets.",
    focus: ["Evening Reset", "Longwear Makeup", "Hyaluronic Acid", "First-time Buyers"],
  },
  "Issue 05": {
    description:
      "دفعة متابعة القرار بعد أول استخدام: ضبط مسار التصبغات بعد 30 يوم، فصل longwear بين الدوام والمناسبة، توضيح pairing بين niacinamide وhyaluronic acid، واختيار beauty-sets للهدايا بمنطق الميزانية.",
    focus: [
      "Pigmentation Follow-up",
      "Longwear Scenarios",
      "Ingredient Pairing",
      "Budget Gifting",
    ],
  },
  "Issue 06": {
    description:
      "دفعة تثبيت ما بعد الشراء: استقرار البشرة الحساسة مع تغير الطقس، ترتيب الترطيب بين التكييف والخروج، حسم قرار الحزم ضد الشراء الفردي، وبناء استمرارية الروتين بعد الأسبوع الثاني.",
    focus: [
      "Sensitive-Skin Stability",
      "Hydration Transition",
      "Bundle vs Single Decision",
      "Post-purchase Retention",
    ],
  },
  "Issue 07": {
    description:
      "دفعة استمرارية الاستخدام اليومية: تجديد الحماية فوق المكياج بدون تكتل، استعادة الروتين بعد الانقطاع، تثبيت نظافة الأدوات، وإعادة ضبط المساء بعد الإزالة المتأخرة.",
    focus: [
      "Sunscreen Reapplication",
      "Consistency Recovery",
      "Tools Hygiene Cadence",
      "Evening Reset Recovery",
    ],
  },
  "Issue 08": {
    description:
      "دفعة استعادة التوازن بعد اضطراب اليوم: ضبط الترطيب بين التكييف والحرارة، ترتيب التراجع بعد الإفراط في الطبقات، تحديد توقيت إعادة الشراء بين المنتج المفرد والمجموعة، وبناء صباح تعويضي قصير بعد مساء مضطرب.",
    focus: [
      "Hydration Balance Reset",
      "Over-layering Recovery",
      "Replenishment Timing",
      "Fast Morning Recovery",
    ],
  },
  "Issue 09": {
    description:
      "دفعة استمرارية المسارات التوسعية: قرار touch-up مقابل إعادة الترتيب قبل المساء، اختيار gift set حسب السيناريو، استعادة haircare بعد السفر أو تغيّر الطقس، وبناء نقطة عودة أوضح لروتين bodycare.",
    focus: [
      "Occasion Touch-up Logic",
      "Gift-set Scenario Fit",
      "Haircare Continuity",
      "Bodycare Recovery",
    ],
  },
  "Issue 10": {
    description:
      "دفعة بناء الثقة والاعتراضات: ثقة إعادة الشراء بعد نجاح فعلي، proof أوضح لانتقال المكياج من النهار إلى المساء، fit notes تقلل تردد haircare، واستمرارية bodycare التي تقوي التكرار بدون شراء زائد.",
    focus: [
      "Repeat-purchase Confidence",
      "Day-to-Evening Makeup Proof",
      "Haircare Fit Notes",
      "Bodycare Repeat Behavior",
    ],
  },
  "Issue 11": {
    description:
      "دفعة ترتيب الإثبات قبل التوسع: proof أوضح لروتين skincare الذي يعمل جزئيًا، حل الاعتراضات الفعلية قبل إعادة base makeup من الصفر، تحويل زيارات beauty-sets إلى next steps محددة، وبناء منطق repeat-use داخل bodycare قبل أي توسع جديد.",
    focus: [
      "Proof Before Switching",
      "Objection-first Makeup Decisions",
      "Expansion-route Next Steps",
      "Repeat-use Logic",
    ],
  },
  "Issue 12": {
    description:
      "دفعة تقوية الجسر التجاري: proof أوضح قبل ترقية routine جيد بما يكفي، انتقال أكثر دقة من concern التصبغات إلى product confidence، جسور تحريرية تقلل hesitation قبل beauty-sets، ومنطق توسع haircare مبني على repeat use لا على الحماس وحده.",
    focus: [
      "Commercial Proof",
      "Concern-to-product Confidence",
      "Editorial-to-conversion Bridges",
      "Repeat-use Merchandising",
    ],
  },
  "Issue 13": {
    description:
      "دفعة ما بعد التحويل: proof أوضح بعد أول إعادة شراء، فصل replenishment الفردي عن العودة إلى bundle، تضييق searches التي تبدو ingredient-led لكنها في الحقيقة أسئلة comfort وlayering، وبناء bridge أوضح من إجابة Journal إلى routine choice قبل checkout.",
    focus: [
      "Post-conversion Proof",
      "Replenishment vs Bundle Confidence",
      "Narrower Search Intent",
      "Journal-to-routine Bridges",
    ],
  },
  "Issue 14": {
    description:
      "دفعة تضييق الاعتراضات وإشارات القرار: اعتراضات أوضح بعد الدورة الثانية قرب الـPDP، restock cues تمنع كسر الروتين قبل النفاد الكامل، تصحيح myth عالي النية حول longwear، وجسر أدق من فهم niacinamide إلى category أو product decision.",
    focus: [
      "PDP-adjacent Objections",
      "Restock Timing Cues",
      "High-intent Myth Handling",
      "Journal-to-category/Product Bridges",
    ],
  },
  "Issue 15": {
    description:
      "دفعة ضبط المقارنة قبل التوسّع: منطق أوضح لمقارنة الدورة الثانية قرب الـPDP، حكم أدق بين النفاد والترقية قبل إعادة الطلب، تضييق intent بين ingredient وconcern في البحث العالي النية، وجسر أقرب من إجابة المقالة إلى collection أو PDP جاهز للشراء.",
    focus: [
      "Second-cycle Comparison Logic",
      "Depletion vs Upgrade Judgment",
      "High-intent Search Clarifiers",
      "Journal-to-collection/PDP Bridges",
    ],
  },
  "Issue 16": {
    description:
      "دفعة تضييق الحكم قبل الدفع: فصل أوضح بين المنتج والروتين عندما يكون second-cycle proof مختلطًا، حواجز أدق لإعادة الطلب عندما تكون depletion cues غير ثابتة، clarifiers أضيق لأسئلة layering وtiming قبل زيارة الفئة، وhandoff أقرب من المقالة إلى PDP بعد حسم collection.",
    focus: [
      "Product-vs-Routine Comparison",
      "Repeat-order Guardrails",
      "Search Clarifiers Before Category Visits",
      "Journal-to-PDP Handoffs",
    ],
  },
  "Issue 17": {
    description:
      "دفعة تثبيت الحكم قبل التبديل: الحفاظ على المنتج أو reset الروتين عندما ينحرف الاستخدام، توقيت reorder أوضح مع تغيّر cadence بين الأسابيع والمواسم، clarifier أدق لأسئلة haircare بين weather recovery وproduct mismatch، وحسم اعتراضات الـPDP حول finish وtexture وusage بعد حسم collection.",
    focus: [
      "Keep-vs-Reset Judgments",
      "Cadence-based Reorder Timing",
      "Haircare Fit Clarifiers",
      "PDP-near Finish and Texture Objections",
    ],
  },
  "Issue 18": {
    description:
      "دفعة تضييق القرار قبل الشراء المتكرر: فصل mixed-proof بين أثر الموسم وانحراف الروتين، حسم restock المفرد مقابل العودة إلى set عند إشارات نفاد مربكة، توضيح finish مقابل coverage قبل زيارة makeup PDP، وبناء جسر أوضح بين weather effect وproduct fit داخل haircare.",
    focus: [
      "Season-vs-Routine Mixed-proof Decisions",
      "Restock vs Set Return Logic",
      "Finish-vs-Coverage Clarifiers",
      "Weather-vs-Product-fit Haircare Bridges",
    ],
  },
  "Issue 19": {
    description:
      "دفعة تدقيق التحوّل قبل الدفع: تمييز التذبذب القصير عن التراجع الحقيقي قبل switch في skincare، حسم single-restock مقابل set-return عند تعارض القيمة مع بساطة الروتين، توضيح سؤال base finish مقابل longwear قبل makeup PDP، وتعميق جسر humidity-versus-fit قبل handoff في haircare.",
    focus: [
      "Short-cycle Keep-vs-Switch Decisions",
      "Single-restock vs Set-return Logic",
      "Base Finish vs Longwear Clarifiers",
      "Humidity-vs-Fit Handoff Bridges",
    ],
  },
  "Issue 20": {
    description:
      "دفعة تحويل القرار إلى فعل قبل الدفع: حسم reorder مقابل upgrade عند ثبات النتيجة مع هبوط الثقة، ترتيب proof المناسب لاعتراض long-day longwear قبل PDP، فصل مسؤولية routine drift عن product mismatch في haircare، وتحديد متى تنتقل من Journal إلى category أو مباشرة إلى PDP دون تصفح مفتوح.",
    focus: [
      "Reorder-vs-Upgrade Confidence Rules",
      "Long-day Longwear Proof Priority",
      "Routine-drift vs Product-mismatch Ownership",
      "Journal-to-Category/PDP Action Bridge",
    ],
  },
  "Issue 21": {
    description:
      "دفعة ضغط القرار قبل الدفع: قواعد post-upgrade validation قبل full reorder، تشخيص longwear breakdown بين sweat وsebum وapplication drift، حسم keep-tuning مقابل product mismatch بعد weather-adjustment في haircare، وتحديد متى يكون Journal-to-PDP direct أفضل من category revisit.",
    focus: [
      "Post-upgrade Validation Before Full Reorder",
      "Longwear Breakdown Diagnostics",
      "Weather-adjusted Haircare Handoff Rules",
      "High-intent Journal-to-PDP Compression",
    ],
  },
  "Issue 22": {
    description:
      "دفعة تثبيت القرار قبل الدفع: تحديد عتبات reorder confidence بعد دورة أو دورتين، ترياج فشل longwear بين finish mismatch وحدود durability، فحص friction في haircare بعد استقرار الطقس، وربط Journal بخطوة pre-checkout أدق للمستخدم product-leaning.",
    focus: [
      "Reorder-confidence Thresholds",
      "Finish-vs-Durability Longwear Triage",
      "Post-weather Haircare Friction Checks",
      "Journal-to-Checkout Decision Bridge",
    ],
  },
  "Issue 23": {
    description:
      "دفعة إغلاق التردد الأخير قبل الشراء: قواعد keep-versus-introduce عند ثبات الروتين مع micro-gap واحد، مسارات طمأنة longwear بين touch-up وfull base restart، حسم simplification مقابل replacement في haircare بعد أسبوع مستقر، وربط Journal بمسار PDP-to-cart عندما يبقى اعتراض واحد فقط.",
    focus: [
      "Keep-vs-Introduce Micro-gap Rules",
      "Longwear Reassurance Before Checkout",
      "Post-friction Haircare Simplification vs Replacement",
      "High-intent Journal-to-PDP-to-Cart Progression",
    ],
  },
  "Issue 24": {
    description:
      "دفعة حسم ما قبل الدفع: إغلاق الاعتراض الأخير بعد المقال قبل cart continuation، ضغط التحقق داخل PDP بين proof snippet وfull comparison، تثبيت عتبات maintenance في haircare بعد نجاح simplification قبل إعادة فتح replacement، وإضافة reorder confirmation prompt بعد حل أول اعتراض high-intent.",
    focus: [
      "Post-article Objection Closure",
      "PDP Proof Compression",
      "Haircare Maintenance Thresholds",
      "Reorder Confirmation Prompts",
    ],
  },
  "Issue 25": {
    description:
      "دفعة تقليل التردد قبل الدفع: cart-readiness checks بعد PDP verification، ضغط concern-to-PDP objection بعد category fallback، قواعد تأكيد replacement في haircare بعد maintenance-window drift، وحواجز repeat-order عندما تكون الثقة مرتفعة لكن توقيت النفاد غير ثابت.",
    focus: [
      "Cart-readiness Checks",
      "Concern-to-PDP Objection Compression",
      "Haircare Replacement Confirmation",
      "Repeat-order Guardrails",
    ],
  },
  "Issue 26": {
    description:
      "دفعة إحكام القرار القريب من الدفع: ضغط اعتراض checkout قبل loop تبديل طرق الدفع، handoff proof أوضح من PDP إلى cart عند تردد شحن/ثقة واحد، فصل rebound الرطوبة في haircare بين maintenance وreplacement، وضبط repeat-order بعد travel-week usage drift.",
    focus: [
      "Checkout Objection Compression",
      "PDP-to-Cart Trust-proof Handoff",
      "Haircare Rebound Decision Rules",
      "Repeat-order Confidence After Usage Drift",
    ],
  },
  "Issue 27": {
    description:
      "دفعة تثبيت قرار الدفع النهائي: فحص coupon distraction قرب التأكيد، handoff ثقة لنافذة التوصيل من PDP إلى cart، قواعد keep-versus-replace بعد دورتين rebound في haircare، وguardrails توقيت repeat-order أثناء استعادة الإيقاع بعد السفر.",
    focus: [
      "Coupon-distraction Guardrails",
      "Delivery-window Trust Handoff",
      "Haircare Keep-vs-Replace Cycles",
      "Post-travel Repeat-order Timing",
    ],
  },
  "Issue 28": {
    description:
      "دفعة استعادة الثبات قرب الإتمام: recovery بعد coupon rejection في checkout، handoff ثقة من سياق PDP إلى تنفيذ cart قبل الدفع، فحص ثبات keep في haircare خلال نافذة الرطوبة التالية، وضبط refill urgency عندما يعود الإيقاع بعد السفر بشكل شبه مستقر.",
    focus: [
      "Coupon-rejection Recovery",
      "Payment-step Confidence Handoff",
      "Post-keep Haircare Stability",
      "Refill-urgency Controls",
    ],
  },
  "Issue 29": {
    description:
      "دفعة إحكام قرار التأكيد النهائي: ضبط checkout confirmation بعد payment-option toggling، handoff ثقة أوضح لالتزام التوصيل من PDP إلى cart، التقاط second-window drift في haircare بعد أول استقرار، وضبط repeat-order volume عندما تكون refill urgency أعلى من وضوح الاستهلاك.",
    focus: [
      "Payment-option Toggle Control",
      "Delivery-commitment Confidence Handoff",
      "Haircare Second-window Drift Checks",
      "Repeat-order Volume Controls",
    ],
  },
};

function getArticleIssue(article: (typeof journalArticles)[number]) {
  return article.issue ?? "Issue 01";
}

function getIssueOrder(issue: string) {
  const match = issue.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export default function JournalPage() {
  const featuredArticle =
    journalArticles.find((article) => article.featured) ?? journalArticles[0];
  const issueGroups = journalArticles
    .reduce<Array<{ issue: string; articles: typeof journalArticles }>>(
      (groups, article) => {
        const issue = getArticleIssue(article);
        const currentGroup = groups.find((group) => group.issue === issue);

        if (currentGroup) {
          currentGroup.articles.push(article);
          return groups;
        }

        groups.push({ issue, articles: [article] });
        return groups;
      },
      [],
    )
    .sort((left, right) => getIssueOrder(right.issue) - getIssueOrder(left.issue));
  const pillarGroups = journalArticles.reduce<
    Array<{ pillar: string; articles: typeof journalArticles }>
  >((groups, article) => {
    const currentGroup = groups.find((group) => group.pillar === article.pillar);

    if (currentGroup) {
      currentGroup.articles.push(article);
      return groups;
    }

    groups.push({ pillar: article.pillar, articles: [article] });
    return groups;
  }, []);
  const latestIssue = issueGroups[0];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "مجلة الجمال",
        url: absoluteUrl("/journal"),
      },
      {
        "@type": "ItemList",
        itemListElement: journalArticles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: article.title,
          url: absoluteUrl(`/journal/${article.slug}`),
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
          <CinematicDetailStage
            eyebrow="The beauty journal"
            title="Read slowly. Choose with more confidence."
            summary="Editorial guidance that connects questions, rituals, and considered beauty choices."
            purchaseHref="#issue-directory"
            collectionHref="/shop"
            collectionLabel="Explore the shop"
            analyticsKey="journal_hub"
          />
          <section className={styles.hero}>
            <div className={styles.heroLayout}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Beauty Journal</p>
                <h1>المجلة هنا لتشرح، ترتب القرار، ثم تقود إلى شراء أذكى.</h1>
                <p>
                  هذه ليست مدونة شكلية. هي نظام تحريري افتتاحي يربط السؤال الذي
                  تبدأ منه الزائرة بصفحات المكوّنات والروتينات والفئات والمنتجات
                  بدل ترك المحتوى منفصلًا عن التجارة.
                </p>
              </div>
              <div className={styles.heroStats}>
                <article className={styles.statCard}>
                  <span className={styles.statLabel}>الدفعات الحية</span>
                  <strong className={styles.statValue}>
                    {issueGroups.length} دفعات تحريرية
                  </strong>
                </article>
                <article className={styles.statCard}>
                  <span className={styles.statLabel}>المسارات التحريرية</span>
                  <strong className={styles.statValue}>
                    {pillarGroups.length} محاور واضحة
                  </strong>
                </article>
                <article className={styles.statCard}>
                  <span className={styles.statLabel}>الدفعة النشطة</span>
                  <strong className={styles.statValue}>
                    {latestIssue?.issue ?? "Issue 01"} / {latestIssue?.articles.length ?? 0} مواد
                  </strong>
                </article>
              </div>
            </div>
          </section>

          <section id="issue-directory" className={styles.issueSection}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Issue Directory</p>
              <h2>الـ Journal الآن تعمل كدفعات واضحة، لا كقائمة مقالات متفرقة.</h2>
              <p>
                كل دفعة هنا لها هدف مختلف داخل الرحلة: افتتاح pillars أساسية، أو توسيع
                route families جديدة، أو بناء سياق محلي أقرب لطريقة الاستخدام الفعلية.
              </p>
            </div>
            <div className={styles.issueGrid}>
              {issueGroups.map((group) => {
                const issueEntry = issueDirectory[group.issue];
                const leadArticle =
                  group.articles.find((article) => article.featured) ??
                  group.articles[0];

                return (
                  <article key={group.issue} className={styles.issueCard}>
                    <span className={styles.pillLabel}>
                      {group.articles.length} مقالات
                    </span>
                    <h3>{group.issue}</h3>
                    <p>{issueEntry?.description ?? leadArticle.deck}</p>
                    <div className={styles.issueFocus}>
                      {(issueEntry?.focus ?? []).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className={styles.issueMeta}>
                      <span>{leadArticle.title}</span>
                      <span>{leadArticle.readingTime}</span>
                    </div>
                    <div className={styles.issueActions}>
                      <TrackedLink
                        href={`/journal/${leadArticle.slug}`}
                        analyticsLabel={`journal_issue_lead_${group.issue}_${leadArticle.slug}`}
                        analyticsSurface="journal_issue_directory"
                        analyticsDestinationType="article"
                      >
                        قراءة افتتاحية الدفعة
                      </TrackedLink>
                      <TrackedLink
                        className={styles.secondaryLink}
                        href={leadArticle.nextStep.href}
                        analyticsLabel={`journal_issue_next_${group.issue}_${leadArticle.slug}`}
                        analyticsSurface="journal_issue_directory"
                        analyticsDestinationType={leadArticle.nextStep.destinationType}
                      >
                        {leadArticle.nextStep.label}
                      </TrackedLink>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="editorial-lead" className={styles.featuredSection}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Editorial Lead</p>
              <h2>المقال الافتتاحي الذي يشرح من أين يبدأ القرار الآن</h2>
              <p>
                هذا هو المقال الذي يعرّف نبرة المجلة: سؤال يومي واضح، ثلاث نقاط
                قابلة للتطبيق، ثم انتقال مباشر إلى الخطوة التالية داخل المتجر.
              </p>
            </div>
            <article className={styles.featuredCard}>
              <div className={styles.featuredBody}>
                <span className={styles.pillLabel}>
                  {getArticleIssue(featuredArticle)} / {featuredArticle.category} / {featuredArticle.pillar}
                </span>
                <h3>{featuredArticle.title}</h3>
                <p className={styles.featuredDeck}>{featuredArticle.deck}</p>
                <p>{featuredArticle.excerpt}</p>
                <div className={styles.meta}>
                  <span>{featuredArticle.readingTime}</span>
                  <span>آخر تحديث: {featuredArticle.updatedAt}</span>
                </div>
              </div>
              <div className={styles.featuredAside}>
                <p className={styles.eyebrow}>Before Reading</p>
                <h3>ثلاث نقاط قبل القراءة</h3>
                <ul className={styles.bulletList}>
                  {featuredArticle.takeaways.map((takeaway) => (
                    <li key={takeaway}>{takeaway}</li>
                  ))}
                </ul>
                <div className={styles.actionRow}>
                  <TrackedLink
                    href={`/journal/${featuredArticle.slug}`}
                    analyticsLabel={`journal_featured_${featuredArticle.slug}`}
                    analyticsSurface="journal_featured"
                    analyticsDestinationType="article"
                  >
                    قراءة المقال الافتتاحي
                  </TrackedLink>
                  <TrackedLink
                    className={styles.secondaryLink}
                    href={featuredArticle.nextStep.href}
                    analyticsLabel={`journal_featured_next_step_${featuredArticle.slug}`}
                    analyticsSurface="journal_featured"
                    analyticsDestinationType={featuredArticle.nextStep.destinationType}
                  >
                    {featuredArticle.nextStep.label}
                  </TrackedLink>
                </div>
              </div>
            </article>
          </section>

          <section id="pillars" className={styles.pillarsSection}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Editorial System</p>
              <h2>المجلة الآن منظمة حول محاور قرار واضحة</h2>
              <p>
                بدل عرض المقالات كشبكة عشوائية، كل محور هنا يخدم مرحلة مختلفة من
                رحلة الشراء: مشكلة، مكوّن، روتين، أو قرار منتج.
              </p>
            </div>
            <div className={styles.pillarsGrid}>
              {pillarGroups.map((group) => {
                const pillarEntry = pillarDirectory[group.pillar];

                return (
                  <article key={group.pillar} className={styles.pillarCard}>
                    <span className={styles.pillLabel}>
                      {group.articles.length} مادة
                    </span>
                    <h3>{group.pillar}</h3>
                    <p>{pillarEntry?.description ?? group.articles[0]?.deck}</p>
                    <div className={styles.pillarList}>
                      {group.articles.slice(0, 3).map((article) => (
                        <TrackedLink
                          key={article.slug}
                          href={`/journal/${article.slug}`}
                          analyticsLabel={`journal_pillar_${group.pillar}_${article.slug}`}
                          analyticsSurface="journal_pillars"
                          analyticsDestinationType="article"
                        >
                          {article.title}
                        </TrackedLink>
                      ))}
                    </div>
                    {pillarEntry ? (
                      <TrackedLink
                        className={styles.secondaryLink}
                        href={pillarEntry.href}
                        analyticsLabel={`journal_pillar_route_${group.pillar}`}
                        analyticsSurface="journal_pillars"
                        analyticsDestinationType={pillarEntry.destinationType}
                      >
                        {pillarEntry.label}
                      </TrackedLink>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section id="issue-map" className={styles.articleClusters}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Issue Map</p>
              <h2>خريطة المقالات حسب نوع القرار الذي تخدمه</h2>
              <p>
                هذا الجزء يجعل فهرس المجلة أشبه بعدد افتتاحي منظم، لا مجرد قائمة
                عناوين. كل مجموعة هنا تقود إلى سؤال مختلف داخل التجربة.
              </p>
            </div>
            <div className={styles.clusterGrid}>
              {pillarGroups.map((group) => (
                <section key={group.pillar} className={styles.clusterPanel}>
                  <div className={styles.clusterHeader}>
                    <p className={styles.eyebrow}>{group.pillar}</p>
                    <h3>{group.articles.length} مقالات مرتبطة بهذا المسار</h3>
                  </div>
                  <div className={styles.articleGrid}>
                    {group.articles.map((article) => (
                      <article key={article.slug} className={styles.articleCard}>
                        <span className={styles.pillLabel}>{article.category}</span>
                        <h4>{article.title}</h4>
                        <p>{article.excerpt}</p>
                        <div className={styles.meta}>
                          <span>{article.readingTime}</span>
                          <span>{article.updatedAt}</span>
                        </div>
                        <div className={styles.cardActions}>
                          <TrackedLink
                            href={`/journal/${article.slug}`}
                            analyticsLabel={`journal_index_${article.slug}`}
                            analyticsSurface="journal_index"
                            analyticsDestinationType="article"
                          >
                            قراءة المقال
                          </TrackedLink>
                          <TrackedLink
                            className={styles.secondaryLink}
                            href={article.nextStep.href}
                            analyticsLabel={`journal_index_next_step_${article.slug}`}
                            analyticsSurface="journal_index"
                            analyticsDestinationType={article.nextStep.destinationType}
                          >
                            {article.nextStep.label}
                          </TrackedLink>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
