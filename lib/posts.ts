// The site's blog posts, newest first. The blog index, the sitemap, each
// post's metadata and its BlogPosting JSON-LD all read from here. To add a
// post, add an entry and create app/(no navigation layout)/blogs/<slug>/.
//
// Dates are YYYY-MM-DD. `updated` is optional; set it when a post's content
// changes, so the visible "Last updated" date and dateModified stay in sync.

export type Post = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated?: string;
  status?: string;
  tags: string[];
};

export const posts: Post[] = [
  {
    slug: "nextjs-ordered-table-layout",
    title: "NextJS Ordered Table Layout",
    description:
      "Using CSS grid areas to arrange components across layouts and pages in the Next.js App Router, so widgets from different files always land in the same spot. Includes a live HTML demo and a full example project.",
    published: "2026-10-06",
    tags: ["NextJS", "CSS Grid", "Layouts"],
  },
  {
    slug: "llms-on-an-intel-npu",
    title: "LLMs on an Intel NPU",
    description:
      "How I got Qwen3 8B running on my laptop's Intel AI Boost NPU with OpenVINO Model Server (or NoLlama), then hooked it into OpenWork and Claude Code, so small tasks stop burning Claude tokens and the GPU stays free.",
    published: "2026-09-30",
    updated: "2026-10-05",
    tags: ["OpenVINO", "Intel NPU", "Qwen3", "Claude Code"],
  },
];

export function getPost(slug: string): Post {
  const post = posts.find((p) => p.slug === slug);
  if (!post) throw new Error(`Unknown blog post: ${slug}`);
  return post;
}

export const postPath = (slug: string) => `/blogs/${slug}`;

// "2026-09-30" -> "September 30, 2026". Formatted in UTC so the day can't
// shift with the server's time zone.
export function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
