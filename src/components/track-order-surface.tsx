"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";
import { getOrderFulfillmentPlan, getOrderProviderHandoff } from "@/lib/fulfillment";
import type { StoredNotification } from "@/lib/notification-types";
import {
  fetchRecentOrderFromAuthority,
  fetchTrackedOrderFromAuthority,
} from "@/lib/order-authority-client";
import {
  getOrderStatusMeta,
  getOrderTimeline,
  getPaymentMethodById,
  getShippingMethodById,
  type StoredOrder,
} from "@/lib/orders";
import { collectionDirectory, footerPolicyLinks, products } from "@/lib/site-content";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./order-flow.module.css";

type TrackOrderSurfaceProps = {
  initialOrderNumber?: string;
  locale: Locale;
};

const copy = {
  ar: {
    heroTitle: "ØªØªØ¨Ù‘Ø¹ÙŠ Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ø¨Ù…Ø±Ø¬Ø¹ ÙˆØ§Ø¶Ø­ Ø¨Ø¯Ù„ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…Ø¨Ù‡Ù…Ø©.",
    heroBody: "Ø§Ø³ØªØ®Ø¯Ù…ÙŠ Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ¢Ø®Ø± Ø£Ø±Ø¨Ø¹Ø© Ø£Ø±Ù‚Ø§Ù… Ù…Ù† Ø§Ù„Ø¬ÙˆØ§Ù„ Ù„Ø¹Ø±Ø¶ Ø¢Ø®Ø± Ø­Ø§Ù„Ø© Ù…ØªØ§Ø­Ø© Ø¨Ø£Ù…Ø§Ù†.",
    needTitle: "Ù…Ø§ Ø§Ù„Ø°ÙŠ ØªØ­ØªØ§Ø¬ÙŠÙ†Ù‡ØŸ",
    needValue: "Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø¨ Ø£Ùˆ Ø¬Ù„Ø³Ø© Ø§Ù„ØªØªØ¨Ø¹ Ø§Ù„Ø­Ø§Ù„ÙŠØ©",
    needBody: "ÙŠÙ‚Ù„Ù„ Ø°Ù„Ùƒ Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ© Ø§Ù„ÙƒØ§Ù…Ù„Ø© ÙˆÙŠØ­Ø§ÙØ¸ Ø¹Ù„Ù‰ ÙˆØ¶ÙˆØ­ Ø§Ù„ØªØªØ¨Ø¹.",
    scopeTitle: "Ù…ØªØ§Ø¨Ø¹Ø© ÙˆØ§Ø¶Ø­Ø© ÙˆØ¢Ù…Ù†Ø© Ù„Ù„Ø·Ù„Ø¨",
    scopeBody: "Ù†Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…ØªØ§Ø­Ø© Ù„Ù„Ø¹Ù…ÙŠÙ„ ÙÙ‚Ø·ØŒ ÙˆÙ†ÙØµÙ„ Ø¨ÙˆØ¶ÙˆØ­ Ø¨ÙŠÙ† Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø¤ÙƒØ¯Ø© ÙˆÙ…Ø§ Ø²Ø§Ù„ Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.",
    lookupTitle: "Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ø·Ù„Ø¨",
    lookupBody: "ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ù…ØªÙ‰ ÙƒØ§Ù† Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø¨ Ù…ØªØ§Ø­Ù‹Ø§ Ù„Ø¯ÙŠÙƒ.",
    orderReference: "Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø¨",
    phoneLastFour: "Ø¢Ø®Ø± 4 Ø£Ø±Ù‚Ø§Ù… Ù…Ù† Ø§Ù„Ø¬ÙˆØ§Ù„ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ Ø¹Ù„Ù‰ Ù†ÙØ³ Ø§Ù„Ø¬Ù‡Ø§Ø²)",
    searching: "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¨Ø­Ø«...",
    showStatus: "Ø¹Ø±Ø¶ Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©",
    shippingPolicy: "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø´Ø­Ù†",
    supportTitle: "Ù‚Ø¨Ù„ Ø§Ù„ØªØªØ¨Ø¹ Ø£Ùˆ Ø¨Ø¹Ø¯Ù‡",
    supportingReference: "Ù…Ø±Ø¬Ø¹ Ù…Ø³Ø§Ù†Ø¯",
    currentStatus: "Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©",
    currentStatusFor: "Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ù„Ù„Ø·Ù„Ø¨",
    complete: "Ù…ÙƒØªÙ…Ù„",
    upcoming: "Ù‚Ø§Ø¯Ù…",
    guardrailsTitle: "Ø­Ø§ÙØ¸ÙŠ Ø¹Ù„Ù‰ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø­Ø§Ù„ÙŠ",
    continuationTitle: "Ø¥Ø°Ø§ Ø§Ø­ØªØ¬ØªÙ Ù…Ø²ÙŠØ¯Ù‹Ø§ Ù…Ù† Ø§Ù„Ø³ÙŠØ§Ù‚ØŒ Ø§Ø®ØªØ§Ø±ÙŠ Ù…Ø³Ø§Ø±Ù‹Ø§ ÙˆØ§Ø­Ø¯Ù‹Ø§ ÙÙ‚Ø·",
    noRoutes: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø±ÙˆØ§Ø¨Ø· Ø¥Ø¶Ø§ÙÙŠØ© Ù…Ø·Ù„ÙˆØ¨Ø© Ø§Ù„Ø¢Ù†. Ø§Ø¨Ù‚ÙŠ Ø¹Ù„Ù‰ Ù…Ø³Ø§Ø± Ø§Ù„ØªØªØ¨Ø¹ Ø­ØªÙ‰ ØªØªØ¶Ø­ Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©.",
    orderSummary: "Ù…Ù„Ø®Øµ Ø§Ù„Ø·Ù„Ø¨",
    trackingSummary: "Ø§Ù„Ù…Ù„Ø®Øµ Ø§Ù„Ù…Ø±ØªØ¨Ø· Ø¨Ø§Ù„ØªØªØ¨Ø¹",
    labels: ["Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ø®Ø¯Ù…Ø©", "Ø§Ù„Ø´Ø­Ù†", "Ø§Ù„Ø¯ÙØ¹", "Ø§Ù„Ù†Ø§Ù‚Ù„ Ø§Ù„Ù…Ù‚ØªØ±Ø­", "Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø²ÙˆÙ‘Ø¯", "Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø¯ÙØ¹", "Ù…Ø±Ø¬Ø¹ Ø§Ù„ØªØ³ÙˆÙŠØ©", "Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø´Ø­Ù†", "Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹", "Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠ", "Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©"],
    pending: "Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±",
    noManualReview: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø±Ø§Ø¬Ø¹Ø© ÙŠØ¯ÙˆÙŠØ© Ø¥Ø¶Ø§ÙÙŠØ© Ù…Ø·Ù„ÙˆØ¨Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ Ø­Ø§Ù„ÙŠÙ‹Ø§.",
    noNotifications: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø±Ø³Ø§Ù„Ø© ØªØ´ØºÙŠÙ„ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø¢Ù†.",
    completePayment: "Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ø¯ÙØ¹",
    myOrders: "Ø¹Ø±Ø¶ Ø·Ù„Ø¨Ø§ØªÙŠ",
    anotherDevice: "ÙØªØ­ Ø·Ù„Ø¨Ø§ØªÙŠ Ø¹Ù„Ù‰ Ø¬Ù‡Ø§Ø² Ø¢Ø®Ø±",
    missingReference: "Ø£Ø¯Ø®Ù„ÙŠ Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø¥Ø¸Ù‡Ø§Ø± Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©.",
    notFound: "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø·Ù„Ø¨ Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.",
    oneDecision: "ØªØªØ¨Ù‘Ø¹ Ù‚Ø±Ø§Ø± ÙˆØ§Ø­Ø¯",
    oneRoute: "ØªØªØ¨Ù‘Ø¹ Ù…Ø³Ø§Ø± ÙˆØ§Ø­Ø¯",
    multipleRoutes: "ØªØªØ¨Ù‘Ø¹ Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª",
    oneDecisionBody: "Ø±Ø§Ø¬Ø¹ÙŠ Ø­Ø§Ù„Ø© Ø§Ù„ØªÙ†ÙÙŠØ° Ø£ÙˆÙ„Ù‹Ø§ØŒ Ø«Ù… Ø§Ø³ØªØ®Ø¯Ù…ÙŠ Ø±Ø§Ø¨Ø· Ø¯Ø¹Ù… ÙˆØ§Ø­Ø¯Ù‹Ø§ ÙÙ‚Ø· Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©.",
    oneRouteBody: "ØªØ§Ø¨Ø¹ÙŠ Ø§Ù„Ø·Ù„Ø¨ Ù…Ù† Ø§Ù„Ø±Ø§Ø¨Ø· Ø§Ù„Ø£Ù‚Ø±Ø¨ Ø¥Ù„Ù‰ Ù†ÙØ³ Ù…Ø³Ø§Ø± Ø§Ù„Ø´Ø±Ø§Ø¡.",
    multipleRoutesBody: "Ø±ÙƒØ²ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ© Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ù‚Ø¨Ù„ ÙØªØ­ Ø£ÙŠ Ù…Ø³Ø§Ø± ØªØ³ÙˆÙ‚ Ø¬Ø¯ÙŠØ¯.",
    statusLabel: "Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©",
    fulfillmentLabel: "Ù…Ø³Ø§Ø± Ø§Ù„ØªÙ†ÙÙŠØ°",
    followupLabel: "Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©",
    clearFulfillment: "Ù…Ø³Ø§Ø± Ø§Ù„ØªÙ†ÙÙŠØ° Ø§Ù„Ø­Ø§Ù„ÙŠ ÙˆØ§Ø¶Ø­ Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø©.",
    codYes: "Ø§Ù„Ø¯ÙØ¹ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù… Ù…ØªØ§Ø­",
    codNo: "Ø§Ù„Ø¯ÙØ¹ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù… ØºÙŠØ± Ù…ØªØ§Ø­",
  },
  en: {
    heroTitle: "Follow the current status with a clear reference.",
    heroBody: "Use the order reference and the last four mobile digits to securely view the latest available status.",
    needTitle: "What do you need?",
    needValue: "Your order reference or current tracking session",
    needBody: "This limits reliance on full personal information and keeps tracking clear.",
    scopeTitle: "Clear, secure order tracking",
    scopeBody: "We display customer-safe information only and distinguish confirmed updates from items still under review.",
    lookupTitle: "Find your order",
    lookupBody: "You can return to the current status whenever your order reference is available.",
    orderReference: "Order reference",
    phoneLastFour: "Last 4 mobile digits (optional on the same device)",
    searching: "Searching...",
    showStatus: "Show current status",
    shippingPolicy: "Review shipping policy",
    supportTitle: "Before or after tracking",
    supportingReference: "Supporting reference",
    currentStatus: "Current status",
    currentStatusFor: "Current status for order",
    complete: "Complete",
    upcoming: "Upcoming",
    guardrailsTitle: "Keep the current order in focus",
    continuationTitle: "If you need more context, choose one route only",
    noRoutes: "No additional route is needed now. Stay with tracking until the next step is clear.",
    orderSummary: "Order summary",
    trackingSummary: "Tracking-linked summary",
    labels: ["Service zone", "Shipping", "Payment", "Suggested carrier", "Provider status", "Payment reference", "Settlement reference", "Shipping reference", "Tracking number", "Estimated total", "Follow-up method"],
    pending: "Pending",
    noManualReview: "No additional manual review is currently required for this order.",
    noNotifications: "There is no new operational message for this order.",
    completePayment: "Complete payment",
    myOrders: "View my orders",
    anotherDevice: "Open my orders on another device",
    missingReference: "Enter the order reference to show its current status.",
    notFound: "No order matched these details.",
    oneDecision: "Track one decision",
    oneRoute: "Track one route",
    multipleRoutes: "Track multiple routes",
    oneDecisionBody: "Review fulfilment first, then use one support link only if needed.",
    oneRouteBody: "Continue through the link closest to the original purchase route.",
    multipleRoutesBody: "Focus on the current operational status before starting a new shopping route.",
    statusLabel: "Current status",
    fulfillmentLabel: "Fulfilment route",
    followupLabel: "Follow-up method",
    clearFulfillment: "The current fulfilment route is clear for follow-up.",
    codYes: "COD available",
    codNo: "COD unavailable",
  },
} as const;

const englishOrderStatus = {
  received: ["Order received", "Your order has been recorded with a clear reference."],
  payment_pending: ["Payment pending", "Complete payment through the active secure payment route."],
  confirmed: ["Order confirmed", "The order is confirmed and ready for fulfilment."],
  processing: ["Being prepared", "Your items are being prepared for the next step."],
  out_for_delivery: ["Out for delivery", "Your order is in the final delivery stage."],
  payment_expired: ["Payment window expired", "The payment window ended before confirmation."],
  cancelled: ["Order cancelled", "The order and its fulfilment steps have been cancelled."],
} as const;

const englishPolicyLabels: Record<string, string> = {
  "/terms": "Terms and conditions",
  "/trust/verification": "Business information",
  "/trust/privacy": "Privacy",
  "/trust/shipping": "Shipping and delivery",
  "/trust/returns": "Returns and refunds",
  "/trust/authenticity": "Authenticity and quality",
};

const englishShippingLabels = {
  standard: "Standard shipping within Saudi Arabia",
  express: "Express shipping in covered cities",
} as const;

const englishPaymentLabels = {
  payment_link: "Secure payment link",
  cash_on_delivery: "Cash on delivery",
} as const;

function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function TrackOrderSurface({ initialOrderNumber = "", locale }: TrackOrderSurfaceProps) {
  const text = copy[locale];
  const pagePath = localizePath(locale, "/track-order");
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phoneLastFour, setPhoneLastFour] = useState("");
  const [match, setMatch] = useState<StoredOrder | null>(null);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [customerAccessHandoffPath, setCustomerAccessHandoffPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const normalizedInitialOrder = initialOrderNumber.trim().toUpperCase();

  useEffect(() => {
    if (!normalizedInitialOrder) return;

    let isActive = true;
    const runAutoLookup = async () => {
      setIsSearching(true);
      try {
        const {
          order,
          notifications: nextNotifications,
          customerAccessHandoffPath: nextCustomerAccessHandoffPath,
        } = await fetchRecentOrderFromAuthority(normalizedInitialOrder);

        if (!isActive) return;
        setMatch(order);
        setNotifications(nextNotifications);
        setCustomerAccessHandoffPath(nextCustomerAccessHandoffPath ?? null);
        setError(null);
        setOrderNumber(order.orderNumber);

        trackAnalyticsEvent("track_order_lookup", {
          source_path: pagePath,
          source_page_type: getPageType(pagePath),
          has_reference: true,
          has_phone_last4: false,
          lookup_found: true,
          order_status: order.status,
          access_mode: "order_session",
        });
      } catch {
        if (isActive) {
          setMatch(null);
          setNotifications([]);
          setCustomerAccessHandoffPath(null);
        }
      } finally {
        if (isActive) setIsSearching(false);
      }
    };

    void runAutoLookup();
    return () => {
      isActive = false;
    };
  }, [normalizedInitialOrder, pagePath]);

  const handleLookup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedOrder = orderNumber.trim().toUpperCase();
    const normalizedLastFour = phoneLastFour.replace(/\D/g, "").slice(-4);

    if (!normalizedOrder) {
      setMatch(null);
      setError(text.missingReference);
      return;
    }

    setIsSearching(true);
    setError(null);

    const lookupRequest =
      normalizedLastFour.length === 4
        ? fetchTrackedOrderFromAuthority(normalizedOrder, normalizedLastFour)
        : fetchRecentOrderFromAuthority(normalizedOrder);

    void lookupRequest
      .then(({ order, notifications: nextNotifications, customerAccessHandoffPath: nextCustomerAccessHandoffPath }) => {
        setMatch(order);
        setNotifications(nextNotifications);
        setCustomerAccessHandoffPath(nextCustomerAccessHandoffPath ?? null);

        trackAnalyticsEvent("track_order_lookup", {
          source_path: pagePath,
          source_page_type: getPageType(pagePath),
          has_reference: true,
          has_phone_last4: normalizedLastFour.length === 4,
          lookup_found: true,
          order_status: order.status,
          access_mode: normalizedLastFour.length === 4 ? "phone_last4" : "order_session",
        });
      })
      .catch((lookupError: unknown) => {
        setMatch(null);
        setNotifications([]);
        setCustomerAccessHandoffPath(null);
        setError(
          locale === "ar" && lookupError instanceof Error
            ? lookupError.message
            : text.notFound,
        );

        trackAnalyticsEvent("track_order_lookup", {
          source_path: pagePath,
          source_page_type: getPageType(pagePath),
          has_reference: true,
          has_phone_last4: normalizedLastFour.length === 4,
          lookup_found: false,
          order_status: "not_found",
          access_mode: normalizedLastFour.length === 4 ? "phone_last4" : "order_session",
        });
      })
      .finally(() => setIsSearching(false));
  };

  const fulfillmentPlan = match ? getOrderFulfillmentPlan(match) : null;
  const providerHandoff = match ? getOrderProviderHandoff(match) : null;
  const matchedProducts = match
    ? dedupeBy(
        match.lines
          .map((line) => products.find((product) => product.slug === line.productSlug))
          .filter((product): product is (typeof products)[number] => Boolean(product)),
        (product) => product.slug,
      )
    : [];
  const matchedCollections = dedupeBy(
    matchedProducts.map((product) => collectionDirectory[product.collection]),
    (collection) => collection.href,
  );
  const trackingRoutes = dedupeBy(
    matchedProducts.flatMap((product) =>
      product.pairings.map((route) => ({
        ...route,
        productName: product.name,
      })),
    ),
    (route) => route.href,
  ).slice(0, 3);
  const statusMeta = match ? getOrderStatusMeta(match.status) : null;
  const localizedStatusMeta = match && statusMeta
    ? locale === "en"
      ? { label: englishOrderStatus[match.status][0], description: englishOrderStatus[match.status][1] }
      : statusMeta
    : null;
  const trackingModeTitle =
    matchedProducts.length === 1
      ? text.oneDecision
      : matchedCollections.length === 1
        ? text.oneRoute
        : text.multipleRoutes;
  const trackingModeBody =
    matchedProducts.length === 1
      ? text.oneDecisionBody
      : matchedCollections.length === 1
        ? text.oneRouteBody
        : text.multipleRoutesBody;
  const trackingSignals =
    match && fulfillmentPlan && localizedStatusMeta
      ? [
          { label: text.statusLabel, title: localizedStatusMeta.label, body: localizedStatusMeta.description },
          {
            label: text.fulfillmentLabel,
            title: fulfillmentPlan.recommendedCarrier,
            body: fulfillmentPlan.requiresManualReview
              ? fulfillmentPlan.manualReviewReasons[0]
              : text.clearFulfillment,
          },
          { label: text.followupLabel, title: trackingModeTitle, body: trackingModeBody },
        ]
      : [];
  const trackingGuardrails =
    match && fulfillmentPlan
      ? locale === "ar"
        ? [
            "Ø§Ø¨Ø¯Ø¦ÙŠ Ø¯Ø§Ø¦Ù…Ù‹Ø§ Ø¨Ù…Ø±Ø¬Ø¹ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ¢Ø®Ø± 4 Ø£Ø±Ù‚Ø§Ù… Ù…Ù† Ø§Ù„Ø¬ÙˆØ§Ù„ Ù‚Ø¨Ù„ Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ø¥Ù„Ù‰ Ø£ÙŠ Ù‚Ù†Ø§Ø© Ø¯Ø¹Ù… Ø£Ø®Ø±Ù‰.",
            fulfillmentPlan.requiresManualReview
              ? "Ø¨Ù…Ø§ Ø£Ù† Ø§Ù„Ø·Ù„Ø¨ ÙŠØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø©ØŒ ØªØ§Ø¨Ø¹ÙŠ Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ø£ÙˆÙ„Ù‹Ø§ Ø¨Ø¯Ù„ Ø¥Ø¶Ø§ÙØ© Ø¹Ù†Ø§ØµØ± Ø¬Ø¯ÙŠØ¯Ø© Ø£Ùˆ Ø¥Ø¹Ø§Ø¯Ø© ÙØªØ­ Ø§Ù„Ø¯ÙØ¹."
              : "Ø·Ø§Ù„Ù…Ø§ Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø±Ø§Ø¬Ø¹Ø© ÙŠØ¯ÙˆÙŠØ©ØŒ ÙØ§Ù„Ø£ÙˆÙ„ÙˆÙŠØ© Ù‡ÙŠ Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„ØªÙ‚Ø¯Ù… Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠ Ø¨Ø¯Ù„ ØªØ¹Ø¯ÙŠÙ„ Ù‚Ø±Ø§Ø± Ø§Ù„Ø´Ø±Ø§Ø¡.",
            `Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ ${match.totalEstimate} Ø±.Ø³ØŒ Ù„Ø°Ù„Ùƒ ÙŠØ¬Ø¨ Ø£Ù† ØªØ¯Ø¹Ù… Ø£ÙŠ Ø®Ø·ÙˆØ© Ù„Ø§Ø­Ù‚Ø© Ù†ÙØ³ Ø§Ù„Ø·Ù„Ø¨.`,
          ]
        : [
            "Start with the order reference and last four mobile digits before using another support channel.",
            fulfillmentPlan.requiresManualReview
              ? "This order needs review. Follow its current status before starting another purchase."
              : "No manual review is pending; monitor fulfilment progress before changing the purchase decision.",
            `The current total is SAR ${match.totalEstimate}; any next step should support this order.`,
          ]
      : [];
  const fallbackCollectionRoute =
    matchedCollections[0] === undefined
      ? null
      : {
          href: matchedCollections[0].href,
          label: locale === "ar" ? `Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ ${matchedCollections[0].title}` : "Return to the collection",
          productName: matchedCollections[0].title,
        };
  const resultRoute = trackingRoutes[0] ?? fallbackCollectionRoute;
  const activePaymentUrl =
    match &&
    match.paymentMethodId === "payment_link" &&
    match.providerBindings.payment.state !== "confirmed"
      ? match.providerBindings.payment.paymentUrl
      : null;

  return (
    <div className={`${styles.page} ${styles.trackOrderPage}`}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Order tracking</p>
          <h1>{text.heroTitle}</h1>
          <p className={styles.summary}>{text.heroBody}</p>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.metricCard}>
            <p>{text.needTitle}</p>
            <strong>{text.needValue}</strong>
            <span>{text.needBody}</span>
          </div>

          <div className={styles.noticeCard}>
            <p className={styles.eyebrow}>Scope</p>
            <h2>{text.scopeTitle}</h2>
            <p>{text.scopeBody}</p>
          </div>
        </div>
      </section>

      <section className={styles.layout}>
        <form className={styles.mainCard} onSubmit={handleLookup}>
          <p className={styles.sectionTitle}>Lookup</p>
          <h2>{text.lookupTitle}</h2>
          <p>{text.lookupBody}</p>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{text.orderReference}</span>
              <input
                className={styles.textInput}
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.currentTarget.value)}
                dir="ltr"
                autoCapitalize="characters"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>{text.phoneLastFour}</span>
              <input
                className={styles.textInput}
                value={phoneLastFour}
                onChange={(event) => setPhoneLastFour(event.currentTarget.value.replace(/\D/g, "").slice(-4))}
                dir="ltr"
                inputMode="numeric"
              />
            </label>
          </div>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <div className={styles.actionColumn}>
            <button className={styles.primaryButton} type="submit" disabled={isSearching}>
              {isSearching ? text.searching : text.showStatus}
            </button>
            <TrackedLink
              href={localizePath(locale, "/trust/shipping")}
              className={styles.secondaryLink}
              analyticsLabel="track_order_to_shipping_policy"
              analyticsSurface="track_order_lookup"
              analyticsDestinationType="trust_policy"
            >
              {text.shippingPolicy}
            </TrackedLink>
          </div>
        </form>

        <div className={styles.summaryCard}>
          <p className={styles.sectionTitle}>Support</p>
          <h2>{text.supportTitle}</h2>
          <div className={styles.linkList}>
            {footerPolicyLinks.map((policy) => (
              <TrackedLink
                key={policy.href}
                href={localizePath(locale, policy.href)}
                analyticsLabel={`track_order_policy_${policy.href.split("/").at(-1) ?? "route"}`}
                analyticsSurface="track_order_policies"
                analyticsDestinationType="trust_policy"
              >
                <span>{locale === "en" ? englishPolicyLabels[policy.href] ?? policy.label : policy.label}</span>
                <span>{text.supportingReference}</span>
              </TrackedLink>
            ))}
          </div>
        </div>
      </section>

      {match && fulfillmentPlan ? (
        <section className={styles.layout}>
          <article className={styles.mainCard}>
            <p className={styles.sectionTitle}>{text.currentStatus}</p>
            <h2>{text.currentStatusFor} {match.orderNumber}</h2>

            <div className={styles.statusSummaryGrid}>
              {trackingSignals.map((signal) => (
                <article key={signal.label} className={styles.statusSummaryCard}>
                  <p className={styles.eyebrow}>{signal.label}</p>
                  <strong>{signal.title}</strong>
                  <p>{signal.body}</p>
                </article>
              ))}
            </div>

            <div className={styles.timeline}>
              {getOrderTimeline(match).map((step) => (
                <article
                  key={step.key}
                  className={`${styles.timelineItem} ${
                    step.state === "current"
                      ? styles.timelineCurrent
                      : step.state === "complete"
                        ? styles.timelineComplete
                        : styles.timelineUpcoming
                  }`}
                >
                  <div className={styles.optionHead}>
                    <strong>{locale === "en" ? englishOrderStatus[step.key][0] : step.label}</strong>
                    <span className={styles.timelineBadge}>
                      {step.state === "current" ? text.currentStatus : step.state === "complete" ? text.complete : text.upcoming}
                    </span>
                  </div>
                  <p>{locale === "en" ? englishOrderStatus[step.key][1] : step.description}</p>
                </article>
              ))}
            </div>

            <div className={styles.catalogPanelGrid}>
              <article className={styles.referenceCard}>
                <p className={styles.eyebrow}>Tracking guardrails</p>
                <h3>{text.guardrailsTitle}</h3>
                <div className={styles.cardActions}>
                  {trackingGuardrails.map((item) => (
                    <div key={item} className={styles.infoBullet}>{item}</div>
                  ))}
                </div>
              </article>

              <article className={styles.referenceCard}>
                <p className={styles.eyebrow}>Continuation routes</p>
                <h3>{text.continuationTitle}</h3>
                {trackingRoutes.length ? (
                  <div className={styles.linkList}>
                    {trackingRoutes.map((route) => (
                      <TrackedLink
                        key={route.href}
                        href={localizePath(locale, route.href)}
                        analyticsLabel={`track_order_route_${route.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                        analyticsSurface="track_order_result_routes"
                        analyticsDestinationType="support_route"
                      >
                        <span>{route.label}</span>
                        <span>{route.productName}</span>
                      </TrackedLink>
                    ))}
                  </div>
                ) : (
                  <div className={styles.infoBullet}>{text.noRoutes}</div>
                )}
              </article>
            </div>

            <div className={styles.lineList}>
              {fulfillmentPlan.linePlans.map((line) => (
                <article key={line.key} className={styles.lineItem}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{line.productName}</h3>
                      <p className={styles.lineMeta}>{line.routeLabel}</p>
                    </div>
                    <div className={styles.linePrice}>{line.sku}</div>
                  </div>

                  <div className={styles.badgeRow}>
                    <span>{line.supplierName}</span>
                    <span>{line.availability}</span>
                    <span>{line.shippingClass}</span>
                    <span>{line.codEligible ? text.codYes : text.codNo}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <div className={styles.summaryCard}>
            <p className={styles.sectionTitle}>{text.orderSummary}</p>
            <h2>{text.trackingSummary}</h2>

            <div className={styles.referenceCard}>
              <div className={styles.referenceRow}><span>{text.labels[0]}</span><strong className={styles.referenceValue}>{fulfillmentPlan.deliveryZoneLabel}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[1]}</span><strong className={styles.referenceValue}>{locale === "en" ? englishShippingLabels[match.shippingMethodId] : getShippingMethodById(match.shippingMethodId)?.label}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[2]}</span><strong className={styles.referenceValue}>{locale === "en" ? englishPaymentLabels[match.paymentMethodId] : getPaymentMethodById(match.paymentMethodId)?.label}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[3]}</span><strong className={styles.referenceValue}>{fulfillmentPlan.recommendedCarrier}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[4]}</span><strong className={styles.referenceValue}>{providerHandoff?.providerReadinessLabel ?? text.pending}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[5]}</span><strong className={styles.referenceValue}>{match.providerBindings.payment.referenceId ?? text.pending}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[6]}</span><strong className={styles.referenceValue}>{match.providerBindings.payment.settlementReference ?? text.pending}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[7]}</span><strong className={styles.referenceValue}>{match.providerBindings.shipping.bookingReference ?? text.pending}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[8]}</span><strong className={styles.referenceValue}>{match.providerBindings.shipping.trackingNumber ?? text.pending}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[9]}</span><strong className={styles.referenceValue}>{locale === "ar" ? `${match.totalEstimate} Ø±.Ø³` : `SAR ${match.totalEstimate}`}</strong></div>
              <div className={styles.referenceRow}><span>{text.labels[10]}</span><strong className={styles.referenceValue}>{trackingModeTitle}</strong></div>
            </div>

            {fulfillmentPlan.requiresManualReview ? (
              <div className={styles.inlineError}>{fulfillmentPlan.manualReviewReasons.join(" ")}</div>
            ) : (
              <div className={styles.inlineNotice}>{text.noManualReview}</div>
            )}

            <div className={styles.summaryList}>
              {notifications.length ? (
                notifications.map((notification) => (
                  <div key={notification.id} className={styles.referenceCard}>
                    <div className={styles.referenceRow}>
                      <span>{notification.label}</span>
                      <strong className={styles.referenceValue}>{notification.status}</strong>
                    </div>
                    <p>{notification.note}</p>
                  </div>
                ))
              ) : (
                <div className={styles.inlineNotice}>{text.noNotifications}</div>
              )}
            </div>

            <div className={styles.actionColumn}>
              {activePaymentUrl ? (
                <TrackedLink
                  href={activePaymentUrl}
                  className={styles.primaryLink}
                  analyticsLabel="track_order_to_payment_provider"
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="payment_provider"
                  target="_blank"
                  rel="noreferrer"
                >
                  {text.completePayment}
                </TrackedLink>
              ) : null}
              <TrackedLink
                href={localizePath(locale, "/account/orders")}
                className={styles.secondaryLink}
                analyticsLabel="track_order_to_customer_orders"
                analyticsSurface="track_order_result"
                analyticsDestinationType="account_orders"
              >
                {text.myOrders}
              </TrackedLink>
              {customerAccessHandoffPath ? (
                <TrackedLink
                  href={`${customerAccessHandoffPath}${customerAccessHandoffPath.includes("?") ? "&" : "?"}locale=${locale}`}
                  className={styles.secondaryLink}
                  analyticsLabel="track_order_to_customer_access_handoff"
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="account_access"
                >
                  {text.anotherDevice}
                </TrackedLink>
              ) : null}
              {resultRoute ? (
                <TrackedLink
                  href={localizePath(locale, resultRoute.href)}
                  className={styles.secondaryLink}
                  analyticsLabel={`track_order_to_${resultRoute.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="support_route"
                >
                  {resultRoute.label}
                </TrackedLink>
              ) : null}
            </div>

            <div className={styles.linkList}>
              {trackingRoutes.map((route) => (
                <TrackedLink
                  key={route.href}
                  href={localizePath(locale, route.href)}
                  analyticsLabel={`track_order_sidebar_${route.href.split("/").filter(Boolean).at(-1) ?? "route"}`}
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="support_route"
                >
                  <span>{route.label}</span>
                  <span>{route.productName}</span>
                </TrackedLink>
              ))}
              {footerPolicyLinks.map((policy) => (
                <TrackedLink
                  key={policy.href}
                  href={localizePath(locale, policy.href)}
                  analyticsLabel={`track_order_result_policy_${policy.href.split("/").at(-1) ?? "route"}`}
                  analyticsSurface="track_order_result"
                  analyticsDestinationType="trust_policy"
                >
                  <span>{locale === "en" ? englishPolicyLabels[policy.href] ?? policy.label : policy.label}</span>
                  <span>{text.supportingReference}</span>
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
