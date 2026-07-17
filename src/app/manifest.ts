import type { MetadataRoute } from "next";
import { defaultDescription, siteName, siteTagline } from "@/lib/site-content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} | ${siteTagline}`,
    short_name: siteName,
    description: defaultDescription,
    // The Arabic experience is the default market route. Starting at "/" would
    // spend a 308 on every launch of the installed app.
    start_url: "/ar",
    scope: "/",
    display: "standalone",
    background_color: "#fbf7f2",
    theme_color: "#3b0f1a",
    lang: "ar-SA",
    dir: "rtl",
    categories: ["beauty", "shopping", "lifestyle"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/elore-assets/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/elore-assets/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
