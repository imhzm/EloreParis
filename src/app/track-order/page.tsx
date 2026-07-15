import { permanentRedirect } from "next/navigation";

type TrackOrderPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const serializedQuery = query.toString();
  permanentRedirect(`/ar/track-order${serializedQuery ? `?${serializedQuery}` : ""}`);
}
