"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import nextFlexOrder from "@/public/slides/nextjs-flex-order.jpg";
import intelNpu from "@/public/slides/intel-npu.webp";
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
    href: "/projects/archives/",
    image: archives,
    category: "Project",
    title: "Preserving the web",
    description: "Inside Archives, my personal tool for collecting and exploring WARC files.",
  },
  {
    href: "/blogs/nextjs-ordered-table-layout/",
    image: nextFlexOrder,
    category: "Development notes",
    title: "A place for everything",
    description: "Making CSS grid areas work across layouts and pages in the Next.js App Router.",
  },
  {
    href: "/blogs/llms-on-an-intel-npu/",
    image: intelNpu,
    category: "AI experiments",
    title: "Local AI, different silicon",
    description: "Running Qwen3 8B on an Intel AI Boost NPU with OpenVINO and Claude Code.",
  },
];

export default function Slideshow({ className }: { className?: string }) {
  const track = useRef<HTMLUListElement>(null);
  const trackId = useId();
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const list = track.current;
    const slide = list?.children[index] as HTMLElement | undefined;
    if (!list || !slide) return;
    list.scrollTo({
      left: slide.offsetLeft - (list.children[0] as HTMLElement).offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  function syncActive() {
    const list = track.current;
    if (!list) return;
    const first = list.children[0] as HTMLElement;
    const second = list.children[1] as HTMLElement;
    const step = second.offsetLeft - first.offsetLeft;
    if (step > 0) setActive(Math.max(0, Math.min(slides.length - 1, Math.round(list.scrollLeft / step))));
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
      <div className={styles.controls}>
        <button type="button" className={styles.arrow} onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous featured item" aria-controls={trackId}>←</button>
        <div className={styles.dots}>
          {slides.map((slide, index) => (
            <button key={slide.href} type="button" className={styles.dot} onClick={() => goTo(index)} aria-label={`Show ${slide.title}`} aria-current={index === active ? "true" : undefined} aria-controls={trackId}><span /></button>
          ))}
        </div>
        <button type="button" className={styles.arrow} onClick={() => goTo(active + 1)} disabled={active === slides.length - 1} aria-label="Next featured item" aria-controls={trackId}>→</button>
      </div>
    </section>
  );
}
