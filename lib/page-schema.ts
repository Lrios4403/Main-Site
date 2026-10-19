import "server-only";
import { site } from "./site";
import { absoluteUrl } from "./blog/urls";
import { getPublishedPosts } from "./posts";
import { projectPages, sitePageCrumbs, type SitePage } from "./site-pages";

/** Describe actual page content; project notes are not products, reviews or offers. */
export function sitePageJsonLd(page: SitePage) {
  const url = absoluteUrl(page.path);
  const personId = absoluteUrl("/#person");
  const items = page.path === "/blogs"
    ? getPublishedPosts().map(post => ({ name: post.title, path: post.path }))
    : page.path === "/projects" ? projectPages.map(project => ({ name: project.project.name, path: project.path })) : [];
  const graph: object[] = [{
    "@type": page.schemaType, "@id": `${url}#webpage`, url,
    name: page.title, description: page.description, inLanguage: "en-US",
    isPartOf: { "@id": absoluteUrl("/#website") },
    ...(page.path !== "/" ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    ...(page.path === "/" ? { mainEntity: { "@id": personId } } : {}),
    ...(page.schemaType === "ContactPage" ? { about: { "@id": personId } } : {}),
    ...(page.project ? { mainEntity: { "@id": `${url}#project` } } : {}),
    // Article-style pages have a visible byline; describe the same dates and author
    ...(page.article ? {
      datePublished: page.article.published,
      ...(page.lastModified ? { dateModified: page.lastModified } : {}),
      author: { "@id": personId },
    } : {}),
    ...(items.length ? { mainEntity: { "@id": `${url}#list` } } : {}),
  }];
  if (page.path === "/") {
    graph.push({ "@type": "WebSite", "@id": absoluteUrl("/#website"), name: site.name,
      alternateName: ["M4cgyver", "m4cgyver.net"], url: absoluteUrl("/"), description: site.description,
      inLanguage: "en-US", author: { "@id": personId } },
    { "@type": "Person", "@id": personId, ...site.author, url: absoluteUrl("/") });
  } else {
    graph.push({ "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
      itemListElement: sitePageCrumbs(page).map((crumb, index) => ({
        "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path),
      })) });
  }
  // The author and creator references above need their Person node on this page too
  if (page.path !== "/" && (page.article || page.project)) {
    graph.push({ "@type": "Person", "@id": personId, ...site.author, url: absoluteUrl("/") });
  }
  if (page.project) graph.push({ "@type": "CreativeWork", "@id": `${url}#project`,
    name: page.project.name, description: page.project.description, url,
    creator: { "@id": personId }, mainEntityOfPage: { "@id": `${url}#webpage` },
    keywords: page.project.tags, ...(page.project.source ? { sameAs: page.project.source } : {}),
  });
  if (items.length) graph.push({ "@type": "ItemList", "@id": `${url}#list`, numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: absoluteUrl(item.path) })) });
  return { "@context": "https://schema.org", "@graph": graph };
}
