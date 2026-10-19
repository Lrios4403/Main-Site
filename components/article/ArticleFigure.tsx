import Image from "next/image";
import type { ArticleMedia } from "@/lib/blog/types";
import styles from "./ArticleShell.module.css";

export default function ArticleFigure({ media }: { media: ArticleMedia }) {
  return <figure className={styles.figure}>
    <Image src={media.src} width={media.width} height={media.height} alt={media.alt} sizes="(max-width: 768px) 90vw, 800px"
      // Covers sit at the top of the article, usually the largest paint
      loading="eager" fetchPriority="high" />
    <figcaption>{media.caption}{media.credit && <> — <a href={media.credit.url} rel="noopener noreferrer">{media.credit.name}</a></>}</figcaption>
  </figure>;
}
