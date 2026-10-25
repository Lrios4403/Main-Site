"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import nextFlexOrder from "@/public/slides/nextjs-flex-order.jpg";
import intelNpu from "@/public/slides/intel-npu.webp";
import nvdecWgpu from "@/public/slides/nvdec-wgpu.webp";
import archives from "@/public/slides/archive-bg.jpg";
import styles from "./Slideshow.module.css";
import mainStyles from "@/components/main/styles.module.css";

type Slide = {
  href: string;
  image: StaticImageData;
  category: string;
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    href: "/blogs/nvdec-with-rust-wgpu",
    image: nvdecWgpu,
    category: "Graphics",
    title: "Video straight to the GPU",
    description: "Decoding MP4 with NVIDIA NVDEC and sampling the frames in Rust's wgpu, with no trip through system memory.",
  },
  {
    href: "/projects/archives",
    image: archives,
    category: "Project",
    title: "Preserving the web",
    description: "Inside Archives, my personal tool for collecting and exploring WARC files.",
  },
  {
    href: "/blogs/nextjs-ordered-table-layout",
    image: nextFlexOrder,
    category: "Development notes",
    title: "A place for everything",
    description: "Making CSS grid areas work across layouts and pages in the Next.js App Router.",
  },
  {
    href: "/blogs/llms-on-an-intel-npu",
    image: intelNpu,
    category: "AI experiments",
    title: "Local AI, different silicon",
    description: "Running Qwen3 8B on an Intel AI Boost NPU, and benchmarking it against the CPU, iGPU and RTX 5080.",
  },
];

// The distance between two cards, and how far the track can scroll
function metrics(list: HTMLUListElement) {
  const first = list.children[0] as HTMLElement | undefined;
  const second = list.children[1] as HTMLElement | undefined;
  const step = first && second ? second.offsetLeft - first.offsetLeft : 0;
  return { step, max: list.scrollWidth - list.clientWidth };
}

export default function Slideshow({ className }: { className?: string }) {
  const track = useRef<HTMLUListElement>(null);
  const trackId = useId();
  const [active, setActive] = useState(0);
  // How many scroll positions the track has: one per slide on a phone (one card
  // across), slides minus visible cards plus one on desktop (three across), and
  // 1 when everything fits, which hides the controls
  const [positions, setPositions] = useState(1);

  // Uses only the ref and state setters, so it never changes
  const syncActive = useCallback(() => {
    const list = track.current;
    if (!list) return;
    const { step, max } = metrics(list);
    const count = step > 0 && max > 1 ? Math.round(max / step) + 1 : 1;
    setPositions(count);
    // At the far end the last position is active even if the snap leaves a fraction
    const index = list.scrollLeft >= max - 1 ? count - 1 : Math.round(list.scrollLeft / (step || 1));
    setActive(Math.max(0, Math.min(count - 1, index)));
  }, []);

  // Recount when the track's size changes (window resize, the phone/desktop layout switch)
  useEffect(() => {
    const list = track.current;
    if (!list) return;
    syncActive();
    const observer = new ResizeObserver(syncActive);
    observer.observe(list);
    return () => observer.disconnect();
  }, [syncActive]);

  function goTo(index: number) {
    const list = track.current;
    const slide = list?.children[index] as HTMLElement | undefined;
    if (!list || !slide) return;
    list.scrollTo({
      left: slide.offsetLeft - (list.children[0] as HTMLElement).offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <section className={[styles.slideshow, mainStyles.gridBackground, className].filter(Boolean).join(" ")} aria-label="Featured projects and writing">
      <div className={styles.header}>
        <h2>From the workshop</h2>
        <span>Projects &amp; field notes</span>
      </div>
      <ul id={trackId} className={styles.track} ref={track} onScroll={syncActive}>
        {slides.map((slide, index) => (
          <li key={slide.href} className={styles.slide}>
            <Link href={slide.href} className={styles.card}>
              <div className={styles.visual}>
                <Image src={slide.image} alt="" className={styles.image} sizes="(max-width: 768px) 92vw, 33vw" />
                <span className={styles.category}>{slide.category}</span>
                <span className={styles.number} aria-hidden="true">0{index + 1}</span>
              </div>
              <div className={styles.caption}>
                <h3 className={styles.title}>{slide.title}</h3>
                <p className={styles.description}>{slide.description}</p>
                <span className={styles.cta}>{slide.category === "Project" ? "Explore project" : "Read the story"}<span aria-hidden="true">↗</span></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {/* Only when the slides don't all fit: one dot per scroll position */}
      {positions > 1 && (
        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous featured item" aria-controls={trackId}>←</button>
          <div className={styles.dots}>
            {slides.slice(0, positions).map((slide, index) => (
              <button key={slide.href} type="button" className={styles.dot} onClick={() => goTo(index)} aria-label={`Show from ${slide.title}`} aria-current={index === active ? "true" : undefined} aria-controls={trackId}><span /></button>
            ))}
          </div>
          <button type="button" className={styles.arrow} onClick={() => goTo(active + 1)} disabled={active >= positions - 1} aria-label="Next featured item" aria-controls={trackId}>→</button>
        </div>
      )}
    </section>
  );
}
