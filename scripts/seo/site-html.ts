import { load } from "cheerio";
import { absoluteUrl } from "../../lib/blog/urls";
import { sitePageCrumbs, type SitePage } from "../../lib/site-pages";

/** Inspect server-rendered HTML; do not follow arbitrary links or run page scripts. */
export function checkSiteHtml(html: string, page: SitePage): void {
  const $ = load(html);
  const require = (condition: unknown, message: string) => {
    if (!condition) throw new Error(`${page.path}: ${message}`);
  };
  const canonical = absoluteUrl(page.path);
  // Next normalizes the origin-only metadata URL without a trailing slash.
  const sameUrl = (value: string | undefined) => Boolean(value && new URL(value).href === canonical);
  require($("html").attr("lang")?.startsWith("en"), "missing English document language");
  require($("main").length === 1 && $("h1").length === 1, "expected one main and one H1");
  require($("title").length === 1 && $("title").text() === (page.path === "/" ? page.title : `${page.title} | M4cgyver`), "wrong document title");
  require($('meta[name="description"]').attr("content") === page.description, "wrong description");
  require($('link[rel="canonical"]').length === 1 && sameUrl($('link[rel="canonical"]').attr("href")), "wrong canonical");
  require(sameUrl($('meta[property="og:url"]').attr("content")), "wrong Open Graph URL");
  require($('meta[property="og:type"]').attr("content") === "website", "wrong Open Graph type");
  require($('meta[name="twitter:card"]').attr("content") === "summary_large_image", "wrong Twitter card");
  require(!/noindex/i.test($('meta[name="robots"], meta[name="googlebot"]').map((_, el) => $(el).attr("content")).get().join(" ")), "public page is noindex");
  const ids = $("[id]").map((_, el) => $(el).attr("id")).get();
  require(new Set(ids).size === ids.length, "duplicate HTML IDs");
  $("img").each((_, el) => require($(el).attr("alt") !== undefined, "image missing alt"));
  const nodes: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const data = JSON.parse($(el).text());
    nodes.push(...(data["@graph"] ?? [data]));
  });
  const pages = nodes.filter(node => node["@id"] === `${canonical}#webpage`);
  require(pages.length === 1 && pages[0]["@type"] === page.schemaType && pages[0].url === canonical, "wrong page schema identity");
  if (page.path !== "/") {
    const crumbs = sitePageCrumbs(page);
    const breadcrumb = nodes.find(node => node["@id"] === `${canonical}#breadcrumb`);
    const expected = crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path) }));
    require(JSON.stringify(breadcrumb?.itemListElement) === JSON.stringify(expected), "wrong breadcrumb schema");
    require($('nav[aria-label="Breadcrumb"] li').length === crumbs.length, "missing visible breadcrumbs");
  }
}
