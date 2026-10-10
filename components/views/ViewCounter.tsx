"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
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
  const [retry, setRetry] = useState(0);
  // Remount the table on navigation so a previous page's counts cannot leak.
  return (
    <>
      {track && <ViewPixel ref={pixel} attempt={retry} />}
      <Counter key={`${pathname}:${track}`} pathname={pathname} track={track}
        pixel={pixel} retry={retry} onRetry={() => setRetry((value) => value + 1)} />
    </>
  );
}

function Counter({ pathname, track, pixel, retry, onRetry }: {
  pathname: string;
  track: boolean;
  pixel: RefObject<HTMLImageElement | null>;
  retry: number;
  onRetry: () => void;
}) {
  const [stats, setStats] = useState<ViewStats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [trackingFailed, setTrackingFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let pixelTimer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | undefined;
    const load = async (attempt = 0) => {
      request = new AbortController();
      const timeout = setTimeout(() => request?.abort(), 5000);
      try {
        const response = await fetch(`/api/views?path=${encodeURIComponent(pathname)}`, {
          cache: "no-store", signal: request.signal,
        });
        if (!response.ok) throw new Error("Counts unavailable");
        const data = await response.json();
        if (!validStats(data)) throw new Error("Invalid counts response");
        if (!cancelled) {
          setStats(data);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          if (attempt < 2) {
            retryTimer = setTimeout(() => void load(attempt + 1), 500 * (attempt + 1));
          } else {
            setStatus("error");
          }
        }
      } finally {
        clearTimeout(timeout);
      }
    };
    const start = (failed = false) => {
      if (started || cancelled) return;
      started = true;
      clearTimeout(pixelTimer);
      setTrackingFailed(failed);
      void load();
    };
    const loaded = () => start();
    const failed = () => start(true);
    const img = pixel.current;
    if (!track || !img) {
      // Scheduling also keeps the effect's initial state updates asynchronous.
      pixelTimer = setTimeout(loaded, 0);
    } else if (img.complete && img.getAttribute("src")) {
      pixelTimer = setTimeout(() => start(img.naturalWidth === 0), 0);
    } else {
      img.addEventListener("load", loaded, { once: true });
      img.addEventListener("error", failed, { once: true });
      pixelTimer = setTimeout(failed, 8000);
    }
    return () => {
      cancelled = true;
      request?.abort();
      clearTimeout(retryTimer);
      clearTimeout(pixelTimer);
      img?.removeEventListener("load", loaded);
      img?.removeEventListener("error", failed);
    };
  }, [pathname, track, retry, pixel]);

  const retryLoad = () => {
    setStats(null);
    setStatus("loading");
    setTrackingFailed(false);
    onRetry();
  };
  const display = (value: number | undefined) => status === "error" ? "—" : format(value);

  return (
    <>
      <table className={styles.table} aria-label="Unique viewers" aria-busy={status === "loading"}>
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
            <td>{display(stats?.page.today)}</td>
            <td>{display(stats?.page.total)}</td>
          </tr>
          <tr>
            <th scope="row">Site</th>
            <td>{display(stats?.site.today)}</td>
            <td>{display(stats?.site.total)}</td>
          </tr>
        </tbody>
      </table>
      <div className={styles.status} role="status" aria-live="polite">
        {status === "loading" && "Loading views…"}
        {status === "error" && <>Views unavailable. <button onClick={retryLoad}>Retry</button></>}
        {status === "ready" && trackingFailed && <>Visit couldn’t be recorded. <button onClick={retryLoad}>Retry</button></>}
      </div>
    </>
  );
}

function validStats(data: unknown): data is ViewStats {
  if (!data || typeof data !== "object") return false;
  const stats = data as Record<string, unknown>;
  return [stats.page, stats.site].every((counts) => {
    if (!counts || typeof counts !== "object") return false;
    const values = counts as Record<string, unknown>;
    return [values.today, values.total].every((value) =>
      typeof value === "number" && Number.isSafeInteger(value) && value >= 0);
  });
}
