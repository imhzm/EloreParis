import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Noto_Naskh_Arabic } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CartProvider } from "@/components/cart-provider";
import { defaultDescription, siteName, siteTagline, siteUrl } from "@/lib/site-content";
import "./globals.css";

const bodyFont = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Noto_Naskh_Arabic({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
    title: `${siteName} | ${siteTagline}`,
    description: defaultDescription,
    siteName,
    locale: "ar_SA",
    type: "website",
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
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#2b1c28",
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
