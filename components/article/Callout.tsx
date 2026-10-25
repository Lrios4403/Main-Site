import type { ReactNode } from "react";
import styles from "./Callout.module.css";

// A boxed panel in an article with a small title strip, in three kinds:
// "where" restates where a walkthrough is, "why" explains a design choice,
// "gotcha" tells of something that went wrong and how it was fixed. Unlike
// Note, it takes block content (several paragraphs, lists, code).
export type CalloutKind = "where" | "why" | "gotcha";
const LABELS: Record<CalloutKind, string> = { where: "Where we are", why: "Why this way", gotcha: "Gotcha" };

export default function Callout({ kind, title, children }: { kind: CalloutKind; title?: string; children: ReactNode }) {
  return (
    <aside className={styles.callout} data-kind={kind} aria-label={title ? `${LABELS[kind]}: ${title}` : LABELS[kind]}>
      <p className={styles.strip}>
        <span className={styles.kind}>{LABELS[kind]}</span>
        {title && <span className={styles.title}>{title}</span>}
      </p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
