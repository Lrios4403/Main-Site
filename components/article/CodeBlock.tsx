"use client";

import { useState } from "react";
import styles from "./CodeBlock.module.css";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

// PrismLight only highlights languages registered with it, which keeps the
// bundle small. These are the ones this post uses; register more as needed.
// HTML (markup) goes first: CSS hooks into it when registered, which is what
// highlights the CSS inside the HTML example's <style> tag.
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("bash", bash);

export function CodeBlock({code, language = "text", filename, className, kind = "code", label}: {code: string; language?: string; filename?: string; className?: string; kind?: "code" | "command" | "diagram" | "config" | "output"; label?: string}) {
 const [message, setMessage] = useState("Copy");
 const [expanded, setExpanded] = useState(false);
 const text = code.trim();
 const title = filename || label || ({command:"Command", diagram:"Diagram", config:"Configuration", output:"Output", code:language === "text" ? "Example" : language}[kind]);
 const long = text.split("\n").length > 24;
 async function copy() {
   try { await navigator.clipboard.writeText(text); setMessage("Copied"); }
   catch { setMessage("Select text to copy"); }
 }
 return <div className={[styles.block, className].filter(Boolean).join(" ")}>
   <div className={styles.toolbar}><span>{title}</span><button type="button" onClick={copy} aria-live="polite">{message}</button></div>
   <div className={styles.code} data-collapsed={long && !expanded || undefined} tabIndex={0} aria-label={title}>
   {kind === "diagram" || language === "text" ? <pre className={styles.plain}><code>{text}</code></pre> : <SyntaxHighlighter language={language} style={dracula} showLineNumbers={kind === "code" || kind === "config"} customStyle={{margin:0, padding:16, background:"#070f1e", fontSize:13, lineHeight:1.65}}>{text}</SyntaxHighlighter>}
   </div>
   {long && <button type="button" className={styles.expand} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Collapse example" : `Expand full example (${text.split("\n").length} lines)`}</button>}
 </div>;
}
