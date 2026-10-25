"use client";
import { useEffect, useRef, useState } from "react";
import Window from "@/components/window/Window";
import styles from "./Contents.module.css";
export type Section = { id: string; title: string; level: number };
export default function Contents({sections}: {sections: Section[]}) {
 const [active, setActive] = useState(sections[0]?.id);
 // The desktop window shows every entry, wrapped, with no scrolling of its own.
 // It sticks while the page scrolls only when it fits in the viewport; a
 // taller one would pin at the top with its bottom cut off, so that one
 // scrolls with the page instead.
 const desktop = useRef<HTMLDivElement>(null);
 const [fits, setFits] = useState(false);
 useEffect(() => {
   const measure = () => { const el = desktop.current; if (el) setFits(el.offsetHeight + 32 <= window.innerHeight); };
   measure();
   const observer = new ResizeObserver(measure);
   if (desktop.current) observer.observe(desktop.current);
   window.addEventListener("resize", measure);
   return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
 }, []);
 useEffect(() => {
   let frame = 0;
   const update = () => {
     cancelAnimationFrame(frame);
     frame = requestAnimationFrame(() => {
       let current = sections[0]?.id;
       for (const section of sections) {
         const el = document.getElementById(section.id);
         if (el && el.getBoundingClientRect().top <= 140) current = section.id;
       }
       setActive(current);
     });
   };
   update(); window.addEventListener("scroll", update, {passive: true});
   return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); };
 }, [sections]);
 const links = <ul>{sections.map(section => <li key={section.id} data-nested={section.level > 2 || undefined}><a href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined}>{section.title}</a></li>)}</ul>;
 return <nav className={styles.contents} aria-label="On this page"><div ref={desktop} className={styles.desktop} data-fits={fits || undefined}><Window collapsible title="Navigation" bodyStyle={{padding:"10px 12px"}}>{links}</Window></div><div className={styles.mobile}><Window collapsible defaultOpen={false} title="Navigation" bodyStyle={{padding:"10px 12px"}}>{links}</Window></div></nav>;
}
