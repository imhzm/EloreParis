"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  getPageType,
  hasAnalyticsConsent,
  trackAnalyticsEvent,
} from "@/lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname() ?? "/";
  const lastTrackedKey = useRef("");

  useEffect(() => {
    const trackCurrentPage = () => {
      const key = pathname;

      if (lastTrackedKey.current === key || !hasAnalyticsConsent()) {
        return;
      }

      const tracked = trackAnalyticsEvent("page_view", {
        page_path: pathname,
        page_type: getPageType(pathname),
        has_query: window.location.search.length > 0,
      });

      if (tracked) {
        lastTrackedKey.current = key;
      }
    };

    trackCurrentPage();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, trackCurrentPage);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, trackCurrentPage);
    };
  }, [pathname]);

  return null;
}
