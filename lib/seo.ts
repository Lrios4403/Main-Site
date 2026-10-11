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

// ---------------------------------------------------------------------------
// JSON-LD (rendered with components/seo/JsonLd.tsx)

const person = {
  "@type": "Person",
  "@id": absoluteUrl("/#person"),
  name: site.author.name,
  alternateName: site.author.alternateName,
  url: absoluteUrl("/"),
};

// Home page: the site name Google shows in results, and who runs the site
export const homeJsonLd = () => [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
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
