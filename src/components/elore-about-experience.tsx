import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
import { localizePath, type Locale } from "@/lib/i18n";
import type { TrustSupportRecord } from "@/lib/trust-support-content";
import styles from "./elore-about-experience.module.css";

const aboutCopy = {
  ar: {
    heroEyebrow: "قصة الجمال على طريقتنا",
    featureEyebrow: "مقالة مميزة",
    featureTitle: "من باريس، بكل حواسك.",
    featureBody: "نقرأ الجمال كلحظة مقصودة: صورة صادقة، معلومة واضحة، واختيار يترك مساحة للشخصية بدل أن يطغى عليها.",
    featureCta: "اقرئي مجلة إيلوري",
    quote: "الجمال الحقيقي لا يلفت النظر فقط؛ بل يترك أثرًا.",
    philosophy: "فلسفتنا",
    philosophyTitle: "الجمال بتوازن.",
    ritual: "طقوس الجمال",
    ritualTitle: "ابدئي من لحظتك، لا من رف مزدحم.",
    ritualBody: "رحلة قصيرة تساعدك على ترتيب التفضيلات، ثم تعرض فقط المنتجات المعتمدة القريبة من اختيارك.",
    ritualCta: "ابني طقسك الخاص",
    gifting: "إلهام الهدايا",
    giftingTitle: "هدية تعبّر عن ذوقك الرفيع.",
    giftingCta: "اكتشفي الهدايا",
    ingredients: "مكونات تُحدث فرقًا حين نفهم دورها",
    ingredientLinks: [["الورد الدمشقي", "/ingredients"], ["الفانيليا", "/ingredients"], ["البرغموت", "/ingredients"], ["زبدة الشيا", "/ingredients/shea-butter"]],
    questions: "أسئلة عن إيلوري",
    closing: "كل اختيار هو دعوة لتعيشي الجمال بطريقتك الخاصة.",
    closingCta: "تسوّقي المجموعة",
    concept: "صور تحريرية مفاهيمية · لا تمثل عبوات معتمدة للبيع.",
  },
  en: {
    heroEyebrow: "Our way of seeing beauty",
    featureEyebrow: "Featured story",
    featureTitle: "From Paris, through every sense.",
    featureBody: "We read beauty as an intentional moment: honest imagery, clearer information and a choice that leaves room for personality rather than overpowering it.",
    featureCta: "Read the ÉLORÉ journal",
    quote: "True beauty does more than draw the eye; it leaves an impression.",
    philosophy: "Our philosophy",
    philosophyTitle: "Beauty, held in balance.",
    ritual: "Beauty rituals",
    ritualTitle: "Begin with your moment, not an overcrowded shelf.",
    ritualBody: "A concise journey that arranges your preferences, then shows only approved products aligned with your choice.",
    ritualCta: "Build your ritual",
    gifting: "Gifting inspiration",
    giftingTitle: "A gift that speaks to considered taste.",
    giftingCta: "Discover gifting",
    ingredients: "Ingredients matter when their role is understood",
    ingredientLinks: [["Damask rose", "/ingredients"], ["Vanilla", "/ingredients"], ["Bergamot", "/ingredients"], ["Shea butter", "/ingredients/shea-butter"]],
    questions: "Questions about ÉLORÉ",
    closing: "Every choice is an invitation to experience beauty in your own way.",
    closingCta: "Shop the collection",
    concept: "Conceptual editorial imagery · not approved product packaging.",
  },
} as const;

export function EloreAboutExperience({ locale, record }: { locale: Locale; record: TrustSupportRecord }) {
  const copy = aboutCopy[locale];
  const href = (path: string) => localizePath(locale, path);

  return (
    <div className={styles.page} data-about-editorial>
      <header className={styles.hero} aria-labelledby="about-title">
        <div className={styles.heroMedia} aria-hidden="true">
          <Image src="/elore-assets/hero-perfume-ritual-desktop-v3.avif" alt="" fill priority sizes="100vw" />
        </div>
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{copy.heroEyebrow}</p>
          <h1 id="about-title">{record.title}</h1>
          <p>{record.summary}</p>
          <span>{copy.concept}</span>
        </div>
      </header>

      <main className={styles.canvas}>
        <section className={styles.storyGrid} aria-labelledby="about-feature-title">
          <article className={styles.featureCard}>
            <div className={styles.featureCopy}>
              <p className={styles.eyebrow}>{copy.featureEyebrow}</p>
              <h2 id="about-feature-title">{copy.featureTitle}</h2>
              <p>{copy.featureBody}</p>
              <TrackedLink href={href("/journal")} analyticsLabel="about_feature_journal" analyticsSurface="about_editorial">{copy.featureCta}</TrackedLink>
            </div>
            <div className={styles.featureMedia} aria-hidden="true">
              <Image src="/elore-assets/gifting-folds-concept-1536x1024.avif" alt="" fill sizes="(max-width: 760px) 100vw, 54vw" />
            </div>
          </article>
          <blockquote className={styles.quoteCard}>
            <span aria-hidden="true">“</span>
            <p>{copy.quote}</p>
            <cite>ÉLORÉ PARIS</cite>
          </blockquote>
        </section>

        <section className={styles.philosophy} aria-labelledby="about-philosophy-title">
          <header>
            <p className={styles.eyebrow}>{copy.philosophy}</p>
            <h2 id="about-philosophy-title">{copy.philosophyTitle}</h2>
            <p>{record.status}</p>
          </header>
          <div className={styles.principles}>
            {record.sections.map((section, index) => (
              <article key={section.title}>
                <span>0{index + 1}</span>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
            <article>
              <span>0{record.sections.length + 1}</span>
              <h3>{locale === "ar" ? "اختيار يحترم الحقيقة" : "A choice that respects truth"}</h3>
              <p>{locale === "ar" ? "لا منتج بلا بيانات موثقة، ولا وعد يتقدم على دليله." : "No product without verified detail, and no promise ahead of its evidence."}</p>
            </article>
          </div>
        </section>

        <section className={styles.ritualGiftGrid}>
          <article className={styles.ritualCard}>
            <div>
              <p className={styles.eyebrow}>{copy.ritual}</p>
              <h2>{copy.ritualTitle}</h2>
              <p>{copy.ritualBody}</p>
              <TrackedLink href={href("/rituals/builder")} analyticsLabel="about_ritual_builder" analyticsSurface="about_editorial">{copy.ritualCta}</TrackedLink>
            </div>
            <div className={styles.ritualMedia} aria-hidden="true"><Image src="/elore-assets/saudi-evening-ritual-concept-1672x941.avif" alt="" fill sizes="(max-width: 760px) 100vw, 44vw" /></div>
          </article>
          <article className={styles.giftCard}>
            <div className={styles.giftMedia} aria-hidden="true"><Image src="/elore-assets/bento-gifting-ribbon-v2.avif" alt="" fill sizes="(max-width: 760px) 100vw, 38vw" /></div>
            <div>
              <p className={styles.eyebrow}>{copy.gifting}</p>
              <h2>{copy.giftingTitle}</h2>
              <TrackedLink href={href("/shop/beauty-sets")} analyticsLabel="about_gifting" analyticsSurface="about_editorial">{copy.giftingCta}</TrackedLink>
            </div>
          </article>
        </section>

        <section className={styles.ingredients} aria-labelledby="about-ingredients-title">
          <div>
            <p className={styles.eyebrow}>THE INGREDIENT EDIT</p>
            <h2 id="about-ingredients-title">{copy.ingredients}</h2>
          </div>
          <nav aria-label={copy.ingredients}>
            {copy.ingredientLinks.map(([label, path]) => (
              <TrackedLink key={label} href={href(path)} analyticsLabel={`about_ingredient_${label}`} analyticsSurface="about_editorial">{label}<span aria-hidden="true">↗</span></TrackedLink>
            ))}
          </nav>
        </section>

        <section className={styles.faq} aria-labelledby="about-faq-title">
          <div><p className={styles.eyebrow}>CLARITY</p><h2 id="about-faq-title">{copy.questions}</h2></div>
          <div>{record.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
        </section>
      </main>

      <section className={styles.closing} aria-labelledby="about-closing-title">
        <Image src="/elore-assets/transition-burgundy-satin-concept-1672w.avif" alt="" fill sizes="100vw" />
        <div aria-hidden="true" />
        <div className={styles.closingCopy}>
          <h2 id="about-closing-title">{copy.closing}</h2>
          <TrackedLink href={href("/shop")} analyticsLabel="about_closing_shop" analyticsSurface="about_editorial">{copy.closingCta}</TrackedLink>
        </div>
      </section>
    </div>
  );
}
