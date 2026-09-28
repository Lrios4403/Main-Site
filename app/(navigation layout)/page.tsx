import Image from "next/image";
import introPhoto from "@/public/main/PXL_20230322_080050245.jpeg";
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";

export default function Home() {
  return (
    <>
      <Window title="Title" className={styles.header} bodyStyle={{ padding: "12px 16px 14px" }}>
        <h2 className={styles.brand}>M4cgyvers Repurposed Mining Rig!</h2>
        <p className={styles.headerWelcome}>
          Welcome to my (M4cgyver) website / resume (depending on who&apos;s
          reading). Written in NextJS and BunJS all within Docker!
        </p>
      </Window>

      <Window title="Introduction" className={styles.contentArea}>
        <h1 className={styles.title}>Hello World!</h1>
        <div className={styles.contentImageWrap}>
          <Image
            src={introPhoto}
            alt="Floppy disks propping up a monitor"
            className={styles.contentImage}
            style={{ width: "100%", height: "auto" }}
            placeholder="blur"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
        <p className={styles.bodyText}>
          My name is Logan Rios, a California native with a passion for
          computer technology. I attended BOHS for high school, where I
          honed my skills in computer science. Currently, I&apos;m pursuing a
          degree in computer science and technology at Grand Canyon
          University in Arizona, where I&apos;m constantly exploring and
          expanding my knowledge in this field, though I always prefer
          self-taught methods such as YouTube videos and blog websites. My
          favorite form of learning is through creating fun projects that
          can be repurposed and reused in the future whenever needed.
        </p>
        <p className={styles.bodyText}>
          In my free time, I enjoy creating unique and innovative hardware
          gimmicks, such as my Game Boy that doubles as a keyfob, or using
          an old mining rig to host a website and train AI models ready for
          everyone and anyone. I also have a strong interest in software
          development and enjoy pushing the boundaries of what&apos;s possible
          with obscure concepts and designs. One of my biggest software
          projects was creating a complete x86 operating system (it booted
          and ran programs &mdash; that&apos;s about it; I could never figure out
          how to program interrupts, so I just had a jump table). I always
          have a love for old retro tech. Whether it&apos;s games or just old
          computer parts, I love to make use of them &mdash; for example, I&apos;m
          using a stack of floppy disks to prop up my monitor because it
          broke on the way to college :D. My passion for technology has led
          me on a journey of exploration and creativity, and I&apos;m excited to
          see where it takes me in the future.
        </p>
        <p className={styles.bodyText}>
          Honestly, that&apos;s about it. I&apos;ll be posting blog updates on
          locations, tips, projects, and games.
        </p>
      </Window>
    </>
  );
}
