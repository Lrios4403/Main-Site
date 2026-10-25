"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "./CodeBlock.module.css";

// The interactive part of a code block: the variant dropdown, Copy and Expand.
// The code arrives as HTML that CodeBlock.tsx highlighted on the server, set
// with dangerouslySetInnerHTML so React doesn't hydrate every token span.
// Keep this file free of highlighting imports: whatever it imports ships to
// the browser.
export type PreparedVariant = { label?: string; note?: ReactNode; html: string; lines: number };

export default function CodeBlockClient({title, label, className, variants, href}: {title: string; label?: string; className?: string; variants: PreparedVariant[]; href?: string}) {
 const [message, setMessage] = useState("Copy");
 const [expanded, setExpanded] = useState(false);
 const [index, setIndex] = useState(0);
 const codeRef = useRef<HTMLDivElement>(null);
 const variant = variants[index];
 const name = variant.label ?? title;
 const long = variant.lines > 24;
 async function copy() {
   // The code as shown, minus the line numbers (the HTML is the only copy of it here)
   const code = codeRef.current?.querySelector("code")?.cloneNode(true) as HTMLElement | undefined;
   code?.querySelectorAll(".ln").forEach((number) => number.remove());
   try { await navigator.clipboard.writeText(code?.textContent ?? ""); setMessage("Copied"); }
   catch { setMessage("Select text to copy"); }
 }
 function choose(next: number) { setIndex(next); setMessage("Copy"); setExpanded(false); }
 return <div className={[styles.block, className].filter(Boolean).join(" ")}>
   <div className={styles.toolbar}>
     {variants.length > 1
       ? <label className={styles.picker}>{label && <span>{label}</span>}
           <select value={index} onChange={(event) => choose(Number(event.target.value))} aria-label={label ? `${label}: choose a version` : "Choose a version"}>
             {variants.map((item, i) => <option key={item.label ?? i} value={i}>{item.label}</option>)}
           </select>
         </label>
       : href
         ? <a className={styles.source} href={href} target="_blank" rel="noopener noreferrer" title="View these lines on GitHub">{name}</a>
         : <span>{name}</span>}
     <button type="button" onClick={copy} aria-live="polite">{message}</button>
   </div>
   {variant.note && <p className={styles.note}>{variant.note}</p>}
   {/* translate="no": page translation would otherwise rewrite comments and strings, on screen and in what Copy reads */}
   <div ref={codeRef} className={styles.code} data-collapsed={long && !expanded || undefined} tabIndex={0} aria-label={name}
     translate="no" dangerouslySetInnerHTML={{ __html: variant.html }} />
   {long && <button type="button" className={styles.expand} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Collapse example" : `Expand full example (${variant.lines} lines)`}</button>}
 </div>;
}
