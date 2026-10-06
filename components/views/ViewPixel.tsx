import type { Ref } from "react";
import styles from "./Views.module.css";

// Tracking pixel. The tracker reads the page from the request's Referer, so
// it counts the view even without JavaScript.
export default function ViewPixel({ ref }: { ref?: Ref<HTMLImageElement> }) {
  return (
    // A plain <img> on purpose: next/image would route the request through the
    // image optimizer, and the tracker has to see the browser's own request.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src="/api/views/tracker"
      alt=""
      width={1}
      height={1}
      className={styles.pixel}
    />
  );
}
