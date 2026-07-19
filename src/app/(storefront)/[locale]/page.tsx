import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EloreReferenceHome } from "@/components/elore-reference-home";
import { PublicPromotionRail } from "@/components/public-promotion-rail";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrustServiceStrip } from "@/components/trust-service-strip";
import { isLocale, localeConfig, locales, shellCopy } from "@/lib/i18n";
import { absoluteUrl, serializeJsonLd } from "@/lib/site-content";
import { getEffectiveSiteContent } from "@/lib/site-content-authority";

type PageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};

  const content = getEffectiveSiteContent();
  const copy = content.seo[candidate];
  const controlledSiteName = content.identity.siteName;
  const canonical = `/${candidate}`;
  const socialImage = absoluteUrl("/api/social-card");
  return {
    title: copy.homeTitle,
    description: copy.homeDescription,
    alternates: {
      canonical,
      languages: {
        "ar-SA": "/ar",
        "en-SA": "/en",
        "x-default": "/ar",
      },
    },
    openGraph: {
      title: copy.homeTitle,
      description: copy.homeDescription,
      url: absoluteUrl(canonical),
      locale: localeConfig[candidate].ogLocale,
      alternateLocale: [localeConfig[candidate === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      siteName: controlledSiteName,
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${controlledSiteName} — ${copy.homeTitle}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.homeTitle,
      description: copy.homeDescription,
      images: [socialImage],
    },
  };
}

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();

  const path = `/${candidate}`;
  const content = getEffectiveSiteContent();
  const controlledSiteName = content.identity.siteName;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: controlledSiteName, url: absoluteUrl("/") },
      {
        "@type": "WebSite",
        "@id": absoluteUrl(`${path}#website`),
        name: controlledSiteName,
        url: absoluteUrl(path),
        inLanguage: localeConfig[candidate].htmlLang,
        publisher: { "@id": absoluteUrl("/#organization") },
        potentialAction: {
          "@type": "SearchAction",
          target: absoluteUrl(`/${candidate}/search?q={search_term_string}`),
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <StorefrontShell activeHref="/" locale={candidate} showServiceStrip={false}>
        <EloreReferenceHome
          locale={candidate}
          content={content.home[candidate]}
          bentoContent={content.editorial.bento[candidate]}
          serviceStrip={(
            <TrustServiceStrip
              locale={candidate}
              copy={{ ...shellCopy[candidate], ...content.shell[candidate] }}
            />
          )}
        />
        <PublicPromotionRail locale={candidate} />
      </StorefrontShell>
    </>
  );
}
