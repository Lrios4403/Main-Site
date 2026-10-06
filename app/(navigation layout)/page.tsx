import type { Metadata } from "next";
import Image from "next/image";
import introPhoto from "@/public/main/PXL_20230322_080050245.jpeg";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import JsonLd from "@/components/seo/JsonLd";
import Window from "@/components/window/Window";
import { homeJsonLd, pageMetadata, site } from "@/lib/seo";
import home from "./page.module.css";

// No title: the home page uses the site name on its own
export const metadata: Metadata = pageMetadata({
  description: site.description,
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <PageHeader title="M4cgyvers Repurposed Mining Rig!">
        Welcome to my (M4cgyver) website / resume (depending on whos reading).
        Written in NextJS 13 and NodeJs all within Docker!
      </PageHeader>

      <Window title="Introductions" className={styles.contentArea}>
        <p hidden> I put this shit in chatgtp i need this to sound nicer</p>
        <div className={home.intro}>
          <h1 className={`${styles.title} ${home.hello}`}>Hello World!</h1>
          <p className={home.first}>
            My name is Logan Rios, a California native with a passion for
            computer technology. I attended BOHS for high school, where I honed
            my skills in computer science. Currently, Im pursuing a degree in
            computer science and technology at Grand Canyon University in
            Arizona, where Im constantly exploring and expanding my knowledge in
            this field, though I always prefer self-taught methods such as
            YouTube videos and blog websites. My favorite form of learning is
            though creating fun projects that can be repurposed and reused in
            the future whenever needed.
          </p>

          <div className={home.spacer} />
          <a
            className={home.photo}
            href="/main/PXL_20230322_080050245.jpeg"
            target="_blank"
          >
            <Image
              src={introPhoto}
              alt="stupid mining rig"
              className={styles.contentImage}
              placeholder="blur"
              sizes="(max-width: 768px) 100vw, 275px"
            />
          </a>
          <p>
            In my free time, I enjoy creating unique and innovative hardware
            gimmicks, such as my gameboy that doubles as a keyfob or use a old
            mining rig to host a website and train AI models ready for everyone
            and anyone. I also have a strong interest in software development
            and enjoy pushing the boundaries of whats possible with obscure
            concepts and designs. One of my biggest software projects was
            creating a complete x86 opperating system (it booted and ran
            programs, thats about it. Could never figure out how to program
            interrupts so I just had a <i>jmp</i> table). I always have a love
            for old <i>retro</i> tech. If its games or just old computers parts
            I always love to make use of them. For example; Im using a stack of
            Floppy Disks to prop up my monitor because it fucking broke on the
            way to colledge :D. My passion for technology has led me on a
            journey of exploration and creativity, and Im excited to see where
            it takes me in the future.
          </p>

          <div className={home.spacer} />
          <p>
            Honestly thats about it. Ill be posting blog updates on locations,
            tips, projects, and games. Anyone else that posts more than that on
            the internet has really bad opsec, bad with personal data, or isnt
            Kenenough.
          </p>
        </div>
      </Window>
    </>
  );
}
