"use client";

import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";

type CartStatusLinkProps = {
  className?: string;
  badgeClassName?: string;
};

export function CartStatusLink({
  className,
  badgeClassName,
}: CartStatusLinkProps) {
  const { cartCount, isHydrated } = useCart();

  return (
    <TrackedLink
      href="/cart"
      className={className}
      analyticsEvent="navigation_click"
      analyticsLabel="header_cart"
      analyticsSurface="header_cart"
      analyticsDestinationType="cart"
    >
      <span>السلة</span>
      {isHydrated && cartCount > 0 ? (
        <span className={badgeClassName} aria-label={`${cartCount} عناصر في السلة`}>
          {cartCount}
        </span>
      ) : null}
    </TrackedLink>
  );
}
