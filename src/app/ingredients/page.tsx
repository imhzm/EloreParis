import type { Metadata } from "next";
import { CinematicDiscoveryHub } from "@/components/cinematic-discovery-hub";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, ingredients } from "@/lib/site-content";

export const metadata: Metadata = { title: "دليل المكوّنات", description: "دليل واضح يشرح دور كل مكوّن ومكانه داخل روتينك.", alternates: { canonical: "/ingredients" } };

export default function IngredientsPage() {
  const structuredData = { "@context": "https://schema.org", "@type": "CollectionPage", name: "دليل المكوّنات", url: absoluteUrl("/ingredients"), inLanguage: "ar-SA", mainEntity: { "@type": "ItemList", itemListElement: ingredients.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: absoluteUrl(`/ingredients/${item.slug}`) })) } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><StorefrontShell activeHref="/ingredients"><CinematicDiscoveryHub kind="ingredient" eyebrow="Ingredient library" title="المكوّن مفهوم، لا موضة." intro="تعرفي على دور المكوّن، متى يناسبك، وما الذي يجب الانتباه له قبل أن يتحول اسمه إلى قرار شراء." decisionTitle="اقرئي الدور، لا الاسم فقط." decisionCopy="قيمة المكوّن تظهر داخل سياق: هدف واضح، توقيت استخدام، وروتين يمكن الاستمرار عليه." items={ingredients.map((item) => ({ slug: item.slug, title: item.title, subtitle: item.subtitle, summary: item.summary, signals: [item.role, ...item.fitNotes.slice(0, 2)] }))} baseHref="/ingredients" nextHref="/shop/skincare" nextLabel="شاهدي منتجات العناية" /></StorefrontShell></>;
}
