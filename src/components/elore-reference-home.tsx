import Image from "next/image";
import type { ReactNode } from "react";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { TrackedLink } from "@/components/tracked-link";
import { localizePath, type Locale } from "@/lib/i18n";
import type { HomeAuthorityContent } from "@/lib/site-content-authority";
import type { BentoAuthorityLocale } from "@/lib/site-editorial-authority";
import styles from "./elore-reference-home.module.css";

type Props = {
  locale: Locale;
  content?: HomeAuthorityContent;
  bentoContent?: BentoAuthorityLocale;
  serviceStrip?: ReactNode;
};

type FlaconItem = {
  id: string;
  name: string;
  category: string;
  notes: string;
  size: string;
  price: string;
  badge: string;
  image: string;
  href: string;
};

export function EloreReferenceHome({ locale, content, bentoContent, serviceStrip }: Props) {
  void content;
  void bentoContent;
  const isAr = locale === "ar";
  const href = (path: string) => localizePath(locale, path);

  const flacons: FlaconItem[] = [
    {
      id: "perfumes-collection",
      name: isAr ? "العطور الفاخرة — Parfums" : "Parfums Collection",
      category: isAr ? "قسم العطور · PERFUMES" : "PERFUMES · HAUTE PARFUMERIE",
      notes: isAr
        ? "توليفات عطرية متوازنة تُعرض بهرم عطري واضح وتناغم باريسي متقن."
        : "Balanced olfactory compositions presented with clear note hierarchy and authentic Parisian harmony.",
      size: isAr ? "ماء عطر مركز — 100 مل" : "Eau de Parfum 100ml",
      price: isAr ? "مجموعة العطور النادرة" : "Haute Parfumerie",
      badge: isAr ? "قسم العطور" : "Perfumes",
      image: "/elore-assets/perfume-amber-flacon-editorial-concept-1672x941.avif",
      href: "/shop/perfumes",
    },
    {
      id: "signature-rituals",
      name: isAr ? "طقوس العطور والحضور — Rituals" : "Signature Scent Rituals",
      category: isAr ? "مسارات الاختيار · RITUALS" : "RITUALS · BY INTENTION",
      notes: isAr
        ? "رتّبي خطوات العطر والعناية بهدوء، وابدئي من الإحساس والمناسبة التي تبحثين عنها."
        : "Compose your fragrance and care steps calmly around occasion, climate, and mood.",
      size: isAr ? "عطور وزيوت حسية" : "Sensory Rituals",
      price: isAr ? "طقوس حضور استثنائي" : "Signature Presence",
      badge: isAr ? "طقوس خاصة" : "Ritual Edit",
      image: "/elore-assets/hero-perfume-ritual-desktop-v3.avif",
      href: "/rituals",
    },
    {
      id: "evening-bodycare",
      name: isAr ? "العناية بالجسم والمساء — Bodycare" : "Evening & Body Care",
      category: isAr ? "العناية بالجسم · BODYCARE" : "BODYCARE · TEXTURE EDIT",
      notes: isAr
        ? "قوام غني ولمسة هادئة مصممة لتكمل حضور العطر وتناسب أجواء المناسبات."
        : "Rich textures and calm finishes designed to layer effortlessly with evening scent.",
      size: isAr ? "تركيبة حريرية فاخرة" : "Sublime Velvet Care",
      price: isAr ? "عناية متكاملة بالبشرة" : "Prestige Bodycare",
      badge: isAr ? "العناية بالجسم" : "Bodycare",
      image: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif",
      href: "/shop/bodycare",
    },
    {
      id: "beauty-sets",
      name: isAr ? "مجموعات الجمال والإهداء — Beauty Sets" : "Beauty & Gifting Sets",
      category: isAr ? "عالم الهدايا · BEAUTY SETS" : "BEAUTY SETS · L'ART D'OFFRIR",
      notes: isAr
        ? "اختيارات مدروسة للمناسبة، مع تفاصيل تقديم هادئة تجعل الهدية جزءًا من التجربة."
        : "Considered selections for the occasion, with calm presentation details that elevate gifting.",
      size: isAr ? "صندوق إهداء فاخر" : "Prestige Gift Coffer",
      price: isAr ? "إصدار الإهداء الحصري" : "L'Art d'Offrir",
      badge: isAr ? "الأطقم والهدايا" : "Beauty Sets",
      image: "/elore-assets/gifting-ribbon-ritual-concept-1536w.avif",
      href: "/shop/beauty-sets",
    },
  ];

  return (
    <div className={styles.page} data-reference-home>
      {/* 1. L'ATELIER FLACON HERO STAGE */}
      <section className={styles.heroStage} aria-labelledby="hero-perfume-title">
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrowBadge}>
              <span style={{ color: "#C5A059" }}>✦</span>
              {isAr ? "PARISIAN RITUAL · SAUDI RELEVANCE" : "PARISIAN RITUAL · SAUDI RELEVANCE"}
            </span>

            <h1 id="hero-perfume-title" className={styles.heroTitle}>
              {isAr ? (
                <>
                  جمالٌ يُروى كتجربة.
                  <br />
                  <span style={{ color: "#653846", fontWeight: 400 }}>ÉLORÉ PARIS · دار العطور والجمال</span>
                </>
              ) : (
                <>
                  Beauty, told as an experience.
                  <br />
                  <span style={{ color: "#653846", fontWeight: 400 }}>ÉLORÉ PARIS · Maison de Beauté</span>
                </>
              )}
            </h1>

            <p className={styles.heroLead}>
              {isAr
                ? "نحوّل لحظاتك اليومية إلى طقوس فاخرة من الجمال والحنين. اكتشفي فنّ العطور والعناية عبر فئات واضحة وتناغم عطري راقٍ دون صخب أو مبالغة."
                : "We turn your everyday moments into luxurious rituals of beauty and nostalgia. Discover the art of fragrance and care with authentic Parisian elegance."}
            </p>

            {/* Olfactory & Product Truth Architecture Card */}
            <div className={styles.olfactoryCard}>
              <div className={styles.olfactoryHeader}>
                <span>{isAr ? "هندسة العرض العطري — Pyramide & Vérité" : "Olfactory & Product Truth Architecture"}</span>
                <span style={{ color: "#C5A059" }}>{isAr ? "شفافية البيانات قبل الشراء" : "Verified Data First"}</span>
              </div>
              <div className={styles.olfactoryNotesList}>
                <div className={styles.olfactoryNoteItem}>
                  <span className={styles.olfactoryNoteLabel}>{isAr ? "الافتتاحية" : "Top Profile"}</span>
                  <span className={styles.olfactoryNoteValue}>{isAr ? "توصيف واضح للنفحات العليا والإحساس الأول" : "Clear articulation of opening notes & impression"}</span>
                </div>
                <div className={styles.olfactoryNoteItem}>
                  <span className={styles.olfactoryNoteLabel}>{isAr ? "القلب والقوام" : "Heart & Texture"}</span>
                  <span className={styles.olfactoryNoteValue}>{isAr ? "تفاصيل القوام والمكونات الأساسية وطريقة الاستخدام" : "Core botanical profile, texture & ritual guidance"}</span>
                </div>
                <div className={styles.olfactoryNoteItem}>
                  <span className={styles.olfactoryNoteLabel}>{isAr ? "قاعدة العطر والعمق" : "Base & Longevity"}</span>
                  <span className={styles.olfactoryNoteValue}>{isAr ? "توليفة باريسية أصيلة تعبر عن الفخامة الهادئة والثبات" : "An authentic Parisian formulation reflecting quiet luxury and enduring elegance"}</span>
                </div>
              </div>
            </div>

            {/* Primary Discovery Actions */}
            <div className={styles.heroActionsBar}>
              <div className={styles.heroPriceTag}>
                <span className={styles.heroPriceValue}>{isAr ? "مجموعة العطور الحصرية" : "Exclusive Collection"}</span>
                <span className={styles.heroPriceNote}>{isAr ? "إصدارات مختارة بعناية لأصحاب الذوق الرفيع" : "Curated editions for discerning connoisseurs"}</span>
              </div>

              <TrackedLink
                href={href("/shop")}
                className={styles.primaryButton}
                analyticsLabel="hero_explore_shop"
                analyticsSurface="hero_stage"
              >
                <span>{isAr ? "اكتشفي المجموعة" : "Explore the Collection"}</span>
                <span>←</span>
              </TrackedLink>

              <TrackedLink
                href={href("/rituals/builder")}
                className={styles.secondaryButton}
                analyticsLabel="hero_build_routine"
                analyticsSurface="hero_stage"
              >
                {isAr ? "ابني روتينك" : "Build Your Routine"}
              </TrackedLink>
            </div>
          </div>

          {/* Authentic Perfume Flacon Concept Asset on Limestone Pedestal */}
          <div className={styles.heroMediaStage}>
            <div className={styles.heroPedestal}>
              <Image
                src="/elore-assets/perfume-amber-flacon-editorial-concept-1672x941.avif"
                alt={isAr ? "قارورة عطر إيلور باريس الفاخرة على قاعدة حجرية" : "Luxury Éloré Paris perfume flacon on stone pedestal"}
                fill
                priority
                unoptimized
                sizes="(max-width: 840px) 100vw, 540px"
                className={styles.heroPedestalImage}
              />
              <div className={styles.heroFloatingBadge}>
                <span style={{ color: "#C5A059" }}>✦</span>
                <span>{isAr ? "عطور باريسية فاخرة · ÉLORÉ PARIS" : "Haute Parfumerie · ÉLORÉ PARIS"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BRAND PROOF & EDITORIAL STANDARDS STRIP */}
      <section className={styles.craftStrip} aria-label={isAr ? "ثقة تبدأ مما يمكن إثباته" : "Trust built on what can be verified"}>
        <div className={styles.craftContainer}>
          <div className={styles.craftItem}>
            <div className={styles.craftIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.craftTitle}>{isAr ? "صور أوضح" : "Clearer Imagery"}</h3>
              <p className={styles.craftText}>{isAr ? "نعرض القوام والدرجة من دون مؤثرات تغيّر الحقيقة" : "Textures and tones shown without distorting filters"}</p>
            </div>
          </div>

          <div className={styles.craftItem}>
            <div className={styles.craftIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.craftTitle}>{isAr ? "معلومة عملية" : "Practical Guidance"}</h3>
              <p className={styles.craftText}>{isAr ? "طريقة استخدام مختصرة ومفهومة قبل اتخاذ القرار" : "Concise, clear usage rituals before you decide"}</p>
            </div>
          </div>

          <div className={styles.craftItem}>
            <div className={styles.craftIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.craftTitle}>{isAr ? "اختيار أقل ضجيجًا" : "Quieter Selection"}</h3>
              <p className={styles.craftText}>{isAr ? "تصنيف مدروس بدل رف رقمي مزدحم بلا توجيه" : "Considered curation instead of a crowded shelf"}</p>
            </div>
          </div>

          <div className={styles.craftItem}>
            <div className={styles.craftIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
                <circle cx="18" cy="16" r="2"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.craftTitle}>{isAr ? "ادعاءات منضبطة" : "Disciplined Claims"}</h3>
              <p className={styles.craftText}>{isAr ? "لا أرقام أو نتائج أو وعود بلا مصدر يمكن مراجعته" : "No unverified prices, promises, or unsupported claims"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AUTHENTIC COLLECTION & RITUAL SHOWCASE */}
      <section className={styles.gallerySection} aria-labelledby="flacon-collection-title">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>
            {isAr ? "أبواب المتجر · THE ÉLORÉ EDIT" : "THE ÉLORÉ EDIT"}
          </span>
          <h2 id="flacon-collection-title" className={styles.sectionTitle}>
            {isAr ? "ابدئي من الفئة أو الطقس الأقرب لك" : "Begin with the Category or Ritual Closest to You"}
          </h2>
          <p className={styles.sectionLead}>
            {isAr
              ? "مسارات راقية لاستكشاف العطور الفاخرة، العناية الملكية بالجسم، وفنون الإهداء الباريسي المتقن."
              : "Refined pathways across haute parfumerie, sublime bodycare, and the art of Parisian gifting."}
          </p>
        </div>

        <div className={styles.flaconGrid}>
          {flacons.map((flacon) => (
            <TrackedLink
              key={flacon.id}
              href={href(flacon.href)}
              className={styles.flaconCard}
              analyticsLabel={`flacon_card_${flacon.id}`}
              analyticsSurface="flacon_gallery"
            >
              <div className={styles.flaconCardMedia}>
                <Image
                  src={flacon.image}
                  alt={flacon.name}
                  fill
                  unoptimized
                  sizes="(max-width: 600px) 100vw, (max-width: 1080px) 50vw, 25vw"
                />
                <span className={styles.flaconCardBadge}>{flacon.badge}</span>
              </div>

              <div className={styles.flaconCardBody}>
                <span className={styles.flaconCategory}>{flacon.category}</span>
                <h3 className={styles.flaconName}>{flacon.name}</h3>
                <p className={styles.flaconNotes}>{flacon.notes}</p>

                <div className={styles.flaconCardFooter}>
                  <span className={styles.flaconPrice}>{flacon.price}</span>
                  <span className={styles.flaconCtaButton}>
                    <span>{isAr ? "استكشفي القسم" : "Explore"}</span>
                    <span>←</span>
                  </span>
                </div>
              </div>
            </TrackedLink>
          ))}
        </div>
      </section>

      {/* 4. THE ART OF GIFTING (L'ART D'OFFRIR) */}
      <section className={styles.giftingSection} aria-labelledby="gifting-experience-title">
        <div className={styles.giftingCard}>
          <div className={styles.giftingMedia}>
            <Image
              src="/elore-assets/gifting-ribbon-ritual-concept-1536w.avif"
              alt={isAr ? "فنون التغليف والإهداء الفاخر من إيلور باريس" : "Luxury gifting presentation by Éloré Paris"}
              fill
              unoptimized
              sizes="(max-width: 840px) 100vw, 50vw"
            />
          </div>

          <div className={styles.giftingBody}>
            <span className={styles.giftingEyebrow}>
              {isAr ? "فن الإهداء · THE ART OF GIFTING" : "THE ART OF GIFTING"}
            </span>
            <h2 id="gifting-experience-title" className={styles.giftingTitle}>
              {isAr ? "هدية جميلة في كل تفصيلة." : "A Beautiful Gift in Every Detail."}
            </h2>
            <p className={styles.giftingText}>
              {isAr
                ? "اختيارات مدروسة للمناسبة والميزانية، مع تفاصيل تقديم هادئة تجعل لحظة الهدية جزءًا من التجربة."
                : "Considered selections for the occasion and budget, with calm presentation details that make the gifting moment part of the experience."}
            </p>
            <div>
              <TrackedLink
                href={href("/shop/beauty-sets")}
                className={styles.primaryButton}
                analyticsLabel="gifting_explore_sets"
                analyticsSurface="gifting_card"
              >
                <span>{isAr ? "اكتشفي عالم الهدايا" : "Discover Gifting"}</span>
                <span>←</span>
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      {/* Service Strip integration if provided */}
      {serviceStrip ? <div>{serviceStrip}</div> : null}

      {/* 5. NEWSLETTER SIGNUP */}
      <section className={styles.newsletterSection} aria-label={isAr ? "رسائل جمال تستحق وقتك" : "Beauty notes worth your time"}>
        <NewsletterSignup locale={locale} />
      </section>
    </div>
  );
}

