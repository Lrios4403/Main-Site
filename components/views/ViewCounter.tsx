"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ViewStats } from "@/lib/views";
import ViewPixel from "./ViewPixel";
import styles from "./Views.module.css";

function format(n: number | undefined) {
  return n === undefined ? "…" : n.toLocaleString();
}

// The "Views" table: unique viewers today and all-time, for this page and the
// whole site. With `track`, it fires the tracking pixel first and loads the
// counts once the pixel has been recorded.
export default function ViewCounter({ track = true }: { track?: boolean }) {
  const pathname = usePathname();
  const pixel = useRef<HTMLImageElement>(null);
  const [stats, setStats] = useState<ViewStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(`/api/views?path=${encodeURIComponent(pathname)}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: ViewStats | null) => {
          if (!cancelled && data) setStats(data);
        })
        .catch(() => {});
    };

    const img = pixel.current;
    if (!img || img.complete) {
      load();
    } else {
      img.addEventListener("load", load, { once: true });
      img.addEventListener("error", load, { once: true });
    }
    return () => {
      cancelled = true;
      img?.removeEventListener("load", load);
      img?.removeEventListener("error", load);
    };
  }, [pathname]);

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <td />
            <th scope="col">Today</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Page</th>
            <td>{format(stats?.page.today)}</td>
            <td>{format(stats?.page.total)}</td>
          </tr>
          <tr>
            <th scope="row">Site</th>
            <td>{format(stats?.site.today)}</td>
            <td>{format(stats?.site.total)}</td>
          </tr>
        </tbody>
      </table>
      {track && <ViewPixel ref={pixel} />}
    </>
  );
}
