import type { Metadata } from "next";
import { CinematicSupportStory } from "@/components/cinematic-support-story";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl } from "@/lib/site-content";
import { publicRichPreviewRobots } from "@/lib/seo";
import { faqCollections, faqPrinciples } from "@/lib/support-content";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description: "إجابات واضحة حول الطلب والشحن والسياسات والخصوصية.",
  alternates: { canonical: "/faq" },
  robots: publicRichPreviewRobots,
};

export default function FaqPage() {
  const questions = faqCollections.flatMap((group) => group.items);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: "الأسئلة الشائعة",
    inLanguage: "ar-SA",
    url: absoluteUrl("/faq"),
    mainEntity: questions.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <StorefrontShell activeHref="/faq">
        <CinematicSupportStory
          kind="faq"
          eyebrow="Answers before escalation"
          title="الإجابة الأقرب، قبل الانتظار."
          intro="أسئلة الطلب والشحن والجودة والخصوصية مجمعة في مسارات واضحة يمكن قراءتها واتخاذ الخطوة التالية منها."
          statement="الإجابة الجيدة تقلّل القلق، لا تضيف كلامًا."
          principles={faqPrinciples}
          sectionTitle="اختاري مجموعة الأسئلة الأقرب."
          sections={faqCollections.map((group) => ({
            eyebrow: `${group.items.length} إجابات`,
            title: group.title,
            body: group.items.map((item) => item.question).join(" • "),
          }))}
          faqs={questions}
          nextHref="/contact"
          nextLabel="ما زلتِ تحتاجين مساعدة؟"
        />
      </StorefrontShell>
    </>
  );
}
