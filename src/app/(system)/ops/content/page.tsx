import type { Metadata } from "next";
import { OpsContentSurface } from "@/components/ops-content-surface";
import { StorefrontShell } from "@/components/storefront-shell";

export const metadata: Metadata = {
  title: "Internal content governance",
  description:
    "Internal ownership and sample-requirement freeze for the public ÉLORÉ PARIS content system.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsContentPage() {
  return (
    <StorefrontShell activeHref="/ops/content">
      <OpsContentSurface />
    </StorefrontShell>
  );
}
