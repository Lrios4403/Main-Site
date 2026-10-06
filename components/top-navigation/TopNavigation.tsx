import styles from "@/components/main/styles.module.css";
import top from "./TopNavigation.module.css";

const links = [
  { href: "/", label: "Homepage" },
  { href: "/contact/", label: "Contact / Socials" },
  { href: "/games/", label: "Movies / Games" },
  { href: "/blogs/", label: "Blog Postings" },
  { href: "/projects/", label: "Projects" },
];

// The old site's horizontal navigation bar, used on pages whose left column
// holds something else (like a blog post's table of contents)
export default function TopNavigation() {
  return (
    <nav className={`${styles.topNav} ${top.nav}`} aria-label="Site">
      <ul className={top.list}>
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
