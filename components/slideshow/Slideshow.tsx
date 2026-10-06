"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef, useState } from "react";
import nextFlexOrder from "@/public/slides/nextjs-flex-order.jpg";
import intelNpu from "@/public/slides/intel-npu.webp";
import archives from "@/public/slides/archive-bg.jpg";
import styles from "./Slideshow.module.css";

type Slide = {
  href: string;
  image?: StaticImageData;
  label?: string;
  title: string;
  lines: string[];
  tint: string;
};

// Slideshow cards: projects first, then one per blog post. Keep the blog
// cards in step with the posts array in app/(navigation layout)/blogs/page.tsx.
const slides: Slide[] = [
  {
    href: "/projects/archives/",
    image: archives,
    label: "Project:",
    title: "Archives",
    lines: ["My one-person web archive tool for WARC files."],
    tint: "rgba(154, 235, 146, 0.7)",
  },
  {
    href: "/blogs/nextjs-ordered-table-layout/",
    image: nextFlexOrder,
    label: "Blog:",
    title: "Ordered Layout",
    lines: ["CSS grid areas across layouts and pages in the Next.js App Router"],
    tint: "rgba(214, 183, 157, 0.7)",
  },
  {
    href: "/blogs/llms-on-an-intel-npu/",
    image: intelNpu,
    label: "Blog:",
    title: "LLMs on an NPU",
    lines: ["Qwen3 8B on an Intel AI Boost NPU", "with OpenVINO and Claude Code"],
    tint: "rgba(128, 149, 232, 0.7)",
  },
];

export default function Slideshow({ className }: { className?: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const slide = track.current?.children[index] as HTMLElement | undefined;
    if (!track.current || !slide) return;
    track.current.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    setActive(index);
  }

  return (
    <section
      className={className ? `${styles.slideshow} ${className}` : styles.slideshow}
      aria-label="Featured"
    >
      <ul className={styles.track} ref={track}>
        {slides.map((slide) => (
          <li key={slide.href} className={styles.slide}>
            <a href={slide.href} className={styles.card}>
              {slide.image && (
                <Image
                  src={slide.image}
                  alt=""
                  className={styles.image}
                  sizes="(max-width: 768px) 70vw, 260px"
                />
              )}
              <span className={styles.overlay} style={{ backgroundColor: slide.tint }}>
                <span className={styles.caption}>
                  <span className={styles.title}>
                    {slide.label && <b>{slide.label}</b>} {slide.title}
                  </span>
                  {slide.lines.map((line) => (
                    <span key={line} className={styles.line}>
                      {line}
                    </span>
                  ))}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <div className={styles.dots}>
        {slides.map((slide, index) => (
          <button
            key={slide.href}
            type="button"
            className={index === active ? `${styles.dot} ${styles.dotActive}` : styles.dot}
            onClick={() => goTo(index)}
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === active}
          />
        ))}
      </div>
    </section>
  );
}
