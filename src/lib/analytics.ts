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
  | "ops_order_status_update"
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
  if (pathname === "/") {
    return "home";
  }

  if (pathname === "/concerns") {
    return "concern_index";
  }

  if (pathname === "/ingredients") {
    return "ingredient_index";
  }

  if (pathname === "/routines") {
    return "routine_index";
  }

  if (pathname === "/journal") {
    return "journal_index";
  }

  if (pathname === "/shop") {
    return "shop_index";
  }

  if (pathname.startsWith("/journal/")) {
    return "article";
  }

  if (pathname.startsWith("/products/")) {
    return "product";
  }

  if (pathname.startsWith("/concerns/")) {
    return "concern";
  }

  if (pathname.startsWith("/ingredients/")) {
    return "ingredient";
  }

  if (pathname.startsWith("/routines/")) {
    return "routine";
  }

  if (pathname.startsWith("/shop/")) {
    return "collection";
  }

  if (pathname === "/cart") {
    return "cart";
  }

  if (pathname === "/checkout") {
    return "checkout";
  }

  if (pathname.startsWith("/checkout/")) {
    return "checkout_success";
  }

  if (pathname === "/search") {
    return "search";
  }

  if (pathname === "/faq") {
    return "faq";
  }

  if (pathname === "/contact") {
    return "contact";
  }

  if (pathname === "/about") {
    return "about";
  }

  if (pathname === "/terms") {
    return "terms";
  }

  if (pathname === "/track-order") {
    return "order_tracking";
  }

  if (pathname === "/ops-access") {
    return "ops_access";
  }

  if (pathname === "/ops") {
    return "ops_dashboard";
  }

  if (pathname === "/ops/catalog") {
    return "ops_catalog";
  }

  if (pathname === "/ops/fulfillment") {
    return "ops_fulfillment";
  }

  if (pathname === "/ops/orders") {
    return "ops_orders";
  }

  if (pathname.startsWith("/trust/")) {
    return "trust_policy";
  }

  if (pathname === "/trust") {
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
