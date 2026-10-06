import type { ReactNode } from "react";
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";
import { formatDate, type Post } from "@/lib/posts";
import side from "./PostSidebar.module.css";

export type Resource = {
  label: string;
  href: string;
  note?: string;
};

type PostSidebarProps = {
  post: Post;
  resources: Resource[];
  // The post's table of contents (its Navigation window)
  children: ReactNode;
};

// A blog post's left column, laid out like the StartupOS page's Credits: who
// wrote the post and when, the projects and docs it links to, then the table
// of contents, which stays in view while scrolling. The dates shown here are
// the same ones in the post's BlogPosting JSON-LD.
export default function PostSidebar({ post, resources, children }: PostSidebarProps) {
  return (
    <div className={`${styles.navLhs} ${side.column}`}>
      <Window title="Post Info" bodyStyle={{ padding: "10px 12px" }}>
        <ul className={side.list}>
          <li>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the site uses plain <a> links throughout */}
            <a href="/" rel="author">
              Logan Rios (M4cgyver)
            </a>
            <span className={side.label}>Author</span>
          </li>
          <li>
            <time className={side.value} dateTime={post.published}>
              {formatDate(post.published)}
            </time>
            <span className={side.label}>Published</span>
          </li>
          {post.updated && (
            <li>
              <time className={side.value} dateTime={post.updated}>
                {formatDate(post.updated)}
              </time>
              <span className={side.label}>Last updated</span>
            </li>
          )}
        </ul>
      </Window>

      {resources.length > 0 && (
        <Window title="Resources" bodyStyle={{ padding: "10px 12px" }}>
          <ul className={side.list}>
            {resources.map((resource) => (
              <li key={resource.href}>
                <a href={resource.href} target="_blank" rel="noopener noreferrer">
                  {resource.label}
                </a>
                {resource.note && <span className={side.note}>{resource.note}</span>}
              </li>
            ))}
          </ul>
        </Window>
      )}

      <div className={side.toc}>{children}</div>
    </div>
  );
}
