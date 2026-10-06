import type { Metadata } from "next";
import { type Post, postPath } from "@/lib/posts";

// Site-wide SEO settings. `url` is the canonical domain: it's the
// metadataBase, and the sitemap, robots.txt and JSON-LD build absolute URLs
// from it.
export const site = {
  name: "M4cgyvers Repurposed Mining Rig",
  url: "https://m4cgyver.net",
  description:
    "Personal site and resume of Logan Rios (M4cgyver), hosted on a repurposed mining rig: blog posts, a self-hosted web archive, and an x86 OS you can boot in your browser.",
  locale: "en_US",
  author: {
    name: "Logan Rios",
    alternateName: "M4cgyver",
    sameAs: [
      "https://github.com/Lrios4403",
      "http://fed.m4cgyver.net/users/m4c",
    ],
  },
};

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();

// app/opengraph-image.tsx. Metadata merges shallowly, so a page that sets its
// own openGraph drops the root's image unless it lists it again.
const ogImage = {
  url: "/opengraph-image",
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
    url: path,
    title: title ?? site.name,
    description,
    images: [ogImage],
  };

  return {
    ...(title ? { title } : {}),
    description,
    ...(article?.tags && { keywords: article.tags }),
    alternates: { canonical: path },
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
    ...(noIndex && { robots: { index: false, follow: true } }),
  };
}

export const postMetadata = (post: Post) =>
  pageMetadata({
    title: post.title,
    description: post.description,
    path: postPath(post.slug),
    article: { published: post.published, modified: post.updated, tags: post.tags },
  });

// ---------------------------------------------------------------------------
// JSON-LD (rendered with components/seo/JsonLd.tsx)

const person = {
  "@type": "Person",
  name: site.author.name,
  alternateName: site.author.alternateName,
  url: absoluteUrl("/"),
};

// Home page: the site name Google shows in results, and who runs the site
export const homeJsonLd = () => [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: ["M4cgyver", "m4cgyver.net"],
    url: absoluteUrl("/"),
    description: site.description,
    inLanguage: "en-US",
    author: person,
  },
  {
    "@context": "https://schema.org",
    ...person,
    sameAs: site.author.sameAs,
  },
];

export type Crumb = { name: string; path: string };

// Breadcrumb trail for Google results. Home is added in front.
export const breadcrumbJsonLd = (crumbs: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map((crumb, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: crumb.name,
    item: absoluteUrl(crumb.path),
  })),
});

// A post's BlogPosting plus its breadcrumbs. The dates match the ones shown
// in the post's "Post Info" window.
export const postJsonLd = (post: Post) => [
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: absoluteUrl(postPath(post.slug)),
    mainEntityOfPage: absoluteUrl(postPath(post.slug)),
    image: absoluteUrl(ogImage.url),
    datePublished: post.published,
    dateModified: post.updated ?? post.published,
    author: person,
    publisher: person,
    keywords: post.tags,
    inLanguage: "en-US",
  },
  breadcrumbJsonLd([
    { name: "Blog", path: "/blogs" },
    { name: post.title, path: postPath(post.slug) },
  ]),
];
