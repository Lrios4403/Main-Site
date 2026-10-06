import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { site } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Oldschool PC font (Toshiba TxL1 8x16) — site-wide retro typeface
const toshiba = localFont({
  src: "../public/fonts/Toshiba-TXL1.woff",
  variable: "--font-toshiba",
  display: "swap",
});

// Fonts from the old site: Mario World Pixel Color (header titles),
// EagleSpCGA (slideshow cards) and Verite 9x14 (home page copy)
const mario = localFont({
  src: "../public/fonts/MarioWorldPixelColor.ttf",
  variable: "--font-mario",
  display: "swap",
});

const eagle = localFont({
  src: "../public/fonts/EagleSpCGA-Alt2-2y.woff",
  variable: "--font-eagle",
  display: "swap",
});

const verite = localFont({
  src: "../public/fonts/Verite-9x14.woff",
  variable: "--font-verite",
  display: "swap",
});

// Site-wide defaults. Pages set their own title, description, canonical URL
// and Open Graph block through pageMetadata() in lib/seo.ts; the template
// adds the site name to each page's title. The favicon, icons and share image
// come from the files in app/ (favicon.ico, icon.png, apple-icon.png,
// opengraph-image.tsx).
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: "%s | M4cgyver",
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author.name, url: site.url }],
  creator: site.author.name,
  publisher: site.author.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: "/",
    title: site.name,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1b34",
  colorScheme: "dark",
};

import styles from "@/components/main/styles.module.css";
import Slideshow from "@/components/slideshow/Slideshow";
import Window from "@/components/window/Window";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${toshiba.variable} ${mario.variable} ${eagle.variable} ${verite.variable} h-full antialiased`}
    >
      <body className="min-h-full">
      
      <main className={styles.mainWrapper}>
        {/* Grainy noise overlay (sits on top of the image) */}
        <div className={styles.grainOverlay} aria-hidden="true" />

        {/* Container locks the grid to a 4:3 aspect ratio */}
        <div className={styles.gridContainer}>
          <div className={styles.grid}>
             

            {/* Footer — spans the full bottom row */}
            <div className={styles.footer}>
            <Window bodyStyle={{ padding: "12px 18px" }}>
              <div className={styles.footerInner}>
                <div className={styles.footerText}>
                  <p className={styles.footerName}>Logan Rios (M4cgyver) · 2026</p>
                  <p className={styles.footerLicense}>
                    Content released under{" "}
                    <a
                      href="https://creativecommons.org/publicdomain/zero/1.0/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      CC0 1.0
                    </a>
                    . Credit is appreciated.
                  </p>
                </div>
                <nav className={styles.footerLinks} aria-label="Footer">
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the site uses plain <a> links throughout */}
                  <a href="/">Home</a>
                  <a href="/blogs/">Blog</a>
                  <a href="/projects/">Projects</a>
                  <a href="/contact/">Contact</a>
                </nav>
              </div>
            </Window>
            </div>

            {children}
          </div>
        </div>
      </main>
    
      </body>
    </html>
  );
}
