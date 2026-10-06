import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// /robots.txt: crawl everything except the view-counter API
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
