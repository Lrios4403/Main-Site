import "server-only";
import type { CSSProperties, ReactNode } from "react";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
// PrismLight from its own file: the package's main entry also loads a build
// that registers ~300 languages on the same registry wherever it isn't
// tree-shaken (dev), so an unregistered language would highlight in dev but not
// in production
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import { createStyleObject } from "react-syntax-highlighter/dist/esm/create-element";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import powershell from "react-syntax-highlighter/dist/esm/languages/prism/powershell";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import toml from "react-syntax-highlighter/dist/esm/languages/prism/toml";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import wgsl from "react-syntax-highlighter/dist/esm/languages/prism/wgsl";
import dracula from "react-syntax-highlighter/dist/esm/styles/prism/dracula";
import CodeBlockClient, { type PreparedVariant } from "./CodeBlockClient";
import styles from "./CodeBlock.module.css";

// Code blocks are highlighted here, on the server (at build time for the static
// posts), and reach the browser as finished HTML. Only the controls (dropdown,
// Copy, Expand) are client code, in CodeBlockClient.tsx, so Prism, its
// languages and the theme never ship to the browser. "server-only" turns an
// accidental import from a client file into a build error instead of quietly
// putting the highlighter back in the bundle.

declare module "react-syntax-highlighter/dist/esm/create-element" {
  // The merge react-syntax-highlighter uses for inline styles: the stylesheet
  // entry for each class (and class combination) in order, later ones winning
  export function createStyleObject(classNames: string[], elementStyle: CSSProperties, stylesheet: Record<string, CSSProperties>): CSSProperties;
}

// Windows CMD lines. Prism's batch grammar is for .bat scripts and only colours
// some flags (not --rest_port), so commands get this small one: the command at
// the start of each line (not after a ^ continuation), flags, strings,
// %VARIABLES%, numbers and the ^ / | / & operators. Patterns anchored with ^ or
// a lookbehind are greedy, so Prism matches them against the whole text rather
// than the leftover pieces between earlier tokens (where ^ would match mid-line).
type PrismLike = { languages: Record<string, unknown> };
function cmd(Prism: PrismLike) {
  const variable = { pattern: /%\w+%/, alias: "constant" };
  Prism.languages.cmd = {
    comment: { pattern: /(^|[^^]\r?\n)[ \t]*(?:rem\b|::).*/i, lookbehind: true, greedy: true },
    // \" stays inside the string: that's how CMD passes JSON to curl
    string: { pattern: /"(?:[^"\\\r\n]|\\.)*"/, greedy: true, inside: { variable } },
    command: { pattern: /(^|[^^]\r?\n)[ \t]*[a-z@][\w.@-]*/i, lookbehind: true, greedy: true, alias: "function" },
    variable,
    flag: { pattern: /(^|\s)(?:--?[a-z][\w-]*|\/[a-z]\w*)/i, lookbehind: true, greedy: true, alias: "keyword" },
    number: { pattern: /(^|\s)\d+(?=\s|$)/, lookbehind: true, greedy: true },
    operator: /\^$|[|&<>]/m,
  };
}
cmd.displayName = "cmd";
cmd.aliases = [] as string[];

// PrismLight only highlights languages registered with it. These are the ones
// the site uses; register more as needed. HTML (markup) goes first: CSS hooks
// into it when registered, which is what highlights the CSS inside the HTML
// example's <style> tag.
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("powershell", powershell);
SyntaxHighlighter.registerLanguage("cmd", cmd);
SyntaxHighlighter.registerLanguage("json", json);
// The NVDEC post: Rust, C++ (also the CUDA source), Cargo.toml and WGSL
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("toml", toml);
SyntaxHighlighter.registerLanguage("wgsl", wgsl);

// Each Dracula colour as a short class (CodeBlock.module.css, scoped under .hl),
// instead of a style attribute on every token. Anything else (bold, other
// colours) falls back to an inline style, so the result always matches the theme.
const COLOR_CLASS: Record<string, string> = {
  "#6272a4": "cm", "#ff79c6": "pk", "#bd93f9": "pu", "#50fa7b": "gr",
  "#f1fa8c": "yl", "#8be9fd": "cy", "#ffb86c": "or",
};
// The code element's own colour: tokens in it need no span at all
const BASE_COLOR = "#f8f8f2";
const THEME: Record<string, CSSProperties> = dracula;

type HastNode = { type: string; value?: string | number; properties?: { className?: string[] }; children?: HastNode[] };

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (text: string) => escapeHtml(text).replace(/"/g, "&quot;");
const kebab = (property: string) => property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

// The attribute that gives a token its final look, resolved exactly as the
// inline-style renderer would (same merge, same class order)
function tokenAttr(classNames: string[]): string {
  const entries = Object.entries(createStyleObject(classNames, {}, THEME)).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return "";
  if (entries.length === 1 && entries[0][0] === "color") {
    const color = String(entries[0][1]).toLowerCase();
    if (color === BASE_COLOR) return "";
    if (COLOR_CLASS[color]) return ` class="${COLOR_CLASS[color]}"`;
  }
  return ` style="${escapeAttr(entries.map(([property, value]) => `${kebab(property)}:${value}`).join(";"))}"`;
}

// Token rows to HTML. Neighbouring tokens with the same look share one span,
// so most punctuation and plain text carry no markup.
function rowsToHtml(rows: HastNode[]): string {
  let html = "";
  let open: string | null = null;
  const close = () => {
    if (open !== null) html += "</span>";
    open = null;
  };
  const text = (value: string, attr: string) => {
    if (attr !== (open ?? "")) {
      close();
      if (attr) {
        html += `<span${attr}>`;
        open = attr;
      }
    }
    html += escapeHtml(value);
  };
  const walk = (node: HastNode, classNames: string[]) => {
    if (node.type === "text") return text(String(node.value ?? ""), tokenAttr(classNames));
    const own = node.properties?.className ?? [];
    if (own.includes("linenumber")) {
      close();
      html += `<span class="ln">${escapeHtml(String(node.children?.[0]?.value ?? ""))}</span>`;
      return;
    }
    for (const child of node.children ?? []) walk(child, own.length ? own : classNames);
  };
  for (const row of rows) walk(row, []);
  close();
  return html;
}

type Kind = "code" | "command" | "diagram" | "config" | "output";

function render(code: string, language: string, kind: Kind, startLine: number): string {
  if (kind === "diagram" || language === "text") return `<pre class="${styles.plain}"><code>${escapeHtml(code)}</code></pre>`;
  const lineNumbers = kind === "code" || kind === "config";
  let rows: HastNode[] | undefined;
  // Called as a plain function: the component has no hooks, and its renderer
  // prop hands over the token rows, already split into lines with numbers.
  // This leans on how react-syntax-highlighter 16 works inside, so a version
  // that stops calling the renderer synchronously fails the build here rather
  // than rendering empty code blocks.
  const highlight = SyntaxHighlighter as unknown as (props: SyntaxHighlighterProps) => unknown;
  highlight({
    language, children: code, useInlineStyles: false, showLineNumbers: lineNumbers, startingLineNumber: startLine,
    renderer: (props) => {
      rows = props.rows as HastNode[];
      return null;
    },
  });
  if (!rows) throw new Error("CodeBlock: react-syntax-highlighter did not call its renderer; check the installed version");
  // Line numbers are as wide as the largest one, like the inline renderer's minWidth
  const width = lineNumbers ? ` style="--ln:${String(startLine + code.split("\n").length - 1).length}.25em"` : "";
  return `<pre class="${styles.hl}"${width}><code>${rowsToHtml(rows)}</code></pre>`;
}

// One way of running the same step (a different shell or tool). A block with
// variants shows a dropdown in its toolbar; the first variant is the default.
export type CodeVariant = { label: string; code: string; language?: string; note?: ReactNode };

// href: where the code lives (an excerpt's lines on GitHub); the toolbar's title links there
export function CodeBlock({code = "", variants, language = "text", filename, className, kind = "code", label, startLine = 1, href}: {code?: string; variants?: CodeVariant[]; language?: string; filename?: string; className?: string; kind?: Kind; label?: string; startLine?: number; href?: string}) {
  const list: { label?: string; code: string; language?: string; note?: ReactNode }[] = variants?.length ? variants : [{ code, language }];
  const prepared: PreparedVariant[] = list.map((variant) => {
    // One line ending everywhere: the browser's HTML parser turns \r into \n,
    // and Copy reads the parsed text, so display, line count and Copy agree
    const text = variant.code.replace(/\r\n?/g, "\n").trim();
    return { label: variant.label, note: variant.note, lines: text.split("\n").length, html: render(text, variant.language ?? language, kind, startLine) };
  });
  const lang = list[0].language ?? language;
  const title = filename || label || ({command:"Command", diagram:"Diagram", config:"Configuration", output:"Output", code:lang === "text" ? "Example" : lang}[kind]);
  return <CodeBlockClient title={title} label={label} className={className} variants={prepared} href={href} />;
}
