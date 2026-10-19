import { load } from "cheerio";
import type { PostRecord } from "../../lib/blog/types";
import { absoluteUrl } from "../../lib/blog/urls";
import { getAuthor } from "../../lib/blog/authors";

export function checkPostHtml(html: string, post: PostRecord): void {
  const $ = load(html);
  const require = (condition: unknown, message: string) => {
    if (!condition) throw new Error(`${post.slug}: ${message}`);
  };
  const canonical = absoluteUrl(post.path);
  require($("main").length === 1, "expected one main landmark");
  require($("article").length === 1 && $("article h1").length === 1 && $("h1").length === 1, "expected one article H1");
  require($("article h1").text() === post.title, "wrong article title");
  require($("head > title").length === 1 && $("head > title").text() === `${post.seoTitle ?? post.title} | M4cgyver`, "wrong document title");
  require($('meta[name="description"]').attr("content") === post.description, "wrong description");
  require($('link[rel="canonical"]').length === 1 && $('link[rel="canonical"]').attr("href") === canonical, "wrong canonical");
  require($('meta[property="og:url"]').attr("content") === canonical, "wrong OG URL");
  require($('meta[property="og:type"]').attr("content") === "article", "wrong OG type");
  require($('meta[name="twitter:card"]').attr("content") === (post.cover ? "summary_large_image" : "summary"), "wrong Twitter card");
  require(!/noindex/i.test($('meta[name="robots"]').attr("content") ?? ""), "published post is noindex");
  const ids = $("[id]").toArray().map(element => $(element).attr("id"));
  require(new Set(ids).size === ids.length, "duplicate HTML IDs");
  let lastIndex = -1;
  for (const section of post.sections) {
    const heading = $(`[id="${section.id}"]`);
    require(heading.length === 1 && heading[0].tagName === `h${section.level}`, `missing/wrong heading ${section.id}`);
    const index = ids.indexOf(section.id);
    require(index > lastIndex, "TOC order differs from article");
    lastIndex = index;
    require($(`nav[aria-label="On this page"] a[href="#${section.id}"]`).length > 0, `missing TOC link ${section.id}`);
  }
  $('a[href^="#"]').each((_, element) => {
    const id = decodeURIComponent($(element).attr("href")!.slice(1));
    if (id) require(ids.includes(id), `broken fragment ${id}`);
  });
  require($(`time[datetime="${post.published}"]`).length > 0, "missing visible publication date");
  if (post.updated) require($(`time[datetime="${post.updated}"]`).length > 0, "missing visible update date");
  require($("article").text().includes(getAuthor(post.authorId).name), "missing author");
  require($('nav[aria-label="Breadcrumb"] li').length === 3, "missing visible breadcrumbs");
  const graphs: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    const parsed = JSON.parse($(element).text());
    graphs.push(...(Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed]));
  });
  const articles = graphs.filter(node => node["@type"] === "BlogPosting");
  require(articles.length === 1, "expected one BlogPosting");
  const article = articles[0];
  require(article["@id"] === `${canonical}#article` && article.url === canonical, "wrong article identity");
  require(article.headline === post.title && article.datePublished === post.published && article.dateModified === post.updated, "schema content/date mismatch");
  require((article.mainEntityOfPage as Record<string, string>)?.["@id"] === `${canonical}#webpage`, "wrong mainEntityOfPage");
  require(graphs.some(node => node["@id"] === `${canonical}#webpage`), "missing WebPage");
  require(graphs.some(node => node["@id"] === `${canonical}#breadcrumb`), "missing breadcrumb graph");
  require(!$("article").text().includes("Fuckass models didn't work"), "exposed debug text");
  $("article img").each((_, element) => require($(element).attr("alt") !== undefined, "image missing alt"));
  if (post.cover) {
    if (post.cover.visible !== false) require($("article figure img").length > 0, "missing cover figure");
    require($('meta[property="og:image"]').attr("content") === absoluteUrl(post.cover.src), "wrong cover preview");
  } else require(article.image === undefined, "invented representative image");
}
