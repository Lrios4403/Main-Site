import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { postRegistry, getPublishedPosts, getPost } from "../../lib/posts";
import { parseDate, formatDate, validateDates } from "../../lib/blog/dates";
import { validatePosts } from "../../lib/blog/validate";
import { buildPostMetadata } from "../../lib/blog/metadata";
import { buildPostJsonLd } from "../../lib/blog/schema";
import { resolveRelated } from "../../lib/blog/related";
import { absoluteUrl, postPath } from "../../lib/blog/urls";
import { authors } from "../../lib/blog/authors";
import type { PostRecord } from "../../lib/blog/types";
import { checkPostHtml } from "./html";
import sitemap from "../../app/sitemap";
import { checkMedia } from "./media";
import { checkSiteHtml } from "./site-html";
import { getSitePage } from "../../lib/site-pages";
import { sitePageJsonLd } from "../../lib/page-schema";

const fixture = (changes: Partial<PostRecord> = {}): PostRecord => ({ ...structuredClone(postRegistry[0]), ...changes });
const today = "2026-10-11";
const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
test("static page audit accepts normalized home URLs and rejects missing H1/noindex", () => {
  const page = getSitePage("/");
  const html = `<html lang="en"><head><title>${escape(page.title)}</title>
    <meta name="description" content="${escape(page.description)}">
    <link rel="canonical" href="https://m4cgyver.net">
    <meta property="og:url" content="https://m4cgyver.net"><meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image"><meta name="robots" content="index, follow">
    </head><body><main><h1>Home</h1>
    <script type="application/ld+json">${JSON.stringify(sitePageJsonLd(page))}</script></main></body></html>`;
  expect(() => checkSiteHtml(html, page)).not.toThrow();
  expect(() => checkSiteHtml(html.replace("<h1>Home</h1>", "<h2>Home</h2>"), page)).toThrow("one H1");
  expect(() => checkSiteHtml(html.replace("index, follow", "noindex, follow"), page)).toThrow("noindex");
  expect(() => checkSiteHtml(html.replace('rel="canonical"', 'rel="alternate"'), page)).toThrow("canonical");
});
function fixtureHtml(post: PostRecord) {
  return `<html><head><title>${escape(post.title)} | M4cgyver</title>
    <meta name="description" content="${escape(post.description)}">
    <link rel="canonical" href="${absoluteUrl(post.path)}">
    <meta property="og:url" content="${absoluteUrl(post.path)}"><meta property="og:type" content="article">
    <meta name="twitter:card" content="summary"><meta name="robots" content="index, follow"></head>
    <body><main><article><h1>${escape(post.title)}</h1><span>Logan Rios</span>
    <time datetime="${post.published}">${post.published}</time>${post.updated ? `<time datetime="${post.updated}">${post.updated}</time>` : ""}
    <nav aria-label="Breadcrumb"><ol><li>Home</li><li>Blog</li><li>${escape(post.title)}</li></ol></nav>
    <nav aria-label="On this page">${post.sections.map(section => `<a href="#${section.id}">${section.title}</a>`).join("")}</nav>
    ${post.sections.map(section => `<h${section.level} id="${section.id}">${section.title}</h${section.level}>`).join("")}
    <script type="application/ld+json">${JSON.stringify(buildPostJsonLd(post)).replaceAll("<", "\\u003c")}</script>
    </article></main></body></html>`;
}

describe("calendar dates", () => {
  test("UTC date formatting and leap years", () => {
    expect(formatDate("2024-02-29")).toBe("February 29, 2024");
    expect(parseDate("2026-10-06").toISOString()).toBe("2026-10-06T00:00:00.000Z");
  });
  for (const date of ["2026-02-29", "2026-04-31", "2026-13-01", "26-01-01", "2026-1-01", "invalid"]) {
    test(`reject ${date}`, () => expect(() => parseDate(date)).toThrow());
  }
  test("reject reversed and future dates", () => {
    expect(() => validateDates({ published: "2026-10-10", updated: "2026-10-09" }, today)).toThrow();
    expect(() => validateDates({ published: "2026-10-12" }, today)).toThrow();
    expect(() => validateDates({ published: "2026-10-10", updated: "2026-10-12" }, today)).toThrow();
  });
});

describe("registry", () => {
  test("all real routes are covered and valid", () => {
    validatePosts(postRegistry, new Date().toISOString().slice(0, 10));
    const routes = readdirSync("app/blogs", { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name).sort();
    expect(postRegistry.map(post => post.slug).sort()).toEqual(routes);
    expect(getPublishedPosts().map(post => post.slug)).toEqual(["nextjs-ordered-table-layout", "llms-on-an-intel-npu"]);
  });
  test("reject duplicate slug/path, unsafe slug and unresolved author", () => {
    expect(() => validatePosts([fixture(), fixture()], today)).toThrow();
    expect(() => validatePosts([fixture({ path: "/blogs/wrong" })], today)).toThrow();
    expect(() => postPath("../private")).toThrow();
    expect(() => validatePosts([fixture({ authorId: "unknown" })], today)).toThrow();
  });
  test("reject duplicate sections and invalid media", () => {
    const post = fixture(); post.sections.push(post.sections[0]);
    expect(() => validatePosts([post], today)).toThrow();
    expect(() => validatePosts([fixture({ cover: { src: "/../private", width: 1200, height: 630, alt: "x", caption: "x" } })], today)).toThrow();
    expect(() => validatePosts([fixture({ cover: { src: "/cover.webp", width: 0, height: 630, alt: "", caption: "x" } })], today)).toThrow();
  });
  test("related links are curated and published only", () => {
    expect(resolveRelated(fixture())).toEqual([]);
    const target = fixture({ slug: "target", path: "/blogs/target" });
    expect(resolveRelated(fixture({ relatedSlugs: ["target"] }), [target])).toEqual([target]);
    expect(() => resolveRelated(fixture({ relatedSlugs: ["target"] }), [{ ...target, status: "draft" }])).toThrow();
    expect(() => resolveRelated(fixture({ relatedSlugs: ["missing"] }), [])).toThrow();
    expect(() => resolveRelated(fixture({ relatedSlugs: [fixture().slug] }), [fixture()])).toThrow();
  });
  test("drafts stay out of public discovery", () => {
    const draft = fixture({ slug: "draft-fixture", path: "/blogs/draft-fixture", status: "draft" });
    postRegistry.push(draft);
    try {
      expect(getPublishedPosts().some(post => post.slug === draft.slug)).toBe(false);
      expect(sitemap().some(entry => entry.url === absoluteUrl(draft.path))).toBe(false);
    } finally { postRegistry.pop(); }
  });
});

describe("metadata and graph", () => {
  test("cover and update are truly optional", () => {
    const post = fixture({ updated: undefined });
    const metadata = buildPostMetadata(post);
    expect(metadata.title).toBe(post.title);
    expect(metadata.alternates?.canonical).toBe(absoluteUrl(post.path));
    expect(metadata.openGraph).not.toHaveProperty("modifiedTime");
    const article = buildPostJsonLd(post)["@graph"].find(node => node["@type"] === "BlogPosting")!;
    expect(article).not.toHaveProperty("dateModified");
    expect(article).not.toHaveProperty("image");
  });
  test("real cover drives metadata and graph consistently", () => {
    const cover = { src: "/test-cover.webp", width: 1200, height: 630, alt: "Fixture only", caption: "Test fixture" };
    const post = fixture({ cover, seoTitle: "SEO title" });
    expect(buildPostMetadata(post).title).toBe("SEO title");
    expect(buildPostMetadata(post).twitter).toMatchObject({ card: "summary_large_image" });
    expect(buildPostJsonLd(post)["@graph"].find(node => node["@type"] === "BlogPosting")).toMatchObject({ image: { url: absoluteUrl(cover.src), width: 1200 } });
  });
  test("draft metadata is noindex/nofollow", () => expect(buildPostMetadata(fixture({ status: "draft" })).robots).toMatchObject({ index: false, follow: false }));
  test("second author resolves without hardcoded byline", () => {
    authors.push({ id: "fixture", name: "Fixture Author", path: "/authors/fixture", sameAs: [] });
    try {
      const post = fixture({ authorId: "fixture" });
      expect(buildPostMetadata(post).authors).toEqual([{ name: "Fixture Author", url: absoluteUrl("/authors/fixture") }]);
      expect(buildPostJsonLd(post)["@graph"][0]).toMatchObject({ name: "Fixture Author", "@id": absoluteUrl("/authors/fixture#person") });
    } finally { authors.pop(); }
  });
  test("safe script serialization", () => {
    const source = readFileSync("components/seo/JsonLd.tsx", "utf8");
    expect(source).toContain(String.raw`.replace(/</g, "\\u003c")`);
    const graph = buildPostJsonLd(fixture({ title: "</script><script>alert(1)</script>" }));
    expect(JSON.stringify(graph).replace(/</g, "\\u003c")).not.toContain("</script>");
  });
});

describe("HTML audit rejects regressions", () => {
  for (const post of getPublishedPosts()) test(`valid fixture ${post.slug}`, () => checkPostHtml(fixtureHtml(post), post));
  const post = fixture();
  const html = fixtureHtml(post);
  const mutations: [string, (html: string) => string][] = [
    ["missing H1", html => html.replace(/<h1>.*?<\/h1>/, "")],
    ["wrong canonical", html => html.replace('rel="canonical"', 'rel="other"')],
    ["duplicate H1", html => html.replace("</article>", "<h1>Extra</h1></article>")],
    ["broken anchor", html => html.replace('id="abstract"', 'id="missing"')],
    ["noindex", html => html.replace('content="index, follow"', 'content="noindex, follow"')],
    ["malformed JSON", html => html.replace('"@graph":', '"@graph": BROKEN')],
    ["wrong schema ID", html => html.replaceAll("#article", "#wrong")],
  ];
  for (const [name, mutate] of mutations) test(name, () => expect(() => checkPostHtml(mutate(html), post)).toThrow());
});

test("Intel examples keep model identifiers and Windows CMD continuations", () => {
  const source = readFileSync(join("app/blogs", "llms-on-an-intel-npu/page.tsx"), "utf8");
  expect(source).toContain("--source_model OpenVINO/Qwen3-8B-int4-cw-ov ^");
  expect(source).toContain("--model_name Qwen3-8B ^");
  expect(source).toContain("--target_device NPU ^");
  expect(source).toContain("http://localhost:8000/v3/models");
  expect(getPost("llms-on-an-intel-npu").sections.some(section => section.id === "verify-npu")).toBe(true);
});

test("media dimensions and missing assets fail reliably", async () => {
  // Existing promotional artwork is only a dimension fixture, not article evidence.
  const media = { src: "/slides/intel-npu.webp", width: 960, height: 540, alt: "Fixture", caption: "Fixture" };
  await checkMedia(media);
  await expect(checkMedia({ ...media, width: 1200 })).rejects.toThrow("Wrong image dimensions");
  await expect(checkMedia({ ...media, src: "/missing-fixture.webp" })).rejects.toThrow();
  await expect(checkMedia({ ...media, src: "/../package.json" })).rejects.toThrow("Media escapes");
});

test("companion worksheets explicitly contain no claimed test results", () => {
  const environment = JSON.parse(readFileSync("docs/examples/intel-npu/environment.example.json", "utf8"));
  expect(environment.testedAt).toBeNull();
  expect(environment.chatPassed).toBeNull();
  expect(environment.npuExecutionObserved).toBeNull();
  expect(environment.toolCallPassed).toBeNull();
  const client = JSON.parse(readFileSync("docs/examples/intel-npu/client.example.json", "utf8"));
  expect(new URL(client.apiBase).hostname).toBe("localhost");
});
