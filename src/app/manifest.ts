import type { MetadataRoute } from "next";
import { defaultDescription, siteName, siteTagline } from "@/lib/site-content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} | ${siteTagline}`,
    short_name: siteName,
    description: defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1ea",
    theme_color: "#2b1c28",
    lang: "ar-SA",
    dir: "rtl",
    categories: ["beauty", "shopping", "lifestyle"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
