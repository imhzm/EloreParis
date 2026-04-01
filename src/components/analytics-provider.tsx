"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getPageType, trackAnalyticsEvent } from "@/lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname() ?? "/";
  const lastTrackedKey = useRef("");

  useEffect(() => {
    const key = pathname;

    if (lastTrackedKey.current === key) {
      return;
    }

    lastTrackedKey.current = key;

    trackAnalyticsEvent("page_view", {
      page_path: pathname,
      page_type: getPageType(pathname),
      has_query: typeof window !== "undefined" && window.location.search.length > 0,
    });
  }, [pathname]);

  return null;
}
