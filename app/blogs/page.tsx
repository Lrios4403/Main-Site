import SiteLayout from "@/components/site-layout/SiteLayout";
import PageBreadcrumbs from "@/components/seo/PageBreadcrumbs";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import JsonLd from "@/components/seo/JsonLd";
import Window from "@/components/window/Window";
import { formatDate, posts } from "@/lib/posts";
import { sitePageMetadata } from "@/lib/seo";
import { getSitePage } from "@/lib/site-pages";
import { sitePageJsonLd } from "@/lib/page-schema";
import list from "./page.module.css";

const info = getSitePage("/blogs");
export const metadata: Metadata = sitePageMetadata(info);

// The posts themselves are listed in lib/posts.ts
export default function BlogList() {
  return (
    <SiteLayout variant="index">
      <JsonLd data={sitePageJsonLd(info)} />
      <PageHeader title="M4cgyvers Bountifull Blog Posts.">
        Experiments, practical guides, and lessons from building software.
      </PageHeader>

      <Window title="Blog Entries" className={`${styles.contentArea} ${styles.fillContent} ${list.surface}`}>
        <PageBreadcrumbs path={info.path} />
        {posts.length === 0 ? (
          <p className={list.empty}>No postings yet. Check back soon!</p>
        ) : (
          <ul className={list.list}>
            {posts.map((post, index) => (
              <li key={post.slug}>
                <Link className={list.card} href={post.path}>
                  {/* The cover (every post has one; a cover with visible: false is still
                      the share image and the card picture). The first card's image is
                      usually the largest paint on the page, so it loads eagerly. */}
                  {post.cover && (
                    <span className={list.cover}>
                      <Image src={post.cover.src} alt={post.cover.alt} width={post.cover.width} height={post.cover.height}
                        sizes="(max-width: 768px) 90vw, 280px" priority={index === 0} />
                    </span>
                  )}
                  <span className={list.cardBody}>
                    <span className={list.cardHead}>
                      <h2 className={list.cardTitle}>{post.title}</h2>
                      {post.badge && (
                        <span className={list.status}>{post.badge}</span>
                      )}
                    </span>
                    <span className={list.cardDesc}>{post.description}</span>
                    <span className={list.cardMeta}>
                      <time className={list.date} dateTime={post.published}>
                        {formatDate(post.published)}
                      </time>
                      <span className={list.reading}>About {post.readingMinutes} min read</span>
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
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Window>
    </SiteLayout>
  );
}
