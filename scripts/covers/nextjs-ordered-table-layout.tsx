// Cover and share image for /blogs/nextjs-ordered-table-layout (1200x630): the
// site's share-image frame with the post title and the project's grid, drawn
// from the same template areas the post's diagrams use (layout areas neutral,
// page areas blue). Writes a static JPEG that lib/posts.ts lists as the cover.
//
//   bun scripts/covers/nextjs-ordered-table-layout.tsx
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

const OUT = "public/covers/nextjs-ordered-table-layout.jpg";

// GridAreasDiagram's tones (components/article/charts/Charts.module.css)
const TONE = {
  layout: { background: "rgba(140, 197, 232, 0.12)", border: "1px solid rgba(140, 197, 232, 0.5)" },
  page: { background: "rgba(57, 135, 229, 0.3)", border: "1px solid #3987e5" },
};

function Cell({ label, sub, tone, height, grow }: { label: string; sub: string; tone: keyof typeof TONE; height?: number; grow?: boolean }) {
  // Satori rejects undefined style values, so height is only set when given
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      ...(height === undefined ? {} : { height }), flexGrow: grow ? 1 : 0, borderRadius: 8, ...TONE[tone],
    }}>
      <div style={{ display: "flex", fontSize: 26, lineHeight: 1, color: "#eaf6ff" }}>{label}</div>
      <div style={{ display: "flex", marginTop: 4, fontSize: 18, lineHeight: 1, color: "#a7bacd" }}>{sub}</div>
    </div>
  );
}

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

          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "22px 56px 0" }}>
            <div style={{
              display: "flex", fontSize: 54, lineHeight: 1.1, color: "rgb(173, 216, 230)",
              textShadow: "rgb(0, 114, 198) -3px 3px 2px, rgb(0, 114, 198) 3px -3px 2px",
            }}>
              Next.js layouts with grid-template-areas
            </div>
            <div style={{ display: "flex", marginTop: 6, fontSize: 28, color: "#a7bacd" }}>
              One grid, filled by the layout and each page
            </div>

            {/* The project's grid: the left column stacks sidebar, stats and filler
                beside one tall content cell, with the header and footer across both.
                Sized to end above the frame's bottom edge (the frame is 550 tall). */}
            <div style={{ display: "flex", flexDirection: "column", marginTop: 18, gap: 8, height: 236 }}>
              <Cell label="header" sub="layout" tone="layout" height={50} />
              <div style={{ display: "flex", gap: 8, flexGrow: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 330 }}>
                  <Cell label="sidebar" sub="layout" tone="layout" height={46} />
                  <Cell label="stats" sub="page" tone="page" height={46} />
                  <Cell label="filler" sub="layout" tone="layout" grow />
                </div>
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <Cell label="content" sub="page" tone="page" grow />
                </div>
              </div>
              <Cell label="footer" sub="layout" tone="layout" height={46} />
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
