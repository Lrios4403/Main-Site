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
import contact from "./page.module.css";

const info = getSitePage("/contact");
export const metadata: Metadata = sitePageMetadata(info);

type Link = {
  label: string;
  value: string;
  href: string;
  icon: string;
};

// Contact methods: email first, then socials.
const links: Link[] = [
  {
    label: "Email",
    value: "lrios4403@outlook.com",
    href: "mailto:lrios4403@outlook.com",
    icon: "@",
  },
  {
    label: "Fediverse (Pleroma)",
    value: "fed.m4cgyver.net/users/m4c",
    href: "http://fed.m4cgyver.net/users/m4c",
    icon: "⁂",
  },
];

export default function Contact() {
  return (
    <SiteLayout variant="index">
      <JsonLd data={sitePageJsonLd(info)} />
      <PageHeader title="Contact and Socials.">
        Heres my contact infomation and my socials. If you need or want to
        reach out for whatever these are the easiest methods!
      </PageHeader>

      <Window title="Socials" className={styles.contentArea}>
        <PageBreadcrumbs path={info.path} />
        <p className={contact.intro}>
          Fell free to reachout however you want. NOTE: I am extreamly lazy and
          may not check my socials please be pacient.
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
      </Window>
    </SiteLayout>
  );
}
