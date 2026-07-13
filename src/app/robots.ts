import type { MetadataRoute } from "next";
import { isSearchIndexingEnabled } from "@/lib/search-visibility";
import { siteUrl } from "@/lib/site-content";

export default function robots(): MetadataRoute.Robots {
  if (!isSearchIndexingEnabled()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
