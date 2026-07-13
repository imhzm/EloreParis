import type { Metadata } from "next";
import { CinematicSupportStory } from "@/components/cinematic-support-story";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl } from "@/lib/site-content";
import { termsFaq, termsPrinciples, termsSections } from "@/lib/support-content";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description: "إطار الشروط المؤقت للنسخة التجريبية إلى حين اعتماد النص القانوني النهائي.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const policyRoutes = [
    {
      eyebrow: "سياسة متخصصة",
      title: "الخصوصية واستخدام البيانات",
      body: "عند الأسئلة المتعلقة بجمع البيانات أو الموافقات أو استخدام المعلومات.",
      href: "/trust/privacy",
      linkLabel: "قراءة سياسة الخصوصية",
      type: "trust_policy",
    },
    {
      eyebrow: "سياسة متخصصة",
      title: "الشحن والتوصيل",
      body: "عند الحاجة إلى نوافذ التسليم أو الرسوم أو حدود التغطية التشغيلية.",
      href: "/trust/shipping",
      linkLabel: "قراءة سياسة الشحن",
      type: "trust_policy",
    },
    {
      eyebrow: "سياسة متخصصة",
      title: "الاستبدال والاسترجاع",
      body: "عند مراجعة الشروط والاستثناءات ومسار الطلب بعد الشراء.",
      href: "/trust/returns",
      linkLabel: "قراءة سياسة الاسترجاع",
      type: "trust_policy",
    },
  ];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "الشروط والأحكام",
        description: "صفحة شروط مؤقتة للنسخة التجريبية.",
        inLanguage: "ar-SA",
        url: absoluteUrl("/terms"),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "الشروط والأحكام", item: absoluteUrl("/terms") },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: termsFaq.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
  const sections = [...termsSections.map((section) => ({ title: section.heading, body: section.body })), ...policyRoutes];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <StorefrontShell activeHref="/terms">
        <CinematicSupportStory
          kind="terms"
          eyebrow="Terms & conditions"
          title="الشروط يجب أن تُقرأ، لا أن تُخفى."
          intro="إطار واضح يشرح حدود النسخة الحالية ويربط كل سؤال بالسياسة المتخصصة الأقرب إليه."
          statement="النص المؤقت لا يصبح التزامًا نهائيًا."
          principles={termsPrinciples}
          sectionTitle="الإطار العام، ثم السياسة المتخصصة."
          sections={sections}
          faqs={termsFaq}
          nextHref="/trust"
          nextLabel="انتقلي إلى مركز الثقة"
        />
      </StorefrontShell>
    </>
  );
}
