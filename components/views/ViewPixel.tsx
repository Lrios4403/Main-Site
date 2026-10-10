"use client";

import { usePathname } from "next/navigation";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import styles from "./Views.module.css";

// Tracking pixel. The tracker reads the page from the request's Referer, so
// it counts the view even without JavaScript.
export default function ViewPixel({ ref, attempt = 0 }: {
  ref?: Ref<HTMLImageElement>;
  attempt?: number;
}) {
  const pathname = usePathname();
  const image = useRef<HTMLImageElement>(null);
  const visit = useRef<{ path: string; id: string; source: string } | null>(null);
  useImperativeHandle(ref, () => image.current!, []);
  useEffect(() => {
    if (!visit.current || visit.current.path !== pathname) {
      const source = visit.current
        ? new URL(visit.current.path, window.location.origin).href
        : document.referrer;
      let referrer = "";
      try {
        if (source) {
          const url = new URL(source);
          referrer = url.origin + url.pathname;
        }
      } catch {
        // Ignore malformed referrers.
      }
      visit.current = { path: pathname, id: crypto.randomUUID(), source: referrer };
    }
    const params = new URLSearchParams({
      path: pathname, id: visit.current.id, source: visit.current.source,
      attempt: String(attempt),
    });
    if (image.current) image.current.src = `/api/views/tracker?${params}`;
  }, [pathname, attempt]);

  return (
    <>
      {/* Use the browser's own image request, not next/image's optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={image} alt="" width={1} height={1} className={styles.pixel} />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/api/views/tracker" alt="" width={1} height={1} className={styles.pixel} />
      </noscript>
    </>
  );
}
