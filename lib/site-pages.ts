import "server-only";
import { site } from "./site";
import type { ArticleMeta, ArticleResource, ArticleSection } from "./blog/types";

/** A long-form page (project notes) laid out like a post: its heading, the
 *  text under it, the "At a glance" summary, and the sections the table of
 *  contents lists. The SEO audit checks the sections against the headings. */
export type PageArticle = {
  heading: string;
  lede: string;
  summary: string;
  // The byline, like a post's. The "Updated" date is the page's lastModified,
  // so the header, the sidebar and the sitemap can't disagree.
  authorId: string;
  published: string;
  readingMinutes: number;
  sections: ArticleSection[];
  resources?: ArticleResource[];
};

export type SitePage = {
  path: string;
  title: string;
  label: string;
  description: string;
  schemaType: "ProfilePage" | "CollectionPage" | "ContactPage" | "WebPage";
  parent?: string;
  lastModified?: string;
  project?: { name: string; description: string; tags: string[]; source?: string };
  article?: PageArticle;
};

/** The live web archive (its public pages only). */
export const ARCHIVE = "https://archives.m4cgyver.net";

/** Static public pages. Article records remain in lib/posts.ts. Dates are editorial, never build timestamps. */
export const sitePages: SitePage[] = [
  { path: "/", title: site.name, label: "Home", description: site.description, schemaType: "ProfilePage" },
  { path: "/blogs", title: "Blog Posts", label: "Blog", description: "Software experiments and practical guides by Logan Rios: local AI on Intel NPUs, Next.js layouts, and lessons from building personal projects.", schemaType: "CollectionPage" },
  { path: "/projects", title: "Projects and Workloads", label: "Projects", description: "Explore Logan Rios's software and systems projects: a searchable WARC web archive and StartupOS, an x86 operating system with a browser demo.", schemaType: "CollectionPage" },
  { path: "/projects/archives", title: "M4cgyvers Archives", label: "Archives", description: "Inside a personal web archive: indexing WARC captures with Bun and PostgreSQL, serving them through WireGuard, and replaying saved pages in the browser.", schemaType: "WebPage", parent: "/projects", lastModified: "2026-10-19",
    project: { name: "Archives", description: "Collect, search, and replay web captures. A look inside my WARC archive and the systems behind it.", tags: ["Bun", "PostgreSQL", "WARC"] },
    article: {
      heading: "M4cgyvers Archives",
      lede: "How a one-person web archive keeps 2,000+ WARC files searchable and replayable: an index instead of a copy, one parser in two runtimes, and a home server behind a tunnel.",
      summary: "About 2,180 WARC files and 21 million captured responses, searchable by URL and replayable in the browser. The database stores only where each response sits in its file, and the same hand-written parser indexes the archive on the server and opens your own WARC files in your browser.",
      authorId: "logan-rios",
      published: "2026-10-06",
      readingMinutes: 18,
      resources: [
        { label: "Live archive", href: ARCHIVE, note: "Search and replay saved web captures." },
        { label: "Offline WARC viewer", href: `${ARCHIVE}/warcs/offline`, note: "Open your own WARC files in the browser." },
        { label: "Opening WARC files", href: `${ARCHIVE}/guides/how-to-open-warc-file`, note: "The archive's guide to other WARC tools." },
      ],
      // Ids kept from the earlier layout where the topic survived, so old links still land
      sections: [
        { id: "tldr", title: "The short version", level: 2 },
        { id: "how-it-fits", title: "Part 1: The big picture", level: 2 },
        { id: "collecting-warcs", title: "What a WARC holds", level: 3 },
        { id: "the-big-picture", title: "From crawl to browser", level: 3 },
        { id: "indexing", title: "Part 2: Indexing", level: 2 },
        { id: "postgresql", title: "An index, not a copy", level: 3 },
        { id: "parser", title: "One parser, two runtimes", level: 3 },
        { id: "real-world-warcs", title: "What real WARCs break", level: 3 },
        { id: "resumable-ingest", title: "Resumable ingest", level: 3 },
        { id: "serving", title: "Part 3: Serving captures", level: 2 },
        { id: "bun-api", title: "The Bun API", level: 3 },
        { id: "search", title: "Search", level: 3 },
        { id: "nearest-capture", title: "Nearest capture", level: 3 },
        { id: "online-replay", title: "Online replay", level: 3 },
        { id: "downloads", title: "Downloads", level: 3 },
        { id: "hosting", title: "Part 4: Hosting", level: 2 },
        { id: "wireguard", title: "The WireGuard tunnel", level: 3 },
        { id: "frontend", title: "The archive's website", level: 3 },
        { id: "offline-viewer", title: "Part 5: Offline viewer", level: 2 },
        { id: "browser-parsing", title: "Parsing in workers", level: 3 },
        { id: "rebuilding-pages", title: "Rebuilding pages", level: 3 },
        { id: "limits", title: "Limits", level: 2 },
        { id: "glossary", title: "Terms", level: 2 },
        { id: "update-notes", title: "Updates", level: 2 },
      ],
    } },
  { path: "/projects/startupos", title: "StartupOS — x86 Operating System and Browser Demo", label: "StartupOS", description: "Explore StartupOS, a DOS-like x86 assembly operating system based on MikeOS. Read the project notes, browse the source, and try the browser emulator.", schemaType: "WebPage", parent: "/projects", lastModified: "2026-10-06",
    project: { name: "StartupOS", description: "A small x86 operating system based on MikeOS. Explore the source and try the browser emulator.", tags: ["Assembly", "x86", "MikeOS"], source: "https://github.com/Lrios4403/StartupOS/tree/main" } },
  { path: "/contact", title: "Contact Logan Rios — Email and Socials", label: "Contact", description: "Get in touch with Logan Rios (M4cgyver) by email or through the Fediverse. Contact links for software, systems, and personal projects.", schemaType: "ContactPage" },
  { path: "/games", title: "Games and Movies — Coming Soon", label: "Games", description: "A future home for games and movies made by Logan Rios. Nothing is published here yet; explore the projects and blog in the meantime.", schemaType: "WebPage" },
];

export function getSitePage(path: string): SitePage {
  const page = sitePages.find(page => page.path === path);
  if (!page) throw new Error(`Unknown site page: ${path}`);
  return page;
}

export type ArticlePage = SitePage & { article: PageArticle };

/** A site page that is laid out as an article (see PageArticle). */
export function getArticlePage(path: string): ArticlePage {
  const page = getSitePage(path);
  if (!page.article) throw new Error(`Site page has no article: ${path}`);
  return page as ArticlePage;
}

/** An article-style page's byline: its author, first publication, last update and reading time. */
export function articleMeta(page: ArticlePage): ArticleMeta {
  const { authorId, published, readingMinutes } = page.article;
  return { authorId, published, updated: page.lastModified, readingMinutes };
}

export function sitePageCrumbs(page: SitePage): { name: string; path: string }[] {
  if (page.path === "/") return [{ name: "Home", path: "/" }];
  return [...sitePageCrumbs(getSitePage(page.parent ?? "/")), { name: page.label, path: page.path }];
}

export const projectPages = sitePages.filter(
  (page): page is SitePage & { project: NonNullable<SitePage["project"]> } => Boolean(page.project),
);
