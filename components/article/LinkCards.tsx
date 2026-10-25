import Image from "next/image";
import type { ArticleResource } from "@/lib/blog/types";
import { faviconFor, hostOf } from "@/lib/favicons";
import styles from "./LinkCards.module.css";

// External references as a grid of cards: the site's favicon (fetched once by
// scripts/favicons.ts, served locally), the label, the note and the host.
export default function LinkCards({ items, label = "References" }: { items: ArticleResource[]; label?: string }) {
  return (
    <ul className={styles.cards} aria-label={label}>
      {items.map((item) => {
        const icon = faviconFor(item.href);
        return (
          <li key={item.href}>
            <a className={styles.card} href={item.href} target="_blank" rel="noopener noreferrer">
              {icon
                ? <Image className={styles.icon} src={icon} alt="" width={20} height={20} />
                : <span className={styles.iconFallback} aria-hidden="true" />}
              <span className={styles.text}>
                <span className={styles.label}>{item.label}</span>
                {item.note && <span className={styles.note}>{item.note}</span>}
                <span className={styles.host}>{hostOf(item.href)}</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
