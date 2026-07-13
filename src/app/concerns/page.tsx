import type { Metadata } from "next";
import { CinematicDiscoveryHub } from "@/components/cinematic-discovery-hub";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, concerns } from "@/lib/site-content";

export const metadata: Metadata = { title: "حسب المشكلة", description: "ابدئي من احتياجك، وافهمي المسار قبل اختيار المنتج.", alternates: { canonical: "/concerns" } };

export default function ConcernsPage() {
  const structuredData = { "@context": "https://schema.org", "@type": "CollectionPage", name: "حسب المشكلة", url: absoluteUrl("/concerns"), inLanguage: "ar-SA", mainEntity: { "@type": "ItemList", itemListElement: concerns.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: absoluteUrl(`/concerns/${item.slug}`) })) } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><StorefrontShell activeHref="/concerns"><CinematicDiscoveryHub kind="concern" eyebrow="Concern compass" title="ابدئي مما تريدين تغييره." intro="بدل التصفّح المشتت، كل مشكلة تفتح مسارًا يشرح الأولوية والمكوّن والروتين والمنتج المناسب." decisionTitle="النتيجة أولًا. المنتج يأتي بعدها." decisionCopy="نحوّل السؤال العام إلى خطوات صغيرة قابلة للفهم، من غير وعود مبالغ فيها أو روتين مزدحم." items={concerns.map((item) => ({ slug: item.slug, title: item.title, subtitle: item.subtitle, summary: item.summary, signals: item.keyIngredients }))} baseHref="/concerns" nextHref="/ingredients" nextLabel="افهمي المكوّنات" /></StorefrontShell></>;
}
