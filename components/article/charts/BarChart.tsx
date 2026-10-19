import type { SeriesKey } from "./series";
import styles from "./Charts.module.css";

export type Segment = { series: SeriesKey; value: number; display: string };
export type Bar = {
  label: string;
  series: SeriesKey;
  value: number;
  display: string;
  // Shorter value text for the compact (phone) layout
  short?: string;
  // Stacked bars: segments drawn end to end with a 2px surface gap
  segments?: Segment[];
};
export type BarGroup = { label?: string; bars: Bar[] };

type Props = {
  id: string;
  title: string;
  groups: BarGroup[];
  max: number;
  min?: number;
  ticks: number[];
  tickFormat?: (value: number) => string;
  reference?: { value: number; label: string };
  labelWidth?: number;
  compactLabelWidth?: number;
};

type Layout = { width: number; valueWidth: number; compact: boolean };
// Two layouts of the same chart: a wide one, and a narrower viewBox for small
// containers so text stays ~11–12px on a phone instead of shrinking to 7px.
// CSS (a container query on the figure) shows one of them.
const WIDE: Layout = { width: 480, valueWidth: 82, compact: false };
const COMPACT: Layout = { width: 320, valueWidth: 72, compact: true };

const BAR = 13;
const PITCH = 21;
const GROUP_HEAD = 18;
const GROUP_GAP = 10;
const AXIS_BAND = 22;
const GAP = 2;
const RADIUS = 4;

// A bar from the baseline (xa) to its data end (xb): rounded at the data end only
function barPath(xa: number, xb: number, y: number, h: number, rounded: boolean) {
  const dir = xb >= xa ? 1 : -1;
  const r = rounded ? Math.min(RADIUS, Math.abs(xb - xa), h / 2) : 0;
  if (r <= 0) return `M${xa},${y}H${xb}V${y + h}H${xa}Z`;
  const inner = xb - dir * r;
  return `M${xa},${y}H${inner}Q${xb},${y} ${xb},${y + r}V${y + h - r}Q${xb},${y + h} ${inner},${y + h}H${xa}Z`;
}

function Chart({ id, title, groups, max, min = 0, ticks, tickFormat = String, reference, labelWidth: wideLabel = 92, compactLabelWidth }: Props, layout: Layout) {
  const W = layout.width;
  const labelWidth = layout.compact ? compactLabelWidth ?? Math.round(wideLabel * 0.85) : wideLabel;
  const x0 = labelWidth + 8;
  const x1 = W - layout.valueWidth;
  const x = (v: number) => x0 + ((v - min) / (max - min)) * (x1 - x0);
  const zero = x(Math.min(Math.max(0, min), max));
  const top = reference ? 18 : 4;
  const shownTicks = layout.compact && ticks.length > 4 ? ticks.filter((_, i) => i % 2 === 0) : ticks;

  // Lay out group headings and rows top to bottom. Vertical lines (grid, zero
  // axis, reference) are drawn per span of rows and break at each group heading,
  // so they never run through the heading text.
  let y = top;
  const heads: { y: number; text: string }[] = [];
  const rows: (Bar & { y: number })[] = [];
  const spans: { y1: number; y2: number }[] = [];
  groups.forEach((group, index) => {
    if (index > 0) y += GROUP_GAP;
    if (group.label) {
      heads.push({ y: y + 11, text: group.label });
      y += GROUP_HEAD;
    }
    if (group.label || spans.length === 0) spans.push({ y1: group.label ? y - 4 : top - 4, y2: 0 });
    for (const bar of group.bars) {
      rows.push({ ...bar, y });
      y += PITCH;
    }
    spans[spans.length - 1].y2 = y - (PITCH - BAR) + 4;
  });
  const plotBottom = y - (PITCH - BAR) + 4;
  const height = plotBottom + AXIS_BAND;
  const vertical = (className: string, at: number, key: string, firstY1?: number) =>
    spans.map((span, i) => (
      <line key={`${key}-${i}`} className={className} x1={at} x2={at} y1={i === 0 && firstY1 !== undefined ? firstY1 : span.y1} y2={span.y2} />
    ));

  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${height}`} role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{title}</title>
      {shownTicks.map((tick) => (
        <g key={tick}>
          {vertical(styles.grid, x(tick), "grid")}
          <text className={styles.tick} x={x(tick)} y={height - 6} textAnchor="middle">
            {tickFormat(tick)}
          </text>
        </g>
      ))}
      {vertical(styles.axis, zero, "axis")}
      {reference && (
        <g>
          {vertical(styles.ref, x(reference.value), "ref", 6)}
          <text className={styles.refLabel} x={x(reference.value) - 4} y={11} textAnchor="end">
            {reference.label}
          </text>
        </g>
      )}
      {heads.map((head) => (
        <text key={head.text + head.y} className={styles.group} x={0} y={head.y}>
          {head.text}
        </text>
      ))}
      {rows.map((row, index) => {
        const cy = row.y + BAR / 2;
        let marks;
        let end: number;
        if (row.segments) {
          // Stacked: each segment after the first starts a 2px surface gap later
          let cursor = 0;
          marks = row.segments.map((segment, i) => {
            const xa = x(cursor) + (i > 0 ? GAP : 0);
            cursor += segment.value;
            const xb = Math.max(x(cursor), xa + 1);
            return (
              <path key={i} className={styles.bar} data-s={segment.series}
                d={barPath(xa, xb, row.y, BAR, i === row.segments!.length - 1)} />
            );
          });
          end = x(cursor);
        } else {
          // Tiny values still get a visible sliver
          const raw = x(row.value);
          end = row.value === 0 ? zero : row.value > 0 ? Math.max(raw, zero + 2) : Math.min(raw, zero - 2);
          marks = <path className={styles.bar} data-s={row.series} d={barPath(zero, end, row.y, BAR, true)} />;
        }
        // Values sit at the bar tip; for negative bars, beside the zero line so they
        // never collide with the row labels on the left
        const valueX = row.value < 0 && !row.segments ? zero + 5 : end + 5;
        return (
          <g key={index} className={styles.row}>
            <title>{`${row.label}: ${row.display}`}</title>
            <rect className={styles.hit} x={0} y={row.y - (PITCH - BAR) / 2} width={W} height={PITCH} />
            {marks}
            <text className={styles.label} x={labelWidth} y={cy} dominantBaseline="central" textAnchor="end">
              {row.label}
            </text>
            <text className={styles.value} x={valueX} y={cy} dominantBaseline="central">
              {layout.compact ? row.short ?? row.display : row.display}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function BarChart(props: Props) {
  return (
    <>
      <div className={styles.wide}>{Chart(props, WIDE)}</div>
      <div className={styles.compact}>{Chart({ ...props, id: `${props.id}-sm` }, COMPACT)}</div>
    </>
  );
}
