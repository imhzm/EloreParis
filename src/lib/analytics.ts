import type { LinkProps } from "next/link";

export type AnalyticsEventName =
  | "page_view"
  | "navigation_click"
  | "cta_click"
  | "view_item"
  | "select_item"
  | "view_cart"
  | "begin_checkout"
  | "select_promotion"
  | "web_vital"
  | "add_to_cart"
  | "cart_update"
  | "checkout_option_change"
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

export type WebVitalName = "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";
export type WebVitalRating = "good" | "needs-improvement" | "poor";
export type WebVitalNavigationType =
  | "navigate"
  | "reload"
  | "back-forward"
  | "back-forward-cache"
  | "prerender"
  | "restore";

export type WebVitalMetricInput = {
  name: string;
  id: string;
  value: number;
  delta: number;
  rating: string;
  navigationType?: string;
};

export type WebVitalEventProperties = {
  name: WebVitalName;
  id: string;
  value: number;
  delta: number;
  rating: WebVitalRating;
  navigationType?: WebVitalNavigationType;
};

const WEB_VITAL_NAMES = new Set<WebVitalName>([
  "CLS",
  "FCP",
  "FID",
  "INP",
  "LCP",
  "TTFB",
]);
const WEB_VITAL_RATINGS = new Set<WebVitalRating>([
  "good",
  "needs-improvement",
  "poor",
]);
const WEB_VITAL_NAVIGATION_TYPES = new Set<WebVitalNavigationType>([
  "navigate",
  "reload",
  "back-forward",
  "back-forward-cache",
  "prerender",
  "restore",
]);
const WEB_VITAL_PROPERTY_KEYS = new Set([
  "name",
  "id",
  "value",
  "delta",
  "rating",
  "navigationType",
]);

function isWebVitalName(value: string): value is WebVitalName {
  return WEB_VITAL_NAMES.has(value as WebVitalName);
}

function isWebVitalRating(value: string): value is WebVitalRating {
  return WEB_VITAL_RATINGS.has(value as WebVitalRating);
}

function isWebVitalNavigationType(
  value: string,
): value is WebVitalNavigationType {
  return WEB_VITAL_NAVIGATION_TYPES.has(value as WebVitalNavigationType);
}

export function createWebVitalEventProperties(
  metric: WebVitalMetricInput,
): WebVitalEventProperties | null {
  if (
    !isWebVitalName(metric.name) ||
    !isWebVitalRating(metric.rating) ||
    !/^[A-Za-z0-9._-]{1,128}$/.test(metric.id) ||
    !Number.isFinite(metric.value) ||
    !Number.isFinite(metric.delta)
  ) {
    return null;
  }

  const properties: WebVitalEventProperties = {
    name: metric.name,
    id: metric.id,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
  };

  if (
    metric.navigationType &&
    isWebVitalNavigationType(metric.navigationType)
  ) {
    properties.navigationType = metric.navigationType;
  }

  return properties;
}

function isWebVitalEventProperties(
  properties: AnalyticsProperties,
): properties is WebVitalEventProperties {
  return (
    Object.keys(properties).every((key) => WEB_VITAL_PROPERTY_KEYS.has(key)) &&
    typeof properties.name === "string" &&
    typeof properties.id === "string" &&
    typeof properties.value === "number" &&
    typeof properties.delta === "number" &&
    typeof properties.rating === "string" &&
    (properties.navigationType === undefined ||
      (typeof properties.navigationType === "string" &&
        isWebVitalNavigationType(properties.navigationType))) &&
    createWebVitalEventProperties({
      name: properties.name,
      id: properties.id,
      value: properties.value,
      delta: properties.delta,
      rating: properties.rating,
      navigationType: properties.navigationType,
    }) !== null
  );
}

type AnalyticsPropertiesForEvent<EventName extends AnalyticsEventName> =
  EventName extends "web_vital" ? WebVitalEventProperties : AnalyticsProperties;

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

export const ANALYTICS_CONSENT_STORAGE_KEY = "elore.analytics.consent.v1";
export const ANALYTICS_CONSENT_EVENT = "elore:analytics-consent-change";

export function hasAnalyticsConsent() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY) === "granted";
  } catch {
    // Storage can be unavailable in hardened/private browser contexts. Consent
    // must fail closed rather than silently becoming an analytics opt-in.
    return false;
  }
}

export function setAnalyticsConsent(consent: "granted" | "denied") {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
    window.dispatchEvent(
      new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: { consent } }),
    );
    return true;
  } catch {
    return false;
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

  if (normalizedPathname === "/track-order") {
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

export function trackAnalyticsEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  properties: AnalyticsPropertiesForEvent<EventName>,
) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) {
    return false;
  }

  if (
    eventName === "web_vital" &&
    !isWebVitalEventProperties(properties as AnalyticsProperties)
  ) {
    return false;
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

  return true;
}
