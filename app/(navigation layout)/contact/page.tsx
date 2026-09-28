import type { Metadata } from "next";
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";
import contact from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact / Socials",
  description: "Ways to get in touch with Logan Rios (M4cgyver).",
};

type Link = {
  label: string;
  value: string;
  href: string;
  icon: string;
  placeholder?: boolean;
};

// Contact methods. The email is live; swap the "#" hrefs for real profiles.
const links: Link[] = [
  {
    label: "Email",
    value: "lrios@2911tech.com",
    href: "mailto:lrios@2911tech.com",
    icon: "@",
  },
  {
    label: "GitHub",
    value: "github.com/…",
    href: "#",
    icon: "{ }",
    placeholder: true,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/…",
    href: "#",
    icon: "in",
    placeholder: true,
  },
  {
    label: "Discord",
    value: "@…",
    href: "#",
    icon: "*",
    placeholder: true,
  },
];

export default function Contact() {
  const hasPlaceholders = links.some((l) => l.placeholder);

  return (
    <>
      <Window
        title="Title"
        className={styles.header}
        bodyStyle={{ padding: "12px 16px 14px" }}
      >
        <h2 className={styles.brand}>Contact / Socials</h2>
        <p className={styles.headerWelcome}>
          Want to reach out, collaborate, or just say hi? Here&apos;s where to
          find me.
        </p>
      </Window>

      <Window title="Contact / Socials" className={styles.contentArea}>
        <p className={contact.intro}>
          The fastest way to reach me is by email, but I&apos;m around on a few
          other places too. Feel free to drop a line about projects, retro tech,
          or games.
        </p>

        <ul className={contact.grid}>
          {links.map((link) => (
            <li key={link.label}>
              <a
                className={contact.card}
                href={link.href}
                {...(link.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer noopener" }
                  : {})}
              >
                <span className={contact.icon} aria-hidden="true">
                  {link.icon}
                </span>
                <span className={contact.cardBody}>
                  <span className={contact.cardLabel}>{link.label}</span>
                  <span className={contact.cardValue}>{link.value}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        {hasPlaceholders && (
          <p className={contact.note}>
            → Some links above are placeholders (marked with …). Swap the
            &quot;#&quot; hrefs in <code>app/(navigation layout)/contact/page.tsx</code>{" "}
            for your real profiles.
          </p>
        )}
      </Window>
    </>
  );
}
