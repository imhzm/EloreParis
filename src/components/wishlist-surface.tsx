"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnalyticsViewEvent } from "@/components/analytics-view-event";
import { ProductCard } from "@/components/product-card";
import { TrackedLink } from "@/components/tracked-link";
import { useWishlist } from "@/components/wishlist-provider";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import type { PublicCatalogProduct } from "@/lib/public-catalog-types";
import styles from "./wishlist-surface.module.css";

type Props = {
  locale: Locale;
  catalogAvailable: boolean;
  products: PublicCatalogProduct[];
};

const copy = {
  ar: {
    eyebrow: "YOUR WISHLIST",
    title: "اختيارات تستحق العودة إليها.",
    lead: "مساحتك الهادئة لحفظ المنتجات المنشورة التي لفتت انتباهك، على هذا الجهاز فقط ومن دون إنشاء حساب.",
    privacy: "تُحفظ المفضلة محليًا في متصفحك ولا تُرسل إلى حساب أو ملف شخصي.",
    loadingEyebrow: "استعادة المفضلة",
    loadingTitle: "نستعيد اختياراتك المحفوظة.",
    loadingBody: "لحظة واحدة بينما نقرأ القائمة المحلية على هذا الجهاز.",
    gateEyebrow: "الكتالوج غير منشور",
    gateTitle: "اختياراتك محفوظة، لكن لا يمكن التحقق منها الآن.",
    gateBody: "لن نعرض أسماء أو أسعارًا أو صورًا حتى يصبح الكتالوج العام المعتمد متاحًا. قائمتك المحلية لن تُحذف خلال هذه الحالة.",
    emptyEyebrow: "مساحة للاختيار",
    emptyTitle: "المفضلة فارغة حاليًا.",
    emptyBody: "أضيفي القلب من بطاقة أي منتج منشور، ثم عودي لمقارنة اختياراتك بهدوء.",
    browse: "استعرضي المتجر",
    ritual: "ابني طقسك",
    count: (value: number) => `${value} ${value === 1 ? "اختيار منشور" : "اختيارات منشورة"}`,
    gridLabel: "المنتجات المحفوظة",
    pruned: (value: number) => `أزلنا ${value} ${value === 1 ? "اختيارًا لم يعد منشورًا" : "اختيارات لم تعد منشورة"} من القائمة المحلية.`,
  },
  en: {
    eyebrow: "YOUR WISHLIST",
    title: "Choices worth returning to.",
    lead: "A quiet place for products from the published catalogue that caught your attention, saved only on this device without an account.",
    privacy: "Your wishlist stays in this browser and is not attached to an account or profile.",
    loadingEyebrow: "Restoring your wishlist",
    loadingTitle: "Bringing back your saved choices.",
    loadingBody: "One moment while we read the local list on this device.",
    gateEyebrow: "Catalogue not published",
    gateTitle: "Your choices are saved, but cannot be verified now.",
    gateBody: "We will not show names, prices or imagery until the approved public catalogue is available. Your local list will not be deleted in this state.",
    emptyEyebrow: "Room to choose",
    emptyTitle: "Your wishlist is empty.",
    emptyBody: "Use the heart on any published product card, then return to compare your choices at your own pace.",
    browse: "Browse the shop",
    ritual: "Build your ritual",
    count: (value: number) => `${value} published ${value === 1 ? "choice" : "choices"}`,
    gridLabel: "Saved products",
    pruned: (value: number) => `We removed ${value} ${value === 1 ? "choice that is no longer published" : "choices that are no longer published"} from this local list.`,
  },
} as const;

function StateCard({
  state,
  eyebrow,
  title,
  body,
  children,
}: {
  state: "loading" | "gated" | "empty";
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={styles.stateCard} data-wishlist-state={state} aria-busy={state === "loading"}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1>{title}</h1>
      <p>{body}</p>
      {children}
    </section>
  );
}

export function WishlistSurface({ locale, catalogAvailable, products }: Props) {
  const text = copy[locale];
  const pathname = usePathname() ?? `/${locale}/wishlist`;
  const { isHydrated, removeMany, slugs } = useWishlist();
  const [removedStaleCount, setRemovedStaleCount] = useState(0);
  const lastPrunedKey = useRef("");
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products],
  );
  const visibleProducts = slugs
    .map((slug) => productMap.get(slug))
    .filter((product): product is PublicCatalogProduct => Boolean(product));
  const staleSlugs = useMemo(
    () => catalogAvailable ? slugs.filter((slug) => !productMap.has(slug)) : [],
    [catalogAvailable, productMap, slugs],
  );

  useEffect(() => {
    if (!isHydrated || !catalogAvailable || staleSlugs.length === 0) return;
    const pruneKey = [...staleSlugs].sort().join("|");
    if (lastPrunedKey.current === pruneKey) return;
    let isActive = true;
    queueMicrotask(() => {
      if (!isActive) return;
      lastPrunedKey.current = pruneKey;
      setRemovedStaleCount(staleSlugs.length);
      removeMany(staleSlugs);
      trackAnalyticsEvent("wishlist_remove", {
        source_path: pathname,
        source_page_type: getPageType(pathname),
        source_surface: "wishlist_catalog_reconciliation",
        reason: "no_longer_published",
        removed_count: staleSlugs.length,
      });
    });
    return () => {
      isActive = false;
    };
  }, [catalogAvailable, isHydrated, pathname, removeMany, staleSlugs]);

  if (!isHydrated) {
    return (
      <div className={styles.page} data-wishlist-surface>
        <StateCard
          state="loading"
          eyebrow={text.loadingEyebrow}
          title={text.loadingTitle}
          body={text.loadingBody}
        />
      </div>
    );
  }

  const viewEvent = (
    <AnalyticsViewEvent
      eventName="wishlist_view"
      eventKey={`wishlist:${locale}:${catalogAvailable}`}
      properties={{
        locale,
        catalog_available: catalogAvailable,
        saved_count: slugs.length,
        published_count: visibleProducts.length,
      }}
    />
  );

  if (!catalogAvailable) {
    return (
      <div className={styles.page} data-wishlist-surface>
        {viewEvent}
        <StateCard
          state="gated"
          eyebrow={text.gateEyebrow}
          title={text.gateTitle}
          body={text.gateBody}
        >
          <div className={styles.stateActions}>
            <TrackedLink href={`/${locale}/shop`} analyticsLabel="wishlist_gate_shop" analyticsSurface="wishlist_state" analyticsDestinationType="shop_index">{text.browse}</TrackedLink>
          </div>
        </StateCard>
      </div>
    );
  }

  if (visibleProducts.length === 0) {
    return (
      <div className={styles.page} data-wishlist-surface>
        {viewEvent}
        <StateCard
          state="empty"
          eyebrow={text.emptyEyebrow}
          title={text.emptyTitle}
          body={text.emptyBody}
        >
          {removedStaleCount > 0 ? <p className={styles.prunedNotice} role="status">{text.pruned(removedStaleCount)}</p> : null}
          <div className={styles.stateActions}>
            <TrackedLink href={`/${locale}/shop`} analyticsLabel="wishlist_empty_shop" analyticsSurface="wishlist_state" analyticsDestinationType="shop_index">{text.browse}</TrackedLink>
            <TrackedLink href={`/${locale}/rituals/builder`} analyticsLabel="wishlist_empty_ritual" analyticsSurface="wishlist_state" analyticsDestinationType="ritual_builder">{text.ritual}</TrackedLink>
          </div>
        </StateCard>
      </div>
    );
  }

  return (
    <div className={styles.page} data-wishlist-surface data-wishlist-state="ready">
      {viewEvent}
      <section className={styles.hero} aria-labelledby="wishlist-title">
        <Image
          src="/elore-assets/gifting-folds-concept-1536x1024.avif"
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow} lang="en">{text.eyebrow}</p>
          <h1 id="wishlist-title">{text.title}</h1>
          <p>{text.lead}</p>
          <small>{text.privacy}</small>
        </div>
      </section>

      <section className={styles.collection} aria-labelledby="wishlist-products-title">
        <header>
          <div>
            <p className={styles.eyebrow} lang="en">CURATED BY YOU</p>
            <h2 id="wishlist-products-title">{text.count(visibleProducts.length)}</h2>
          </div>
          <TrackedLink href={`/${locale}/shop`} analyticsLabel="wishlist_ready_shop" analyticsSurface="wishlist_header" analyticsDestinationType="shop_index">{text.browse}</TrackedLink>
        </header>
        {removedStaleCount > 0 ? <p className={styles.prunedNotice} role="status">{text.pruned(removedStaleCount)}</p> : null}
        <div className={styles.grid} aria-label={text.gridLabel}>
          {visibleProducts.map((product, index) => (
            <ProductCard key={product.slug} product={product} locale={locale} priority={index < 2} />
          ))}
        </div>
      </section>
    </div>
  );
}
