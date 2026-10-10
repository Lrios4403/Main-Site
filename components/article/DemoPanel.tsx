import type { ReactNode } from "react";
import styles from "./Prose.module.css";
export default function DemoPanel({title, href, children}: {title: string; href?: string; children: ReactNode}) {
 return <details className={styles.demo}><summary>{title}</summary>{href && <a href={href} target="_blank" rel="noopener noreferrer">Open in a new tab ↗</a>}{children}</details>;
}
