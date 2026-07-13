import type { Metadata } from "next";
import { CinematicDiscoveryHub } from "@/components/cinematic-discovery-hub";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, routines } from "@/lib/site-content";

export const metadata: Metadata = { title: "الروتينات", description: "روتينات جمال واضحة تربط الترتيب اليومي بالمنتجات المناسبة.", alternates: { canonical: "/routines" } };

export default function RoutinesPage() {
  const structuredData = { "@context": "https://schema.org", "@type": "CollectionPage", name: "الروتينات", url: absoluteUrl("/routines"), inLanguage: "ar-SA", mainEntity: { "@type": "ItemList", itemListElement: routines.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: absoluteUrl(`/routines/${item.slug}`) })) } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><StorefrontShell activeHref="/routines"><CinematicDiscoveryHub kind="routine" eyebrow="Ritual atlas" title="روتينك ليس قائمة. إنه إيقاع." intro="مسارات قصيرة ومدروسة ترتّب خطوات العناية حسب وقتك وهدفك، ثم تقودك إلى المنتجات التي لها دور حقيقي." decisionTitle="اختاري اللحظة قبل اختيار العبوة." decisionCopy="الصباح، المناسبة، أو وقت الاستعادة؛ عندما نعرف اللحظة يصبح ترتيب المنتجات أبسط وأكثر صدقًا." items={routines.map((item) => ({ slug: item.slug, title: item.title, subtitle: item.subtitle, summary: item.summary, signals: item.audience }))} baseHref="/routines" nextHref="/concerns" nextLabel="اكتشفي حسب المشكلة" /></StorefrontShell></>;
}
