import type { ReactNode } from "react";
import styles from "@/components/main/styles.module.css";
import PizzaCube from "@/components/pizza-cube/PizzaCube";
import Window from "@/components/window/Window";

type PageHeaderProps = {
  title: ReactNode;
  children: ReactNode;
};

// The "Title" window at the top of the old site's main pages. The body is
// position: relative so the pizza cube can size itself to the body's height,
// and the window doesn't clip, so the cube can swing out past its edge.
export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <Window
      title="Title"
      className={styles.header}
      style={{ overflow: "visible" }}
      bodyStyle={{ position: "relative", padding: "12px 16px 14px" }}
    >
      <div className={styles.headerText}>
        <h2 className={styles.brand}>{title}</h2>
        <p className={styles.headerWelcome}>{children}</p>
      </div>
      <PizzaCube />
    </Window>
  );
}
