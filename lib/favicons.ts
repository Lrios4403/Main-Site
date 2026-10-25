import { FAVICON_HOSTS } from "./favicons.generated";

/** The local favicon for a link's host, if scripts/favicons.ts fetched one. */
export function faviconFor(href: string): string | undefined {
  const host = new URL(href).hostname;
  return FAVICON_HOSTS.has(host) ? `/favicons/${host}.png` : undefined;
}

/** A link's host without a leading www., for showing where it goes. */
export function hostOf(href: string): string {
  return new URL(href).hostname.replace(/^www\./, "");
}
