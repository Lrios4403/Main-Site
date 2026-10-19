import type { ReactNode } from "react";
import styles from "./FileTree.module.css";

// A project's files as a tree: folders are native <details> (collapsible, no
// JavaScript), files can link to where the article explains them, and an
// optional tone marks who renders a grid area (matching GridAreasDiagram's
// "layout" and "page" colours). It's a nested list, so it reads as one.

export type TreeTone = "layout" | "page";
export type TreeNode = {
  name: string;
  note?: string;
  // In-page link to the section that explains this file
  href?: string;
  tone?: TreeTone;
  children?: TreeNode[];
};

function Nodes({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul className={styles.list}>
      {nodes.map((node) => (
        <li key={node.name} className={styles.item}>
          {node.children ? (
            <details open className={styles.folder}>
              <summary className={styles.folderName}>{node.name}/</summary>
              <Nodes nodes={node.children} />
            </details>
          ) : (
            <div className={styles.file}>
              <span className={styles.name} data-tone={node.tone}>
                {node.href ? <a href={node.href}>{node.name}</a> : node.name}
              </span>
              {node.note && <span className={styles.note}>{node.note}</span>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function FileTree({ title, nodes, legend, children }: {
  title: string;
  nodes: TreeNode[];
  legend?: Record<TreeTone, string>;
  children?: ReactNode;
}) {
  return (
    <figure className={styles.tree} aria-label={title}>
      <figcaption className={styles.toolbar}>{title}</figcaption>
      <div className={styles.body}>
        <Nodes nodes={nodes} />
        {legend && (
          <p className={styles.legend}>
            <span data-tone="layout">{legend.layout}</span>
            <span data-tone="page">{legend.page}</span>
          </p>
        )}
        {children}
      </div>
    </figure>
  );
}
