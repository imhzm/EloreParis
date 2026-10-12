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
      id: "amber-royal",
      name: isAr ? "عنبر ملكي — Amber Royal" : "Amber Royal Extrait",
      category: isAr ? "Extrait de Parfum (تركيز 30%)" : "Extrait de Parfum (30% Conc.)",
      notes: isAr ? "نوتات: عنبر ملكي نقي · زعفران كشميري · عود معتق" : "Notes: Royal Amber · Kashmiri Saffron · Aged Oud",
      size: "100 ml",
      price: "680 SAR",
      badge: isAr ? "الأكثر تميزاً" : "Iconic Scent",
      image: "/elore-assets/perfume-amber-flacon-editorial-concept-1672x941.avif",
      href: "/shop",
    },
    {
      id: "oud-parisien",
      name: isAr ? "عود باريسي — Oud Parisien" : "Oud Parisien Extrait",
      category: isAr ? "Extrait de Parfum" : "Extrait de Parfum",
      notes: isAr ? "نوتات: عود طبيعي مدخن · خشب الصندل · بخور فاخر" : "Notes: Smoked Natural Oud · Sandalwood · Royal Incense",
      size: "100 ml",
      price: "740 SAR",
      badge: isAr ? "إصدار حصري" : "Exclusive Edition",
      image: "/elore-assets/hero-perfume-ritual-desktop-v3.avif",
      href: "/shop",
    },
    {
      id: "rose-de-soir",
      name: isAr ? "ورد المساء — Rose de Soir" : "Rose de Soir Eau de Parfum",
      category: isAr ? "Eau de Parfum" : "Eau de Parfum",
      notes: isAr ? "نوتات: ورد دمشقي نادر · مسك أبيض نقي · لمسات البرغموت" : "Notes: Rare Damask Rose · Pure White Musk · Bergamot",
      size: "100 ml",
      price: "590 SAR",
      badge: isAr ? "نفحات أنثوية" : "Floral Harmony",
      image: "/elore-assets/saudi-evening-ritual-concept-1672x941.avif",
      href: "/shop",
    },
    {
      id: "coffret-de-luxe",
      name: isAr ? "طقوس الإهداء الفاخرة — Coffret de Luxe" : "Coffret de Luxe Ritual Set",
      category: isAr ? "مجموعة الهدايا الملكية" : "Royal Gifting Coffret",
      notes: isAr ? "طقم ثلاثي فاخر مع تغليف الحرير والشمع وختم إيلور باريس" : "Curated Trio with Silk Wrap, Wax Seal & Gift Card",
      size: isAr ? "طقم متكامل" : "Full Set",
      price: "890 SAR",
      badge: isAr ? "هدية مثالية" : "Prestige Gift",
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
              {isAr ? "العطور الباريسية الراقية · HAUTE PARFUMERIE" : "PARISIAN HAUTE PARFUMERIE"}
            </span>

            <h1 id="hero-perfume-title" className={styles.heroTitle}>
              {isAr ? (
                <>
                  عنبر ملكي
                  <br />
                  <span style={{ color: "#653846", fontWeight: 400 }}>Amber Royal Extrait</span>
                </>
              ) : (
                <>
                  Amber Royal
                  <br />
                  <span style={{ color: "#653846", fontWeight: 400 }}>Extrait de Parfum</span>
                </>
              )}
            </h1>

            <p className={styles.heroLead}>
              {isAr
                ? "توليفة نادرة مستوحاة من فخامة البلاط الباريسي، تجمع بين دفء العنبر النقي والزعفران الملكي ولمسات الباتشولي المدخن، مع تركيز استثنائي وثبات يتجاوز 24 ساعة."
                : "A rare olfactory creation inspired by Parisian luxury courts. Combining pure warm amber, royal saffron, and smoked patchouli with an extraordinary 24-hour longevity."}
            </p>

            {/* Olfactory Notes Card */}
            <div className={styles.olfactoryCard}>
              <div className={styles.olfactoryHeader}>
                <span>{isAr ? "الهرم العطري — Pyramide Olfactive" : "Olfactory Pyramid"}</span>
                <span style={{ color: "#C5A059" }}>100 ml · 30% Vol</span>
              </div>
              <div className={styles.olfactoryNotesList}>
                <div className={styles.olfactoryNoteItem}>
                  <span className={styles.olfactoryNoteLabel}>{isAr ? "القمة" : "Top Notes"}</span>
                  <span className={styles.olfactoryNoteValue}>{isAr ? "برغموت إيطالي، زعفران" : "Calabrian Bergamot, Saffron"}</span>
                </div>
                <div className={styles.olfactoryNoteItem}>
                  <span className={styles.olfactoryNoteLabel}>{isAr ? "القلب" : "Heart Notes"}</span>
                  <span className={styles.olfactoryNoteValue}>{isAr ? "ورد دمشقي، ياسمين" : "Damask Rose, French Jasmine"}</span>
                </div>
                <div className={styles.olfactoryNoteItem}>
                  <span className={styles.olfactoryNoteLabel}>{isAr ? "القاعدة" : "Base Notes"}</span>
                  <span className={styles.olfactoryNoteValue}>{isAr ? "عنبر ملكي، عود، صندل" : "Royal Amber, Oud, Sandalwood"}</span>
                </div>
              </div>
            </div>

            {/* Price & Actions */}
            <div className={styles.heroActionsBar}>
              <div className={styles.heroPriceTag}>
                <span className={styles.heroPriceValue}>680 {isAr ? "ر.س" : "SAR"}</span>
                <span className={styles.heroPriceNote}>{isAr ? "شامل الضريبة والشحن الفاخر المجاني" : "Inc. VAT & Complimentary White-Glove Delivery"}</span>
              </div>

              <TrackedLink
                href={href("/shop")}
                className={styles.primaryButton}
                analyticsLabel="hero_order_amber_royal"
                analyticsSurface="hero_stage"
              >
                <span>{isAr ? "اطلب العطر الآن" : "Order Flacon Now"}</span>
                <span>←</span>
              </TrackedLink>

              <TrackedLink
                href={href("/shop")}
                className={styles.secondaryButton}
                analyticsLabel="hero_explore_collection"
                analyticsSurface="hero_stage"
              >
                {isAr ? "استكشف المجموعة الكاملة" : "Explore Full Collection"}
              </TrackedLink>
            </div>
          </div>

          {/* Authentic Perfume Flacon on Limestone Pedestal */}
          <div className={styles.heroMediaStage}>
            <div className={styles.heroPedestal}>
              <Image
                src="/elore-assets/perfume-amber-flacon-editorial-concept-1672x941.avif"
                alt={isAr ? "زجاجة عطر عنبر ملكي إيلور باريس على قاعدة حجرية" : "Éloré Paris Amber Royal Flacon on Limestone"}
                fill
                priority
                sizes="(max-width: 840px) 100vw, 540px"
                className={styles.heroPedestalImage}
              />
              <div className={styles.heroFloatingBadge}>
                <span style={{ color: "#C5A059" }}>✦</span>
                <span>{isAr ? "زجاجة كريستال فاخرة مصنوعة في فرنسا" : "Handcrafted French Crystal Flacon"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HAUTE PARFUMERIE CRAFT & STANDARDS STRIP */}
      <section className={styles.craftStrip} aria-label={isAr ? "معايير العطور الفاخرة" : "Haute Parfumerie Standards"}>
        <div className={styles.craftContainer}>
          <div className={styles.craftItem}>
            <div className={styles.craftIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.craftTitle}>{isAr ? "زيوت عطرية نقية من غراس" : "Pure Grasse Oils"}</h3>
              <p className={styles.craftText}>{isAr ? "مكونات طبيعية مقطرة بأعلى معايير العطور الفرنسية" : "100% natural essences distilled in Grasse, France"}</p>
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
              <h3 className={styles.craftTitle}>{isAr ? "ثبات يتجاوز 24 ساعة" : "24h+ Long-Lasting"}</h3>
              <p className={styles.craftText}>{isAr ? "تركيز Extrait de Parfum عالي الكثافة وفائق الانتشار" : "High-density Extrait de Parfum with remarkable sillage"}</p>
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
              <h3 className={styles.craftTitle}>{isAr ? "شحن فاخر مجاني ومؤمن" : "Complimentary Delivery"}</h3>
              <p className={styles.craftText}>{isAr ? "توصيل سريع ومؤمن لكافة مناطق المملكة العربية السعودية" : "Fast, secured delivery across the Kingdom of Saudi Arabia"}</p>
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
              <h3 className={styles.craftTitle}>{isAr ? "عينة تجربة مجانية مرفقة" : "Complimentary Sample"}</h3>
              <p className={styles.craftText}>{isAr ? "جرب العطر أولاً مع إمكانية الإرجاع السهل للزجاجة المغلقة" : "Sample first with effortless return on sealed flacon"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE FLACON COLLECTION SHOWCASE */}
      <section className={styles.gallerySection} aria-labelledby="flacon-collection-title">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>
            {isAr ? "المجموعة الحصرية · COLLECTION PRIVÉE" : "COLLECTION PRIVÉE"}
          </span>
          <h2 id="flacon-collection-title" className={styles.sectionTitle}>
            {isAr ? "روائع العطور الباريسية الفاخرة" : "Masterpieces of Parisian Haute Parfumerie"}
          </h2>
          <p className={styles.sectionLead}>
            {isAr
              ? "قوارير أيقونية مصاغة بحرفية متناهية، تعكس حضورًا فخمًا وتوقيعًا عطريًا لا يُنسى."
              : "Iconic flacons composed with sublime craftsmanship, delivering magnetic presence and unforgettable signatures."}
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
                    <span>{isAr ? "تسوق العطر" : "Discover"}</span>
                    <span>←</span>
                  </span>
                </div>
              </div>
            </TrackedLink>
          ))}
        </div>
      </section>

      {/* 4. THE ART OF GIFTING (LE COFFRET DE LUXE) */}
      <section className={styles.giftingSection} aria-labelledby="gifting-experience-title">
        <div className={styles.giftingCard}>
          <div className={styles.giftingMedia}>
            <Image
              src="/elore-assets/gifting-ribbon-ritual-concept-1536w.avif"
              alt={isAr ? "طقس تغليف الهدايا الملكية إيلور باريس" : "Éloré Paris Royal Gifting Ritual"}
              fill
              sizes="(max-width: 840px) 100vw, 50vw"
            />
          </div>

          <div className={styles.giftingBody}>
            <span className={styles.giftingEyebrow}>
              {isAr ? "فن الإهداء الباريسي · L'ART D'OFFRIR" : "THE ART OF GIFTING"}
            </span>
            <h2 id="gifting-experience-title" className={styles.giftingTitle}>
              {isAr ? "هدية تليق بأرقى المناسبات" : "A Gift Befitting the Finest Occasions"}
            </h2>
            <p className={styles.giftingText}>
              {isAr
                ? "كل زجاجة عطر من إيلور باريس تصلكم في صندوق فاخر محاط بشريط حريري فرنسي، ومختومة بالشمع الملكي مع بطاقة إهداء مخصصة، لتكون الهدية الأبهى لمن تحبون."
                : "Every Éloré Paris flacon arrives in a luxury presentation box wrapped in French silk ribbon, sealed with royal wax, and accompanied by a bespoke gold-foiled card."}
            </p>
            <div>
              <TrackedLink
                href={href("/shop/beauty-sets")}
                className={styles.primaryButton}
                analyticsLabel="gifting_explore_sets"
                analyticsSurface="gifting_card"
              >
                <span>{isAr ? "استكشف أطقم الهدايا" : "Explore Gift Sets"}</span>
                <span>←</span>
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      {/* Service Strip integration if provided */}
      {serviceStrip ? <div>{serviceStrip}</div> : null}

      {/* 5. NEWSLETTER SIGNUP */}
      <section className={styles.newsletterSection} aria-label={isAr ? "النادي العطري الخاص" : "Haute Parfumerie Club"}>
        <NewsletterSignup locale={locale} />
      </section>
    </div>
  );
}
