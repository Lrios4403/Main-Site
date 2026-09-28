import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Main Website",
  description: "Main website home page",
};

import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${toshiba.variable} h-full antialiased`}
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
            <Window bodyStyle={{ padding: "12px 16px" }}>
              <p className={styles.footerText}>
                © 2026 My Site. All rights reserved.
              </p>
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
