import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { AnalyticsConsentBanner } from "@/components/analytics-consent-banner";
import { CartProvider } from "@/components/cart-provider";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { fontVariables } from "@/lib/fonts";
import { getDefaultMetadataRobots } from "@/lib/seo";
import { isLocale, locales, localeConfig } from "@/lib/i18n";
import { defaultDescription, getSiteUrl, siteName, siteTagline } from "@/lib/site-content";
import { getEffectiveSiteContent } from "@/lib/site-content-authority";
import "../../globals.css";

const siteUrl = getSiteUrl();
const socialImageUrl = new URL("/api/social-card", siteUrl).toString();

// This is a root layout: it is the highest layout over the storefront tree, so
// it owns <html>. `lang` and `dir` are attributes of that element and there is
// no way to compose them from a nested layout, which is why the locale segment
// has to sit above every storefront page rather than beside it.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Anything that is not a known locale is a 404, not a runtime render.
export const dynamicParams = false;

// generateMetadata rather than a `metadata` const: the const is evaluated once
// when the module is imported, which would freeze the robots directive for the
// life of the process and let it drift from robots.txt, which is computed per
// request. This runs per render. For a prerendered page that render is still
// the build — which is why deploy-release.sh must export the approval gates.
export async function generateMetadata(): Promise<Metadata> {
  const controlledContent = getEffectiveSiteContent();
  const controlledSiteName = controlledContent.identity.siteName || siteName;
  const controlledTagline = controlledContent.identity.taglineAr || siteTagline;
  const controlledDescription = controlledContent.seo.ar.homeDescription || defaultDescription;
  return {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${controlledSiteName} | ${controlledTagline}`,
    template: `%s | ${controlledSiteName}`,
  },
  description: controlledDescription,
  manifest: "/manifest.webmanifest",
  keywords: [
    "متجر مكياج في السعودية",
    "عناية بالبشرة السعودية",
    "إيلوري باريس السعودية",
    "premium beauty saudi",
    "skincare saudi arabia",
    "makeup store saudi arabia",
  ],
  openGraph: {
    url: siteUrl,
    title: `${controlledSiteName} | ${controlledTagline}`,
    description: controlledDescription,
    siteName: controlledSiteName,
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: `${controlledSiteName} | Saudi premium beauty storefront`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${controlledSiteName} | ${controlledTagline}`,
    description: controlledDescription,
    images: [socialImageUrl],
  },
  icons: {
    icon: "/elore-assets/favicon-192.png",
    apple: "/elore-assets/favicon-192.png",
    shortcut: "/elore-assets/favicon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: controlledSiteName,
    statusBarStyle: "default",
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  applicationName: controlledSiteName,
  category: "beauty ecommerce",
  robots: getDefaultMetadataRobots(),
  };
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#25080c",
};

export default async function StorefrontRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const language = localeConfig[locale];

  return (
    <html
      lang={language.htmlLang}
      dir={language.dir}
      className={fontVariables}
    >
      <body>
        <CartProvider>
          <AnalyticsProvider />
          <WebVitalsReporter />
          <AnalyticsConsentBanner locale={locale} />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
