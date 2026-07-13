import type { Metadata } from "next";
import { CinematicTrustExperience } from "@/components/cinematic-trust-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, trustPolicies } from "@/lib/site-content";
import { supportRouteLinks } from "@/lib/support-content";

export const metadata: Metadata = {
  title: "الثقة والسياسات",
  description: "السياسات والدعم ووضوح الشراء في مكان واحد.",
  alternates: { canonical: "/trust" },
};

export default function TrustPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: "مركز الثقة والسياسات", url: absoluteUrl("/trust"), inLanguage: "ar-SA" },
      { "@type": "Organization", name: "Cozmateks", url: absoluteUrl("/") },
      {
        "@type": "ItemList",
        itemListElement: trustPolicies.map((policy, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: policy.title,
          url: absoluteUrl(`/trust/${policy.slug}`),
        })),
      },
    ],
  };
  const routes = supportRouteLinks.map((route) => ({
    href: route.href,
    label: route.label,
    description: route.description,
    type: route.destinationType,
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <StorefrontShell activeHref="/trust">
        <CinematicTrustExperience mode="hub" policies={trustPolicies} supportRoutes={routes} />
      </StorefrontShell>
    </>
  );
}
