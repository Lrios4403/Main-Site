import styles from "./Charts.module.css";

// A box-and-arrow diagram drawn as inline SVG: labelled boxes, optional
// dashed zones around groups of them, and arrows between them. Coordinates
// are explicit, in viewBox units, one set per layout: a wide one and a
// compact one for phones (a 320-wide viewBox keeps text at ~11-12px), picked
// by the container query in Charts.module.css, like the charts.

export type DiagramBox = { id: string; title: string; sub?: string; accent?: boolean };
type Place = { x: number; y: number; w: number; h?: number; sub?: string };
type Zone = { label: string; x: number; y: number; w: number; h: number; labelAt?: "top" | "bottom" };
type Edge = {
  d: string;
  label?: string;
  lx?: number;
  ly?: number;
  anchor?: "start" | "middle" | "end";
  // Draw the label along a vertical line, reading bottom to top
  vertical?: boolean;
  dashed?: boolean;
  // Arrowheads at both ends (the line itself has no direction)
  both?: boolean;
};
export type DiagramLayout = { W: number; H: number; place: Record<string, Place>; zones?: Zone[]; edges: Edge[] };

const BOX_H = 46;

function Diagram({ id, title, boxes, layout }: { id: string; title: string; boxes: DiagramBox[]; layout: DiagramLayout }) {
  const marker = `${id}-arrow`;
  const markerStart = `${id}-arrow-start`;
  return (
    <svg className={styles.svg} viewBox={`0 0 ${layout.W} ${layout.H}`} role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path className={styles.arrowHead} d="M0,0 L8,4 L0,8 Z" />
        </marker>
        <marker id={markerStart} viewBox="0 0 8 8" refX="1" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path className={styles.arrowHead} d="M8,0 L0,4 L8,8 Z" />
        </marker>
      </defs>
      {layout.zones?.map((zone) => (
        <g key={zone.label}>
          <rect className={styles.zone} x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx={8} />
          <text className={styles.zoneLabel} x={zone.x + 10} y={zone.labelAt === "bottom" ? zone.y + zone.h - 8 : zone.y + 16}>
            {zone.label}
          </text>
        </g>
      ))}
      {layout.edges.map((edge, i) => (
        <g key={i}>
          <path className={edge.dashed ? `${styles.edge} ${styles.edgeDashed}` : styles.edge} d={edge.d}
            markerEnd={`url(#${marker})`} markerStart={edge.both ? `url(#${markerStart})` : undefined} />
          {edge.label && (
            <text className={styles.edgeText} x={edge.lx} y={edge.ly} textAnchor={edge.anchor ?? "start"}
              transform={edge.vertical ? `rotate(-90 ${edge.lx} ${edge.ly})` : undefined}>
              {edge.label}
            </text>
          )}
        </g>
      ))}
      {boxes.map((box) => {
        const place = layout.place[box.id];
        if (!place) return null;
        const h = place.h ?? BOX_H;
        const sub = place.sub ?? box.sub;
        const cx = place.x + place.w / 2;
        return (
          <g key={box.id}>
            <rect className={box.accent ? styles.boxAccent : styles.box} x={place.x} y={place.y} width={place.w} height={h} rx={6} />
            <text className={styles.boxText} x={cx} y={sub ? place.y + 19 : place.y + h / 2 + 4} textAnchor="middle">
              {box.title}
            </text>
            {sub && (
              <text className={styles.boxSub} x={cx} y={place.y + 35} textAnchor="middle">
                {sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function BoxDiagram({ id, title, boxes, wide, compact }: { id: string; title: string; boxes: DiagramBox[]; wide: DiagramLayout; compact: DiagramLayout }) {
  return (
    <>
      <div className={styles.wide}><Diagram id={id} title={title} boxes={boxes} layout={wide} /></div>
      <div className={styles.compact}><Diagram id={`${id}-sm`} title={title} boxes={boxes} layout={compact} /></div>
    </>
  );
}
