import { getAuthor } from "@/lib/blog/authors";
import type { ArticleResource } from "@/lib/blog/types";
import type { ReactNode } from "react";
import Link from "next/link";
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";
import { formatDate, type Post } from "@/lib/posts";
import side from "./PostSidebar.module.css";

export type Resource = ArticleResource;
type PostSidebarProps = {
  post?: Post;
  resources?: Resource[];
  credits?: Resource[];
  children?: ReactNode;
};

export default function PostSidebar({ post, resources = [], credits = [], children }: PostSidebarProps) {
  const author = getAuthor(post?.authorId ?? "logan-rios");
  const referenceList = (items: Resource[]) => (
    <ul className={side.list}>
      {items.map(item => <li key={item.href}>
        <a href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>
        {item.note && <span className={side.note}>{item.note}</span>}
      </li>)}
    </ul>
  );
  return (
    <aside className={`${styles.navLhs} ${side.column}`}>
      <Window collapsible title={post ? "Author & post info" : "Author"} bodyStyle={{ padding: "12px" }}>
        <ul className={side.list}>
          <li><Link href={author.path} rel="author">{author.name}{author.alternateName && ` (${author.alternateName})`}</Link><span className={side.label}>Author</span></li>
          {post && <>
            <li><time className={side.value} dateTime={post.published}>{formatDate(post.published)}</time><span className={side.label}>Published</span></li>
            {post.updated && <li><time className={side.value} dateTime={post.updated}>{formatDate(post.updated)}</time><span className={side.label}>Updated</span></li>}
            <li><span className={side.value}>About {post.readingMinutes} min</span><span className={side.label}>Reading time</span></li>
          </>}
        </ul>
      </Window>
      {credits.length > 0 && <Window collapsible title="Credits" bodyStyle={{ padding: "12px" }}>{referenceList(credits)}</Window>}
      {resources.length > 0 && <Window collapsible defaultOpen={false} title="Resources" bodyStyle={{ padding: "12px" }}>{referenceList(resources)}</Window>}
      {children && <div className={side.toc}>{children}</div>}
    </aside>
  );
}
