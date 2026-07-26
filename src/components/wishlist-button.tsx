"use client";

import { usePathname } from "next/navigation";
import { useWishlist } from "@/components/wishlist-provider";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import styles from "./wishlist-button.module.css";

type Props = {
  productSlug: string;
  productName: string;
  locale: Locale;
  surface: string;
  className?: string;
};

const copy = {
  ar: { add: "أضيفي إلى المفضلة", remove: "أزيلي من المفضلة", loading: "جارٍ تحميل المفضلة" },
  en: { add: "Add to wishlist", remove: "Remove from wishlist", loading: "Loading wishlist" },
} as const;

export function WishlistButton({
  productSlug,
  productName,
  locale,
  surface,
  className,
}: Props) {
  const pathname = usePathname() ?? `/${locale}`;
  const { has, isHydrated, toggle } = useWishlist();
  const isSaved = isHydrated && has(productSlug);
  const label = !isHydrated
    ? copy[locale].loading
    : `${isSaved ? copy[locale].remove : copy[locale].add}: ${productName}`;

  const handleToggle = () => {
    if (!isHydrated) return;
    toggle(productSlug);
    trackAnalyticsEvent(isSaved ? "wishlist_remove" : "wishlist_add", {
      source_path: pathname,
      source_page_type: getPageType(pathname),
      source_surface: surface,
      product_slug: productSlug,
    });
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${className ?? ""}`}
      aria-label={label}
      aria-pressed={isSaved}
      aria-busy={!isHydrated}
      disabled={!isHydrated}
      data-wishlist-button
      data-saved={isSaved}
      onClick={handleToggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
    </button>
  );
}
