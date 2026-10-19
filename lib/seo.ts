import type { SitePage } from "./site-pages";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/blog/urls";
export { site } from "@/lib/site";
export { absoluteUrl } from "@/lib/blog/urls";
export { buildPostMetadata as postMetadata } from "@/lib/blog/metadata";
export { buildPostJsonLd as postJsonLd } from "@/lib/blog/schema";

// app/opengraph-image.tsx. Metadata merges shallowly, so a page that sets its
// own openGraph drops the root's image unless it lists it again.
const ogImage = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: site.name,
};

type PageSeo = {
  // Omit for the site's default title (the home page)
  title?: string;
  description: string;
  // Canonical path, without a trailing slash ("/" for the home page)
  path: string;
  // Blog posts: Open Graph article dates and tags
  article?: { published: string; modified?: string; tags?: string[] };
  noIndex?: boolean;
};

// Per-page metadata: title (the root layout's template adds the site name),
// description, canonical URL and a complete Open Graph block. Twitter fills
// its title, description and image in from Open Graph.
export function pageMetadata({ title, description, path, article, noIndex }: PageSeo): Metadata {
  const base = {
    siteName: site.name,
    locale: site.locale,
    url: absoluteUrl(path),
    title: title ?? site.name,
    description,
    images: [ogImage],
  };

  return {
    ...(title ? { title } : {}),
    description,
    ...(article?.tags && { keywords: article.tags }),
    alternates: { canonical: absoluteUrl(path) },
    twitter: { card: "summary_large_image", title: title ?? site.name, description, images: [ogImage] },
    robots: { index: !noIndex, follow: true, googleBot: { index: !noIndex, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: article
      ? {
          ...base,
          type: "article",
          publishedTime: article.published,
          modifiedTime: article.modified ?? article.published,
          authors: [site.author.name],
          tags: article.tags,
        }
      : { ...base, type: "website" },
  };
}

// Static pages are Open Graph "website"s. Fields are picked, not spread: a
// SitePage's own `article` block (its section list) is not an OG article.
export function sitePageMetadata(page: SitePage): Metadata {
  return pageMetadata({ title: page.path === "/" ? undefined : page.title, description: page.description, path: page.path });
}
