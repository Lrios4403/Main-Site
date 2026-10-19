import type { ReactNode } from "react";
import prose from "./Prose.module.css";

/** A boxed aside in an article: where to try something, or a caveat. Takes
 *  inline content (text, links, code): it's wrapped in one <p>, so a list or
 *  a second paragraph would make invalid HTML. */
export default function Note({ children }: { children: ReactNode }) {
  return (
    <aside className={prose.notification}>
      <p>{children}</p>
    </aside>
  );
}
