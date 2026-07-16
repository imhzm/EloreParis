import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import {
  Cormorant_Garamond,
  IBM_Plex_Sans_Arabic,
  Manrope,
  Noto_Naskh_Arabic,
} from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CartProvider } from "@/components/cart-provider";
import { defaultMetadataRobots } from "@/lib/seo";
import { defaultLocale, isLocale, localeConfig } from "@/lib/i18n";
import { defaultDescription, getSiteUrl, siteName, siteTagline } from "@/lib/site-content";
import "./globals.css";

const arabicBody = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const arabicDisplay = Noto_Naskh_Arabic({
  variable: "--font-arabic-display",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const latinBody = Manrope({
  variable: "--font-latin-body",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();
const socialImageUrl = new URL("/opengraph-image", siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | ${siteTagline}`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
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
    title: `${siteName} | ${siteTagline}`,
    description: defaultDescription,
    siteName,
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: `${siteName} | Saudi premium beauty storefront`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | ${siteTagline}`,
    description: defaultDescription,
    images: [socialImageUrl],
  },
  icons: {
    icon: "/elore-assets/favicon-192.png",
    apple: "/elore-assets/favicon-192.png",
    shortcut: "/elore-assets/favicon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  applicationName: siteName,
  category: "beauty ecommerce",
  robots: defaultMetadataRobots,
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#491723",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeHeader = (await headers()).get("x-elore-locale") ?? "";
  const locale = isLocale(localeHeader) ? localeHeader : defaultLocale;
  const language = localeConfig[locale];

  return (
    <html
      lang={language.htmlLang}
      dir={language.dir}
      className={`${arabicBody.variable} ${arabicDisplay.variable} ${latinBody.variable} ${cormorant.variable}`}
    >
      <body>
        <CartProvider>
          <AnalyticsProvider />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
