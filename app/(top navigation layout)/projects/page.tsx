import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import archiveImage from "@/public/slides/archive-bg.jpg";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import JsonLd from "@/components/seo/JsonLd";
import Window from "@/components/window/Window";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import projects from "./page.module.css";
export const metadata: Metadata = pageMetadata({title:"Projects and Workloads",description:"Software, systems, and experiments from my personal workshop.",path:"/projects"});
const cards = [
 {href:"/projects/archives/",title:"Archives",description:"Collect, search, and replay web captures. A look inside my WARC archive and the systems behind it.",tags:["Bun", "PostgreSQL", "WARC"],image:archiveImage},
 {href:"/projects/startupos/",title:"StartupOS",description:"A small x86 operating system based on MikeOS. Explore the source and try the browser emulator.",tags:["Assembly", "x86", "MikeOS"]},
];
export default function Projects() {
 return <><JsonLd data={breadcrumbJsonLd([{name:"Projects",path:"/projects"}])}/><PageHeader title="Projects and Workloads.">Software, systems, and things built to find out how they work.</PageHeader>
 <Window title="From the workshop" className={`${styles.contentArea} ${projects.surface}`}><ul className={projects.grid}>{cards.map(card => <li key={card.href}><Link href={card.href} className={projects.card}>
 {card.image ? <Image src={card.image} alt="" className={projects.cover} sizes="(max-width:768px) 90vw, 400px"/> : <div className={projects.terminal} aria-hidden="true"><span>STARTUP OS</span><span>C:\&gt; HELLO</span><span>Hello world!<b>_</b></span></div>}
 <div className={projects.body}><h2>{card.title}</h2><p>{card.description}</p><ul className={projects.tags}>{card.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><span className={projects.action}>Explore project <span aria-hidden="true">↗</span></span></div></Link></li>)}</ul></Window></>;
}
