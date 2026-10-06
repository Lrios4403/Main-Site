import type { Metadata } from "next";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import Sidebar from "@/components/sidebar/Sidebar";
import Window from "@/components/window/Window";

// Next adds noindex to 404 responses on its own, so this only sets the title
export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page doesn't exist.",
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
        {null}
      </Window>
    </>
  );
}
