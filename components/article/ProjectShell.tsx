import type { ReactNode } from "react";
import { articleMeta, type ArticlePage } from "@/lib/site-pages";
import { sitePageJsonLd } from "@/lib/page-schema";
import PostSidebar from "@/components/post-sidebar/PostSidebar";
import PageBreadcrumbs from "@/components/seo/PageBreadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import ArticleHeader from "./ArticleHeader";
import ArticleLayout from "./ArticleLayout";
import Contents from "./Contents";
import styles from "./ArticleShell.module.css";

/** A site page laid out like a post (its PageArticle in lib/site-pages.ts):
 *  the same header, sidebar, table of contents and body window as
 *  ArticleShell, but with the site page's own WebPage schema and breadcrumbs
 *  instead of a BlogPosting. Root layout owns <main>; display:contents keeps
 *  the grid areas. */
export default function ProjectShell({ page, children }: { page: ArticlePage; children: ReactNode }) {
  const { heading, lede, summary, sections, resources } = page.article;
  const meta = articleMeta(page);
  return (
    <article className={styles.shell} aria-labelledby="article-title">
      <JsonLd data={sitePageJsonLd(page)} />
      <ArticleHeader id="article-title" title={heading} description={lede} post={meta} />
      <PostSidebar post={meta} infoTitle="Author & page info" resources={resources}>
        <Contents sections={sections} />
      </PostSidebar>
      <ArticleLayout title="Project notes" summary={summary} asArticle={false}>
        <PageBreadcrumbs path={page.path} />
        {children}
      </ArticleLayout>
    </article>
  );
}
