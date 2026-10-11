import "server-only";
import { site } from "./site";

export type SitePage = {
  path: string;
  title: string;
  label: string;
  description: string;
  schemaType: "ProfilePage" | "CollectionPage" | "ContactPage" | "WebPage";
  parent?: string;
  lastModified?: string;
  project?: { name: string; description: string; tags: string[]; source?: string };
};

/** Static public pages. Article records remain in lib/posts.ts. Dates are editorial, never build timestamps. */
export const sitePages: SitePage[] = [
  { path: "/", title: site.name, label: "Home", description: site.description, schemaType: "ProfilePage" },
  { path: "/blogs", title: "Blog Posts", label: "Blog", description: "Software experiments and practical guides by Logan Rios: local AI on Intel NPUs, Next.js layouts, and lessons from building personal projects.", schemaType: "CollectionPage" },
  { path: "/projects", title: "Projects and Workloads", label: "Projects", description: "Explore Logan Rios's software and systems projects: a searchable WARC web archive and StartupOS, an x86 operating system with a browser demo.", schemaType: "CollectionPage" },
  { path: "/projects/archives", title: "M4cgyvers Archives", label: "Archives", description: "Inside a personal web archive: indexing WARC captures with Bun and PostgreSQL, serving them through WireGuard, and replaying saved pages in the browser.", schemaType: "WebPage", parent: "/projects", lastModified: "2026-10-06",
    project: { name: "Archives", description: "Collect, search, and replay web captures. A look inside my WARC archive and the systems behind it.", tags: ["Bun", "PostgreSQL", "WARC"] } },
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

export function sitePageCrumbs(page: SitePage): { name: string; path: string }[] {
  if (page.path === "/") return [{ name: "Home", path: "/" }];
  return [...sitePageCrumbs(getSitePage(page.parent ?? "/")), { name: page.label, path: page.path }];
}

export const projectPages = sitePages.filter(
  (page): page is SitePage & { project: NonNullable<SitePage["project"]> } => Boolean(page.project),
);
