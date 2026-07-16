import type { MetadataRoute } from "next";
import { isSearchIndexingEnabled } from "@/lib/search-visibility";
import { getSiteUrl } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!isSearchIndexingEnabled()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
