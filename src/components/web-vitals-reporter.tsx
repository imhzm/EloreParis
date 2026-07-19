"use client";

import { useReportWebVitals } from "next/web-vitals";
import {
  createWebVitalEventProperties,
  trackAnalyticsEvent,
  type WebVitalMetricInput,
} from "@/lib/analytics";

const reportedWebVitalIds = new Set<string>();

function reportWebVital(metric: WebVitalMetricInput) {
  const properties = createWebVitalEventProperties(metric);

  if (!properties || reportedWebVitalIds.has(properties.id)) {
    return;
  }

  if (trackAnalyticsEvent("web_vital", properties)) {
    reportedWebVitalIds.add(properties.id);
  }
}

export function WebVitalsReporter() {
  useReportWebVitals(reportWebVital);
  return null;
}
