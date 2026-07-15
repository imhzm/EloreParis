import type { Metadata } from "next";
import { OpsReleaseSurface } from "@/components/ops-release-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "Internal release readiness",
  description:
    "سطح داخلي يعرض عوائق الإطلاق الحية من بيئة التشغيل الحالية داخل مشروع ÉLORÉ PARIS.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsReleasePage() {
  return (
    <StorefrontShell activeHref="/ops/release">
      <OpsReleaseSurface />
    </StorefrontShell>
  );
}
