import type { SeriesKey } from "./series";
import styles from "./Charts.module.css";

export type LinePoint = { x: number; y: number; display: string };
export type LineSeries = { series: SeriesKey; label: string; points: LinePoint[]; end: string };

type Props = {
  id: string;
  title: string;
  series: LineSeries[];
  xMax: number;
  yMax: number;
  xTicks: { value: number; label: string }[];
  yTicks: number[];
  yFormat?: (value: number) => string;
  xLabel: string;
  xName?: (value: number) => string;
};

type Layout = { W: number; H: number; left: number; right: number; bottom: number; compact: boolean };
// Wide layout, and a narrower viewBox for small containers (see BarChart)
const WIDE: Layout = { W: 480, H: 270, left: 40, right: 104, bottom: 44, compact: false };
const COMPACT: Layout = { W: 320, H: 236, left: 34, right: 86, bottom: 42, compact: true };
const TOP = 10;
const LABEL_GAP = 13;

function Chart({ id, title, series, xMax, yMax, xTicks, yTicks, yFormat = String, xLabel, xName = String }: Props, layout: Layout) {
  const { W, H, left, right, bottom } = layout;
  const x = (v: number) => left + (v / xMax) * (W - left - right);
  const y = (v: number) => TOP + (1 - v / yMax) * (H - TOP - bottom);
  const plotRight = W - right;
  const shownXTicks = layout.compact && xTicks.length > 4 ? xTicks.filter((_, i) => i % 2 === 0) : xTicks;

  // End labels: start at each line's last point, then push apart so none overlap.
  // A label that had to move gets a leader line back to its line's end.
  const ends = series
    .map((s) => {
      const last = s.points[s.points.length - 1];
      return { s, px: x(last.x), py: y(last.y), ly: y(last.y) };
    })
    .sort((a, b) => a.py - b.py);
  for (let i = 1; i < ends.length; i++) {
    if (ends[i].ly - ends[i - 1].ly < LABEL_GAP) ends[i].ly = ends[i - 1].ly + LABEL_GAP;
  }
  const overflow = ends.length ? ends[ends.length - 1].ly - (H - bottom) : 0;
  if (overflow > 0) for (const e of ends) e.ly -= overflow;

  return (
    <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>{title}</title>
      {yTicks.map((tick) => (
        <g key={tick}>
          <line className={tick === 0 ? styles.axis : styles.grid} x1={left} x2={plotRight} y1={y(tick)} y2={y(tick)} />
          <text className={styles.tick} x={left - 6} y={y(tick)} dominantBaseline="central" textAnchor="end">
            {yFormat(tick)}
          </text>
        </g>
      ))}
      {shownXTicks.map((tick) => (
        <text key={tick.value} className={styles.tick} x={x(tick.value)} y={H - bottom + 16} textAnchor="middle">
          {tick.label}
        </text>
      ))}
      <text className={styles.axisLabel} x={(left + plotRight) / 2} y={H - 6} textAnchor="middle">
        {xLabel}
      </text>
      {series.map((s) => (
        <path key={s.series + s.label} className={styles.line} data-s={s.series}
          d={s.points.map((p, i) => `${i ? "L" : "M"}${x(p.x)},${y(p.y)}`).join("")} />
      ))}
      {series.map((s) =>
        s.points.map((p, i) => (
          <g key={`${s.series}-${i}`} className={styles.point}>
            <title>{`${s.label}, ${xName(p.x)}: ${p.display}`}</title>
            <circle className={styles.hit} cx={x(p.x)} cy={y(p.y)} r={12} />
            <circle className={styles.dot} data-s={s.series} cx={x(p.x)} cy={y(p.y)} r={4} />
          </g>
        )),
      )}
      {ends.map((e) => (
        <g key={`end-${e.s.series}-${e.s.label}`}>
          {Math.abs(e.ly - e.py) > 2 && (
            <line className={styles.leader} x1={e.px + 6} y1={e.py} x2={plotRight + 6} y2={e.ly} />
          )}
          <line className={styles.keyLine} data-s={e.s.series} x1={plotRight + 8} x2={plotRight + 16} y1={e.ly} y2={e.ly} />
          <text className={styles.endLabel} x={plotRight + 20} y={e.ly} dominantBaseline="central">
            {`${e.s.label} ${e.s.end}`}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function LineChart(props: Props) {
  return (
    <>
      <div className={styles.wide}>{Chart(props, WIDE)}</div>
      <div className={styles.compact}>{Chart({ ...props, id: `${props.id}-sm` }, COMPACT)}</div>
    </>
  );
}
