import type { Metadata } from "next";
import { CinematicShopAtlasStage } from "@/components/cinematic-shop-atlas-stage";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, shopCollections } from "@/lib/site-content";
import { publicRichPreviewRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "المتجر",
  description: "اكتشفي منتجات العناية والجمال في كوزماتكس حسب القسم أو المشكلة أو الروتين.",
  alternates: { canonical: "/shop" },
  robots: publicRichPreviewRobots,
};

export default function ShopHubPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "متجر كوزماتكس",
        description: "بوابة تسوق تجمع فئات العناية والجمال في مسارات واضحة.",
        url: absoluteUrl("/shop"),
        inLanguage: "ar-SA",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "المتجر", item: absoluteUrl("/shop") },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: shopCollections.map((collection, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: collection.title,
          url: absoluteUrl(collection.href),
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <StorefrontShell activeHref="/shop"><CinematicShopAtlasStage /></StorefrontShell>
    </>
  );
}
