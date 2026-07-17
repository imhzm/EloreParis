import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

// Report-only for now: it is emitted so violations surface during QA, but it
// enforces nothing and so cannot break a page. Flip this to false — and walk the
// storefront, checkout and operations surfaces again — to enforce.
const cspIsReportOnly = true;
//
// Deliberately hash/allowlist-based rather than nonce-based. A fresh nonce per
// request would force every route to render dynamically, which would undo the
// static generation of the whole storefront. Next's own guidance is explicit
// that nonces and static optimisation are mutually exclusive, and that a policy
// which does not need them belongs in this file as a static header.
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
  // Only in an enforcing policy. The spec has the browser IGNORE
  // upgrade-insecure-requests when it arrives report-only, and Chrome logs an
  // error saying so — one per navigation, on every route. That error was the
  // only thing on the console, which made this directive quietly self-defeating:
  // the note above says to enforce once the surfaces walk with a clean console,
  // and the directive itself was the sole reason the console was never clean.
  // Measured: 17 routes, 17 identical errors, nothing else. It also does no work
  // here — a policy that is ignored upgrades nothing — so this loses no security
  // and buys back a console where a real violation would stand out.
  ...(cspIsReportOnly ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // There is no src/app/layout.tsx — the storefront and operations trees each
    // own a root layout under their own route group. Without this flag a
    // top-level not-found.tsx has no document to render into, so Next wraps it
    // in a bare <html> with no lang or dir. global-not-found.tsx renders the
    // whole document itself instead.
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: cspIsReportOnly
              ? "Content-Security-Policy-Report-Only"
              : "Content-Security-Policy",
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
    ];
  },
};

export default nextConfig;
