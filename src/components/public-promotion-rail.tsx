import Image from "next/image";
import { TrackedLink } from "@/components/tracked-link";
import type { Locale } from "@/lib/i18n";
import { listPublicPromotions } from "@/lib/promotion-authority";
import styles from "./public-promotion-rail.module.css";

export function PublicPromotionRail({ locale }: { locale: Locale }) {
  const promotions = listPublicPromotions();
  if (!promotions.length) return null;

  return (
    <section className={styles.rail} aria-label={locale === "ar" ? "العروض الحالية" : "Current offers"}>
      {promotions.map((promotion) => (
        <article className={styles.card} key={promotion.id}>
          {promotion.imageUrl ? (
            <Image
              src={promotion.imageUrl}
              alt=""
              fill
              sizes="(max-width: 720px) 100vw, 50vw"
              className={styles.image}
              unoptimized
            />
          ) : null}
          <div className={styles.shade} aria-hidden="true" />
          <div className={styles.copy}>
            {promotion.badge ? <span>{promotion.badge}</span> : null}
            <h2>{locale === "ar" ? promotion.titleAr : promotion.titleEn}</h2>
            <p>{locale === "ar" ? promotion.descriptionAr : promotion.descriptionEn}</p>
            <TrackedLink
              href={promotion.path}
              analyticsEvent="select_promotion"
              analyticsLabel={`promotion_${promotion.id}`}
              analyticsSurface="home_promotion"
              analyticsProperties={{ promotion_id: promotion.id }}
            >
              {locale === "ar" ? "اكتشفي العرض" : "Discover the offer"}
            </TrackedLink>
          </div>
        </article>
      ))}
    </section>
  );
}
