import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinematicKnowledgeStory } from "@/components/cinematic-knowledge-story";
import { StorefrontShell } from "@/components/storefront-shell";
import { absoluteUrl, collectionDirectory, getProductByHref, getRoutineBySlug, journalArticles, routines } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return routines.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getRoutineBySlug((await params).slug);
  if (!item) return {};
  const title = `${item.title} | الروتينات`;
  const imageUrl = absoluteUrl("/brand-assets/product-04.jpg");
  return {
    title,
    description: item.summary,
    alternates: { canonical: `/routines/${item.slug}` },
    openGraph: {
      title,
      description: item.summary,
      url: absoluteUrl(`/routines/${item.slug}`),
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: item.summary,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }: Props) {
  const routine = getRoutineBySlug((await params).slug); if (!routine) notFound();
  const collection = collectionDirectory[routine.collection];
  const products = [...routine.steps.map((step) => step.href ? getProductByHref(step.href) : undefined), ...routine.pairings.map((pair) => getProductByHref(pair.href))].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const articles = journalArticles.filter((article) => article.relatedRoutine === `/routines/${routine.slug}`);
  const related = [...new Map(products.map((product) => [product.slug, product])).values()].map((product) => ({ label: product.name, meta: product.category, href: `/products/${product.slug}`, type: "product" })).concat(articles.map((article) => ({ label: article.title, meta: article.category, href: `/journal/${article.slug}`, type: "article" })));
  const schema = { "@context": "https://schema.org", "@graph": [{ "@type": "HowTo", name: routine.title, description: routine.summary, url: absoluteUrl(`/routines/${routine.slug}`), inLanguage: "ar-SA", step: routine.steps.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.label, text: step.description, url: step.href ? absoluteUrl(step.href) : undefined })) }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "الروتينات", item: absoluteUrl("/routines") }, { "@type": "ListItem", position: 3, name: routine.title, item: absoluteUrl(`/routines/${routine.slug}`) }] }, { "@type": "FAQPage", mainEntity: routine.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) }] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><StorefrontShell activeHref="/routines"><CinematicKnowledgeStory kind="routine" slug={routine.slug} eyebrow={routine.subtitle} title={routine.title} summary={routine.summary} answer="روتين ناجح يبدأ بالترتيب، لا بعدد العبوات." signals={routine.audience} chapterEyebrow="ترتيب الخطوات" chapterTitle="كل خطوة تمهّد لما بعدها." items={routine.steps.map((step) => ({ label: step.step, title: step.label, copy: step.description, href: step.href }))} watchTitle="حافظي على الإيقاع بسيطًا وقابلًا للاستمرار." watchItems={["أدخلي منتجًا جديدًا واحدًا في كل مرة.", "راقبي استجابة بشرتك قبل زيادة الخطوات.", "ثبات الروتين أهم من ازدحامه."]} related={related} faqs={routine.faqs} backHref="/routines" backLabel="كل الروتينات" primaryHref={routine.steps.find((step) => step.href)?.href ?? collection.href} primaryLabel="ابدئي أول خطوة" /></StorefrontShell></>;
}
