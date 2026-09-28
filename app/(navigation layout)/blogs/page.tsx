import type { Metadata } from "next";
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";
import list from "./page.module.css";

export const metadata: Metadata = {
  title: "Blog Postings",
  description: "Blog posts on projects, tips, locations, and games.",
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
    slug: "microsoft-azure-ai-900",
    title: "Stuff I Learned for Microsoft Azure AI 900",
    description:
      "My notes and resources from studying for the Microsoft Azure AI-900 certification — machine learning, deep learning, computer vision, and NLP. Updated as I go.",
    date: "2026",
    status: "In progress",
    tags: ["Azure", "AI", "900", "901", "Certification"],
  },
];

export default function BlogList() {
  return (
    <>
      <Window
        title="Title"
        className={styles.header}
        bodyStyle={{ padding: "12px 16px 14px" }}
      >
        <h2 className={styles.brand}>Blog Postings</h2>
        <p className={styles.headerWelcome}>
          Notes, tips, and write-ups on the projects, certifications, and games
          I&apos;m working through. More to come.
        </p>
      </Window>

      <Window title="Blog Postings" className={styles.contentArea}>
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
