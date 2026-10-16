import SiteLayout from "@/components/site-layout/SiteLayout";
import PageBreadcrumbs from "@/components/seo/PageBreadcrumbs";
import type { Metadata } from "next";
import styles from "@/components/main/styles.module.css";
import PageHeader from "@/components/page-header/PageHeader";
import JsonLd from "@/components/seo/JsonLd";
import Window from "@/components/window/Window";
import { sitePageMetadata } from "@/lib/seo";
import { getSitePage } from "@/lib/site-pages";
import { sitePageJsonLd } from "@/lib/page-schema";
import games from "./page.module.css";

const info = getSitePage("/games");
export const metadata: Metadata = sitePageMetadata(info);

// Nothing's published yet, so the page is a retro "coming soon" screen: a
// DOS prompt that can't find any games, then an arcade attract screen.
export default function Games() {
  return (
    <SiteLayout variant="index">
      <JsonLd data={sitePageJsonLd(info)} />
      <PageHeader title="General Good Entertainment">
        Games and movies I make will show up here. Nothing&apos;s published
        yet, so check back later!
      </PageHeader>

      <Window
        title="Entertainment"
        className={`${styles.contentArea} ${styles.fillContent}`}
        bodyStyle={{ padding: 12 }}
      >
        <PageBreadcrumbs path={info.path} />
        <div className={games.screen}>
          <pre className={games.terminal}>{`C:\\GAMES> dir
 Volume in drive C is ENTERTAINMENT
 Directory of C:\\GAMES

File Not Found

`}
            <span className={games.prompt}>C:\GAMES&gt; </span>
            <span className={games.cursor} aria-hidden="true">
              _
            </span>
          </pre>

          <div className={games.attract}>
            <p className={games.coming}>Coming Soon</p>
            <div className={games.loading} aria-hidden="true">
              <span className={games.loadingBar} />
            </div>
            <p className={games.insertCoin}>Insert Coin</p>
          </div>
        </div>

        <p className={games.note}>
          No games or movies are published yet. When I finish one, it&apos;ll
          show up here.
        </p>
      </Window>
    </SiteLayout>
  );
}
