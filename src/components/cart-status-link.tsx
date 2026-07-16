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
      // The label collapses to font-size 0 on narrow viewports, so without an
      // icon the control rendered as an empty box with no affordance at all.
      // The icon is the constant; the word is the enhancement.
      aria-label={label}
      className={className}
      analyticsEvent="navigation_click"
      analyticsLabel="header_cart"
      analyticsSurface="header_cart"
      analyticsDestinationType="cart"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M5.5 8h13l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.4H8.2a1.6 1.6 0 0 1-1.6-1.4L5.5 8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 10.5V7a3 3 0 1 1 6 0v3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span aria-hidden="true">{label}</span>
      {isHydrated && cartCount > 0 ? (
        <span className={badgeClassName} aria-label={`${cartCount} ${countLabel}`}>
          {cartCount}
        </span>
      ) : null}
    </TrackedLink>
  );
}
