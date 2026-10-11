import "server-only";
import type { Metadata } from "next";
import type { PostRecord } from "./types";
import { getAuthor } from "./authors";
import { absoluteUrl } from "./urls";
import { site } from "@/lib/site";

/** Called by server route modules; never import the registry into client components. */
export function buildPostMetadata(post: PostRecord): Metadata {
  const author = getAuthor(post.authorId);
  const title = post.seoTitle ?? post.title;
  const canonical = absoluteUrl(post.path);
  const images = post.cover ? [{
    url: absoluteUrl(post.cover.src), width: post.cover.width,
    height: post.cover.height, alt: post.cover.alt,
  }] : [];
  return {
    title,
    description: post.description,
    authors: [{ name: author.name, url: absoluteUrl(author.path) }],
    keywords: post.tags,
    alternates: { canonical },
    robots: { index: post.status === "published", follow: post.status === "published",
      googleBot: { index: post.status === "published", follow: post.status === "published", "max-image-preview": "large" } },
    openGraph: {
      type: "article", title, description: post.description, url: canonical,
      siteName: site.name, locale: site.locale, images,
      publishedTime: post.published,
      ...(post.updated ? { modifiedTime: post.updated } : {}),
      authors: [absoluteUrl(author.path)], tags: post.tags,
    },
    twitter: { card: post.cover ? "summary_large_image" : "summary", title, description: post.description, images },
  };
}
