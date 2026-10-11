import Link from "next/link";
import type { PostRecord } from "@/lib/blog/types";
import { resolveRelated } from "@/lib/blog/related";

export default function ArticleRelated({ post }: { post: PostRecord }) {
  const related = resolveRelated(post);
  if (!related.length) return null;
  return <aside aria-label="Related articles"><h2>Related articles</h2><ul>{related.map(item =>
    <li key={item.slug}><Link href={item.path}>{item.title}</Link><p>{item.description}</p></li>
  )}</ul></aside>;
}
