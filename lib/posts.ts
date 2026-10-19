import "server-only";
import { postPath } from "@/lib/blog/urls";
import type { PostRecord } from "@/lib/blog/types";
export type Post = PostRecord;
export { postPath } from "@/lib/blog/urls";
export { formatDate } from "@/lib/blog/dates";

// Single explicit registry. Bodies remain in their existing static TSX routes.
export const postRegistry: Post[] = [
  {
    slug: "nextjs-ordered-table-layout",
    path: postPath("nextjs-ordered-table-layout"),
    status: "published",
    authorId: "logan-rios",
    summary: "Define a shared CSS grid, place components from different layouts into named areas, and try the approach in a small Next.js example.",
    relatedSlugs: [],
    sections: [
      {"id": "abstract", "title": "Abstract", "level": 2},
      {"id": "basic-example", "title": "Basic Example", "level": 2},
      {"id": "implementing-in-nextjs", "title": "Implementing in Next.js", "level": 2},
      {"id": "adding-more-to-the-side", "title": "Adding More to the Side", "level": 3},
      {"id": "the-grid-container", "title": "The Grid Container", "level": 3},
      {"id": "global-styles", "title": "Global Styles", "level": 3},
      {"id": "the-root-layout", "title": "The Root Layout", "level": 3},
      {"id": "the-home-page", "title": "The Home Page", "level": 3},
      {"id": "the-page-component", "title": "The Page Component", "level": 3},
      {"id": "the-about-page", "title": "The About Page", "level": 3},
      {"id": "the-contact-page", "title": "The Contact Page", "level": 3},
      {"id": "running-the-project", "title": "Running the Project", "level": 3},
    ],
    resources: [
      {
        label: "Example Project",
        href: "https://github.com/Lrios4403/NextJS-Ordered-Table-Layout",
        note: "The full Next.js project on GitHub.",
      },
      {
        label: "Live Demo",
        href: "https://githubbox.com/Lrios4403/NextJS-Ordered-Table-Layout",
        note: "The project running on CodeSandbox.",
      },
      {
        label: "Basic HTML Example",
        href: "https://codesandbox.io/p/sandbox/rfz7jw",
        note: "The plain HTML version.",
      },
      {
        label: "grid-template-areas",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-areas",
        note: "MDN reference.",
      },
      {
        label: "Next.js Layouts and Pages",
        href: "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
        note: "Next.js docs.",
      },
    ],
    readingMinutes: 9,
    title: "NextJS Ordered Table Layout",
    description:
      "Using CSS grid areas to arrange components across layouts and pages in the Next.js App Router, so widgets from different files always land in the same spot. Includes a live HTML demo and a full example project.",
    published: "2026-10-06",
    updated: "2026-10-10",
    tags: ["NextJS", "CSS Grid", "Layouts"],
  },
  {
    slug: "llms-on-an-intel-npu",
    path: postPath("llms-on-an-intel-npu"),
    status: "published",
    authorId: "logan-rios",
    summary: "Qwen3 8B runs on the NPU at about 10 tokens/s and leaves the CPU free, which suits background jobs. Every answer waits about 4.5 seconds to start, so for interactive agents the Intel iGPU is the better choice.",
    relatedSlugs: [],
    sections: [
      {"id": "tldr", "title": "The short version", "level": 2},
      {"id": "setup", "title": "Part 1: Get it running", "level": 2},
      {"id": "what-you-need", "title": "What you need", "level": 3},
      {"id": "install-ovms", "title": "Install OVMS", "level": 3},
      {"id": "download-qwen3", "title": "Download the model", "level": 3},
      {"id": "launch-qwen3", "title": "Start the server", "level": 3},
      {"id": "verify-npu", "title": "Check it works", "level": 3},
      {"id": "frontend", "title": "Part 2: Connect an assistant", "level": 2},
      {"id": "openwork", "title": "OpenWork", "level": 3},
      {"id": "claude-code", "title": "Claude Code", "level": 3},
      {"id": "nollama", "title": "NoLlama", "level": 3},
      {"id": "benchmarks", "title": "Part 3: Benchmarks", "level": 2},
      {"id": "bench-method", "title": "How I tested", "level": 3},
      {"id": "bench-speed", "title": "Generation speed", "level": 3},
      {"id": "bench-latency", "title": "Time to first token", "level": 3},
      {"id": "bench-caching", "title": "Prompt caching", "level": 3},
      {"id": "bench-load", "title": "Next to other work", "level": 3},
      {"id": "bench-memory", "title": "Memory", "level": 3},
      {"id": "bench-agents", "title": "Agent workloads", "level": 3},
      {"id": "bench-power", "title": "Power and heat", "level": 3},
      {"id": "bench-models", "title": "Which models run", "level": 3},
      {"id": "bench-article", "title": "Another NPU guide, checked", "level": 3},
      {"id": "verdict", "title": "Verdict", "level": 2},
      {"id": "troubleshooting", "title": "Troubleshooting", "level": 2},
      {"id": "glossary", "title": "Terms", "level": 2},
      {"id": "update-notes", "title": "References and updates", "level": 2},
    ],
    resources: [
      {
        label: "Benchmark scripts and data",
        href: "https://github.com/Lrios4403/Intel-Npu-Benchmarks",
        note: "Every script, raw result and resource log behind the charts.",
      },
      {
        label: "Intel NPU Driver",
        href: "https://www.intel.com/content/www/us/en/download/794734/intel-npu-driver-windows.html",
        note: "Windows driver for the AI Boost NPU.",
      },
      {
        label: "OpenVINO Model Server",
        href: "https://github.com/openvinotoolkit/model_server/releases",
        note: "Intel's model server; runs the model on the NPU.",
      },
      {
        label: "Qwen3 8B (OpenVINO, cw)",
        href: "https://huggingface.co/OpenVINO/Qwen3-8B-int4-cw-ov",
        note: "The channel-wise int4 model the post runs.",
      },
      {
        label: "NoLlama",
        href: "https://github.com/aweussom/NoLlama",
        note: "A lighter alternative to OVMS.",
      },
      {
        label: "Trevisan's NPU guide (Medium)",
        href: "https://medium.com/@trevisan3008/how-to-use-your-intel-npu-to-run-local-llms-a8d17f835f37",
        note: "Another NPU setup, tested in the benchmarks.",
      },
    ],
    readingMinutes: 16,
    // Rendered by scripts/covers/llms-on-an-intel-npu.tsx; the share image only
    cover: {
      visible: false,
      src: "/covers/llms-on-an-intel-npu.jpg",
      width: 1200,
      height: 630,
      alt: "Bar chart of Qwen3 8B generation speed: NPU 10.0, CPU 9.9, Intel iGPU 10.6 and RTX 5080 103.3 tokens per second.",
      caption: "Qwen3 8B generation speed on each chip in the same laptop, short prompt. The full results are in Part 3.",
    },
    title: "LLMs on an Intel NPU: Setup and Benchmarks",
    description:
      "How to run Qwen3 8B on a Core Ultra NPU with OpenVINO Model Server, connect OpenWork and Claude Code to it, and how it compares with the CPU, iGPU and RTX 5080.",
    published: "2026-09-30",
    updated: "2026-10-18",
    tags: ["OpenVINO", "Intel NPU", "Qwen3", "Claude Code", "Benchmarks"],
  },
];

export function getPost(slug: string): Post {
  const post = postRegistry.find((p) => p.slug === slug);
  if (!post) throw new Error(`Unknown blog post: ${slug}`);
  return post;
}


export function getPublishedPosts(): Post[] {
  return postRegistry.filter(post => post.status === "published").sort((a, b) => b.published.localeCompare(a.published));
}

// Compatibility export for the index; drafts never enter public listings.
export const posts = getPublishedPosts();
