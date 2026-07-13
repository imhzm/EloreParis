import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinematicTrustExperience } from "@/components/cinematic-trust-experience";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, getTrustPolicyBySlug, trustPolicies } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };
type Route = { href: string; label: string; description: string; type: string };

const primaryRoutes: Record<string, Route> = {
  verification: {
    href: "/contact",
    label: "التواصل حول بيانات النشاط",
    description: "للسؤال عن القنوات الرسمية أو حالة اعتماد بيانات المنشأة.",
    type: "contact",
  },
  privacy: {
    href: "/faq",
    label: "راجعي الأسئلة الشائعة",
    description: "للحصول على إجابة مختصرة قبل التصعيد.",
    type: "faq",
  },
  shipping: {
    href: "/track-order",
    label: "تتبعي طلبك",
    description: "إذا كان السؤال عن حالة شحنة مرتبطة بطلب قائم.",
    type: "order_tracking",
  },
  returns: {
    href: "/faq",
    label: "راجعي أسئلة الاسترجاع",
    description: "لفهم المسار الحالي قبل فتح متابعة خاصة.",
    type: "faq",
  },
  authenticity: {
    href: "/contact",
    label: "اسألي عن التوثيق",
    description: "للحالات التي تحتاج تحققًا إضافيًا من المصدر.",
    type: "contact",
  },
};

export async function generateStaticParams() {
  return trustPolicies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const policy = getTrustPolicyBySlug((await params).slug);
  return policy
    ? {
        title: `${policy.title} | الثقة والسياسات`,
        description: policy.summary,
        alternates: { canonical: `/trust/${policy.slug}` },
      }
    : {};
}

export default async function TrustPolicyPage({ params }: Props) {
  const policy = getTrustPolicyBySlug((await params).slug);
  if (!policy) notFound();

  const routes = [
    primaryRoutes[policy.slug] ?? {
      href: "/trust",
      label: "مركز الثقة",
      description: "راجعي طبقات الثقة الأخرى.",
      type: "trust",
    },
    {
      href: "/terms",
      label: "الشروط العامة",
      description: "للإطار العام للاستخدام والشراء.",
      type: "legal",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: policy.title,
        description: policy.summary,
        inLanguage: "ar-SA",
        url: absoluteUrl(`/trust/${policy.slug}`),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "الثقة", item: absoluteUrl("/trust") },
          { "@type": "ListItem", position: 3, name: policy.title, item: absoluteUrl(`/trust/${policy.slug}`) },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: policy.faq.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <StorefrontShell activeHref="/trust">
        <CinematicTrustExperience
          mode="detail"
          policy={policy}
          siblings={trustPolicies.filter((item) => item.slug !== policy.slug)}
          routes={routes}
        />
      </StorefrontShell>
    </>
  );
}
