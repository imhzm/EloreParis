import { permanentRedirect } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export default async function LegacyProductPage({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/ar/product/${encodeURIComponent(slug)}`);
}
