import Image, { type StaticImageData } from "next/image";
import styles from "@/components/main/styles.module.css";
import ViewCounter from "@/components/views/ViewCounter";
import Window from "@/components/window/Window";
import yesterwebRadio from "@/public/buttons/yesterweb-radio.png";
import yesterwebForum from "@/public/buttons/yesterweb-forum.png";
import fiveAmGirlfriend from "@/public/buttons/5am-girlfriend.webp";
import oekaki from "@/public/buttons/oekaki.jpg";
import daikonet from "@/public/buttons/daikonet.webp";
import dokodemo from "@/public/buttons/dokodemo.gif";
import gifShop from "@/public/buttons/99gifshop.png";
import sidebar from "./Sidebar.module.css";

type Fren = {
  href: string;
  image: StaticImageData;
  alt: string;
  title?: string;
};

// 88x31 buttons from the old site's "Frens and Interests" window. The
// descriptions (shown on hover) are copied as-is.
const frens: Fren[] = [
  {
    href: "https://yesterweb.org/radio/",
    image: yesterwebRadio,
    alt: "Yesterweb's Radio",
    title:
      "The link navigates to the Yesterweb's radio. collection of resources that document and preserve the history of the early web. It includes information on the first web browsers, web technologies, and early websites, as well as archives of websites and web-related artifacts from the 1990s and 2000s. The goal of the site is to provide a comprehensive look at the early days of the web and to preserve this important part of technology history for future generations. EDIT: My god what the hell happened here? A lot of drama happened that included other content creators, also the forum shutdown, I archived that though.",
  },
  {
    // The old site opened this in its own WARC viewer; the Wayback Machine stands in for it.
    href: "https://web.archive.org/web/2023/http://forum.yesterweb.org/",
    image: yesterwebForum,
    alt: "Yesterweb's Forum",
    title:
      "Yesterweb's dead forum. Dont ask me how it died I dont wanna dig though it lots to do with mismanagement, communism (????????), and shit",
  },
  {
    href: "https://5amgirlfriend.neocities.org/",
    image: fiveAmGirlfriend,
    alt: "5am Girlfriend",
    title:
      '5am Girlfriend is a webpage made by `Five` (screen name), designed to be a personal bloggind site with art and music. I really love the asthetic of the entire site! Unfortunatly, the website seems to be no longer mantained as `Five` made their last blog entry on "Marh 3rd, 2022" stating that their relationship with `Twelve` imploded while hinting in mental abuse, hostility, cheating, etc. Since the breakup shes been focusing on her mental health in the real world, drawing and sketcing again (play Bowser Jr."s Journey). Nevertheless I hope everything goes well with her!\n\nUpdate: On "Ctover 27, 2022" `Five` made another blog entry formally concluding the 5amgf saga, linking to her new page https://vivarism.neocities.org/',
  },
  {
    href: "https://oekaki.freakphone.net/",
    image: oekaki,
    alt: "Oekaki.freakphone.net drawing",
    title:
      'Oekaki.freakphone.net is an online platform for drawing and sharing illustrations. The word "oekaki" is a Japanese term for "to draw". The website may allow users to create drawings and share them with others.',
  },
  {
    href: "https://daikonet.neocities.org/",
    image: daikonet,
    alt: "Daikonet",
    title:
      'Daiko (or sometimes known by his other screename "Hogwash") is a weebshit, web and compsci enthusiest and has been working with RGP maker for about 8 years now. This is their personal blog site and I cannot stress this enough I fucking love the site layout. Its animated but the content is still really easy to follow when reading. Its retro enough to give the asthetic of the site and the "weebcore" isnt too takey. Also he uses osrs icons so thats a plus. I highley recomend you play their RPG Maker Game "Agricultura" its fucking beautiful!',
  },
  {
    href: "https://dokode.moe/",
    image: dokodemo,
    alt: "Japanese text or something",
    title:
      "Chill guy, loved the website and the general asthetic. Hes got a bunch of html tutorials for beginners ",
  },
  {
    href: "https://99gifshop.neocities.org/",
    image: gifShop,
    alt: "99 Gif Shop",
  },
];

// trackViews: false on pages that shouldn't count as a view (the 404 page)
export default function Sidebar({ trackViews = true }: { trackViews?: boolean }) {
  return (
    <div className={`${styles.navLhs} ${styles.sidebar}`}>
      {/* Left-hand navigation — same links as the old site */}
      <Window
        title="Navigation"
        className={sidebar.nav}
        bodyStyle={{ padding: "8px 10px 10px 12px" }}
      >
        <ul className={styles.list}>
          <li>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the site uses plain <a> links throughout */}
            <a className={styles.navLink} href="/">
              Homepage
            </a>
          </li>
          <li>
            <a className={styles.navLink} href="/contact/">
              Contact / Socials
            </a>
          </li>
          <li>
            <a className={styles.navLink} href="/games/">
              Movies / Games
            </a>
          </li>
          <li>
            <a className={styles.navLink} href="/blogs/">
              Blog Postings
            </a>
            <ul className={styles.list}>
              <li>
                <a className={styles.navLink} href="/blogs/nextjs-ordered-table-layout/">
                  Ordered Table Layout
                </a>
              </li>
              <li>
                <a className={styles.navLink} href="/blogs/llms-on-an-intel-npu/">
                  LLMs on an Intel NPU
                </a>
              </li>
            </ul>
          </li>
          <li>
            <a className={styles.navLink} href="/projects/">
              Projects
            </a>
            <ul className={styles.list}>
              <li>
                <a className={styles.navLink} href="/projects/archives/">
                  Archives
                </a>
              </li>
              <li>
                <a className={styles.navLink} href="/projects/startupos/">
                  StartupOS
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </Window>

      <Window title="Views" bodyStyle={{ padding: "6px 10px 8px" }}>
        <ViewCounter track={trackViews} />
      </Window>

      <Window title="Frens and Interests" bodyStyle={{ padding: 8 }}>
        <div className={sidebar.frens}>
          {frens.map((fren) => (
            <a key={fren.href} href={fren.href} target="_blank" rel="noreferrer noopener">
              <Image
                src={fren.image}
                alt={fren.alt}
                title={fren.title}
                width={88}
                height={31}
                unoptimized
              />
            </a>
          ))}
        </div>
      </Window>
    </div>
  );
}
