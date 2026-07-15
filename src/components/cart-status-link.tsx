"use client";

import { useCart } from "@/components/cart-provider";
import { TrackedLink } from "@/components/tracked-link";

type CartStatusLinkProps = {
  className?: string;
  badgeClassName?: string;
  href?: string;
  label?: string;
  countLabel?: string;
};

export function CartStatusLink({
  className,
  badgeClassName,
  href = "/cart",
  label = "السلة",
  countLabel = "عناصر في السلة",
}: CartStatusLinkProps) {
  const { cartCount, isHydrated } = useCart();

  return (
    <TrackedLink
      href={href}
      className={className}
      analyticsEvent="navigation_click"
      analyticsLabel="header_cart"
      analyticsSurface="header_cart"
      analyticsDestinationType="cart"
    >
      <span>{label}</span>
      {isHydrated && cartCount > 0 ? (
        <span className={badgeClassName} aria-label={`${cartCount} ${countLabel}`}>
          {cartCount}
        </span>
      ) : null}
    </TrackedLink>
  );
}
