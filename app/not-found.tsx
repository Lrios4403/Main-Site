import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import Sidebar from "@/components/sidebar/Sidebar";
import Window from "@/components/window/Window";

// Explicit fallback as well as Next's automatic noindex for not-found responses.
export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page doesn't exist.",
  robots: { index: false, follow: true },
};

// The old site's 404 page, text copied as-is.
export default function NotFound() {
  return (
    <>
      <PageHeader title="Error: 404 Page NotFound">
        You are trying to access a webpage that doesent exist! Please naviate
        to literall anyting else.
      </PageHeader>
      <Sidebar trackViews={false} />
      <Window title="404 Page Not Found!" className={styles.contentArea}>
        <p>The page may have moved, or the address may be incorrect.</p>
        <ul className={styles.list}>
          <li><Link href="/">Return to the homepage</Link></li>
          <li><Link href="/blogs">Browse blog posts</Link></li>
          <li><Link href="/projects">Explore projects</Link></li>
        </ul>
      </Window>
    </>
  );
}
