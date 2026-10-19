import { getAuthor } from "@/lib/blog/authors";
import type { ArticleMeta, ArticleResource } from "@/lib/blog/types";
import type { ReactNode } from "react";
import Link from "next/link";
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";
import { formatDate } from "@/lib/blog/dates";
import side from "./PostSidebar.module.css";

export type Resource = ArticleResource;
type PostSidebarProps = {
  // The byline: a post, or an article-style site page's meta
  post?: ArticleMeta;
  // The byline window's title ("Author & post info" on posts)
  infoTitle?: string;
  resources?: Resource[];
  credits?: Resource[];
  children?: ReactNode;
};

export default function PostSidebar({ post, infoTitle = "Author & post info", resources = [], credits = [], children }: PostSidebarProps) {
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
      <Window collapsible title={post ? infoTitle : "Author"} bodyStyle={{ padding: "12px" }}>
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
