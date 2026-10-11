import { load } from "cheerio";
import { postRegistry, getPublishedPosts } from "../../lib/posts";
import { validatePosts } from "../../lib/blog/validate";
import { absoluteUrl } from "../../lib/blog/urls";
import { checkPostHtml } from "./html";
import { checkMedia } from "./media";

const base = new URL(process.argv[2] ?? "http://localhost:3000");
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) || !["http:", "https:"].includes(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
  throw new Error("This bounded audit accepts a localhost origin only; it never crawls external links or article examples.");
}
validatePosts(postRegistry, new Date().toISOString().slice(0, 10));
const published = getPublishedPosts();
const fetchPage = async (path: string) => {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(30000) });
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status}`);
  if (/noindex/i.test(response.headers.get("x-robots-tag") ?? "")) throw new Error(`${path}: noindex HTTP header`);
  return response.text();
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
for (const post of postRegistry) {
  const listed = index(`a[href="${post.path}"]`).length > 0;
  const entry = sitemap("url").filter((_, el) => sitemap(el).find("loc").text() === absoluteUrl(post.path));
  if (listed !== (post.status === "published") || (entry.length === 1) !== (post.status === "published")) throw new Error(`${post.slug}: index/sitemap publication mismatch`);
  if (post.status === "published" && entry.find("lastmod").text().slice(0, 10) !== (post.updated ?? post.published)) throw new Error(`${post.slug}: stale sitemap date`);
}
const robots = await fetchPage("/robots.txt");
if (!robots.includes(`Sitemap: ${absoluteUrl("/sitemap.xml")}`) || /Disallow:\s*\/(?:blogs)?\s*$/m.test(robots)) throw new Error("Unexpected robots rules");
console.log(`PASS ${published.length} published posts, blog index, sitemap and robots`);
