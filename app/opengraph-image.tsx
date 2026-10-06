import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/seo";

// The site-wide share image (1200x630): a "Title" window like the site's
// header over the site background, the floppy disk on the left and the site
// name on the right. lib/seo.ts lists it on every page's Open Graph metadata.

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [toshiba, floppy, background] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Toshiba-TXL1.woff")),
    // A 6x nearest-neighbor upscale of assets/floppy.png, so it stays crisp
    readFile(join(process.cwd(), "assets/floppy-384.png"), "base64"),
    readFile(join(process.cwd(), "public/main/bgdark.jpeg"), "base64"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Toshiba",
          backgroundColor: "#08101f",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse only renders plain <img> */}
        <img
          src={`data:image/jpeg;base64,${background}`}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />

        {/* The glass "Title" window */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: 40,
            flexGrow: 1,
            borderRadius: 16,
            overflow: "hidden",
            border: "2px solid rgba(130, 180, 255, 0.35)",
            background:
              "linear-gradient(160deg, rgba(15, 27, 52, 0.9), rgba(8, 15, 33, 0.82))",
            boxShadow: "0 22px 55px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 60,
              padding: "0 26px",
              background: "linear-gradient(to right, #2563eb 70%, #22d3ee 100%)",
              color: "#ffffff",
              fontSize: 30,
            }}
          >
            <span>m4cgyver.net</span>
            <span style={{ marginLeft: "auto", opacity: 0.8 }}>X</span>
          </div>

          <div
            style={{
              display: "flex",
              flexGrow: 1,
              alignItems: "center",
              padding: "0 56px",
              gap: 56,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse only renders plain <img> */}
            <img
              src={`data:image/png;base64,${floppy}`}
              alt=""
              width={384}
              height={384}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 96,
                lineHeight: 1.1,
                color: "rgb(173, 216, 230)",
                textShadow:
                  "rgb(0, 114, 198) -3px 3px 2px, rgb(0, 114, 198) 3px -3px 2px",
              }}
            >
              <span>M4cgyvers</span>
              <span>Repurposed</span>
              <span>Mining Rig</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Toshiba", data: toshiba, style: "normal", weight: 400 }],
    },
  );
}
