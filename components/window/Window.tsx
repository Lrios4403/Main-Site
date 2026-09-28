import type { CSSProperties, ReactNode } from "react";
import styles from "./Window.module.css";

type WindowProps = {
  children: ReactNode;
  title?: ReactNode;
  id?: string;
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
};

export default function Window({
  children,
  title,
  id,
  className,
  style,
  bodyStyle,
}: WindowProps) {
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
