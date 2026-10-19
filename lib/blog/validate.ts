import { getAuthor } from "./authors";
import { parseDate, validateDates } from "./dates";
import { postPath } from "./urls";
import { resolveRelated } from "./related";
import type { ArticleResource, ArticleSection, PostRecord } from "./types";
import type { SitePage } from "../site-pages";

/** Section ids are unique slugs, titled, at heading levels 2-4. */
export function validateSections(sections: ArticleSection[]): void {
  const ids = new Set<string>();
  for (const section of sections) {
    if (!/^[a-z][a-z0-9-]*$/.test(section.id) || ids.has(section.id) || !section.title.trim() || ![2, 3, 4].includes(section.level)) {
      throw new Error(`Invalid section: ${section.id}`);
    }
    // The article shells give the page heading this id
    if (section.id === "article-title") throw new Error("Reserved section id: article-title");
    ids.add(section.id);
  }
}

export function validateResources(resources: ArticleResource[]): void {
  for (const resource of resources) {
    if (!resource.label.trim() || !/^https?:\/\//.test(resource.href)) throw new Error("Invalid resource");
    new URL(resource.href);
  }
}

/** Static pages: unique paths, real parents, editorial dates that parse and
 *  aren't in the future, and article blocks held to the same rules as posts. */
export function validateSitePages(pages: SitePage[], today: string): void {
  const paths = new Set(pages.map(page => page.path));
  if (paths.size !== pages.length) throw new Error("Duplicate site page path");
  for (const page of pages) {
    if (page.parent && !paths.has(page.parent)) throw new Error(`${page.path}: unknown parent ${page.parent}`);
    // Breadcrumbs follow parents up to "/", so a cycle would recurse forever at build time
    const seen = new Set<string>();
    for (let at: SitePage | undefined = page; at && at.path !== "/"; at = pages.find(other => other.path === (at!.parent ?? "/"))) {
      if (seen.has(at.path)) throw new Error(`${page.path}: parent cycle`);
      seen.add(at.path);
    }
    if (page.lastModified) {
      parseDate(page.lastModified);
      if (page.lastModified > today) throw new Error(`${page.path}: lastModified is in the future`);
    }
    if (page.article) {
      const { heading, lede, summary, sections, resources = [], authorId, published, readingMinutes } = page.article;
      if (![heading, lede, summary].every(value => value.trim())) throw new Error(`${page.path}: empty article field`);
      // The byline: a real author, published on or before the last update, neither in the future
      getAuthor(authorId);
      validateDates({ published, updated: page.lastModified }, today);
      if (!Number.isInteger(readingMinutes) || readingMinutes < 1) throw new Error(`${page.path}: invalid reading time`);
      if (sections.length === 0) throw new Error(`${page.path}: article has no sections`);
      validateSections(sections);
      validateResources(resources);
    }
  }
}

export function validatePosts(registry: PostRecord[], today: string): void {
  const slugs = new Set<string>();
  const paths = new Set<string>();
  for (const post of registry) {
    if (slugs.has(post.slug) || paths.has(post.path)) throw new Error(`Duplicate post: ${post.slug}`);
    slugs.add(post.slug); paths.add(post.path);
    if (post.path !== postPath(post.slug)) throw new Error(`Invalid path: ${post.path}`);
    if (!["published", "draft"].includes(post.status)) throw new Error(`Invalid status: ${post.slug}`);
    getAuthor(post.authorId);
    validateDates(post, today);
    for (const value of [post.title, post.description, post.summary, ...post.tags]) {
      if (!value.trim()) throw new Error(`Empty article field: ${post.slug}`);
    }
    if (!Number.isInteger(post.readingMinutes) || post.readingMinutes < 1) throw new Error("Invalid reading time");
    validateSections(post.sections);
    if (new Set(post.relatedSlugs).size !== post.relatedSlugs.length) throw new Error("Duplicate related post");
    resolveRelated(post, registry);
    validateResources([...post.resources, ...(post.credits ?? [])]);
    if (post.cover) {
      const media = post.cover;
      if (!/^\/(?!\/)/.test(media.src) || media.src.split("/").includes("..") || /[?#\\]/.test(media.src)) throw new Error("Cover must be a local public asset");
      if (!media.alt.trim() || !media.caption.trim() || !Number.isInteger(media.width) || !Number.isInteger(media.height) || media.width < 1 || media.height < 1) throw new Error("Invalid cover metadata");
      if (media.credit && (!media.credit.name.trim() || !/^https?:\/\//.test(media.credit.url))) throw new Error("Invalid media credit");
    }
  }
}
