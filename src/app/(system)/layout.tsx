import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { localeConfig } from "@/lib/i18n";
import { previewNoindexRobots } from "@/lib/seo";
import { getSiteUrl, siteName } from "@/lib/site-content";
import "../globals.css";

// The second root layout. It covers the surfaces that have no locale segment:
// the operations dashboard, the operations sign-in, and the redirect shims for
// "/" and the legacy /products/{slug} shape. Navigating between this tree and
// the storefront costs a full page load, which is the correct trade for an
// internal surface that is never linked from public navigation.
//
// Operations is authored Arabic-first, matching the shell in storefront-shell.
const language = localeConfig.ar;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  // Nothing under this root is ever a public search result. Pages may narrow
  // this further, but none may widen it.
  robots: previewNoindexRobots,
  // Operations surfaces never advertise a social preview.
  openGraph: { images: [] },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#25080c",
};

/**
 * Nothing under this root may be prerendered.
 *
 * These pages are instruments: they report what the authority database and the
 * environment say *right now*. Baked at build time they lie, and they lie in
 * the most expensive direction — an operator who flips PUBLIC_LEGAL_CONTENT_
 * APPROVED and restarts would open /ops/release to confirm it, be told it is
 * still blocked, and have no way to tell that the page is a photograph. The
 * build was already shipping a live order number as static text in ops.html.
 *
 * Declared once here rather than on each page because the rule is a property of
 * the whole operations surface, and eight separate declarations is seven
 * chances to forget. Nothing here is public or cacheable anyway — the layout
 * above already marks the entire tree noindex.
 */
export const dynamic = "force-dynamic";

export default function SystemRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={language.htmlLang}
      dir={language.dir}
      className={fontVariables}
    >
      <body>{children}</body>
    </html>
  );
}
