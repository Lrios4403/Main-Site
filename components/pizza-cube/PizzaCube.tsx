"use client";

import Image from "next/image";
import { useEffect } from "react";
import pizza from "@/public/main/pizza.png";
import styles from "./PizzaCube.module.css";

const sides = ["front", "back", "top", "bottom", "right", "left"] as const;

// Shared across mounts. Browser APIs are only called from effects/events.
let context: AudioContext | null = null;
let boomBuffer: AudioBuffer | null = null;
let boomLoading: Promise<AudioBuffer> | null = null;

function getAudioContext(): AudioContext {
  return (context ??= new AudioContext({
    latencyHint: "interactive",
  }));
}

function preloadBoom(): Promise<AudioBuffer> {
  if (boomBuffer) return Promise.resolve(boomBuffer);
  if (boomLoading) return boomLoading;

  const audio = getAudioContext();

  boomLoading = fetch("/sounds/boom.mp3")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load boom: HTTP ${response.status}`);
      }

      return response.arrayBuffer();
    })
    .then((bytes) => audio.decodeAudioData(bytes))
    .then((buffer) => {
      boomBuffer = buffer;
      return buffer;
    })
    .catch((error: unknown) => {
      // Allow a later click to retry a failed load.
      boomLoading = null;
      throw error;
    });

  return boomLoading;
}

function startBoom(audio: AudioContext, buffer: AudioBuffer): void {
  // Source nodes are one-shot; the decoded buffer is reusable.
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  source.onended = () => source.disconnect();
  source.start();
}

function reportAudioError(error: unknown): void {
  console.error("Unable to play boom:", error);
}

function playBoom(): void {
  const audio = getAudioContext();

  // Call directly inside the user gesture, before any promise callbacks.
  if (audio.state !== "running") {
    void audio.resume().catch(reportAudioError);
  }

  if (boomBuffer) {
    // Already decoded: no fetch, decode, or promise wait.
    // If resuming, playback begins once the context is running.
    startBoom(audio, boomBuffer);
    return;
  }

  // Handles a click before preloading finishes.
  void preloadBoom()
    .then((buffer) => startBoom(audio, buffer))
    .catch(reportAudioError);
}

export default function PizzaCube() {
  useEffect(() => {
    void preloadBoom().catch(reportAudioError);
  }, []);

  return (
    <button
      type="button"
      className={styles.button}
      onClick={playBoom}
      aria-label="Spinning pizza cube (plays a sound)"
    >
      <span className={styles.cube} aria-hidden="true">
        {sides.map((side) => (
          <span
            key={side}
            className={`${styles.side} ${styles[side]}`}
          >
            <Image
              src={pizza}
              alt=""
              width={108}
              height={96}
              className={styles.pizza}
            />
          </span>
        ))}
      </span>
    </button>
  );
}