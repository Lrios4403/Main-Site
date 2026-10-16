import type { ReactNode } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import Slideshow from "@/components/slideshow/Slideshow";
import TopNavigation from "@/components/top-navigation/TopNavigation";
import ViewPixel from "@/components/views/ViewPixel";
import styles from "@/components/main/styles.module.css";

type SiteLayoutProps = {
  variant: "home" | "index" | "detail";
  children: ReactNode;
};

/** Server composition only: no wrapper element, pathname switch or extra grid item. */
export default function SiteLayout({ variant, children }: SiteLayoutProps) {
  return <>
    {variant === "home" ? <Slideshow className={styles.slideshow} /> : <TopNavigation />}
    {variant !== "detail" && <Sidebar showNavigation={variant === "home"} />}
    {children}
    {/* Home/index tracking belongs to Sidebar's ViewCounter. Details own their sidebar. */}
    {variant === "detail" && <ViewPixel />}
  </>;
}
