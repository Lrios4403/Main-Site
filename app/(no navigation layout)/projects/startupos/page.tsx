import PostSidebar from "@/components/post-sidebar/PostSidebar";
import Contents from "@/components/article/Contents";
import type { Metadata } from "next";
import ArticleHeader from "@/components/article/ArticleHeader";
import ArticleLayout from "@/components/article/ArticleLayout";
import styles from "@/components/main/styles.module.css";
import JsonLd from "@/components/seo/JsonLd";
import V86Emulator from "@/components/v86-emulator/V86Emulator";
import Window from "@/components/window/Window";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import page from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Startup OS Online VM",
  description:
    "Startup OS, a DOS-like x86 assembly operating system based on MikeOS, running in your browser.",
  path: "/projects/startupos",
});

export default function StartupOS() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Projects", path: "/projects" },
          { name: "Startup OS", path: "/projects/startupos" },
        ])}
      />
      <ArticleHeader title="StartupOS" description="A small DOS-like operating system built in x86 assembly, based on MikeOS. Explore the commands or try it in your browser." />

      {/* Left-hand column: credits */}
      <PostSidebar credits={[{label:"MikeOS",href:"https://mikeos.sourceforge.net/",note:"The foundation for the bootloader and system calls."}]} resources={[{label:"StartupOS source",href:"https://github.com/Lrios4403/StartupOS/tree/main",note:"Source code and project files."}]}>
        <Contents sections={[{id:"overview",title:"Overview",level:2},{id:"browser-demo",title:"Browser demo",level:2},{id:"project-notes",title:"Project notes",level:2},{id:"commands",title:"Commands",level:3}]} />
      </PostSidebar>

      <div className={`${styles.contentArea} ${page.stack}`}><ArticleLayout id="overview" title="Overview" className="" summary="A personal project for learning bootloaders, assembly, and the mechanics of an operating system. Built on MikeOS, with a small command shell and a FAT12 disk."><p><a href="https://github.com/Lrios4403/StartupOS/tree/main" target="_blank" rel="noopener noreferrer">Browse the source on GitHub ↗</a></p></ArticleLayout>
        <Window id="browser-demo"
          title={
            <>
              StartupOS · Browser demo
            </>
          }
          bodyStyle={{ padding: 12 }}
        >
          <p className={page.instructions}>Click the emulator screen to type. Try HELLO or DIR, and use Pause or Restart to control the session. A physical keyboard works best.</p>
          <V86Emulator disk="/projects/startupos/system.img" drive="fda" />
          <p className={page.instructions}>This is an experimental browser demo. Compatibility can differ from running the image in Bochs.</p>
        </Window>

        <ArticleLayout id="project-notes" title="Project notes" className="">
          <h2>Startup OS: an entire operating system built in x86 assembly</h2>
          <p>
            I always loved the aesthetic of old operating systems, primarily how
            they were programmed. I decided to learn all about x86 assembly and
            try to work with it. Over about a year and a half I managed to come
            up with this. It&apos;s a basic DOS-like operating system built off
            of the MikeOS operating system.
          </p>

          <h3 id="commands">Commands</h3>
          <ul>
            <li>
              <code>HELLO</code>: echoes &quot;Hello world!&quot;.
            </li>
            <li>
              <code>CLS</code>: clears the screen.
            </li>
            <li>
              <code>DIR</code>: lists all of the files on the{" "}
              <a
                href="https://en.wikipedia.org/wiki/File_Allocation_Table#FAT12"
                target="_blank"
                rel="noopener noreferrer"
              >
                FAT12
              </a>{" "}
              drive.
            </li>
            <li>
              <code>SCREEN</code>: a basic screen test.
            </li>
            <li>
              <code>SHUTDOWN</code>: shuts down the computer.
            </li>
          </ul>
          <p>
            As I&apos;m writing this out, I&apos;m starting to realize it&apos;s
            not much lmao. If you find any bugs or exploits, please tell me so I
            can feature them here!
          </p>
          
          <span className={page.notification}>You can download the source code on <a href="https://github.com/Lrios4403/StartupOS/tree/main" target="_blank" rel="noopener noreferrer">GitHub</a>.</span>
        </ArticleLayout>
      </div>
    </>
  );
}
