import { load } from "cheerio";
import { postRegistry, getPublishedPosts } from "../../lib/posts";
import { validatePosts, validateSitePages } from "../../lib/blog/validate";
import { absoluteUrl } from "../../lib/blog/urls";
import { checkPostHtml } from "./html";
import { checkMedia } from "./media";
import { sitePages } from "../../lib/site-pages";
import { checkSiteHtml } from "./site-html";

const base = new URL(process.argv[2] ?? "http://localhost:3000");
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) || !["http:", "https:"].includes(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
  throw new Error("This bounded audit accepts a localhost origin only; it never crawls external links or article examples.");
}
validatePosts(postRegistry, new Date().toISOString().slice(0, 10));
validateSitePages(sitePages, new Date().toISOString().slice(0, 10));
const published = getPublishedPosts();
const registeredPaths = new Set([...sitePages, ...published].map(page => page.path));
const shareImages = new Set<string>();
const fetchPage = async (path: string) => {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(30000) });
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status}`);
  if (/noindex/i.test(response.headers.get("x-robots-tag") ?? "")) throw new Error(`${path}: noindex HTTP header`);
  const html = await response.text();
  if (response.headers.get("content-type")?.includes("text/html")) {
    const $ = load(html);
    $("a[href]").each((_, element) => {
      const href = $(element).attr("href")!;
      const target = new URL(href, absoluteUrl(path));
      if (target.origin !== new URL(absoluteUrl("/")).origin) return;
      const normalized = target.pathname.replace(/\/$/, "") || "/";
      if (registeredPaths.has(normalized) && normalized !== target.pathname) throw new Error(`${path}: noncanonical link ${href}`);
    });
    $('meta[property="og:image"], meta[name="twitter:image"]').each((_, element) => {
      const target = new URL($(element).attr("content")!, absoluteUrl("/"));
      if (target.origin === new URL(absoluteUrl("/")).origin && target.pathname === "/opengraph-image") shareImages.add(target.pathname + target.search);
    });
  }
  return html;
};
// Fetch only registered routes and discovery files, never hrefs found inside an article.
for (const post of published) {
  checkPostHtml(await fetchPage(post.path), post);
  if (post.cover) {
    await checkMedia(post.cover);
    const response = await fetch(new URL(post.cover.src, base), { redirect: "manual", signal: AbortSignal.timeout(30000) });
    if (response.status !== 200 || !response.headers.get("content-type")?.startsWith("image/")) throw new Error(`${post.slug}: cover is not served as an image`);
  }
  console.log(`PASS ${post.path}: initial HTML, metadata, schema, dates, headings and anchors`);
}
const index = load(await fetchPage("/blogs"));
const sitemap = load(await fetchPage("/sitemap.xml"), { xml: true });
for (const page of sitePages) {
  checkSiteHtml(await fetchPage(page.path), page);
  console.log(`PASS ${page.path}: headings, metadata, schema, breadcrumbs and canonical links${page.article ? `, ${page.article.sections.length} sections and the table of contents` : ""}`);
}
const locations = sitemap("url > loc").map((_, el) => sitemap(el).text()).get();
if (locations.length !== registeredPaths.size || new Set(locations).size !== locations.length || [...registeredPaths].some(path => !locations.includes(absoluteUrl(path)))) throw new Error("Sitemap must contain each published route exactly once");
for (const post of postRegistry) {
  const listed = index(`a[href="${post.path}"]`).length > 0;
  const entry = sitemap("url").filter((_, el) => sitemap(el).find("loc").text() === absoluteUrl(post.path));
  if (listed !== (post.status === "published") || (entry.length === 1) !== (post.status === "published")) throw new Error(`${post.slug}: index/sitemap publication mismatch`);
  if (post.status === "published" && entry.find("lastmod").text().slice(0, 10) !== (post.updated ?? post.published)) throw new Error(`${post.slug}: stale sitemap date`);
}
const robots = await fetchPage("/robots.txt");
if (!robots.includes(`Sitemap: ${absoluteUrl("/sitemap.xml")}`) || /Disallow:\s*\/(?:blogs)?\s*$/m.test(robots)) throw new Error("Unexpected robots rules");
for (const path of shareImages) {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(30000) });
  if (response.status !== 200 || !response.headers.get("content-type")?.startsWith("image/")) throw new Error(`${path}: share image is unavailable`);
}
const missing = await fetch(new URL("/__seo-audit-missing-page__", base), { redirect: "manual", signal: AbortSignal.timeout(30000) });
const missingHtml = load(await missing.text());
if (missing.status !== 404 || !/noindex/i.test(missingHtml('meta[name="robots"]').map((_, el) => missingHtml(el).attr("content")).get().join(" "))) throw new Error("Missing page must return HTTP 404 and noindex");
console.log(`PASS ${published.length} posts, ${sitePages.length} static pages, sitemap, robots, share images and 404`);
