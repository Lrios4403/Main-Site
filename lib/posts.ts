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
    summary: "One grid container names the page's areas, and each component places itself with grid-area, from whichever layout or page renders it. Next.js adds no wrapper elements, so a page's pieces land straight in the layout's grid.",
    relatedSlugs: [],
    sections: [
      {"id": "tldr", "title": "The short version", "level": 2},
      {"id": "basic-example", "title": "Part 1: Plain HTML", "level": 2},
      {"id": "implementing-in-nextjs", "title": "Part 2: In Next.js", "level": 2},
      {"id": "why-it-works", "title": "Why it works across files", "level": 3},
      {"id": "project-structure", "title": "The project", "level": 3},
      {"id": "the-grid-container", "title": "The grid container", "level": 3},
      {"id": "global-styles", "title": "Global styles", "level": 3},
      {"id": "the-root-layout", "title": "The root layout", "level": 3},
      {"id": "the-home-page", "title": "The home page", "level": 3},
      {"id": "the-page-component", "title": "The page component", "level": 3},
      {"id": "the-about-page", "title": "The about page", "level": 3},
      {"id": "the-contact-page", "title": "The contact page", "level": 3},
      {"id": "adding-more-to-the-side", "title": "Part 3: Adding and moving areas", "level": 2},
      {"id": "why-the-filler", "title": "Why there's a filler", "level": 3},
      {"id": "add-an-area", "title": "Adding an area", "level": 3},
      {"id": "move-an-area", "title": "Moving an area", "level": 3},
      {"id": "caveats", "title": "Things to watch for", "level": 2},
      {"id": "running-the-project", "title": "Run it yourself", "level": 2},
      {"id": "glossary", "title": "Terms", "level": 2},
      {"id": "update-notes", "title": "Updates", "level": 2},
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
    readingMinutes: 10,
    title: "Next.js Layouts with CSS Grid Template Areas",
    description:
      "Place components from different Next.js layouts and pages in fixed spots with CSS grid-template-areas: a plain HTML demo, then a full App Router example.",
    published: "2026-10-06",
    updated: "2026-10-19",
    tags: ["Next.js", "CSS Grid", "Layouts", "App Router"],
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
      {"id": "devices", "title": "Which device is which", "level": 3},
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
    readingMinutes: 18,
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
    updated: "2026-10-19",
    tags: ["OpenVINO", "Intel NPU", "Qwen3", "Claude Code", "Benchmarks"],
  },
  {
    slug: "nvdec-with-rust-wgpu",
    path: postPath("nvdec-with-rust-wgpu"),
    status: "published",
    authorId: "logan-rios",
    summary: "NVDEC decodes the video into GPU memory, a CUDA kernel converts each frame to RGBA inside a shared D3D12 texture, and wgpu wraps that same texture through wgpu-hal, so the decoded pixels never pass through system memory. Windows only, with a blocking wait each frame.",
    relatedSlugs: [],
    sections: [
      {"id": "tldr", "title": "The short version", "level": 2},
      {"id": "pipeline", "title": "Part 1: The pipeline", "level": 2},
      {"id": "containers-and-codecs", "title": "Containers and codecs", "level": 3},
      {"id": "what-nvdec-does", "title": "What NVDEC does", "level": 3},
      {"id": "nv12-and-cuda", "title": "NV12 and CUDA", "level": 3},
      {"id": "why-wgpu-hal", "title": "Why wgpu-hal", "level": 3},
      {"id": "why-a-native-bridge", "title": "Why a C++/CUDA bridge", "level": 3},
      {"id": "setup", "title": "Part 2: Set up the project", "level": 2},
      {"id": "what-you-need", "title": "What you need", "level": 3},
      {"id": "the-project", "title": "The project", "level": 3},
      {"id": "dependencies", "title": "Step 1: Dependencies", "level": 3},
      {"id": "build-script", "title": "Step 2: build.rs", "level": 3},
      {"id": "decoding", "title": "Part 3: Decode on the GPU", "level": 2},
      {"id": "read-packets", "title": "Step 3: Read packets", "level": 3},
      {"id": "pick-the-gpu", "title": "Step 4: Pick the GPU", "level": 3},
      {"id": "parser-and-decoder", "title": "Step 5: Parser and decoder", "level": 3},
      {"id": "map-a-frame", "title": "Step 6: Map a frame", "level": 3},
      {"id": "shared-textures", "title": "Step 7: Shared textures", "level": 3},
      {"id": "into-wgpu", "title": "Part 4: Hand frames to wgpu", "level": 2},
      {"id": "c-abi", "title": "Step 8: A small C ABI", "level": 3},
      {"id": "import-with-wgpu-hal", "title": "Step 9: Import with wgpu-hal", "level": 3},
      {"id": "sample-in-wgsl", "title": "Step 10: Sample in WGSL", "level": 3},
      {"id": "frame-timing", "title": "Step 11: Timing and sync", "level": 3},
      {"id": "run-it", "title": "Part 5: Build and run", "level": 2},
      {"id": "common-errors", "title": "Common errors", "level": 3},
      {"id": "limitations", "title": "Limitations and next steps", "level": 2},
      {"id": "color-accuracy", "title": "Color accuracy", "level": 3},
      {"id": "synchronization", "title": "Synchronization", "level": 3},
      {"id": "audio-and-timing", "title": "Audio and timing", "level": 3},
      {"id": "formats", "title": "HDR and other formats", "level": 3},
      {"id": "wrapping-up", "title": "Wrapping up", "level": 2},
      {"id": "glossary", "title": "Terms", "level": 2},
      {"id": "references", "title": "References and updates", "level": 2},
    ],
    resources: [
      {
        label: "NVDEC programming guide",
        href: "https://docs.nvidia.com/video-technologies/video-codec-sdk/13.1/nvdec-video-decoder-api-prog-guide/index.html",
        note: "NVIDIA's guide to the parser, decoder and mapping (SDK 13.1).",
      },
      {
        label: "NVIDIA Video Codec SDK",
        href: "https://developer.nvidia.com/video-codec-sdk",
        note: "The headers and nvcuvid.lib the bridge builds against.",
      },
      {
        label: "CUDA external resource interop",
        href: "https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__EXTRES__INTEROP.html",
        note: "Importing D3D12 memory and semaphores into CUDA.",
      },
      {
        label: "wgpu 30.0.1 Device",
        href: "https://docs.rs/wgpu/30.0.1/wgpu/struct.Device.html",
        note: "as_hal and create_texture_from_hal, with their safety rules.",
      },
      {
        label: "Media Foundation Source Reader",
        href: "https://learn.microsoft.com/en-us/windows/win32/medfound/processing-media-data-with-the-source-reader",
        note: "Reading compressed samples from an MP4.",
      },
      {
        label: "D3D12 resource states",
        href: "https://learn.microsoft.com/en-us/windows/win32/direct3d12/using-resource-barriers-to-synchronize-resource-states-in-direct3d-12",
        note: "Implicit promotion for simultaneous-access textures.",
      },
      {
        label: "NVIDIA Video SDK samples",
        href: "https://github.com/NVIDIA/video-sdk-samples",
        note: "NVIDIA's fuller decoder examples.",
      },
    ],
    credits: [
      {
        label: "Big Buck Bunny",
        href: "https://peach.blender.org/about/",
        note: "© 2008 Blender Foundation. Frames from it appear in the screenshots.",
      },
      {
        label: "CC BY 3.0",
        href: "https://creativecommons.org/licenses/by/3.0/",
        note: "Big Buck Bunny's license.",
      },
    ],
    readingMinutes: 40,
    cover: {
      src: "/covers/nvdec-with-rust-wgpu.jpg",
      width: 1200,
      height: 630,
      alt: "A cube rendered with wgpu, with Big Buck Bunny playing on its faces: the bunny stands in a meadow under a blue sky on the front face, and the same frame shows on the top and left faces.",
      caption: "The finished demo: NVDEC decodes the video, CUDA converts each frame into a shared D3D12 texture, and wgpu samples it on a spinning cube.",
      credit: { name: "Big Buck Bunny © Blender Foundation, CC BY 3.0", url: "https://peach.blender.org/about/" },
    },
    title: "Hardware-Decoded Video Textures in Rust: NVIDIA NVDEC, CUDA, and wgpu-hal",
    description:
      "Decode MP4 video with NVIDIA NVDEC, convert it with CUDA into a shared D3D12 texture, and sample it in Rust's wgpu through wgpu-hal, with no CPU readback.",
    published: "2026-10-24",
    tags: ["Rust", "wgpu", "NVDEC", "CUDA", "Direct3D 12"],
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
