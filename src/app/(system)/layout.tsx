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
  // app/opengraph-image.tsx is a root-segment metadata file, so it is inherited
  // here as well as by the storefront. It is a public brand asset and these
  // surfaces are internal, so drop it rather than advertise a social preview
  // for the operations dashboard.
  openGraph: { images: [] },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#491723",
};

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
