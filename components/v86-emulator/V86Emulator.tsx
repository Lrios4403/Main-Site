"use client";

import { useEffect, useRef, useState } from "react";
import type { V86 } from "v86";
import styles from "./V86Emulator.module.css";

type V86EmulatorProps = {
  /** URL of the disk image to boot, e.g. "/projects/startupos/system.img" */
  disk: string;
  /** Which drive the image is attached as: a floppy (fda) or a hard disk (hda) */
  drive?: "fda" | "hda";
  /** Guest RAM in MiB */
  memoryMb?: number;
  /** Video RAM in MiB */
  vgaMemoryMb?: number;
};

declare global {
  interface Window {
    V86?: typeof V86;
  }
}

let v86Script: Promise<typeof V86> | null = null;

// Loads v86's prebuilt browser script once and returns its V86 class.
// Importing the npm package instead doesn't work: Next gives bundled code a
// `process` shim, so v86 takes its Node.js path and calls setImmediate,
// which browsers don't have.
function loadV86(): Promise<typeof V86> {
  v86Script ??= new Promise((resolve, reject) => {
    if (window.V86) return resolve(window.V86);
    const script = document.createElement("script");
    script.src = "/v86/libv86.js";
    script.async = true;
    script.onload = () =>
      window.V86
        ? resolve(window.V86)
        : reject(new Error("The emulator loaded, but V86 is missing."));
    script.onerror = () => {
      v86Script = null;
      reject(new Error("Couldn't load the emulator."));
    };
    document.head.appendChild(script);
  });
  return v86Script;
}

// A PC emulator (v86) that boots a disk image in the browser. The runtime
// files live in public/v86/: libv86.js and v86.wasm are copied from
// node_modules/v86/build and must match the installed v86 version (it's
// pinned in package.json); the BIOS images come from v86's repo.
export default function V86Emulator({
  disk,
  drive = "fda",
  memoryMb = 32,
  vgaMemoryMb = 4,
}: V86EmulatorProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const emulatorRef = useRef<V86 | null>(null);

  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    let disposed = false;
    let emulator: V86 | null = null;

    loadV86()
      .then((V86) => {
        if (disposed) return;

        emulator = new V86({
          wasm_path: "/v86/v86.wasm",
          memory_size: memoryMb * 1024 * 1024,
          vga_memory_size: vgaMemoryMb * 1024 * 1024,
          screen: { container: screen },
          bios: { url: "/v86/seabios.bin" },
          vga_bios: { url: "/v86/vgabios.bin" },
          ...(drive === "fda" ? { fda: { url: disk } } : { hda: { url: disk } }),
          autostart: true,
        });
        emulatorRef.current = emulator;

        emulator.add_listener("emulator-ready", () => {
          if (!disposed) setReady(true);
        });
        emulator.add_listener("emulator-started", () => {
          if (!disposed) setRunning(true);
        });
        emulator.add_listener("emulator-stopped", () => {
          if (!disposed) setRunning(false);
        });
      })
      .catch((cause: unknown) => {
        if (disposed) return;
        setError(
          cause instanceof Error ? cause.message : "Unable to start the emulator.",
        );
      });

    return () => {
      disposed = true;
      emulatorRef.current = null;
      void emulator?.destroy();
    };
  }, [disk, drive, memoryMb, vgaMemoryMb]);

  const status = error
    ? error
    : !ready
      ? "Loading emulator…"
      : running
        ? "Running. Click the screen and type."
        : "Paused.";

  return (
    <div className={styles.emulator}>
      <div className={styles.toolbar}>
        <p
          className={error ? `${styles.status} ${styles.error}` : styles.status}
          role={error ? "alert" : "status"}
        >
          {status}
        </p>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.button}
            disabled={!ready || running}
            onClick={() => void emulatorRef.current?.run()}
          >
            Resume
          </button>
          <button
            type="button"
            className={styles.button}
            disabled={!ready || !running}
            onClick={() => void emulatorRef.current?.stop()}
          >
            Pause
          </button>
          <button
            type="button"
            className={styles.button}
            disabled={!ready}
            onClick={() => emulatorRef.current?.restart()}
          >
            Restart
          </button>
        </div>
      </div>

      {/* v86 fills this: the div shows text mode, the canvas graphics mode */}
      <div ref={screenRef} className={styles.screen}>
        <div className={styles.text} />
        <canvas className={styles.canvas} />
      </div>
    </div>
  );
}
