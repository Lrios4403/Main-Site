"use client";

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

export const CodeBlock = ({
  code,
  language,
  className,
}: {
  code: string;
  language: string;
  className?: string;
}) => (
  <SyntaxHighlighter
    className={className}
    language={language}
    style={dracula}
    showLineNumbers={true}
  >
    {code.trim()}
  </SyntaxHighlighter>
);
