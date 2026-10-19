import type { ReactNode } from "react";

/** The live archive, defined with the page's registry entry. Its public
 *  pages only: nothing here may point at the backend, the tunnel or anything
 *  else that isn't served to readers. */
export { ARCHIVE } from "@/lib/site-pages";

/** A link to another site, opened in a new tab like the rest of the site's outbound links. */
export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}
