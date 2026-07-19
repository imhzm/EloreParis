"use client";

import { useEffect, useRef } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  type AnalyticsEventName,
  type AnalyticsProperties,
  trackAnalyticsEvent,
} from "@/lib/analytics";

type ViewEventName = Extract<
  AnalyticsEventName,
  "view_item" | "view_cart" | "begin_checkout"
>;

type Props = {
  eventName: ViewEventName;
  eventKey: string;
  properties: AnalyticsProperties;
};

export function AnalyticsViewEvent({ eventName, eventKey, properties }: Props) {
  const lastTrackedKey = useRef("");
  const propertiesRef = useRef(properties);

  useEffect(() => {
    propertiesRef.current = properties;
  }, [properties]);

  useEffect(() => {
    const track = () => {
      if (lastTrackedKey.current === eventKey) {
        return;
      }

      if (trackAnalyticsEvent(eventName, propertiesRef.current)) {
        lastTrackedKey.current = eventKey;
      }
    };

    track();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, track);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, track);
  }, [eventKey, eventName]);

  return null;
}
