import type { Metadata } from "next";
import { previewNoindexRobots } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-content";
import { GlobalNotFoundDocument } from "./global-not-found-document";

export const metadata: Metadata = {
  // This file sits at the app root, above both route groups, so it inherits no
  // metadataBase from a layout and has to declare its own — otherwise the
  // document cannot resolve its own absolute metadata URLs.
  metadataBase: new URL(getSiteUrl()),
  title: "الصفحة غير موجودة | ÉLORÉ PARIS",
  robots: previewNoindexRobots,
  // A 404 does not advertise a social preview.
  openGraph: { images: [] },
};

/**
 * The global not-found, for URLs that match no route at all.
 *
 * There is no `src/app/layout.tsx` — the storefront and operations trees each
 * own a root layout under their own route group — so this file sits above every
 * layout and must render its own document. That also means it has no
 * CartProvider, which is why it deliberately does not use StorefrontShell: the
 * header's cart badge calls useCart and would throw here.
 *
 * The server half owns metadata (title + noindex) and delegates the document
 * to a client component so the language and direction follow the URL prefix
 * (`/en/*` gets `en-SA`/`ltr`, everything else stays on the Arabic market
 * entry point) without risking a hydration mismatch.
 */
export default function GlobalNotFound() {
  return <GlobalNotFoundDocument />;
}
