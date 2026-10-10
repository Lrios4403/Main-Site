import type { ReactNode } from "react";
import Window from "@/components/window/Window";
import main from "@/components/main/styles.module.css";
import prose from "./Prose.module.css";

export default function ArticleLayout({ children, title, summary, id, className = main.contentArea }: { children: ReactNode; title: string; summary?: string; id?: string; className?: string }) {
  return <Window id={id} title={title} className={`${className} ${prose.post}`}><article>{summary && <aside className={prose.callout}><strong>At a glance</strong><p>{summary}</p></aside>}{children}</article></Window>;
}
