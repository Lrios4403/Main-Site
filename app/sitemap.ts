import { sitePages } from "@/lib/site-pages";
import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo";

// Public routes come from the static-page and published-article registries.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPublishedPosts();
  const pages: MetadataRoute.Sitemap = sitePages.map(page => ({
    url: absoluteUrl(page.path),
    lastModified: page.path === "/blogs"
      ? posts.map(post => post.updated ?? post.published).sort().at(-1)
      : page.lastModified,
  }));

  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(post.path),
    lastModified: post.updated ?? post.published,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [...pages, ...blogPosts];
}
