// Cover and share image for /blogs/llms-on-an-intel-npu (1200x630): the site's
// share-image frame (app/opengraph-image.tsx) with the post title and its
// headline result, generation speed per device. Writes a static JPEG (the
// photo background makes a PNG ~4x larger) that lib/posts.ts lists as the cover.
//
//   bun scripts/covers/llms-on-an-intel-npu.tsx
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

const OUT = "public/covers/llms-on-an-intel-npu.jpg";

// Short-prompt medians from results/2026-10-17 in Lrios4403/Intel-Npu-Benchmarks;
// colors are the post's chart colors (components/article/charts/Charts.module.css)
const BARS = [
  { label: "NPU", value: 10.0, color: "#3987e5" },
  { label: "CPU", value: 9.9, color: "#d95926" },
  { label: "Intel iGPU", value: 10.6, color: "#199e70" },
  { label: "RTX 5080", value: 103.3, color: "#c98500" },
];
const MAX = 110;
const TRACK = 640;

async function main() {
  const [toshiba, background] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Toshiba-TXL1.woff")),
    readFile(join(process.cwd(), "public/main/bgdark.jpeg"), "base64"),
  ]);

  const image = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Toshiba", backgroundColor: "#08101f" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse only renders plain <img> */}
        <img src={`data:image/jpeg;base64,${background}`} alt="" width={1200} height={630}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }} />
        <div style={{
          display: "flex", flexDirection: "column", margin: 40, flexGrow: 1, borderRadius: 16, overflow: "hidden",
          border: "2px solid rgba(130, 180, 255, 0.35)",
          background: "linear-gradient(160deg, rgba(15, 27, 52, 0.92), rgba(8, 15, 33, 0.86))",
          boxShadow: "0 22px 55px rgba(0, 0, 0, 0.5)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", height: 60, padding: "0 26px", color: "#ffffff", fontSize: 30,
            background: "linear-gradient(to right, #2563eb 70%, #22d3ee 100%)",
          }}>
            <span>m4cgyver.net/blogs</span>
            <span style={{ marginLeft: "auto", opacity: 0.8 }}>X</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "30px 56px 0" }}>
            <div style={{
              display: "flex", fontSize: 76, lineHeight: 1.1, color: "rgb(173, 216, 230)",
              textShadow: "rgb(0, 114, 198) -3px 3px 2px, rgb(0, 114, 198) 3px -3px 2px",
            }}>
              LLMs on an Intel NPU
            </div>
            <div style={{ display: "flex", marginTop: 10, fontSize: 34, color: "#a7bacd" }}>
              Setup and benchmarks · Qwen3 8B, tokens per second
            </div>

            <div style={{ display: "flex", flexDirection: "column", marginTop: 40, gap: 20 }}>
              {BARS.map((bar) => (
                <div key={bar.label} style={{ display: "flex", alignItems: "center", fontSize: 32 }}>
                  <div style={{ display: "flex", width: 210, color: "#d3deef" }}>{bar.label}</div>
                  <div style={{
                    display: "flex", width: Math.round((bar.value / MAX) * TRACK), height: 40,
                    borderRadius: "0 6px 6px 0", backgroundColor: bar.color,
                  }} />
                  <div style={{ display: "flex", marginLeft: 16, color: "#eaf6ff" }}>{bar.value.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: "Toshiba", data: toshiba, style: "normal", weight: 400 }] },
  );

  await mkdir("public/covers", { recursive: true });
  const png = Buffer.from(await image.arrayBuffer());
  await writeFile(OUT, await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer());
  console.log(`wrote ${OUT}`);
}

main();
