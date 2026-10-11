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
    summary: "Set up a local model server on an Intel NPU, connect it to AI assistants, and work through the configuration details that made this setup useful.",
    relatedSlugs: [],
    sections: [
      {"id": "quick-start", "title": "Quick start", "level": 2},
      {"id": "environment", "title": "Setup details and evidence", "level": 2},
      {"id": "abstract", "title": "Abstract", "level": 2},
      {"id": "backend", "title": "Backend Model Server", "level": 2},
      {"id": "ovms", "title": "OpenVINO Model Server", "level": 3},
      {"id": "intel-npu-drivers", "title": "NPU prerequisites", "level": 4},
      {"id": "install-ovms", "title": "Install OVMS", "level": 4},
      {"id": "download-qwen3", "title": "First download", "level": 4},
      {"id": "launch-qwen3", "title": "Launch Qwen3", "level": 4},
      {"id": "nollama", "title": "NoLlama", "level": 3},
      {"id": "frontend", "title": "Frontend AI Assistants", "level": 2},
      {"id": "openwork", "title": "OpenWork", "level": 3},
      {"id": "claude-code", "title": "Claude Code", "level": 3},
      {"id": "final-setup", "title": "Final Setup", "level": 2},
      {"id": "verify-npu", "title": "Verify inference and NPU", "level": 2},
      {"id": "troubleshooting", "title": "Troubleshooting", "level": 2},
      {"id": "glossary", "title": "Terms used here", "level": 2},
      {"id": "update-notes", "title": "References and updates", "level": 2},
    ],
    resources: [
      {
        label: "Intel NPU Driver",
        href: "https://www.intel.com/content/www/us/en/download/794734/intel-npu-driver-windows.html",
        note: "Windows driver for the AI Boost NPU.",
      },
      {
        label: "OpenVINO Model Server",
        href: "https://github.com/openvinotoolkit/model_server",
        note: "Intel's model server, runs the model on the NPU.",
      },
      {
        label: "Qwen3 8B (OpenVINO)",
        href: "https://huggingface.co/OpenVINO/Qwen3-8B-int4-cw-ov",
        note: "The int4 model the post runs.",
      },
      {
        label: "NoLlama",
        href: "https://github.com/aweussom/NoLlama",
        note: "A lighter alternative to OVMS.",
      },
    ],
    readingMinutes: 12,
    title: "Run Qwen3 on an Intel NPU with OpenVINO",
    description:
      "How I got Qwen3 8B running on my laptop's Intel AI Boost NPU with OpenVINO Model Server (or NoLlama), then hooked it into OpenWork and Claude Code, so small tasks stop burning Claude tokens and the GPU stays free.",
    published: "2026-09-30",
    updated: "2026-10-11",
    tags: ["OpenVINO", "Intel NPU", "Qwen3", "Claude Code"],
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
