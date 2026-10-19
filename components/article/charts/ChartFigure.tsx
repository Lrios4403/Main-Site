import type { ReactNode } from "react";
import ArticleTable from "@/components/article/ArticleTable";
import { CodeBlock } from "@/components/article/CodeBlock";
import { type LegendItem, SERIES_LABEL } from "./series";
import styles from "./Charts.module.css";

// The code that produced a chart: verbatim excerpts from a repo at a fixed commit,
// so the line numbers and GitHub links keep pointing at the same lines.
export type BenchCode = {
  repo: string;
  commit: string;
  // Commands that rerun the benchmark, from the repo root
  run: string[];
  snippets: { file: string; start: number; end: number; note: string; code: string }[];
};

const LANGUAGE: Record<string, string> = { py: "python", ps1: "powershell" };

type Props = {
  title: string;
  subtitle?: string;
  // Two or more series get a legend; a single series is named by the title
  legend?: LegendItem[];
  caption?: ReactNode;
  // The chart's numbers as a table, so no value is only reachable by hovering
  // (only diagrams, which carry no data, leave it out)
  table?: { columns: string[]; rows: ReactNode[][] };
  code?: BenchCode;
  children: ReactNode;
};

// A chart card: title, legend, the SVG, a caption, then collapsible data and code.
export default function ChartFigure({ title, subtitle, legend, caption, table, code, children }: Props) {
  return (
    <figure className={styles.chart}>
      <figcaption>
        <p className={styles.title}>{title}</p>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </figcaption>
      {legend && legend.length > 1 && (
        <ul className={styles.legend}>
          {legend.map((item) => (
            <li key={item.series + (item.label ?? "")}>
              <span className={item.kind === "line" ? styles.lineKey : styles.swatch} data-s={item.series} aria-hidden="true" />
              {item.label ?? SERIES_LABEL[item.series]}
            </li>
          ))}
        </ul>
      )}
      {children}
      {caption && <p className={styles.caption}>{caption}</p>}
      {table && (
        <details className={styles.data}>
          <summary>Show the numbers</summary>
          <ArticleTable caption={title} columns={table.columns} rows={table.rows} />
        </details>
      )}
      {code && (
        <details className={styles.data}>
          <summary>Show the benchmark code</summary>
          <p className={styles.codeNote}>
            From <a href={code.repo} target="_blank" rel="noopener noreferrer">{code.repo.replace("https://github.com/", "")}</a>{" "}
            at commit <code>{code.commit.slice(0, 7)}</code>. To rerun it from the repo root (setup is in its README):
          </p>
          <CodeBlock kind="command" label="Rerun" code={code.run.join("\n")} />
          {code.snippets.map((snippet) => (
            <div key={`${snippet.file}:${snippet.start}`}>
              <p className={styles.codeNote}>
                <a href={`${code.repo}/blob/${code.commit}/${snippet.file}#L${snippet.start}-L${snippet.end}`}
                  target="_blank" rel="noopener noreferrer">
                  {snippet.file}, lines {snippet.start}–{snippet.end}
                </a>
                : {snippet.note}
              </p>
              <CodeBlock code={snippet.code} startLine={snippet.start} label={snippet.file}
                language={LANGUAGE[snippet.file.split(".").pop() ?? ""] ?? "text"} />
            </div>
          ))}
        </details>
      )}
    </figure>
  );
}
