import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinematicEditorialCollection } from "@/components/cinematic-editorial-collection";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, editorialCollectionSlugs, getShopCollectionBySlug } from "@/lib/site-content";
import { publicRichPreviewRobots } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

function getCollection(slug: string) {
  const collection = getShopCollectionBySlug(slug);
  return collection?.mode === "editorial" ? collection : null;
}

export function generateStaticParams() {
  return editorialCollectionSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = (await params).slug;
  const collection = getCollection(slug);
  if (!collection) return {};

  const collectionImages: Record<string, string> = {
    skincare: "/brand-assets/product-01.jpg",
    makeup: "/brand-assets/product-05.jpg",
    haircare: "/brand-assets/product-02.jpg",
    bodycare: "/brand-assets/product-04.jpg",
    tools: "/brand-assets/product-06.jpg",
    "beauty-sets": "/brand-assets/product-03.jpg",
  };
  const relativeImageUrl = collectionImages[slug] ?? "/brand-assets/product-03.jpg";
  const imageUrl = absoluteUrl(relativeImageUrl);

  return {
    title: collection.title,
    description: collection.description,
    alternates: { canonical: collection.href },
    robots: publicRichPreviewRobots,
    openGraph: {
      title: collection.title,
      description: collection.description,
      url: absoluteUrl(collection.href),
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: collection.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: collection.title,
      description: collection.description,
      images: [imageUrl],
    },
  };
}

export default async function EditorialCollectionPage({ params }: PageProps) {
  const collection = getCollection((await params).slug);
  if (!collection) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: collection.title, description: collection.description, url: absoluteUrl(collection.href), inLanguage: "ar-SA" },
      { "@type": "FAQPage", mainEntity: collection.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
      { "@type": "ItemList", itemListElement: collection.discoveryLinks.map((link, index) => ({ "@type": "ListItem", position: index + 1, name: link.title, url: absoluteUrl(link.href) })) },
    ],
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><StorefrontShell activeHref={collection.href}><CinematicEditorialCollection collection={collection} /></StorefrontShell></>;
}
