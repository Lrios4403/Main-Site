import type { ReactNode } from "react";
import styles from "./ArticleTable.module.css";

export default function ArticleTable({ caption, columns, rows }: {
  caption: string; columns: string[]; rows: ReactNode[][];
}) {
  return <div className={styles.scroll} tabIndex={0} role="region" aria-label={caption}>
    <table className={styles.table}><caption>{caption}</caption>
      <thead><tr>{columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0
        ? <th key={column} scope="row">{cell}</th> : <td key={column}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
