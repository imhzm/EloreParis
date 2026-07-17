import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OmniraInspiredHome } from "@/components/omnira-inspired-home";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, localeConfig, locales, type Locale } from "@/lib/i18n";
import { absoluteUrl, siteName } from "@/lib/site-content";

type PageProps = { params: Promise<{ locale: string }> };

const metadataCopy: Record<Locale, { title: string; description: string }> = {
  ar: {
    title: "جمالٌ يُروى كتجربة",
    description:
      "تجربة جمال سعودية راقية تجمع الحس الباريسي مع وضوح القوام والدرجة والروتين.",
  },
  en: {
    title: "Beauty, composed with intention",
    description:
      "A refined Saudi beauty experience pairing Parisian sensibility with clearer textures, shades and rituals.",
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};

  const copy = metadataCopy[candidate];
  const canonical = `/${candidate}`;
  const socialImage = absoluteUrl("/opengraph-image");
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": "/ar",
        "en-SA": "/en",
        "x-default": "/ar",
      },
    },
    openGraph: {
      title: `${copy.title} | ${siteName}`,
      description: copy.description,
      url: absoluteUrl(canonical),
      locale: localeConfig[candidate].ogLocale,
      alternateLocale: [localeConfig[candidate === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      siteName,
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${siteName} — ${copy.title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | ${siteName}`,
      description: copy.description,
      images: [socialImage],
    },
  };
}

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();

  const path = `/${candidate}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: siteName, url: absoluteUrl("/") },
      {
        "@type": "WebSite",
        "@id": absoluteUrl(`${path}#website`),
        name: siteName,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StorefrontShell activeHref="/" locale={candidate}>
        <OmniraInspiredHome locale={candidate} />
      </StorefrontShell>
    </>
  );
}
