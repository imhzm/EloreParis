import { notFound, permanentRedirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export default async function LocalizedProductsRedirect({ params }: PageProps) {
  const { locale: candidate, slug } = await params;
  if (!isLocale(candidate)) notFound();
  permanentRedirect(`/${candidate}/product/${encodeURIComponent(slug)}`);
}
