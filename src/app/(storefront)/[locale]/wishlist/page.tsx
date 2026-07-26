import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront-shell";
import { WishlistSurface } from "@/components/wishlist-surface";
import { isLocale, localeConfig } from "@/lib/i18n";
import { getPublicCatalogSnapshot } from "@/lib/public-catalog";
import { absoluteUrl, defaultSocialCard, serializeJsonLd } from "@/lib/site-content";

type PageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

const pageCopy = {
  ar: {
    title: "المفضلة",
    description: "راجعي المنتجات التي حفظتها محليًا من كتالوج إيلوري باريس المنشور.",
    pageName: "قائمة المفضلة المحلية",
    home: "الرئيسية",
  },
  en: {
    title: "Wishlist",
    description: "Review products saved locally from the published ÉLORÉ PARIS catalogue.",
    pageName: "Local wishlist",
    home: "Home",
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) return {};
  const copy = pageCopy[candidate];
  const path = `/${candidate}/wishlist`;
  const social = defaultSocialCard(copy.title, candidate);
  return {
    title: copy.title,
    description: copy.description,
    robots: { index: false, follow: false },
    alternates: {
      canonical: path,
      languages: {
        "ar-SA": "/ar/wishlist",
        "en-SA": "/en/wishlist",
        "x-default": "/ar/wishlist",
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: absoluteUrl(path),
      locale: localeConfig[candidate].ogLocale,
      type: "website",
      images: social.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: social.twitter,
    },
  };
}

export default async function WishlistPage({ params }: PageProps) {
  const { locale: candidate } = await params;
  if (!isLocale(candidate)) notFound();
  const copy = pageCopy[candidate];
  const catalog = getPublicCatalogSnapshot(candidate);
  const path = `/${candidate}/wishlist`;
  const homePath = `/${candidate}`;
  const schema = {
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
          { "@type": "ListItem", position: 2, name: copy.title, item: absoluteUrl(path) },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <StorefrontShell
        activeHref="/wishlist"
        locale={candidate}
        languageHref={`/${candidate === "ar" ? "en" : "ar"}/wishlist`}
      >
        <WishlistSurface
          locale={candidate}
          catalogAvailable={catalog.available}
          products={catalog.products}
        />
      </StorefrontShell>
    </>
  );
}
