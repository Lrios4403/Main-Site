import type { Metadata } from "next";
import SiteLayout from "@/components/site-layout/SiteLayout";
import ProjectShell from "@/components/article/ProjectShell";
import { sitePageMetadata } from "@/lib/seo";
import { getArticlePage } from "@/lib/site-pages";
import { Overview } from "./Overview";
import { Indexing } from "./Indexing";
import { Serving } from "./Serving";
import { Hosting } from "./Hosting";
import { OfflineViewer } from "./OfflineViewer";
import { Closing } from "./Closing";

// Heading, summary, sidebar links and the section list live in
// lib/site-pages.ts; the SEO audit checks the sections against the headings.
const page = getArticlePage("/projects/archives");

export const metadata: Metadata = sitePageMetadata(page);

export default function ProjectArchives() {
  return (
    <SiteLayout variant="detail">
      <ProjectShell page={page}>
        <Overview />
        <Indexing />
        <Serving />
        <Hosting />
        <OfflineViewer />
        <Closing />
      </ProjectShell>
    </SiteLayout>
  );
}
