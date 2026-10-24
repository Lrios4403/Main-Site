"use client";
import { useEffect, useState } from "react";
import Window from "@/components/window/Window";
import styles from "./Contents.module.css";
export type Section = { id: string; title: string; level: number };
export default function Contents({sections}: {sections: Section[]}) {
 const [active, setActive] = useState(sections[0]?.id);
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
 // On desktop the window is at most 75% of the viewport (the title bar is ~2rem),
 // and its body scrolls, so the scrollbar stays inside the window's frame
 const desktopBody = {padding:"10px 12px", maxHeight:"calc(75dvh - 2rem)", overflowY:"auto" as const};
 return <nav className={styles.contents} aria-label="On this page"><div className={styles.desktop}><Window collapsible title="Navigation" bodyStyle={desktopBody}>{links}</Window></div><div className={styles.mobile}><Window collapsible defaultOpen={false} title="Navigation" bodyStyle={{padding:"10px 12px"}}>{links}</Window></div></nav>;
}
