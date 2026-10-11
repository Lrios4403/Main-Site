import "server-only";
import { postRegistry } from "@/lib/posts";
import type { PostRecord } from "./types";

export function resolveRelated(post: PostRecord, registry: PostRecord[] = postRegistry) {
  return post.relatedSlugs.map(slug => {
    const related = registry.find(candidate => candidate.slug === slug && candidate.status === "published");
    if (!related || related.slug === post.slug) throw new Error(`Invalid related post: ${slug}`);
    return related;
  });
}
