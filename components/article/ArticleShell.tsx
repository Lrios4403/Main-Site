import type { ReactNode } from "react";
import Link from "next/link";
import type { PostRecord } from "@/lib/blog/types";
import { articleCrumbs, buildPostJsonLd } from "@/lib/blog/schema";
import ArticleHeader from "./ArticleHeader";
import ArticleLayout from "./ArticleLayout";
import ArticleFigure from "./ArticleFigure";
import ArticleRelated from "./ArticleRelated";
import Contents from "./Contents";
import PostSidebar from "@/components/post-sidebar/PostSidebar";
import JsonLd from "@/components/seo/JsonLd";
import styles from "./ArticleShell.module.css";

/** Root layout already owns <main>. display:contents preserves its named grid areas. */
export default function ArticleShell({ post, children }: { post: PostRecord; children: ReactNode }) {
  return <article className={styles.shell} aria-labelledby="article-title">
    <JsonLd data={buildPostJsonLd(post)} />
    <ArticleHeader title={post.title} description={post.description} post={post} id="article-title" />
    <PostSidebar post={post} resources={post.resources} credits={post.credits}>
      {post.sections.length > 0 && <Contents sections={post.sections} />}
    </PostSidebar>
    <ArticleLayout title="Article" summary={post.summary} asArticle={false}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><ol>
        {articleCrumbs(post).map((crumb, index, crumbs) => <li key={crumb.path}>
          {index === crumbs.length - 1 ? <span aria-current="page">{crumb.name}</span> : <Link href={crumb.path}>{crumb.name}</Link>}
        </li>)}
      </ol></nav>
      {post.cover && post.cover.visible !== false && <ArticleFigure media={post.cover} />}
      {children}
      <ArticleRelated post={post} />
    </ArticleLayout>
  </article>;
}
