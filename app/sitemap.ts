import type { MetadataRoute } from "next";
import { postPath, posts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo";

// /sitemap.xml. Blog posts come from lib/posts.ts; add other new pages here.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/blogs"), lastModified: posts[0]?.published, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/projects"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/projects/archives"), lastModified: "2026-10-06", changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/projects/startupos"), lastModified: "2026-10-06", changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/games"), changeFrequency: "monthly", priority: 0.3 },
  ];

  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(postPath(post.slug)),
    lastModified: post.updated ?? post.published,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [...pages, ...blogPosts];
}
