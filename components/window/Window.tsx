import type { CSSProperties, ReactNode } from "react";
import styles from "./Window.module.css";

type WindowProps = {
  children: ReactNode;
  title?: ReactNode;
  id?: string;
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export default function Window({
  children,
  title,
  id,
  className,
  style,
  bodyStyle,
  collapsible = false,
  defaultOpen = true,
}: WindowProps) {
  if (collapsible && title != null) {
    return (
      <details id={id} open={defaultOpen} className={[styles.window, styles.collapsible, className].filter(Boolean).join(" ")} style={style}>
        <summary className={styles.titleBar}>
          <span className={styles.toggle} aria-hidden="true">&gt;</span>
          <span className={styles.titleText}>{title}</span>
        </summary>
        <div className={styles.body} style={bodyStyle}>{children}</div>
      </details>
    );
  }
  return (
    <div
      id={id}
      className={className ? `${styles.window} ${className}` : styles.window}
      style={style}
    >
      {title != null && (
        <div className={styles.titleBar}>
          <span className={styles.titleText}>{title}</span>
        </div>
      )}
      <div className={styles.body} style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}
