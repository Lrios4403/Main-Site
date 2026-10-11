"use client";

import { usePathname } from "next/navigation";
import styles from "@/components/main/styles.module.css";
import top from "./TopNavigation.module.css";
import Link from "next/link";

const links = [
  { href: "/", label: "Homepage" },
  { href: "/contact", label: "Contact / Socials" },
  { href: "/games", label: "Movies / Games" },
  { href: "/blogs", label: "Blog Postings" },
  { href: "/projects", label: "Projects" },
];

// Keep the parent section highlighted on project detail pages and blog posts.
export default function TopNavigation() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  return (
    <nav className={`${styles.topNav} ${top.nav}`} aria-label="Site">
      <ul className={top.list}>
        {links.map((link) => {
          const path = link.href.replace(/\/$/, "") || "/";
          const exact = pathname === path;
          const active = exact || (path !== "/" && pathname.startsWith(`${path}/`));
          return (
          <li key={link.href}>
            <Link href={link.href} data-active={active || undefined} aria-current={exact ? "page" : active ? "location" : undefined}>{link.label}</Link>
          </li>
          );
        })}
      </ul>
    </nav>
  );
}
