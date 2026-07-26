import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RitualBuilder } from "@/components/ritual-builder";
import { StorefrontShell } from "@/components/storefront-shell";
import { isLocale, localeConfig } from "@/lib/i18n";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";
import { getPublicRichPreviewRobots } from "@/lib/seo";
import { absoluteUrl, serializeJsonLd, siteName } from "@/lib/site-content";
import { getEffectiveSiteContent } from "@/lib/site-content-authority";

type PageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

const metadataCopy = {
  ar: {
    title: "ابني طقسك الخاص",
    description: "رحلة قصيرة تساعدك على اكتشاف اختيارات أقرب لذوقك من كتالوج إيلوري باريس المنشور، بتفسير واضح ومن دون ادعاءات غير موثقة.",
    pageName: "أداة بناء طقس الجمال",
    home: "الرئيسية",
    breadcrumb: "ابني طقسك",
  },
  en: {
    title: "Compose your beauty ritual",
    description: "A short, transparent journey towards choices from the published ÉLORÉ PARIS catalogue, with explainable matching and no unverified claims.",
    pageName: "Beauty ritual builder",
    home: "Home",
    breadcrumb: "Ritual finder",
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};

  const controlledSiteName = getEffectiveSiteContent().identity.siteName || siteName;
  const copy = metadataCopy[candidate];
  const canonical = `/${candidate}/rituals/builder`;
  const socialImage = absoluteUrl(`/api/social-card?locale=${candidate}`);

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": "/ar/rituals/builder",
        "en-SA": "/en/rituals/builder",
        "x-default": "/ar/rituals/builder",
      },
    },
    robots: getPublicRichPreviewRobots(),
    openGraph: {
      title: `${copy.title} | ${controlledSiteName}`,
      description: copy.description,
      url: absoluteUrl(canonical),
      siteName: controlledSiteName,
      locale: localeConfig[candidate].ogLocale,
      alternateLocale: [localeConfig[candidate === "ar" ? "en" : "ar"].ogLocale],
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${controlledSiteName} — ${copy.title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | ${controlledSiteName}`,
      description: copy.description,
      images: [socialImage],
    },
  };
}

export default async function RitualBuilderPage({ params }: PageProps) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();

  const copy = metadataCopy[candidate];
  const catalog = getPublicCatalogSnapshot(candidate);
  const path = `/${candidate}/rituals/builder`;
  const homePath = `/${candidate}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl(`${path}#webpage`),
        name: copy.pageName,
        description: copy.description,
        url: absoluteUrl(path),
        inLanguage: localeConfig[candidate].htmlLang,
        isPartOf: { "@id": absoluteUrl(`${homePath}#website`) },
        breadcrumb: { "@id": absoluteUrl(`${path}#breadcrumb`) },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absoluteUrl(`${path}#breadcrumb`),
        itemListElement: [
          { "@type": "ListItem", position: 1, name: copy.home, item: absoluteUrl(homePath) },
          { "@type": "ListItem", position: 2, name: copy.breadcrumb, item: absoluteUrl(path) },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <StorefrontShell
        activeHref="/rituals/builder"
        locale={candidate}
        languageHref={`/${candidate === "ar" ? "en" : "ar"}/rituals/builder`}
      >
        <RitualBuilder
          locale={candidate}
          catalogAvailable={catalog.available}
          products={catalog.products}
        />
      </StorefrontShell>
    </>
  );
}
