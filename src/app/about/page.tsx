import type { Metadata } from "next";
import { CinematicSupportStory } from "@/components/cinematic-support-story";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl } from "@/lib/site-content";
import { aboutFaq, aboutHighlights, aboutSections } from "@/lib/support-content";

export const metadata: Metadata = { title: "من نحن", description: "تعرفي على منهج Cozmateks في الاختيار والشرح وبناء الثقة.", alternates: { canonical: "/about" } };
export default function AboutPage() {
  const schema = { "@context": "https://schema.org", "@graph": [{ "@type": "AboutPage", name: "من نحن", description: "صفحة تعريفية توضح منهج Cozmateks.", inLanguage: "ar-SA", url: absoluteUrl("/about") }, { "@type": "Organization", name: "Cozmateks", url: absoluteUrl("/") }, { "@type": "FAQPage", mainEntity: aboutFaq.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) }] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><StorefrontShell activeHref="/about"><CinematicSupportStory kind="about" eyebrow="About Cozmateks" title="اختيار الجمال يحتاج إلى وضوح." intro="نبني تجربة تساعدك على فهم المنتج ومكانه داخل روتينك، قبل أن تطلب منك اتخاذ قرار الشراء." statement="نشرح أكثر، ونفترض أقل." principles={aboutHighlights} sectionTitle="هذه هي البنية التي نبني عليها الثقة." sections={aboutSections.map((section) => ({ title: section.heading, body: section.body }))} faqs={aboutFaq} nextHref="/trust" nextLabel="اكتشفي طبقات الثقة" /></StorefrontShell></>;
}
