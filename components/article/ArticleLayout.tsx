import type { ReactNode } from "react";
import Window from "@/components/window/Window";
import main from "@/components/main/styles.module.css";
import prose from "./Prose.module.css";

export default function ArticleLayout({ children, title, summary, id, className = main.contentArea, asArticle = true }: { children: ReactNode; title: string; summary?: string; id?: string; className?: string; asArticle?: boolean }) {
  const Body = asArticle ? "article" : "div";
  return <Window id={id} title={title} className={`${className} ${prose.post}`}><Body className={prose.body}>{summary && <aside className={prose.callout}><strong>At a glance</strong><p>{summary}</p></aside>}{children}</Body></Window>;
}
