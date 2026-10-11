import { site } from "@/lib/site";

export function postPath(slug: string): `/blogs/${string}` {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug: ${slug}`);
  return `/blogs/${slug}`;
}

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();
