import type { Metadata } from "next";
import PageHeader from "@/components/page-header/PageHeader";
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
      <PageHeader title="Startup OS Online VM">
        This is an x86 assembly operating system I&apos;ve been working on, on
        and off, for years. I mainly crunched on it back in 2018, and now I
        mostly work on it on and off.
      </PageHeader>

      {/* Left-hand column: credits */}
      <div className={styles.navLhs}>
        <Window title="Credits" bodyStyle={{ padding: "10px 12px" }}>
          <ul className={page.credits}>
            <li>
              <a href="https://mikeos.sourceforge.net/" target="_blank" rel="noopener noreferrer">
                MikeOS
              </a>
              <span className={page.role}>Programmer</span>
              <span className={page.note}>
                I based the entire bootloader and syscalls on him.
              </span>
            </li>
            <li>
              <span className={page.name}>M4cgyver</span>
              <span className={page.role}>Programmer</span>
            </li>
          </ul>
        </Window>
      </div>

      <div className={`${styles.contentArea} ${page.stack}`}>
        <Window
          title={
            <>
              Startup OS <span className={page.online}>ONLINE</span>
            </>
          }
          bodyStyle={{ padding: 12 }}
        >
          <V86Emulator disk="/projects/startupos/system.img" drive="fda" />
          <span className={page.notification}>So it looks like it does work with v86, but it does in Bochs. Ill take a look and fix later.</span>
        </Window>

        <Window title="Description" className={page.post}>
          <h1>Startup OS: an entire operating system built in x86 assembly</h1>
          <p>
            I always loved the aesthetic of old operating systems, primarily how
            they were programmed. I decided to learn all about x86 assembly and
            try to work with it. Over about a year and a half I managed to come
            up with this. It&apos;s a basic DOS-like operating system built off
            of the MikeOS operating system.
          </p>

          <h2>Commands</h2>
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
        </Window>
      </div>
    </>
  );
}
