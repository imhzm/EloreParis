import type { Metadata, Viewport } from "next";
import { Alexandria, Markazi_Text } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CartProvider } from "@/components/cart-provider";
import { defaultMetadataRobots } from "@/lib/seo";
import { defaultDescription, siteName, siteTagline, siteUrl } from "@/lib/site-content";
import "./globals.css";

const bodyFont = Alexandria({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Markazi_Text({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

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
    "متجر كوزمتكس سعودي",
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
    icon: "/favicon.ico",
    apple: "/favicon.ico",
    shortcut: "/favicon.ico",
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
  themeColor: "#007f74",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${bodyFont.variable} ${displayFont.variable}`}
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
