"use client";

import { TrackedLink } from "@/components/tracked-link";
import { useWishlist } from "@/components/wishlist-provider";
import type { Locale } from "@/lib/i18n";
import styles from "./wishlist-header-link.module.css";

const copy = {
  ar: { label: "المفضلة", count: (value: number) => `${value} عناصر في المفضلة` },
  en: { label: "Wishlist", count: (value: number) => `${value} items in wishlist` },
} as const;

export function WishlistHeaderLink({ locale }: { locale: Locale }) {
  const { count, isHydrated } = useWishlist();
  const label = isHydrated && count > 0 ? copy[locale].count(count) : copy[locale].label;

  return (
    <TrackedLink
      href={`/${locale}/wishlist`}
      className={styles.link}
      analyticsEvent="navigation_click"
      analyticsLabel="header_wishlist"
      analyticsSurface="header_actions"
      analyticsDestinationType="wishlist"
      aria-label={label}
      data-wishlist-header
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
      {isHydrated && count > 0 ? <span className={styles.badge}>{count > 99 ? "99+" : count}</span> : null}
    </TrackedLink>
  );
}
