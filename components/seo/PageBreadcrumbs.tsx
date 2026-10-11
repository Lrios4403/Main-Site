import Link from "next/link";
import { getSitePage, sitePageCrumbs } from "@/lib/site-pages";
import styles from "./PageBreadcrumbs.module.css";

export default function PageBreadcrumbs({ path }: { path: string }) {
  const crumbs = sitePageCrumbs(getSitePage(path));
  if (crumbs.length < 2) return null;
  return <nav aria-label="Breadcrumb" className={styles.breadcrumbs}><ol>
    {crumbs.map((crumb, index) => <li key={crumb.path}>{index === crumbs.length - 1
      ? <span aria-current="page">{crumb.name}</span> : <Link href={crumb.path}>{crumb.name}</Link>}</li>)}
  </ol></nav>;
}
