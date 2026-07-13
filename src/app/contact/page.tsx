import type { Metadata } from "next";
import { CinematicSupportStory } from "@/components/cinematic-support-story";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl } from "@/lib/site-content";
import { contactChannels, contactFaq, contactPreparation, contactUseCases } from "@/lib/support-content";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "اعثري على أسرع مسار للدعم والتتبع والسياسات.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "ContactPage", name: "تواصل معنا", url: absoluteUrl("/contact"), inLanguage: "ar-SA" },
      {
        "@type": "FAQPage",
        mainEntity: contactFaq.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
  const sections = [
    ...contactChannels.map((channel) => ({
      eyebrow: channel.note,
      title: channel.title,
      body: channel.body,
      href: channel.href,
      linkLabel: channel.label,
      type: channel.destinationType,
    })),
    ...contactPreparation.map((item, index) => ({
      eyebrow: `تحضير ${index + 1}`,
      title: "جهّزي هذه المعلومة",
      body: item,
    })),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <StorefrontShell activeHref="/contact">
        <CinematicSupportStory
          kind="contact"
          eyebrow="Support routing"
          title="الدعم الجيد يبدأ بالمسار الصحيح."
          intro="قبل فتح تواصل عام، نوجّهك إلى التتبع أو السياسة أو الإجابة التي تحسم سؤالك بسرعة."
          statement="التواصل البشري للاستثناء، والوضوح للجميع."
          principles={contactUseCases}
          sectionTitle="اختاري القناة الأقرب لسؤالك."
          sections={sections}
          faqs={contactFaq}
          nextHref="/faq"
          nextLabel="راجعي الأسئلة الشائعة"
        />
      </StorefrontShell>
    </>
  );
}
