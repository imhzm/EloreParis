import { OmniraInspiredHome } from "@/components/omnira-inspired-home";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl } from "@/lib/site-content";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Cozmateks", url: absoluteUrl("/") },
      { "@type": "WebSite", name: "Cozmateks", inLanguage: "ar-SA", potentialAction: { "@type": "SearchAction", target: absoluteUrl("/search?q={search_term_string}"), "query-input": "required name=search_term_string" } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <StorefrontShell activeHref="/">
        <OmniraInspiredHome />
      </StorefrontShell>
    </>
  );
}
