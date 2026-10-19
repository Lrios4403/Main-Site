import styles from "./Charts.module.css";

// The local setup as a diagram: two clients, one model server, the NPU.
// Like the charts it has a wide and a compact (phone) layout in viewBox units.
type Layout = { W: number; boxW: number; margin: number; compact: boolean };
const WIDE: Layout = { W: 480, boxW: 196, margin: 18, compact: false };
const COMPACT: Layout = { W: 320, boxW: 148, margin: 8, compact: true };
const H = 372;
const BOX_H = 46;

type BoxSpec = { col: "left" | "right" | "wide"; y: number; title: string; sub: string; short: string; accent?: boolean };
const SPECS: BoxSpec[] = [
  { col: "left", y: 8, title: "OpenWork", sub: "OpenAI-compatible provider", short: "OpenAI provider" },
  { col: "right", y: 8, title: "Claude Code", sub: "launched with ccr code", short: "via ccr code" },
  { col: "right", y: 100, title: "Claude Code Router", sub: "127.0.0.1:3456", short: "127.0.0.1:3456" },
  { col: "wide", y: 192, title: "OpenVINO Model Server (OVMS)", sub: "127.0.0.1:8000 · /v1 or /v3 chat completions · prefix caching", short: "127.0.0.1:8000 · /v1 or /v3" },
  { col: "wide", y: 254, title: "OpenVINO 2026.4 · NPU plugin", sub: "Qwen3-8B-int4-cw-ov · PYRAMID prefill · .ovcache", short: "Qwen3-8B-int4-cw-ov · PYRAMID" },
  { col: "wide", y: 316, title: "Intel AI Boost NPU", sub: "~10 tokens/s · CPU stays at idle load", short: "~10 tokens/s · CPU stays idle", accent: true },
];

function Diagram({ id }: { id: string }, layout: Layout) {
  const { W, boxW, margin } = layout;
  const boxes = SPECS.map((spec) => {
    const x = spec.col === "left" ? margin : spec.col === "right" ? W - margin - boxW : margin;
    const w = spec.col === "wide" ? W - margin * 2 : boxW;
    return { ...spec, x, w, cx: x + w / 2 };
  });
  const [openwork, claude, router, ovms, openvino, npu] = boxes;
  const marker = `${id}-arrow`;
  const edges = [
    { d: `M${openwork.cx},${openwork.y + BOX_H} V${ovms.y - 3}`, label: "OpenAI API", lx: openwork.cx + 8, ly: 140 },
    { d: `M${claude.cx},${claude.y + BOX_H} V${router.y - 3}`, label: "Anthropic Messages API", lx: claude.cx - 8, ly: 80, anchor: "end" as const },
    { d: `M${router.cx},${router.y + BOX_H} V${ovms.y - 3}`, label: "OpenAI API", lx: router.cx - 8, ly: 170, anchor: "end" as const },
    { d: `M${ovms.cx},${ovms.y + BOX_H} V${openvino.y - 3}` },
    { d: `M${openvino.cx},${openvino.y + BOX_H} V${npu.y - 3}` },
  ];
  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>
        Setup: OpenWork talks to OVMS directly; Claude Code goes through Claude Code Router; OVMS runs Qwen3 8B through
        OpenVINO on the Intel AI Boost NPU
      </title>
      <defs>
        <marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path className={styles.arrowHead} d="M0,0 L8,4 L0,8 Z" />
        </marker>
      </defs>
      {edges.map((edge, i) => (
        <g key={i}>
          <path className={styles.edge} d={edge.d} markerEnd={`url(#${marker})`} />
          {edge.label && (
            <text className={styles.edgeText} x={edge.lx} y={edge.ly} textAnchor={edge.anchor ?? "start"}>
              {edge.label}
            </text>
          )}
        </g>
      ))}
      {boxes.map((box) => (
        <g key={box.title}>
          <rect className={box.accent ? styles.boxAccent : styles.box} x={box.x} y={box.y} width={box.w} height={BOX_H} rx={6} />
          <text className={styles.boxText} x={box.cx} y={box.y + 19} textAnchor="middle">
            {box.title}
          </text>
          <text className={styles.boxSub} x={box.cx} y={box.y + 35} textAnchor="middle">
            {layout.compact ? box.short : box.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function SetupDiagram({ id }: { id: string }) {
  return (
    <>
      <div className={styles.wide}>{Diagram({ id }, WIDE)}</div>
      <div className={styles.compact}>{Diagram({ id: `${id}-sm` }, COMPACT)}</div>
    </>
  );
}
