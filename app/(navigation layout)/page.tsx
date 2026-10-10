import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import introPhoto from "@/public/main/PXL_20230322_080050245.jpeg";
import floppy from "@/assets/floppy-384.png";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import JsonLd from "@/components/seo/JsonLd";
import Window from "@/components/window/Window";
import { homeJsonLd, pageMetadata, site } from "@/lib/seo";
import home from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  description: site.description,
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <PageHeader title="M4cgyvers Repurposed Mining Rig!">
        Software, hardware, and a little creative reuse. A personal workshop by Logan Rios.
      </PageHeader>

      <section className={[styles.contentArea, home.profile].join(" ")} aria-labelledby="about-heading">
        <Window className={home.overview} bodyStyle={{ padding: 0 }}>
          <div className={home.profileBar}>
            <span><span className={home.indicator} aria-hidden="true" />Personal workshop</span>
            <span className={home.profileFile}>about / logan-rios</span>
          </div>
          <div className={home.overviewBody}>
            <Image src={floppy} alt="" aria-hidden="true" className={home.floppy} sizes="80px" />
            <p className={home.eyebrow}>Logan Rios <span>/ M4cgyver</span></p>
            <h1 id="about-heading" className={home.heading}>
              Curious about how it works.<br />
              <span>Happiest building it.</span>
            </h1>
            <p className={home.summary}>
              I’m a California native who enjoys building software, exploring computer
              systems, and finding new uses for old hardware. My curiosity takes me from
              writing an x86 operating system to preserving the web, experimenting with
              local AI, and turning a retired mining rig into something useful again.
              I’m especially drawn to projects that let me understand how things work
              beneath the surface—and build something I can keep using.
            </p>
            <p className={home.summary}>
              I started taking college-level programming courses in junior high, then
              built on that foundation through Brea Olinda’s Global IT Academy and
              coursework at Grand Canyon University and Fullerton College. Along the
              way, I completed MIT Professional Education’s certificate program in
              Machine Learning &amp; Artificial Intelligence. I still learn best by
              doing: following a tutorial, digging through documentation, and working
              through the parts that don’t go as planned.
            </p>
            <p className={home.summary}>
              That same approach carries into my professional work. At 2911Tech, I’ve
              helped build custom applications and integrate AI into client workflows
              using tools such as Python, TypeScript, C#, and Microsoft Azure AI.
              My experience also includes website and database migrations, hardware
              repair, and translating client needs into working software. Whether
              I’m solving a practical problem or tinkering with retro technology,
              I enjoy connecting software and hardware in unexpected ways.
            </p>
            <div className={home.actions}>
              <Link href="/projects/" className={home.primaryLink}>Explore my projects <span aria-hidden="true">↗</span></Link>
              <Link href="/contact/" className={home.textLink}>Get in touch <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <ul className={home.interests} aria-label="Interests">
            <li>Software &amp; systems</li>
            <li>Hardware experiments</li>
            <li>Retro computing</li>
          </ul>
        </Window>

        <div className={home.details}>
          <Window title={<span className={home.windowLabel}><span>01</span> Software &amp; systems</span>} className={home.detailWindow} bodyStyle={{ padding: 0 }}>
            <div className={home.detailBody}>
              <p className={home.kicker}>Selected projects</p>
              <h2 className={home.sectionHeading}>Learning from the inside out.</h2>
              <p className={home.copy}>
                I like projects that give me a reason to understand what happens
                beneath the surface.
              </p>
              <div className={home.projectList}>
                <Link href="/projects/startupos/" className={home.project}>
                  <span className={home.projectNumber} aria-hidden="true">01</span>
                  <span><strong>StartupOS</strong><span className={home.projectDescription}>An x86 operating system you can boot in your browser.</span></span>
                  <span className={home.arrow} aria-hidden="true">↗</span>
                </Link>
                <Link href="/projects/archives/" className={home.project}>
                  <span className={home.projectNumber} aria-hidden="true">02</span>
                  <span><strong>Web Archives</strong><span className={home.projectDescription}>A personal tool for preserving and exploring the web.</span></span>
                  <span className={home.arrow} aria-hidden="true">↗</span>
                </Link>
              </div>
              <Link href="/blogs/" className={home.textLink}>Read my notes on the process <span aria-hidden="true">→</span></Link>
            </div>
          </Window>

          <Window title={<span className={home.windowLabel}><span>02</span> Hardware &amp; experiments</span>} className={home.detailWindow} bodyStyle={{ padding: 0 }}>
            <figure className={home.rig}>
              <a href="/main/PXL_20230322_080050245.jpeg" target="_blank" rel="noopener noreferrer" aria-label="Open the full photo of my repurposed mining rig">
                <Image src={introPhoto} alt="A repurposed mining rig and computer hardware in my workspace"
                  className={home.photo} placeholder="blur" sizes="(max-width: 768px) 94vw, 410px" />
              </a>
              <figcaption>The hardware behind the name.</figcaption>
            </figure>
            <div className={home.hardwareCopy}>
              <h2 className={home.sectionHeading}>Old hardware. New possibilities.</h2>
              <p className={home.copy}>
                A former mining rig became a home for this site and AI experiments.
                A Game Boy became a key fob. I enjoy giving familiar technology a
                different purpose—and seeing what I can learn along the way.
              </p>
            </div>
          </Window>
        </div>
      </section>
    </>
  );
}
