import "server-only";
import type { PostRecord } from "./types";
import { getAuthor } from "./authors";
import { absoluteUrl } from "./urls";

export function articleCrumbs(post: PostRecord) {
  return [{ name: "Home", path: "/" }, { name: "Blog", path: "/blogs" }, { name: post.title, path: post.path }];
}

export function buildPostJsonLd(post: PostRecord) {
  const url = absoluteUrl(post.path);
  const author = getAuthor(post.authorId);
  const personId = absoluteUrl(author.id === "logan-rios" ? "/#person" : `${author.path}#person`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": personId, name: author.name,
        alternateName: author.alternateName, url: absoluteUrl(author.path), sameAs: author.sameAs },
      { "@type": "WebPage", "@id": `${url}#webpage`, url, name: post.title,
        isPartOf: { "@id": absoluteUrl("/#website") },
        breadcrumb: { "@id": `${url}#breadcrumb` }, mainEntity: { "@id": `${url}#article` } },
      { "@type": "BlogPosting", "@id": `${url}#article`, url,
        headline: post.title, description: post.description,
        mainEntityOfPage: { "@id": `${url}#webpage` },
        author: { "@id": personId }, publisher: { "@id": personId },
        datePublished: post.published, ...(post.updated ? { dateModified: post.updated } : {}),
        ...(post.cover ? { image: { "@type": "ImageObject", url: absoluteUrl(post.cover.src),
          width: post.cover.width, height: post.cover.height, caption: post.cover.caption } } : {}),
        keywords: post.tags, inLanguage: "en-US" },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: articleCrumbs(post).map((crumb, index) => ({
          "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path),
        })) },
    ],
  };
}
