import type { CSSProperties, ReactNode } from "react";
import styles from "./FileTree.module.css";

// A project's files as a tree: folders are native <details> (collapsible, no
// JavaScript), files can link to where the article explains them, and an
// optional tone marks who renders a grid area (matching GridAreasDiagram's
// "layout" and "page" colours). It's a nested list, so it reads as one.
//
// The notes line up in one column, like the comments in a text tree. Every
// width is in ch of the tree's monospace font (FileTree.module.css): each
// level indents INDENT_CH, the chip takes CHIP_CH, so a file's name box is
// the column width minus its own indent and every note starts at the same x.

export type TreeTone = "layout" | "page";
export type TreeNode = {
  name: string;
  note?: string;
  // In-page link to the section that explains this file
  href?: string;
  tone?: TreeTone;
  children?: TreeNode[];
};

// Must match .list .list (margin-left + padding-left) and .name::before (width + margin-right)
const INDENT_CH = 2.75;
const CHIP_CH = 2.6;
const GAP_CH = 2;

// The widest file, measured from the tree's left edge: indent, chip, name
function columnWidth(nodes: TreeNode[], depth = 0): number {
  return Math.max(0, ...nodes.map((node) => node.children
    ? columnWidth(node.children, depth + 1)
    : depth * INDENT_CH + CHIP_CH + node.name.length));
}

function Nodes({ nodes, depth, column }: { nodes: TreeNode[]; depth: number; column: number }) {
  return (
    <ul className={styles.list}>
      {nodes.map((node) => (
        <li key={node.name} className={styles.item}>
          {node.children ? (
            <details open className={styles.folder}>
              <summary className={styles.folderName}>{node.name}/</summary>
              <Nodes nodes={node.children} depth={depth + 1} column={column} />
            </details>
          ) : (
            <div className={styles.file}>
              <span className={styles.name} data-tone={node.tone}
                style={{ "--w": column - depth * INDENT_CH } as CSSProperties}>
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
  const column = columnWidth(nodes) + GAP_CH;
  return (
    <figure className={styles.tree} aria-label={title}>
      <figcaption className={styles.toolbar}>{title}</figcaption>
      <div className={styles.body}>
        <Nodes nodes={nodes} depth={0} column={column} />
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
