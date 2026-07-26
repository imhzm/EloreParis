"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";
import {
  recommendRitualProducts,
  type RitualSelection,
} from "@/lib/ritual-recommendation";
import styles from "./ritual-builder.module.css";

type Props = {
  locale: Locale;
  catalogAvailable: boolean;
  products: PublicCatalogProduct[];
};

type RitualAnswer = RitualSelection & {
  description: string;
  image: string;
};

type RitualQuestion = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  options: readonly RitualAnswer[];
};

const copy = {
  ar: {
    eyebrow: "YOUR BEAUTY RITUAL",
    title: "ابني طقسك الخاص.",
    subtitle: "اكتشفي اختيارات أقرب لذوقك من الكتالوج المنشور، في رحلة قصيرة وواضحة لا تستبدل النصيحة المتخصصة.",
    stepper: "خطوات بناء الطقس",
    progress: "تقدّم بناء الطقس",
    next: "السؤال التالي",
    previous: "السؤال السابق",
    finish: "شاهدي اختياراتك",
    summary: "ملخص رحلتك",
    summaryLead: "تظهر اختياراتك هنا بينما تتقدمين.",
    pending: "اختاري إجابة للمتابعة.",
    resultEyebrow: "YOUR EDIT, EXPLAINED",
    resultTitle: "طقس مبني على اختياراتك.",
    resultBody: "هذه مطابقة إرشادية لحقول المنتجات المنشورة وليست تشخيصًا أو وعدًا بنتيجة. راجعي صفحة كل منتج قبل الشراء.",
    reset: "ابدئي من جديد",
    catalogGateTitle: "التوصيات غير منشورة بعد.",
    catalogGateBody: "يمكنك إكمال الرحلة وحفظ تفضيلاتك ذهنيًا، لكننا لن نعرض منتجات حتى يعتمد الكتالوج العام ببياناته وصوره.",
    noMatchTitle: "لا توجد مطابقة موثوقة الآن.",
    noMatchBody: "لم نجد منتجًا منشورًا يطابق هذه الاختيارات. يمكنك تعديل إجاباتك أو استعراض المتجر.",
    quickAdd: "أضيفي إلى السلة",
    details: "راجعي التفاصيل",
    added: "تمت إضافة الاختيار إلى السلة.",
    cart: "استعراض السلة",
    available: "متاح",
    unavailable: "راجعي حالة التوفر",
    why: "لماذا ظهر هذا الاختيار؟",
    resultStep: "النتيجة",
    selection: "اختيارك",
    shop: "استعرضي المتجر",
  },
  en: {
    eyebrow: "YOUR BEAUTY RITUAL",
    title: "Compose your own ritual.",
    subtitle: "A short, considered journey towards choices from the published catalogue. It is general guidance, not professional advice.",
    stepper: "Ritual builder steps",
    progress: "Ritual builder progress",
    next: "Next question",
    previous: "Previous question",
    finish: "See my edit",
    summary: "Your journey",
    summaryLead: "Your choices will gather here as you progress.",
    pending: "Choose an answer to continue.",
    resultEyebrow: "YOUR EDIT, EXPLAINED",
    resultTitle: "A ritual shaped by your choices.",
    resultBody: "This is an editorial match against published product fields, not a diagnosis or a promise of results. Review each product page before purchasing.",
    reset: "Start again",
    catalogGateTitle: "Recommendations are not published yet.",
    catalogGateBody: "You can complete the journey, but we will not show products until the public catalogue and its imagery are approved.",
    noMatchTitle: "No reliable match is available now.",
    noMatchBody: "No published product matches these choices yet. Adjust your answers or browse the store.",
    quickAdd: "Add to cart",
    details: "Review details",
    added: "Your choice was added to the cart.",
    cart: "Review cart",
    available: "Available",
    unavailable: "Review availability",
    why: "Why this choice appeared",
    resultStep: "Result",
    selection: "Your choice",
    shop: "Browse the shop",
  },
} as const;

const questions: Record<Locale, readonly RitualQuestion[]> = {
  ar: [
    {
      id: "mood",
      eyebrow: "01 · النية",
      title: "ما الإحساس الذي تريدينه في يومك؟",
      description: "اختاري المشهد الأقرب للمزاج الذي تريدين أن يبدأ منه طقسك.",
      options: [
        { questionId: "mood", answerId: "refined", label: "الأناقة والرقي", description: "حضور هادئ وتفاصيل مصقولة", image: "/elore-assets/transition-burgundy-satin-concept-1672w.avif", collections: ["perfumes", "makeup"], keywords: ["فاخر", "أنيق", "كلاسيكي", "elegant", "refined"] },
        { questionId: "mood", answerId: "calm", label: "الهدوء والراحة", description: "إيقاع ناعم ولحظة أكثر بساطة", image: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif", collections: ["skincare", "bodycare", "haircare"], keywords: ["لطيف", "ناعم", "هادئ", "gentle", "soft"] },
        { questionId: "mood", answerId: "radiant", label: "الإشراق والحضور", description: "لمسة مضيئة وتفاصيل واضحة", image: "/elore-assets/hero-silk-champagne-concept-1672w.avif", collections: ["makeup", "skincare"], keywords: ["إشراق", "مضيء", "radiant", "glow", "luminous"] },
        { questionId: "mood", answerId: "discovery", label: "الإلهام والاكتشاف", description: "مساحة لتجربة اتجاه جديد", image: "/elore-assets/bento-paris-etching-v2.avif", collections: ["perfumes", "skincare", "makeup", "haircare", "bodycare", "tools", "beauty-sets"], keywords: ["جديد", "اكتشاف", "new", "discovery"] },
      ],
    },
    {
      id: "focus",
      eyebrow: "02 · المجال",
      title: "أين تريدين أن يتركز طقسك؟",
      description: "هذا الاختيار هو الإشارة الأقوى في ترتيب المنتجات المنشورة.",
      options: [
        { questionId: "focus", answerId: "perfume", label: "العطور", description: "اختيار عطري يرافق حضورك", image: "/elore-assets/perfume-amber-flacon-editorial-concept-1672x941.avif", collections: ["perfumes"], keywords: ["عطر", "عطري", "perfume", "fragrance"] },
        { questionId: "focus", answerId: "skin", label: "العناية بالبشرة", description: "خطوة عناية واضحة ومباشرة", image: "/elore-assets/texture-skincare-serum-concept-1536w.avif", collections: ["skincare"], keywords: ["بشرة", "سيروم", "كريم", "skin", "serum", "cream"] },
        { questionId: "focus", answerId: "makeup", label: "المكياج", description: "لون أو قوام يكمل إطلالتك", image: "/elore-assets/texture-makeup-pigment-concept-1536w.avif", collections: ["makeup"], keywords: ["مكياج", "لون", "makeup", "colour", "color"] },
        { questionId: "focus", answerId: "body", label: "الشعر والجسم والأدوات", description: "تفاصيل تكمل الطقس من حولك", image: "/elore-assets/tools-brass-flatlay-concept-1254x1254.avif", collections: ["haircare", "bodycare", "tools"], keywords: ["شعر", "جسم", "أداة", "hair", "body", "tool"] },
      ],
    },
    {
      id: "texture",
      eyebrow: "03 · القوام",
      title: "أي إحساس أقرب لك؟",
      description: "نطابق هذا التفضيل مع القوام والوصف المنشورين، إذا كانا متاحين.",
      options: [
        { questionId: "texture", answerId: "light", label: "خفيف ومنعش", description: "إحساس رشيق وغير مثقل", image: "/elore-assets/editorial-skin-light-concept-1122w.avif", collections: ["skincare", "haircare", "bodycare"], keywords: ["خفيف", "منعش", "سيروم", "light", "fresh", "serum"] },
        { questionId: "texture", answerId: "rich", label: "غني ومريح", description: "قوام أكثر امتلاءً وهدوءًا", image: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif", collections: ["skincare", "bodycare"], keywords: ["غني", "كريم", "rich", "cream", "creamy"] },
        { questionId: "texture", answerId: "velvet", label: "مخملي ومصقول", description: "نهاية ناعمة محددة الحضور", image: "/elore-assets/texture-makeup-pigment-concept-1536w.avif", collections: ["makeup", "perfumes"], keywords: ["مخملي", "مطفي", "ناعم", "velvet", "matte", "soft"] },
        { questionId: "texture", answerId: "open", label: "مرنة بلا تفضيل", description: "دعي المجال مفتوحًا لأقرب مطابقة", image: "/elore-assets/gifting-folds-concept-1536x1024.avif", collections: ["perfumes", "skincare", "makeup", "haircare", "bodycare", "tools", "beauty-sets"], keywords: [] },
      ],
    },
    {
      id: "cadence",
      eyebrow: "04 · الإيقاع",
      title: "كيف تريدين أن يدخل الاختيار إلى طقسك؟",
      description: "حددي الدور الأقرب، وسنستخدمه كإشارة أخيرة للترتيب.",
      options: [
        { questionId: "cadence", answerId: "hero", label: "قطعة واحدة أساسية", description: "اختيار بطل تبدأ منه الحكاية", image: "/elore-assets/hero-ritual-poise-desktop-concept-1672x941.avif", collections: ["perfumes", "skincare", "makeup", "haircare", "bodycare", "tools"], keywords: ["أساسي", "essential", "hero"] },
        { questionId: "cadence", answerId: "daily", label: "خطوة يومية", description: "إضافة واضحة سهلة التكرار", image: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif", collections: ["skincare", "haircare", "bodycare"], keywords: ["يومي", "daily"] },
        { questionId: "cadence", answerId: "gift", label: "هدية ذات معنى", description: "اختيار يصلح للحظة تقديم", image: "/elore-assets/gifting-ribbon-ritual-concept-1536w.avif", collections: ["beauty-sets", "perfumes"], keywords: ["هدية", "مجموعة", "gift", "set"] },
        { questionId: "cadence", answerId: "finish", label: "لمسة أخيرة", description: "تفصيل يكمل الطقس ولا يزدحمه", image: "/elore-assets/tools-brass-flatlay-concept-1254x1254.avif", collections: ["makeup", "perfumes", "tools"], keywords: ["لمسة", "نهاية", "finish", "finishing"] },
      ],
    },
  ],
  en: [
    {
      id: "mood",
      eyebrow: "01 · INTENTION",
      title: "How would you like your day to feel?",
      description: "Choose the scene closest to the mood you want your ritual to begin with.",
      options: [
        { questionId: "mood", answerId: "refined", label: "Refined and poised", description: "Quiet presence with polished detail", image: "/elore-assets/transition-burgundy-satin-concept-1672w.avif", collections: ["perfumes", "makeup"], keywords: ["luxury", "elegant", "classic", "refined"] },
        { questionId: "mood", answerId: "calm", label: "Calm and restored", description: "A softer pace and simpler moment", image: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif", collections: ["skincare", "bodycare", "haircare"], keywords: ["gentle", "soft", "calm"] },
        { questionId: "mood", answerId: "radiant", label: "Radiant and present", description: "Light-catching, clear detail", image: "/elore-assets/hero-silk-champagne-concept-1672w.avif", collections: ["makeup", "skincare"], keywords: ["radiant", "glow", "luminous"] },
        { questionId: "mood", answerId: "discovery", label: "Inspired and curious", description: "Room to discover a new direction", image: "/elore-assets/bento-paris-etching-v2.avif", collections: ["perfumes", "skincare", "makeup", "haircare", "bodycare", "tools", "beauty-sets"], keywords: ["new", "discovery"] },
      ],
    },
    {
      id: "focus",
      eyebrow: "02 · FOCUS",
      title: "Where should your ritual focus?",
      description: "This choice carries the strongest weight in the published-product ranking.",
      options: [
        { questionId: "focus", answerId: "perfume", label: "Perfume", description: "A fragrance choice that follows your presence", image: "/elore-assets/perfume-amber-flacon-editorial-concept-1672x941.avif", collections: ["perfumes"], keywords: ["perfume", "fragrance"] },
        { questionId: "focus", answerId: "skin", label: "Skincare", description: "A clear, considered care step", image: "/elore-assets/texture-skincare-serum-concept-1536w.avif", collections: ["skincare"], keywords: ["skin", "serum", "cream"] },
        { questionId: "focus", answerId: "makeup", label: "Makeup", description: "Colour or texture that completes a look", image: "/elore-assets/texture-makeup-pigment-concept-1536w.avif", collections: ["makeup"], keywords: ["makeup", "colour", "color"] },
        { questionId: "focus", answerId: "body", label: "Hair, body and tools", description: "Details that complete the ritual around you", image: "/elore-assets/tools-brass-flatlay-concept-1254x1254.avif", collections: ["haircare", "bodycare", "tools"], keywords: ["hair", "body", "tool"] },
      ],
    },
    {
      id: "texture",
      eyebrow: "03 · TEXTURE",
      title: "Which feeling is closest to you?",
      description: "We compare this preference with the published finish and description where available.",
      options: [
        { questionId: "texture", answerId: "light", label: "Light and fresh", description: "An agile, unburdened feel", image: "/elore-assets/editorial-skin-light-concept-1122w.avif", collections: ["skincare", "haircare", "bodycare"], keywords: ["light", "fresh", "serum"] },
        { questionId: "texture", answerId: "rich", label: "Rich and comforting", description: "A fuller, quieter texture", image: "/elore-assets/bodycare-stone-ritual-concept-1122x1402.avif", collections: ["skincare", "bodycare"], keywords: ["rich", "cream", "creamy"] },
        { questionId: "texture", answerId: "velvet", label: "Velvet and polished", description: "A soft finish with definition", image: "/elore-assets/texture-makeup-pigment-concept-1536w.avif", collections: ["makeup", "perfumes"], keywords: ["velvet", "matte", "soft"] },
        { questionId: "texture", answerId: "open", label: "Open to the closest match", description: "Leave space for the catalogue to guide you", image: "/elore-assets/gifting-folds-concept-1536x1024.avif", collections: ["perfumes", "skincare", "makeup", "haircare", "bodycare", "tools", "beauty-sets"], keywords: [] },
      ],
    },
    {
      id: "cadence",
      eyebrow: "04 · CADENCE",
      title: "How should this choice enter your ritual?",
      description: "Choose its closest role and we will use that as the final ranking signal.",
      options: [
        { questionId: "cadence", answerId: "hero", label: "One essential piece", description: "A hero choice to begin the story", image: "/elore-assets/hero-ritual-poise-desktop-concept-1672x941.avif", collections: ["perfumes", "skincare", "makeup", "haircare", "bodycare", "tools"], keywords: ["essential", "hero"] },
        { questionId: "cadence", answerId: "daily", label: "A daily step", description: "A clear addition that is easy to repeat", image: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif", collections: ["skincare", "haircare", "bodycare"], keywords: ["daily"] },
        { questionId: "cadence", answerId: "gift", label: "A meaningful gift", description: "A choice made for the moment of giving", image: "/elore-assets/gifting-ribbon-ritual-concept-1536w.avif", collections: ["beauty-sets", "perfumes"], keywords: ["gift", "set"] },
        { questionId: "cadence", answerId: "finish", label: "A finishing touch", description: "A detail that completes without crowding", image: "/elore-assets/tools-brass-flatlay-concept-1254x1254.avif", collections: ["makeup", "perfumes", "tools"], keywords: ["finish", "finishing"] },
      ],
    },
  ],
};

function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function RitualBuilder({ locale, catalogAvailable, products }: Props) {
  const text = copy[locale];
  const localizedQuestions = questions[locale];
  const pathname = usePathname() ?? `/${locale}/rituals/builder`;
  const { addItem, cartCount } = useCart();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, RitualAnswer>>({});
  const [status, setStatus] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasNavigatedRef = useRef(false);
  const startedRef = useRef(false);
  const completionKeyRef = useRef("");
  const isResult = step === localizedQuestions.length;
  const currentQuestion = localizedQuestions[step];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const selections = useMemo(
    () => localizedQuestions.map((question) => answers[question.id]).filter((answer): answer is RitualAnswer => Boolean(answer)),
    [answers, localizedQuestions],
  );
  const recommendations = useMemo(
    () => catalogAvailable
      ? recommendRitualProducts(products, selections, locale)
      : [],
    [catalogAvailable, locale, products, selections],
  );

  useEffect(() => {
    if (hasNavigatedRef.current) headingRef.current?.focus();
  }, [step]);

  const selectAnswer = (answer: RitualAnswer) => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackAnalyticsEvent("ritual_start", {
        source_path: pathname,
        source_page_type: getPageType(pathname),
        locale,
        catalog_available: catalogAvailable,
      });
    }
    setAnswers((current) => ({ ...current, [answer.questionId]: answer }));
    setStatus("");
  };

  const goNext = () => {
    if (!currentQuestion || !selectedAnswer) return;

    trackAnalyticsEvent("ritual_step", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      locale,
      step_number: step + 1,
      step_id: currentQuestion.id,
      answer_id: selectedAnswer.answerId,
      catalog_available: catalogAvailable,
    });

    const nextStep = Math.min(step + 1, localizedQuestions.length);
    if (nextStep === localizedQuestions.length) {
      const resultSelections = localizedQuestions
        .map((question) => answers[question.id])
        .filter((answer): answer is RitualAnswer => Boolean(answer));
      const resultRecommendations = catalogAvailable
        ? recommendRitualProducts(products, resultSelections, locale)
        : [];
      const completionKey = resultSelections.map((answer) => answer.answerId).join("|");
      if (completionKeyRef.current !== completionKey) {
        completionKeyRef.current = completionKey;
        trackAnalyticsEvent("ritual_complete", {
          source_path: pathname,
          source_page_type: getPageType(pathname),
          locale,
          answer_count: resultSelections.length,
          recommendation_count: resultRecommendations.length,
          catalog_available: catalogAvailable,
        });
      }
    }

    hasNavigatedRef.current = true;
    setStep(nextStep);
  };

  const goBack = () => {
    hasNavigatedRef.current = true;
    setStatus("");
    setStep((current) => Math.max(0, current - 1));
  };

  const reset = () => {
    startedRef.current = false;
    completionKeyRef.current = "";
    hasNavigatedRef.current = true;
    setAnswers({});
    setStatus("");
    setStep(0);
  };

  const quickAdd = (product: PublicCatalogProduct, sku: string, price: number) => {
    addItem({ productSlug: product.slug, sku, quantity: 1 });
    setStatus(text.added);
    trackAnalyticsEvent("add_to_cart", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      product_slug: product.slug,
      sku,
      quantity: 1,
      unit_price: price,
      cart_count: cartCount + 1,
      ritual_recommendation: true,
    });
  };

  return (
    <div
      className={styles.page}
      data-ritual-builder
      data-catalog-available={catalogAvailable}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <section className={styles.hero} aria-labelledby="ritual-builder-title">
        <Image
          src="/elore-assets/hero-ritual-poise-desktop-concept-1672x941.avif"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow} lang="en">{text.eyebrow}</p>
          <h1 id="ritual-builder-title">{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className={styles.progressWrap}>
          <ol className={styles.stepper} aria-label={text.stepper}>
            {localizedQuestions.map((question, index) => (
              <li key={question.id} aria-current={step === index ? "step" : undefined} data-complete={step > index}>
                <span>{index + 1}</span>
                <small>{question.eyebrow.replace(/^\d+\s*·\s*/, "")}</small>
              </li>
            ))}
            <li aria-current={isResult ? "step" : undefined} data-complete={false}>
              <span>{localizedQuestions.length + 1}</span>
              <small>{text.resultStep}</small>
            </li>
          </ol>
          <progress
            className={styles.progress}
            value={step + 1}
            max={localizedQuestions.length + 1}
            aria-label={text.progress}
          />
        </div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.quizPanel} aria-live="polite">
          {currentQuestion ? (
            <fieldset className={styles.question}>
              <legend className={styles.srOnly}>{currentQuestion.title}</legend>
              <header className={styles.questionHeader}>
                <p className={styles.eyebrow}>{currentQuestion.eyebrow}</p>
                <h2 ref={headingRef} tabIndex={-1}>{currentQuestion.title}</h2>
                <p>{currentQuestion.description}</p>
              </header>
              <div className={styles.options}>
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer?.answerId === option.answerId;
                  return (
                    <label key={option.answerId} className={styles.option} data-selected={isSelected}>
                      <input
                        className={styles.optionInput}
                        type="radio"
                        name={currentQuestion.id}
                        value={option.answerId}
                        checked={isSelected}
                        onChange={() => selectAnswer(option)}
                      />
                      <span className={styles.optionMedia} aria-hidden="true">
                        <Image src={option.image} alt="" fill sizes="(max-width: 760px) 46vw, 22vw" />
                      </span>
                      <span className={styles.optionCheck} aria-hidden="true">✓</span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </label>
                  );
                })}
              </div>
              <p className={styles.selectionHint} aria-live="polite">
                {selectedAnswer ? `${text.selection}: ${selectedAnswer.label}` : text.pending}
              </p>
            </fieldset>
          ) : (
            <div className={styles.resultIntro}>
              <p className={styles.eyebrow} lang="en">{text.resultEyebrow}</p>
              <h2 ref={headingRef} tabIndex={-1}>{text.resultTitle}</h2>
              <p>{text.resultBody}</p>
              {!catalogAvailable ? (
                <div className={styles.honestyGate} role="status">
                  <h3>{text.catalogGateTitle}</h3>
                  <p>{text.catalogGateBody}</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className={styles.honestyGate} role="status">
                  <h3>{text.noMatchTitle}</h3>
                  <p>{text.noMatchBody}</p>
                </div>
              ) : (
                <p className={styles.resultCount}>{recommendations.length}</p>
              )}
              <div className={styles.resultActions}>
                <button type="button" className={styles.secondaryButton} onClick={reset}>{text.reset}</button>
                <TrackedLink href={`/${locale}/shop`} className={styles.primaryLink} analyticsLabel="ritual_result_shop" analyticsSurface="ritual_builder" analyticsDestinationType="shop_index">{text.shop}</TrackedLink>
              </div>
            </div>
          )}

          {!isResult ? (
            <div className={styles.navigation}>
              <button type="button" className={styles.secondaryButton} onClick={goBack} disabled={step === 0}>{text.previous}</button>
              <button type="button" className={styles.primaryButton} onClick={goNext} disabled={!selectedAnswer}>
                {step === localizedQuestions.length - 1 ? text.finish : text.next}
              </button>
            </div>
          ) : null}
        </section>

        <aside className={styles.summary} aria-labelledby="ritual-summary-title">
          <header>
            <p className={styles.eyebrow} lang="en">RITUAL SUMMARY</p>
            <h2 id="ritual-summary-title">{text.summary}</h2>
            <p>{text.summaryLead}</p>
          </header>

          <ol className={styles.answerSummary}>
            {localizedQuestions.map((question, index) => {
              const answer = answers[question.id];
              return (
                <li key={question.id} data-answered={Boolean(answer)}>
                  <span>{index + 1}</span>
                  <div>
                    <small>{question.eyebrow.replace(/^\d+\s*·\s*/, "")}</small>
                    <strong>{answer?.label ?? "—"}</strong>
                  </div>
                </li>
              );
            })}
          </ol>

          {isResult && catalogAvailable && recommendations.length > 0 ? (
            <div className={styles.recommendations}>
              {recommendations.map(({ product, reasons }) => {
                const image = product.media[0];
                const inStockVariants = product.variants.filter((variant) => variant.availability === "InStock");
                const displayVariant = inStockVariants[0] ?? product.variants[0];
                const quickAddVariant = inStockVariants.length === 1 ? inStockVariants[0] : null;
                return (
                  <article key={product.slug} className={styles.productCard}>
                    <div className={styles.productMedia}>
                      {image ? <Image src={image.url} alt={image.alt} fill sizes="(max-width: 960px) 30vw, 120px" /> : null}
                    </div>
                    <div className={styles.productCopy}>
                      <small>{product.brand}</small>
                      <h3>{product.name}</h3>
                      {displayVariant ? <strong>{formatPrice(displayVariant.price, locale)}</strong> : null}
                      <details>
                        <summary>{text.why}</summary>
                        <ul>{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                      </details>
                      {quickAddVariant ? (
                        <button type="button" onClick={() => quickAdd(product, quickAddVariant.sku, quickAddVariant.price)}>{text.quickAdd}</button>
                      ) : (
                        <TrackedLink href={`/${locale}/product/${product.slug}`} analyticsEvent="select_item" analyticsLabel={`ritual_product_${product.slug}`} analyticsSurface="ritual_summary" analyticsDestinationType="product" analyticsProperties={{ product_slug: product.slug, item_list: "ritual_recommendation" }}>{inStockVariants.length > 0 ? text.details : text.unavailable}</TrackedLink>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : isResult ? (
            <div className={styles.summaryGate}>
              <h3>{catalogAvailable ? text.noMatchTitle : text.catalogGateTitle}</h3>
              <p>{catalogAvailable ? text.noMatchBody : text.catalogGateBody}</p>
            </div>
          ) : null}

          <p className={styles.status} role="status" aria-live="polite">{status}</p>
          {status ? (
            <TrackedLink href={`/${locale}/cart`} className={styles.cartLink} analyticsLabel="ritual_to_cart" analyticsSurface="ritual_summary" analyticsDestinationType="cart">{text.cart}</TrackedLink>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
