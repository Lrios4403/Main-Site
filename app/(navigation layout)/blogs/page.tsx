import type { Metadata } from "next";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import Window from "@/components/window/Window";
import list from "./page.module.css";

export const metadata: Metadata = {
  title: "M4cgyvers Bountifull Blog Posts.",
  description:
    "Here are a list of all of the thoughts or comments I have about anything happening on the Internet (or internet).",
};

type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  status?: string;
  tags: string[];
};

// The site's blog posts. Add new entries here as they're written.
const posts: Post[] = [
  {
    slug: "nextjs-ordered-table-layout",
    title: "NextJS Ordered Table Layout",
    description:
      "Using CSS grid areas to arrange components across layouts and pages in the Next.js App Router, so widgets from different files always land in the same spot. Includes a live HTML demo and a full example project.",
    date: "2026",
    tags: ["NextJS", "CSS Grid", "Layouts"],
  },
  {
    slug: "llms-on-an-intel-npu",
    title: "LLMs on an Intel NPU",
    description:
      "How I got Qwen3 8B running on my laptop's Intel AI Boost NPU with OpenVINO Model Server (or NoLlama), then hooked it into OpenWork and Claude Code, so small tasks stop burning Claude tokens and the GPU stays free.",
    date: "2026",
    tags: ["OpenVINO", "Intel NPU", "Qwen3", "Claude Code"],
  },
];

export default function BlogList() {
  return (
    <>
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
                    <span className={list.date}>{post.date}</span>
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
