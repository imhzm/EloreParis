import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinematicProductExperience } from "@/components/cinematic-product-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, collectionDirectory, getIngredientByName, getProductBySlug, products } from "@/lib/site-content";
import { publicRichPreviewRobots } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = getProductBySlug((await params).slug);
  if (!product) return {};
  const title = `${product.name} | ${product.category}`;
  return { title, description: product.description, alternates: { canonical: `/products/${product.slug}` }, robots: publicRichPreviewRobots, openGraph: { title, description: product.description, url: absoluteUrl(`/products/${product.slug}`), type: "website", images: [{ url: absoluteUrl("/og-product.svg"), width: 1200, height: 630, alt: title }] } };
}

export default async function ProductPage({ params }: PageProps) {
  const product = getProductBySlug((await params).slug);
  if (!product) notFound();
  const collection = collectionDirectory[product.collection];
  const ingredient = getIngredientByName(product.ingredient);
  const pageUrl = absoluteUrl(`/products/${product.slug}`);
  const offers = product.variants.map((variant) => ({ "@type": "Offer", sku: variant.sku, url: pageUrl, priceCurrency: "SAR", price: variant.price, availability: `https://schema.org/${variant.availability}`, itemCondition: "https://schema.org/NewCondition" }));
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Product", name: product.name, description: product.description, category: product.category, url: pageUrl, sku: product.variants[0]?.sku, image: [absoluteUrl("/og-product.svg")], brand: { "@type": "Brand", name: product.brand }, inLanguage: "ar-SA", offers },
      { "@type": "FAQPage", mainEntity: product.questions.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><StorefrontShell activeHref={collection.href}><CinematicProductExperience product={product} collection={collection} ingredientSlug={ingredient?.slug} /></StorefrontShell></>;
}
