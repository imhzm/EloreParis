"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEventHandler } from "react";
import {
  type AnalyticsEventName,
  type AnalyticsProperties,
  getPageType,
  getPathFromHref,
  trackAnalyticsEvent,
} from "@/lib/analytics";

type TrackedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    analyticsEvent?: AnalyticsEventName;
    analyticsLabel: string;
    analyticsSurface: string;
    analyticsDestinationType?: string;
    analyticsProperties?: AnalyticsProperties;
  };

export function TrackedLink({
  analyticsEvent = "cta_click",
  analyticsLabel,
  analyticsSurface,
  analyticsDestinationType,
  analyticsProperties,
  href,
  onClick,
  ...rest
}: TrackedLinkProps) {
  const pathname = usePathname() ?? "/";
  const destinationPath = getPathFromHref(href);

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    trackAnalyticsEvent(analyticsEvent, {
      label: analyticsLabel,
      surface: analyticsSurface,
      source_path: pathname,
      source_page_type: getPageType(pathname),
      destination_path: destinationPath,
      destination_type:
        analyticsDestinationType ?? getPageType(destinationPath),
      ...analyticsProperties,
    });
  };

  return (
    <Link
      {...rest}
      href={href}
      data-analytics-label={analyticsLabel}
      data-analytics-surface={analyticsSurface}
      onClick={handleClick}
    />
  );
}
