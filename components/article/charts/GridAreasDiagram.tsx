import styles from "./Charts.module.css";

// A CSS grid drawn the way grid-template-areas reads: one string per row,
// one name per cell, and each name becomes one rectangle spanning its cells.
// Like the charts it renders a wide and a 320-wide (phone) layout; tones say
// who renders an area (the layout, a page), mark an empty one, or a new one.

export type GridTone = "layout" | "page" | "empty" | "new";
export type GridArea = { label: string; sub?: string; tone: GridTone };
type Props = {
  id: string;
  title: string;
  // Rows of area names, exactly as in grid-template-areas
  template: string[][];
  // Relative column widths, like fr units
  cols: number[];
  // Row heights in viewBox units
  rows: number[];
  areas: Record<string, GridArea>;
  // A key for the layout and page tones
  legend?: { layout: string; page: string };
};

const GAP = 4;
const MARGIN = 8;
const LEGEND_H = 24;
const TONE_CLASS: Record<GridTone, string> = { layout: styles.box, page: styles.boxAccent, empty: styles.zone, new: styles.cellHot };

function Grid({ id, title, template, cols, rows, areas, legend, W }: Props & { W: number }) {
  const top = MARGIN + (legend ? LEGEND_H : 0);
  const inner = W - MARGIN * 2 - GAP * (cols.length - 1);
  const unit = inner / cols.reduce((a, b) => a + b, 0);
  const colX = cols.map((_, i) => MARGIN + cols.slice(0, i).reduce((a, b) => a + b, 0) * unit + GAP * i);
  const rowY = rows.map((_, i) => top + rows.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i);
  const H = top + rows.reduce((a, b) => a + b, 0) + GAP * (rows.length - 1) + MARGIN;

  // Each area's bounding cells, in the order the names first appear
  const boxes: { name: string; x: number; y: number; w: number; h: number }[] = [];
  const seen = new Set<string>();
  template.forEach((row) => row.forEach((name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const cells = template.flatMap((r, ri) => r.map((n, ci) => (n === name ? [ri, ci] : null)).filter((c): c is number[] => c !== null));
    const r0 = Math.min(...cells.map(([r]) => r)), r1 = Math.max(...cells.map(([r]) => r));
    const c0 = Math.min(...cells.map(([, c]) => c)), c1 = Math.max(...cells.map(([, c]) => c));
    boxes.push({ name, x: colX[c0], y: rowY[r0], w: colX[c1] + cols[c1] * unit - colX[c0], h: rowY[r1] + rows[r1] - rowY[r0] });
  }));

  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{title}</title>
      {legend && (
        <g>
          {/* Wide chips rather than squares, so the key doesn't read as checkboxes */}
          <rect className={styles.box} x={MARGIN} y={MARGIN + 4} width={20} height={9} rx={2} />
          <text className={styles.tickText} x={MARGIN + 26} y={MARGIN + 12}>{legend.layout}</text>
          <rect className={styles.boxAccent} x={W / 2} y={MARGIN + 4} width={20} height={9} rx={2} />
          <text className={styles.tickText} x={W / 2 + 26} y={MARGIN + 12}>{legend.page}</text>
        </g>
      )}
      {boxes.map(({ name, x, y, w, h }) => {
        const area = areas[name];
        const cx = x + w / 2, cy = y + h / 2;
        const showSub = Boolean(area.sub) && h >= 34;
        return (
          <g key={name}>
            <rect className={TONE_CLASS[area.tone]} x={x} y={y} width={w} height={h} rx={5} />
            <text className={styles.boxText} x={cx} y={showSub ? cy - 2 : cy + 4} textAnchor="middle">{area.label}</text>
            {showSub && <text className={styles.boxSub} x={cx} y={cy + 13} textAnchor="middle">{area.sub}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function GridAreasDiagram(props: Props) {
  return (
    <>
      <div className={styles.wide}><Grid {...props} W={480} /></div>
      <div className={styles.compact}><Grid {...props} id={`${props.id}-sm`} W={320} /></div>
    </>
  );
}
