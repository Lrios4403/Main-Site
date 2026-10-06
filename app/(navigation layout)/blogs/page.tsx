import type { Metadata } from "next";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import JsonLd from "@/components/seo/JsonLd";
import Window from "@/components/window/Window";
import { formatDate, posts } from "@/lib/posts";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import list from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Blog Posts",
  description:
    "Here are a list of all of the thoughts or comments I have about anything happening on the Internet (or internet).",
  path: "/blogs",
});

// The posts themselves are listed in lib/posts.ts
export default function BlogList() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Blog", path: "/blogs" }])} />
      <PageHeader title="M4cgyvers Bountifull Blog Posts.">
        Here are a list of all of the thoughts or comments I have about
        anything happening on the Internet (or internet).
      </PageHeader>

      <Window title="Blog Entries" className={styles.contentArea}>
        {posts.length === 0 ? (
          <p className={list.empty}>No postings yet. Check back soon!</p>
        ) : (
          <ul className={list.list}>
            {posts.map((post) => (
              <li key={post.slug}>
                <a className={list.card} href={`/blogs/${post.slug}/`}>
                  <div className={list.cardHead}>
                    <h3 className={list.cardTitle}>{post.title}</h3>
                    {post.status && (
                      <span className={list.status}>{post.status}</span>
                    )}
                  </div>
                  <p className={list.cardDesc}>{post.description}</p>
                  <div className={list.cardMeta}>
                    <time className={list.date} dateTime={post.published}>
                      {formatDate(post.published)}
                    </time>
                    <span className={list.tags}>
                      {post.tags.map((tag) => (
                        <span key={tag} className={list.tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                    <span className={list.readMore}>
                      Read <span className={list.arrow}>&rarr;</span>
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Window>
    </>
  );
}
