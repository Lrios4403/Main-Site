import SiteLayout from "@/components/site-layout/SiteLayout";
import PageBreadcrumbs from "@/components/seo/PageBreadcrumbs";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import archiveImage from "@/public/slides/archive-bg.jpg";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import JsonLd from "@/components/seo/JsonLd";
import Window from "@/components/window/Window";
import { sitePageMetadata } from "@/lib/seo";
import { getSitePage, projectPages } from "@/lib/site-pages";
import { sitePageJsonLd } from "@/lib/page-schema";
import projects from "./page.module.css";
const info = getSitePage("/projects");
export const metadata: Metadata = sitePageMetadata(info);
const cards = projectPages.map(page => ({
 href: page.path, title: page.project.name, description: page.project.description,
 tags: page.project.tags, image: page.path === "/projects/archives" ? archiveImage : undefined,
}));
export default function Projects() {
 return <SiteLayout variant="index"><JsonLd data={sitePageJsonLd(info)} /><PageHeader title="Projects and Workloads.">Software, systems, and things built to find out how they work.</PageHeader>
 <Window title="From the workshop" className={`${styles.contentArea} ${styles.fillContent} ${projects.surface}`}><PageBreadcrumbs path={info.path} /><ul className={projects.grid}>{cards.map(card => <li key={card.href}><Link href={card.href} className={projects.card}>
 {card.image ? <Image src={card.image} alt="" className={projects.cover} sizes="(max-width:768px) 90vw, 400px"/> : <div className={projects.terminal} aria-hidden="true"><span>STARTUP OS</span><span>C:\&gt; HELLO</span><span>Hello world!<b>_</b></span></div>}
 <div className={projects.body}><h2>{card.title}</h2><p>{card.description}</p><ul className={projects.tags}>{card.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><span className={projects.action}>Explore project <span aria-hidden="true">↗</span></span></div></Link></li>)}</ul></Window></SiteLayout>;
}
