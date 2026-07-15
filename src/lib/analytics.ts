import type { LinkProps } from "next/link";

export type AnalyticsEventName =
  | "page_view"
  | "navigation_click"
  | "cta_click"
  | "add_to_cart"
  | "cart_update"
  | "checkout_option_change"
  | "checkout_start"
  | "checkout_complete"
  | "filter_apply"
  | "newsletter_signup"
  | "back_in_stock_request"
  | "ops_notification_status_update"
  | "ops_order_status_update"
  | "ops_release_handoff_submit"
  | "ops_release_decision_submit"
  | "search_submit"
  | "search_result_click"
  | "track_order_lookup";

export type AnalyticsEventValue = string | number | boolean;

export type AnalyticsProperties = Record<string, AnalyticsEventValue>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (
      command: "event",
      eventName: string,
      eventParams?: Record<string, unknown>,
    ) => void;
  }
}

export function getPageType(pathname: string) {
  const normalizedPathname = pathname.replace(/^\/(?:ar|en)(?=\/|$)/, "") || "/";

  if (normalizedPathname === "/") {
    return "home";
  }

  if (normalizedPathname === "/concerns") {
    return "concern_index";
  }

  if (normalizedPathname === "/ingredients") {
    return "ingredient_index";
  }

  if (normalizedPathname === "/routines") {
    return "routine_index";
  }

  if (normalizedPathname === "/journal") {
    return "journal_index";
  }

  if (normalizedPathname === "/shop") {
    return "shop_index";
  }

  if (normalizedPathname.startsWith("/journal/")) {
    return "article";
  }

  if (
    normalizedPathname.startsWith("/product/") ||
    normalizedPathname.startsWith("/products/")
  ) {
    return "product";
  }

  if (normalizedPathname.startsWith("/concerns/")) {
    return "concern";
  }

  if (normalizedPathname.startsWith("/ingredients/")) {
    return "ingredient";
  }

  if (normalizedPathname.startsWith("/routines/")) {
    return "routine";
  }

  if (normalizedPathname.startsWith("/shop/")) {
    return "collection";
  }

  if (normalizedPathname === "/cart") {
    return "cart";
  }

  if (normalizedPathname === "/checkout") {
    return "checkout";
  }

  if (normalizedPathname.startsWith("/checkout/")) {
    return "checkout_success";
  }

  if (normalizedPathname === "/search") {
    return "search";
  }

  if (normalizedPathname === "/faq") {
    return "faq";
  }

  if (normalizedPathname === "/contact") {
    return "contact";
  }

  if (normalizedPathname === "/about") {
    return "about";
  }

  if (normalizedPathname === "/terms") {
    return "terms";
  }

  if (pathname === "/track-order") {
    return "order_tracking";
  }

  if (pathname === "/ops-access") return "ops_access";
  if (pathname === "/ops") return "ops_dashboard";
  if (pathname === "/ops/catalog") return "ops_catalog";
  if (pathname === "/ops/content") return "ops_content";
  if (pathname === "/ops/release") return "ops_release";
  if (pathname === "/ops/fulfillment") return "ops_fulfillment";
  if (pathname === "/ops/orders") return "ops_orders";
  if (pathname === "/ops/audit") return "ops_audit";
  if (pathname === "/ops/notifications") return "ops_notifications";

  if (normalizedPathname.startsWith("/trust/")) {
    return "trust_policy";
  }

  if (normalizedPathname === "/trust") {
    return "trust";
  }

  return "other";
}

export function getPathFromHref(href: LinkProps["href"]) {
  if (typeof href === "string") {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      try {
        return new URL(href).pathname;
      } catch {
        return href;
      }
    }

    return href;
  }

  if (typeof href === "object" && "pathname" in href && href.pathname) {
    return href.pathname.toString();
  }

  return "/";
}

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties,
) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    event: eventName,
    ...properties,
  };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, properties);
  }
}
