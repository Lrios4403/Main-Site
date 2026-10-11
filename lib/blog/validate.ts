import { getAuthor } from "./authors";
import { validateDates } from "./dates";
import { postPath } from "./urls";
import { resolveRelated } from "./related";
import type { PostRecord } from "./types";

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
    const ids = new Set<string>();
    for (const section of post.sections) {
      if (!/^[a-z][a-z0-9-]*$/.test(section.id) || ids.has(section.id) || !section.title.trim() || ![2, 3, 4].includes(section.level)) {
        throw new Error(`Invalid section: ${section.id}`);
      }
      ids.add(section.id);
    }
    if (new Set(post.relatedSlugs).size !== post.relatedSlugs.length) throw new Error("Duplicate related post");
    resolveRelated(post, registry);
    for (const resource of [...post.resources, ...(post.credits ?? [])]) {
      if (!resource.label.trim() || !/^https?:\/\//.test(resource.href)) throw new Error("Invalid resource");
      new URL(resource.href);
    }
    if (post.cover) {
      const media = post.cover;
      if (!/^\/(?!\/)/.test(media.src) || media.src.split("/").includes("..") || /[?#\\]/.test(media.src)) throw new Error("Cover must be a local public asset");
      if (!media.alt.trim() || !media.caption.trim() || !Number.isInteger(media.width) || !Number.isInteger(media.height) || media.width < 1 || media.height < 1) throw new Error("Invalid cover metadata");
      if (media.credit && (!media.credit.name.trim() || !/^https?:\/\//.test(media.credit.url))) throw new Error("Invalid media credit");
    }
  }
}
