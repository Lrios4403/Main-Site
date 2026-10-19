import BoxDiagram, { type DiagramBox } from "@/components/article/charts/BoxDiagram";
import styles from "@/components/article/charts/Charts.module.css";

// The archive page's diagrams. Like the post charts, each draws a wide layout
// and a 320-wide one for phones. They show components only: no addresses,
// ports or hostnames.

/* ---------------------------------------------------------------- pipeline */

const PIPELINE_BOXES: DiagramBox[] = [
  { id: "wget", title: "wget --warc-file", sub: "crawls a site" },
  { id: "warc", title: "WARC files", sub: "~2,180 files, ~4.9 TB" },
  { id: "parser", title: "Bun parser", sub: "worker threads" },
  { id: "pg", title: "PostgreSQL 18", sub: "the index" },
  { id: "api", title: "Bun API", sub: "read-only" },
  { id: "nginx", title: "nginx", sub: "on the VPS" },
  { id: "next", title: "Next.js frontend", sub: "the archive's website" },
  { id: "browser", title: "Your browser", sub: "search and replay", accent: true },
];

export function PipelineDiagram() {
  return (
    <BoxDiagram
      id="diagram-pipeline"
      title="From crawl to browser: wget writes WARC files, the Bun parser indexes them into PostgreSQL, the Bun API reads byte ranges from the WARCs, and a WireGuard tunnel carries requests to nginx and the Next.js frontend on the VPS"
      boxes={PIPELINE_BOXES}
      wide={{
        W: 480, H: 354,
        zones: [
          { label: "Home network", x: 8, y: 8, w: 464, h: 164 },
          { label: "VPS", x: 8, y: 196, w: 464, h: 74 },
        ],
        place: {
          wget: { x: 20, y: 34, w: 136 }, warc: { x: 172, y: 34, w: 136 }, parser: { x: 324, y: 34, w: 136 },
          pg: { x: 324, y: 110, w: 136 }, api: { x: 172, y: 110, w: 136 },
          nginx: { x: 172, y: 214, w: 136 }, next: { x: 324, y: 214, w: 136 },
          browser: { x: 172, y: 300, w: 136 },
        },
        edges: [
          { d: "M156,57 H169" },
          { d: "M308,57 H321" },
          { d: "M392,80 V107" },
          { d: "M324,133 H311" },
          { d: "M240,110 V83", label: "reads bytes", lx: 246, ly: 100 },
          { d: "M240,159 V211", dashed: true, both: true, label: "WireGuard tunnel", lx: 248, ly: 188 },
          { d: "M308,237 H321" },
          { d: "M392,260 V323 H311" },
        ],
      }}
      compact={{
        W: 320, H: 594,
        zones: [
          { label: "Home network", x: 6, y: 6, w: 308, h: 346 },
          { label: "VPS", x: 6, y: 378, w: 308, h: 148 },
        ],
        place: {
          wget: { x: 40, y: 30, w: 240 }, warc: { x: 40, y: 96, w: 240, sub: "~2,180 files" },
          parser: { x: 40, y: 162, w: 240 }, pg: { x: 40, y: 228, w: 240 }, api: { x: 40, y: 294, w: 240 },
          nginx: { x: 40, y: 402, w: 240 }, next: { x: 40, y: 468, w: 240 }, browser: { x: 40, y: 540, w: 240 },
        },
        edges: [
          { d: "M160,76 V93" },
          { d: "M160,142 V159" },
          { d: "M160,208 V225" },
          { d: "M160,274 V291" },
          { d: "M40,317 H24 V119 H37", label: "reads bytes", lx: 19, ly: 218, anchor: "middle", vertical: true },
          { d: "M160,343 V399", dashed: true, both: true, label: "WireGuard tunnel", lx: 168, ly: 368 },
          { d: "M160,448 V465" },
          { d: "M160,514 V537" },
        ],
      }}
    />
  );
}

export const pipelineText = (
  <ol>
    <li>wget crawls a site and writes every request and response into WARC files.</li>
    <li>The Bun parser reads the WARC files in worker threads and writes one row per response to PostgreSQL 18.</li>
    <li>PostgreSQL is the index: for each response, which file it is in and where.</li>
    <li>The Bun API looks captures up in PostgreSQL and reads exactly those byte ranges from the WARC files.</li>
    <li>A WireGuard tunnel carries requests between the home machine and the VPS.</li>
    <li>On the VPS, nginx routes them; the Next.js frontend is the archive&apos;s website.</li>
    <li>Your browser searches and replays captures. The offline viewer runs the same parser in your browser, on your own files.</li>
  </ol>
);

/* ----------------------------------------------------------------- network */

const NETWORK_BOXES: DiagramBox[] = [
  { id: "parser", title: "Bun parser", sub: "outside the tunnel" },
  { id: "pg", title: "PostgreSQL 18", sub: "the index" },
  { id: "api", title: "Bun API", sub: "uses the client's network", accent: true },
  { id: "wg", title: "WireGuard", sub: "the other end" },
  { id: "nginx", title: "nginx", sub: "the front door" },
  { id: "next", title: "Next.js frontend", sub: "the archive's website" },
];

export function NetworkDiagram() {
  return (
    <BoxDiagram
      id="diagram-network"
      title="Network: on the home machine the Bun API runs inside the WireGuard client container's network, next to PostgreSQL and the parser; on the VPS nginx sends archive API requests through the WireGuard tunnel to the API and everything else to the Next.js frontend"
      boxes={NETWORK_BOXES}
      wide={{
        W: 480, H: 296,
        zones: [
          { label: "Home machine (Docker)", x: 8, y: 8, w: 212, h: 280 },
          { label: "WireGuard client", x: 20, y: 162, w: 188, h: 114, labelAt: "bottom" },
          { label: "VPS", x: 260, y: 8, w: 212, h: 280 },
        ],
        place: {
          parser: { x: 20, y: 34, w: 188 }, pg: { x: 20, y: 98, w: 188 }, api: { x: 32, y: 184, w: 164 },
          wg: { x: 272, y: 34, w: 188 }, nginx: { x: 272, y: 118, w: 188 }, next: { x: 272, y: 212, w: 188 },
        },
        edges: [
          { d: "M114,80 V95" },
          { d: "M114,184 V147" },
          { d: "M366,118 V83", label: "archive API", lx: 372, ly: 104 },
          { d: "M366,164 V209", label: "everything else", lx: 372, ly: 190 },
          { d: "M272,57 H240 V207 H199", dashed: true, both: true, label: "WireGuard tunnel", lx: 233, ly: 132, anchor: "middle", vertical: true },
        ],
      }}
      compact={{
        W: 320, H: 544,
        zones: [
          { label: "Home machine (Docker)", x: 6, y: 6, w: 308, h: 266 },
          { label: "WireGuard client", x: 28, y: 156, w: 264, h: 102, labelAt: "bottom" },
          { label: "VPS", x: 6, y: 300, w: 308, h: 236 },
        ],
        place: {
          parser: { x: 40, y: 30, w: 240 }, pg: { x: 40, y: 94, w: 240 }, api: { x: 52, y: 172, w: 216 },
          wg: { x: 40, y: 326, w: 240 }, nginx: { x: 40, y: 402, w: 240 }, next: { x: 40, y: 478, w: 240 },
        },
        edges: [
          { d: "M160,76 V91" },
          { d: "M160,172 V143" },
          { d: "M160,218 V323", dashed: true, both: true, label: "WireGuard tunnel", lx: 168, ly: 290 },
          { d: "M160,402 V375", label: "archive API", lx: 168, ly: 392 },
          { d: "M160,448 V475", label: "everything else", lx: 168, ly: 466 },
        ],
      }}
    />
  );
}

export const networkText = (
  <ul>
    <li>Home machine, in Docker: PostgreSQL 18, the Bun parser and a WireGuard client container.</li>
    <li>The Bun API has no network of its own: it runs inside the WireGuard client container&apos;s network, so the tunnel is simply there. It still reaches PostgreSQL over the normal Docker network.</li>
    <li>The parser doesn&apos;t need the tunnel and stays outside it.</li>
    <li>On the VPS, nginx sends archive API requests through the tunnel to the Bun API, and everything else to the Next.js frontend.</li>
    <li>The Next.js frontend&apos;s server code also calls the Bun API through the tunnel, at an internal address browsers can&apos;t reach.</li>
  </ul>
);

/* -------------------------------------------------------- index, not a copy */

type Cell = { x: number; y: number; w: number; key: string; value: string; hot?: boolean };

function Row({ cells, h }: { cells: Cell[]; h: number }) {
  return (
    <>
      {cells.map((cell) => (
        <g key={cell.key}>
          <rect className={cell.hot ? styles.cellHot : styles.cell} x={cell.x} y={cell.y} width={cell.w} height={h} />
          <text className={styles.tickText} x={cell.x + cell.w / 2} y={cell.y + 14} textAnchor="middle">{cell.key}</text>
          <text className={styles.boxSub} x={cell.x + cell.w / 2} y={cell.y + 29} textAnchor="middle">{cell.value}</text>
        </g>
      ))}
    </>
  );
}

type Part = { x0: number; x1: number; kind: "head" | "body" | "hot"; label?: string };

function Strip({ y, h, parts }: { y: number; h: number; parts: Part[] }) {
  const cls = { head: styles.stripHead, body: styles.strip, hot: styles.stripHot };
  return (
    <>
      {parts.map((part, i) => (
        <g key={i}>
          <rect className={cls[part.kind]} x={part.x0} y={y} width={part.x1 - part.x0} height={h} />
          {part.label && (
            <text className={styles.stripText} x={(part.x0 + part.x1) / 2} y={y + h / 2 + 4} textAnchor="middle">{part.label}</text>
          )}
        </g>
      ))}
    </>
  );
}

function IndexSvg({ id, compact }: { id: string; compact: boolean }) {
  const marker = `${id}-arrow`;
  const title = "An index, not a copy: a PostgreSQL row holds the WARC file, URL and capture date plus a byte offset and length, which point at the response body inside one record of the WARC file";
  const defs = (
    <defs>
      <marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path className={styles.arrowHead} d="M0,0 L8,4 L0,8 Z" />
      </marker>
    </defs>
  );
  if (!compact) {
    return (
      <svg className={styles.svg} viewBox="0 0 480 190" role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>{title}</title>
        {defs}
        <text className={styles.zoneLabel} x={20} y={18}>One row in PostgreSQL</text>
        <Row h={40} cells={[
          { x: 20, y: 26, w: 70, key: "file", value: "#1204" },
          { x: 90, y: 26, w: 130, key: "url", value: "example.com/" },
          { x: 220, y: 26, w: 90, key: "captured", value: "2009-06-14" },
          { x: 310, y: 26, w: 80, key: "offset", value: "81,920", hot: true },
          { x: 390, y: 26, w: 70, key: "length", value: "1,270", hot: true },
        ]} />
        <text className={styles.zoneLabel} x={20} y={116}>The WARC file on disk</text>
        <Strip y={124} h={34} parts={[
          { x0: 20, x1: 44, kind: "head" }, { x0: 44, x1: 110, kind: "body" },
          { x0: 110, x1: 134, kind: "head" }, { x0: 134, x1: 186, kind: "body" },
          { x0: 186, x1: 226, kind: "head", label: "WARC" }, { x0: 226, x1: 266, kind: "head", label: "HTTP" },
          { x0: 266, x1: 384, kind: "hot", label: "body" },
          { x0: 384, x1: 408, kind: "head" }, { x0: 408, x1: 460, kind: "body" },
        ]} />
        <path className={styles.pointer} d="M350,66 V100 H266 V121" markerEnd={`url(#${marker})`} />
        <path className={styles.pointer} d="M425,66 V90 H384 V121" markerEnd={`url(#${marker})`} />
        <text className={styles.tickText} x={226} y={176} textAnchor="middle">headers: read while indexing</text>
        <text className={styles.tickText} x={384} y={176} textAnchor="middle">body: read when you open it</text>
      </svg>
    );
  }
  return (
    <svg className={styles.svg} viewBox="0 0 320 242" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{title}</title>
      {defs}
      <text className={styles.zoneLabel} x={20} y={18}>One row in PostgreSQL</text>
      <Row h={36} cells={[
        { x: 20, y: 26, w: 90, key: "file", value: "#1204" },
        { x: 110, y: 26, w: 190, key: "url", value: "example.com/" },
        { x: 20, y: 62, w: 100, key: "captured", value: "2009-06-14" },
        { x: 120, y: 62, w: 90, key: "offset", value: "81,920", hot: true },
        { x: 210, y: 62, w: 90, key: "length", value: "1,270", hot: true },
      ]} />
      <Strip y={142} h={34} parts={[
        { x0: 20, x1: 34, kind: "head" }, { x0: 34, x1: 72, kind: "body" },
        { x0: 72, x1: 112, kind: "head", label: "WARC" }, { x0: 112, x1: 152, kind: "head", label: "HTTP" },
        { x0: 152, x1: 256, kind: "hot", label: "body" },
        { x0: 256, x1: 272, kind: "head" }, { x0: 272, x1: 300, kind: "body" },
      ]} />
      <path className={styles.pointer} d="M165,98 V118 H152 V139" markerEnd={`url(#${marker})`} />
      <path className={styles.pointer} d="M256,98 V139" markerEnd={`url(#${marker})`} />
      <text className={styles.zoneLabel} x={20} y={194}>The WARC file on disk</text>
      <text className={styles.tickText} x={20} y={212}>headers: read while indexing</text>
      <text className={styles.tickText} x={20} y={230}>body: read when you open the capture</text>
    </svg>
  );
}

export function IndexDiagram() {
  return (
    <>
      <div className={styles.wide}><IndexSvg id="diagram-index" compact={false} /></div>
      <div className={styles.compact}><IndexSvg id="diagram-index-sm" compact /></div>
    </>
  );
}

export const indexText = (
  <ul>
    <li>A row in PostgreSQL holds the WARC file, the URL, the capture date, the status and headers, and two numbers: the byte offset and the byte length of the response body inside that file.</li>
    <li>In the WARC file, each record is WARC headers, then HTTP headers, then the body.</li>
    <li>Indexing reads the headers. The body is read only when someone opens the capture, using the offset and length.</li>
  </ul>
);

/* ------------------------------------------------- offline viewer segments */

type Seg = { x0: number; x1: number; label: string; tone: "plain" | "done" | "hot" };

function Bar({ y, h, segs }: { y: number; h: number; segs: Seg[] }) {
  const cls = { plain: styles.strip, done: styles.stripHead, hot: styles.stripHot };
  return (
    <>
      {segs.map((seg, i) => (
        <g key={i}>
          <rect className={cls[seg.tone]} x={seg.x0} y={y} width={seg.x1 - seg.x0} height={h} />
          {seg.label && (
            <text className={styles.stripText} x={(seg.x0 + seg.x1) / 2} y={y + h / 2 + 4} textAnchor="middle">{seg.label}</text>
          )}
        </g>
      ))}
    </>
  );
}

function SegmentsSvg({ id, compact }: { id: string; compact: boolean }) {
  const marker = `${id}-arrow`;
  const title = "Offline parsing: a large WARC file is split into one segment per worker, a record belongs to the segment it starts in, and a worker that runs out of work takes half of the busiest worker's remaining range, which stops at the first record past the cut";
  const defs = (
    <defs>
      <marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path className={styles.arrowHead} d="M0,0 L8,4 L0,8 Z" />
      </marker>
    </defs>
  );
  if (!compact) {
    return (
      <svg className={styles.svg} viewBox="0 0 480 236" role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>{title}</title>
        {defs}
        <text className={styles.zoneLabel} x={20} y={18}>1. Split: one segment of 64 MB or more per worker (W1 to W4)</text>
        <Bar y={26} h={34} segs={[
          { x0: 20, x1: 130, label: "W1", tone: "plain" }, { x0: 130, x1: 240, label: "W2", tone: "plain" },
          { x0: 240, x1: 350, label: "W3", tone: "plain" }, { x0: 350, x1: 460, label: "W4", tone: "plain" },
        ]} />
        <rect className={styles.cellHot} x={108} y={66} width={44} height={10} />
        <text className={styles.tickText} x={160} y={75}>a record that starts in W1&apos;s segment belongs to W1</text>
        <text className={styles.zoneLabel} x={20} y={110}>2. Steal: an idle worker takes half of what the busiest has left</text>
        <Bar y={118} h={34} segs={[
          { x0: 20, x1: 130, label: "done", tone: "done" }, { x0: 130, x1: 240, label: "done", tone: "done" },
          { x0: 240, x1: 270, label: "", tone: "done" }, { x0: 270, x1: 310, label: "W3", tone: "plain" },
          { x0: 310, x1: 350, label: "W2", tone: "hot" }, { x0: 350, x1: 460, label: "W4", tone: "plain" },
        ]} />
        <path className={styles.edge} d="M185,152 V170 H330 V155" markerEnd={`url(#${marker})`} />
        <text className={styles.tickText} x={258} y={184} textAnchor="middle">W2, done with its own segment, takes half of W3&apos;s remaining range</text>
        <text className={styles.tickText} x={20} y={208}>W3 stops at the first record past the cut and reports exactly where,</text>
        <text className={styles.tickText} x={20} y={224}>so nothing is skipped or parsed twice.</text>
      </svg>
    );
  }
  return (
    <svg className={styles.svg} viewBox="0 0 320 250" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{title}</title>
      {defs}
      <text className={styles.zoneLabel} x={20} y={18}>1. Split: one segment per worker</text>
      <Bar y={26} h={34} segs={[
        { x0: 20, x1: 90, label: "W1", tone: "plain" }, { x0: 90, x1: 160, label: "W2", tone: "plain" },
        { x0: 160, x1: 230, label: "W3", tone: "plain" }, { x0: 230, x1: 300, label: "W4", tone: "plain" },
      ]} />
      <rect className={styles.cellHot} x={76} y={66} width={30} height={10} />
      <text className={styles.tickText} x={112} y={75}>starts in W1, so W1 parses it</text>
      <text className={styles.zoneLabel} x={20} y={110}>2. Steal: idle W2 takes half of W3&apos;s rest</text>
      <Bar y={118} h={34} segs={[
        { x0: 20, x1: 90, label: "done", tone: "done" }, { x0: 90, x1: 160, label: "done", tone: "done" },
        { x0: 160, x1: 180, label: "", tone: "done" }, { x0: 180, x1: 205, label: "W3", tone: "plain" },
        { x0: 205, x1: 230, label: "W2", tone: "hot" }, { x0: 230, x1: 300, label: "W4", tone: "plain" },
      ]} />
      <path className={styles.edge} d="M125,152 V170 H217 V155" markerEnd={`url(#${marker})`} />
      <text className={styles.tickText} x={20} y={196}>W3 stops at the first record past the cut</text>
      <text className={styles.tickText} x={20} y={212}>and reports where, so nothing is skipped</text>
      <text className={styles.tickText} x={20} y={228}>or read twice.</text>
    </svg>
  );
}

export function SegmentsDiagram() {
  return (
    <>
      <div className={styles.wide}><SegmentsSvg id="diagram-segments" compact={false} /></div>
      <div className={styles.compact}><SegmentsSvg id="diagram-segments-sm" compact /></div>
    </>
  );
}

export const segmentsText = (
  <ol>
    <li>A plain WARC file of 128 MB or more is split into segments of at least 64 MB, one per worker.</li>
    <li>A record belongs to the segment it starts in, even if it runs into the next one, so neighbouring workers never coordinate.</li>
    <li>When a worker runs out of work, it takes half of the busiest worker&apos;s remaining range.</li>
    <li>The busy worker stops at the first record past the cut and reports exactly where, so nothing is skipped or parsed twice.</li>
  </ol>
);
