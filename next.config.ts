import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const cacheControlImmutable = "public, max-age=31536000, immutable";
const cacheControlShort = "public, max-age=3600";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {},
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "elore-paris.s3.amazonaws.com" },
      { protocol: "https", hostname: "elore-paris.s3.me-south-1.amazonaws.com" },
      { protocol: "https", hostname: "cdn.eloreparis.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: cacheControlImmutable }],
      },
      {
        source: "/elore-assets/:path*",
        headers: [{ key: "Cache-Control", value: cacheControlImmutable }],
      },
      {
        source: "/api/social-card",
        headers: [{ key: "Cache-Control", value: cacheControlShort }],
      },
    ];
  },
};

export default nextConfig;
